"""The tool-calling loop against llama-server's OpenAI-compatible endpoint.

Single model, single always-loaded llama-server process — roles are just
different system prompts sent to the same running model. This harness never
requests a model reload/swap; see GUIDE.md "Why one model, never swapped."
"""
import json
import time

import httpx

from tools import Tools, TOOL_SCHEMAS, ReadBeforeWriteError


class TaskAborted(Exception):
    def __init__(self, reason):
        self.reason = reason


class TaskDone(Exception):
    def __init__(self, summary):
        self.summary = summary


def run_task(cfg, base_url, model_alias, system_prompt, user_task, workspace_path):
    tools = Tools(workspace_path)
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_task},
    ]
    max_calls = cfg["limits"]["max_tool_calls_per_task"]
    deadline = time.time() + cfg["limits"]["max_wall_clock_s"]
    transcript = []

    for i in range(max_calls):
        if time.time() > deadline:
            return {"status": "TIMEOUT", "transcript": transcript}

        resp = httpx.post(
            f"{base_url}/chat/completions",
            json={
                "model": model_alias,
                "messages": messages,
                "tools": TOOL_SCHEMAS,
                "temperature": 0.2,
            },
            timeout=cfg["server"]["request_timeout_s"],
        )
        resp.raise_for_status()
        choice = resp.json()["choices"][0]["message"]
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
                return {"status": "DONE", "summary": args.get("summary", ""), "transcript": transcript}
            if name == "abort":
                return {"status": "ABORTED", "reason": args.get("reason", ""), "transcript": transcript}

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

    return {"status": "MAX_CALLS_EXCEEDED", "transcript": transcript}
