# PRD + FSD — Journey Entry Identifier
**Version:** 1.0  
**Date:** 2026-05-12  
**Author:** Sujeet Kumar  
**Status:** Draft — Pending Implementation Approval

---

## Table of Contents
1. [Problem Statement](#1-problem-statement)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [User Stories](#3-user-stories)
4. [Identifier-Eligible Blocks](#4-identifier-eligible-blocks)
5. [Functional Specification](#5-functional-specification)
   - 5.1 Start Node Behaviour
   - 5.2 Entry Identifier Picker Modal
   - 5.3 Canvas Visual Treatment
   - 5.4 Block Library Visual Treatment
   - 5.5 Configuration Panel Behaviour
   - 5.6 Validation & Constraints
   - 5.7 New Block Definitions (Mobile OTP, Account Number)
6. [Data Model Changes](#6-data-model-changes)
7. [Edge Cases & Error States](#7-edge-cases--error-states)
8. [Out of Scope](#8-out-of-scope)
9. [Open Questions](#9-open-questions)

---

## 1. Problem Statement

Currently, every journey in Antigravity starts with a hardcoded PAN Verification block. In reality, different programs use different unique identifiers to establish an applicant's identity at the start of a journey:

- A consumer BNPL program identifies applicants by **Mobile Number**
- A credit card program identifies applicants by **PAN Number**
- A rural microfinance program identifies applicants by **Aadhaar Number**
- An existing-customer top-up journey identifies applicants by **Bank Account Number**

The **same block** (e.g., PAN Verification) can play two different roles in a journey:
1. **Entry Identifier** — the very first step; the field collected here is the applicant's session key and deduplication anchor.
2. **KYC Step** — a later step that collects PAN as part of compliance, but the applicant is already identified by something else (e.g., mobile).

There is currently no way to:
- Designate which block plays the Entry Identifier role
- Distinguish a block in its "identifier" role vs its "KYC" role visually
- Restrict the Start node to only connect to identifier-appropriate blocks
- Support Mobile OTP or Account Number as entry points (these blocks don't exist yet)

---

## 2. Goals & Non-Goals

### Goals
- Allow CSTs to configure ANY of 4 designated blocks as the journey entry identifier
- The same block (e.g., PAN) can also be used later in the journey as a KYC step — no restriction
- Visual differentiation between a block in "identifier" role vs "KYC" role on the canvas
- The Start node's connection point restricts which blocks can be placed directly after it
- No program-level configuration screen required — everything is configured on the canvas
- Introduce two new blocks: **Mobile OTP Verification** and **Account Number Verification**

### Non-Goals
- Program-level identifier selection (config screen before the canvas)
- More than one Entry Identifier block per journey
- Enforcing identifier data as a mandatory field in downstream blocks
- Changing any existing block's functionality, checks, pages, or hooks

---

## 3. User Stories

**US-01:** As a CST configuring a personal loan program, I want to set Mobile OTP as my journey's entry identifier so that applicants are identified by their mobile number from the very first step.

**US-02:** As a CST configuring a credit card program, I want to set PAN Verification as the entry identifier so that we deduplicate applicants by PAN from step one.

**US-03:** As a CST, after setting Mobile OTP as the entry identifier, I still want to be able to add PAN Verification later in the same journey as a KYC step — it should appear and work exactly as a normal KYC block with no identifier badge.

**US-04:** As a CST, when I look at the canvas, I want to immediately see which block is the "entry identifier" so I understand the applicant's journey start point at a glance.

**US-05:** As a CST, when I click the `+` button on the Start node, I want to see only the blocks that can identify applicants — not the full library of 15+ blocks — so I cannot accidentally wire a Router or Form Block directly after Start.

---

## 4. Identifier-Eligible Blocks

Exactly **4 blocks** are eligible to serve as the Journey Entry Identifier:

| # | Block ID | Block Name | Identifier Field | Status |
|---|---|---|---|---|
| 1 | `mobile_otp_verification` | Mobile OTP Verification | Mobile Number | **New block — to be created** |
| 2 | `pan_verification` | PAN Verification | PAN Number | Exists in `blockDefinitions.ts` |
| 3 | `aadhaar_verification` | Aadhaar Verification | Aadhaar Number | Exists in `blockDefinitions.ts` |
| 4 | `account_number_verification` | Account Number Verification | Bank Account Number | **New block — to be created** |

**Excluded by design:**
- GSTIN Verification — business identifier, not a personal applicant identifier
- Udyam Verification — same reason
- All other Smart blocks (Liveness, Bank Statement, eSign, etc.) — not identifiers
- Form Block, Router, Merge, End — not identifier blocks

---

## 5. Functional Specification

---

### 5.1 Start Node Behaviour

**File to modify (pending approval):** `src/app/components/nodes/StartNode.tsx`

#### Current behaviour
The Start node shows a `+` button that opens the full block picker (or connects to any block the CST drags onto it).

#### New behaviour

**5.1.1 — Start node has two states:**

| State | Condition | `+` Button Label | `+` Button Style |
|---|---|---|---|
| **Unset** | No identifier block connected yet | `Set Entry Identifier` | Amber/yellow color with a key icon `🔑` |
| **Set** | Identifier block already wired | `+` (normal, disabled or hidden) | Grey / no add button |

**5.1.2 — When CST clicks "Set Entry Identifier":**
Opens the **Entry Identifier Picker** (see 5.2). The full block library drawer does NOT open.

**5.1.3 — When identifier already set:**
The Start → Identifier edge is fixed. CST cannot add a second block directly after Start. The edge from Start to the identifier block cannot be deleted (or if deleted, the identifier block loses its ENTRY ID badge and the Start node returns to "Unset" state).

**5.1.4 — Visual indicator on Start node (Unset state):**
Add a subtle pulsing ring or amber dashed border on the Start node's output handle to signal "this needs to be configured."

---

### 5.2 Entry Identifier Picker Modal

**New component:** `src/app/components/EntryIdentifierPicker.tsx`

A focused modal — NOT the full block library drawer. Appears when CST clicks "Set Entry Identifier" on the Start node.

#### Layout

```
┌───────────────────────────────────────────────────────────┐
│  🔑  How will you identify your applicants?               │
│  Select the unique identifier for this journey.           │
│                                                           │
│  ┌─────────────────────┐  ┌─────────────────────┐        │
│  │  📱                 │  │  💳                 │        │
│  │  Mobile OTP         │  │  PAN Verification   │        │
│  │  Verification       │  │                     │        │
│  │                     │  │  Identifier:        │        │
│  │  Identifier:        │  │  PAN Number         │        │
│  │  Mobile Number      │  │                     │        │
│  │                     │  │  Best for: Credit   │        │
│  │  Best for: Consumer │  │  cards, home loans  │        │
│  │  loans, BNPL        │  │                     │        │
│  └─────────────────────┘  └─────────────────────┘        │
│                                                           │
│  ┌─────────────────────┐  ┌─────────────────────┐        │
│  │  🪪                 │  │  🏦                 │        │
│  │  Aadhaar            │  │  Account Number     │        │
│  │  Verification       │  │  Verification       │        │
│  │                     │  │                     │        │
│  │  Identifier:        │  │  Identifier:        │        │
│  │  Aadhaar Number     │  │  Bank Account No.   │        │
│  │                     │  │                     │        │
│  │  Best for: Rural,   │  │  Best for: Existing │        │
│  │  microfinance       │  │  customer journeys  │        │
│  └─────────────────────┘  └─────────────────────┘        │
│                                                           │
│                                        [ Cancel ]        │
└───────────────────────────────────────────────────────────┘
```

#### Behaviour
- Modal size: `max-w-2xl` (narrower than AddHookDialog — this is a simple 4-card picker)
- Click a card → closes modal → places that block on canvas directly connected to Start
- Placed block immediately gets the **ENTRY ID** visual treatment (see 5.3)
- Cancel → modal closes, nothing placed, Start remains in "Unset" state
- No search bar needed (only 4 options)

---

### 5.3 Canvas Visual Treatment

The identifier block on canvas must be visually distinct from the same block used later as a KYC step.

#### ENTRY ID Badge
When a block is in identifier role (connected directly to Start and designated as entry identifier):
- A small amber/yellow pill appears at the **top** of the node card (above the block name)
- Pill content: `🔑 ENTRY ID`
- Pill style: `bg-amber-100 text-amber-700 border border-amber-300 text-[10px] font-semibold rounded-full px-2 py-0.5`
- Positioned similarly to how Data Hook pills appear at the bottom of Smart/Form block nodes

#### Start → Identifier Edge Style
- The edge connecting Start → Identifier block uses a **distinct edge style** vs normal edges
- Suggested: amber/yellow color `#d97706` or a slightly thicker stroke
- This visually "seals" the entry path as special

#### Same Block Used as KYC Later
If PAN Verification appears at position 4 in the journey (as KYC), it renders exactly as it does today — blue SMART badge, no ENTRY ID pill, normal edges.

---

### 5.4 Block Library Visual Treatment

**No new sections.** The library structure stays unchanged.

The 4 identifier-eligible blocks in the library get a small **key icon** `🔑` in the top-right corner of their block card. This is informational only — it signals "this block can also be used as the journey entry identifier."

Hovering the key icon shows a tooltip: `"Can be used as the journey entry identifier when placed after Start."`

Dragging an identifier-eligible block from the library onto the canvas (anywhere other than directly after Start) places it as a **normal block** — no ENTRY ID badge. The badge is only applied when:
1. The block is placed via the Entry Identifier Picker, OR
2. The block is manually connected directly to the Start node's output handle AND the user confirms the identifier role (see 5.6.3)

---

### 5.5 Configuration Panel Behaviour

When the selected block is in **ENTRY ID role**, the Configuration Panel shows an additional informational banner at the very top (above the accordion, below the block header):

```
┌─────────────────────────────────────────────────────────┐
│  🔑 Journey Entry Identifier                            │
│  The [field name] collected here is used to uniquely    │
│  identify applicants throughout this journey.           │
└─────────────────────────────────────────────────────────┘
```

- Banner style: `bg-amber-50 border border-amber-200 rounded-md p-3`
- The `[field name]` is dynamically filled based on block:
  - Mobile OTP → "mobile number"
  - PAN Verification → "PAN number"
  - Aadhaar Verification → "Aadhaar number"
  - Account Number → "bank account number"

All other configuration sections (Block Info, UI Config, Checks, Retry, Data Hooks) remain exactly as they are. The identifier role adds information only — no sections are removed or locked.

---

### 5.6 Validation & Constraints

#### 5.6.1 — Only one ENTRY ID block per journey
- The system tracks `entryIdentifierBlockId: string | null` in journey state (see Section 6)
- If a block already has ENTRY ID role, the Start node `+` button is disabled
- Attempting to drag a second identifier block onto the Start output handle is rejected with a toast: `"Entry identifier is already set. Remove the existing connection first."`

#### 5.6.2 — Drag-to-connect validation
When a CST manually drags a connection from the **Start node's output handle** to any block:
- If target block is one of the 4 identifier-eligible blocks → allow; apply ENTRY ID role automatically
- If target block is NOT identifier-eligible (Form Block, Router, another Smart Block like Liveness, etc.) → reject connection; show toast: `"The Start block must connect to an identifier block. Use the 'Set Entry Identifier' button instead."`

#### 5.6.3 — Removing the identifier block
If the CST deletes the edge between Start and the identifier block:
- The block loses its ENTRY ID badge and role
- `entryIdentifierBlockId` resets to `null`
- Start node returns to "Unset" state with "Set Entry Identifier" button
- Toast: `"Entry identifier removed. The journey no longer has a defined entry point."`

If the CST deletes the identifier block node itself:
- Same reset as above
- Toast: `"Entry identifier block deleted. Please set a new entry identifier."`

#### 5.6.4 — Non-identifier blocks cannot be placed directly after Start
The `+` button on the Start node opens the Entry Identifier Picker exclusively. The Start node does not participate in the general "Add block" flow from the block library.

---

### 5.7 New Block Definitions

Two new `SmartBlockDefinition` entries must be added to `blockDefinitions.ts`.

---

#### Block A: Mobile OTP Verification

```
ID:          mobile_otp_verification
Name:        Mobile OTP Verification
Category:    identity
Provider:    Telecom OTP Gateway
Color:       Blue (SMART)
Icon:        Smartphone
hasChecks:   false
hasRetry:    true
```

**Pages:**

| Page ID | Page Name | User Inputs |
|---|---|---|
| `mobile_input` | Mobile Input Page | Mobile Number (tel, required) |
| `otp_verification` | OTP Verification Page | OTP (text, 6-digit, required) |
| `mobile_confirmed` | Mobile Confirmed Page | — (display only) |

**General Config fields:**
| Field | Type | Options | Default |
|---|---|---|---|
| OTP Expiry (seconds) | number | — | 120 |
| OTP Length | select | 4 digits, 6 digits | 6 digits |
| Resend Cooldown (seconds) | number | — | 30 |
| Max Resend Attempts | number | — | 3 |

**Retry Config:**
| Scenario | Default maxAttempts | Default coolingPeriod |
|---|---|---|
| OTP Failure | 3 | 60s |
| Invalid Mobile | 2 | 0s |

**Checks:** None (OTP verification is binary pass/fail; no sub-checks needed)

**Native field produced:** `mobile` (standard native field — already in the native fields catalog)

---

#### Block B: Account Number Verification

```
ID:          account_number_verification
Name:        Account Number Verification
Category:    identity
Provider:    Account OTP Verification
Color:       Blue (SMART)
Icon:        Landmark
hasChecks:   true
hasRetry:    true
```

**Verification method:** The applicant enters their bank account number, then receives an OTP on the mobile number registered with that bank account. OTP confirmation verifies ownership of the account. No IFSC required.

**Pages:**

| Page ID | Page Name | User Inputs |
|---|---|---|
| `account_input` | Account Input Page | Account Number (text, required) |
| `otp_verification` | OTP Verification Page | OTP (text, 6-digit, required) |
| `account_confirmed` | Account Confirmed Page | — (display only — shows masked account number) |

**General Config fields:**
| Field | Type | Options | Default |
|---|---|---|---|
| OTP Expiry (seconds) | number | — | 120 |
| Resend Cooldown (seconds) | number | — | 30 |
| Max Resend Attempts | number | — | 3 |

**Checks:**
| Check ID | Check Name | Default | outputResponse |
|---|---|---|---|
| `account_active_check` | Active Account Check | enabled | reject |
| `blacklist_check` | Blacklisted Account Check | disabled | reject |

**Retry Config:**
| Scenario | Default maxAttempts | Default coolingPeriod |
|---|---|---|
| OTP Failure | 3 | 60s |
| Invalid Account Number | 2 | 0s |

**Native field produced:**
- `account_number` — new native field (to be added to the native fields catalog)

---

## 6. Data Model Changes

### 6.1 SmartBlockDefinition — new flag

Add `isIdentifierBlock: boolean` to `SmartBlockDefinition` in `src/app/types/journey.ts`:

```typescript
export interface SmartBlockDefinition {
  id: string;
  name: string;
  description: string;
  category: BlockCategory;
  icon: string;
  provider?: string;
  hasChecks: boolean;
  hasRetry: boolean;
  pages: PageConfig[];
  checks?: CheckConfig[];
  generalConfig?: GeneralConfigField[];
  retryConfig?: RetryConfigItem[];
  isIdentifierBlock?: boolean;   // ← NEW: true for the 4 eligible blocks only
}
```

Set `isIdentifierBlock: true` on:
- `mobile_otp_verification`
- `pan_verification`
- `aadhaar_verification`
- `account_number_verification`

All other blocks: field absent (treated as `false`).

### 6.2 FlowNodeData / BlockData — role flag

Add `isEntryIdentifier: boolean` to `BlockData` (or `FlowNodeData`) in `src/app/types/journey.ts`:

```typescript
export interface BlockData {
  id: string;
  type: BlockType;
  name: string;
  description?: string;
  isEntryIdentifier?: boolean;   // ← NEW: true only on the one block playing identifier role
  // ... rest of existing fields
}
```

### 6.3 Journey-level state in App.tsx

Add `entryIdentifierBlockId: string | null` to the journey state managed in `App.tsx`:

```typescript
const [entryIdentifierBlockId, setEntryIdentifierBlockId] = useState<string | null>(null);
```

This is the single source of truth for which block is the entry identifier. It is:
- Set when a block is placed via the Entry Identifier Picker
- Set when a block is connected to Start's output handle and is identifier-eligible
- Reset to `null` when the identifier block or its edge to Start is removed

### 6.4 Native Fields Catalog additions

Add to the native fields reference (in `PROJECT_CONTEXT.md` and wherever native fields are defined in code):

| Key | Label | Type |
|---|---|---|
| `account_number` | Account Number | text |

`mobile` already exists in the native fields catalog. `ifsc_code` is no longer required (Account Number Verification uses OTP, not IFSC).

---

## 7. Edge Cases & Error States

| Scenario | Behaviour |
|---|---|
| CST tries to connect Start → Router Block | Connection rejected. Toast: "Start must connect to an identifier block." |
| CST tries to connect Start → Form Block | Connection rejected. Same toast. |
| CST tries to connect Start → Liveness Block | Connection rejected. Same toast. |
| CST places identifier block via Picker, then deletes the START→ID edge | Block loses ENTRY ID badge. `entryIdentifierBlockId` = null. |
| CST places identifier block via Picker, then deletes the block entirely | Same reset. Toast shown. |
| CST drags PAN from library onto canvas mid-journey | Placed as normal KYC block. No ENTRY ID badge. |
| CST tries to re-use Start Picker when identifier is already set | Picker button on Start is disabled or shows "Identifier already set — delete the current one to change." |
| Journey has no entry identifier set (Start is unconnected) | Canvas shows a visible warning badge on the Start node. Export/save (when implemented) may warn too. |
| CST drags an identifier-eligible block onto Start's output handle directly | Allowed — block placed with ENTRY ID role automatically. `entryIdentifierBlockId` set. |
| CST removes the current entry identifier and adds a different one | All downstream blocks that reference the old identifier's native field (e.g., `pan_number`) show a warning indicator: "This block may reference an identifier that has changed. Review your configuration." Warning shown on the canvas node card and in the Configuration Panel. |

---

## 8. Out of Scope

- Changing the internal behavior, checks, pages, hooks, or API of PAN Verification or Aadhaar Verification
- Any program-level or template-level configuration of the entry identifier
- Backend storage / API contracts for the entry identifier concept
- Enforcement that downstream blocks use the identifier field (e.g., auto-populating PAN in CIBIL hook if PAN is the entry ID)
- Multi-identifier journeys (two entry points)
- Changing the GSTIN or Udyam blocks — these remain regular KYC blocks only

---

## 9. Open Questions

| # | Question | Owner | Status | Decision |
|---|---|---|---|---|
| Q1 | For Account Number Verification, should the identifier be Account Number alone, or Account Number + IFSC together? | Product | **Resolved** | Account Number + OTP only. No IFSC required. |
| Q2 | Should the Aadhaar block offer Virtual ID (VID) as an alternative input to full Aadhaar? (SC ruling 2018 restriction on private storage of raw Aadhaar) | Legal / Product | Deferred | To be addressed in a future Aadhaar compliance sprint |
| Q3 | When the CST changes the entry identifier (removes current, adds new), should existing canvas blocks show a warning? | Product | **Resolved** | Yes — downstream blocks show a warning indicator when the entry identifier changes |
| Q4 | Mobile OTP — SMS only or also WhatsApp OTP? | Product | **Resolved** | SMS only |
| Q5 | Account Number Verification — show bank name and branch on confirmed page? | Engineering | **Resolved** | No — confirmed page shows masked account number only |
| Q6 | ENTRY ID badge color — amber/yellow? | Design | **Resolved** | Amber confirmed |
