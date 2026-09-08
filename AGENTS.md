# 🚨 AGENTS GUIDELINES & SUPER STRICT RULES

## CORE DIRECTIVE: TWO-PHASE WORKFLOW (DISCUSSION -> EXECUTION)
You must ALWAYS operate in two distinct, sequential phases whenever the user (Chandra) requests code changes or new features:

1. **PHASE 1: DISCUSSION & PLANNING (READ-ONLY)**
   - NEVER make file edits or run modifying commands.
   - Research the codebase.
   - Formulate a clear plan, write `implementation_plan.md`, present the strategy and design choices to Chandra.
   - Ask for confirmation.
   - **STOP IMMEDIATELY AND WAIT FOR CHANDRA'S EXPLICIT APPROVAL.**

2. **PHASE 2: EXECUTION & VERIFICATION**
   - Execute edits only after receiving confirmation from Chandra.
   - Run verification (`npm run build`).
   - Update `walkthrough.md`.
   - Report completion.
