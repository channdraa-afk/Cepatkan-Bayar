# 🚨 SUPER STRICT RULES: TWO-PHASE DEVELOPMENT PROCESS

## ⛔ CRITICAL RULE: NO DIRECT CODE CHANGES WITHOUT PLAN & APPROVAL
Whenever Chandra requests a new feature, bugfix, or architecture modification:
**THE AGENT IS STRICTLY FORBIDDEN FROM DIRECTLY EDITING CODE.**

Regardless of whether Turbo Mode is active or Artifact Review Policy is set to Always Proceed / Always Ask, the agent **MUST** strictly follow the 2-phase lifecycle:

---

### PHASE 1: RESEARCH & PLANNING (MODE PEMBAHASAN)
- **Status:** Read-only.
- **Allowed Actions:** Inspecting files, reading logs, searching codebase.
- **Forbidden Actions:** Any file edit or modifying tool calls.
- **Deliverables:**
  - Create or update `implementation_plan.md` with full context and options.
  - Present the proposed changes and rationale clearly in chat.
  - Ask Chandra for questions, feedback, or approval.
- **STOP & WAIT:** The agent MUST STOP execution and wait for Chandra's explicit go-ahead.

---

### PHASE 2: EXECUTION & VERIFICATION (MODE EKSEKUSI)
- **Trigger:** Only begins AFTER Chandra approves ("oke", "gas", "lanjut", etc.).
- **Actions:**
  - Perform accurate code edits.
  - Run verification (`npm run build`).
  - Update `walkthrough.md` with detailed evidence.
  - Present summary to Chandra.
