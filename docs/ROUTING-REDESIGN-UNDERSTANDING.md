# Conditional Router — Redesign Understanding Document

**Status:** Design FULLY CONFIRMED — ready for implementation approval  
**Date:** 2026-05-09  
**Rule:** Any change to existing code/configuration MUST be approved by the user before implementation. See CLAUDE.md.

---

## All Confirmed Decisions

| # | Decision | Status |
|---|----------|--------|
| 1 | Remove exclusive/inclusive toggle — always exclusive | Confirmed |
| 2 | Remove upstream field chips / parameter list from routing screen | Confirmed |
| 3 | Two routing modes: Condition-based and Action-based | Confirmed |
| 4 | Action-based routing: one card per outcome (industry standard) | Confirmed |
| 5 | Between condition groups: each group PAIR has its own AND/OR selector | Confirmed |
| 6 | Within one condition group: one AND/OR applies to ALL conditions in that group | Confirmed |
| 7 | Condition gate on action-based route: collapsed by default, CST clicks to expand | Confirmed |
| 8 | Existing `action` values in blockDefinitions converted to `actions: ['existing label']` (system labels kept) | Confirmed |
| 9 | Hybrid routing: Action as primary trigger + optional condition gate on same card | Confirmed |

---

## Change 1: Remove Exclusive / Inclusive Toggle

**Files:**
- `src/app/components/ConfigurationPanel.tsx` — remove branch mode selector UI (~lines 408–424)
- `src/app/components/nodes/RouterNode.tsx` — remove EXCLUSIVE/INCLUSIVE badge (~lines 70–75)

---

## Change 2: Remove Field Chips / Parameter List

**Files:**
- `src/app/components/ConfigurationPanel.tsx` — remove native + custom chip sections (~lines 427–451) and the mode description text (~line 453)

---

## Change 3: Condition Groups — AND/OR Per Group Pair

**Current model (single groupOperator for all groups):**
```typescript
// RoutingConfig has:
groupOperator?: 'AND' | 'OR';   // one value applied between ALL groups
```

**New model — operator stored on each group as "connector to next group":**
```typescript
interface ConditionGroup {
  id: string;
  operator: 'AND' | 'OR';           // between conditions WITHIN this group (one value, all conditions)
  conditions: Condition[];
  nextGroupOperator?: 'AND' | 'OR'; // connector to the next group — undefined on the last group
}
```

**UI rendering:**
```
[Group 1]  cond1 AND cond2
   [AND ▾]   ← nextGroupOperator of Group 1 (user toggles)
[Group 2]  cond3 OR cond4
   [OR ▾]    ← nextGroupOperator of Group 2
[Group 3]  cond5
(no connector — last group)
[+ Add Group]
```

**Overall route matches if:** `G1 AND (G2 OR G3)` — evaluated left-to-right with standard operator precedence. Simple and predictable for non-technical users.

**Files:**
- `src/app/types/journey.ts` — add `nextGroupOperator` to `ConditionGroup`, remove `groupOperator` from `RoutingConfig`

---

## Change 4: Action-Based Routing — New Fields on RoutingConfig

**New routing card for action-based:**
- Block selector → Page selector (pages from that block's `pages[]`) → Action selector (actions from that page's `actions[]`)
- Optional condition gate (collapsed by default, same `ConditionGroup[]` structure)
- One destination block

**Required new fields on `RoutingConfig`:**
```typescript
interface RoutingConfig {
  id: string;
  label?: string;
  routingType: 'action' | 'condition';   // now mandatory (was optional)

  // --- Condition-based ---
  conditionGroups?: ConditionGroup[];     // uses nextGroupOperator on each group

  // --- Action-based ---
  sourceBlockId?: string;                 // which upstream block
  sourcePageId?: string;                  // which page within that block
  actionLabel?: string;                   // which action on that page (e.g. "Proceed")
  conditionGate?: ConditionGroup[];       // optional condition check after action match

  // --- Common ---
  targetBlockId: string;
  saved?: boolean;
}
```

Fields removed: `actionTriggers`, `actionTriggerOperator`, `groupOperator` (replaced by `nextGroupOperator` on each group).

---

## Change 5: PageConfig — Multiple Actions Per Page

**Current in `blockDefinitions.ts`:**
```typescript
{ id: 'pan_input', name: 'PAN Input Page', action: 'PAN initiated', userInputs: [...] }
```

**New:**
```typescript
{ id: 'pan_input', name: 'PAN Input Page', actions: ['PAN initiated'], userInputs: [...] }
```

**`PageConfig` type change in `journey.ts`:**
```typescript
// Remove:  action?: string
// Keep:    actions: string[]   (already exists in type, just need to align implementation)
```

**`PageConfigCard.tsx` UI change:**
- "Action" single-select dropdown → multi-value input where CST can add/remove action labels
- Each action is a free-text tag (e.g., "Proceed", "Edit Details", "Skip")
- At least one action recommended (warn if empty, since page with no actions won't be available for action-based routing)

---

## Implementation Order (All Steps Need Permission Before Starting)

| Step | File | Change Summary |
|------|------|---------------|
| 1 | `src/app/types/journey.ts` | Add `nextGroupOperator` to `ConditionGroup`; restructure `RoutingConfig`; align `PageConfig.actions` |
| 2 | `src/app/data/blockDefinitions.ts` | All smart blocks: `action: 'X'` → `actions: ['X']` |
| 3 | `src/app/components/PageConfigCard.tsx` | Multi-action tag input replacing single-action dropdown |
| 4 | `src/app/components/ConfigurationPanel.tsx` | Remove chips, remove toggle, new routing UI (condition-based + action-based cards) |
| 5 | `src/app/components/nodes/RouterNode.tsx` | Remove EXCLUSIVE/INCLUSIVE badge |

---

## UI Mockups (Final)

### Condition-Based Route Card
```
┌──────────────────────────────────────────────────────────┐
│  Route 1  [Condition-based ▾]              ↑ ↓  [Delete] │
│                                                           │
│  ┌─[Group 1]──────────────────────────────────────────┐  │
│  │  [cibil_score ▾]  [>= ▾]  [700]       [× delete]  │  │
│  │  [AND ▾]                                            │  │
│  │  [pan_status ▾]   [= ▾]   [VALID]     [× delete]  │  │
│  │  [+ Add condition]                                  │  │
│  └────────────────────────────────────────────────────┘  │
│                     [AND ▾]  ← between Group 1 & 2        │
│  ┌─[Group 2]──────────────────────────────────────────┐  │
│  │  [credit_decision ▾]  [= ▾]  [PASS]  [× delete]   │  │
│  │  [+ Add condition]                                  │  │
│  └────────────────────────────────────────────────────┘  │
│  [+ Add Group]                                            │
│                                                           │
│  Route to: [Select block ▾]                               │
│  [Save Route]                                             │
└──────────────────────────────────────────────────────────┘
```

### Action-Based Route Card (no condition gate)
```
┌──────────────────────────────────────────────────────────┐
│  Route 2  [Action-based ▾]                 ↑ ↓  [Delete] │
│                                                           │
│  Block:   [PAN Verification ▾]                            │
│  Page:    [Review Details Page ▾]                         │
│  Action:  [Proceed ▾]                                     │
│                                                           │
│  [+ Add condition gate]                                   │
│                                                           │
│  Route to: [Select block ▾]                               │
│  [Save Route]                                             │
└──────────────────────────────────────────────────────────┘
```

### Action-Based Route Card (with condition gate expanded)
```
┌──────────────────────────────────────────────────────────┐
│  Route 3  [Action-based ▾]                 ↑ ↓  [Delete] │
│                                                           │
│  Block:   [PAN Verification ▾]                            │
│  Page:    [Review Details Page ▾]                         │
│  Action:  [Proceed ▾]                                     │
│                                                           │
│  ▼ Condition gate  [− Remove]                             │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  [cibil_score ▾]  [>= ▾]  [700]       [× delete]   │ │
│  │  [+ Add condition]                                   │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  Route to: [Select block ▾]                               │
│  [Save Route]                                             │
└──────────────────────────────────────────────────────────┘
```

---

## No Open Questions Remain

Design is complete. Awaiting user permission to begin Step 1 (types).
