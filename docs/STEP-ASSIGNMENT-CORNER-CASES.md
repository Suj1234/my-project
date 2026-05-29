# Step Assignment — Corner Cases & Proposed Fixes

> Canvas C / Inline Step Config
> Author: Claude (reviewed with Sujeet)
> Date: 2026-05-27
> Status: PENDING USER APPROVAL before any code changes

---

## Background

The Application Progress Tracker lets CST users assign each canvas block to a named Journey Step (e.g. "KYC") and a Sub-step label (e.g. "1.1 PAN Verification"). Several UX gaps exist that would force repetitive work or produce silent errors for non-technical users.

---

## Scenario 1 — No Step Inheritance (P0 — core UX gap)

**Current behaviour:**  
Every new block starts with `stepId = undefined`. The CST user must manually open the panel and re-select the step from the dropdown for every block they add, even when adding multiple blocks in a row to the same step.

**Example:** User adds PAN → assigns to "KYC". Adds Address Verification → panel shows blank "Select a step…" — must manually pick "KYC" again. Adds Liveness → same again.

**Proposed fix:**  
When a new block is created via `handleAddBlockAfter(sourceBlockId)`, look up `sourceBlockId` in `blocks[]` and copy its `stepId` (and `stepLabel`) onto the new block as the default. This happens in `CanvasViewC.tsx` inside `handleBlockSelect`, which already receives the `addBlockAfterNodeId` context via closure.

**Files to change:** `CanvasViewC.tsx`

---

## Scenario 2 — Logic Block in the Chain (P1)

**Current behaviour:**  
If the block immediately before the new block is a Router/Merge/Decision (no `stepId`), step inheritance (Scenario 1 fix) would copy `undefined` — no improvement.

**Example:** KYC block 3 → Router → user adds block 4 on a branch. Block 4 should still default to "KYC" because the Router is transparent to the applicant journey.

**Proposed fix:**  
When the preceding block has no `stepId`, walk backwards through `blocks[]` to find the first upstream block with a `stepId`, and use that as the default. Cap the lookback at 5 blocks to avoid surprising the user at big step boundaries.

**Files to change:** `CanvasViewC.tsx`

---

## Scenario 3 — Block Inserted Between Two Different Steps (P1)

**Current behaviour:**  
Inserting between "KYC block 3" and "Financial Details block 1" shows a blank dropdown. No guidance on which step to pick.

**Proposed fix:**  
Same as Scenario 1 — inherit from the preceding block (KYC in this case). The user can override to Financial Details if needed. The dropdown remains editable; the default is just a starting point, not forced.

**Files to change:** `CanvasViewC.tsx` (same fix as Scenario 1 covers this)

---

## Scenario 4 — Unassigned Block has No Visual Indicator on Canvas (P0)

**Current behaviour:**  
A visible block (smart/form) with no `stepId` renders with no chip badge on the canvas. It looks identical to a correctly assigned block. The only hint is the amber border in the step dropdown, which is only visible when the panel is open.

**Proposed fix:**  
In `JourneyCanvasC.tsx`, when a `visibleToApplicant` block has no `stepId`, render a warning chip above it: `⚠ Not assigned to a step` in an amber style, instead of nothing. Same node type (`stepbadge`), different data prop (`unassigned: true`) driving amber styling in `StepBadgeNode.tsx`.

**Files to change:** `JourneyCanvasC.tsx`, `StepBadgeNode.tsx`

---

## Scenario 5 — Tracker Section Buried in Collapsed Accordion (P0)

**Current behaviour:**  
The "Application Progress Tracker" (step + sub-step assignment) lives inside the "Component Info" accordion item, which starts collapsed (`defaultValue={[]}`). CST users open a new block's panel and see nothing about step assignment — it's hidden one click deep.

**Proposed fix (already agreed with user):**  
Move the tracker section OUT of the `ConfigurationPanel` accordion entirely. Render it as a fixed top section inside `ConfigurationPanelC`, above the `<ConfigurationPanel>` call. Remove the `stepSection` prop from `ConfigurationPanel`. The tracker is always visible when a configurable block is selected.

**Files to change:** `ConfigurationPanelC.tsx`, `ConfigurationPanel.tsx`

---

## Scenario 6 — Step Label Staleness (P1 — latent bug)

**Current behaviour:**  
`stepLabel` is stored per-block at assignment time (e.g. `"KYC"`). The `steps[]` array holds the authoritative step name. If a step is renamed in the future (no such UI today, but possible), the `stepLabel` on existing blocks would silently show the old name in `derivedSteps` reconstruction during reload.

The chip badge reads from `step.name` (live from `steps[]` — correct). The panel reads `assignedStep.name` (live — correct). Only `derivedSteps` reconstruction during API load reads `block.stepLabel` — the stale path.

**Proposed fix:**  
`stepLabel` stays on `BlockData` as the serialised step name for reload purposes. But when writing it, always sync it from `steps[]` at the point of `onSave()` — not from a stale local variable. 

Additionally: when `handleCreateStep` or any future "rename step" mutates a step's name, run a pass over `blocks[]` to update `stepLabel` on all blocks with that `stepId`. This keeps the serialised data consistent.

**Files to change:** `CanvasViewC.tsx`

---

## Scenario 7 — No Steps Overview (P1)

**Current behaviour:**  
There is no single place for the CST user to see "what steps exist, which blocks are in each step, and which blocks are unassigned." They must open each block individually.

**Proposed fix:**  
Add a "Steps" tab or collapsible section to the right panel's empty state (currently shows "Select a block to configure"). When no block is selected, show a **Steps Overview** panel:

```
Step 1 — KYC (3 blocks)
  1.1  PAN Verification
  1.2  Address Verification
  1.3  Liveness Check

Step 2 — Financial Details (2 blocks)
  2.1  Bank Statement Upload
  2.2  Income Declaration

⚠  Unassigned (1 block)
  • Custom Form  [Assign →]
```

Clicking a block row selects it on the canvas and opens its config panel. "Assign →" on unassigned blocks is a direct shortcut to the step dropdown.

**Files to change:** `CanvasViewC.tsx` (new inline Steps Overview panel replacing the empty state)

---

## Scenario 8 — Sub-step Numbers Shift Silently (P2)

**Current behaviour:**  
When a block is deleted, all subsequent sub-step numbers shift down (1.3 becomes 1.2). This is correct computed behaviour, but a CST user who shared "see step 1.3" externally will have a broken reference with no warning.

**Proposed fix:**  
This is acceptable as-is for now — sub-step numbers are always computed, never stored, so they are always correct. The Steps Overview panel (Scenario 7) gives CST a live view they can reference. No code change needed for this scenario.

---

## Scenario 9 — "Start" Block Shown Step Assignment UI (P2)

**Current behaviour:**  
The Start block (`type: 'start'`) is `visibleToApplicant: true` and is not in `LOGIC_TYPES`, so `ConfigurationPanelC` shows it the full step assignment section. Assigning the Start block to a step would be meaningless (it's the journey entry, not a customer-facing step).

**Proposed fix:**  
Add `'start'` to the `LOGIC_TYPES` set in `ConfigurationPanelC.tsx` (or add an explicit check). Show the same "internal block" message for `start` type.

**Files to change:** `ConfigurationPanelC.tsx`

---

## Scenario 10 — Step Name in Chip Mismatches Step Name in Panel (edge case, P2)

**Current behaviour:**  
The chip badge reads `step.name` live from `steps[]`. The panel reads `assignedStep.name` live from `steps[]`. These are always in sync. No issue today.

This is documented here only to confirm it is NOT a bug — the two-part chip introduced in the previous session already reads from `steps[]`, not from the stale `block.stepLabel`.

---

## Summary Table

| # | Scenario | Priority | Files to Change |
|---|---|---|---|
| 1 | Step inheritance — new block defaults to preceding block's step | P0 | `CanvasViewC.tsx` |
| 2 | Logic block in chain — look back past router/merge | P1 | `CanvasViewC.tsx` |
| 3 | Insertion mid-journey — covered by fix #1 | P0 | (same) |
| 4 | Unassigned block has no visual indicator on canvas | P0 | `JourneyCanvasC.tsx`, `StepBadgeNode.tsx` |
| 5 | Tracker section buried in collapsed accordion | P0 | `ConfigurationPanelC.tsx`, `ConfigurationPanel.tsx` |
| 6 | Step label staleness on reload | P1 | `CanvasViewC.tsx` |
| 7 | No Steps Overview panel | P1 | `CanvasViewC.tsx` |
| 8 | Sub-step number shift on delete | P2 | No change needed |
| 9 | Start block shown step assignment UI | P2 | `ConfigurationPanelC.tsx` |
| 10 | Chip vs panel name mismatch | P2 | No change needed (confirmed not a bug) |

---

## Open Questions

1. **Steps Overview panel**: Should clicking a block row in the Steps Overview open the config panel on the right, or navigate the canvas to that block? Both would be ideal; panel-open is simpler to implement first.

2. **Unassigned warning chip**: Should the warning chip be shown for `form` blocks too (not just `smart`)? Currently `visibleToApplicant` covers both. Confirm the intent.

3. **Start block**: Confirm — Start block should NOT be assignable to a step. Show the same "internal" message as logic blocks?

4. **Bulk reassign**: Is there a use case where CST needs to move an entire group of blocks from Step 1 to Step 2? If so, the Steps Overview panel could include a drag-to-reorder or bulk-select. Defer for now?

---

## Proposed Implementation Order

1. **P0 fixes first** (Scenarios 1/3, 4, 5) — these block basic usability
2. **P1 fixes** (Scenarios 2, 6, 7) — improve robustness and discoverability
3. **P2 fixes** (Scenario 9) — polish

Each fix requires explicit per-file approval per CLAUDE.md Rule 2.
