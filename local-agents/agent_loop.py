"""The tool-calling loop against llama-server's OpenAI-compatible endpoint.

Single model, single always-loaded llama-server process — roles are just
different system prompts sent to the same running model. This harness never
requests a model reload/swap; see GUIDE.md "Why one model, never swapped."
"""
import json
import time

import httpx

import server_auth
from tools import Tools, TOOL_SCHEMAS, ReadBeforeWriteError


class TaskAborted(Exception):
    def __init__(self, reason):
        self.reason = reason


class TaskDone(Exception):
    def __init__(self, summary):
        self.summary = summary


def _approx_tokens(messages):
    # No network round-trip on purpose — this runs before every single request in the
    # loop, so it has to be free. len//4 is a rough-but-fine English/code heuristic;
    # being exact doesn't matter, only catching runaway growth before it's sent does.
    return sum(len(str(m.get("content", ""))) for m in messages) // 4


def _prune_old_tool_output(messages, budget_tokens):
    """/chat/completions is stateless — every iteration of the loop below resends
    the FULL messages list, including every prior tool result. Left unbounded, a
    role that needs many tool calls sends a monotonically larger prompt on every
    single round trip: call 1 might prefill 20k tokens, call 10 prefills 60k+,
    each one slower than the last on hardware that's already slow at 20k. That
    compounding — not any single oversized request — is what actually produced
    the 1-hour-plus hang this guards against (see GUIDE.md "Bounding tool-loop
    growth"). messages[0] (system) and messages[1] (first user turn) are never
    touched; among the rest, the OLDEST tool-role messages are collapsed first
    since recent tool output matters most for the model's next decision."""
    if _approx_tokens(messages) <= budget_tokens:
        return
    for m in messages[2:]:
        if _approx_tokens(messages) <= budget_tokens:
            return
        if m.get("role") == "tool" and not str(m.get("content", "")).startswith("[pruned:"):
            m["content"] = "[pruned: earlier tool output dropped to stay in context budget]"


def run_task(cfg, base_url, model_alias, system_prompt, user_task, workspace_path, thinking=True, max_calls=None):
    tools = Tools(workspace_path)
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_task},
    ]
    max_calls = max_calls if max_calls is not None else cfg["limits"]["max_tool_calls_per_task"]
    deadline = time.time() + cfg["limits"]["max_wall_clock_s"]
    # Real ceiling, not aspirational: context_window - reserve_output, both from
    # config.toml [budget]. Every request in this loop is pruned back under this
    # before it's sent, so no single role invocation can spiral into the kind of
    # ever-growing prompt that caused a request to outlast even request_timeout_s.
    context_budget = cfg["budget"]["context_window"] - cfg["budget"]["reserve_output"]
    transcript = []
    headers = server_auth.headers(cfg)
    started = time.time()
    usage_totals = {"prompt_tokens": 0, "completion_tokens": 0, "requests": 0}

    body_extra = {} if thinking else {"chat_template_kwargs": {"enable_thinking": False}}

    for i in range(max_calls):
        if time.time() > deadline:
            return _finish("TIMEOUT", transcript, started, usage_totals)

        _prune_old_tool_output(messages, context_budget)

        try:
            resp = httpx.post(
                f"{base_url}/chat/completions",
                json={
                    "model": model_alias,
                    "messages": messages,
                    "tools": TOOL_SCHEMAS,
                    "temperature": 0.2,
                    **body_extra,
                },
                headers=headers,
                timeout=cfg["server"]["request_timeout_s"],
            )
            resp.raise_for_status()
            payload = resp.json()
        except httpx.HTTPError as e:
            # Network/timeout/5xx against the model server — a real, expected failure
            # mode on hardware this constrained, not a bug. Fail this role loudly but
            # gracefully: return a result run.py can still log and report on, rather
            # than an uncaught traceback that loses the workspace lease with zero
            # record of what happened (see GUIDE.md "Bounding tool-loop growth").
            return _finish("SERVER_ERROR", transcript, started, usage_totals, error=f"{type(e).__name__}: {e}")

        choice = payload["choices"][0]["message"]
        # /chat/completions "usage" is llama.cpp's own per-call accounting — cheaper and more
        # accurate than a separate /tokenize round-trip, and it's what actually tells us where
        # wall-clock is going (see GUIDE.md "Reading the token/timing log").
        usage = payload.get("usage") or {}
        usage_totals["prompt_tokens"] += usage.get("prompt_tokens", 0)
        usage_totals["completion_tokens"] += usage.get("completion_tokens", 0)
        usage_totals["requests"] += 1
        messages.append(choice)
        transcript.append(choice)

        calls = choice.get("tool_calls") or []
        if not calls:
            # model spoke without calling a tool — nudge once, then stop
            messages.append({"role": "user", "content": "Call a tool, or call done()/abort() to end the task."})
            continue

        for call in calls:
            name = call["function"]["name"]
            try:
                args = json.loads(call["function"]["arguments"] or "{}")
            except json.JSONDecodeError:
                args = {}

            if name == "done":
                return _finish("DONE", transcript, started, usage_totals, summary=args.get("summary", ""))
            if name == "abort":
                return _finish("ABORTED", transcript, started, usage_totals, reason=args.get("reason", ""))

            try:
                result = getattr(tools, name)(**args)
                content = str(result)
            except ReadBeforeWriteError as e:
                content = f"ERROR: {e}"
            except Exception as e:  # tool failures go back to the model, not raised to the caller
                content = f"ERROR: {type(e).__name__}: {e}"

            messages.append({
                "role": "tool", "tool_call_id": call["id"], "content": content[:8000],
            })

    return _finish("MAX_CALLS_EXCEEDED", transcript, started, usage_totals)


def _finish(status, transcript, started, usage_totals, **extra):
    return {
        "status": status,
        "transcript": transcript,
        "wall_time_s": round(time.time() - started, 1),
        "usage": usage_totals,
        **extra,
    }
