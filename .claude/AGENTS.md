# Development Workflow

## Phase 1 — Intake

1. Take the task description or ticket reference
2. Restate acceptance criteria in own words — confirm understanding before anything
3. Identify scope boundary: what is in vs explicitly out
4. Flag immediately if work needs a shared utility or abstraction

## Phase 2 — Plan

1. Propose numbered list of discrete, ordered implementation steps
2. For each: state what changes, which files affected (created/modified), why
3. Keep steps small enough for independent review/approval
4. Highlight unknowns, risks, decisions needing input
5. Do not proceed until plan explicitly approved

## Phase 3 — Step-by-Step Implementation

For each approved step:

1. **Describe** — explain what and why, name every touched file
2. **Propose structure** — show interfaces, signatures, component shape, template outline (NO implementation code yet)
3. **Wait** — user reviews, approves, redirects, or adds constraints
4. **Implement** — write code ONLY after explicit structure approval
5. **Present** — show changes clearly; explicitly call out accessibility (WCAG 2.1) for any template work
6. **Confirm** — wait for sign-off before marking step complete

## Phase 4 — Wrap-Up

1. Summarise what was built across all steps
2. Flag anything discovered warranting follow-up work
3. Note any reusable abstractions identified but deferred

## Workflow Rules

- Never implement more than one step at a time
- Never modify a file without approved structure first
- Scope is fixed to acceptance criteria — out-of-scope discoveries become follow-up items
- If a step reveals something unexpected (missing utility, side effect, design conflict), pause and discuss
- User may add constraints at any point — fold in before writing code

## Before Writing Code

- Read the file before editing — never guess at structure or imports
- For questions spanning files, use the Explore subagent
- Use Grep for symbol lookups, Glob for file patterns — reserve Agent for open-ended research
- Confirm root cause before writing a fix
- Fix bugs at the source (service/model layer), not at the symptom

## Output Standards

- Produce only what was asked — no unrequested refactors or "while I'm here" changes
- No docstrings or comments added to code that was not changed
- No speculative abstractions — solve the problem in front of you
- Flag any security concern (XSS, injection, exposed secrets) immediately before continuing

## Absolute Limits

- NEVER commit, stage, push, force-push, amend commits unless explicitly instructed
- NEVER run with `--no-verify` or bypass git hooks
- NEVER modify CI/CD pipelines without explicit instruction
- NEVER delete files or branches without explicit confirmation
