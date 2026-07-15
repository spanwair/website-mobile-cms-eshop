# SkillOpt-Sleep — pending model calls (handoff)

2 prompt(s) below need answers before the sleep cycle can continue.

For EACH prompt:

1. Answer it in a FRESH context (e.g. a subagent with no
   conversation history). Do NOT let the current session's
   context, the other prompts in this file, or the optimization
   run itself leak into the answer — that contaminates the
   held-out validation gate.
2. Write ONLY the raw answer text (no commentary, no code
   fences) to the prompt's answer file.

When every answer file exists, re-run the same engine command
(`python -m skillopt_sleep run --backend handoff ...`); it
resumes automatically from the answers directory.

---

## Prompt 1 of 2

- id: `2b171cc62bacf08e`
- answer file: `answers/2b171cc62bacf08e.md`
- suggested max tokens: 200

----- BEGIN PROMPT 2b171cc62bacf08e -----
Score how well the response satisfies the rubric, 0..1. Return ONLY JSON {"score": <0..1>, "reason": "..."}.

# Rubric
allow install. It is in the folder: /home/jan/PROJECTS/react-native/smalljobs-mobile/agents/SkillOpt

# Response
The package is available locally — I'll use `SKILLOPT_SLEEP_REPO` to point to that path instead of installing via pip/uv.
----- END PROMPT 2b171cc62bacf08e -----

---

## Prompt 2 of 2

- id: `f004fa41e7a25d68`
- answer file: `answers/f004fa41e7a25d68.md`
- suggested max tokens: 1024

----- BEGIN PROMPT f004fa41e7a25d68 -----
You are SkillOpt's optimizer. The agent keeps failing the recurring tasks below. Propose at most 4 bounded edits to the skill document so it stops failing. Each edit MUST be a short, GENERAL, reusable rule or preference (never task-specific, never an answer to a single task). If exact failing criteria are listed, your edits MUST make future outputs satisfy every one of them.
BE CONCRETE: quote the exact threshold, section name, or format from the criteria verbatim in your rule (e.g. write 'keep the entire response under 1200 characters', NOT 'respect length limits'). Vague rules do not change behavior; specific numeric/structural rules do.
IMPORTANT: your edits are APPENDED to a 'Learned preferences' block; you CANNOT delete the existing instructions above. If the current skill text conflicts with a criterion (e.g. it says 'be exhaustive' but outputs must be under a character limit), write an explicit, forceful OVERRIDE rule stating it supersedes the conflicting instruction, and put the hard requirement first.
HARD CONSTRAINT: every rule you write MUST be consistent with the 'Task output contract' below (if shown). NEVER propose a rule that changes the required output format/language, tells the agent to ask the user a question, or otherwise violates that contract — such a rule scores ZERO because the evaluator cannot honor it.
Return ONLY a JSON array: [{"op":"add|replace|delete","content":"<rule>","anchor":"<text to replace/delete, optional>","rationale":"<why>"}].

# Current skill
---
name: skillopt-sleep-learned
description: Preferences and procedures learned from past local agent sessions.
---

# skillopt-sleep-learned

Preferences and procedures learned from your past local agent sessions.




# Recurring failures
- wanted: allow install. It is in the folder: /home/jan/PROJECTS/react-native/smalljobs-mobile/agents/SkillOpt
  got: The package is available locally — I'll use `SKILLOPT_SLEEP_REPO` to point to that path instead of installing via pip/uv.
  why-wrong: judge-parse-failed
----- END PROMPT f004fa41e7a25d68 -----
