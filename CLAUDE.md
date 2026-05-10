# Claude Working Rules — Antigravity Journey Builder

> This file is read by the AI assistant at the start of every conversation.
> These rules are non-negotiable and apply to ALL tasks in this project.

---

## Rule 1: Read PROJECT_CONTEXT.md Before Any Task

Before starting any task — bug fix, feature, refactor, question — read `PROJECT_CONTEXT.md` in full. It documents the full architecture, block types, data model, file map, and UI/UX conventions. Do not guess or infer what is not there; read the actual source file.

---

## Rule 2: Ask Permission Before Changing Any Existing File

**This is the most important rule.**

Before making any change to any existing file in this project (code, config, types, data, docs), you MUST:

1. State clearly: which file you want to change
2. State clearly: what exact change you want to make and why
3. Wait for explicit user approval ("yes", "go ahead", "approved", etc.)

This applies to:
- TypeScript / TSX / JS source files
- `blockDefinitions.ts`, `apiCatalog.ts`, `journey.ts`, and all data files
- `ConfigurationPanel.tsx`, `PageConfigCard.tsx`, and all component files
- `App.tsx`, `JourneyCanvas.tsx`, and all canvas files
- Any `.json`, `.md`, or config files

**Creating new files is allowed without permission.** Only modifying existing files requires approval.

Do NOT:
- Assume that discussing a change means permission to make it
- Make "small" or "obvious" changes without asking
- Batch multiple changes and ask once — ask per file or per logical group

---

## Rule 3: Document Understanding Before Implementing

For any significant feature or redesign:
1. Write a understanding/design document in `docs/` first
2. List open questions and wait for answers
3. Only after user confirms understanding is correct → ask permission to change files

---

## Rule 4: No Assumptions About Missing Information

If something is unclear, ask. Do not assume. The user has said explicitly: if you cannot figure it out, ask before making any change.

---

## Rule 5: Project-Specific Conventions

- Target users are non-technical (CST — Customer Success Team). No developer jargon in the UI.
- Color system: Smart=Blue, Form=Green, Router=Orange, Merge=Indigo, End=Red, Data Hook=Purple
- Always use `ScrollArea` from Radix, not native scroll, inside modals
- All modals needing scroll use `h-[88vh]` fixed height with `flex-1 min-h-0` inner containers
- No Redux/Zustand — all state in `App.tsx` via `useState`
- Changes saved immediately on every field edit (`onSave(updatedBlock)` called on every change — no Save button in panel)

---

## Active Design Documents

| Document | What it covers |
|----------|---------------|
| `docs/ROUTING-REDESIGN-UNDERSTANDING.md` | Conditional Router redesign — 3 changes, open questions, locked files |
| `docs/PRD-FSD-Routing-Parameter-System.md` | PRD for routing parameter system (Type 7: page actions) |
| `docs/PRD-Credit-Card-Onboarding-v1.0.md` | Credit card onboarding product requirements |
