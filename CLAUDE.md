# dog-care-app — Claude Context

@.claude/RULES.md

---

## Absolute Guardrails
> These apply in all circumstances. No exceptions.

- **NEVER** commit, stage, or push code unless explicitly instructed
- **NEVER** use `any` in TypeScript
- **NEVER** use `ngModel` — reactive forms only
- Ask before running any destructive operation (delete, overwrite, reset)

## Project Overview
- **Stack**: Angular 16 | TypeScript | SCSS | PWA
- **Description**: A Progressive Web App for managing a dog's daily needs (feeding, walks, medication, and other care tasks), installable on a phone.

## Mandatory Context
Read these before working:
- `.claude/RULES.md` — coding standards
- `.claude/TESTING.md` — test conventions
- `.claude/AGENTS.md` — development workflow
