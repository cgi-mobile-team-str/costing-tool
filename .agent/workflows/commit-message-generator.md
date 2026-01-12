---
description: Generate a concise and descriptive commit message using LLM analysis of staged changes.
---

1. Retrieve the full diff of all staged changes.
// turbo
2. run_command git diff --cached
3. Analyze the diff to identify the primary objective and list specific changes.
4. Draft a commit message following the "Conventional Commits" specification.
5. Review the draft for clarity, brevity, and accuracy.
6. Present the final commit message to the user for confirmation.
