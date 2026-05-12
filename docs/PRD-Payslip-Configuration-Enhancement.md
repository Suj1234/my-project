# Payslip Upload & Verification — Configuration Enhancement
**Document type:** Feature Design Document  
**Status:** Ready for Implementation  
**Date:** 2026-05-12  

---

## 1. Objective

Enhance the Payslip smart block with richer configuration options to support:
1. Flexible payslip validity window based on month-end grace period
2. Scanned document acceptance with automatic format handling
3. Async vs. sync analysis processing mode
4. Structured analysis output format selection

---

## 2. Block Identity

| Property | Value |
|---|---|
| Block ID | `payslip` |
| Block Name | Payslip Upload & Verification |
| Category | financial |
| Provider | Document OCR |
| Canvas color | Blue (Smart block) |
| File to modify | `src/app/data/blockDefinitions.ts` |

---

## 3. General Configuration — Full Specification

All 5 fields live flat inside `generalConfig[]` on the block definition.

### 3.1 Months Required
| Property | Value |
|---|---|
| ID | `months_required` |
| Label | Months Required |
| Type | `number` |
| Default | `3` |
| Description | How many months of payslips the applicant must upload |

---

### 3.2 Month-End Grace Period
| Property | Value |
|---|---|
| ID | `month_end_grace_period` |
| Label | Month-End Grace Period (days) |
| Type | `number` |
| Default | `10` |
| Description | If the applicant applies within the first N days of the current month, the current month is excluded from the required window |

**Logic:**
- Day 1–10 of current month (May) with 3 months required → Jan, Feb, Mar
- Day 11+ of current month (May) with 3 months required → Feb, Mar, Apr

**Helper text for CST:**  
*"Within the first [N] days of a new month, the current month's payslip is not yet expected. The required window will start from 2 months prior instead of 1."*

---

### 3.3 Support Scanned Statement
| Property | Value |
|---|---|
| ID | `support_scanned` |
| Label | Support Scanned Statement |
| Type | `toggle` (boolean) |
| Default | `false` |
| Description | Allow applicants to upload scanned physical payslips |

**Derived behavior:**
- Scanned OFF → PDF only accepted
- Scanned ON → PDF + JPG + PNG automatically accepted (no separate format config)

**Helper text for CST:**  
*"When enabled, JPG and PNG image uploads are accepted alongside PDF. Scanned documents may have lower OCR accuracy."*

---

### 3.4 Processing Mode
| Property | Value |
|---|---|
| ID | `processing_mode` |
| Label | Processing Mode |
| Type | `select` |
| Default | `wait` |
| Options | Wait for Analysis (`wait`) / Allow Applicant to Move Forward (`async`) |

**Wait mode behavior:**
- Applicant stays on screen after upload
- Spinner shown with "Check Status" button
- After 30 minutes → "Try Again" button shown; applicant re-uploads and must wait again before proceeding to BRE

**Async mode behavior:**
- Applicant moves forward in journey after upload
- Analysis runs in background
- Email sent to applicant on success and on failure
- Before BRE: system always checks analysis status
  - Pending → show "Payslip analysis in progress, please wait" screen
  - Failed → prompt re-upload; email sent with OTP-based resume link
  - Complete → proceed to BRE

**Fixed platform behaviors (both modes):**
| Scenario | Behavior |
|---|---|
| Pending > 30 min | Show "Try Again" button; applicant re-uploads |
| Analysis failed | Email sent to applicant with OTP login + resume link |
| Analysis success | Confirmation email sent to applicant |
| Before BRE gate | Always checks status; pending blocks until resolved |

**Retry count:** Governed by the block's existing Retry Configuration (`max_attempts`). Applies to all re-upload scenarios — inline retry (wait mode) and email resume re-upload (async mode).

---

### 3.5 Analysis Output Format
| Property | Value |
|---|---|
| ID | `analysis_output_format` |
| Label | Analysis Output Format |
| Type | `select` |
| Default | `json` |
| Options | JSON (`json`) / XML (`xml`) / XLS (`xls`) |
| Description | Format in which the OCR analysis result is returned by the Document OCR provider |

---

## 4. Checks — Full Specification

### 4.1 Name Match with Applicant
| Property | Value |
|---|---|
| ID | `name_match` |
| Default enabled | `false` |
| Default outputResponse | `reject` |

**Sub-fields:**
| Field ID | Label | Type | Default | Options |
|---|---|---|---|---|
| `source` | Name Source | select | _(empty)_ | PAN / Aadhaar |
| `threshold` | Match Threshold % | number | `60` | |

---

### 4.2 Employer Match
| Property | Value |
|---|---|
| ID | `employer_match` |
| Default enabled | `false` |
| Default outputResponse | `reject` |

**Sub-fields:**
| Field ID | Label | Type | Default |
|---|---|---|---|
| `threshold` | Match Threshold % | number | `70` |

---

## 5. Retry Configuration

| Field | Default |
|---|---|
| Max Attempts | 3 |
| Cooling Period | 0 sec |
| Velocity Cycle | 1 |

Applies to all re-upload attempts regardless of processing mode.

---

## 6. Pages

| Page ID | Page Name | Actions |
|---|---|---|
| `payslip_upload` | Payslip Upload Page | Payslip uploaded |
| `payslip_confirmed` | Payslip Confirmation Page | Payslip confirmed |

No user inputs on either page — all data is OCR-extracted, not manually entered.

---

## 7. Data Hook Event Slots

Auto-generated by `getDefaultHookEventSlots()` based on pages:

| Event Key | Label |
|---|---|
| `before_payslip_upload` | Before Payslip Upload |
| `after_payslip_upload` | After Payslip Upload |
| `before_payslip_confirmed` | Before Payslip Confirmation |
| `after_payslip_confirmed` | After Payslip Confirmation |

---

## 8. blockDefinitions.ts — Target Shape

```typescript
{
  id: 'payslip',
  name: 'Payslip Upload & Verification',
  description: 'Collect and verify salary slips from salaried applicants. Configurable for the last N months with automated OCR extraction of salary, employer name, and deductions for income assessment.',
  category: 'financial',
  icon: 'FileText',
  provider: 'Document OCR',
  hasChecks: true,
  hasRetry: true,
  pages: [
    {
      id: 'payslip_upload',
      name: 'Payslip Upload Page',
      actions: ['Payslip uploaded'],
      userInputs: [],
    },
    {
      id: 'payslip_confirmed',
      name: 'Payslip Confirmation Page',
      actions: ['Payslip confirmed'],
      userInputs: [],
    },
  ],
  generalConfig: [
    {
      id: 'months_required',
      name: 'Months Required',
      type: 'number',
      value: 3,
    },
    {
      id: 'month_end_grace_period',
      name: 'Month-End Grace Period (days)',
      type: 'number',
      value: 10,
    },
    {
      id: 'support_scanned',
      name: 'Support Scanned Statement',
      type: 'toggle',
      value: false,
    },
    {
      id: 'processing_mode',
      name: 'Processing Mode',
      type: 'select',
      value: 'wait',
      options: [
        { label: 'Wait for Analysis', value: 'wait' },
        { label: 'Allow Applicant to Move Forward', value: 'async' },
      ],
    },
    {
      id: 'analysis_output_format',
      name: 'Analysis Output Format',
      type: 'select',
      value: 'json',
      options: [
        { label: 'JSON', value: 'json' },
        { label: 'XML', value: 'xml' },
        { label: 'XLS', value: 'xls' },
      ],
    },
  ],
  checks: [
    {
      id: 'name_match',
      name: 'Name Match with Applicant',
      enabled: false,
      outputResponse: 'reject',
      fields: [
        {
          id: 'source',
          name: 'Name Source',
          type: 'select',
          value: '',
          options: [
            { label: 'PAN', value: 'pan' },
            { label: 'Aadhaar', value: 'aadhaar' },
          ],
        },
        {
          id: 'threshold',
          name: 'Match Threshold %',
          type: 'number',
          value: 60,
        },
      ],
    },
    {
      id: 'employer_match',
      name: 'Employer Match',
      enabled: false,
      outputResponse: 'reject',
      fields: [
        {
          id: 'threshold',
          name: 'Match Threshold %',
          type: 'number',
          value: 70,
        },
      ],
    },
  ],
  retryConfig: [
    {
      id: 'payslip_upload_retry',
      name: 'Payslip Upload Retry',
      maxAttempts: 3,
      coolingPeriod: 0,
      velocityCycle: 1,
    },
  ],
}
```

---

## 9. Open Items

| # | Item | Owner |
|---|---|---|
| 1 | `toggle` is not a current `GeneralConfigField` type in `journey.ts` — needs type union extension before implementation | Dev |
| 2 | ConfigurationPanel rendering for `toggle` type fields needs a new render case | Dev |
| 3 | 30-min timeout and OTP resume flow are platform behaviors — confirm backend contract before BRE gate implementation | Backend |
