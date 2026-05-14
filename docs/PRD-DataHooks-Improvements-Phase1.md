# PRD — Data Hooks Improvements · Phase 1

**Product:** Antigravity Journey Builder  
**Module:** Data Hooks (within Smart Block & Form Block configuration)  
**Status:** In Progress  
**Date:** 2026-05-14  
**Author:** Sujeet Kumar  

---

## 1. Background

Data Hooks allow journey builders (CST) to attach external API calls to lifecycle events within a Smart or Form block — for example, calling CIBIL after a PAN form is submitted to fetch the credit score, then routing the journey based on it.

The current implementation is functional but has several UX problems:
- The API cards inside event slots show too much raw detail (full input/output tables)
- No way to edit a configured API — only add or delete
- The Step 1 API catalog shows irrelevant information (emoji icons, input field count) and is missing useful metadata (provider, data type)
- The response tree shows raw sample values instead of clean field names with types
- The Event Decision block is visible inside each event slot but is not production-ready
- The API Integration V1 module (where APIs are defined at tenant level) lacks category, provider, and latency fields that the journey builder needs
- Input field mapping (Step 2) uses free-text inputs for source selection instead of structured dropdowns with type information
- No structured field catalog exists for native / custom / program configuration fields

This PRD covers Phase 1 — a focused UX and data model improvement sprint.

---

## 2. Goals

| Goal | Why |
|---|---|
| Simplify configured API cards | With 4–6 APIs per event slot, full input/output tables make the panel unreadable |
| Add edit support | CSTs have no way to correct a mapping mistake without deleting and re-adding the entire API |
| Clean up Step 1 API catalog | Emoji icons and input counts add noise; category + provider tags add signal |
| Show data types instead of sample values | CSTs need to know field types (date, number, boolean) to map correctly — raw values like "2026-03-20" are misleading |
| Hide Event Decision block | Feature is not production-ready; hiding it prevents confusion while data model is preserved for Phase 2 |
| Add provider + category to API Integration V1 | These are required for the catalog to be useful at tenant scale |
| Replace free-text source fields with structured dropdowns | Native, Custom, and Program Configuration fields should be selected from a catalog — not typed freehand |
| Show field structure after source selection | CSTs need to see the shape of complex fields (arrays, objects) to write correct extraction paths |
| Capture at all levels of the response tree | CSTs need to store entire objects, arrays, or the full response — not just leaf fields |

---

## 3. Phase 1 — What We Are Building

### 3.1 Simplify Configured API Cards in Event Slots

**File:** `DataHooksSection.tsx`

**Current state:** Each API card, when expanded, shows a full INPUTS table (one row per request field) and a full OUTPUTS table (one row per captured field). With 15–30 fields this makes the panel scroll endlessly. Also shows captures count ("2 captures") and manual inputs count ("0 manual inputs") in the header.

**New state:** API card shows only:
```
CBS Dedupe    [p95 800ms]    [✏ Edit]  [🗑 Delete]
```
No input rows. No output rows. No capture count. No manual inputs count. All detail is accessible via Edit.

---

### 3.2 Edit Support for Configured APIs

**Files:** `DataHooksSection.tsx`, `AddHookDialog.tsx`

**Current state:** Once an API is added to an event slot, it cannot be edited. The only option is delete and re-add, losing all mappings.

**New state:**
- Pencil icon on each API card opens the wizard in **Edit mode**
- Dialog title changes to: `"Edit CBS Dedupe"`
- **Step 1 is skipped** — wizard opens directly on Step 2 with a read-only locked header showing which API is being edited. API cannot be switched in edit mode
- Step 2 restores all existing input mappings
- Step 3 restores all existing output captures + transforms
- Footer button reads `"Update API ✓"` instead of `"Save API ✓"`
- On save, the existing binding is updated in-place — no duplicate is created

---

### 3.3 Step 1 API Catalog Card Redesign

**Files:** `AddHookDialog.tsx`, `apiCatalog.ts`

**Current state:** Each API card shows an emoji icon, category badge (single), description, and "N input fields" count.

**New state:**
- **Remove:** Emoji icon image
- **Remove:** "N input fields" count
- **Remove:** Old single category badge (Credit Bureau, Government, Dedupe, Internal CRM)
- **Add:** Two tags — `Category` tag + `Provider` tag
- **Search:** Searches by API name only (not category or provider)
- **No pagination** — search + scrollable list is the correct pattern for this volume

**Provider values assigned to existing APIs:**

| API | Category | Provider |
|---|---|---|
| CIBIL Bureau Report | Credit Bureau | CIBIL |
| CRM Customer Lookup | CRM | Internal |
| MCA Company Check | Government | MCA |
| CBS Dedupe | Dedupe | CBS |
| CMS Dedupe | Dedupe | CMS |
| LMS Dedupe | Dedupe | LMS |

---

### 3.4 Hide Event Decision Block

**File:** `DataHooksSection.tsx`

**Current state:** Each expanded event slot shows an `EventDecisionEditor` at the bottom — a rule builder where CSTs write PASS / REJECT / FLAG / MANUAL_REVIEW verdicts based on captured API outputs. The feature is incomplete and not ready for production use.

**New state:**
- The `EventDecisionEditor` component is **hidden from the UI** — not rendered inside event slots
- The underlying data model (`HookEventSlot.decisionConfig`, `DecisionBlockConfig`, `DecisionRule`, `DecisionCondition`) is **fully preserved** — no type changes, no data loss
- The `EventDecisionEditor` component file is kept intact — just not rendered
- Will be brought back in Phase 2 with a proper design

**What this means for CSTs:** They will no longer see the "Event Decision" section inside event slots. Verdict logic will be handled via Router block conditions in the meantime.

---

### 3.5 Data Type Badges — ResponseTree (Step 3)

**File:** `ResponseTree.tsx`

**Current state:** Leaf nodes show key + sample value:
```
generatedAt : "2026-03-20T10:00:00"    [+ Capture]
age         : 35                        [+ Capture]
isActive    : true                      [+ Capture]
```

**New state:** Show key + inferred data type badge, no raw value:
```
generatedAt    [date]      [+ Capture]
age            [number]    [+ Capture]
isActive       [boolean]   [+ Capture]
```

Type is inferred from the sample value's JavaScript type (`typeof`) with date detection for ISO date strings. Null values show `[null]` badge.

---

### 3.6 Data Type Badges — RequestFieldTree (Step 2)

**File:** `RequestFieldTree.tsx`

For consistency with Step 3, input fields in Step 2 also show a type badge next to the field label. Type is sourced from the `ApiRequestField` definition in `apiCatalog.ts`.

---

### 3.7 API Integration V1 — Add Category, Provider, Latency to Editor

**Files:** `src/app/types/apiIntegrationV1.ts`, `DetailsTabV1.tsx`

**DetailsTabV1 — new fields added to Overview tab:**
- **Provider** — dropdown
- **Category** — dropdown
- **Latency (p95)** — number input with `ms` unit label; stored as `latencyP95Ms`

**Category dropdown options:**
`Identity`, `Credit Bureau`, `KYC`, `Financial`, `Document`, `CRM`, `Government`, `Dedupe`, `Communication`

**Provider dropdown options:**
`CIBIL`, `Experian`, `Equifax`, `Perfios`, `NSDL`, `DigiLocker`, `MCA`, `CBS`, `CMS`, `LMS`, `Internal`, `Custom`

---

### 3.8 API Integration V1 — Table and Filter Changes

**File:** `ApiIntegrationsPageV1.tsx`

**Table columns:**
- **Remove:** `Method` column
- **Remove:** `Auth Type` column
- **Add:** `Category` column
- **Add:** `Provider` column
- Keep: Integration Name, Description, Status, Last Updated, Actions

**Filters:**
- **Remove:** Method dropdown filter
- **Remove:** Auth Type dropdown filter
- **Add:** Category dropdown filter
- **Add:** Provider dropdown filter
- Keep: Integration Name search + Status filter

**Mock data updates — Category + Provider assigned to all 10 existing entries:**

| Integration | Category | Provider |
|---|---|---|
| Credit Bureau Check | Credit Bureau | CIBIL |
| PAN Verification | KYC | NSDL |
| Bank Account Verification | Financial | Internal |
| Pincode Lookup | KYC | Internal |
| GST Verification | Government | Internal |
| Loan Application Status | Financial | Internal |
| Upload Loan Document | Document | Internal |
| CBS Dedupe | Dedupe | CBS |
| CMS Dedupe | Dedupe | CMS |
| LMS Dedupe | Dedupe | LMS |

---

### 3.9 Field Catalog — New `fieldCatalog.ts`

**File:** `src/app/data/fieldCatalog.ts` *(new)*

A program-level catalog of all selectable fields for Native, Custom, and Program Configuration source types. This is the single source of truth for field definitions used in Step 2 input mapping.

Each catalog field has:
- `key` — machine identifier
- `label` — human-readable name
- `dataType` — one of: `string | number | boolean | date | array | object`
- `sampleStructure` — representative shape (used for structure preview)

Program Configuration fields additionally have:
- `configuredValue` — the actual value configured for this journey program

**Catalogs defined:**

`NATIVE_FIELD_CATALOG` (12 fields): `first_name`, `last_name`, `dob`, `gender`, `pan_number`, `aadhaar_number`, `mobile`, `email`, `pincode`, `addresses` (array), `income_details` (object), `existing_loans` (array)

`CUSTOM_FIELD_CATALOG` (10 fields): `applicant_segment`, `existing_customer`, `credit_limit_requested`, `kyc_status`, `employment_details` (object), `address_history` (array), `document_ids` (object), `risk_flags` (array), `consent_timestamp`, `lead_source`

`PROGRAM_CONFIG_CATALOG` (8 fields): `loan_amount`, `product_type`, `tenure_months`, `interest_rate`, `processing_fee_pct`, `max_ltv_ratio`, `bureau_score_cutoff`, `repayment_mode`

---

### 3.10 Input Source Redesign — Step 2 (InputFieldMapper)

**File:** `InputFieldMapper.tsx`

#### 3.10.1 Source Type Rename

`Static` renamed to `Program Configuration` in the source type selector pills. The underlying type value changes from `'static'` to `'program_configuration'` in `InputSourceType`.

#### 3.10.2 All Source Types as Structured Dropdowns

**Current state:** Native uses a small hardcoded dropdown. Custom and Program Configuration use a free-text `Input`. User Input uses a dropdown from form fields. API Output uses a popover.

**New state — all five sources are structured dropdowns:**

| Source | Control | Options |
|---|---|---|
| Native | Select | From `NATIVE_FIELD_CATALOG` |
| Custom | Select | From `CUSTOM_FIELD_CATALOG` |
| Program Configuration | Select | From `PROGRAM_CONFIG_CATALOG` |
| User Input | Select | From form `userInputs` for this event |
| API Output | Inline Command combobox | Top-level keys from previous APIs in same event slot |

**Type badge on every option row** — full type name (`string`, `number`, `array`, `object`, `boolean`, `date`) shown as a coloured pill beside each field name in the dropdown.

Color coding:
- `string` — gray
- `number` — blue
- `array` — purple
- `object` — amber
- `boolean` — green
- `date` — rose
- `null` — gray muted

#### 3.10.3 API Output Source — Same-Slot Previous APIs Only

The API Output combobox is populated from the `sampleResponse` top-level keys of all APIs that appear **before the current API** in the same event slot's `apis[]` array. Cross-slot references are not allowed.

- **Execution model:** APIs in a slot run in strict sequence (index 0, 1, 2…). API at index N can see outputs from indices 0..N-1 in the same slot only.
- **Display:** Grouped by API name. Each item shows field key + type badge.
- **Implementation:** Uses inline expandable `Command` panel (not `Popover`) to avoid z-index conflicts inside `Dialog`.

#### 3.10.4 Field Info Box

The right-panel field info box shows:
- Field path in monospace blue (`code`)
- `Required` badge (destructive) if applicable
- ~~Parameter description~~ **removed** — adds clutter, path is self-descriptive

#### 3.10.5 Value / Structure Preview Panel

After selecting a source value, a preview panel appears between the source selector and the Extraction section.

| Source | Scalar field (string / number / date / boolean) | Complex field (array / object) |
|---|---|---|
| Native | Nothing shown | Schema preview (field names + type names, no actual values) |
| Custom | Nothing shown | Schema preview |
| API Output | Nothing shown | Schema preview |
| Program Configuration | Configured value (always shown, single box) | Configured value (always shown, single box) |
| User Input | Nothing | Nothing |

**Schema preview** — replaces every leaf value with its JavaScript type name (`"string"`, `"number"`, `"boolean"`, `null`), recursively. Arrays show only the first element's schema. This helps CSTs write correct extraction paths without exposing real data.

**Program Configuration preview** — a single indigo box labelled "Configured Value" showing the actual value configured for the program. No separate "Structure" sub-section.

---

### 3.11 Output Capture Improvements — Step 3 (ResponseTree)

**File:** `ResponseTree.tsx`  
**Type:** `OutputCapture` in `journey.ts`

#### 3.11.1 Remove `none` Store Type

`storeType: 'none'` is removed from `OutputCapture`. Only `'custom'` and `'native'` remain. The default when opening the capture panel is `'custom'`.

#### 3.11.2 Capture at All Levels

Previously, capture buttons only appeared on leaf fields. Now capture is available at every level of the response tree:

| Level | Trigger | `captureLevel` value |
|---|---|---|
| Leaf field | `+ Capture` button on the field row | `'field'` |
| Object node | `+ Capture` button beside the object key | `'object'` |
| Array node | `+ Capture array` button beside the array key | `'array'` |
| Entire response | `+ Capture entire response` button at top of tree | `'full_response'` |

`captureLevel` is stored on `OutputCapture` as: `'field' | 'object' | 'array' | 'full_response'`.

---

## 4. Files Changing — Phase 1

| File | Changes |
|---|---|
| `DataHooksSection.tsx` | Card simplification (3.1), edit mode trigger (3.2), hide EventDecisionEditor (3.4) |
| `AddHookDialog.tsx` | Edit mode pre-fill + locked Step 1 (3.2), Step 1 card redesign (3.3), API Output inline combobox (3.10.3), `ApiOutputField` full type names + `sampleValue` |
| `apiCatalog.ts` | Add `provider` field to all 6 APIs (3.3) |
| `ResponseTree.tsx` | Remove sample values, show type badges (3.5), capture at all levels (3.11.2), remove `none` storeType (3.11.1) |
| `RequestFieldTree.tsx` | Show type badges on input fields (3.6) |
| `InputFieldMapper.tsx` | All source dropdowns from catalog (3.10.2), type badges (3.10.2), field info box cleanup (3.10.4), value/structure preview panel (3.10.5) |
| `src/app/types/journey.ts` | Add `'program_configuration'` to `InputSourceType`, remove `'none'` from `OutputCapture.storeType`, add `captureLevel` to `OutputCapture` |
| `src/app/data/fieldCatalog.ts` *(new)* | `NATIVE_FIELD_CATALOG`, `CUSTOM_FIELD_CATALOG`, `PROGRAM_CONFIG_CATALOG` (3.9) |
| `src/app/types/apiIntegrationV1.ts` | Add `provider`, `category`, `latencyP95Ms` fields (3.7) |
| `DetailsTabV1.tsx` | Provider dropdown, Category dropdown, Latency field (3.7) |
| `ApiIntegrationsPageV1.tsx` | Remove method/auth columns + filters, add category/provider columns + filters, update mock data (3.8) |

**Total: 10 files. 1 new file.**

---

## 5. Decided NOT to Do (This Phase)

| Decision | Reason |
|---|---|
| No pagination in Step 1 API catalog | Search + scrollable list is correct. Pagination in a modal breaks the pick flow |
| No pagination for configured APIs inside event slot | Compact collapsed cards solve the density problem |
| No search inside event slot API list | You configured those APIs yourself — search on a short self-built list adds no value |
| Duplicate API detection — not in Phase 1 | Moved to Open Questions — confirmation prompt approach agreed but build deferred |
| "Already added" badge on Step 1 — not in Phase 1 | Same as above — part of duplicate detection feature |
| Drag to reorder APIs within a slot — deferred | Needs `@dnd-kit` integration. Separate UX chunk |
| API execution order enforcement — deferred | Depends on reorder feature |
| Live sync V1 → Data Hooks catalog — deferred | Requires backend API. Phase 1 adds data model only |
| Transformation steps UI — deferred | Types defined; UI build is standalone |
| Cross-slot output references in decision rules — deferred | By design for now |
| Data Hooks on Merge / End blocks — deferred | Not needed for current use cases |
| Journey persistence (save/load) — out of scope | Broader platform concern |
| `between` operator second value in decision rules — deferred | Data model supports it (`valueTo` exists), UI does not |
| Full response flattening to leaf paths — not needed | Extraction section handles navigation into complex fields; top-level keys + structure preview is sufficient |
| Free-text custom field entry — removed | Custom fields are now program-level catalog items, not ad-hoc strings |

---

## 6. Phase 2 — Planned for Later

| Feature | Notes |
|---|---|
| **Event Decision full implementation** | Re-introduce `EventDecisionEditor` with proper design. Currently hidden but data model preserved |
| **Decision Node on canvas** | Currently described as "config via Data Hooks" — needs reconnecting once Event Decision is live |
| **Duplicate API detection** | "Already added" badge on Step 1 card + confirmation prompt if CST proceeds |
| **Drag-to-reorder APIs within a slot** | Execution order matters when API B references API A's output |
| **API execution order enforcement** | Validation that downstream API inputs reference only upstream API outputs in same slot |
| **Live sync: V1 APIs → Data Hooks catalog** | Active V1 APIs auto-appear in Step 1. Inactive ones handled per Q3 |
| **Transformation steps UI** | Trim, uppercase, regex extract, date format, join — types and data model defined in Phase 1; UI not built |
| **Cross-slot output references in decision rules** | Decision rules see only own slot captures today |
| **Pagination for API catalog** | Only needed when catalog grows beyond ~50 entries |
| **Data Hooks on Merge / End blocks** | Future use case |
| **Admin-managed field catalog** | Native, Custom, and Program Config fields are currently hardcoded mock data. Phase 2 makes these tenant-configurable via an admin screen |
| **Program Configuration — real values from journey setup** | `configuredValue` in `PROGRAM_CONFIG_CATALOG` is currently mocked. Phase 2 reads actual program-level configuration set during journey setup |
| **User Input type metadata** | `FormInputField.type` drives the type badge today. Phase 2 should surface richer type constraints (min, max, regex) in the preview panel |

---

## 7. Open Questions — Pending Decisions

| # | Question | Owner | Status |
|---|---|---|---|
| Q1 | **Duplicate API in same slot** — confirmation prompt (agreed approach) or hard block in future? | Product | Deferred to Phase 2 |
| Q2 | **Category and Provider lists** — fixed platform-wide values, or tenant admins configure their own? | Product | Hardcoded dropdown vs tenant-configurable master data |
| Q3 | **V1 → Data Hooks bridge** — all active V1 APIs auto-appear, or admin marks each as "available in journeys"? When a V1 API goes inactive, does it disappear from existing journey configurations? | Product + Engineering | Deferred to Phase 2 |
| Q4 | **API execution order within a slot** | Engineering | **Resolved:** Strict sequence. API at index N can reference outputs from 0..N-1 in same slot only. Cross-slot references not allowed. |
| Q5 | **Null values in response tree** — show `[null]` type badge, or hide null fields from capture entirely? | Design | Open |
| Q6 | **Event Decision — Phase 2 design** — where exactly does verdict logic live? Inside each event slot (restored), or moved to a separate dedicated section? Does it replace Router block or complement it? | Product | Deferred to Phase 2 |
| Q7 | **Field catalog — how many fields per category?** Current mock has 12 native, 10 custom, 8 program config. Are these representative enough, or does Phase 1 need to expand? | Product | Open |
| Q8 | **Structure preview for API Output** — schema shows top-level keys only. If CST needs to extract a deeply nested field, should the schema recurse deeper (e.g. 2 levels)? | Design | Open |

---

## 8. Out of Scope (All Phases)

- Backend integration (all Phase 1 is frontend + mock data)
- Journey save / load / export
- Multi-condition operators per condition row in decision rules (AND/OR per pair)

---

## 9. Success Criteria — Phase 1

- [ ] CST can edit any configured API without deleting it
- [ ] Event slot API cards are compact — no tables, no counts in default state
- [ ] Event Decision block is hidden from all event slots
- [ ] Step 1 API catalog shows Category + Provider tags, no icons, no field count
- [ ] Step 3 response tree shows field names + type badges, no raw sample values
- [ ] Step 2 input fields show type badges consistently with Step 3
- [ ] API Integration V1 editor has Provider, Category, Latency fields
- [ ] V1 listing table shows Category + Provider columns; Method and Auth Type columns removed
- [ ] V1 filters show Category + Provider dropdowns; Method and Auth Type filters removed
- [ ] All 10 V1 mock integrations have Category + Provider values assigned
- [ ] Native, Custom, Program Configuration sources are all Select dropdowns from the field catalog — no free-text entry
- [ ] Every source dropdown shows a type badge (string / number / array / object / boolean / date) beside each option
- [ ] Structure preview appears for array/object fields from Native, Custom, API Output — shows schema (type names), not sample values
- [ ] Program Configuration shows configured value in a single box — no duplicate Structure sub-section
- [ ] Scalar source fields (string, number, date, boolean) show no preview panel
- [ ] Capture buttons available at field, object, array, and full-response level in Step 3
- [ ] `storeType: 'none'` is removed — only `custom` and `native` remain
- [ ] API Output combobox shows only top-level keys from previous APIs in the same event slot
- [ ] Field info box in Step 2 shows path + Required badge only — description removed
