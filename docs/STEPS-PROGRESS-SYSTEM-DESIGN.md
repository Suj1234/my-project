# Steps & Progress Bar System — Design Document

**Date:** June 2026 | **Status:** Pre-Demo Review | **Audience:** Internal Team

---

## What Are Steps and Sub-steps?

**Step** = a named phase the customer sees in the progress bar (e.g. "Profile & KYC").
**Sub-step** = the name of the individual screen within that phase (e.g. "Aadhaar Verification").
Together they power the progress bar: *"Step 2 of 4 — Profile & KYC — Screen 1 of 2."*

---

## Problem

Currently there is no way for the CST to define what step and sub-step a block belongs to while building a journey on the canvas. There is no option to assign this anywhere.

---

## Solution

Whenever a CST drags a block onto the canvas, they must define the step name and sub-step name inside the block's configuration panel before they can save the block. This is mandatory — the block cannot be saved without it.

**First block on canvas**
The CST creates a new step on the fly and gives this block a sub-step name.

**Every block after that**
The CST can reuse the step from the immediate parent block only, or create a new one. They cannot pick a step from any block before the parent.

**In conditional branching**
Blocks in a branch have the router as their parent. Since the router is a logic block (no step), the system traverses up to the nearest content block and suggests that step as the default.

**When two branches converge manually**
There is no dedicated merge block. When two paths need to converge, the CST manually draws edges from two different blocks to a single block. That block now has two parents. Both parent step names are offered as options, or the CST can create a new one.

**Shared blocks**
Even if a block is shared by multiple paths, the CST assigns it one step name and one sub-step name. The step number shown to the customer is calculated dynamically — the assignment does not change per path.

**Logic blocks**
Router, Start, and End do not require step or sub-step assignment.

---

## Editing After the Fact

A CST can reopen any block's config and change its step or sub-step at any time. Since no numbers are stored, changes do not break anything. If a CST deletes a step that has blocks assigned to it, those blocks lose their assignment and must be reassigned before the journey can be published.

---

## Total Steps — Dynamic Calculation

The total step count is not stored. It is calculated at runtime based on the actual path the customer takes. ETB and NTB customers will see different totals. The CST does not manage this.

---

## Edge Cases

**1. Deleting a block**
When a CST deletes a block, its step and sub-step assignment is removed with it. Other blocks assigned to the same step are not affected.

Example: Three blocks are assigned to step "Profile & KYC" — Profile Form, Aadhaar Verification, Address Confirmation. CST deletes Aadhaar Verification. The other two remain assigned to "Profile & KYC" unchanged. If Aadhaar Verification was the only block in its step, that step name disappears from the dropdown entirely.

---

**2. Inserting a block between two existing blocks**
When a CST inserts a new block between two existing connected blocks, the parent of the downstream block changes.

Example: Canvas has Block A (step: Identity) → Block C (step: Profile). CST inserts Block B between them. Canvas now reads Block A → Block B → Block C. Block C's parent was Block A, it is now Block B. Block C's existing step assignment stays unchanged. However if the CST opens Block C's config to edit, the parent suggestion will now come from Block B, not Block A.

---

**3. Parent is a logic block (Router)**
Router blocks have no step assignment. When a new block's immediate parent is a Router, the system traverses up past the Router to the nearest content block and offers that step as the suggestion.

Example:
```
Block A (step: Identity) → Router → Block B (in ETB branch)
```
Block B's immediate parent is the Router, which has no step. The system looks past the Router to Block A and suggests "Identity" as the default. The CST can accept this or create a new step.

---

**4. When two branches converge manually**
When two paths converge — CST draws edges from two different blocks to the same block — that block has two parents. If both parents have different step names, both are offered as options. If both have the same step name, that step is suggested as the default.

Example:
```
Block B (step: Profile)    ──┐
                              → Block D
Block C (step: Employment) ──┘
```
Block D is offered both "Profile" and "Employment" as step options, plus the ability to create a new one.

---

**5. Mandatory validation applies on edit too**
Step and sub-step fields are mandatory not just when a block is first created but also when editing. If a CST opens an existing block and clears either field, the system will not allow saving until both are filled.

Example: CST opens Bank Statement Analysis and deletes the sub-step label intending to rename it but closes the panel without entering a new name. The system blocks saving: "Sub-step name is required."

---

**6. Step names must be unique across the entire journey**
A CST cannot create two separate steps with the same name. If the same name appears in two branches, the system treats them as the same step. This ensures dynamic calculation is unambiguous.

Example: CST names the last block of ETB as step "Completion" and the last block of NTB also as "Completion." The system treats this as one step used by both paths. Both ETB and NTB customers see "Completion" as their final step — which is the correct and intended behaviour.

---

**7. Pre-publish validation**
Before a journey is published, the system checks that every content block has both a step name and sub-step name assigned. If any block is missing either, publishing is blocked and the system clearly highlights which blocks are incomplete.

Example: CST builds a 10-block journey but forgets to configure VKYC and eSign. On clicking Publish, the system shows: "2 blocks are missing step assignment — VKYC, eSign. Please configure them before publishing."

---

**8. Block with two incoming edges where parents have the same step name**
If two blocks from different branches both carry the same step name and connect to the same block, the system suggests that step name as the default.

Example: ETB branch Block B (step: "Verification") and NTB branch Block C (step: "Verification") both connect to Block D. System suggests "Verification" as the default step for Block D.

---

**9. Duplicating a block**
When a CST duplicates an existing block, the duplicate does not inherit the step and sub-step assignment of the original. The CST must assign step and sub-step fresh on the duplicate before they can save it — same as dragging any new block onto the canvas.

---

**10. Disconnecting an edge between two blocks**
If a CST removes the edge connecting two blocks, the downstream block loses its parent connection. The system shows an error on that block: "This block is not connected to the flow. Connect it before proceeding." The block cannot participate in the journey until it is reconnected. Its existing step and sub-step assignment is preserved — the CST does not need to reassign once reconnected.

---

**11. Sub-step names must be unique within a step**
Within the same step, no two blocks can have the same sub-step name. If a CST enters a sub-step name that already exists within the same step, the system blocks saving.

Example: Step "Profile & KYC" already has a block with sub-step "Profile Form." If the CST names another block in the same step "Profile Form," the system blocks it: "Sub-step name already exists within this step. Please use a unique name."

---

**12. Block with no connections at all**
If a block sits on the canvas with no incoming or outgoing edges, the system ignores it during dynamic step calculation — it will not appear in the customer's progress bar. The pre-publish check flags it so the CST is aware, but it does not block publishing. The block simply does not participate in the journey until it is connected.

---

## Open Questions

**1. Global step rename**
If a CST renames a step, should it update automatically across all blocks assigned to that step, or must each block be updated individually?

**2. Parent change notification**
When a block is inserted between two existing blocks, the downstream block's parent silently changes. Should the system prompt the CST to review that block's step assignment, or handle it silently?
