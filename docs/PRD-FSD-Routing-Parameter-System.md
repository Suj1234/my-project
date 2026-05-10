# PRD + FSD: Journey Builder — Routing Parameter System

**Document Version:** 1.1  
**Date:** 2026-05-05  
**Status:** Draft — Updated  
**Scope:** Conditional Router block — field/parameter selection for routing conditions

---

## Table of Contents

1. [Overview](#1-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Non-Goals](#3-goals--non-goals)
4. [User Stories](#4-user-stories)
5. [Conceptual Model](#5-conceptual-model)
6. [The 7 Parameter Source Types](#6-the-7-parameter-source-types)
7. [Unified Storage Declaration Pattern](#7-unified-storage-declaration-pattern)
8. [Field Nomenclature & Namespacing](#8-field-nomenclature--namespacing)
9. [Journey-Contextual Field Availability ("Data Collected Till Now")](#9-journey-contextual-field-availability-data-collected-till-now)
10. [Functional Specification — Storage Declaration](#10-functional-specification--storage-declaration)
11. [Functional Specification — Router Field Selector](#11-functional-specification--router-field-selector)
12. [Functional Specification — Routing Condition Evaluation](#12-functional-specification--routing-condition-evaluation)
13. [Edge Cases & Rules](#13-edge-cases--rules)
14. [UI/UX Specification](#14-uiux-specification)
15. [Data Model Changes](#15-data-model-changes)
16. [Open Questions](#16-open-questions)

---

## 1. Overview

The Journey Builder allows operators to design multi-step applicant journeys. Each journey consists of ordered blocks: Smart Blocks (calling service providers), Form Blocks (collecting user input), Decision Blocks (evaluating rules), and Conditional Router Blocks (branching the flow).

This document specifies the **Routing Parameter System** — the mechanism by which:
- Every block in a journey explicitly declares what data it stores and where (storage declaration)
- The Conditional Router block knows which fields are available to route on, and from where
- The field selector in routing conditions is dynamic, journey-contextual, and correctly namespaced

---

## 2. Problem Statement

### Current State
The routing condition field selector shows a **static, hardcoded list** of ~15 fields. This has several problems:

1. Fields unrelated to the current journey appear (a PAN-only journey shows bank statement fields)
2. Fields captured by actual blocks in the journey may not appear
3. No distinction between who captured what — designer has no visibility into data lineage
4. API output fields from service providers have no standard way to appear in routing
5. Decision block verdicts cannot be routed on without special-casing
6. Multiple API calls within one smart block create naming conflicts with no resolution mechanism

### Desired State
The routing field list should be **dynamic and journey-contextual**: only fields actually captured/declared by blocks present in the journey (and upstream of the router) should appear, namespaced consistently under `custom.*` / `native.*` / `system.*`.

---

## 3. Goals & Non-Goals

### Goals
- Unified storage declaration pattern across all block types (user inputs, API outputs, verdicts)
- Dynamic, journey-contextual routing field list
- Consistent `custom / native / system` namespace across the entire platform
- Clean UX: designer sees exactly what's available, nothing more, nothing less
- Support for all 7 parameter source types in routing conditions (including page transition actions)
- No naming conflicts — designer controls field names explicitly

### Non-Goals
- Automatic field inference (no implicit storage without explicit declaration)
- Global field registry / cross-journey field sharing
- Runtime field value preview in the builder
- Percentage split / A/B routing (separate feature)
- Complex data transformation / computed fields (separate feature)

---

## 4. User Stories

### Journey Designer
- **US-01**: As a journey designer, when I configure a routing condition, I want to see only the fields that have been captured by blocks in this journey so I don't get confused by irrelevant fields.
- **US-02**: As a journey designer, when I add a PAN Verification block, I want to declare that the PAN status should be stored as `custom.pan_status` so it becomes available for downstream routing.
- **US-03**: As a journey designer, I want to be able to route on a user's declared income (entered in a form page) by storing it as `custom.declared_income`.
- **US-04**: As a journey designer, when a Decision block produces a verdict, I want to store that verdict as `custom.credit_decision` and route on it in a downstream Router block.
- **US-05**: As a journey designer, I want to always have access to system fields like `system.attempt_count` in routing, regardless of which blocks are in the journey.
- **US-06**: As a journey designer, when one smart block calls three APIs, I want to name each API's outputs separately so there are no naming conflicts.

### Platform Admin / Product Manager
- **US-07**: As a product manager, I want all field references to follow `custom.*` / `native.*` / `system.*` nomenclature consistently so engineers can build a predictable runtime evaluation engine.

---

## 5. Conceptual Model

### The Core Principle
> **Nothing is routeable unless explicitly declared for storage.**

Every piece of data in a journey — whether typed by the applicant, returned by an API, or computed by a decision engine — becomes routeable **only** when the journey designer explicitly declares:
1. What the field is called
2. Whether it's `custom` or `native` storage

This is consistent across all 6 parameter source types. Same mental model everywhere.

### The Data Flow

```
Block executes
     ↓
Designer-declared storage mapping fires
     ↓
Field stored under custom.X / native.X / system.X
     ↓
Downstream Router reads from stored fields
     ↓
Routing condition evaluated against stored value
```

### Namespace Summary

| Namespace | Meaning | Who Defines | Always Visible? |
|-----------|---------|-------------|-----------------|
| `native.*` | Standard identity / KYC fields | Designer (per block) | No — only if declared upstream |
| `custom.*` | Journey-specific / API output fields | Designer (per block) | No — only if declared upstream |
| `system.*` | Runtime session metadata | Platform | Yes — always |
| `page_action.*` | Transition action taken by user on a page | Declared on each page (actions list) | No — only if page has actions declared |

---

## 6. The 7 Parameter Source Types

All 7 types feed into the same condition builder in the Router block. The source type determines **where in the block configuration** the routing parameter is declared.

---

### Type 1: User Inputs from Pages

**What it is:** Data explicitly entered by the applicant on a page within a block (form field, text input, dropdown selection, etc.)

**Where declared:** Page configuration → User Inputs section → each input has a "Store as" field

**Examples:**
- Applicant types PAN → stored as `native.pan_number`
- Applicant enters declared income → stored as `custom.declared_income`
- Applicant selects employment type → stored as `custom.employment_type`
- Applicant enters loan amount → stored as `custom.requested_loan_amount`

**Namespace:** `native.*` or `custom.*` — designer chooses per field

**Key Rule:** If a user input does not have a "Store as" declaration, it is NOT available in routing. It exists only for display/UI purposes.

---

### Type 2: Service Provider / API Outputs

**What it is:** Response fields returned by external APIs called during a smart block's transition actions

**Where declared:** Smart Block → Data Hooks → Output Captures section → each capture maps an API response path to a storage field

**Examples:**
- Bureau API returns `data.score` → captured as `custom.cibil_score`
- KYC API returns `result.status` → captured as `custom.kyc_status`
- Bank statement API returns `averageBalance` → captured as `custom.avg_monthly_balance`
- Fraud check returns `riskLevel` → captured as `custom.fraud_risk_level`

**Namespace:** `native.*` or `custom.*` — designer chooses per capture

**Multiple APIs in one block:** Each API's outputs are named independently by the designer. No system-level namespacing by API name. Designer is responsible for unique names.

**Example — One block, 3 APIs:**
```
KYC Smart Block
  Output Captures:
    ├── Bureau API    → cibil_score     → custom.cibil_score
    ├── Bureau API    → bureau_status   → custom.bureau_status
    ├── Bank Stmt API → avg_balance     → custom.avg_monthly_balance
    └── Fraud API     → risk_score      → custom.fraud_risk_score
```

All 4 appear independently in the router field list under `── custom ──`.

---

### Type 3: Native Fields (Identity Store)

**What it is:** Standard identity and KYC fields that follow a platform-defined schema. These are the canonical names for common personal data points.

**Where declared:** Same as Type 1 or Type 2 — any input or output capture that stores to `storeType: native` with a platform-recognized field name

**Platform-defined native field list (indicative):**
- `native.pan_number`
- `native.aadhaar_number`
- `native.mobile`
- `native.email`
- `native.dob` (date of birth)
- `native.full_name`
- `native.gender`
- `native.pincode`
- `native.address`

**Key Rule:** Native field names are platform-defined. The designer picks from a predefined list when selecting `storeType: native`. They cannot create arbitrary `native.*` field names — only `custom.*` can be freely named.

**Why native exists:** Enables cross-journey deduplication, pre-fill, and consistent identity resolution at the platform level.

---

### Type 4: Custom Fields

**What it is:** Journey-specific fields with designer-chosen names. Used for any data that doesn't fit the native schema — API-specific outputs, computed values, journey-specific inputs.

**Where declared:** Same as Type 1 or Type 2 — any input or output capture with `storeType: custom`

**Naming:** Freely named by designer. Convention: lowercase, underscore-separated. Examples: `custom.bureau_score`, `custom.employment_type`, `custom.loan_eligibility_flag`

**Key Rule:** Custom field names must be unique within a journey. If two blocks capture to `custom.status`, the second write overwrites the first at runtime. (Builder should warn on duplicate names — see Edge Cases.)

---

### Type 5: Decision Block Verdicts

**What it is:** The output verdict produced by a Decision block after evaluating its rules (PASS / REJECT / FLAG / MANUAL_REVIEW)

**Where declared:** Decision Block configuration → Verdict Output section → "Store verdict as" field → designer names it and picks `custom` or `native`

**Examples:**
- Credit decision → stored as `custom.credit_decision` (values: PASS, REJECT, FLAG, MANUAL_REVIEW)
- Fraud decision → stored as `custom.fraud_verdict`
- KYC decision → stored as `custom.kyc_decision`

**Namespace:** `custom.*` (most cases) or `native.*` — designer chooses

**Why this matters:** A journey may have multiple Decision blocks (credit + fraud + KYC). Each stores its verdict under a different field name. A downstream Router can then route on `custom.credit_decision = PASS AND custom.fraud_verdict = PASS`.

**Key Rule:** Without declaring storage, the Decision block's verdict cannot be referenced in routing. The verdict is still used for internal Decision Block routing (verdict → target block mapping) but not exposed to a downstream Router.

---

### Type 6: System Fields

**What it is:** Platform-managed session and runtime metadata. Always present, always accessible. Not declared by the designer.

**Where declared:** Not declared — platform-provided

**Always available in routing regardless of journey composition:**

| Field | Type | Description |
|-------|------|-------------|
| `system.attempt_count` | number | How many times this journey has been attempted by this applicant |
| `system.device_type` | text | `mobile` / `desktop` / `tablet` |
| `system.platform` | text | `web` / `android` / `ios` |
| `system.timestamp` | date | Journey start timestamp |
| `system.journey_step` | number | Current step index in the journey |
| `system.session_id` | text | Unique session identifier |
| `system.ip_address` | text | Applicant IP address |

**Key Rule:** System fields are read-only. Designer cannot write to them.

---

### Type 7: Page Transition Actions

**What it is:** The specific transition action (user-initiated event) that was triggered on a page. Each page in a block can have multiple possible transition actions (e.g., "Proceed", "Edit Details", "Skip", "Retry"). When a user triggers one, its label is stored as the "last action taken on this page."

**Where declared:** Block config → UI Configuration → Page card → Transition Actions list. The designer adds all possible actions for that page (free text or pick from suggestions).

**Examples:**
- Review page with two actions: "Proceed" and "Edit Details"
  - User clicks "Proceed" → `page_action.KYC Review.Review Page = "Proceed"`
  - User clicks "Edit Details" → `page_action.KYC Review.Review Page = "Edit Details"`
- Offer page with three actions: "Accept", "Reject", "Request Callback"

**Namespace:** `page_action.{blockName}.{pageName}` — auto-generated, not designer-named

**Field type for routing:** `text` — operator options: `=`, `!=`, `in`, `not in`

**Value input in Router:** When this field is selected in the condition builder, the value input shows a dropdown of the declared transition actions for that page (not free text) — so the designer picks "Proceed" rather than typing it.

**Optional actions:** If a transition action is optional (may not fire), the field value will be empty. Use `is empty` / `is not empty` operators to route on whether the action was triggered at all.

**Sequential mandatory actions:** If all actions on a page are sequential and mandatory (all fire in order), the routing parameter holds the value of the **last** action triggered. To route on intermediate states, use Data Hooks output captures instead.

**Key Rule:** A page must have at least one transition action declared for its `page_action.*` field to appear in the Router. Pages with no declared actions do not contribute a routing parameter.

---

## 7. Unified Storage Declaration Pattern

The same UI pattern appears in every block type wherever storage is declared:

```
Field Name    [________________]    ← designer-typed name (or platform list for native)
Store As      [custom ▾]            ← dropdown: custom / native
```

This appears in:
- **Page → User Input** configuration (per input field on a page)
- **Smart Block → Data Hooks → Output Captures** (per API response field)
- **Decision Block → Verdict Output** (for the verdict field)

The only variation: when `Store As = native`, the Field Name becomes a dropdown (platform-defined list) rather than a free-text input.

---

## 8. Field Nomenclature & Namespacing

### Reference Format

All field references in routing conditions use dot notation:

```
{namespace}.{field_name}
```

Examples:
- `native.pan_number`
- `custom.cibil_score`
- `custom.credit_decision`
- `system.attempt_count`

### Namespace Rules

| Namespace | Name Format | Defined By |
|-----------|-------------|------------|
| `native` | Platform-defined fixed list | Platform schema |
| `custom` | Lowercase, underscores, designer-named | Journey designer |
| `system` | Platform-defined fixed list | Platform runtime |

### Canonical Reference in Conditions

When a routing condition stores a field reference, it stores the full dot-notation string:

```json
{
  "parameter": "custom.cibil_score",
  "operator": ">=",
  "value": "750"
}
```

The runtime resolver reads `custom.cibil_score` from the journey's field store and evaluates the condition.

---

## 9. Journey-Contextual Field Availability ("Data Collected Till Now")

### Rule

> A routing field is available in a Router block **only if** it has been declared for storage by a block that appears **earlier** (upstream) in the journey canvas.

### What "Upstream" Means

In the current linear canvas model: a block is upstream if its **array index is lower** than the Router block's index.

### Implication

- Journey has: **Start → PAN Block → Aadhaar Block → Router → Bureau Block**
- Router sees: fields from PAN Block + Aadhaar Block + Start Block + system fields
- Router does NOT see: fields from Bureau Block (it comes after)

### Why This Matters

A designer building a routing condition should only see data that is guaranteed to be present at the point in the journey when the router executes. Showing downstream fields would create routing conditions that can never be satisfied.

### Branching Flows (Future)

For journeys with branching (Router A splits → Branch 1 and Branch 2 → eventually reach Router B):
- Router B should see fields from the common upstream path (before Router A)
- Fields captured in Branch 1 only should be marked as "conditionally available" in Branch 2 and vice versa
- This is a V2 concern — for V1, treat all upstream blocks' fields as available (linear model)

---

## 10. Functional Specification — Storage Declaration

### 10.1 User Input Storage Declaration (Page Level)

**Location:** Block config → Page tab → User Inputs section → each input field

**Fields on each User Input:**
```
Label           [Enter PAN Number          ]
Input Type      [Text ▾]
Required        [✓]
─── Storage ───────────────────────────────
Store As        [native ▾]   Field  [pan_number ▾]
                             ↑ dropdown when native
                             ↑ free text when custom
```

**Behavior:**
- If `Store As = native`: Field dropdown shows platform-defined native field list
- If `Store As = custom`: Field is a free-text input (validated: lowercase, underscores only, no spaces)
- If storage not configured: input is collected but NOT available in routing (display-only)
- On save: field reference (`native.pan_number` or `custom.field_name`) stored in `userInput.storageKey`

### 10.2 Output Capture Storage Declaration (Data Hooks)

**Location:** Smart Block config → Data Hooks tab → Output Captures section

**Fields on each Output Capture:**
```
Response Path   [data.result.score         ]   ← JSON path in API response
Store As        [custom ▾]   Field  [cibil_score    ]
```

**Behavior:** Same as 10.1. `storeType` + `fieldName` → full key `custom.cibil_score`

### 10.3 Decision Verdict Storage Declaration

**Location:** Decision Block config → Verdict Output section

```
Store Verdict As  [custom ▾]   Field  [credit_decision ]
```

**Behavior:**
- Stores the string value of the verdict (PASS / REJECT / FLAG / MANUAL_REVIEW) into the declared field
- If not configured: verdict only used for internal Decision Block routing (verdict → target block map), not available to downstream Router blocks
- Field type for routing purposes: `text` (with known enum values)

### 10.4 Validation Rules for Storage Declaration

| Rule | Error Message |
|------|---------------|
| Custom field names must be lowercase letters, numbers, underscores only | "Field name must be lowercase with underscores (e.g., cibil_score)" |
| Custom field names must be unique within the journey | "Field name 'cibil_score' is already used by [Block Name]. Choose a different name." |
| Native field selection is required when storeType = native | "Select a native field from the list" |
| Field name cannot start with a number | "Field name must start with a letter" |

---

## 11. Functional Specification — Router Field Selector

### 11.1 How the Field List is Built

When a Router block's configuration panel is open, the system builds the available field list as follows:

```
Step 1: Find all blocks with index < router's index (upstream blocks)

Step 2: For each upstream block, collect:
  a. All userInputs with a storageKey defined
     → storageKey becomes the field reference (e.g., "native.pan_number")
     → Derive fieldType from the input type

  b. All outputCaptures with storeType = 'custom' or 'native'
     → Build reference: {storeType}.{fieldName}
     → Derive fieldType from captureType or default to 'text'

  c. If block is a Decision block and has verdictStorageKey defined:
     → Add that field reference
     → fieldType = 'text' (enum: PASS/REJECT/FLAG/MANUAL_REVIEW)

  d. For each page in the block that has actions.length > 0:
     → Add field: value = "page_action.{blockName}.{pageName}"
     → label = "{blockName} → {pageName}"
     → fieldType = 'text'
     → Store the page's actions[] array for use as value dropdown options

Step 3: Add all system fields unconditionally

Step 4: Deduplicate by field reference (if same key captured by two blocks, show once — latest definition wins)

Step 5: Group by namespace: native → custom → page_action → system
```

### 11.2 Field Object Structure (Internal)

```typescript
interface RouterField {
  value: string;          // full reference: "custom.cibil_score" or "page_action.KYC Block.Review Page"
  label: string;          // display label: "Cibil Score" or "KYC Block → Review Page"
  group: 'native' | 'custom' | 'system' | 'page_action';
  fieldType: 'text' | 'number' | 'date' | 'boolean';
  sourceBlockName: string;
  pageActions?: string[]; // only for page_action group — the declared transition actions
}
```

### 11.3 Field Dropdown UI Structure

```
Search fields...
─────────────────────────────────────
── native (2) ─────────────────────
  native.pan_number          PAN Number
  native.aadhaar_number      Aadhaar Number
── custom (4) ─────────────────────
  custom.pan_status          PAN Status          [from: PAN Block]
  custom.cibil_score         Cibil Score         [from: Bureau Block]
  custom.credit_decision     Credit Decision     [from: Decision Block]
  custom.declared_income     Declared Income     [from: Form Block]
── Transition Actions (2) ─────────
  KYC Block → Review Page          [from: KYC Block]
  Offer Block → Offer Display Page [from: Offer Block]
── system ──────────────────────────
  system.attempt_count       Attempt Count
  system.device_type         Device Type
  system.platform            Platform
  system.timestamp           Timestamp
```

**Behaviors:**
- Search filters across label AND value (e.g., typing "score" shows all score-related fields)
- "from: Block Name" shown as a subtle hint — not part of the field reference
- System fields always shown at bottom, cannot be hidden
- If no upstream blocks have declared any fields: show only system fields + a warning banner

### 11.4 Operator Filtering by Field Type

When a field is selected, operators are filtered based on the field's declared type:

| Field Type | Available Operators |
|------------|---------------------|
| `text` | = , ≠ , contains, not contains, is empty, is not empty, in, not in, matches regex |
| `number` | = , ≠ , > , < , ≥ , ≤ , between, is empty, is not empty |
| `date` | = , before, after, between, is before today, is after today, is in last N days, is empty, is not empty |
| `boolean` | = (true/false), is empty, is not empty |

For Decision verdict fields (`fieldType: text` with known enum):
- Operators: = , ≠ , in, not in
- Value dropdown shows: PASS, REJECT, FLAG, MANUAL REVIEW (instead of free text)

---

## 12. Functional Specification — Routing Condition Evaluation

### 12.1 Condition Structure

Each routing condition references one field:

```typescript
interface Condition {
  id: string;
  parameter: string;        // full reference: "custom.cibil_score"
  operator: ConditionOperator;
  value?: string;           // primary value
  valueTo?: string;         // secondary value for 'between'
  fieldType?: FieldType;    // stored at design time for runtime use
}
```

### 12.2 Condition Groups (DNF Model)

Conditions within a route are grouped using **Disjunctive Normal Form (DNF)**:

- **Within a group**: conditions are combined with AND or OR (designer selects per group)
- **Between groups**: always OR — a route matches if ANY group evaluates to true

```typescript
interface ConditionGroup {
  id: string;
  operator: 'AND' | 'OR';       // between conditions within this group
  conditions: Condition[];
}

// On RoutingConfig:
conditionGroups: ConditionGroup[];
// NO groupOperator field — between groups is always OR
```

**Example:** Two groups in a single route:
- Group 1: `custom.cibil_score >= 750 AND custom.pan_status = VALID`
- Group 2: `custom.credit_decision = PASS`

Route matches if: `(Group 1 is true) OR (Group 2 is true)`

**Why DNF:** This is the industry standard used by n8n, Zapier, Make, Salesforce Flow, HubSpot, and Segment. It is expressive enough for all real-world routing use cases while keeping the UI intuitive — groups are visually separated with an "OR" label between them.

### 12.3 Evaluation Order

The Router uses **first-match** (exclusive) evaluation:

1. Routes evaluated top to bottom in declared order
2. First route whose condition groups evaluate to `true` (any group matches) is taken
3. Remaining routes are not evaluated
4. If no route matches: default route is taken
5. If no default route is set: journey enters error state

**Designer control over order:** Routes can be reordered using up/down arrows in the configuration panel. Order matters — a more specific condition should be placed above a broader one.

---

## 13. Edge Cases & Rules

### E1: Duplicate Custom Field Names
- Two blocks declare `custom.status` → second write at runtime silently overwrites first
- **Builder behavior:** Show a warning indicator on the second block's field declaration: "⚠ custom.status is also captured by [Block A]. This will overwrite the earlier value."
- Do not block the designer, only warn

### E2: Router Has No Upstream Fields
- Journey is: Start → Router (with no form/smart blocks before it)
- **Builder behavior:** Field dropdown shows only system fields. Show info banner: "No custom or native fields have been captured before this router. Add blocks with field capture before this router, or use system fields."

### E3: Field Declared But Block Deleted
- Designer declares routing condition on `custom.cibil_score` from Bureau Block, then deletes Bureau Block
- **Builder behavior:** Condition shows field reference in red: "⚠ custom.cibil_score — source block deleted." Prevent save until resolved.

### E4: Native Field Name Conflict
- Two blocks both store to `native.pan_number`
- **Builder behavior:** Same as E1 — warn, don't block. At runtime, second write wins.

### E5: Decision Verdict Without Storage Declaration
- Decision Block has no verdictStorageKey → verdict not in router field list
- **Builder behavior:** In the field dropdown, if a Decision Block exists upstream but has no verdictStorageKey: show it grayed out as "Decision Block: [Name] — verdict not stored. Configure verdict storage to use it here."
- Clicking the grayed item opens the Decision Block config at the verdict section

### E6: Empty Condition Group
- Designer adds a condition group but adds no conditions to it
- **Builder behavior:** Prevent route save. "Add at least one condition to this group."

---

## 14. UI/UX Specification

### 14.1 Storage Declaration UI (Consistent Across All Block Types)

**Component:** `FieldStorageInput`

```
┌─────────────────────────────────────────┐
│  Store As   [custom ▾]                  │
│  Field Name [cibil_score           ]    │
│             ↳ native: dropdown          │
│             ↳ custom: free text         │
│                                         │
│  Full key: custom.cibil_score  ← live   │
└─────────────────────────────────────────┘
```

- Live preview of full key updates as designer types
- Validation feedback inline (red border + message)
- Duplicate name warning appears immediately on blur

### 14.2 Router Condition Field Selector

**Grouped dropdown with search:**
```
┌─────────────────────────────────────────┐
│ 🔍 Search fields...                     │
├─────────────────────────────────────────┤
│ ── native (2) ─────────────────────── │
│   pan_number        PAN Number          │
│   aadhaar_number    Aadhaar Number      │
├─────────────────────────────────────────┤
│ ── custom (3) ─────────────────────── │
│   pan_status        PAN Status    KYC▸ │
│   cibil_score       Cibil Score   KYC▸ │
│   credit_decision   Credit Dec.   DEC▸ │
├─────────────────────────────────────────┤
│ ── system ──────────────────────────  │
│   attempt_count     Attempt Count       │
│   device_type       Device Type         │
└─────────────────────────────────────────┘
```

- Block source shown as a small chip (KYC▸, DEC▸) — hover shows full block name
- Clicking chip navigates to source block (optional V2)

### 14.3 Condition Value Input — Context-Aware

| Operator | Input Rendered |
|----------|----------------|
| `is empty` / `is not empty` / `is before today` / `is after today` | No input |
| `between` | Two inputs inline with `–` separator (inclusive bounds) |
| `is in last N days` | Number input + "days" label |
| `in` / `not in` | Comma-separated text input (or multi-select if field has known enum) |
| Decision verdict field with `=` or `!=` | Dropdown: PASS / REJECT / FLAG / MANUAL REVIEW |
| Page transition action field (any operator) | Dropdown populated from that page's declared `actions[]` — not free text |
| Default | Single text input |

### 14.4 Empty State for Field Selector

When no fields declared upstream:
```
┌──────────────────────────────────────────────────┐
│  ℹ No fields captured yet                        │
│  Blocks upstream of this router haven't declared  │
│  any stored fields. You can:                      │
│  • Add a Smart Block and configure output captures │
│  • Add a Form Block with stored fields            │
│  • Use system fields (always available below)     │
├──────────────────────────────────────────────────┤
│ ── system ───────────────────────────────────── │
│   attempt_count     Attempt Count                 │
│   ...                                             │
└──────────────────────────────────────────────────┘
```

---

## 15. Data Model Changes

### 15.1 UserInput (on Page)

```typescript
interface UserInput {
  id: string;
  label: string;
  inputType: 'text' | 'number' | 'date' | 'select' | 'boolean';
  required: boolean;
  options?: string[];         // for select type
  // NEW:
  storageKey?: string;        // full reference: "native.pan_number" or "custom.declared_income"
  storeType?: 'native' | 'custom';
  fieldName?: string;         // just the name part without namespace
  fieldType?: FieldType;      // text/number/date/boolean — for operator filtering
}
```

### 15.2 OutputCapture (Data Hooks) — Existing, Confirm

```typescript
interface OutputCapture {
  id: string;
  responsePath: string;       // JSON path in API response
  storeType: 'custom' | 'native';
  fieldName: string;          // designer-named
  // Derived:
  storageKey: string;         // "{storeType}.{fieldName}"
  captureType?: FieldType;    // text/number/date/boolean
}
```

### 15.3 BlockData — Decision Block

```typescript
// In DecisionBlockConfig:
interface DecisionBlockConfig {
  rules: DecisionRule[];
  defaultVerdict: DecisionVerdict;
  verdictRoutes?: Partial<Record<DecisionVerdict, string>>;  // blockId targets
  // NEW:
  verdictStorageKey?: string;    // "custom.credit_decision"
  verdictStoreType?: 'custom' | 'native';
  verdictFieldName?: string;     // just "credit_decision"
}
```

### 15.4 PageConfig — Transition Actions

```typescript
interface PageConfig {
  id: string;
  name: string;
  actions: string[];      // list of transition action labels (e.g. ["Proceed", "Edit Details"])
  userInputs: FormInputField[];
  isConfigured?: boolean;
  configurationMethod?: 'assigned' | 'ai_generated';
  assignedPageId?: string;
}
```

At runtime: when a user triggers a transition action on this page, the journey stores:
`page_action.{blockName}.{pageName} = "{actionLabel}"`

### 15.5 RoutingConfig — DNF Model (No groupOperator)

```typescript
interface RoutingConfig {
  id: string;
  label?: string;
  conditionGroups: ConditionGroup[];   // between groups: always OR
  targetBlockId: string;
  saved?: boolean;
  // groupOperator removed — inter-group is always OR (DNF)
}
```

### 15.6 RouterField (Computed, Not Stored)

This is computed at render time from upstream blocks. Not stored in the data model.

```typescript
interface RouterField {
  value: string;               // "custom.cibil_score" or "page_action.KYC Block.Review Page"
  label: string;               // "Cibil Score" or "KYC Block → Review Page"
  group: 'native' | 'custom' | 'system' | 'page_action';
  fieldType: FieldType;
  sourceBlockName: string;
  pageActions?: string[];      // only for page_action group — the page's declared actions
}
```

### 15.5 System Fields (Platform-Defined Constant)

```typescript
const SYSTEM_FIELDS: RouterField[] = [
  { value: 'system.attempt_count',  label: 'Attempt Count',  namespace: 'system', fieldType: 'number', sourceBlockId: 'system', sourceBlockName: 'System' },
  { value: 'system.device_type',    label: 'Device Type',    namespace: 'system', fieldType: 'text',   sourceBlockId: 'system', sourceBlockName: 'System' },
  { value: 'system.platform',       label: 'Platform',       namespace: 'system', fieldType: 'text',   sourceBlockId: 'system', sourceBlockName: 'System' },
  { value: 'system.timestamp',      label: 'Timestamp',      namespace: 'system', fieldType: 'date',   sourceBlockId: 'system', sourceBlockName: 'System' },
  { value: 'system.journey_step',   label: 'Journey Step',   namespace: 'system', fieldType: 'number', sourceBlockId: 'system', sourceBlockName: 'System' },
  { value: 'system.session_id',     label: 'Session ID',     namespace: 'system', fieldType: 'text',   sourceBlockId: 'system', sourceBlockName: 'System' },
  { value: 'system.ip_address',     label: 'IP Address',     namespace: 'system', fieldType: 'text',   sourceBlockId: 'system', sourceBlockName: 'System' },
];
```

---

## 16. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| Q1 | What happens at runtime if a field reference in a routing condition refers to a field that was never written (e.g., API call failed)? Should it treat as `null` / `is empty`, or halt the journey? | Engineering / Product | Open |
| Q2 | For `native` field names — is there a finalized platform-level schema, or is the list in this doc indicative only? | Platform Team | Open |
| Q3 | For branching flows (V2): when two branches converge at a Merge block and then hit a Router, how are fields from individual branches treated — available or conditionally available? | Product / Engineering | Deferred V2 |
| Q4 | Should the Builder validate that at least one route will always match (i.e., warn if no default route is set)? | Product | Open |
| Q5 | For form block fields specifically: if a formField does not have a `storageKey`, should it still show the user input in the journey (cosmetic only) or should storage be mandatory for all form fields? | Product | Open |

---

*End of Document*

**PRD Owner:** Journey Builder Product Team  
**Engineering Lead:** TBD  
**Next Step:** Review open questions → Engineering estimation → Sprint planning
