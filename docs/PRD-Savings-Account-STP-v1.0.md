# Product Requirements Document
## Savings Account — Straight Through Processing (STP) Journey
### Version: 1.0 | Phase: 1
### Date: 2026-05-11
### Prepared by: Product Team
### Status: Draft

---

## Document Control

### Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-05-11 | Product Team | Initial PRD — Phase 1 Web STP Journey (ETB + NTB) |
| 1.1 | 2026-05-11 | Product Team | Implementation update — mobile-first entry for ETB (no account number); account creation moved to eSign data hooks; 17-block canvas map aligned with Journey Builder build |

### Document Classification
Internal — Confidential

### Reviewers

| Role | Name | Sign-off Date |
|------|------|---------------|
| Engineering Lead | | |
| UX Lead | | |
| Business Analyst | | |
| QA Lead | | |
| Product Owner | | |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Product Overview](#2-product-overview)
3. [User Personas & Journey Types](#3-user-personas--journey-types)
4. [High-Level Journey Flow](#4-high-level-journey-flow)
5. [Journey Builder — Block Map](#5-journey-builder--block-map)
6. [Screen-by-Screen Specifications](#6-screen-by-screen-specifications)
7. [Business Rules Engine (BRE)](#7-business-rules-engine-bre)
8. [Deduplication Logic](#8-deduplication-logic)
9. [System Integrations](#9-system-integrations)
10. [Error Handling & Edge Cases](#10-error-handling--edge-cases)
11. [Communication Templates](#11-communication-templates)
12. [Drop-off & Resume Logic](#12-drop-off--resume-logic)
13. [Competitor Insights & Recommended Flow Improvements](#13-competitor-insights--recommended-flow-improvements)
14. [Non-Functional Requirements](#14-non-functional-requirements)
15. [Out of Scope — Phase 1](#15-out-of-scope--phase-1)
16. [Glossary](#16-glossary)

---

## 1. Introduction

### 1.1 Purpose

This document defines the complete product requirements for the **Savings Account — Straight Through Processing (STP) Journey (Phase 1)**. It serves as the single source of truth for design, engineering, and QA teams to build and validate the journey inside the **Antigravity Journey Builder** under Manage Programs.

This PRD is self-contained and does not require any supplementary source documents.

### 1.2 Scope — Phase 1

**In Scope:**

| Dimension | Scope |
|-----------|-------|
| Channel | Web (mobile-responsive web application) |
| Customer Segments | ETB (Existing to Bank) and NTB (New to Bank) |
| Journey Type | End-to-end Straight Through Processing (STP) |
| Customer Type | Individual residents only |
| KYC — ETB | Liveness Check only (CBS dedupe pre-fills profile; Aadhaar eKYC not required for ETB) |
| KYC — NTB | Aadhaar OTP eKYC + Video KYC (VKYC) with agent |
| e-Sign | Included |
| Funding | Optional — Payment Gateway inline |
| Scheme Code | BRE-determined (automatic) |
| Journey Name | Savings Account - STP |

**Out of Scope — Phase 1:**

- Branch-assisted journey (Maker-Checker flow)
- BC (Business Correspondent) journey
- Mobile native app (iOS / Android)
- NRI / non-resident customers
- Minor accounts (below 10 years)
- Pension / MACT / Capital Gains account opening
- Joint account opening
- Cross-sell product page (post account creation)
- HUF account opening
- Live API integrations (mocked for Phase 1, live in Phase 2)

### 1.3 Objectives

1. Enable end-to-end digital savings account opening with zero paper via STP
2. Serve both ETB and NTB customers in a single unified journey using Router nodes
3. Reduce account opening TAT to under 10 minutes for ETB and under 15 minutes for NTB
4. Ensure regulatory compliance: Aadhaar eKYC, VKYC (NTB), CKYC, e-Sign, FATCA, PEP
5. Auto-select savings account scheme code via BRE (no manual selection)
6. Maximise completion rate through intelligent pre-fill and progressive form design

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Journey completion rate | ≥ 65% |
| STP rate (no manual intervention) | ≥ 75% |
| Average time to complete — ETB | ≤ 10 minutes |
| Average time to complete — NTB | ≤ 15 minutes |
| VKYC completion within 3-day window | ≥ 85% |
| Funding conversion (of completed journeys) | ≥ 50% |
| System uptime | 99.9% |

---

## 2. Product Overview

### 2.1 Product Description

A fully digital, self-service web journey enabling individual customers to open a Savings Bank Account end-to-end — from identity verification through account creation, virtual debit card issuance, UPI ID creation, optional funding, and KYC completion — without visiting a branch.

The journey is built inside the Antigravity Journey Builder as a single program titled **"Savings Account - STP"**, using Router nodes to split ETB and NTB paths at the entry point and merge them before shared steps.

### 2.2 Savings Account Scheme Codes

Scheme codes are not selected by the customer. They are auto-determined by the BRE based on customer profile (age, gender, employment type, salary, OVD count). The journey surfaces the recommended product variant with USPs for customer confirmation only.

| Scheme Code | Product Name | Key Eligibility Trigger |
|------------|-------------|------------------------|
| SB101 | Savings Bank General | Default / fallback |
| SB116 | Star Yuva Account | Age 10–35, Male, AQB ₹5,000 |
| SB121 | SB Pension | Pension account — routed to branch |
| SB161 | Jai Jawan Commissioned | Armed Forces — commissioned |
| SB162 | Jai Jawan Non-Commissioned | Armed Forces — non-commissioned |
| SB163 | BOI Salary Plus | Salaried, various special charge codes |
| SB165 | BOI Saral Salary | Salary ₹5,000–₹9,999 |
| SB166 | BOI Star Senior Citizen | Age 57+, Male, AQB ₹10,000 |
| SB167 | BOI Star Mahila | Female, individual non-salary |
| SB190 | SB Simplified KYC | Single OVD / relaxed KYC |

> **Note:** Scheme codes SB102, SB103, SB104, SB105, SB106, SB111, SB121, SB131, SB141, SB151, SB164, SB168, SB170, SB177, SB181, SB182, SB183 are either discontinued or not applicable for online STP. BRE must exclude these codes from output.

### 2.3 Customer Segments

| Segment | Definition | Primary Data Source | Post-Account KYC |
|---------|------------|---------------------|-----------------|
| ETB (Existing to Bank) | Customer with active SB / CD / TD / Loan account | Core Banking System (CBS / Finacle) | Liveness Check |
| NTB (New to Bank) | Customer with no prior bank relationship | UIDAI (Aadhaar eKYC) | Video KYC (VKYC) with agent |

**ETB Detection Method**: Automatic — no self-declaration required. After mobile OTP (Start block) and PAN entry, a CBS Dedupe by Mobile API call runs silently in the background. If the mobile number is linked to an existing CBS account, `is_etb = true` is captured and the Entry Router routes the customer to the ETB path with profile pre-filled from CBS. No account number entry is required from the customer.

---

## 3. User Personas & Journey Types

### 3.1 ETB Customer

| Attribute | Detail |
|-----------|--------|
| Who | Existing account holder opening an additional savings account |
| Goal | Fast, pre-filled account opening using existing bank relationship |
| Primary Pain Point | Repeating verification already done at prior account opening |
| Key Differentiator | Auto-detected via CBS mobile dedupe (no account number entry); CBS profile pre-fill; Liveness-only KYC; faster processing |
| Typical Completion Time | 8–10 minutes |

### 3.2 NTB Customer

| Attribute | Detail |
|-----------|--------|
| Who | New customer with no prior bank relationship |
| Goal | Complete digital savings account opening without branch visit |
| Primary Pain Point | KYC complexity; VKYC scheduling adds async step |
| Key Differentiator | Aadhaar OTP eKYC pre-fills all fields; instant account number |
| Typical Completion Time | 12–15 minutes (VKYC is async, within 3 days) |

---

## 4. High-Level Journey Flow

### 4.1 ETB Journey — Flow Summary

> **v1.1 update:** ETB customers are detected automatically via CBS Dedupe by Mobile — no account number entry or self-declaration required. The entry is unified with NTB (mobile OTP → PAN), and the router splits paths silently based on the `is_etb` flag.

```
[Mobile Number Entry → OTP Verification]  ← Shared entry with NTB
      ↓
[PAN Entry]
  Data Hooks (parallel, silent):
  → CBS Dedupe by Mobile  → is_etb=true, cbs_customer_id, profile pre-fill
  → LMS Dedupe (Savings)  → has_active_sb_application
  → NSDL PAN Validation   → pan_status, name_on_pan
  → CERSAI C-KYC          → ckyc_found, ckyc_id (silent pre-fill)
  → CFR Fraud Check       → is_fraud
      ↓
[Entry Router]  ──→ [is_fraud = true → Hard Reject]
      ↓ is_etb = true
[ETB Profile Review — Pre-filled from CBS (name, DOB, gender, address, email)]
      ↓
[Liveness Check — Face match vs PAN (80%), Liveness score (80%)]
  Satisfies Full KYC — no VKYC required for ETB
      ↓
→ [ETB / NTB Merge]
      ↓
[Shared Path: Branch & Nominee → BRE Scheme → eSign]
  eSign data hooks (chained, automatic):
  → CBS Account Creation (links to existing Customer ID) → account_number
  → DCMS Virtual Debit Card → virtual_card_masked
  → Internet Banking User ID → ib_user_id
  → UPI VPA Creation → upi_vpa
  → LMS Lead Update → ACCOUNT_CREATED
      ↓
[Account Funding — Payment Gateway (Optional, Bill Desk)]
      ↓
[KYC Closure Router]  ──→ is_etb = true
      ↓
[END: Account Opened Successfully — Full KYC, Debit Freeze Removed]
```

### 4.2 NTB Journey — Flow Summary

> **v1.1 update:** All parallel dedupes (LMS, CBS, NSDL, CERSAI, CFR) run as data hooks on the PAN Verification block — not after mobile OTP. CBS Dedupe result `is_etb = false` confirms NTB and the Entry Router routes accordingly. No separate CBS Dedupe screen; automatic and silent.

```
[Mobile Number Entry → OTP Verification]  ← Shared entry with ETB
      ↓
[PAN Entry]
  Data Hooks (parallel, silent):
  → CBS Dedupe by Mobile  → is_etb=false (NTB confirmed)
  → LMS Dedupe (Savings)  → has_active_sb_application (90-day check)
  → NSDL PAN Validation   → pan_status, name_on_pan
  → CERSAI C-KYC          → ckyc_found, ckyc_id (silent pre-fill)
  → CFR Fraud Check       → is_fraud
      ↓
[Entry Router]
  ├──→ [is_fraud = true → Hard Reject (End)]
  └──→ default (NTB)
      ↓
[Aadhaar OTP eKYC — UIDAI]
  Checks: Mobile Linkage (required), Age 18–70
  Demographics captured: name, DOB, gender, address, photo
      ↓
[NTB Personal Details Form — Pre-filled from Aadhaar]
  Customer completes: father name, marital status, email
      ↓
→ [ETB / NTB Merge]
      ↓
[Shared Path: Branch & Nominee → BRE Scheme → eSign]
  eSign data hooks (chained, automatic):
  → CBS Customer ID Creation (NTB) → new_cbs_customer_id
  → CBS Account Creation → account_number, debit_freeze=true, kyc_status=MIN_KYC
  → DCMS Virtual Debit Card → virtual_card_masked
  → Internet Banking User ID → ib_user_id
  → UPI VPA Creation → upi_vpa
  → LMS Lead Update → ACCOUNT_CREATED
      ↓
[Account Funding — Payment Gateway (Optional, Bill Desk)]
      ↓
[KYC Closure Router]  ──→ default (NTB)
      ↓
[Video KYC — Schedule or Start Now]
  Window: 3 working days, 9 AM – 6 PM
  Data Hook (after VKYC): CBS KYC Update + Debit Freeze Removal
      ↓
[END: Account Opened — VKYC Pending (Min KYC, debit freeze removed after CA certifies)]
```

### 4.3 Shared Journey Decision: Funding Before KYC

**Recommended Flow (based on competitor best practice):**

Funding is offered immediately after the account success page, before KYC (Liveness / VKYC). This keeps the user engaged while the account number is fresh in mind and maximises funding conversion. KYC is the final step. If the user drops before KYC, the account exists with debit freeze and Min KYC status; follow-up SMS/email nudges are sent.

| Step | ETB | NTB |
|------|-----|-----|
| After account creation | → Funding (optional) → Liveness Check | → Funding (optional) → VKYC Schedule |
| If funding skipped | Liveness Check still triggered | VKYC link sent via SMS/email |
| If KYC not completed | Debit freeze ON; 1-year Min KYC window | Same |

---

## 5. Journey Builder — Block Map

This section maps the journey into Antigravity Journey Builder blocks for implementation.

### 5.1 Block Type Legend

| Block Color | Block Type | Purpose |
|------------|------------|---------|
| Blue | Smart Block | API call / service integration (eKYC, NSDL, CBS, etc.) |
| Green | Form Block | Customer data capture (manual input) |
| Orange | Router Block | Conditional branching based on field values or BRE output |
| Indigo | Merge Block | Rejoins split paths into single shared flow |
| Purple | Data Hook Block | Backend triggers (Lead creation, DCMS, VPA, etc.) |
| Red | End Block | Terminal state (success, rejection, hard stop) |

### 5.2 Complete Block Map

> **v1.1 — Aligned with Journey Builder implementation (17 blocks, workflow ID: wf5)**

```
BLOCK 1 ── Start Block
  [Journey Start]
  Mobile OTP authentication, web channel, KYC consent
        ↓
BLOCK 2 ── Smart Block (PAN Verification)
  [PAN Verification]
  Data Hooks — after_pan_input (5 parallel API calls):
    ① CBS Dedupe by Mobile  → is_etb, cbs_customer_id, name, DOB, address, risk_profile
    ② LMS Dedupe (Savings)  → has_active_sb_application, active_sb_application_id
    ③ NSDL PAN Validation   → pan_status, name_on_pan, aadhaar_pan_seeded
    ④ CERSAI C-KYC          → ckyc_found, ckyc_id (silent pre-fill for NTB)
    ⑤ CFR Fraud Check       → is_fraud, fraud_type
  Checks: CFR (enabled, hard reject), Age 18–70 (enabled)
        ↓
BLOCK 3 ── Router Block
  [Entry Router]
  ├── is_fraud = true  → BLOCK 17 (Rejected)
  ├── is_etb = true    → ETB Path (BLOCK 4)
  └── default (NTB)   → NTB Path (BLOCK 6)

  ┌─── ETB PATH ──────────────────────────────────────────────────────────┐
  │                                                                       │
  │ BLOCK 4 ── Form Block                                                 │
  │   [ETB Customer Profile]                                              │
  │   Pre-filled from CBS: name, DOB, gender, email, address, pincode    │
  │   Customer confirms / supplements missing fields (3 pages)            │
  │         ↓                                                             │
  │ BLOCK 5 ── Smart Block (Liveness & Selfie)                           │
  │   [Liveness Check (ETB)]                                              │
  │   Face match vs PAN photo (threshold: 80%)                           │
  │   Liveness score (threshold: 80%)                                     │
  │   Pass = Full KYC certified — no VKYC required for ETB               │
  │         ↓                                                             │
  └───────────────────────────── → BLOCK 8 ───────────────────────────────┘

  ┌─── NTB PATH ──────────────────────────────────────────────────────────┐
  │                                                                       │
  │ BLOCK 6 ── Smart Block (Aadhaar Verification)                        │
  │   [Aadhaar OTP eKYC]                                                 │
  │   Provider: UIDAI (OTP eKYC mode)                                    │
  │   Checks: Mobile Linkage (enabled), Age 18–70 (enabled)             │
  │   Demographics captured: name, DOB, gender, address, photo           │
  │         ↓                                                             │
  │ BLOCK 7 ── Form Block                                                 │
  │   [NTB Personal Details]                                              │
  │   Pre-filled from Aadhaar: name, DOB, gender, address                │
  │   Customer completes: father name, marital status, email (3 pages)  │
  │         ↓                                                             │
  └───────────────────────────── → BLOCK 8 ───────────────────────────────┘

BLOCK 8 ── Merge Block
  [ETB / NTB Merge]
  Rejoins both paths after identity verification
        ↓
BLOCK 9 ── Form Block
  [Branch & Nominee Details]
  Page 1 — Home Branch Preference: state, city, branch code
  Page 2 — Nominee: name, relationship, DOB, share %
  Data Hook — after_form_submit:
    → LMS Lead Creation → lead_id, ARN (triggers SMS/email to applicant)
        ↓
BLOCK 10 ── Smart Block (Soft Offer Generation)
  [Scheme Selection (BRE)]
  product_type: savings_account
  Data Hook — after_generate_offer:
    → BRE Scheme Code → scheme_code, scheme_name, aqb_amount, interest_rate_pa
  Page 1 — Scheme loader (BRE running)
  Page 2 — Scheme Preview (USPs + AQB shown to applicant for confirmation)
        ↓
BLOCK 11 ── Smart Block (eSign)
  [eSign & Account Activation]
  Template: Savings Account Opening Form
  Data Hooks — after_esign_completion (6 chained API calls):
    ① CBS Customer ID Creation (NTB)  → new_cbs_customer_id
    ② CBS Savings Account Creation    → account_number, ifsc_code, debit_freeze=true
    ③ DCMS Virtual Debit Card         → virtual_card_masked, card_expiry
    ④ Internet Banking Registration   → ib_user_id
    ⑤ UPI VPA Creation               → upi_vpa
    ⑥ LMS Lead Status Update         → status: ACCOUNT_CREATED
        ↓
BLOCK 12 ── Smart Block (Account Funding)
  [Account Funding — Bill Desk]
  Funding optional; AQB pre-filled from BRE output; max ₹1,00,000
  Data Hook — after_funding_page:
    → Bill Desk Payment Init → txn_id, payment_url
  Note: Funding does NOT remove Debit Freeze — that requires KYC certification
        ↓
BLOCK 13 ── Router Block
  [KYC Closure Router]
  ├── is_etb = true  → BLOCK 15 (ETB Success — liveness already certified Full KYC)
  └── default (NTB)  → BLOCK 14 (VKYC)
        ↓
BLOCK 14 ── Smart Block (Video KYC)
  [Video KYC (NTB)]
  Window: 3 working days from account creation; 9 AM – 6 PM daily
  Checks: VKYC completion, face match (80%), liveness, document visibility
  Data Hook — after_vkyc_result:
    → CBS KYC Update + Debit Freeze Removal → final_kyc_status, debit_freeze_removed
        ↓
BLOCK 16 (NTB End)

END BLOCKS
  BLOCK 15 ── End Block  [Account Opened Successfully (ETB)]
    Full KYC, debit freeze removed after liveness
  BLOCK 16 ── End Block  [Account Opened — VKYC Pending (NTB)]
    Min KYC state; debit freeze removed after Concurrent Auditor certifies VKYC
  BLOCK 17 ── End Block  [Application Rejected]
    CFR fraud hit or policy breach; rejection SMS/email sent; lead marked REJECTED
```

---

## 6. Screen-by-Screen Specifications

> **v1.1 Implementation Note:** SCR-01 (Applicant Type) and SCR-02E (Account Number Entry) are **superseded** in the implemented journey. ETB detection is now fully automatic via the CBS Dedupe by Mobile API triggered after PAN input — customers no longer self-declare their type or enter an account number. The remaining screens below reflect the implemented flow; SCR-01 and SCR-02E are retained for historical reference only.

### 6.1 SCR-01: Applicant Type (Landing) — ⚠️ SUPERSEDED

> **Superseded in v1.1.** This screen has been removed. The journey now begins with mobile number entry (Start block → Mobile OTP). ETB/NTB routing is determined automatically by CBS Dedupe by Mobile after PAN input.

**Screen ID**: SCR-01
**Purpose**: ~~Journey entry point. Customer self-identifies as ETB or NTB.~~ *Replaced by automatic ETB detection.*

| Field | Type | Validation | Mandatory |
|-------|------|-----------|----------|
| Existing Customer | Radio Button | Yes / No | Yes |
| T&C / Policy / Disclaimer | Checkbox | Must be ticked to proceed | Yes |
| Resume Application | Link | Redirects to resume flow | No |

**System Actions**:
- Customer selects Yes (ETB) → Route to SCR-02E
- Customer selects No (NTB) → Route to SCR-02N

---

### 6.2 SCR-02E: Account Number + CAPTCHA (ETB) — ⚠️ SUPERSEDED

> **Superseded in v1.1.** This screen has been removed. ETB customers are identified silently via CBS Dedupe by Mobile — no account number entry is required. The ETB path now begins directly with Profile Review after the Entry Router routes the customer based on `is_etb: true`.

**Screen ID**: SCR-02E
**Purpose**: ~~Capture and validate the ETB customer's existing account number.~~ *Replaced by automatic CBS Dedupe by Mobile.*

| Field | Type | Validation | Mandatory |
|-------|------|-----------|----------|
| Account Number | Text | 15-digit numeric; SB / CD / TD / Loan account | Yes |
| CAPTCHA | Image Input | Must match image text | Yes |
| Refresh CAPTCHA | Icon | Re-generates CAPTCHA | No |
| Sound CAPTCHA | Icon | Audio readout of CAPTCHA | No |

**System Actions**:
1. Validate 15-digit format client-side
2. Call CBS Account Inquiry API → fetch account status, demographics, masked mobile, Risk Profile
3. If account not active → End E01
4. Check Risk Profile + last KYC date → if KYC expired → End E02
5. Display masked mobile number (e.g., 9XXXXXXX34)

**Business Rules**:

| Rule | Detail |
|------|--------|
| Account types accepted | SB, CD, TD, Loan (any 15-digit BOI account) |
| Account must be | Active only (Inactive / Dormant / Closed → End) |
| Re-KYC window | Low Risk: 10 years; Medium Risk: 8 years; High Risk: 2 years |
| Restricted scheme codes | 131, 141, 151 (NRI / Safe Deposit Vault) → flag for new Cust ID creation |
| Blank mobile in CBS | Hard stop — customer must update mobile at branch first |

---

### 6.3 SCR-02N: Mobile Number + OTP (NTB)

**Screen ID**: SCR-02N
**Purpose**: Verify mobile number to initiate NTB session.

| Field | Type | Validation | Mandatory |
|-------|------|-----------|----------|
| Country Code | Prefix | Hardcoded +91 | Yes |
| Mobile Number | Text | 10-digit; starts with 6/7/8/9 | Yes |
| Send OTP | Button | Triggers SMS OTP | — |
| OTP | 6-digit PIN | Numeric only | Yes |
| Resend OTP | Link | Active after 60-second countdown | — |
| CAPTCHA | Image Input | Standard CAPTCHA | Yes |

**Business Rules**:

| Rule | Value |
|------|-------|
| OTP validity | 10 minutes |
| Max incorrect OTP attempts | 3 (then 30-minute lockout) |
| Max resend attempts | 3 |
| Resend delay | 60 seconds |

---

### 6.4 SCR-03N: Email ID (Optional) — NTB

**Screen ID**: SCR-03N
**Purpose**: Capture optional email; mandatory only for non-resident (out of scope).

| Field | Type | Validation | Mandatory |
|-------|------|-----------|----------|
| Email ID | Text | Must contain "@"; standard email format | No |
| Verify Email OTP | Button | Sends OTP to provided email | Only if email entered |

**Note**: If email not provided, e-Statement toggle is hidden on SCR-11.

---

### 6.5 SCR-04N: PAN Entry + Validation (NTB)

**Screen ID**: SCR-04N
**Purpose**: Capture and validate PAN via NSDL; pre-fill applicant name.

| Field | Type | Validation | Mandatory |
|-------|------|-----------|----------|
| PAN Number | Text | Format: 5 letters + 4 digits + 1 letter; 4th char must be "P" (individual) | Yes |
| Validate | Button | Triggers NSDL API call | — |
| Generate Instant PAN | Link | Opens Income Tax portal for instant PAN | No |

**System Actions**:
1. Client-side PAN format validation (4th character must be "P" for individuals)
2. Call NSDL PAN Validation API → must return status "E" (Existing and Valid)
3. Pre-fill Applicant Name field from NSDL response (editable until UIDAI overrides)
4. Check Aadhaar-PAN seeding flag from NSDL response
5. Call CERSAI C-KYC API in background (non-blocking)
6. Run LMS Dedupe + CBS Dedupe in parallel (non-blocking until results needed)

**Business Rules**:

| Rule | Detail |
|------|--------|
| PAN status accepted | "E" (Existing and Valid) only |
| NSDL service down | Hard stop: "NSDL Service Down — Please try after 30 minutes" |
| PAN once verified | Field becomes non-editable |
| Aadhaar-PAN seeding | If not seeded, flag for CBS update during account creation |

---

### 6.6 SCR-05: Fill Additional Details (Shared — ETB + NTB)

**Screen ID**: SCR-05
**Purpose**: Review and complete demographic details. Fields are pre-filled from CBS (ETB) or UIDAI (NTB).

**Pre-filled fields (non-editable)**:
- Full Name (from UIDAI for NTB; from CBS for ETB)
- Date of Birth
- Gender
- Photograph
- Permanent Address (Street, City, State, PIN — from UIDAI/CBS)

**Customer-entry fields (editable)**:

| Field | Type | Mandatory |
|-------|------|----------|
| Title (Mr / Mrs / Ms / Dr) | Dropdown | Yes |
| Father's Name | Text | Yes |
| Mother's Name | Text | Yes |
| Marital Status | Dropdown | Yes |
| Spouse Name | Text | If married |
| Nationality | Dropdown | Yes (default: Indian) |
| Category (General / OBC / SC / ST) | Dropdown | Yes |
| Religion | Dropdown | Yes |
| Educational Qualification | Dropdown | Yes |
| Employment Type | Dropdown | Yes |
| Employed With | Dropdown | If salaried |
| Occupation | Dropdown | Yes |
| Gross Annual Income | Dropdown / Numeric | Yes |
| Source of Income | Dropdown | Yes |
| Aadhaar Number (last 4 digits display only) | Display | No (from eKYC) |
| PAN (pre-filled) | Display | Yes |

**System Actions**:
- DOB age check: < 10 → End E09; year-only DOB → End E10
- If ETB: all CBS-fetched fields non-editable; customer fills missing fields only
- If NTB: all UIDAI-fetched fields non-editable; customer fills additional fields

---

### 6.7 SCR-06: Place of Birth (NTB Only)

**Screen ID**: SCR-06
**Purpose**: Capture place of birth for CBS Customer ID creation.

| Field | Type | Mandatory |
|-------|------|----------|
| Country of Birth | Dropdown | Yes |
| State / Province | Dropdown | Yes |
| City / Town | Dropdown | Yes |
| Place | Text | Yes |

---

### 6.8 SCR-07: Address Confirmation

**Screen ID**: SCR-07
**Purpose**: Confirm and update communication address.

| Field | Type | Mandatory |
|-------|------|----------|
| Is Communication Address same as Permanent Address? | Radio (Yes / No) | Yes |
| Communication Address fields | Text (if No selected) | Conditional |

**Business Rules**:
- If Yes → Permanent address copied to Communication Address; `address_change_flag = No`
- If No → Customer enters Communication Address; `address_change_flag = Yes`; POA required within 6 months
- PIN code from UIDAI auto-populates State / City / District

---

### 6.9 SCR-08: Nominee Details

**Screen ID**: SCR-08
**Purpose**: Capture optional nominee; legally recommended.

| Field | Type | Mandatory |
|-------|------|----------|
| Add Nominee? | Radio (Yes / No) | Yes |
| Nominee Name | Text | If Yes |
| Relationship | Dropdown | If Yes |
| Nominee DOB | Date Picker | If Yes |
| Nominee Address | Text | If Yes |
| Is Nominee Minor? | Auto-detected | If DOB < 18 years |
| Guardian Name | Text | If nominee minor |
| Guardian Relationship | Dropdown | If nominee minor |
| Guardian Address | Text | If nominee minor |
| Print Nominee on Statement/Passbook? | Radio (Yes / No) | If Yes |

**Note**: If customer selects No, display advisory popup: *"Nomination protects your family. Would you like to nominate? → I will Nominate / Not Interested"*

---

### 6.10 SCR-09: Branch Selection (NTB Only)

**Screen ID**: SCR-09
**Purpose**: Select home/base branch for the new account.

| Field | Type | Mandatory |
|-------|------|----------|
| Auto-suggested branches | Dropdown | Yes — pre-filtered by communication address PIN |
| State (to change) | Dropdown | No |
| City / District (to change) | Dropdown | No |
| Branch | Dropdown | Yes |
| IFSC Code | Display | Auto-populated |

**Note (ETB)**: Home branch is pre-selected from CBS response. Customer may change.

---

### 6.11 SCR-10: Product Variant Confirmation

**Screen ID**: SCR-10
**Purpose**: Display BRE-recommended savings account scheme with key USPs. Customer confirms or selects basic SB101.

| UI Element | Description |
|-----------|-------------|
| Recommended Scheme Card | Scheme name, MAB/AQB, USPs (from BRE) |
| Alternative: Basic Account | SB101 — Zero balance / low AQB option |
| Confirm Selection | Button |

**Note**: Scheme code is passed to CBS during account creation. If customer selects higher product, Debit Freeze is enabled post-creation until VKYC / Liveness is certified.

---

### 6.12 SCR-11: Value Added Services

**Screen ID**: SCR-11
**Purpose**: Customer opts in / out of services. All are ON by default.

| Service | Default | Notes |
|---------|---------|-------|
| Internet & Mobile Banking | ON | Cannot deactivate recommended |
| SMS Banking | ON | Toggleable |
| e-Statement | ON | Hidden if no email provided |
| Cheque Book | ON | Cheque book not printed until VKYC complete |

---

### 6.13 SCR-12: FATCA + PEP + TNC Declaration

**Screen ID**: SCR-12
**Purpose**: Mandatory consents before e-Sign and account creation.

| Declaration | Type | Mandatory |
|------------|------|----------|
| General Terms & Conditions | Hyperlink + Checkbox | Yes |
| FATCA Declaration | Checkbox | Yes |
| PEP Declaration: "I am not a politically exposed person" | Checkbox | Yes |
| Non-Face-to-Face Declaration: "I declare I have not opened an OTP-based KYC account with any regulated entity" | Checkbox | Yes |

---

### 6.14 SCR-13: Congratulations / Account Success Page

**Screen ID**: SCR-13
**Purpose**: Display newly created account details and next steps.

| UI Element | Description |
|-----------|-------------|
| Account Number | Masked (first 4 + last 4 digits shown) |
| Home Branch Name + Address + IFSC | From CBS account creation response |
| Copy Account Details | Clipboard copy for NEFT/IMPS funding |
| Virtual Debit Card Link | View card post-OTP authentication |
| UPI ID | `mobileno@boi` (editable; shows only on mobile) |
| User ID | Internet Banking user ID (sent via SMS) |
| VKYC Reminder Ticker | "Complete Video KYC within 3 days to fully activate your account" (NTB only) |
| Fund Your Account | Primary CTA — proceeds to SCR-14 |

---

### 6.15 SCR-14: Funding — Payment Gateway (Optional)

**Screen ID**: SCR-14
**Purpose**: Fund the newly opened account via BOI Payment Gateway (Bill Desk).

| UI Element | Description |
|-----------|-------------|
| Pre-filled Amount | Minimum AQB/MAB for selected scheme (editable up to ₹10,000) |
| Bank Selection | Net Banking / Debit Card from other bank |
| Pay Now | Redirects to Bill Desk PG page |
| Skip Funding | Text link — proceeds to KYC without funding |

**Business Rules**:
- Debit Freeze already ON from account creation
- Funding does not remove Debit Freeze (that requires KYC certification)
- If funding fails → Debit Freeze stays ON; CRM updated for follow-up
- On Drop → Status updated as "Unfunded" in CRM

---

### 6.16 SCR-15E: Liveness Check (ETB)

**Screen ID**: SCR-15E
**Purpose**: Lightweight face liveness verification for ETB customers (already full-KYC from prior account).

| UI Element | Description |
|-----------|-------------|
| Camera Access Request | Browser permission prompt |
| Liveness Instruction | Center face, look at camera, blink/smile as instructed |
| Liveness Score | Returned by Liveness API |
| Result | Pass → Account Fully Operational; Fail → Retry or Min KYC |

**System Actions**:
- Call Liveness Check API (face capture → anti-spoofing → score)
- Pass → CBS API: Remove Debit Freeze + Tag as Full KYC → End E12
- Fail → Account remains Min KYC; CRM updated

---

### 6.17 SCR-15N: Video KYC — Schedule or Start Now (NTB)

**Screen ID**: SCR-15N
**Purpose**: Complete Video KYC with a live agent to achieve Full KYC status.

| UI Element | Description |
|-----------|-------------|
| Start VKYC Now | Available if agent is online (9:00 AM – 6:30 PM) |
| Schedule VKYC | Date + time picker (next available slot) |
| Prerequisites Checklist | Good lighting, KYC docs, white paper for signature, stable internet |
| Queue / Zone Routing | Customer routed to Z-COD center by zone/city |

**Business Rules**:
- VKYC window: 9:00 AM to 6:30 PM daily
- If Start Now outside window → Show Schedule option only
- Pre-scheduled VKYC link disabled until 5 minutes before slot
- Max VKYC validity window: 3 days from account opening
- After VKYC: Concurrent Auditor must certify before Full KYC flag set in CBS
- Concurrent Auditor: Approve → Full KYC + Debit Freeze Removed; Mark for Review → Branch contacts customer
- If VKYC not completed within 3 days → account in Min KYC state for up to 1 year
- After 1 year without Full KYC → account set to Inactive in CBS

---

## 7. Business Rules Engine (BRE)

The BRE is triggered at **DH-07** (after Branch Selection, before Product Variant display). It receives customer profile data and returns the recommended scheme code.

### 7.1 BRE Input Parameters

| Parameter | Source |
|-----------|--------|
| Age | Calculated from DOB (UIDAI / CBS) |
| Gender | From UIDAI / CBS |
| Nationality | Customer entry |
| Residency Status | Customer entry (Resident / NRI — NRI blocked) |
| Employment Type | Customer entry |
| Employer Category | Customer entry (Armed Forces / Govt / PSU / Private / Police / Teaching / Paramilitary) |
| Net Monthly Salary | Customer entry |
| Number of OVDs provided | System count (Aadhaar + PAN = 2; Aadhaar only = 1) |
| Customer willing to maintain AQB | Customer entry (Yes / No + amount) |
| Valid income proof available | Customer entry |
| Customer is pensioner | Customer entry |

### 7.2 BRE Scheme Code Logic (Summary)

| Condition | Scheme Code |
|-----------|------------|
| Age < 10 | Hard Stop (no account) |
| Age 10–17, 2 OVDs | SB116 |
| Age 10–17, 1 OVD | Route to branch (SB101 branch) |
| Age 18–35, 1 OVD | SB190 (Relaxed KYC) |
| Age 18–35, 2 OVDs, Male, salaried → Armed Forces commissioned | SB161 |
| Age 18–35, 2 OVDs, Male, salaried → Armed Forces non-commissioned | SB162 |
| Age 18–35, 2 OVDs, salaried → Paramilitary | SB163 (Charge: 0201) |
| Age 18–35, 2 OVDs, salaried → Central/State Govt, salary ≥ ₹10,000 | SB163 (Charge: 0202) |
| Age 18–35, 2 OVDs, salaried → PSU, salary ≥ ₹10,000 | SB163 (Charge: 0203) |
| Age 18–35, 2 OVDs, salaried → Police | SB163 (Charge: RAKSA) |
| Age 18–35, 2 OVDs, salaried → Private, salary ≥ ₹10,000 | SB163 (Charge: 0204) |
| Age 18–35, 2 OVDs, salaried → Teaching/Education | SB163 (Charge: GURU) |
| Age 18–35, 2 OVDs, salaried, salary ₹5,000–₹9,999 | SB165 |
| Age 18–35, 2 OVDs, not salaried, Male, AQB ₹5,000 | SB116 |
| Age 18–35, 2 OVDs, not salaried, Female, income proof + AQB ₹10,000 | SB167 |
| Age 18–35, 2 OVDs, not salaried, Female, AQB ₹5,000 | SB116 |
| Age 18–35, 2 OVDs, default fallback | SB101 |
| Age 36–56, same salaried logic | Same as 18–35 (minus SB116 Male path → SB101) |
| Age 36–56, not salaried, Female, income proof + AQB ₹5,000 | SB167 |
| Age 57–59, Male, AQB ₹10,000 | SB166 |
| Age 57–59, Female, income proof + AQB ₹10,000 | SB166 or SB167 (customer choice) |
| Age 57–59, Female, AQB ₹5,000 | SB167 |
| Age 60+, not pensioner, Male, AQB ₹10,000 | SB166 |
| Age 60+, pensioner, interested in pension account | Route to branch |
| Age 60+, default | SB101 |
| Diamond sector employee | SB Ratnakar |
| Any minor / pension / MACT / Capital Gains intent | Route to branch |
| NRI | Hard Stop — online not allowed |

### 7.3 BRE Output

| Output Field | Description |
|-------------|-------------|
| `scheme_code` | Final scheme code for CBS account creation |
| `product_variant_name` | Display name for customer confirmation screen |
| `aqb_amount` | Minimum AQB/MAB to maintain |
| `usp_points` | Array of USP strings for SCR-10 display |
| `debit_freeze_on_creation` | Boolean — True if higher product selected |
| `special_charge_code` | SB163 charge code if applicable |

---

## 8. Deduplication Logic

### 8.1 Dedupe Checks — All Customers (After PAN Input)

ETB detection and duplicate-application checking are performed silently in the background as **parallel data hooks on the PAN Verification block** (`after_pan_input` event). No manual account-number entry or customer self-declaration is required.

| # | Check | System | API | Input | Match Action | No Match Action |
|---|-------|--------|-----|-------|-------------|----------------|
| 1 | CBS Dedupe by Mobile | CBS (Finacle) | `cbs_dedupe_mobile` | Mobile Number (from Start block) | `is_etb: true` → Entry Router silently routes to ETB path; pre-fills profile from `cbs_customer_id`, `dob`, `name` | `is_etb: false` → Entry Router routes to NTB path |
| 2 | LMS Dedupe SB | CRM/LMS | `lms_dedupe_sb` | Mobile Number | `has_active_application: true` → Show in-progress application screen; offer resume | Continue journey |
| 3 | NSDL PAN Validation | NSDL | `nsdl_pan_validation` | PAN Number | Valid → proceed; fetch name, DOB; confirm Aadhaar-PAN seeding | Invalid PAN → End |
| 4 | CERSAI C-KYC | CERSAI | `cersai_ckyc` | PAN, DOB | C-KYC found → silent pre-fill of address and photo | Continue fresh |
| 5 | CFR Fraud Check | CFR (Fraud DB) | `cfr_fraud_check` | PAN, Mobile | Fraud flag → Journey End | Continue |

All 5 API calls execute **in parallel** on the same `after_pan_input` event.

### 8.2 ETB / NTB Routing Decision (Entry Router)

The Entry Router block evaluates the CBS Dedupe by Mobile result and routes the customer accordingly. The LMS Dedupe result is independently handled (resume flow) and does not affect the ETB/NTB path decision.

| CBS `is_etb` | LMS `has_active_application` | Action |
|---|---|---|
| `true` | `false` | Route to ETB path (Profile Review → Liveness Check → eSign → Funding) |
| `false` | `false` | Route to NTB path (Aadhaar eKYC → VKYC → full onboarding) |
| `true` | `true` | Route to ETB path; surface resume prompt for in-progress application |
| `false` | `true` | Show in-progress application screen; offer resume on NTB path |

> **Note:** There is no customer-facing applicant type selection screen in the implemented journey. ETB detection is fully automatic via the CBS Dedupe by Mobile API.

---

## 9. System Integrations

All integrations are mocked in Phase 1. Live integrations are Phase 2.

### 9.1 Integration List

| # | System | Integration Name | Triggered At | Purpose |
|---|--------|-----------------|-------------|---------|
| 1 | CBS (Finacle) | CBS Dedupe by Mobile API | DH: `after_pan_input` — all customers, parallel | Detect ETB status via mobile; pre-fill CBS profile; auto-route Entry Router to ETB or NTB path |
| 2 | CRM/LMS | LMS Dedupe SB API | DH: `after_pan_input` — all customers, parallel | Check for active SB application in last 90 days |
| 3 | NSDL | PAN Validation API | DH: `after_pan_input` — all customers, parallel | Validate PAN; fetch name; confirm Aadhaar-PAN seeding |
| 4 | CERSAI | C-KYC Enquiry API | DH: `after_pan_input` — all customers, parallel | Check if C-KYC ID exists; silent pre-fill of customer data |
| 5 | CFR (Fraud DB) | Fraud Check API | DH: `after_pan_input` — all customers, parallel | Cross-check PAN + Mobile against bank's internal fraud database |
| 6 | SMS Gateway | OTP Dispatch | Start block (Mobile OTP) | Send OTP to mobile number at journey entry |
| 7 | UIDAI | Aadhaar eKYC — OTP Send API | Aadhaar Verification block (NTB) | Initiate Aadhaar OTP for eKYC; accepts Aadhaar or VID |
| 8 | UIDAI | Aadhaar eKYC — OTP Verify API | Aadhaar Verification block (NTB) | Verify OTP; receive Name, DOB, Gender, Address, Photo |
| 9 | Branch Master API | Branch List API | Branch & Nominee Details form | Fetch branches by PIN / State / City |
| 10 | BRE | Scheme Code + Product Variant API | DH: `after_form_submit` — Branch & Nominee form | Auto-select scheme code (SB101–SB190); return product USPs and AQB |
| 11 | CRM/LMS | Lead ID Creation API | DH: `after_form_submit` — Branch & Nominee form | Create Application Reference Number (ARN); trigger SMS/email notification |
| 12 | NESL (or equivalent) | e-Sign API | eSign block | Aadhaar-based digital signature on Savings Account Opening form |
| 13 | CBS (Finacle) | Customer ID Creation API | DH: `after_esign_completion` — NTB only | Create new Customer ID in CBS |
| 14 | CBS (Finacle) | Savings Account Creation API | DH: `after_esign_completion` — all customers | Create savings account under BRE scheme code; set Debit Freeze = true |
| 15 | DCMS | Virtual Debit Card Issuance API | DH: `after_esign_completion` | Issue virtual RuPay debit card; return card number and expiry |
| 16 | Internet Banking | User ID Creation API | DH: `after_esign_completion` | Create internet banking user ID for new account |
| 17 | UPI Switch (BOI) | VPA Creation API | DH: `after_esign_completion` | Create UPI VPA (mobile@boi) and bind to new savings account |
| 18 | CRM/LMS | Lead Status Update API | DH: `after_esign_completion` | Mark lead as account-created in CRM; update ARN status |
| 19 | Payment Gateway (Bill Desk) | PG Redirect + Callback | DH: `after_funding_page` — Account Funding block | Redirect customer to BOI PG for initial deposit; receive success/fail callback |
| 20 | Liveness Check API | Face Liveness Service | Liveness Check block (ETB path) | Anti-spoofing face liveness check to complete ETB KYC certification |
| 21 | VKYC Platform | VKYC Session API | VKYC block (NTB path) | Schedule or initiate live video KYC session with Concurrent Auditor |
| 22 | CBS (Finacle) | Debit Freeze Removal + KYC Flag Update | DH: `after_vkyc_result` — VKYC block; or post-liveness (ETB) | Remove Debit Freeze; set account to Full KYC after certification |
| 23 | DMS | Document Push API | Post account creation (background) | Push all KYC documents, eKYC response, FATCA, e-Sign PDF to bank DMS |
| 24 | SMS + Email Gateway | Communication API | Multiple stages | ARN notification, funding alert, VKYC reminder, account activation |

---

## 10. Error Handling & Edge Cases

| Trigger | Screen | Message | Action |
|---------|--------|---------|--------|
| CBS Dedupe returns account inactive / dormant / closed | Entry Router (background) | "We are unable to process your application online. Please visit the nearest branch." | End E01 |
| CBS Dedupe returns KYC expired on linked account | Entry Router (background) | "Please complete KYC for your existing account before opening a new one." | End E02 |
| CBS Dedupe returns blank / no mobile in CBS | Entry Router (background) | "No mobile number found linked to your CBS profile. Please update at any branch." | End |
| OTP max attempts exceeded | Start block (Mobile OTP) | "Maximum OTP attempts exceeded. Please try again after 30 minutes." | End E03 |
| Mobile not registered with UIDAI | eKYC screen | "Your mobile is not registered with Aadhaar. Please visit the nearest branch." | End E04 / E06 |
| NSDL service down | SCR-04N | "PAN Validation Service is unavailable. Please try after 30 minutes." | End E05 |
| Name mismatch (NSDL vs UIDAI) | Post eKYC | "Name mismatch detected. Please visit the nearest branch with supporting documents. (Ref: ARN)" | End E07 |
| Fraud DB match | Post eKYC | "We are unable to process your application due to Bank's Internal Policies." | End E08 |
| Age < 10 | SCR-05 | "We cannot open an online account currently. Please visit the nearest branch for a minor account." | End E09 |
| Year-only DOB from UIDAI/CBS | SCR-05 | "We could not verify your complete date of birth. Please visit a branch." | End E10 |
| e-Sign failure | SB-09 | "e-Sign could not be completed. Please retry." | Retry or End E11 |
| CBS down / EOD / BOD | DH-08 | "We cannot process your request right now. Please try again after 7:00 AM." | Scheduler retry; CRM updated |
| Account in restricted scheme (ETB, codes 131/141/151) | DH-08E | Backend flag only — system creates new Customer ID instead of linking | Silent handling |
| Payment Gateway failure | SCR-14 | "Payment could not be processed. Your account is created. You can fund it later." | CRM updated; Debit Freeze stays |
| VKYC agent unavailable (outside hours) | SCR-15N | "Video KYC is available 9:00 AM – 6:30 PM. Please schedule a slot." | Schedule prompt |
| VKYC not completed within 3 days | Backend | SMS/Email: "Complete your KYC at a branch to fully activate your account." | Min KYC state; monthly reminders |
| Account inactive after 1 year (no Full KYC) | Backend scheduler | CBS status → Inactive; customer notified | Monthly nudges |

---

## 11. Communication Templates

| Trigger | Channel | Message |
|---------|---------|---------|
| ARN created | SMS + Email | "Thank you for your Savings Account application. Application Reference ID: #######. Please refer to this for all future correspondence." |
| Customer dropout (idle > 15 min) | SMS | "Please complete your savings account application. Resume here: [Link]" |
| Reminder (T+3, T+5, T+15, T+30) | SMS + Email | "Complete your savings account application. Resume here: [Link]" |
| Account created successfully | SMS + Email | "Congratulations! Your Savings Bank Account [XXXXXX] has been opened. Fund your account: [Link]" |
| Funding successful | SMS | "₹[Amount] has been credited to your account [XXXXXX]. Thank you." |
| VKYC reminder (NTB) | SMS + Email | "Complete your Video KYC within 3 days to fully activate your account. [Start VKYC: Link]" |
| VKYC link (after account creation) | SMS + Email | "Your Video KYC appointment is on [Date/Time]. Join: [Link]" |
| Account fully operational | SMS + Email | "Your savings account is now fully active! Internet Banking User ID sent separately." |
| Internet Banking User ID | SMS | "Your Internet Banking User ID is [ID]. Set your password at [Link]." |
| Monthly KYC pending nudge | SMS | "Your savings account has restricted usage. Complete KYC at any branch." |

---

## 12. Drop-off & Resume Logic

| Parameter | Rule |
|-----------|------|
| Application validity | 30 days from ARN generation |
| Resume trigger | Mobile OTP → LMS Dedupe detects active ARN |
| Resume method | Re-enter mobile → OTP → system detects in-progress application → prompt: "Resume" or "New Application" |
| Resume point | Last completed step |
| Starting new | Previous application marked ABANDONED; new ARN generated |
| Near-expiry reminder | SMS + Email at Day 25 and Day 29 |
| Post-expiry | Application marked EXPIRED; customer starts fresh |
| Max active applications | One per customer at any time |
| Dropout before ARN | Customer must restart entire journey |
| Dropout before VKYC (NTB) | VKYC link sent via SMS/Email; account in Min KYC state |
| Dropout at funding | Account exists; Debit Freeze ON; funding CTA available on resume |

**Dropout Follow-Up:**
Applications that drop at the following stages are assigned to Call Centre (NTB) or Base Branch (ETB) for follow-up within 3 days:
- Consent denied for eKYC
- Dropped at Fill Additional Details
- Dropped at Funding
- VKYC not completed
- B-KYC / Liveness failed

---

## 13. Competitor Insights & Recommended Flow Improvements

### 13.1 Benchmark Analysis

| Bank / Product | Key STP Innovation | Applicable Improvement |
|---------------|-------------------|----------------------|
| **Kotak 811** | Zero-balance instant account; full eKYC + VKYC in-app; account number in < 5 min | Offer zero-balance fallback (SB101) prominently; instant account number display |
| **HDFC DigiSave** | Pre-fills from CKYC number; minimal typing | Maximize CERSAI pre-fill at SCR-05; reduce manual fields |
| **IDFC FIRST Bank** | Single-screen mobile OTP → Aadhaar → account; no step breaks | Collapse ETB steps 2–4 into a single verification screen |
| **Fi Money (Federal Bank)** | PAN + selfie only; no CAPTCHA; smart nudges | Use liveness/selfie as CAPTCHA replacement; add smart re-engagement nudges |
| **Jupiter (Federal Bank)** | Value proposition shown before form; benefits-first UX | Show account benefits / scheme USPs before asking for any data (homepage) |
| **ICICI iMobile** | Inline VKYC immediately after account creation (no scheduling screen) | Offer "Start VKYC Now" as the primary CTA on success page |
| **Paytm Payments Bank** | Parallel API calls (fraud + dedupe + CKYC simultaneously) | Run fraud check, CKYC, and both dedupes in parallel (already in design above) |

### 13.2 Recommended Flow Improvements (Incorporated)

The following improvements over the source BRD are **already incorporated** into this PRD:

**1. Funding Before KYC (not after)**
- Source BRD: KYC link sent post-funding. Risk: user drops after funding, never completes KYC.
- Recommended: Fund → KYC in sequence. User is most engaged immediately after seeing account number. Fund the momentum.

**2. Parallel API Calls at NTB Dedupe Stage**
- Source BRD: Sequential dedupe checks.
- Recommended: Run LMS Dedupe + CBS Dedupe simultaneously at DH-04 to reduce wait time by ~2 seconds.

**3. CERSAI as Silent Pre-fill, Not Blocker**
- Source BRD: CERSAI check done; no clear handling if C-KYC not found.
- Recommended: CERSAI runs silently in background at DH-03. If C-KYC found → pre-fill fields. If not found → no error, journey continues. C-KYC ID pushed to CBS on account creation if available.

**4. Inline VKYC CTA on Success Page**
- Source BRD: VKYC scheduling is a separate step.
- Recommended: SCR-13 shows "Start Video KYC Now" as primary CTA (if within operating hours). Scheduling is the secondary option. This converts users while motivation is highest.

**5. Liveness for ETB (not full VKYC)**
- Source BRD: ETB also required VKYC — high friction for an existing customer.
- Recommended: ETB uses lightweight Liveness Check only (face capture, < 30 seconds). Full VKYC only for NTB. This reduces ETB completion time significantly.

**6. Sound CAPTCHA + Refresh Option**
- Source BRD: CAPTCHA with refresh.
- Recommended: Add audio CAPTCHA for accessibility compliance (WCAG 2.1 AA).

**7. Year-of-Birth Fallback for Minor Handling**
- Source BRD: Year-only DOB → hard stop.
- Recommended: Hard stop with clear message + ARN display so customer can visit branch without restarting.

**8. Branch Selection via GPS (Future Enhancement — Phase 2)**
- Not in Phase 1 scope, but recommended: Use browser GPS to auto-suggest nearest branch, not just PIN-code lookup.

**9. Progressive Disclosure on SCR-05**
- Source BRD: Single long "Additional Details" form.
- Recommended: Break SCR-05 into accordion sections (Personal | Address | Employment | Income) to reduce cognitive load and improve mobile UX.

**10. BRE-driven Upsell with Competitor Comparison**
- Source BRE returns scheme code + USPs.
- Recommended: On SCR-10, show a comparison table (Recommended vs Basic SB101) with feature highlights — similar to Kotak 811's product selection UX. Increases higher-product adoption.

---

## 14. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Response Time | All API calls must respond within 5 seconds; UI must not block for more than 2 seconds |
| OTP Delivery SLA | OTP must be delivered within 30 seconds of request |
| Concurrency | System must support 5,000 concurrent active sessions |
| Session Timeout | Auto-save every field change; session idle timeout at 15 minutes with resume option |
| Mobile Responsiveness | All screens must render correctly on screen widths from 320px to 1440px |
| Accessibility | WCAG 2.1 Level AA compliance; keyboard navigation; audio CAPTCHA |
| Data Encryption | All PII fields encrypted in transit (TLS 1.2+) and at rest (AES-256) |
| Aadhaar Compliance | Aadhaar number must never be stored in raw form; masked after eKYC; only last 4 digits displayed |
| Audit Trail | All consent clicks, OTP verifications, and field changes must be logged with timestamp and session ID |
| CBS Downtime Handling | EOD window: 11:30 PM – 4:30 AM; system must detect CBS downtime and queue account creation for batch retry |
| Document Retention | All documents pushed to DMS within 24 hours of account creation |
| Browser Support | Chrome 90+, Firefox 90+, Safari 14+, Edge 90+ |

---

## 15. Out of Scope — Phase 1

| Feature | Reason |
|---------|--------|
| Branch-assisted journey (Maker-Checker) | Separate program; not STP |
| BC (Business Correspondent) journey | Clarifications pending |
| Mobile native app (iOS / Android) | Phase 2 |
| NRI / Non-Resident customers | Regulatory complexity; Phase 2 |
| Minor accounts (< 10 years) | Branch-only; no online STP |
| Pension / MACT / Capital Gains accounts | Branch-only scheme codes |
| Joint account opening | Phase 2 |
| Cross-sell product page | Out of scope per product decision |
| HUF account opening | Phase 2 |
| Physical Debit Card issuance | Post-VKYC operations team process |
| Live API integrations | Phase 2 (all mocked in Phase 1) |
| GPS-based branch suggestion | Phase 2 |
| Multi-language support (Hindi) | Phase 2 |
| Chat Bot / Call Centre sourced applications | Separate integration |

---

## 16. Glossary

| Term | Definition |
|------|-----------|
| STP | Straight Through Processing — end-to-end account opening with zero manual intervention |
| ETB | Existing to Bank — customer with an active account at the bank |
| NTB | New to Bank — customer with no prior bank relationship |
| ARN | Application Reference Number — unique ID generated on Lead creation in CRM/LMS |
| eKYC | Electronic Know Your Customer — Aadhaar OTP-based identity verification via UIDAI |
| VKYC | Video KYC — live video call with a bank agent for NTB customer identity verification |
| Liveness Check | Automated face capture and anti-spoofing check for ETB customers |
| UIDAI | Unique Identification Authority of India — Aadhaar issuing authority |
| NSDL | National Securities Depository Limited — PAN card database |
| CERSAI | Central Registry of Securitisation Asset Reconstruction and Security Interest — C-KYC registry |
| C-KYC | Central KYC — customer KYC data stored centrally with CERSAI |
| CBS | Core Banking System (Finacle) — bank's primary banking platform |
| DCMS | Debit Card Management System — virtual and physical debit card issuance |
| VPA | Virtual Payment Address — UPI ID (e.g., mobile@boi) |
| CFR | Central Fraud Registry — bank's internal fraud and blacklist database |
| BRE | Business Rules Engine — automated decision engine for scheme code and product selection |
| DMS | Document Management System — repository for all KYC and application documents |
| LOS | Loan Origination System (Perfios platform) — backend for application processing |
| LMS | Lead Management System — CRM module for lead tracking and status management |
| OVD | Officially Valid Document — Aadhaar, PAN, Passport, Voter ID, etc. |
| MAB / AQB | Minimum Average Balance / Average Quarterly Balance — minimum balance requirement |
| FATCA | Foreign Account Tax Compliance Act — mandatory US tax compliance declaration |
| PEP | Politically Exposed Person — declaration required by RBI guidelines |
| Min KYC | Minimum KYC state — account with restricted features; valid for 1 year; no Debit Freeze removal |
| Full KYC | Account tagged as KYC-compliant after VKYC/Liveness + Concurrent Auditor certification |
| Concurrent Auditor | Bank officer who reviews and certifies completed VKYC sessions before Full KYC is granted |
| Debit Freeze | CBS flag enabled at account creation; prevents debit transactions until Full KYC is certified |
| EOD / BOD | End of Day / Beginning of Day — CBS maintenance windows when account creation APIs are unavailable |
| ISO 8583 | Financial transaction card message interchange standard — used for CBS Dedupe API |
| NESL | National e-Governance Services Limited — e-Sign service provider |
| Z-COD | Zonal Customer Operations & Delivery — VKYC agent center |
