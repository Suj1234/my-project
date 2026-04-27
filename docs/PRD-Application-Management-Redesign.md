# PRD — Application Management Redesign

**Status:** Draft  
**Author:** Product / Engineering  
**Date:** 2026-04-27  
**Version:** 1.2  

---

## Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-04-27 | Engineering | Initial draft (flows A, B, C) |
| 1.1 | 2026-04-27 | Engineering | Added flows D & E; program selection changed to dropdown; Flow A type changed to dropdown; Flow C auto-selects single identifier; added multi-program decision rationale |
| 1.2 | 2026-04-27 | Engineering | "Identifier Type" renamed to "Application Identifier" with subtitle explanation; program dropdown replaced with searchable combobox; auto-formatting added for PAN and Aadhaar inputs |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Background & Problem Statement](#2-background--problem-statement)
3. [Goals & Non-Goals](#3-goals--non-goals)
4. [User Personas](#4-user-personas)
5. [User Flow](#5-user-flow)
6. [Flow Variants — Detailed Spec](#6-flow-variants--detailed-spec)
7. [Program Selection Step](#7-program-selection-step)
8. [Identifier Capture Step](#8-identifier-capture-step)
9. [Confirmation Modal](#9-confirmation-modal)
10. [Warning & Destructive Action Copy](#10-warning--destructive-action-copy)
11. [A/B/C/D/E Flow Toggle (Dev Only)](#11-abcde-flow-toggle-dev-only)
12. [Why Multi-Program Selection Was Not Built](#12-why-multi-program-selection-was-not-built)
13. [Error States & Edge Cases](#13-error-states--edge-cases)
14. [Non-Functional Requirements](#14-non-functional-requirements)
15. [API Contract (Future Integration)](#15-api-contract-future-integration)
16. [Data Model](#16-data-model)
17. [Accessibility](#17-accessibility)
18. [Security & Compliance](#18-security--compliance)
19. [Success Metrics & Acceptance Criteria](#19-success-metrics--acceptance-criteria)
20. [Dependencies](#20-dependencies)
21. [Scope Summary](#21-scope-summary)
22. [Open Questions](#22-open-questions)

---

## 1. Overview

The Application Management page allows authorised operators to permanently delete all applications linked to a unique identifier (e.g. mobile number, PAN, account number) within a specific program.

The current implementation is limited to a hardcoded environment selector and a mobile-only input. This redesign removes the environment concept, makes program selection explicit (where applicable), and introduces five configurable identifier-capture flows (A–E) that can be evaluated side-by-side during development before one is selected for production.

---

## 2. Background & Problem Statement

### Context

As the platform scales to support multiple programs (lending verticals, MSME, gold loans, etc.), each program may use a different primary identifier for its applicants. The existing page does not account for this, and is also coupled to a concept (environment selection) that does not belong in this operation.

### Pain Points

| Pain point | Current behaviour | Desired behaviour |
|---|---|---|
| Environment selector adds noise | Operator must pick Test / Sandbox first | Removed entirely |
| Mobile-number only | Input hardcoded to 10-digit Indian mobile with +91 prefix | Support any unique identifier; user enters full value |
| No program scoping | Deletion not scoped to a program | Flows A/B/C scope to a selected program; D/E do not |
| Identifier type is fixed | No way to delete by PAN, account number, Aadhaar, etc. | Five flows cover every identifier-capture strategy |
| +91 prefix hardcoded | Only supports Indian mobile numbers | User types the full value including any country code |

---

## 3. Goals & Non-Goals

### Goals

1. Remove the environment selection step completely.
2. Support five identifier-capture flows (A–E) with a visible dev toggle for evaluation.
3. Flows A, B, C scope deletion to a user-selected program (program dropdown).
4. Flows D, E operate without program selection for cross-program or program-agnostic use cases.
5. Support flexible identifier types — mobile, PAN, account number, Aadhaar — extensible in future.
6. Keep the two-step confirmation pattern and generic destructive-action warning.

### Non-Goals

- Real-time search or lookup before deletion.
- Bulk deletion via CSV/file upload.
- Undo or soft-delete capability.
- Scoping by environment (Test / Sandbox).
- Multi-program deletion in a single operation (see §12 for rationale).
- Role-based access control changes (handled at route/shell level).
- Audit log or deletion history (separate concern).

---

## 4. User Personas

### Primary: Operations Operator

- **Role:** Internal operations team member with access to the Ops Dashboard.
- **Goal:** Quickly delete all applications for a specific applicant from a given program, e.g. for data cleanup, user request, or compliance.
- **Context:** Works across multiple programs; needs to select the right program to avoid accidental cross-program deletion.

### Secondary: QA / Test Engineer

- **Role:** Internal engineer running test flows.
- **Goal:** Clear test data for a specific identifier after a test run.
- **Context:** May use Flow D or E when cleaning up across programs or when program scoping is not required.

---

## 5. User Flow

### Flows A, B, C (program-scoped)

```
1. Select Program (dropdown)
      ↓
2. Capture Identifier  ←─ varies by flow
      ↓
3. Click "Delete Applications"
      ↓
4. Confirmation Modal → Confirm
      ↓
5. Toast notification
```

### Flows D, E (no program selection)

```
1. Capture Identifier  ←─ varies by flow
      ↓
2. Click "Delete Applications"
      ↓
3. Confirmation Modal → Confirm
      ↓
4. Toast notification
```

Step dependencies:
- In A/B/C, the identifier step is locked until a program is selected.
- In A and E, the value input is locked until an identifier type is chosen.
- The Delete button is locked until all required fields are valid.

---

## 6. Flow Variants — Detailed Spec

### 6.1 Flow A — Program + Fixed Identifier Type Dropdown + Value

| Step | UI element | Detail |
|---|---|---|
| 1 | Program dropdown | Select from active programs |
| 2 | Identifier type dropdown | Fixed list: Mobile Number, PAN Number, Account Number, Aadhaar Number. Disabled until program selected. |
| 3 | Value input | Plain text. Disabled until type selected. Validated per type (see §16). |

**Confirmation modal shows:** Program · Identifier Type · Identifier Value  
**When to use:** All programs share the same identifier set; operator needs both program and type precision.

---

### 6.2 Flow B — Program + Free Text Value

| Step | UI element | Detail |
|---|---|---|
| 1 | Program dropdown | Select from active programs |
| 2 | Value input | Plain text, no type selector. Enabled after program selected. Non-empty validation only. Placeholder: "Enter identifier value". |

**Confirmation modal shows:** Program · Identifier Value  
**When to use:** Downstream system resolves identifier type from value, or only one type is used per program.

---

### 6.3 Flow C — Program + Auto-Selected Identifier Type + Value

| Step | UI element | Detail |
|---|---|---|
| 1 | Program dropdown | Select from active programs |
| 2 | Identifier type | **Auto-selected** from the program's primary (first) `supported_identifiers` entry. Shown as a read-only badge — not a selectable control. |
| 3 | Value input | Enabled after program selected (and auto-type resolves). Validated per type. |

**Key behaviour:** As soon as a program is selected, the identifier type is resolved automatically. The operator sees which type is active but cannot change it. This keeps the flow to two interactions: pick program → enter value.

**Edge case:** If the selected program has zero `supported_identifiers`, a warning is shown and the value input and Delete button remain disabled.

**Confirmation modal shows:** Program · Identifier Type (auto) · Identifier Value  
**When to use:** Each program has exactly one primary identifier and there is no ambiguity about which type to use.

---

### 6.4 Flow D — Value Only (No Program, No Type)

| Step | UI element | Detail |
|---|---|---|
| 1 | Value input | Plain text only. Always enabled. Non-empty validation only. Placeholder: "Enter identifier value". |

No program or identifier type step is shown at all.

**Confirmation modal shows:** Identifier Value only  
**When to use:** Cross-program deletion where the backend resolves both program scope and identifier type from the value alone, or when a specific program is not relevant to the operation.

---

### 6.5 Flow E — Fixed Identifier Type Dropdown + Value (No Program)

| Step | UI element | Detail |
|---|---|---|
| 1 | Identifier type dropdown | Fixed list: Mobile Number, PAN Number, Account Number, Aadhaar Number. Always enabled. |
| 2 | Value input | Disabled until type selected. Validated per type. |

No program step is shown.

**Confirmation modal shows:** Identifier Type · Identifier Value  
**When to use:** Cross-program deletion scoped by identifier type but not by program — e.g. "delete all applications for this PAN across all programs".

---

### Flow Comparison Matrix

| Attribute | A | B | C | D | E |
|---|:---:|:---:|:---:|:---:|:---:|
| Program selection | ✅ Dropdown | ✅ Dropdown | ✅ Dropdown | ❌ | ❌ |
| Identifier type UI | ✅ Dropdown | ❌ | ✅ Auto-badge | ❌ | ✅ Dropdown |
| Type source | Fixed list | — | Program config | — | Fixed list |
| Value validation | Per type | None | Per type | None | Per type |
| Interactions to delete | 3 | 2 | 2 | 1 | 2 |
| Program-scoped deletion | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 7. Program Selection Step

Applies to flows A, B, C only.

- **Source:** `programsApi.list()` filtered to `status === 'Active'`.
- **UI:** Searchable combobox (Popover + Command pattern). Trigger shows selected program name and code; dropdown contains a live search input and a filtered list. Searches across both program name and program code.
- **Selection mode:** Single-select.
- **On change:** Selecting a new program resets the identifier type (except Flow A where type is independently chosen) and clears the value input.
- **Loading state:** Trigger placeholder shows "Loading programs…" while the API call resolves.
- **Empty state:** If no active programs exist, show: _"No active programs available. Contact your administrator."_ and disable further steps.
- **No results state:** If the search query matches nothing, show: _"No programs found."_

---

## 8. Identifier Capture Step

### Naming & explanation

The field formerly labelled "Identifier Type" is now labelled **"Application Identifier"** throughout — in form labels, the confirmation modal, and all copy. This name makes the subject explicit (it identifies an application, not a generic entity).

A subtitle is shown inside the card header of this step across all flows:

> _"The unique attribute used to identify and match an applicant's applications. Selecting the correct type ensures only the intended applicant's records are targeted."_

### Auto-formatting

To reduce input errors, the value field applies light formatting rules as the operator types:

| Identifier | Formatting applied |
|---|---|
| PAN Number | Input forced to uppercase; non-alphanumeric characters stripped; capped at 10 characters |
| Aadhaar Number | Non-digit characters stripped; spaces auto-inserted after every 4th digit (e.g. `1234 5678 9012`); capped at 12 digits |
| Mobile Number | No auto-formatting; user types the full value including country code |
| Account Number | No auto-formatting |

Formatting is display-only. Before the API call, display spaces are stripped so the raw value is always sent (e.g. `123456789012` not `1234 5678 9012`).

### Disabled states

| Flow | Identifier type disabled when | Value input disabled when |
|---|---|---|
| A | Program not selected | Program not selected OR type not selected |
| B | N/A (no type) | Program not selected |
| C | N/A (auto-selected) | Program not selected OR program has no identifiers |
| D | N/A (no type) | Never disabled |
| E | Never disabled | Type not selected |

### Input behaviour

- Validation runs on every keystroke; error message appears after the first character is typed.
- Switching identifier type resets the value input to empty.
- The Delete button is disabled while any validation error is present.

### Placeholder text

| Flow | Condition | Placeholder |
|---|---|---|
| B, D | Always | "Enter identifier value" |
| A, E | Type selected | From `identifier.placeholder` (e.g. "e.g. ABCDE1234F") |
| A, E | No type selected | "Select an identifier type first" |
| C | Type auto-selected | From `identifier.placeholder` |
| C | No type (unconfigured) | Input disabled |

---

## 9. Confirmation Modal

Always shown before deletion executes.

### Modal summary rows

| Row | A | B | C | D | E |
|---|---|---|---|---|---|
| Program | ✅ | ✅ | ✅ | ❌ | ❌ |
| Identifier Type | ✅ | ❌ | ✅ | ❌ | ✅ |
| Identifier Value | ✅ | ✅ | ✅ | ✅ | ✅ |

### Post-deletion behaviour

- Modal closes.
- Identifier value is cleared.
- Program selection is **retained** (operator may want to run another deletion in the same program).
- Identifier type retention:
  - Flow C: type is retained (auto-bound to program).
  - Flow E: type is retained (operator likely repeating same type).
  - Flows A, B, D: type is cleared.
- Toast notification appears top-right, auto-dismisses after 4 seconds.

---

## 10. Warning & Destructive Action Copy

Generic across all flows and identifier types:

> **This action is permanent and irreversible**  
> All applications linked to the provided identifier will be permanently deleted.

This copy does not reference a specific identifier type or program so it remains accurate across all five flows.

---

## 11. A/B/C/D/E Flow Toggle (Dev Only)

A visible segmented control rendered at the top of the page. Switching flow resets all state (program, type, value). Each segment is labelled:

- **A — Fixed types**
- **B — Free text**
- **C — Program types**
- **D — Value only**
- **E — Type + Value**

An amber **"Dev only"** badge is shown beside the toggle. This component and the `FlowVariant` type are removed once a production flow is chosen (see Open Questions §22).

---

## 12. Why Multi-Program Selection Was Not Built

Multi-program selection — the ability to delete applications for a given identifier across several programs in a single operation — was considered and explicitly excluded. The reasons are:

**1. High blast radius with low recovery**  
Deletion is permanent and irreversible. Scoping a single operation across multiple programs multiplies the surface area of a mistake. If an operator selects the wrong programs, there is no recovery path. Single-program operations limit each mistake to one program.

**2. Confirmation becomes ambiguous**  
The confirmation modal currently shows one clear summary: one program, one identifier, one scope. Multi-program selection would require either a list of all affected programs in the modal (hard to scan quickly) or a collapsed summary (hides what the operator is agreeing to). Neither is as safe as the current single-program confirmation.

**3. Use case is uncommon in practice**  
The primary use case is a customer requesting deletion of their data from a specific product they applied under. They apply under one program at a time, so cross-program deletion in bulk is not the default need. For the rare case where it is needed, the operator can repeat the operation per program.

**4. Flows D and E cover the cross-program scenario**  
If the backend can handle program-agnostic deletion (e.g. delete all applications for this PAN regardless of program), Flow D or Flow E achieves that without exposing multi-select complexity to the operator. This is a cleaner architectural boundary.

**5. Deferred, not permanently excluded**  
If the operational pattern changes and bulk cross-program deletion becomes a regular need, it can be revisited. At that point it would warrant its own dedicated flow (e.g. "Flow F — Multi-program") with appropriate safeguards (explicit per-program confirmation steps, count preview before delete, etc.).

---

## 13. Error States & Edge Cases

| Scenario | Behaviour |
|---|---|
| Programs API fails to load | Error message inline; all steps disabled |
| No active programs | Inline message: "No active programs available." Steps disabled |
| Flow C program has no `supported_identifiers` | Amber warning inline; value input and Delete disabled |
| Identifier value empty on submit | Delete button disabled; no modal |
| Identifier value fails validation | Inline error below input; Delete disabled |
| Deletion returns 0 deleted | Error-variant toast: "No applications found for the provided identifier." |
| Deletion API throws | Error toast; modal closes; state preserved for retry |
| Operator switches program mid-flow | Type (where manual) and value reset |
| Operator switches flow variant | All state reset: program, type, value |
| Rapid double-click on "Yes, Delete" | Button disabled during API call; duplicate request prevented |

---

## 14. Non-Functional Requirements

### Performance

- Program list renders within 300 ms under normal network conditions.
- Deletion API resolves within 2 s; loading spinner visible throughout.

### Scalability

- Program list handles up to 100 active programs without layout degradation.
- `supported_identifiers` per program supports up to 10 types without UI overflow.

### Browser support

- Chrome, Firefox, Edge, Safari (latest two versions each). No IE11.

---

## 15. API Contract (Future Integration)

### List programs

```
GET /api/programs?status=Active
Response: Program[]
```

### Delete applications by identifier

```
DELETE /api/programs/{programId}/applications
Body: {
  identifier_type?: string;   // omitted in flows B, D
  identifier_value: string;
}
Response: {
  deleted_count: number;
  program_id: string;
}
```

### Cross-program delete (flows D, E)

```
DELETE /api/applications
Body: {
  identifier_type?: string;   // omitted in flow D
  identifier_value: string;
}
Response: {
  deleted_count: number;
  programs_affected: string[];
}
```

**Notes:**
- `identifier_type` is optional; backend resolves type when absent.
- `404` response treated as `deleted_count: 0` (not an error toast).
- `5xx` triggers error toast.

---

## 16. Data Model

### `ProgramIdentifier`

```ts
export type IdentifierType = 'mobile' | 'pan' | 'account' | 'aadhaar';

export interface ProgramIdentifier {
  type: IdentifierType;
  label: string;        // shown in type dropdown / auto-badge
  placeholder: string;  // hint inside value input
}
```

### `Program` (added field)

```ts
supported_identifiers: ProgramIdentifier[];
// First entry is treated as the program's primary identifier (used by Flow C)
```

### Validation rules

| Type | Rule |
|---|---|
| `mobile` | `/^\+?\d{7,15}$/` after stripping spaces |
| `pan` | `/^[A-Z]{5}[0-9]{4}[A-Z]$/` normalised to uppercase |
| `account` | `/^\d{9,18}$/` |
| `aadhaar` | `/^\d{12}$/` after stripping spaces |

Flows B and D perform no format validation (non-empty only).

---

## 17. Accessibility

- All interactive elements keyboard-navigable via `Tab`; activatable via `Enter` / `Space`.
- Disabled controls use the `disabled` attribute (not just visual styling).
- Error messages associated with inputs via `aria-describedby`.
- Confirmation modal traps focus while open; restores focus on close.
- Colour is not the sole state indicator — auto-type badge (Flow C) uses both colour and a check icon.
- Toast notifications announced via `aria-live="polite"`.
- Confirm button carries `aria-label="Confirm deletion of applications"`.

---

## 18. Security & Compliance

- Page accessible only to authenticated Operator / Admin roles (route guard assumed).
- Identifier values (PAN, Aadhaar, mobile) are PII and must not be logged to the console, stored in `localStorage` / `sessionStorage`, or transmitted over HTTP.
- Aadhaar numbers are sensitive personal data under India's DPDP Act — consider masking to last 4 digits in the confirmation modal (see Open Questions §22).
- Two-step confirmation (button → modal → confirm) is mandatory and must not be removed.
- Server-side authorisation must be enforced on the delete endpoint; client-side checks are insufficient.

---

## 19. Success Metrics & Acceptance Criteria

### Acceptance Criteria

| # | Criteria | Flows |
|---|---|---|
| AC-01 | Environment selector is absent | All |
| AC-02 | Only Active programs appear in the program dropdown | A, B, C |
| AC-03 | Identifier step disabled until program selected | A, B, C |
| AC-04 | Switching program resets identifier type (where manual) and value | A, B, C |
| AC-05 | Delete button disabled until all required fields valid | All |
| AC-06 | Confirmation modal shows correct rows per flow (§9) | All |
| AC-07 | Success toast shows deleted count and program name where applicable | All |
| AC-08 | Zero-match deletion shows error-variant toast | All |
| AC-09 | API failure shows error toast; state preserved for retry | All |
| AC-10 | Identifier type dropdown shows all 4 fixed types | A, E |
| AC-11 | Identifier type disabled in A until program selected | A |
| AC-12 | No type selector shown; value enabled after program select | B |
| AC-13 | Auto-selects first identifier from program; shown as read-only badge | C |
| AC-14 | Amber warning shown when program has no configured identifiers | C |
| AC-15 | No program step; value input always enabled | D |
| AC-16 | No program step; type dropdown always enabled | E |
| AC-17 | Flow toggle switches flow and resets all state | Dev |
| AC-18 | Flow toggle labelled "Dev only" | Dev |

### Success Metrics (post-production)

| Metric | Target |
|---|---|
| Operator task completion rate | ≥ 95% |
| Time-on-task (start → confirmed deletion) | ≤ 30 s for returning operator |
| Production flow selected | Within 2 weeks of dev toggle deployment |

---

## 20. Dependencies

| Dependency | Type | Detail |
|---|---|---|
| `programsApi.list()` | Mock → real API | Must return `status` and `supported_identifiers` |
| `applicationsApi.deleteByIdentifier()` | Mock → real API | Must accept `programId` (optional for D/E) + `identifier_value` + optional `identifier_type` |
| `Program` type | Type definition | Updated with `supported_identifiers: ProgramIdentifier[]` |
| Radix UI `Select` | UI library | Used for program and identifier type dropdowns |
| Route-level auth guard | Shell / router | Operator / Admin role required |
| HTTPS enforcement | Infrastructure | Required before handling PII in transit |

---

## 21. Scope Summary

### In Scope

- Remove environment selection step.
- Five flow variants (A–E) with visible dev-only toggle.
- "Identifier Type" renamed to "Application Identifier" with subtitle explanation in card header.
- Searchable combobox for program selection (search by name or code).
- Auto-formatting for PAN (uppercase, strip non-alphanumeric) and Aadhaar (auto-space every 4 digits).
- Program selection as a `Select` dropdown (Flows A, B, C; Active only; single-select).
- Flow A: program dropdown + identifier type dropdown (fixed 4 types) + value.
- Flow B: program dropdown + free-text value only.
- Flow C: program dropdown + auto-selected primary identifier badge + value.
- Flow D: free-text value only, no program, no type.
- Flow E: identifier type dropdown (fixed 4 types) + value, no program.
- Per-type format validation for Flows A, C, E.
- Generic destructive-action warning copy.
- Updated confirmation modal with flow-appropriate rows.
- Success / error / not-found toast notifications.
- Updated `Program` type with `supported_identifiers`; mock data for all 12 programs.

### Out of Scope

| Item | Reason |
|---|---|
| Multi-program deletion | See §12 for full rationale |
| "All Programs" option | Risk surface too broad |
| Draft / Inactive program deletion | Operators should not act on non-active programs |
| Real API integration | Mock only in this iteration |
| Audit log / deletion history | Separate service concern |
| Role-based access control changes | Assumed at route/shell level |
| Undo / soft delete | Not feasible given downstream constraints |
| Bulk delete by file upload | Future consideration |
| Aadhaar masking in modal | Deferred pending compliance review |
| Production A–E toggle | Toggle is dev-only; removed once production flow decided |

---

## 22. Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| OQ-1 | Which flow variant (A–E) is selected for production? | Product | 2 weeks after dev toggle ships |
| OQ-2 | Remove toggle from code or hide via env flag after evaluation? | Engineering | Same as OQ-1 |
| OQ-3 | Should Aadhaar be masked to last 4 digits in confirmation modal? | Product + Compliance | Before production go-live |
| OQ-4 | What happens on partial API failure (some deleted, some fail)? | Engineering + Backend | Before real API integration |
| OQ-5 | Should inactive / draft programs be targetable (e.g. draft data cleanup)? | Product | Before real API integration |
| OQ-6 | For Flow C, should the operator be able to switch to a different identifier type if needed, or is one-primary-per-program a firm constraint? | Product | Before real API integration |
| OQ-7 | Should the cross-program delete endpoint (Flows D/E) be scoped by tenant? | Backend | Before real API integration |
