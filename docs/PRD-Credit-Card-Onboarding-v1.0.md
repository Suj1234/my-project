# Product Requirements Document
## Credit Card Onboarding — Digital Self-Service Journey
### Version: 1.0 | Phase: 1
### Date: 2026-05-08
### Prepared by: Product Team
### Status: Draft

---

## Document Control

### Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-05-08 | Product Team | Initial PRD — Phase 1 Web Journey (ETB + NTB) |

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
5. [Screen-by-Screen Specifications](#5-screen-by-screen-specifications)
6. [Business Rules Engine (BRE)](#6-business-rules-engine-bre)
7. [Deduplication Logic](#7-deduplication-logic)
8. [System Integrations](#8-system-integrations)
9. [Field Reference / Data Dictionary](#9-field-reference--data-dictionary)
10. [Document Management](#10-document-management)
11. [Error Handling & Edge Cases](#11-error-handling--edge-cases)
12. [Communication Templates](#12-communication-templates)
13. [Masters & Configuration](#13-masters--configuration)
14. [Reports & Dashboards](#14-reports--dashboards)
15. [Non-Functional Requirements](#15-non-functional-requirements)
16. [Glossary](#16-glossary)

---

## 1. Introduction

### 1.1 Purpose

This document defines the complete product requirements for the **Credit Card Onboarding — Digital Self-Service Journey (Phase 1)**. It serves as the single source of truth for design, engineering, and QA teams to build and validate the product.

This PRD is self-contained and does not require any supplementary source documents.

### 1.2 Scope — Phase 1

**In Scope:**

| Dimension | Scope |
|-----------|-------|
| Channel | Web (mobile-responsive web application) |
| Customer Segments | ETB (Existing to Bank) and NTB (New to Bank) |
| Journey Type | End-to-end Straight Through Processing (STP) |
| Customer Type | Regular customers (standard retail) |
| APIs | Mocked (live integration in Phase 2) |
| VKYC | Integrated — mandatory for NTB |
| e-Sign | Included |
| Bank Statement Analysis | Existing BSA solution integrated (mocked) |

**Out of Scope — Phase 1:**

- Branch-assisted journey
- LIC agent journey
- Bank staff / employee special handling
- Deviation matrix and manual underwriting workflow
- Live API integrations (deferred to Phase 2)
- NRI customer onboarding
- Mobile native app (iOS/Android)

### 1.3 Objectives

1. Enable end-to-end digital credit card application with zero paper
2. Reduce application-to-card issuance TAT through Straight Through Processing (STP)
3. Serve both ETB and NTB customers on a single unified platform
4. Ensure regulatory compliance: KYC (eKYC), VKYC, e-Sign
5. Deliver a mobile-first responsive experience accessible on any device

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Application completion rate | ≥ 70% |
| STP rate (no manual intervention) | ≥ 80% |
| Average time to complete application | ≤ 15 minutes |
| VKYC completion within window | ≥ 90% |
| System uptime | 99.9% |
| Document upload success rate | ≥ 95% |

---

## 2. Product Overview

### 2.1 Product Description

A fully digital, self-service web application enabling customers to apply for a credit card end-to-end — from eligibility check through identity verification, income assessment, and card issuance — without visiting a branch.

The system supports two parallel customer journeys:
- **ETB Journey**: Leverages existing bank relationship for data pre-fill and faster processing
- **NTB Journey**: Full digital onboarding including Aadhaar eKYC and mandatory Video KYC

### 2.2 Card Variants

The platform supports five credit card variants. Eligibility is determined by the customer's net annual income and BRE score output.

| Variant Code | Variant Name | Network | Tier | Min. Net Annual Income | Notes |
|-------------|-------------|---------|------|----------------------|-------|
| CC-01 | Horizon | RuPay Select | Entry | ₹2,50,000 | Entry-level domestic card |
| CC-02 | Ascend | Visa Platinum | Mid | ₹5,00,000 | Mid-tier international |
| CC-03 | Vertex | Visa Platinum | Premium | ₹7,50,000 | Premium Platinum tier |
| CC-04 | Prestige | Mastercard World | Super Premium | ₹12,00,000 | World-class benefits |
| CC-05 | Pinnacle | Visa Signature | Elite | ₹18,00,000 | Flagship Signature card |

> **Configuration Note**: Income thresholds and maximum credit limits are configurable parameters managed through the admin configuration module. Values above are indicative defaults subject to business approval.

### 2.3 Customer Segments

| Segment | Definition | Primary Data Source | VKYC Required |
|---------|------------|---------------------|---------------|
| ETB (Existing to Bank) | Customer with an active savings or current account with the bank | Core Banking System (CBS) | No |
| NTB (New to Bank) | Customer with no prior relationship with the bank | UIDAI / Aadhaar | Yes (Mandatory) |

**ETB Detection Method**: During journey initiation, the system runs a CBS Dedupe check using PAN + DOB. A match indicates ETB; no match indicates NTB.

---

## 3. User Personas & Journey Types

### 3.1 ETB Customer

| Attribute | Detail |
|-----------|--------|
| Who | Existing bank account holder applying for a credit card |
| Goal | Fast, pre-filled application leveraging existing bank relationship |
| Primary Pain Point | Re-entering known data; repeating verification already done at account opening |
| Key Differentiator | CBS data pre-fill; no VKYC required; faster processing |
| Typical Completion Time | 8–12 minutes |

### 3.2 NTB Customer

| Attribute | Detail |
|-----------|--------|
| Who | New customer with no prior bank relationship |
| Goal | Complete digital credit card onboarding without branch visit |
| Primary Pain Point | KYC complexity; document collection; additional VKYC step |
| Key Differentiator | Aadhaar OTP eKYC for data pre-fill; VKYC mandatory; ARK stored for future use |
| Typical Completion Time | 12–18 minutes (excluding VKYC which happens asynchronously) |

---

## 4. High-Level Journey Flow

### 4.1 ETB Journey — Flow Summary

```
[Landing Page]
      ↓
[Mobile Number Entry → OTP Verification]
      ↓
[PAN + DOB Entry]
      ↓
[CBS Dedupe Check → ETB Detected]
      ↓
[CMS Dedupe Check] ──→ [Match Found → Hard Reject]
      ↓ No Match
[LMS Dedupe Check] ──→ [Active Application Found → Resume or New]
      ↓
[Personal Details Screen — Pre-filled from CBS — Customer Reviews & Confirms]
      ↓
[ARN Generated → Lead Created in LMS]
      ↓
[Employment & Income Details]
      ↓
[EMI Obligations Declaration]
      ↓
[Document Upload]
      ↓
[Credit Bureau Fetch + BRE Processing]
      ↓
[Eligibility Result]
  ├──→ [Hard Reject → Rejection Screen → END]
  └──→ [Eligible → Proceed]
            ↓
      [Card Selection (Eligible Variants Only)]
            ↓
      [Add-on Card — Optional]
            ↓
      [Embossing Details]
            ↓
      [Consent & Declaration]
            ↓
      [e-Sign]
            ↓
      [Application Submitted → Thank You Screen]
            ↓
      [Background: Card Creation in CMS → DMS Document Push → SMS/Email Notification]
```

### 4.2 NTB Journey — Flow Summary

```
[Landing Page]
      ↓
[Mobile Number Entry → OTP Verification]
      ↓
[PAN + DOB Entry]
      ↓
[CBS Dedupe Check → NTB Detected]
      ↓
[Aadhaar OTP eKYC → UIDAI Verification → Demographic Pre-fill]
      ↓
[PAN Validation (PAN Validation Service)]
      ↓
[ARN Generated → Lead Created in LMS]
      ↓
[CMS Dedupe Check] ──→ [Match Found → Hard Reject]
      ↓ No Match
[Personal Details Screen — Pre-filled from Aadhaar — Customer Reviews & Confirms]
      ↓
[Employment & Income Details]
      ↓
[EMI Obligations Declaration]
      ↓
[Document Upload]
      ↓
[Credit Bureau Fetch + BRE Processing]
      ↓
[Eligibility Result]
  ├──→ [Hard Reject → Rejection Screen → END]
  └──→ [Eligible → Proceed]
            ↓
      [Card Selection (Eligible Variants Only)]
            ↓
      [Add-on Card — Optional]
            ↓
      [Embossing Details]
            ↓
      [Consent & Declaration]
            ↓
      [e-Sign]
            ↓
      [VKYC Scheduling — Mandatory for NTB]
            ↓
      [Application Submitted → Thank You Screen (Status: VKYC Pending)]
            ↓
      [VKYC Session Conducted (within 3 working days)]
  ├──→ [VKYC Fail → Application Rejected]
  └──→ [VKYC Pass]
            ↓
      [Background: Card Creation in CMS → DMS Document Push → Notification]
```

### 4.3 Drop-off & Resume Journey

| Parameter | Rule |
|-----------|------|
| Application validity | 30 days from ARN generation |
| Resume trigger | Mobile OTP verification → LMS Dedupe detects active ARN |
| Resume method | Re-enter mobile → OTP → system detects in-progress application |
| Resume point | Last completed screen/step |
| Customer choice | "Resume existing application" or "Start new application" |
| Starting new | Previous application marked ABANDONED; new ARN generated |
| Near-expiry reminder | SMS + Email at Day 25 and Day 29 |
| Post-expiry | Application marked EXPIRED; customer must start fresh |
| Max active applications | One per customer at any time |

---

## 5. Screen-by-Screen Specifications

### 5.1 Screen: Landing Page

**Screen ID**: SCR-01  
**Purpose**: Entry point. Communicates product value proposition and initiates application flow.

**UI Elements**:

| Element | Type | Description |
|---------|------|-------------|
| Hero section | Display | Card showcase with key benefits and headline |
| Card variant carousel | Tabs / Slider | All 5 variants displayed with benefits |
| "Apply Now" CTA | Primary Button | Initiates application |
| "Check Eligibility" | Secondary Button | Quick pre-check (optional — future scope) |
| "Resume Application" | Text Link | For returning applicants |
| Features / Benefits | Content Blocks | Key selling points of digital onboarding |
| Helpline / Chat | Persistent | Support access at any point |

**System Actions**: None (static marketing page)

**Actions**:
- Click "Apply Now" → Navigate to SCR-02 (Mobile OTP)
- Click "Resume Application" → Navigate to SCR-02 (Mobile OTP) with resume intent flag

---

### 5.2 Screen: Mobile Number & OTP Verification

**Screen ID**: SCR-02  
**Purpose**: Verify customer's mobile number to initiate application session.

**UI Elements**:

| Field | Type | Validation | Mandatory |
|-------|------|-----------|----------|
| Mobile Number | Text Input | 10-digit numeric; must start with 6, 7, 8, or 9 | Yes |
| Send OTP | Button | Triggers OTP dispatch via SMS | — |
| OTP | 6-digit PIN Input | Numeric only | Yes |
| Resend OTP | Text Link | Enabled after 30-second countdown | — |
| Timer | Countdown Display | "Resend in Xs" → "Resend OTP" | — |

**Business Rules**:

| Rule | Value |
|------|-------|
| OTP validity duration | 10 minutes |
| OTP length | 6 digits |
| Max incorrect OTP attempts | 3 (then lockout) |
| Lockout duration after max attempts | 30 minutes |
| Max OTP resend attempts | 3 |
| Resend delay | 30 seconds between resends |

**System Actions (in sequence)**:
1. Validate mobile number format (client-side)
2. On "Send OTP": Call SMS Gateway (mocked) → dispatch 6-digit OTP
3. On OTP submission: Validate OTP → if valid, proceed; if invalid, decrement attempt counter
4. Run LMS Dedupe check on verified mobile:
   - Active application found (< 30 days old) → Display prompt: "You have an existing application (Ref: [ARN]). Would you like to resume where you left off, or start a new application?"
   - No active application → Proceed to SCR-03

**Error States**:

| Trigger | Error Message |
|---------|---------------|
| Invalid mobile format | "Please enter a valid 10-digit mobile number." |
| Incorrect OTP | "The OTP entered is incorrect. [X] attempt(s) remaining." |
| OTP expired | "Your OTP has expired. Please request a new OTP." |
| Max OTP attempts exceeded | "Maximum attempts exceeded. Please try again after 30 minutes." |
| SMS delivery failure | "We were unable to send an OTP to this number. Please try again." |
| Resend limit reached | "Maximum resend limit reached. Please try again after 30 minutes." |

---

### 5.3 Screen: PAN & Date of Birth Entry

**Screen ID**: SCR-03  
**Purpose**: Capture PAN and DOB to perform age validation and CBS Dedupe to classify customer as ETB or NTB.

**UI Elements**:

| Field | Type | Validation | Mandatory |
|-------|------|-----------|----------|
| PAN Number | Text Input | Format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F); uppercase | Yes |
| Date of Birth | Date Picker | DD/MM/YYYY | Yes |
| Proceed | Button | Submits for validation and CBS check | — |

**Business Rules**:

| Rule | Detail |
|------|--------|
| Age minimum | Customer must be ≥ 21 years as of application date |
| Age maximum | Customer must be ≤ 65 years as of application date |
| PAN format | Must match regex: `[A-Z]{5}[0-9]{4}[A-Z]{1}` |
| PAN validation | Verified against PAN Validation Service |
| CBS Dedupe | PAN + DOB submitted to CBS; fuzzy name match ≥ 60% |

**System Actions (in sequence)**:
1. Client-side PAN format validation
2. Calculate customer age from DOB:
   - Age < 21 → Hard Reject (show age error, do not proceed)
   - Age > 65 → Hard Reject (show age error, do not proceed)
3. Call PAN Validation Service (mocked): Input = PAN, Name (if available), DOB
4. Call CBS Dedupe API (mocked): Input = PAN + DOB
   - CBS Match (ETB): Fetch full customer profile (Golden Fetch) → Pre-populate SCR-05 → Skip SCR-04
   - CBS No Match (NTB): Proceed to SCR-04 (Aadhaar OTP eKYC)

**Error States**:

| Trigger | Error Message |
|---------|---------------|
| Invalid PAN format | "Please enter a valid PAN (e.g., ABCDE1234F)." |
| Age < 21 | "You must be at least 21 years old to apply for a credit card." |
| Age > 65 | "Applicants above 65 years of age are not eligible for this product." |
| Invalid PAN (PAN service) | "We could not verify your PAN. Please check and try again." |
| CBS service failure | Retry × 3; if still fails, treat as NTB and log warning |

---

### 5.4 Screen: Aadhaar OTP eKYC (NTB Only)

**Screen ID**: SCR-04  
**Purpose**: Verify NTB customer identity using Aadhaar OTP and pre-fill personal details from UIDAI.

**UI Elements**:

| Element | Type | Validation | Mandatory |
|---------|------|-----------|----------|
| Consent Statement | Display | Full text: "I consent to Aadhaar-based eKYC verification by [Bank] to enable paperless onboarding." | — |
| Consent Checkbox | Checkbox | Must be checked before Aadhaar entry is enabled | Yes |
| Aadhaar Number | Text Input | 12-digit numeric; masked after entry (show last 4 digits) | Yes |
| Send OTP | Button | Triggers UIDAI OTP to Aadhaar-registered mobile | — |
| OTP | 6-digit PIN Input | Numeric only | Yes |
| Resend OTP | Text Link | After 30-second countdown | — |
| Info Note | Display | "OTP will be sent to the mobile number registered with your Aadhaar." | — |

**Business Rules**:

| Rule | Detail |
|------|--------|
| Consent | Mandatory — Aadhaar field disabled until consent checkbox is checked |
| Aadhaar storage | Aadhaar number is NEVER stored in the system |
| ARK generation | Aadhaar Reference Key (ARK) generated and stored in Aadhaar Vault post-success |
| OTP target | OTP sent to Aadhaar-registered mobile (may differ from application mobile) |
| OTP validity | 10 minutes |
| Max OTP attempts | 3 |
| Name mismatch check | Aadhaar DOB must match PAN DOB (entered in SCR-03); if mismatch, flag for review |
| Data pre-filled post-eKYC | Full Name, DOB, Gender, Permanent Address, Photo |

**System Actions (in sequence)**:
1. Customer checks consent checkbox → Aadhaar input field enabled
2. Customer enters Aadhaar → Send OTP clicked → Call UIDAI API (mocked) → OTP dispatched to Aadhaar-linked mobile
3. Customer enters OTP → Submit → UIDAI validates OTP (mocked)
4. On success:
   - Receive demographic data: Name, DOB, Gender, Address, Photo
   - Store ARK in Aadhaar Vault (mocked); Aadhaar number discarded
   - Generate ARN; create lead in LMS (mocked)
   - Pre-populate SCR-05 (Personal Details) with UIDAI data
   - Proceed to PAN Validation (inline, post eKYC)
5. Call PAN Validation Service (mocked) to validate PAN against UIDAI name + DOB
6. Proceed to SCR-05 (Personal Details)

**Error States**:

| Trigger | Error Message |
|---------|---------------|
| Consent not given | Aadhaar field disabled; "Please provide consent to proceed." |
| Invalid Aadhaar format | "Please enter a valid 12-digit Aadhaar number." |
| Invalid / expired OTP | "The OTP entered is incorrect or has expired. Please try again." |
| UIDAI service unavailable | "Aadhaar verification is temporarily unavailable. Please try again after some time." |
| DOB mismatch (Aadhaar vs PAN entry) | "The date of birth on your Aadhaar does not match. Please verify your details." |
| Max attempts exceeded | "Maximum attempts reached. Please try again after 30 minutes." |

---

### 5.5 Screen: Personal Details

**Screen ID**: SCR-05  
**Purpose**: Capture and confirm customer's personal information. Data pre-filled from CBS (ETB) or UIDAI (NTB); customer reviews and confirms.

**Pre-fill Behavior**:

| Field Group | ETB Source | NTB Source |
|-------------|-----------|-----------|
| Name, DOB, Gender | CBS | UIDAI (Aadhaar) |
| Permanent Address | CBS | UIDAI (Aadhaar) |
| Email, Mobile | CBS (if available) | Customer entry |
| PAN | Customer entry | Customer entry (validated) |

**Field Definitions**:

| Field Name | Field Type | Source | Editable | Validation | Mandatory |
|-----------|-----------|--------|---------|-----------|----------|
| Full Name (as per KYC) | Text Display | UIDAI / CBS | No (Locked) | — | Yes |
| Date of Birth | Date Display | UIDAI / CBS | No (Locked) | — | Yes |
| Gender | Dropdown Display | UIDAI / CBS | No (Locked) | Male / Female / Transgender | Yes |
| Father's Name | Text Input | CBS / Manual | Yes | Alpha + spaces only; max 50 chars | Yes |
| Mother's Name | Text Input | CBS / Manual | Yes | Alpha + spaces only; max 50 chars | No |
| Marital Status | Dropdown | Manual | Yes | Single / Married / Divorced / Widowed / Separated | Yes |
| PAN Number | Text Display | Manual (SCR-03) | No (Locked) | — | Yes |
| Email Address | Text Input | CBS / Manual | Yes | Valid email format | Yes |
| Mobile Number | Text Display | SCR-02 (OTP verified) | No (Locked) | — | Yes |
| Alternate Mobile Number | Text Input | Manual | Yes | 10-digit; must differ from primary | No |
| Nationality | Dropdown | Manual | Yes | Indian (default, only option Phase 1) | Yes |
| Religion | Dropdown | Manual | Yes | See Master 13.8 | No |
| Category | Dropdown | Manual | Yes | General / SC / ST / OBC / Others | No |
| Physically Challenged | Toggle | Manual | Yes | Yes / No | No |
| KYC Mode | Display | System | No | Aadhaar OTP eKYC | — |

**Permanent Address Fields (Locked — from Aadhaar/CBS)**:

| Field | Editable | Mandatory |
|-------|---------|----------|
| Address Line 1 | No | Yes |
| Address Line 2 | No | No |
| City / Town | No | Yes |
| District | No | No |
| State | No | Yes |
| PIN Code | No | Yes |
| Country | No | Yes (India) |

**Correspondence Address**:

| Field | Editable | Mandatory | Condition |
|-------|---------|----------|---------|
| "Same as permanent address" toggle | Yes | Yes | Default ON |
| Correspondence Address Line 1 | Yes | Yes | If toggle OFF |
| Correspondence Address Line 2 | Yes | No | If toggle OFF |
| Correspondence City | Yes | Yes | If toggle OFF |
| Correspondence State | Yes | Yes | If toggle OFF |
| Correspondence PIN Code | Yes | Yes | If toggle OFF |

**Business Rules**:
- Locked fields (Name, DOB, Gender, Permanent Address) display a lock icon with tooltip: "This information is sourced from official records and cannot be modified."
- If ETB and CBS has an outdated email: pre-fill but allow editing
- Correspondence address defaults to same as permanent address
- Nationality restricted to "Indian" in Phase 1

**System Actions**:
1. Pre-fill all available fields from source (CBS or UIDAI)
2. On Submit: Validate all mandatory fields
3. For NTB: Run CMS Dedupe (check for existing credit card with this PAN):
   - CMS Match (existing card) → Hard Reject (SCR-10)
   - No match → Proceed to SCR-06

---

### 5.6 Screen: Employment & Income Details

**Screen ID**: SCR-06  
**Purpose**: Capture employment profile and income details for credit assessment and FOIR calculation.

#### Sub-Screen 5.6.1: Employment Type Selection

| Option | Code | Description |
|--------|------|-------------|
| Salaried | SAL | Employee receiving regular salary |
| Self-Employed Professional | SEP | Doctor, CA, CS, Lawyer, Architect, Consultant |
| Self-Employed Non-Professional | SENP | Trader, Manufacturer, Business owner |

---

#### Sub-Screen 5.6.2: Salaried Fields

| Field | Type | Validation | Mandatory |
|-------|------|-----------|----------|
| Employer Name | Text | Alpha + spaces; max 100 chars | Yes |
| Employer Type | Dropdown | Government / PSU / Private / MNC / Other | Yes |
| Industry | Dropdown | See Master 13.5 | Yes |
| Designation | Text | Alpha + spaces; max 50 chars | Yes |
| Date of Joining | Date | Must be in past; max 45 years ago | Yes |
| Official Email ID | Text | Valid email format | No |
| Office Address Line 1 | Text | Max 100 chars | Yes |
| Office Address Line 2 | Text | Max 100 chars | No |
| Office City | Text / Dropdown | City master (searchable) | Yes |
| Office State | Dropdown | State master | Yes |
| Office PIN Code | Text | 6-digit numeric | Yes |
| Office Phone | Text | 10 or 11-digit numeric | No |
| Net Monthly Income (NMI) | Number | > 0; max 12 digits | Yes |
| Gross Annual Income | Number | > 0; auto-calculable (NMI × 12) or manual entry | Yes |
| Other Monthly Income | Number | ≥ 0 | No |
| Source of Other Income | Text | If Other Income > 0 | Conditional |

---

#### Sub-Screen 5.6.3: SEP (Self-Employed Professional) Fields

| Field | Type | Validation | Mandatory |
|-------|------|-----------|----------|
| Profession | Dropdown | Doctor / CA / CS / Lawyer / Architect / Consultant / Other | Yes |
| Years in Practice | Number | 0–50 | Yes |
| Business / Firm Name | Text | Max 100 chars | Yes |
| GST Number | Text | 15-character GST format | No |
| Business Address Line 1 | Text | Max 100 chars | Yes |
| Business City | Dropdown | City master | Yes |
| Business State | Dropdown | State master | Yes |
| Business PIN Code | Text | 6-digit | Yes |
| Business Phone | Text | 10/11-digit numeric | No |
| Net Monthly Income | Number | > 0 | Yes |
| Gross Annual Income | Number | > 0 | Yes |
| Net Annual Income (as per ITR) | Number | > 0 | Yes |

---

#### Sub-Screen 5.6.4: SENP (Self-Employed Non-Professional) Fields

| Field | Type | Validation | Mandatory |
|-------|------|-----------|----------|
| Nature of Business | Dropdown | Trading / Manufacturing / Services / Agriculture / Other | Yes |
| Business Name | Text | Max 100 chars | Yes |
| Years in Business | Number | 0–50 | Yes |
| GST Number | Text | 15-character GST format | No |
| Business Address Line 1 | Text | Max 100 chars | Yes |
| Business City | Dropdown | City master | Yes |
| Business State | Dropdown | State master | Yes |
| Business PIN Code | Text | 6-digit | Yes |
| Net Monthly Income | Number | > 0 | Yes |
| Gross Annual Income | Number | > 0 | Yes |
| Net Annual Income (as per ITR) | Number | > 0 | Yes |

**Business Rules**:
- FOIR threshold varies by employment type:
  - Salaried: Max FOIR = 70%
  - SEP: Max FOIR = 50%
  - SENP: Max FOIR = 50%
- Income entered here feeds the Score Card (Section 6.3) and FOIR calculation (Section 6.4)
- Minimum income for eligibility checked against lowest card variant threshold (CC-01 = ₹2,50,000 NAI)

---

### 5.7 Screen: EMI Obligations Declaration

**Screen ID**: SCR-07  
**Purpose**: Capture existing loan and EMI obligations to calculate FOIR accurately.

**UI Elements**:

| Field | Type | Validation | Mandatory |
|-------|------|-----------|----------|
| Do you have existing EMI obligations? | Toggle / Radio | Yes / No | Yes |
| [If Yes] Loan Type | Dropdown (repeatable row) | Home Loan / Car Loan / Personal Loan / Education Loan / Business Loan / Other | Yes |
| Outstanding Principal | Number | > 0 | No |
| Monthly EMI Amount | Number | > 0 | Yes |
| Remaining Tenure (months) | Number | > 0 | Yes |
| Lender Name | Text | Max 50 chars | No |
| Add Another Loan | Button | Adds new row | — |
| Remove Loan | Icon Button | Removes row | — |
| Total Monthly EMI (auto-calculated) | Display | Sum of all EMI rows | — |

**Business Rules**:
- FOIR uses the HIGHER of: customer-declared total EMI OR Credit Bureau-reported total EMI
- Bureau EMI values fetched during BRE processing (SCR-09)
- Customer declaration saved for audit trail regardless
- System calculates an estimated EMI for the new credit card and includes it in FOIR:
  > New Card EMI (estimated) = 5% of Approved Credit Limit per month

**System Actions**:
1. Validate each EMI row (amount > 0, tenure > 0)
2. Calculate total declared EMI (auto-sum)
3. Store declared obligations in application record
4. Final FOIR calculated post Credit Bureau fetch (SCR-09)

---

### 5.8 Screen: Document Upload

**Screen ID**: SCR-08  
**Purpose**: Collect supporting KYC and income documents based on employment type.

**Documents Required by Employment Type**:

| Document | Salaried | SEP | SENP | Formats Accepted | Max Size |
|---------|---------|-----|------|-----------------|---------|
| PAN Card | Mandatory | Mandatory | Mandatory | JPG, PNG, PDF | 2 MB |
| Aadhaar Card — Front | Mandatory | Mandatory | Mandatory | JPG, PNG, PDF | 2 MB |
| Aadhaar Card — Back | Mandatory | Mandatory | Mandatory | JPG, PNG, PDF | 2 MB |
| Passport-size Photo | Mandatory | Mandatory | Mandatory | JPG, PNG | 500 KB |
| Salary Slip — Month 1 (latest) | Mandatory | — | — | PDF, JPG, PNG | 2 MB |
| Salary Slip — Month 2 | Mandatory | — | — | PDF, JPG, PNG | 2 MB |
| Salary Slip — Month 3 | Mandatory | — | — | PDF, JPG, PNG | 2 MB |
| Bank Statement (last 6 months) | Mandatory | Mandatory | Mandatory | PDF | 5 MB |
| ITR — Year 1 (most recent) | Optional | Mandatory | Mandatory | PDF | 5 MB |
| ITR — Year 2 | Optional | Mandatory | Mandatory | PDF | 5 MB |
| Form 16 | Optional | — | — | PDF | 2 MB |
| GST Certificate | — | If GST registered | If GST registered | PDF, JPG, PNG | 2 MB |
| Business Registration Certificate | — | Optional | Optional | PDF, JPG | 2 MB |
| CA / Professional Membership Certificate | — | If CA/CS | — | PDF, JPG | 2 MB |

**UI Behavior**:
- Each document card has: upload zone (drag-drop or browse) + label + format/size guidance
- Post upload: thumbnail preview + file name + file size displayed
- Re-upload / Delete option per document
- Upload progress indicator per file
- Section-level progress: "X of Y required documents uploaded"
- All mandatory documents must be uploaded before "Next" is enabled

**System Actions**:
1. Client-side: validate file format and size before upload
2. On upload: store documents temporarily (session/temp storage)
3. On section completion: Push all documents to DMS (mocked)
4. Trigger Bank Statement Analysis (BSA) service on bank statement upload (mocked):
   - BSA output: average monthly credit, EMI/obligations detected, income classification
   - BSA output stored; used in FOIR cross-validation
5. Trigger ITR Analysis service on ITR upload (mocked):
   - Output: net taxable income, income sources

**Error States**:

| Trigger | Error Message |
|---------|---------------|
| Invalid file format | "Only [accepted formats] are accepted for [Document Name]." |
| File size exceeded | "File size exceeds the [X] MB limit for this document type." |
| Upload failure | "Document upload failed. Please check your connection and try again." |
| Mandatory doc missing on Next | "Please upload [Document Name] to proceed." |

---

### 5.9 Screen: BRE Processing (System / Interstitial Screen)

**Screen ID**: SCR-09  
**Purpose**: System-driven processing screen shown while Credit Bureau fetch and BRE run in the background.

**UI Elements**:

| Element | Type | Content |
|---------|------|---------|
| Processing animation | Visual | Spinner / progress animation |
| Status message | Display | "We are assessing your application. This usually takes less than 60 seconds." |
| Progress steps | Step indicator | Step 1: Credit Check → Step 2: Income Verification → Step 3: Eligibility Assessment |

**No customer input on this screen.**

**System Actions (Background, in sequence)**:
1. **Credit Bureau Fetch** (mocked):
   - Input: PAN, Name, DOB, Address
   - Output: Bureau score, DPD, active accounts, enquiries, EMI data
   - Enquiry type: Soft enquiry (does not impact customer score)
2. **Parse Bureau Score**:
   - Score ≥ 740 → Eligible (proceed with BRE)
   - Score 300–739 → Hard Reject
   - Score -1 (credit age < 6 months) → Apply NAI-based limit table (see Section 6.1)
   - Score 0 / No Hit → Apply NAI-based limit table
3. **Run Score Card** (Section 6.3) — all 13 parameters evaluated
4. **Calculate FOIR** (Section 6.4)
   - Use HIGHER of declared EMI vs bureau EMI
   - Check FOIR against threshold; reject if exceeded
5. **Name Mismatch Check** (Section 6.5)
   - Compare Aadhaar name vs PAN / ITR / GST / Bank Statement
   - Flag if any match < 60%
6. **Derive Sanction Limit** (Section 6.6)
7. **Determine Eligible Card Variants** based on customer income and BRE tier
8. **Final Decision**:
   - Any hard reject criterion → route to SCR-10 (Rejection)
   - All clear → route to SCR-11 (Card Selection)

**Transition Logic**:
- Reject → SCR-10
- Approve → SCR-11

---

### 5.10 Screen: Application Rejection

**Screen ID**: SCR-10  
**Purpose**: Communicate ineligibility to the customer with empathy. Specific reason NOT disclosed (regulatory compliance).

**UI Elements**:

| Element | Type | Content |
|---------|------|---------|
| Declined illustration | Visual | Appropriate rejection visual |
| Main message | Display | "We appreciate your interest in our Credit Card. Unfortunately, we are unable to process your application at this time." |
| ARN reference | Display | "Your Application Reference Number: [ARN]" |
| Support CTA | Button | "Contact Us" → Customer support channel |
| Reapply info | Display | "You may be eligible to reapply after [X] months." |

**Business Rules**:
- Specific rejection reason is NEVER shown to the customer (regulatory/privacy)
- Rejection reason logged internally with full detail for audit and reporting
- Cooling-off period (configurable): Default 3 months
- Application status updated to REJECTED in LMS

**System Actions**:
1. Update LMS status to REJECTED
2. Log rejection reason (with reason code) in internal audit log
3. Trigger rejection SMS (T-SMS-07)
4. Trigger rejection Email (T-EMAIL-05)

---

### 5.11 Screen: Card Selection

**Screen ID**: SCR-11  
**Purpose**: Customer selects desired credit card variant from eligible options.

**UI Elements**:

| Element | Type | Description |
|---------|------|-------------|
| Eligible card tiles | Card Grid | Only variants customer qualifies for (by income and BRE score) |
| Card image / art | Image Placeholder | Placeholder card image per variant |
| Card name | Heading | Horizon / Ascend / Vertex / Prestige / Pinnacle |
| Network logo | Logo | RuPay / Visa / Mastercard |
| Tier badge | Badge | Entry / Mid / Premium / Super Premium / Elite |
| Approved Credit Limit | Highlighted Display | Customer's specific approved limit shown |
| Key Benefits | Bullet List | 3–5 benefits per card |
| Select Button | Radio CTA | One selection allowed |
| "Why am I not seeing [Variant]?" | Info Link | Explains eligibility logic (generic) |

**Business Rules**:
- Only variants where customer's income ≥ variant minimum NAI AND BRE decision = eligible are shown
- If only one variant is eligible: auto-selected; customer still sees it and can confirm
- If no variants eligible: route to SCR-10 (Rejection)
- Approved credit limit is pre-calculated by BRE output and variant-specific
- Customer selects exactly one variant

**System Actions**:
1. Receive eligible variants list from BRE output (SCR-09)
2. Filter card catalog (Master 13.2) to eligible variants only
3. Customer selection → save variant code + approved limit to application record
4. Proceed to SCR-12

---

### 5.12 Screen: Add-On Card (Optional)

**Screen ID**: SCR-12  
**Purpose**: Allow primary cardholder to optionally apply for add-on card(s) for immediate family members.

**UI Elements**:

| Element | Type | Description |
|---------|------|-------------|
| "Do you want to add a family member card?" | Toggle / Radio | Yes / No |
| [If Yes] Add-on applicant section | Form | See fields below |
| Add Another Member | Button | Adds second add-on form (max 3 total) |
| Skip | Button | Proceeds without add-on |

**Add-on Applicant Fields**:

| Field | Type | Validation | Mandatory |
|-------|------|-----------|----------|
| Full Name | Text | Alpha + spaces; max 50 chars | Yes |
| Relationship to Primary | Dropdown | See Master 13.6 | Yes |
| Date of Birth | Date | DOB resulting in age 18–65 | Yes |
| Gender | Dropdown | Male / Female / Transgender | Yes |
| Mobile Number | Text | 10-digit; must differ from primary applicant's mobile | Yes |
| Email Address | Text | Valid email format | No |
| PAN Number | Text | Format: AAAAA9999A | Yes |
| Aadhaar Number | Text | 12-digit numeric (for KYC verification) | Yes |

**Business Rules**:

| Rule | Detail |
|------|--------|
| Add-on card limit | ≤ Primary card approved limit |
| Maximum add-on cards | 3 per primary card |
| Minimum add-on applicant age | 18 years |
| Maximum add-on applicant age | 65 years |
| PAN uniqueness | Add-on PAN must differ from primary applicant PAN |
| Add-on credit assessment | Not required — add-on shares primary's credit limit |
| VKYC for add-on | Not required |
| Add-on KYC | PAN + Aadhaar verified (mocked in Phase 1) |

**System Actions**:
1. Validate age eligibility for each add-on applicant
2. Validate PAN uniqueness (add-on ≠ primary)
3. Validate Aadhaar format (12 digits)
4. If customer skips: proceed without add-on
5. Save all add-on applicant details to application record

**Error States**:

| Trigger | Error Message |
|---------|---------------|
| Add-on PAN same as primary | "Add-on applicant must have a different PAN from the primary applicant." |
| Age < 18 | "Add-on applicant must be at least 18 years old." |
| Age > 65 | "Add-on applicant must be below 65 years of age." |
| Max add-ons reached | "You can add a maximum of 3 add-on cardholders." |

---

### 5.13 Screen: Embossing Details

**Screen ID**: SCR-13  
**Purpose**: Capture the name to be embossed (printed) on the physical credit card.

**UI Elements**:

| Element | Type | Validation | Mandatory |
|---------|------|-----------|----------|
| Name on Card (Primary) | Text Input | Max 19 characters; A–Z, 0–9, space only; no special characters | Yes |
| Card preview | Visual Display | Live preview of name positioned on card template | — |
| Character counter | Display | "[X] / 19 characters" — updates in real-time | — |

**For add-on card (if applicable)**:

| Element | Type | Mandatory |
|---------|------|----------|
| Name on Card (Add-on 1) | Text Input | Yes (if add-on added) |
| Name on Card (Add-on 2) | Text Input | Conditional |
| Name on Card (Add-on 3) | Text Input | Conditional |

**Business Rules**:

| Rule | Detail |
|------|--------|
| Default value | First Name + space + Last Name (from application), truncated to 19 chars |
| Allowed characters | A–Z (uppercase), 0–9, single space |
| Prohibited | Special characters (&, #, @, /, -, ., etc.), leading spaces, trailing spaces, double spaces |
| Length | Minimum 2 characters; maximum 19 characters |
| Case | Stored and embossed in UPPERCASE |
| Customer edit | Allowed within constraints |

**System Actions**:
1. Auto-populate default from application name
2. Real-time character count + validation on each keystroke
3. Live card preview updates with typed name
4. On submit: save embossing name(s) to application record

---

### 5.14 Screen: Consent & Declaration

**Screen ID**: SCR-14  
**Purpose**: Obtain explicit informed consent from the customer before final application submission.

**UI Elements**:

| Element | Type | Description |
|---------|------|-------------|
| Application Summary | Collapsible Section | Name, PAN, DOB, Employment type, Declared income, Card selected, Approved limit, Add-on (if any) |
| Declaration Text | Scrollable Block | Full legal declaration text (see below) |
| Consent Box 1 | Checkbox | "I confirm that all information provided in this application is true, accurate, and complete to the best of my knowledge." |
| Consent Box 2 | Checkbox | "I authorise [Bank] to conduct credit bureau enquiries in connection with my credit card application." |
| Consent Box 3 | Checkbox | "I consent to receive communications (SMS, Email, WhatsApp) regarding my application and account." |
| Consent Box 4 | Checkbox | "I have read, understood, and agree to the Terms & Conditions and the Most Important Terms & Conditions (MITC)." |
| Terms & Conditions | Link | Opens in modal or new tab |
| MITC | Link | Opens in modal or new tab |
| Proceed to e-Sign | Primary Button | Enabled only when all 4 consent checkboxes are checked |

**Declaration Text (Summary)**:
> I/We hereby declare that the information furnished in this application is true, accurate, and complete. I/We authorize [Bank] to verify the information provided, conduct credit enquiries, and share my/our data with credit bureaus and regulatory authorities as required. I/We understand that any false information may lead to rejection of the application and legal liability. I/We acknowledge that [Bank]'s decision on this application is final and binding.

**Business Rules**:
- All 4 consent checkboxes must be checked — "Proceed" button remains disabled until all are checked
- Unchecking any checkbox re-disables the "Proceed" button
- Consent timestamp and IP address logged for regulatory audit

**System Actions**:
1. Dynamically populate Application Summary from application record
2. On Proceed: Log consent record (timestamp, IP address, user agent, ARN, checkbox states)
3. Navigate to SCR-15 (e-Sign)

---

### 5.15 Screen: e-Sign (Electronic Signature)

**Screen ID**: SCR-15  
**Purpose**: Customer digitally signs the application document — legally binding, equivalent to physical signature.

**UI Elements**:

| Element | Type | Description |
|---------|------|-------------|
| Application PDF viewer | Embedded PDF | Full application form PDF for review |
| "I have reviewed the document" | Checkbox | Must check before signing is enabled |
| Request e-Sign OTP | Button | Triggers OTP from e-Sign Service |
| OTP Input | 6-digit PIN | OTP from e-Sign service |
| Sign & Submit | Button | Final application submission |

**Business Rules**:

| Rule | Detail |
|------|--------|
| e-Sign mandatory | Cannot proceed without e-Sign |
| OTP delivery | Sent to customer's registered mobile via e-Sign Service |
| OTP validity | 10 minutes |
| Max OTP attempts | 3 |
| Document | Application form PDF (auto-generated from application data) |
| Signed document storage | Stored in DMS immediately post-signing |

**System Actions (in sequence)**:
1. Generate application PDF from application data (all screens compiled)
2. Display PDF in viewer for customer review
3. On "Request e-Sign OTP": Call e-Sign Service (mocked) → OTP dispatched to registered mobile
4. On OTP submission: Validate with e-Sign Service (mocked)
5. On success:
   - Receive signed document (PDF with digital signature) from e-Sign Service
   - Store signed document in DMS (mocked): Document code DOC-APP
   - Update application status to ESIGNED in LMS
   - Trigger e-Sign confirmation SMS (T-SMS-02) and Email (T-EMAIL-07)
   - ETB: Navigate to SCR-17 (Thank You)
   - NTB: Navigate to SCR-16 (VKYC Scheduling)

**Error States**:

| Trigger | Error Message |
|---------|---------------|
| e-Sign OTP invalid | "Invalid OTP. Please try again." |
| e-Sign OTP expired | "OTP has expired. Please request a new one." |
| PDF generation failure | "Unable to generate application document. Please try again." |
| e-Sign Service unavailable | "Digital signature service is temporarily unavailable. Please try again in a few minutes." |

---

### 5.16 Screen: VKYC Scheduling (NTB Only)

**Screen ID**: SCR-16  
**Purpose**: Schedule a Video KYC session for NTB customers to complete identity verification.

**UI Elements**:

| Element | Type | Description |
|---------|------|-------------|
| Information block | Display | "Video KYC (VKYC) is required to complete your credit card application. Please schedule your session below." |
| Requirements checklist | Display | Stable internet, working camera, microphone, original PAN + Aadhaar |
| Slot calendar | Calendar / Date picker | Next 7 calendar days; working hours only (e.g., 9 AM – 6 PM IST, Mon–Sat) |
| Time slot picker | Dropdown / Grid | 30-minute slots; only available slots shown |
| Confirm Slot | Primary Button | Books the selected slot |
| "Schedule Later" | Text Link | Sends scheduling link via SMS/Email; customer schedules later |

**Business Rules**:

| Rule | Detail |
|------|--------|
| VKYC completion window | Must be completed within **3 working days** of e-Sign |
| VKYC expiry | Application expires if VKYC not completed within **7 working days** of e-Sign |
| Reminders | Sent at end of Day 1 and Day 2 (SMS + Email) |
| Max reschedules allowed | 2 times |
| VKYC location | Customer must be physically present in India |
| Required items | Original PAN card + Aadhaar card (for display to agent) |
| Environment | Good lighting, no third party visible in frame |

**VKYC Session Conduct**:
- Customer connects to VKYC platform at scheduled time
- VKYC agent verifies: identity (face match vs Aadhaar photo), PAN display, liveness check
- Session recorded and stored (reference stored in DMS; recording stored in VKYC vendor system)

**VKYC Outcomes**:

| Outcome | Trigger | System Action |
|---------|---------|---------------|
| PASS | Agent marks session complete + successful | → Card creation initiated; confirmation SMS/Email sent |
| FAIL | Agent marks session failed (identity mismatch, liveness fail, etc.) | → Application rejected; T-SMS-07 + T-EMAIL-05 sent |
| NO SHOW | Customer did not join at scheduled time | → Reschedule link sent via SMS/Email; if max reschedules reached → Application expired |
| EXPIRED | Window exceeded without completion | → Application marked EXPIRED; T-SMS-08 + T-EMAIL-06 sent |

**System Actions**:
1. Retrieve available VKYC slots from VKYC Service (mocked)
2. Customer selects slot → Call VKYC Service to book slot (mocked)
3. On booking: Send VKYC appointment confirmation SMS (T-SMS-04) + Email (T-EMAIL-03)
4. Add slot to customer's calendar (via iCal link in email)
5. On Day 1 and Day 2: Trigger reminder SMS (T-SMS-05) + Email
6. Proceed to SCR-17 (Thank You)

---

### 5.17 Screen: Thank You / Application Confirmation

**Screen ID**: SCR-17  
**Purpose**: Confirm successful application submission. Inform customer of next steps.

**UI Elements**:

| Element | Type | Description |
|---------|------|-------------|
| Success illustration | Visual | Checkmark / success animation |
| Confirmation heading | Display | "Application Submitted Successfully!" |
| Application Reference Number (ARN) | Prominent Display | "Your Reference Number: [ARN]" (copyable) |
| Application status | Display | ETB: "Under Review" / NTB: "Pending Video KYC" |
| Next steps list | Numbered List | What happens next (varies by ETB/NTB) |
| Download Application | Button | Download signed application PDF |
| Add VKYC to calendar | Button | NTB only — iCal / Google Calendar link |
| Track Application | Link | Tracking page (future scope) |
| Contact Support | Link | Helpline / chat |

**Next Steps Content — ETB**:
1. Your application is being reviewed
2. You will receive a confirmation SMS and email
3. Your credit card will be dispatched within [X] working days upon approval
4. For any queries, call [helpline] or email [support email]

**Next Steps Content — NTB**:
1. Please complete your Video KYC within 3 working days to avoid application expiry
2. VKYC appointment: [Date + Time] (if scheduled)
3. Keep your original PAN and Aadhaar ready for VKYC
4. Post VKYC completion, your card will be dispatched within [X] working days

**System Actions (Background, post-submission)**:
1. Update LMS status → SUBMITTED
2. Push all documents to DMS (mocked): all KYC + income docs + signed application PDF
3. Trigger confirmation SMS (T-SMS-02)
4. Trigger confirmation Email (T-EMAIL-01)
5. For ETB (STP path): Trigger card creation request to CMS (mocked)
6. For NTB: Trigger VKYC appointment confirmation SMS (T-SMS-04) + Email (T-EMAIL-03)
7. For ETB card creation success: Update status → CARD_CREATED; trigger dispatch notification SMS (T-SMS-09) when dispatched

---

## 6. Business Rules Engine (BRE)

### 6.1 Hard Reject Criteria

If **any** of the following conditions are met, the application is immediately rejected. Hard rejects are non-negotiable and require no further processing.

| Rule ID | Criterion | Threshold / Condition | Action |
|---------|-----------|----------------------|--------|
| HRJ-01 | Applicant Age | < 21 years OR > 65 years | Hard Reject at SCR-03 |
| HRJ-02 | PAN Validity | PAN not found / invalid per PAN Validation Service | Hard Reject at SCR-03 |
| HRJ-03 | Credit Bureau Score | Score > 0 AND Score < 740 | Hard Reject at SCR-09 |
| HRJ-04 | Existing Credit Card | CMS Dedupe: applicant already holds primary or add-on credit card with [Bank] | Hard Reject at SCR-05 |
| HRJ-05 | FOIR | FOIR > threshold (50% SEP/SENP; 70% Salaried) | Hard Reject at SCR-09 |
| HRJ-06 | Minimum Income | NAI < ₹2,50,000 (below minimum for all variants) | Hard Reject at SCR-09 |
| HRJ-07 | Name Mismatch | Aadhaar name match < 60% against any verified document (PAN/ITR/GST/Bank Statement) | Hard Reject at SCR-09 |
| HRJ-08 | Nationality | Non-Indian nationality declared | Hard Reject at SCR-05 |
| HRJ-09 | Score Card Total | Score Card Total < 300 | Hard Reject at SCR-09 |

### 6.2 Credit Bureau Score — Special Cases

| CIBIL Score Value | Interpretation | Action |
|-------------------|---------------|--------|
| 740–900 | Good to Excellent | Eligible — proceed with standard BRE |
| 300–739 | Below minimum threshold | Hard Reject (HRJ-03) |
| -1 | Credit age < 6 months (thin file) | Apply NAI-based limit table (see below) |
| 0 / No Hit | No credit history (New to Credit) | Apply NAI-based limit table (see below) |

**NAI-Based Credit Limit Table (for Score -1 or 0)**:

| Net Annual Income (NAI) Band | Approved Credit Limit (Indicative) |
|-----------------------------|-------------------------------------|
| ₹2,50,000 – ₹4,99,999 | [Configurable — e.g., ₹25,000] |
| ₹5,00,000 – ₹9,99,999 | [Configurable — e.g., ₹50,000] |
| ₹10,00,000 – ₹14,99,999 | [Configurable — e.g., ₹75,000] |
| ₹15,00,000 and above | [Configurable — e.g., ₹1,00,000] |

> **Note**: Approval for CIBIL = -1 or 0 cases is subject to income proof document validation (ITR/BSA). Eligibility for these cases is policy-configurable. Specific limit values are set in the admin configuration module.

### 6.3 Score Card

The Score Card is a weighted parameter scoring model that evaluates creditworthiness beyond the bureau score.

**Formula**:
> Score Card Total = Σ (Parameter Weight × Benchmark Score for that parameter)
> Maximum Possible Total = **1000** (Weight sum = 100; Benchmark Score max = 10)
> **Minimum Qualifying Total = 300**

**Parameters**:

| # | Parameter | Weight | Max (W×10) | Scoring Logic (Benchmark Score: 1–10) |
|---|-----------|--------|-----------|---------------------------------------|
| 1 | Credit Bureau Score | 20 | 200 | See Table 6.3.A |
| 2 | Net Monthly Income | 15 | 150 | See Table 6.3.B |
| 3 | Employment Type | 10 | 100 | Salaried=10; SEP=7; SENP=5 |
| 4 | Employment Stability (Years in current job/practice) | 8 | 80 | See Table 6.3.C |
| 5 | FOIR | 8 | 80 | See Table 6.3.D |
| 6 | DPD — Days Past Due (last 12 months) | 8 | 80 | 0 DPD=10; 1–29 days=7; 30–59 days=5; 60+ days=1 |
| 7 | Credit Enquiries (last 6 months) | 7 | 70 | 0=10; 1=7; 2=5; 3=3; 4 or more=1 |
| 8 | Active Loan Count | 5 | 50 | 0=10; 1–2=7; 3–4=5; 5 or more=1 |
| 9 | Applicant Age | 5 | 50 | 21–25=5; 26–45=10; 46–55=7; 56–65=3 |
| 10 | Residence Type | 4 | 40 | Owned=10; Rented=7; Parental/Others=5 |
| 11 | Residence Stability (Years at current address) | 4 | 40 | > 5 years=10; 3–5 years=7; 1–3 years=5; < 1 year=3 |
| 12 | Education Level | 3 | 30 | Post-Graduate=10; Graduate=7; Intermediate/12th=5; Below 12th=3 |
| 13 | Existing Bank Relationship | 3 | 30 | ETB=10; NTB=5 |
| **Total** | | **100** | **1000** | Minimum qualifying = 300 |

**Table 6.3.A — Credit Bureau Score Benchmark**:

| Bureau Score Range | Benchmark Score |
|-------------------|----------------|
| 800–900 | 10 |
| 760–799 | 7 |
| 740–759 | 5 |
| -1 or 0 | Special handling per Section 6.2 |

**Table 6.3.B — Net Monthly Income Benchmark**:

| Net Monthly Income | Benchmark Score |
|-------------------|----------------|
| > ₹1,50,000 | 10 |
| ₹1,00,001 – ₹1,50,000 | 7 |
| ₹75,001 – ₹1,00,000 | 5 |
| ₹50,001 – ₹75,000 | 3 |
| ≤ ₹50,000 | 1 |

**Table 6.3.C — Employment Stability Benchmark**:

| Years in Current Employment / Practice | Benchmark Score |
|----------------------------------------|----------------|
| > 5 years | 10 |
| 3–5 years | 7 |
| 1–3 years | 5 |
| < 1 year | 3 |

**Table 6.3.D — FOIR Benchmark**:

| FOIR (%) | Benchmark Score |
|---------|----------------|
| 0–20% | 10 |
| 21–35% | 7 |
| 36–50% | 5 |
| 51–70% (Salaried only) | 3 |
| > threshold | Hard Reject (HRJ-05) |

**Score Card Decision Tiers**:

| Score Range | Decision | Credit Limit Adjustment |
|-------------|---------|------------------------|
| 600–1000 | Approve — Tier 1 | 100% of maximum eligible limit |
| 450–599 | Approve — Tier 2 | 80% of maximum eligible limit |
| 300–449 | Approve — Tier 3 | 60% of maximum eligible limit |
| < 300 | Reject | Hard Reject (HRJ-09) |

### 6.4 FOIR Calculation

**Formula**:
> FOIR (%) = (Total Monthly EMI Obligations ÷ Net Monthly Income) × 100

**EMI Input Source**:
> Use the **HIGHER** of: Customer-declared total monthly EMI (SCR-07) OR Credit Bureau-reported total EMI (SCR-09)

**New Card EMI Inclusion**:
> Before checking FOIR threshold, include estimated new card EMI:
> New Card EMI = 5% of Approved Credit Limit per month
> (Added to existing total EMI for FOIR calculation)

**FOIR Thresholds**:

| Employment Type | Maximum FOIR |
|----------------|-------------|
| Salaried | 70% |
| SEP | 50% |
| SENP | 50% |

### 6.5 Name Mismatch Logic

**Source of Truth**: Name as fetched from Aadhaar eKYC (UIDAI response).

**Documents Compared**:

| Document | Minimum Match Threshold |
|---------|------------------------|
| PAN (as per PAN Validation Service) | 60% |
| ITR (extracted via ITR Analysis) | 60% |
| GST Registration (if applicable) | 60% |
| Bank Statement (as extracted via BSA) | 60% |

**Matching Method**: Fuzzy string matching algorithm (e.g., Jaro-Winkler similarity score).

**Decision Logic**:

| Match Result | Action |
|-------------|--------|
| All available documents match ≥ 60% | Pass — no action |
| Any document matches < 60% | Flag mismatch; log for audit; BRE treats as increased risk; may result in rejection per policy |
| Document unreadable / extraction failed | Flag as "unable to verify"; same risk treatment |

> **Note**: Name comparison excludes honorifics (Mr., Mrs., Dr., etc.) and common abbreviations before matching.

### 6.6 Sanction Limit Derivation

**Final Sanction Limit = Minimum of all applicable limits below**:

| Limit Component | Basis |
|-----------------|-------|
| Card variant maximum limit | Configured maximum for selected variant (see Master 13.2) |
| Income-based limit | Configurable multiplier × Net Monthly Income (default: 2× NMI) |
| FOIR-adjusted limit | Limit derived such that new FOIR stays within threshold |
| Score Card tier limit | Tier 1 = 100% of max; Tier 2 = 80%; Tier 3 = 60% |
| Bureau-based limit | Limit derived from bureau data analysis (policy-configurable) |

> All multipliers and limit caps are configurable parameters managed in the admin configuration module.

---

## 7. Deduplication Logic

### 7.1 CBS Dedupe (ETB / NTB Classification)

**Purpose**: Determine if applicant is an existing bank customer (ETB) or a new customer (NTB).

| Attribute | Detail |
|-----------|--------|
| Trigger | After PAN + DOB entry (SCR-03) |
| Input | PAN, Date of Birth |
| Matching | Exact match on PAN; DOB match; name fuzzy match ≥ 60% |
| Mode | Mocked (Phase 1) |

| CBS Result | Classification | Next Action |
|-----------|---------------|-------------|
| Match found | ETB | Fetch full customer profile from CBS (Golden Fetch); pre-fill SCR-05; skip SCR-04 |
| No match | NTB | Proceed to SCR-04 (Aadhaar OTP eKYC) |
| Service failure | Treat as NTB | Log warning; proceed with NTB flow |

### 7.2 CMS Dedupe (Existing Credit Card Check)

**Purpose**: Prevent duplicate credit card issuance to applicants who already hold a card.

| Attribute | Detail |
|-----------|--------|
| Trigger | After personal details confirmation (SCR-05) |
| Input | PAN |
| System | Card Management System (CMS) |
| Mode | Mocked (Phase 1) |

| CMS Result | Action |
|-----------|--------|
| Existing primary credit card found | Hard Reject → SCR-10: "Our records indicate you already hold a credit card with us." |
| Existing add-on credit card found | Hard Reject → SCR-10: "Our records indicate you are already an add-on cardholder." |
| No match | Proceed |
| Service failure | Retry × 3; if still fails, log and allow to proceed (flag for manual review) |

### 7.3 LMS Dedupe (In-Progress Application Check)

**Purpose**: Detect active in-progress applications and offer resume functionality.

| Attribute | Detail |
|-----------|--------|
| Trigger | At mobile OTP verification (SCR-02) |
| Input | Mobile Number, PAN |
| System | Lead Management System (LMS) |
| Mode | Mocked (Phase 1) |

| LMS Result | Action |
|-----------|--------|
| Active application found (< 30 days, not expired/abandoned) | Show prompt: "Resume existing application ([ARN])?" or "Start new" |
| Expired application found (> 30 days) | Treat as new application |
| Abandoned application found | Treat as new application |
| No active application | Proceed as new application |

**Resume Flow**:
1. Customer selects "Resume" → Jump directly to last saved step
2. Customer selects "Start New":
   - Existing application status updated to ABANDONED in LMS
   - New ARN generated; new application initiated

---

## 8. System Integrations

### 8.1 Core Banking System (CBS)

| Parameter | Detail |
|-----------|--------|
| Purpose | ETB/NTB classification; customer data pre-fill (Golden Fetch) |
| Trigger | PAN + DOB entry (SCR-03) |
| Mode | Mocked — Phase 1 |
| API Type | REST |
| Input | PAN, Date of Birth |
| Output | Customer ID, Full Name, DOB, Gender, Permanent Address, Mobile, Email, Account type, Branch code |
| Failure Handling | Retry × 3 (5-second intervals); on total failure, treat as NTB and log |
| Data Used For | Customer type detection; personal details pre-fill |

### 8.2 CRM (Customer Relationship Management)

| Parameter | Detail |
|-----------|--------|
| Purpose | Lead creation; customer interaction tracking |
| Trigger | ARN generation |
| Mode | Mocked — Phase 1 |
| Input | Customer profile (name, mobile, email, PAN), channel (WEB), ARN |
| Output | CRM Lead ID |
| Failure Handling | Non-blocking; async retry; application continues |

### 8.3 LMS (Lead Management System)

| Parameter | Detail |
|-----------|--------|
| Purpose | ARN generation; application lifecycle tracking; dropout/resume management |
| Trigger | Post Aadhaar eKYC success (NTB) / Post CBS Golden Fetch (ETB) |
| Mode | Mocked — Phase 1 |
| Input | Customer details, channel, KYC mode, application step |
| Output | ARN, application record, resume URL |
| Status Updates | At each major screen completion and status transition |

### 8.4 Credit Bureau

| Parameter | Detail |
|-----------|--------|
| Purpose | Credit score fetch; full credit report |
| Trigger | After document upload completion (SCR-08), before BRE (SCR-09) |
| Mode | Mocked — Phase 1 |
| Input | PAN, Full Name, Date of Birth, Address |
| Output | Bureau Score, DPD history, active accounts, enquiries (last 3/6/12 months), credit limit, outstanding balance, written-off accounts |
| Enquiry Type | Soft Enquiry — does NOT impact customer credit score |
| Report Validity | 30 days from fetch date |
| Retry | 3 retries (20-second intervals); on failure, show "processing" and retry after 60 seconds |

### 8.5 UIDAI / Aadhaar eKYC

| Parameter | Detail |
|-----------|--------|
| Purpose | NTB identity verification; demographic data pre-fill |
| Trigger | NTB journey, SCR-04 |
| Mode | Mocked — Phase 1 |
| Input | Aadhaar Number (for OTP dispatch); OTP (for verification) |
| Output | Full Name, Date of Birth, Gender, Permanent Address, Photo |
| Data Retained | ARK (Aadhaar Reference Key) ONLY — Aadhaar number discarded immediately after eKYC |
| Compliance | Aadhaar stored only in Aadhaar Vault as ARK; never in application database |

### 8.6 PAN Validation Service

| Parameter | Detail |
|-----------|--------|
| Purpose | Validate PAN authenticity and status |
| Trigger | PAN entry (SCR-03); also post Aadhaar eKYC for NTB |
| Mode | Mocked — Phase 1 |
| Input | PAN Number, Name (for cross-check), Date of Birth |
| Output | PAN status (Active/Invalid/Inactive), Name as per PAN records |
| Failure Handling | Retry × 3; on failure, flag for manual review |

### 8.7 Aadhaar Vault

| Parameter | Detail |
|-----------|--------|
| Purpose | Secure storage of Aadhaar Reference Key (ARK) — enables future Aadhaar-linked operations without storing Aadhaar |
| Trigger | Post successful Aadhaar eKYC (SCR-04) |
| Mode | Mocked — Phase 1 |
| Input | Customer ID, Aadhaar Number (for tokenization) |
| Output | ARK (Aadhaar Reference Key) |
| Data Stored | ARK only; Aadhaar number is irreversibly tokenized and not retrievable |

### 8.8 Bank Statement Analysis (BSA)

| Parameter | Detail |
|-----------|--------|
| Purpose | Automated income and obligation analysis from bank statement PDF |
| Trigger | Bank statement upload (SCR-08) |
| Mode | Existing BSA solution integrated — mocked in Phase 1 |
| Input | Bank statement PDF |
| Output | Average monthly credit (income estimate), recurring debits (EMI obligations), income band classification, account health indicators |
| Usage | Cross-validates declared income; higher of BSA income vs declared income used for FOIR |
| Failure Handling | Non-blocking; if BSA fails, proceed with declared income; flag for review |

### 8.9 ITR Analysis

| Parameter | Detail |
|-----------|--------|
| Purpose | Income verification from ITR documents |
| Trigger | ITR document upload (SCR-08) |
| Mode | Mocked — Phase 1 |
| Input | ITR PDF (last 2 years) |
| Output | Net taxable income per year, income sources, tax paid |
| Failure Handling | Non-blocking; proceed with declared income if ITR analysis fails |

### 8.10 VKYC Service

| Parameter | Detail |
|-----------|--------|
| Purpose | Video-based KYC for NTB customer identity verification |
| Trigger | Post e-Sign, NTB journey (SCR-16) |
| Mode | Mocked — Phase 1 (integrated VKYC vendor) |
| Input | Customer ID, ARN, Name, Aadhaar photo reference, Scheduled slot |
| Output | VKYC session ID, outcome (PASS / FAIL / NO_SHOW), agent remarks, session timestamp |
| Completion Window | 3 working days from e-Sign |
| Expiry | 7 working days from e-Sign |
| Session Storage | Recording reference stored in DMS; actual recording retained by VKYC vendor |

### 8.11 e-Sign Service

| Parameter | Detail |
|-----------|--------|
| Purpose | Legally valid digital signature on application document |
| Trigger | Post consent confirmation (SCR-15) |
| Mode | Mocked — Phase 1 |
| Input | Application PDF, Customer Name, Registered Mobile Number |
| Output | Signed PDF document, Signature reference ID, Signing timestamp |
| OTP | Dispatched to customer's registered mobile |
| OTP Validity | 10 minutes |
| Signed Doc Format | PDF with embedded digital signature |

### 8.12 Document Management System (DMS)

| Parameter | Detail |
|-----------|--------|
| Purpose | Persistent document repository for all application documents |
| Trigger | Post document upload completion (SCR-08) and post e-Sign (SCR-15) |
| Mode | Mocked — Phase 1 (external bank DMS) |
| Input | Document files, ARN, document type code, metadata |
| Output | Document reference IDs |
| Documents Stored | All KYC docs, income docs, signed application form, VKYC reference |
| Failure Handling | Async retry queue (× 5 retries); non-blocking for customer journey |

### 8.13 SMS Gateway

| Parameter | Detail |
|-----------|--------|
| Purpose | OTP delivery; transactional SMS notifications |
| Trigger | Multiple events (see Section 12.1) |
| Mode | Mocked — Phase 1 |
| Input | Mobile number, approved message template ID, variable values |
| Output | Message ID, delivery status |
| Retry | 3 retries on failure; non-blocking |

### 8.14 Email Gateway

| Parameter | Detail |
|-----------|--------|
| Purpose | Transactional email notifications |
| Trigger | Multiple events (see Section 12.2) |
| Mode | Mocked — Phase 1 |
| Input | Email address, template ID, variable values, attachments (if any) |
| Output | Message ID, delivery status |
| Retry | 3 retries on failure; non-blocking |

### 8.15 Card Management System (CMS)

| Parameter | Detail |
|-----------|--------|
| Purpose | (1) CMS Dedupe: existing credit card check; (2) Card creation post approval |
| Trigger (Dedupe) | After personal details confirmed (SCR-05) |
| Trigger (Creation) | ETB: post e-Sign; NTB: post VKYC PASS |
| Mode | Mocked — Phase 1 |
| Input (Creation) | Customer details, card variant code, approved credit limit, embossing name, add-on details |
| Output (Creation) | Card account number (masked), card creation confirmation, dispatch schedule |

---

## 9. Field Reference / Data Dictionary

### 9.1 Application Master Fields

| Field Name | Data Type | Max Length | Source | Editable by Customer | Mandatory |
|-----------|----------|-----------|--------|---------------------|----------|
| Application Reference Number (ARN) | Alphanumeric | 20 | System generated | No | Auto |
| Application Date | DateTime | — | System | No | Auto |
| Channel | Enum | — | System | No | Auto (WEB) |
| Customer Type | Enum | — | System (CBS Dedupe) | No | Auto (ETB / NTB) |
| Application Status | Enum | — | System | No | Auto |
| Mobile Number | Numeric | 10 | Customer (SCR-02) | No (locked post OTP) | Yes |
| PAN Number | Alphanumeric | 10 | Customer (SCR-03) | No (locked post validation) | Yes |
| Date of Birth | Date | — | Customer / CBS / UIDAI | No (locked) | Yes |
| Full Name (KYC) | Text | 100 | UIDAI / CBS | No (locked) | Yes |
| Father's Name | Text | 50 | Customer | Yes | Yes |
| Mother's Name | Text | 50 | Customer | Yes | No |
| Gender | Enum | — | UIDAI / CBS | No (locked) | Yes |
| Marital Status | Enum | — | Customer | Yes | Yes |
| Email Address | Email | 100 | Customer / CBS | Yes | Yes |
| Alternate Mobile | Numeric | 10 | Customer | Yes | No |
| Nationality | Enum | — | Customer | Yes | Yes |
| Religion | Enum | — | Customer | Yes | No |
| Category | Enum | — | Customer | Yes | No |
| Physically Challenged | Boolean | — | Customer | Yes | No |
| Permanent Address Line 1 | Text | 100 | UIDAI / CBS | No (locked) | Yes |
| Permanent Address Line 2 | Text | 100 | UIDAI / CBS | No (locked) | No |
| Permanent City | Text | 50 | UIDAI / CBS | No (locked) | Yes |
| Permanent State | Enum | — | UIDAI / CBS | No (locked) | Yes |
| Permanent PIN Code | Numeric | 6 | UIDAI / CBS | No (locked) | Yes |
| Correspondence Same as Permanent | Boolean | — | Customer | Yes | Yes |
| Correspondence Address Line 1 | Text | 100 | Customer | Yes | Conditional |
| Correspondence City | Text | 50 | Customer | Yes | Conditional |
| Correspondence State | Enum | — | Customer | Yes | Conditional |
| Correspondence PIN Code | Numeric | 6 | Customer | Yes | Conditional |
| Employment Type | Enum | — | Customer | Yes | Yes |
| Employer / Business Name | Text | 100 | Customer | Yes | Yes |
| Designation | Text | 50 | Customer | Yes | Salaried only |
| Date of Joining / Practice Start | Date | — | Customer | Yes | Yes |
| Net Monthly Income | Decimal | 12,2 | Customer | Yes | Yes |
| Gross Annual Income | Decimal | 12,2 | Customer | Yes | Yes |
| Net Annual Income (ITR) | Decimal | 12,2 | Customer | Yes | SEP/SENP |
| Total Monthly EMI (declared) | Decimal | 12,2 | Customer | Yes | Yes (0 if none) |
| Total Monthly EMI (bureau) | Decimal | 12,2 | Credit Bureau | No | Auto |
| FOIR (calculated) | Decimal | 5,2 | System | No | Auto |
| Credit Bureau Score | Integer | — | Credit Bureau | No | Auto |
| Score Card Total | Integer | — | System | No | Auto |
| Score Card Tier | Enum | — | System | No | Auto |
| Sanction Limit | Decimal | 12,2 | System | No | Auto |
| Card Variant Selected | Enum | — | Customer | Yes | Yes |
| Name on Card | Text | 19 | Customer | Yes | Yes |
| Add-on Required | Boolean | — | Customer | Yes | No |
| Add-on Count | Integer | — | System | No | Auto |
| Aadhaar ARK | Alphanumeric | 50 | Aadhaar Vault | No | NTB only |
| e-Sign Reference ID | Alphanumeric | 50 | e-Sign Service | No | Auto |
| e-Sign Timestamp | DateTime | — | e-Sign Service | No | Auto |
| VKYC Session ID | Alphanumeric | 50 | VKYC Service | No | NTB only |
| VKYC Status | Enum | — | VKYC Service | No | NTB only |
| VKYC Completion Timestamp | DateTime | — | VKYC Service | No | NTB only |
| Consent Timestamp | DateTime | — | System | No | Auto |
| Consent IP Address | Text | 45 | System | No | Auto |
| LMS Lead ID | Alphanumeric | 30 | LMS | No | Auto |
| CRM Lead ID | Alphanumeric | 30 | CRM | No | Auto |

### 9.2 Application Status Master

| Status Code | Display Label | Description | Trigger |
|------------|-------------|-------------|---------|
| INITIATED | Initiated | Mobile OTP verified | SCR-02 complete |
| LEAD_CREATED | Lead Created | ARN generated; LMS updated | Post eKYC or CBS fetch |
| IN_PROGRESS | In Progress | Customer actively completing application | Any intermediate screen |
| BUREAU_FETCHED | Bureau Fetched | Credit report retrieved | SCR-09 — Bureau API success |
| BRE_COMPLETED | Assessment Complete | Score Card processed; decision available | SCR-09 complete |
| REJECTED | Rejected | Hard reject at any stage | Any HRJ trigger |
| DOCS_UPLOADED | Documents Uploaded | All required documents submitted | SCR-08 complete |
| CONSENT_GIVEN | Consent Given | All consents recorded | SCR-14 complete |
| ESIGNED | e-Signed | Application digitally signed | SCR-15 complete |
| VKYC_SCHEDULED | VKYC Scheduled | NTB — VKYC slot booked | SCR-16 complete |
| VKYC_PENDING | VKYC Pending | NTB — awaiting VKYC completion | Post e-Sign, NTB |
| VKYC_COMPLETED | VKYC Completed | NTB — VKYC passed | VKYC Service PASS callback |
| VKYC_FAILED | VKYC Failed | NTB — VKYC rejected | VKYC Service FAIL callback |
| SUBMITTED | Submitted | Application fully submitted | SCR-17 shown |
| APPROVED | Approved | Card creation initiated | CMS creation triggered |
| CARD_CREATED | Card Created | Card issued in CMS | CMS success callback |
| DISPATCHED | Dispatched | Physical card dispatched by courier | CMS dispatch update |
| EXPIRED | Expired | Application inactive > 30 days | Scheduled job |
| ABANDONED | Abandoned | Customer started a new application | LMS Dedupe → "Start New" |

---

## 10. Document Management

### 10.1 Document Type Master

| Document Code | Document Name | Accepted Formats | Max File Size | Notes |
|--------------|-------------|-----------------|-------------|-------|
| DOC-PAN | PAN Card | JPG, PNG, PDF | 2 MB | — |
| DOC-ADF | Aadhaar Card — Front | JPG, PNG, PDF | 2 MB | — |
| DOC-ADB | Aadhaar Card — Back | JPG, PNG, PDF | 2 MB | — |
| DOC-PHO | Passport-size Photo | JPG, PNG | 500 KB | Face must be clearly visible |
| DOC-SS1 | Salary Slip — Month 1 (Latest) | PDF, JPG, PNG | 2 MB | Salaried only |
| DOC-SS2 | Salary Slip — Month 2 | PDF, JPG, PNG | 2 MB | Salaried only |
| DOC-SS3 | Salary Slip — Month 3 | PDF, JPG, PNG | 2 MB | Salaried only |
| DOC-BST | Bank Statement (last 6 months) | PDF | 5 MB | All employment types |
| DOC-IT1 | ITR — Year 1 (Most Recent) | PDF | 5 MB | SEP/SENP mandatory; Salaried optional |
| DOC-IT2 | ITR — Year 2 | PDF | 5 MB | SEP/SENP mandatory; Salaried optional |
| DOC-F16 | Form 16 | PDF | 2 MB | Salaried optional |
| DOC-GST | GST Certificate | PDF, JPG, PNG | 2 MB | If GST registered |
| DOC-BR | Business Registration Certificate | PDF, JPG | 2 MB | SEP/SENP optional |
| DOC-PRO | Professional Membership Certificate | PDF, JPG | 2 MB | CA/CS only |
| DOC-APP | Signed Application Form | PDF | 10 MB | System generated + e-signed |

### 10.2 DMS Document Push Events

| Event | Documents Pushed | Trigger |
|-------|-----------------|---------|
| Document upload section complete | DOC-PAN, DOC-ADF, DOC-ADB, DOC-PHO, all income/KYC docs | SCR-08 completion |
| e-Sign complete | DOC-APP (signed PDF) | SCR-15 success |
| VKYC complete | VKYC session reference (link to vendor recording) | VKYC PASS callback |
| Card creation complete | Full application package (all documents) | CMS success |

### 10.3 Document Quality Guidelines (Customer-Facing)

| Guideline | Requirement |
|-----------|------------|
| Image clarity | Document text must be clearly legible; no blur |
| Lighting | No glare, shadows obscuring text |
| Completeness | Full document visible — no cropping of edges |
| Authenticity | Original documents only — no photocopies of photocopies |
| Language | Documents in languages other than English/Hindi may require notarized translation |

---

## 11. Error Handling & Edge Cases

### 11.1 API Failure Handling

| Integration | Failure Mode | Retry Policy | Customer Impact |
|-------------|-------------|-------------|----------------|
| CBS Dedupe | Service unavailable | Retry × 3 (5s interval) | Treat as NTB; log warning |
| UIDAI eKYC | Service unavailable | Retry × 3 (10s interval) | Show error; customer retries |
| PAN Validation | Service unavailable | Retry × 3 (5s interval) | Flag for review; allow to proceed |
| Credit Bureau | Service unavailable | Retry × 3 (20s interval); retry after 60s | Show processing message; retry |
| BSA Service | Service unavailable | 1 retry | Non-blocking; proceed with declared income; flag |
| ITR Analysis | Service unavailable | 1 retry | Non-blocking; proceed; flag |
| DMS Push | Failure | Async retry queue × 5 | Non-blocking; not shown to customer |
| SMS Gateway | Delivery failure | 3 retries | Non-blocking; log; customer not shown error |
| Email Gateway | Delivery failure | 3 retries | Non-blocking; log |
| e-Sign Service | Service unavailable | 3 retries | Show error; customer retries |
| VKYC Service | Service unavailable | N/A (async) | Show reschedule option |
| CMS (Dedupe) | Service unavailable | Retry × 3 | Allow proceed; flag for manual review |
| CMS (Creation) | Failure | Retry × 3; escalate | Not shown to customer; ops alert triggered |

### 11.2 Session & Timeout Handling

| Event | Timeout Window | Action |
|-------|---------------|--------|
| Session inactivity | 15 minutes | Warning popup at 12 minutes: "Your session will expire in 3 minutes." Auto-save + logout at 15 minutes |
| OTP validity (all OTPs) | 10 minutes | Show expiry message; offer resend |
| Application validity | 30 days from ARN | Near-expiry reminder at Day 25 and Day 29 via SMS + Email |
| VKYC completion window | 3 working days | Reminder SMS + Email at end of Day 1 and Day 2 |
| VKYC hard expiry | 7 working days | Application marked EXPIRED; expiry SMS + Email sent |

### 11.3 Auto-save & Progress Recovery

| Scenario | Behavior |
|----------|---------|
| Browser refresh | Application data auto-saved at each screen; restores on reload within session |
| Browser back button | System presents last saved state; customer can continue |
| Tab close + reopen | Session restored if within active session window (15 min) |
| Resume via mobile OTP | LMS Dedupe detects active ARN; resume to last saved step |
| Network disconnection mid-upload | Upload retried automatically; partial uploads not committed |

### 11.4 Edge Case Handling

| Scenario | Handling |
|----------|---------|
| Aadhaar-registered mobile ≠ application mobile | Display info note: "OTP for Aadhaar verification will be sent to your Aadhaar-registered mobile number, which may differ from the mobile number entered." |
| CBS returns partial data | Pre-fill available fields; missing fields become mandatory customer-entry fields |
| BSA fails to parse bank statement | Skip BSA; proceed with declared income; flag application for post-submission income review |
| Multiple browser tabs open | Detect duplicate session; show: "You have another active session. Please close other tabs to continue." |
| Add-on PAN same as primary PAN | Validation error: "Add-on applicant must have a different PAN from the primary applicant." |
| Embossing name — special characters entered | Client-side: real-time block with tooltip: "Only letters, numbers, and spaces are allowed." |
| VKYC NO SHOW — reschedule | System sends reschedule link via SMS + Email. Max 2 reschedules allowed. After max reschedules + no completion within 7 days → EXPIRED. |
| Customer changes employment type after income entry | All employment-specific fields reset; document upload section also resets for affected documents |
| ITR income differs significantly from declared income | BSA/ITR output vs declared income discrepancy > 30% flagged for review; does not auto-reject in Phase 1 |
| CMS Dedupe service down during personal details | Allow to proceed; CMS Dedupe retried async; flag for manual check |
| Card variant no longer eligible after score recalculation | Re-present eligible variants; if previously selected variant now ineligible, notify customer and prompt re-selection |
| VKYC FAIL — customer disputes | Customer directed to contact support (helpline); no automated re-VKYC in Phase 1 |

---

## 12. Communication Templates

### 12.1 SMS Templates

All SMS templates must comply with telecom regulatory DLT registration requirements.

---

**T-SMS-01: OTP — Mobile Verification**
```
[ARN] is your OTP for Credit Card Application. Valid for 10 minutes.
Do not share this OTP with anyone. - [Bank Name]
```

---

**T-SMS-02: Application Reference Number Confirmation**
```
Your Credit Card Application has been received.
Reference No: [ARN]. Track your application at [URL]. - [Bank Name]
```

---

**T-SMS-03: Application Approved (ETB / Post VKYC)**
```
Congratulations! Your [Card Variant Name] Credit Card (Ref: [ARN]) has been approved.
Credit Limit: Rs.[Limit]. Your card will be dispatched within [X] working days. - [Bank Name]
```

---

**T-SMS-04: VKYC Scheduled / Pending**
```
Your Credit Card application (Ref: [ARN]) requires Video KYC.
Your slot: [Date], [Time]. Keep your PAN & Aadhaar ready. Join: [VKYC Link] - [Bank Name]
```

---

**T-SMS-05: VKYC Reminder**
```
Reminder: Complete Video KYC for your Credit Card application (Ref: [ARN]) by [Date]
to avoid cancellation. Reschedule: [Link] - [Bank Name]
```

---

**T-SMS-06: VKYC Completion Confirmation**
```
Your Video KYC for Credit Card application [ARN] is successfully completed.
Your card will be dispatched within [X] working days. - [Bank Name]
```

---

**T-SMS-07: Application Rejected**
```
We regret that your Credit Card application (Ref: [ARN]) could not be processed.
For assistance, call [Helpline No.] - [Bank Name]
```

---

**T-SMS-08: Application Expired**
```
Your Credit Card application (Ref: [ARN]) has expired due to inactivity.
Apply fresh at [URL] - [Bank Name]
```

---

**T-SMS-09: Card Dispatched**
```
Your [Card Variant Name] Credit Card has been dispatched via [Courier Name].
Tracking ID: [Tracking ID]. Expected delivery: [Date]. - [Bank Name]
```

---

**T-SMS-10: Application Near Expiry Warning**
```
Your Credit Card application (Ref: [ARN]) will expire in [X] day(s).
Please complete your application: [Resume URL] - [Bank Name]
```

---

**T-SMS-11: e-Sign OTP**
```
[OTP] is your OTP to digitally sign your Credit Card Application (Ref: [ARN]).
Valid for 10 minutes. Do not share. - [Bank Name]
```

---

### 12.2 Email Templates

All email templates use HTML format. Plain-text fallback required.

---

**T-EMAIL-01: Application Received Confirmation**
- **Subject**: Your Credit Card Application Has Been Received — Ref: [ARN]
- **Content**:
  - Thank you message
  - Application summary: Name, Card selected, Application date, ARN
  - Next steps (ETB vs NTB variant)
  - Download link for application copy
  - Contact / helpline information

---

**T-EMAIL-02: Application Approved**
- **Subject**: 🎉 Your [Card Variant Name] Credit Card Application is Approved!
- **Content**:
  - Congratulatory message
  - Approved credit limit
  - Card variant details and benefits summary
  - Dispatch timeline (X working days)
  - Card activation instructions (preview for when card arrives)
  - Helpline / support

---

**T-EMAIL-03: VKYC Scheduling Required**
- **Subject**: Complete Your Video KYC — Credit Card Application [ARN]
- **Content**:
  - VKYC deadline reminder (3 working days from e-Sign)
  - What to keep ready (PAN, Aadhaar — originals)
  - Environment checklist (camera, microphone, lighting, stable internet)
  - VKYC link / schedule link
  - Calendar invite attachment (.ics)
  - Support contact

---

**T-EMAIL-04: VKYC Completion Confirmation**
- **Subject**: Video KYC Completed Successfully — Application [ARN]
- **Content**:
  - VKYC completion confirmation
  - Next steps: card dispatch timeline
  - Helpline

---

**T-EMAIL-05: Application Rejected**
- **Subject**: Update on Your Credit Card Application — Ref: [ARN]
- **Content**:
  - Empathetic regret message
  - Generic reason (regulatory compliance — specific reason not disclosed)
  - Cooling-off information (can reapply after X months)
  - Alternative products (optional, future scope)
  - Helpline / support contact

---

**T-EMAIL-06: Application Near Expiry Warning**
- **Subject**: Action Required — Your Application Will Expire in [X] Day(s) — Ref: [ARN]
- **Content**:
  - Urgency notice
  - Exact expiry date and time
  - Resume application link
  - Helpline

---

**T-EMAIL-07: e-Sign Completion Confirmation**
- **Subject**: Application Signed Successfully — Ref: [ARN]
- **Content**:
  - e-Sign success confirmation
  - Signed application PDF as email attachment
  - Next steps
  - Helpline

---

**T-EMAIL-08: Card Dispatched**
- **Subject**: Your [Card Variant Name] Credit Card is On Its Way!
- **Content**:
  - Card dispatch confirmation
  - Courier name + tracking ID
  - Tracking link
  - Expected delivery date
  - How to activate card on arrival
  - First-use tips / welcome offers

---

## 13. Masters & Configuration

### 13.1 Employment Type Master

| Code | Display Label | FOIR Threshold |
|------|-------------|---------------|
| SAL | Salaried | 70% |
| SEP | Self-Employed Professional | 50% |
| SENP | Self-Employed Non-Professional | 50% |

### 13.2 Card Variant Master

| Code | Name | Network | Tier | Min. Net Annual Income | Max Credit Limit |
|------|------|---------|------|----------------------|-----------------|
| CC-01 | Horizon | RuPay Select | Entry | ₹2,50,000 | [Configurable] |
| CC-02 | Ascend | Visa Platinum | Mid | ₹5,00,000 | [Configurable] |
| CC-03 | Vertex | Visa Platinum | Premium | ₹7,50,000 | [Configurable] |
| CC-04 | Prestige | Mastercard World | Super Premium | ₹12,00,000 | [Configurable] |
| CC-05 | Pinnacle | Visa Signature | Elite | ₹18,00,000 | [Configurable] |

### 13.3 State Master

All 28 Indian States and 8 Union Territories included with ISO 3166-2:IN codes.

| Code | State / UT |
|------|-----------|
| IN-AP | Andhra Pradesh |
| IN-AR | Arunachal Pradesh |
| IN-AS | Assam |
| IN-BR | Bihar |
| IN-CT | Chhattisgarh |
| IN-GA | Goa |
| IN-GJ | Gujarat |
| IN-HR | Haryana |
| IN-HP | Himachal Pradesh |
| IN-JH | Jharkhand |
| IN-KA | Karnataka |
| IN-KL | Kerala |
| IN-MP | Madhya Pradesh |
| IN-MH | Maharashtra |
| IN-MN | Manipur |
| IN-ML | Meghalaya |
| IN-MZ | Mizoram |
| IN-NL | Nagaland |
| IN-OR | Odisha |
| IN-PB | Punjab |
| IN-RJ | Rajasthan |
| IN-SK | Sikkim |
| IN-TN | Tamil Nadu |
| IN-TG | Telangana |
| IN-TR | Tripura |
| IN-UP | Uttar Pradesh |
| IN-UT | Uttarakhand |
| IN-WB | West Bengal |
| IN-AN | Andaman and Nicobar Islands (UT) |
| IN-CH | Chandigarh (UT) |
| IN-DH | Dadra & Nagar Haveli and Daman & Diu (UT) |
| IN-DL | Delhi (UT) |
| IN-JK | Jammu & Kashmir (UT) |
| IN-LA | Ladakh (UT) |
| IN-LD | Lakshadweep (UT) |
| IN-PY | Puducherry (UT) |

### 13.4 Industry Master (Employer)

| Code | Industry |
|------|---------|
| IND-01 | IT / Software / Technology |
| IND-02 | Banking / Financial Services / Insurance (BFSI) |
| IND-03 | Healthcare / Pharmaceutical |
| IND-04 | Manufacturing / Industrial |
| IND-05 | Education / Academic |
| IND-06 | Retail / E-commerce / FMCG |
| IND-07 | Government / PSU / Defence |
| IND-08 | Real Estate / Construction |
| IND-09 | Media / Entertainment / Advertising |
| IND-10 | Hospitality / Tourism / Aviation |
| IND-11 | Telecommunications |
| IND-12 | Agriculture / Agribusiness |
| IND-13 | Logistics / Transportation |
| IND-14 | Energy / Oil & Gas |
| IND-15 | Legal / Consulting / Professional Services |
| IND-16 | Other |

### 13.5 Relationship Master (Add-on Card)

| Code | Relationship |
|------|------------|
| REL-01 | Spouse |
| REL-02 | Child (Son/Daughter) |
| REL-03 | Parent (Father/Mother) |
| REL-04 | Sibling (Brother/Sister) |

### 13.6 Religion Master

| Code | Religion |
|------|---------|
| REL-H | Hindu |
| REL-M | Muslim |
| REL-C | Christian |
| REL-S | Sikh |
| REL-B | Buddhist |
| REL-J | Jain |
| REL-O | Others |
| REL-NA | Prefer not to disclose |

### 13.7 Category Master

| Code | Category |
|------|---------|
| CAT-GEN | General |
| CAT-SC | Scheduled Caste (SC) |
| CAT-ST | Scheduled Tribe (ST) |
| CAT-OBC | Other Backward Class (OBC) |
| CAT-OTH | Others |

### 13.8 Rejection Reason Codes (Internal — Not Shown to Customer)

| Code | Rejection Reason |
|------|----------------|
| RJ-AGE | Age below 21 or above 65 |
| RJ-PAN | Invalid or unverifiable PAN |
| RJ-BUR | Credit Bureau score below minimum threshold |
| RJ-CMS | Existing credit card detected |
| RJ-FOIR | FOIR exceeds maximum threshold |
| RJ-INC | Income below minimum threshold |
| RJ-NAME | Name mismatch below minimum threshold |
| RJ-NAT | Non-Indian nationality |
| RJ-SCORE | Score Card total below 300 |
| RJ-VKYC | VKYC failed |
| RJ-VKYC-EXP | VKYC window expired |
| RJ-MANUAL | Manual rejection (post-submission review) |

### 13.9 Configurable Parameters

All parameters below are managed via the admin configuration module and do NOT require code changes.

| Parameter | Description | Default Value |
|-----------|-------------|-------------|
| `otp.validity.minutes` | OTP validity duration in minutes | 10 |
| `otp.max.attempts` | Maximum incorrect OTP attempts before lockout | 3 |
| `otp.resend.max` | Maximum OTP resend count | 3 |
| `otp.lockout.minutes` | Lockout duration after max OTP attempts | 30 |
| `otp.resend.delay.seconds` | Delay between OTP resend requests | 30 |
| `application.validity.days` | Application active period from ARN generation | 30 |
| `application.expiry.warning.days` | Days before expiry to trigger warning | [25, 29] |
| `vkyc.completion.window.working.days` | Working days to complete VKYC after e-Sign | 3 |
| `vkyc.expiry.window.working.days` | Working days before VKYC expiry | 7 |
| `vkyc.max.reschedules` | Maximum VKYC reschedules allowed | 2 |
| `vkyc.reminder.days` | Working days after e-Sign to send VKYC reminders | [1, 2] |
| `session.timeout.minutes` | Inactivity timeout for web session | 15 |
| `session.warning.minutes` | Session timeout warning trigger | 12 |
| `foir.threshold.salaried` | Maximum FOIR for Salaried applicants | 70% |
| `foir.threshold.sep` | Maximum FOIR for SEP applicants | 50% |
| `foir.threshold.senp` | Maximum FOIR for SENP applicants | 50% |
| `foir.new.card.emi.pct` | % of credit limit as estimated new card monthly EMI | 5% |
| `scorecard.minimum.qualifying` | Minimum score card total for approval | 300 |
| `name.match.minimum.pct` | Minimum fuzzy match % for name verification | 60% |
| `min.age.years` | Minimum applicant age in years | 21 |
| `max.age.years` | Maximum applicant age in years | 65 |
| `min.cibil.score` | Minimum acceptable bureau score (excluding -1/0) | 740 |
| `max.addon.cards` | Maximum add-on cards per primary card | 3 |
| `embossing.max.chars` | Maximum characters for name on card | 19 |
| `reapplication.cooling.months` | Months before rejected applicant can reapply | 3 |
| `bureau.report.validity.days` | Days bureau report remains valid for application | 30 |
| `income.limit.multiplier` | NMI multiplier for income-based credit limit | 2 |
| `cms.retry.count` | CMS API retry count | 3 |

---

## 14. Reports & Dashboards

### 14.1 Operational Reports

| Report Name | Frequency | Audience | Description |
|-------------|-----------|---------|-------------|
| Daily Application Summary | Daily (auto) | Product / Ops | Total initiated, completed, approved, rejected by date |
| Funnel Drop-off Report | Daily | Product / UX | Drop-off count and % by screen step |
| STP Rate Report | Weekly | Product / Risk | % applications processed without manual intervention |
| Bureau Fetch Report | Daily | Risk / Credit | Credit Bureau fetch count, score distribution, fail rate |
| Score Card Distribution | Weekly | Risk | Distribution of Score Card totals across approved/rejected apps |
| VKYC Status Report | Daily | Ops | Scheduled, completed, failed, expired, pending VKYC count |
| Document Upload Report | Daily | Ops | Upload success/failure rates by document type |
| Rejection Analysis Report | Weekly | Risk / Product | Rejection count by reason code (internal) |
| Channel Performance Report | Monthly | Business | ETB vs NTB split; conversion rates by segment |
| Income Discrepancy Report | Weekly | Risk | Applications flagged for BSA/ITR vs declared income mismatch |

### 14.2 Real-Time Dashboard Metrics

| Metric | Description | Refresh |
|--------|-------------|---------|
| Applications Today | Total applications initiated (today) | Real-time |
| Completion Rate | Applications submitted ÷ Initiated (%) | Real-time |
| Approval Rate | Applications approved ÷ Submitted (%) | Real-time |
| VKYC Pending Count | NTB applications awaiting VKYC | Real-time |
| Expiring in 5 Days | Applications within 5 days of 30-day expiry | Hourly |
| API Error Rate | Failure rate per integration | Real-time |
| Average Completion Time | Minutes: application initiation → submission | Daily |
| Rejected Today | Count of rejected applications | Real-time |

### 14.3 Compliance & Audit Reports

| Report | Frequency | Purpose |
|--------|-----------|---------|
| KYC Completion Audit | Monthly | eKYC records — ARK, timestamp, success/failure per applicant |
| Consent Log Report | Monthly | All consent records: ARN, timestamp, IP, checkboxes state |
| e-Sign Audit Report | Monthly | e-Sign completion: ARN, reference ID, timestamp |
| VKYC Audit Report | Monthly | VKYC sessions: session ID, outcome, agent, timestamp |
| Rejection Reason Audit | Monthly | Full rejection detail per application (internal use only) |
| Bureau Enquiry Audit | Monthly | All bureau soft enquiries made |
| DMS Upload Audit | Monthly | Document upload success/failure; retry count |

---

## 15. Non-Functional Requirements

### 15.1 Performance

| Requirement | Target |
|-------------|--------|
| Page load time (initial) | < 3 seconds on 4G |
| Page load time (subsequent screens) | < 1.5 seconds |
| API response time (mocked) | < 500ms |
| BRE processing time (live APIs, Phase 2) | < 60 seconds |
| Document upload time | < 10 seconds per document (on 4G) |
| OTP delivery (SMS) | < 30 seconds |
| e-Sign processing time | < 30 seconds |
| PDF generation time | < 10 seconds |
| Concurrent users supported (Phase 1) | 1,000 simultaneous users |

### 15.2 Availability

| Requirement | Target |
|-------------|--------|
| System uptime | 99.9% |
| Planned maintenance window | 2:00 AM – 5:00 AM IST (off-peak) |
| Disaster Recovery — RTO (Recovery Time Objective) | 4 hours |
| Disaster Recovery — RPO (Recovery Point Objective) | 1 hour |

### 15.3 Security

| Requirement | Standard / Detail |
|-------------|------------------|
| Data encryption in transit | TLS 1.2 minimum; TLS 1.3 preferred |
| Data encryption at rest | AES-256 |
| PII data handling | Masked in all UI displays; encrypted in all storage; access-logged |
| Aadhaar data | Never stored; ARK only; UIDAI compliance mandatory |
| Session security | JWT tokens; HttpOnly + Secure cookies; CSRF protection |
| Authentication | OTP-based (mobile number) |
| Authorization | Role-based access control (RBAC) for admin functions |
| Audit logging | All user actions, system events, API calls with timestamps logged |
| Penetration testing | Mandatory before go-live; annual thereafter |
| Vulnerability standards | OWASP Top 10 compliance required |
| Data masking | PAN shown as XXXXX1234X in UI; Aadhaar shown as XXXX XXXX 1234 |

### 15.4 Accessibility & Device Support

| Requirement | Standard |
|-------------|---------|
| WCAG compliance | WCAG 2.1 Level AA |
| Screen reader support | Compatible with NVDA, JAWS, VoiceOver |
| Keyboard navigation | Full keyboard accessibility — no mouse required |
| Color contrast | Minimum 4.5:1 ratio (text on background) |
| Touch target size | Minimum 44×44px for interactive elements |
| Responsive design | Mobile-first; tested at 320px, 768px, 1024px, 1440px breakpoints |
| Supported browsers | Chrome (latest 2 versions), Safari (latest 2), Firefox (latest), Edge (latest) |
| Supported OS — Mobile | Android 8.0+, iOS 13+ |
| Supported OS — Desktop | Windows 10+, macOS 10.14+ |

### 15.5 Scalability & Infrastructure

| Requirement | Detail |
|-------------|--------|
| Architecture | Stateless backend services (horizontally scalable) |
| Database | Connection pooling; read replicas for report queries |
| Static assets | CDN-served |
| API rate limiting | Per-IP and per-user rate limiting on sensitive endpoints (OTP, bureau) |
| Load balancing | Enabled |
| Auto-scaling | Application tier scales automatically under load |
| Caching | API response caching for master data (states, cities, industries) |

### 15.6 Localization

| Requirement | Phase 1 Scope |
|-------------|--------------|
| Language | English (Primary) |
| Date format | DD/MM/YYYY throughout |
| Currency format | Indian Rupee (₹); comma-separated Indian numbering (e.g., ₹1,00,000) |
| Mobile number format | +91 prefix optional; 10-digit local format accepted |
| Future scope | Hindi and regional language support in Phase 2 |

---

## 16. Glossary

| Term | Full Form / Definition |
|------|----------------------|
| ARN | Application Reference Number — system-generated unique identifier for each credit card application |
| ARK | Aadhaar Reference Key — tokenized reference to Aadhaar number stored in Aadhaar Vault; actual Aadhaar number is never stored |
| BRE | Business Rules Engine — automated system that evaluates eligibility criteria, score card, FOIR, and derives sanction limit |
| BSA | Bank Statement Analysis — automated AI/ML analysis of bank statement PDF to extract income and obligation data |
| BFSI | Banking, Financial Services, and Insurance |
| CA | Chartered Accountant |
| CBS | Core Banking System — bank's core platform containing all account holder records |
| CIBIL | Credit Information Bureau (India) Limited — primary credit bureau; used generically to refer to the credit bureau integration |
| CMS | Card Management System — system managing credit card account creation, lifecycle, and dispatch |
| CRM | Customer Relationship Management — system tracking leads and customer interactions |
| CS | Company Secretary |
| CTF | Call-to-Action |
| DMS | Document Management System — document repository for application files |
| DOB | Date of Birth |
| DPD | Days Past Due — number of calendar days a payment obligation has remained unpaid past its due date |
| eKYC | Electronic Know Your Customer — digital identity verification using Aadhaar OTP |
| e-Sign | Electronic Signature — legally valid digital signature (equivalent to physical signature for application documents) |
| ETB | Existing to Bank — customer with an active savings or current account with the bank |
| FOIR | Fixed Obligation to Income Ratio — ratio of total monthly EMI obligations to net monthly income, expressed as a percentage |
| GST | Goods and Services Tax |
| ITR | Income Tax Return — annual tax filing document |
| KYC | Know Your Customer — regulatory identity and address verification process |
| LMS | Lead Management System — platform managing application lifecycle, ARN generation, status tracking |
| NAI | Net Annual Income |
| NMI | Net Monthly Income |
| NTB | New to Bank — customer with no existing relationship with the bank |
| NRI | Non-Resident Indian |
| OTP | One-Time Password — time-limited numeric code for verification |
| PAN | Permanent Account Number — 10-character alphanumeric tax identification number issued by income tax authority |
| PRD | Product Requirements Document |
| PSU | Public Sector Undertaking |
| RBAC | Role-Based Access Control |
| SEP | Self-Employed Professional — Doctor, CA, CS, Lawyer, Architect, Consultant |
| SENP | Self-Employed Non-Professional — Trader, Manufacturer, Business owner |
| STP | Straight Through Processing — end-to-end automated processing without manual intervention at any stage |
| T&C | Terms and Conditions |
| TAT | Turnaround Time |
| TLS | Transport Layer Security — encryption protocol for data in transit |
| UIDAI | Unique Identification Authority of India — government authority issuing Aadhaar identity |
| UX | User Experience |
| VKYC | Video Know Your Customer — video call-based identity verification conducted by a trained agent |
| WCAG | Web Content Accessibility Guidelines |

---

*Document Version: 1.0 | Phase 1 — Web Digital Self-Service Journey*  
*Classification: Internal Confidential*  
*Next Review: Before Engineering Kickoff*  
*Prepared by: Product Team | Date: 2026-05-08*
