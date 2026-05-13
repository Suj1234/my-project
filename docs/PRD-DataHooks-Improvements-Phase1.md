# PRD — Data Hooks Improvements · Phase 1

**Product:** Antigravity Journey Builder  
**Module:** Data Hooks (within Smart Block & Form Block configuration)  
**Status:** Ready for Implementation  
**Date:** 2026-05-13  
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

Type is inferred from the sample value's JavaScript type (`typeof`) with date detection for ISO date strings. Null values show `[null]` badge — open question on whether to hide them instead (see Q5).

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

## 4. Files Changing — Phase 1

| File | Changes |
|---|---|
| `DataHooksSection.tsx` | Card simplification (3.1), edit mode trigger (3.2), hide EventDecisionEditor (3.4) |
| `AddHookDialog.tsx` | Edit mode pre-fill + locked Step 1 (3.2), Step 1 card redesign (3.3) |
| `apiCatalog.ts` | Add `provider` field to all 6 APIs (3.3) |
| `ResponseTree.tsx` | Remove sample values, show type badges (3.5) |
| `RequestFieldTree.tsx` | Show type badges on input fields (3.6) |
| `src/app/types/apiIntegrationV1.ts` | Add `provider`, `category`, `latencyP95Ms` fields (3.7) |
| `DetailsTabV1.tsx` | Provider dropdown, Category dropdown, Latency field (3.7) |
| `ApiIntegrationsPageV1.tsx` | Remove method/auth columns + filters, add category/provider columns + filters, update mock data (3.8) |

**Total: 8 files. No new files created.**

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

---

## 6. Phase 2 — Planned for Later

| Feature | Notes |
|---|---|
| **Event Decision full implementation** | Re-introduce `EventDecisionEditor` with proper design. Currently hidden but data model preserved |
| **Decision Node on canvas** | Currently described as "config via Data Hooks" — needs reconnecting once Event Decision is live |
| **Duplicate API detection** | "Already added" badge on Step 1 card + confirmation prompt if CST proceeds |
| **Drag-to-reorder APIs within a slot** | Execution order matters when API B references API A's output |
| **API execution order enforcement** | Validation that downstream API inputs reference only upstream API outputs |
| **Live sync: V1 APIs → Data Hooks catalog** | Active V1 APIs auto-appear in Step 1. Inactive ones handled per Q3 |
| **Transformation steps UI** | Trim, regex extract, date format, join — types defined, UI not built |
| **Cross-slot output references in decision rules** | Decision rules see only own slot captures today |
| **Pagination for API catalog** | Only needed when catalog grows beyond ~50 entries |
| **Data Hooks on Merge / End blocks** | Future use case |

---

## 7. Open Questions — Pending Decisions

| # | Question | Owner | Impact |
|---|---|---|---|
| Q1 | **Duplicate API in same slot** — confirmation prompt (agreed approach) or hard block in future? | Product | Phase 2 scope |
| Q2 | **Category and Provider lists** — fixed platform-wide values, or tenant admins configure their own? | Product | Hardcoded dropdown vs tenant-configurable master data |
| Q3 | **V1 → Data Hooks bridge** — all active V1 APIs auto-appear, or admin marks each as "available in journeys"? When a V1 API goes inactive, does it disappear from existing journey configurations? | Product + Engineering | Phase 2 design |
| Q4 | **API execution order within a slot** — parallel or strict sequence? Can API 2 reference API 1's output in the same slot? | Engineering | Input mapping UX + execution model |
| Q5 | **Null values in response tree** — show `[null]` type badge, or hide null fields from capture entirely? | Design | ResponseTree edge case |
| Q6 | **Event Decision — Phase 2 design** — where exactly does verdict logic live? Inside each event slot (restored), or moved to a separate dedicated section? Does it replace Router block or complement it? | Product | Phase 2 architecture |

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
