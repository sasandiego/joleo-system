---
name: working-style
description: "How user wants Claude to collaborate on any project — architecture vs execution boundary, pre-build grilling, review gate"
metadata: 
  node_type: memory
  type: user
  originSessionId: 69dcdbc1-66d8-4654-88d8-5291b1e62c82
---

User designs architecture; Claude executes within defined boundaries. User's engineering judgment is the quality gate.

Before building anything non-trivial: (1) ask 10 hard pre-build questions, (2) wait for answers, (3) surface Build Brief with confirmed approach + risks + constraints, (4) only then write code. If /grill-me command exists, run it.

5-Checkbox gate before accepting code: explain HOW it works, follows interface contracts, doesn't bypass architectural layers, no hardcoded values, failure modes handled.

**Why:** Prevent specs-to-code slop, AI-on-AI fix cascades, and context dumping. Slow the fast part down deliberately.

**How to apply:** Never jump straight to implementation on non-trivial tasks. Always surface the Build Brief and wait for confirmation. Use /effort high or ultrathink for architecture decisions.
