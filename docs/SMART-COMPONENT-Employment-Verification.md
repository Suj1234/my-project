# Smart Component: Employment & Professional Verification

> Document Status: Design Complete — Pending Implementation
> Last Updated: 2026-06-04
> Author: Design session with Sujeet Kumar

---

## 1. Overview

The **Employment & Professional Verification** smart component collects and verifies employment details for two applicant segments:

- **Salaried:** Verifies active employment via EPF records using PAN (EVA PAN Flow) or UAN (EPF UAN Validation)
- **Self-Employed Professional (SEP):** Verifies active professional membership via respective body APIs (ICAI, NMC, ICSI, ICWAI, CoA)

This block is required in virtually every credit journey — personal loans, home loans, credit cards, BNPL, insurance underwriting. It is one of the most reusable smart components in the system.

**Why a Smart Component (not a Form Block):**
- Calls live verification APIs at block completion
- Has configurable checks (Name Match, Employment Status, Tenure, Membership Active)
- Has retry logic for API failures
- Adaptive UI — fields change based on employment type and verification mode
- Supports multiple verification modes controlled by CST

---

## 2. Block Metadata

| Field | Value |
|---|---|
| ID | `employment_verification` |
| Name | Employment & Professional Verification |
| Description | Verify employment status for salaried employees and professional membership for self-employed professionals |
| Category | `profile` |
| Icon | `briefcase` |
| Provider | `TKYC` |
| hasChecks | `true` |
| hasRetry | `true` |

---

## 3. Page Definition

**Total Pages: 1**

### Page: Employment Details

| Field | Value |
|---|---|
| ID | `employment_details` |
| Name | Employment Details |
| Actions | `["verify"]` |

### 3.1 User Inputs

| # | Field ID | Display Label | Input Type | Required | Shown When |
|---|---|---|---|---|---|
| 1 | `employment_type` | Employment Type | select | Yes | Always |
| 2 | `pan_number` | PAN Number | text | Yes | employment_type = salaried AND mode = pan_entered_here |
| 3 | `uan_number` | Current Employer UAN | text | Yes | employment_type = salaried AND mode = uan_entered_here |
| 4 | `profession_type` | Profession Type | select | Yes | employment_type = sep |
| 5 | `membership_number` | Membership / Registration Number | text | Yes | employment_type = sep |
| 6 | `medical_council` | Medical Council | select | Yes | employment_type = sep AND profession_type = doctor |

### 3.2 employment_type Dropdown Options

| Display Label | Value |
|---|---|
| Salaried | `salaried` |
| Self-Employed Professional | `sep` |

> The options shown in this dropdown are filtered at runtime by `allowed_employment_types` general config. If CST sets allowed types to Salaried only, SEP option is hidden.

### 3.3 profession_type Dropdown Options

| Display Label | Value |
|---|---|
| Chartered Accountant | `chartered_accountant` |
| Doctor | `doctor` |
| Company Secretary | `company_secretary` |
| Cost Accountant | `cost_accountant` |
| Architect | `architect` |

> The options shown are filtered at runtime by `allowed_profession_types` general config.

### 3.4 membership_number Label — Changes by Profession

| Profession | Label |
|---|---|
| Chartered Accountant | Membership Number |
| Doctor | Registration Number |
| Company Secretary | Membership Number |
| Cost Accountant | Membership Number |
| Architect | Registration Number |

### 3.5 medical_council Dropdown Options (34 councils)

| Display Label | Value |
|---|---|
| Andhra Pradesh Medical Council | `andhra_pradesh` |
| Assam Medical Council | `assam` |
| Bihar Medical Council | `bihar` |
| Bombay Medical Council | `bombay` |
| Chandigarh Medical Council | `chandigarh` |
| Chhattisgarh Medical Council | `chhattisgarh` |
| Delhi Medical Council | `delhi` |
| Goa Medical Council | `goa` |
| Gujarat Medical Council | `gujarat` |
| Haryana Medical Council | `haryana` |
| Himachal Pradesh Medical Council | `himachal_pradesh` |
| Hyderabad Medical Council | `hyderabad` |
| Jammu & Kashmir Medical Council | `jammu_kashmir` |
| Jharkhand Medical Council | `jharkhand` |
| Karnataka Medical Council | `karnataka` |
| Kerala Medical Council | `kerala` |
| Madhya Pradesh Medical Council | `madhya_pradesh` |
| Maharashtra Medical Council | `maharashtra` |
| Manipur Medical Council | `manipur` |
| Meghalaya Medical Council | `meghalaya` |
| Mizoram Medical Council | `mizoram` |
| Nagaland Medical Council | `nagaland` |
| Odisha Medical Council | `odisha` |
| Punjab Medical Council | `punjab` |
| Rajasthan Medical Council | `rajasthan` |
| Sikkim Medical Council | `sikkim` |
| Tamil Nadu Medical Council | `tamil_nadu` |
| Telangana State Medical Council | `telangana` |
| Travancore Cochin Medical Council | `travancore_cochin` |
| Tripura Medical Council | `tripura` |
| Uttar Pradesh Medical Council | `uttar_pradesh` |
| Uttarakhand Medical Council | `uttarakhand` |
| West Bengal Medical Council | `west_bengal` |
| National Medical Commission (NMC) | `nmc` |

---

## 4. API Integrations

### 4.1 Salaried Verification

There are 3 verification modes, CST-configured via `salaried_verification_mode` general config.

---

#### Mode 1: PAN from Upstream

| Field | Value |
|---|---|
| API | EVA PAN Flow (Employment Verification Advanced) |
| Trigger | PAN auto-passed from an upstream PAN verification block |
| User Input Required | None — PAN comes from journey context |

**API Request:**
```json
{
  "pan": "<from_upstream>",
  "isLatestEmployer": true,
  "runPanFlow": true,
  "consent": "Y"
}
```

**Key Response Fields Used:**

| Purpose | JSON Path |
|---|---|
| Current Employer Name | `result.summary.uanLookup.currentEmployer` |
| Date of Joining | `result.uan[0].employer[isEmployed=true].dateOfJoining` |
| Employment Active | `result.nameLookup.isEmployed` |
| Name Match Score | `result.summary.uanLookup.matchScore` |
| Name Match Boolean | `result.summary.uanLookup.uanNameMatch` |

---

#### Mode 2: PAN Entered Here

| Field | Value |
|---|---|
| API | EVA PAN Flow (same as Mode 1) |
| Trigger | User manually enters PAN number on this page |
| User Input Required | `pan_number` field shown on page |

Same request/response as Mode 1, using the PAN the user typed.

---

#### Mode 3: UAN Entered Here

| Field | Value |
|---|---|
| API | EPF UAN Validation |
| Trigger | User enters their current employer UAN |
| User Input Required | `uan_number` field shown on page |

**API Request:**
```json
{
  "uan": "<entered_by_user>",
  "isLatestEmployer": true,
  "consent": "Y"
}
```

> `isLatestEmployer: true` returns only the latest employer record — no full history needed.

**Key Response Fields Used:**

| Purpose | JSON Path |
|---|---|
| Employer Name | `result.employers[0].establishmentName` |
| Employment Start | `result.employers[0].startMonthYear` |
| Last Active Month | `result.employers[0].lastMonthYear` |
| Total EPF Experience | `result.summary.minimumWorkExperienceInMonths` |

**Current Employer Validation Logic:**
```
IF lastMonthYear == null OR empty          → Currently Employed ✓
IF lastMonthYear within epf_activity_lag_days of today → Currently Employed ✓ (EPF reporting lag)
IF lastMonthYear older than epf_activity_lag_days     → Employment Ended ✗
  → Show error: "This UAN does not show active current employment. Please check and try again."
```

**Multiple Active Employers (PAN Modes Only):**
When EVA returns multiple employers with `isEmployed: true` (common due to EPF exit filing delays):
- **Always:** Auto-select the employer with the most recent `startMonthYear` / `dateOfJoining`
- **If `allow_multiple_active_employments = false`:** Flag the case for manual review (journey continues, CST notified)
- **If `allow_multiple_active_employments = true`:** Proceed silently with the most recent employer

---

### 4.2 SEP Verification

All SEP APIs use `isLatestEmployer` is not applicable — professional body APIs return current membership status directly.

---

#### Chartered Accountant — CA Membership Authentication (ICAI)

| Field | Value |
|---|---|
| API | CA Membership Authentication |
| Input | Membership Number (6-digit, e.g., `123456`) |

**API Request:**
```json
{ "membershipNumber": "<entered>", "consent": "Y" }
```

**Result Fields:** Name, Membership No., Status (Active/Inactive), Valid Until

---

#### Doctor — NMC / State Medical Council Authentication

| Field | Value |
|---|---|
| API | NMC / State Medical Council Authentication |
| Inputs | Registration Number + Medical Council (from dropdown) |

**API Request:**
```json
{ "registrationNumber": "<entered>", "medicalCouncil": "<selected>", "consent": "Y" }
```

**Year of Registration:** Auto-extracted from first 4 digits of registration number.
```
Example: "2010103028" → Year = "2010"  (no separate field shown to user)
```

**Result Fields:** Name, Registration No., Status, Valid Until

---

#### Company Secretary — ICSI Membership Authentication

| Field | Value |
|---|---|
| API | ICSI Membership Authentication |
| Input | Membership Number (letter prefix + digits, e.g., `A123456`) |

**API Request:**
```json
{ "membershipNumber": "<entered>", "consent": "Y" }
```

**Result Fields:** Name, Membership No., Status, Valid Until

---

#### Cost Accountant — ICWAI Membership Authentication (Individual)

| Field | Value |
|---|---|
| API | ICWAI Membership Authentication |
| Input | Membership Number (numeric) |
| Note | Individual only — firm authentication not in scope |

**API Request:**
```json
{ "membershipNumber": "<entered>", "consent": "Y" }
```

**Result Fields:** Name, Membership No., Status, Valid Until

---

#### Architect — Council of Architecture Authentication

| Field | Value |
|---|---|
| API | Council of Architecture (CoA) Authentication |
| Input | Registration Number (e.g., `CA/2010/12345`) |

**API Request:**
```json
{ "registrationNumber": "<entered>", "consent": "Y" }
```

**Result Fields:** Name, Registration No., Status, Valid Until

---

## 5. Result Display

Shown on the page after successful API verification.

### Salaried — PAN Modes (EVA)

| Field | Source |
|---|---|
| Employer Name | `summary.uanLookup.currentEmployer` |
| Date of Joining | `uan[0].employer[isEmployed=true].dateOfJoining` |
| Employment Status | `nameLookup.isEmployed` → "Active" / "Inactive" |

### Salaried — UAN Mode (EPF)

| Field | Source |
|---|---|
| Employer Name | `employers[0].establishmentName` |
| Employment Start | `employers[0].startMonthYear` |
| Employment Status | Derived from `lastMonthYear` → "Active" / "Inactive" |
| Total EPF Experience | `summary.minimumWorkExperienceInMonths` months |

### SEP — All Professions (Common Fields)

| Field | Source |
|---|---|
| Name | Professional body API response |
| Membership / Registration No. | As entered by user (confirmed by API) |
| Status | Active / Expired / Suspended |
| Valid Until | Date returned by API |

---

## 6. General Configuration

CST-configurable settings shown in the Configuration Panel → General Config tab.

| # | ID | Label | Type | Default | Condition |
|---|---|---|---|---|---|
| 1 | `allowed_employment_types` | Allowed Employment Types | multiselect | Salaried + SEP | Always shown |
| 2 | `salaried_verification_mode` | Salaried Verification Mode | select | PAN from Upstream | Shown when Salaried is in `allowed_employment_types` |
| 3 | `allowed_profession_types` | Allowed Profession Types | multiselect | All 5 | Shown when SEP is in `allowed_employment_types` |
| 4 | `sep_verification_required` | Require API Verification for SEP | toggle | true | Shown when SEP is in `allowed_employment_types` |
| 5 | `name_match_threshold` | Name Match Threshold (%) | number | 80 | Always shown. Hint: "Minimum confidence score for name verification (0–100)" |
| 6 | `allow_multiple_active_employments` | Allow Multiple Active Employments | toggle | false | Shown when mode = PAN from Upstream or PAN Entered Here |
| 7 | `epf_activity_lag_days` | EPF Activity Lag Tolerance (days) | number | 60 | Shown when mode = UAN Entered Here. Hint: "Days after last EPF contribution before employment is considered inactive. Industry standard: 60 days." |

### General Config — Dropdown Option Values

**allowed_employment_types (multiselect):**
- `salaried` — Salaried
- `sep` — Self-Employed Professional

**salaried_verification_mode (select):**
- `pan_from_upstream` — PAN from Upstream
- `pan_entered_here` — PAN Entered Here
- `uan_entered_here` — UAN Entered Here

**allowed_profession_types (multiselect):**
- `chartered_accountant` — Chartered Accountant
- `doctor` — Doctor
- `company_secretary` — Company Secretary
- `cost_accountant` — Cost Accountant
- `architect` — Architect

---

## 7. Checks

Four checks, configurable per-check in the Configuration Panel → Checks tab.

---

### Check 1 — Name Match

| Field | Value |
|---|---|
| ID | `name_match` |
| Applies To | All modes (salaried + SEP) |
| Default | Enabled |
| outputResponse | `reject` |

**Check Fields:**

| ID | Label | Type | Default | Options |
|---|---|---|---|---|
| `match_threshold` | Match Threshold (%) | number | 80 | — |
| `on_failure` | On Failure | select | reject | Reject / Flag for Review |

**Source by mode:**
- PAN modes (EVA): `summary.uanLookup.matchScore` + `uanNameMatch`
- UAN mode: Separate name match API *(API TBD — see Open Questions)*
- SEP modes: Name from professional body API vs applicant name in journey

**UAN mode note (shown in panel):** *"Name match for UAN mode uses a separate verification API"*

---

### Check 2 — Active Employment Status

| Field | Value |
|---|---|
| ID | `active_employment_status` |
| Applies To | Salaried only |
| Default | Enabled |
| outputResponse | `reject` |

**Check Fields:**

| ID | Label | Type | Default | Options |
|---|---|---|---|---|
| `on_failure` | On Failure | select | reject | Reject / Flag for Review |

**Logic by mode:**
- PAN modes: `result.nameLookup.isEmployed === true`
- UAN mode: `lastMonthYear` is null or within `epf_activity_lag_days` of today

---

### Check 3 — Minimum Employment Tenure

| Field | Value |
|---|---|
| ID | `minimum_employment_tenure` |
| Applies To | Salaried only |
| Default | Enabled |

**Check Fields:**

| ID | Label | Type | Default | Options |
|---|---|---|---|---|
| `minimum_months` | Minimum Months | number | 6 | — |
| `on_failure` | On Failure | select | flag | Reject / Flag for Review |

**Logic by mode:**
- PAN modes: Calculate months from `uan[0].employer[isEmployed].dateOfJoining` to today
- UAN mode: Calculate months from `employers[0].startMonthYear` to today

---

### Check 4 — Professional Membership Active

| Field | Value |
|---|---|
| ID | `professional_membership_active` |
| Applies To | SEP only |
| Default | Enabled |
| outputResponse | `reject` |

**Check Fields:**

| ID | Label | Type | Default | Options |
|---|---|---|---|---|
| `on_failure` | On Failure | select | reject | Reject / Flag for Review |

**Logic:** Professional body API returns `status = "Active"` or equivalent active state.

---

## 8. Retry Configuration

| # | ID | Name | maxAttempts | coolingPeriod | velocityCycle |
|---|---|---|---|---|---|
| 1 | `employment_verification_retry` | Employment Verification Retry | 3 | 24 hours | 24 hours |
| 2 | `professional_verification_retry` | Professional Verification Retry | 3 | 24 hours | 24 hours |

---

## 9. Hook Integration Guide (HIG)

> **Status: To be completed**

Auto-generated Hook Event Slots from page name:

| Event Key | Label |
|---|---|
| `before_employment_details` | Before Employment Details |
| `after_employment_details` | After Employment Details |

Hook configurations (input mappings, output captures, decision rules) to be documented in a separate session.

Typical use cases for hooks on this block:
- `before_employment_details` — Pre-fill PAN from upstream / call risk scoring API before page loads
- `after_employment_details` — Store verified employment details, trigger bureau pull, update applicant segment

---

## 10. Implementation Details

### 10.1 Files to Create / Modify

| File | Action | What to Do |
|---|---|---|
| `src/app/data/blockDefinitions.ts` | Modify | Add `employment_verification` object to `SMART_BLOCKS` array |
| `src/app/types/journey.ts` | Modify | Add `options` field to `FormInputField` interface for select-type user inputs |
| `src/app/data/blockDefinitions.ts` | Modify | Add short description in `getShortDescription()` function |
| `src/app/components/BlockLibrary.tsx` | Verify | Confirm block appears in sidebar under Profile category |

### 10.2 TypeScript Block Definition

```typescript
{
  id: 'employment_verification',
  name: 'Employment & Professional Verification',
  description: 'Verify employment status for salaried employees and professional membership for self-employed professionals',
  category: 'profile',
  icon: 'briefcase',
  provider: 'TKYC',
  hasChecks: true,
  hasRetry: true,

  pages: [
    {
      id: 'employment_details',
      name: 'Employment Details',
      actions: ['verify'],
      userInputs: [
        {
          id: 'employment_type',
          name: 'Employment Type',
          type: 'select',
          required: true,
          fieldSource: 'native',
          key: 'employment_type',
        },
        {
          id: 'pan_number',
          name: 'PAN Number',
          type: 'text',
          required: true,
          fieldSource: 'native',
          key: 'pan_number',
          // Shown when: employment_type = salaried AND salaried_verification_mode = pan_entered_here
        },
        {
          id: 'uan_number',
          name: 'Current Employer UAN',
          type: 'text',
          required: true,
          fieldSource: 'custom',
          key: 'uan_number',
          // Shown when: employment_type = salaried AND salaried_verification_mode = uan_entered_here
        },
        {
          id: 'profession_type',
          name: 'Profession Type',
          type: 'select',
          required: true,
          fieldSource: 'custom',
          key: 'profession_type',
          // Shown when: employment_type = sep
        },
        {
          id: 'membership_number',
          name: 'Membership / Registration Number',
          type: 'text',
          required: true,
          fieldSource: 'custom',
          key: 'membership_number',
          // Shown when: employment_type = sep
          // Label changes at runtime based on profession_type
        },
        {
          id: 'medical_council',
          name: 'Medical Council',
          type: 'select',
          required: true,
          fieldSource: 'custom',
          key: 'medical_council',
          // Shown when: employment_type = sep AND profession_type = doctor
        },
      ],
    },
  ],

  generalConfig: [
    {
      id: 'allowed_employment_types',
      name: 'Allowed Employment Types',
      type: 'multiselect',
      value: ['salaried', 'sep'],
      options: [
        { label: 'Salaried', value: 'salaried' },
        { label: 'Self-Employed Professional', value: 'sep' },
      ],
    },
    {
      id: 'salaried_verification_mode',
      name: 'Salaried Verification Mode',
      type: 'select',
      value: 'pan_from_upstream',
      options: [
        { label: 'PAN from Upstream', value: 'pan_from_upstream' },
        { label: 'PAN Entered Here', value: 'pan_entered_here' },
        { label: 'UAN Entered Here', value: 'uan_entered_here' },
      ],
      dependsOn: 'allowed_employment_types',
      showWhen: 'salaried',
    },
    {
      id: 'allowed_profession_types',
      name: 'Allowed Profession Types',
      type: 'multiselect',
      value: ['chartered_accountant', 'doctor', 'company_secretary', 'cost_accountant', 'architect'],
      options: [
        { label: 'Chartered Accountant', value: 'chartered_accountant' },
        { label: 'Doctor', value: 'doctor' },
        { label: 'Company Secretary', value: 'company_secretary' },
        { label: 'Cost Accountant', value: 'cost_accountant' },
        { label: 'Architect', value: 'architect' },
      ],
      dependsOn: 'allowed_employment_types',
      showWhen: 'sep',
    },
    {
      id: 'sep_verification_required',
      name: 'Require API Verification for SEP',
      type: 'toggle',
      value: true,
      dependsOn: 'allowed_employment_types',
      showWhen: 'sep',
    },
    {
      id: 'name_match_threshold',
      name: 'Name Match Threshold (%)',
      type: 'number',
      value: 80,
      hint: 'Minimum confidence score required for name verification to pass (0–100)',
    },
    {
      id: 'allow_multiple_active_employments',
      name: 'Allow Multiple Active Employments',
      type: 'toggle',
      value: false,
      dependsOn: 'salaried_verification_mode',
      showWhen: ['pan_from_upstream', 'pan_entered_here'],
    },
    {
      id: 'epf_activity_lag_days',
      name: 'EPF Activity Lag Tolerance (days)',
      type: 'number',
      value: 60,
      dependsOn: 'salaried_verification_mode',
      showWhen: 'uan_entered_here',
      hint: 'Days after last EPF contribution before employment is considered inactive. Industry standard: 60 days.',
    },
  ],

  checks: [
    {
      id: 'name_match',
      name: 'Name Match',
      enabled: true,
      outputResponse: 'reject',
      fields: [
        {
          id: 'match_threshold',
          name: 'Match Threshold (%)',
          type: 'number',
          value: 80,
        },
        {
          id: 'on_failure',
          name: 'On Failure',
          type: 'select',
          value: 'reject',
          options: [
            { label: 'Reject', value: 'reject' },
            { label: 'Flag for Review', value: 'flag' },
          ],
        },
      ],
    },
    {
      id: 'active_employment_status',
      name: 'Active Employment Status',
      enabled: true,
      outputResponse: 'reject',
      fields: [
        {
          id: 'on_failure',
          name: 'On Failure',
          type: 'select',
          value: 'reject',
          options: [
            { label: 'Reject', value: 'reject' },
            { label: 'Flag for Review', value: 'flag' },
          ],
        },
      ],
    },
    {
      id: 'minimum_employment_tenure',
      name: 'Minimum Employment Tenure',
      enabled: true,
      fields: [
        {
          id: 'minimum_months',
          name: 'Minimum Months',
          type: 'number',
          value: 6,
        },
        {
          id: 'on_failure',
          name: 'On Failure',
          type: 'select',
          value: 'flag',
          options: [
            { label: 'Reject', value: 'reject' },
            { label: 'Flag for Review', value: 'flag' },
          ],
        },
      ],
    },
    {
      id: 'professional_membership_active',
      name: 'Professional Membership Active',
      enabled: true,
      outputResponse: 'reject',
      fields: [
        {
          id: 'on_failure',
          name: 'On Failure',
          type: 'select',
          value: 'reject',
          options: [
            { label: 'Reject', value: 'reject' },
            { label: 'Flag for Review', value: 'flag' },
          ],
        },
      ],
    },
  ],

  retryConfig: [
    {
      id: 'employment_verification_retry',
      name: 'Employment Verification Retry',
      maxAttempts: 3,
      coolingPeriod: 24,
      velocityCycle: 24,
    },
    {
      id: 'professional_verification_retry',
      name: 'Professional Verification Retry',
      maxAttempts: 3,
      coolingPeriod: 24,
      velocityCycle: 24,
    },
  ],
}
```

### 10.3 Implementation Notes

**Note 1 — FormInputField missing `options`:**
The `FormInputField` interface in `journey.ts` does not currently have an `options` field. The `employment_type`, `profession_type`, and `medical_council` fields are select types whose options need to be rendered. Two approaches:
- Add `options?: { label: string; value: string }[]` to `FormInputField` interface
- OR define options statically in the rendering component keyed by `field.key`

Recommendation: Add `options` to `FormInputField` — cleaner and consistent with `GeneralConfigField` and `CheckField` which already have it.

**Note 2 — Adaptive field visibility:**
`pan_number`, `uan_number`, `profession_type`, `membership_number`, `medical_council` are conditionally shown based on other field values and `salaried_verification_mode` general config. This logic must be implemented in the journey runtime rendering engine, not just the ConfigurationPanel.

**Note 3 — Dynamic `membership_number` label:**
The label for `membership_number` changes based on `profession_type`. Runtime rendering engine must handle this. The block definition stores the generic label "Membership / Registration Number".

**Note 4 — `allowed_employment_types` and `allowed_profession_types` as multiselect:**
The `multiselect` type in `GeneralConfigField` stores `value` as `string[]`. Ensure ConfigurationPanel handles array comparison for `dependsOn` / `showWhen` with multiselect parents (e.g., `showWhen: 'salaried'` means array includes `'salaried'`).

---

## 11. Open Questions

| # | Question | Context |
|---|---|---|
| OQ-1 | What is the separate name match API for UAN mode? | Check 1 (Name Match) in UAN mode cannot use EVA (no PAN call). A separate name-matching API is needed. Need API name, request params, and response structure. |
| OQ-2 | When `allow_multiple_active_employments = false` and multiple active employers found — is auto-select + flag for review correct? | Market standard is to flag rather than hard-reject. To be confirmed. |
| OQ-3 | SEP with `sep_verification_required = false` — what fields does the user fill? | Deferred — to be designed in a later session. |
| OQ-4 | Is year-of-registration always extractable from first 4 digits across all 34 medical councils? | Some councils may use different registration number formats. Needs validation with TKYC. |
