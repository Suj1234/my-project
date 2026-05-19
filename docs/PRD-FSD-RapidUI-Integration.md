# PRD + FSD: RapidUI Integration with Journey Builder

**Version:** 2.0  
**Date:** 2026-05-18  
**Author:** Product Discussion (Sujeet Kumar)  
**Status:** Draft — Approach Selection Pending

---

## Table of Contents

1. [Background & Context](#1-background--context)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Non-Goals](#3-goals--non-goals)
4. [Three Approaches — Comparison](#4-three-approaches--comparison)
   - 4.1 Approach 1: Guided Redirect from JB
   - 4.2 Approach 2: Fully Manual in Rapid UI
   - 4.3 Approach 3: API-Created App with Redirect
   - 4.4 Approach Comparison Matrix
5. [User Stories](#5-user-stories)
6. [Feature Specifications](#6-feature-specifications)
   - 6.1 Manage Pages Tab
   - 6.2 App Creation (All Approaches)
   - 6.3 Canvas — UI Configuration (3 Options)
   - 6.4 Page Generation (Blank App Scenario)
   - 6.5 Silent Login / Page Editing
   - 6.6 Template Handling
   - 6.7 Display Title — Tenant Level
   - 6.8 Tenant-Level Rapid UI Credentials
7. [UI/UX Specifications](#7-uiux-specifications)
8. [API Contract (Proposed)](#8-api-contract-proposed)
9. [Open Questions](#9-open-questions)
10. [Decisions Made](#10-decisions-made)
11. [Out of Scope](#11-out-of-scope)

---

## 1. Background & Context

### Two Platforms

| Platform | Purpose |
|---|---|
| **Journey Builder (JB)** | Configure loan programs, build journeys/workflows, define blocks/steps a customer goes through |
| **Rapid UI Platform** | Create and manage UI pages (screens) that are rendered during a customer's loan application journey |

### How They Connect

- JB defines the **journey flow** — what happens and in what order.
- Rapid UI renders the **actual UI screens** the customer sees at each step.
- A JB Program maps to a **Rapid UI App** (one-to-one). All pages for a program live in that app.
- CST members configure programs in JB and create/edit pages in Rapid UI.

### Relationship Model

```
JB Program  ←──── program_code ────→  Rapid UI App
    │                                       │
    │  (reads page list)                    │  (owns pages)
    ▼                                       ▼
Manage Pages Tab                    Pages (ACTIVE / INACTIVE / DRAFT)
Canvas → UI Configuration           Page editor, templates, copy
```

### Current Pain Points

1. CST must **manually log into Rapid UI** on a separate tab — no guided flow from JB.
2. **Template ID is hardcoded** — all programs use the same default regardless of lender/tenant.
3. **No link between a JB program and a Rapid UI app** — CST must manage this manually.
4. **Display title on Rapid UI pages is hardcoded** — not configurable per tenant.
5. **No "Manage Pages" section** in JB showing pages for a program (now built — see Section 6.1).
6. **No page generation capability** — if an app is blank, CST has no way to generate pages from the Canvas based on action requirements.

---

## 2. Problem Statement

When a CST member sets up a new lending program in Journey Builder, they also need to set up the corresponding UI pages in Rapid UI. This currently requires:

- Switching to a separate browser tab and manually logging into Rapid UI.
- Manually creating an app in Rapid UI with no reference back to the JB program.
- Copying templates manually with no automated linking.
- Clicking a "Publish" button in Rapid UI after copying template pages.
- Manually identifying what fields each page needs — no system guidance on mandatory fields per action.

This creates friction, increases setup time, and risks configuration mismatches between what the journey expects and what pages actually exist in Rapid UI.

### Problem Coverage by Approach

| Problem | Approach 1 | Approach 2 | Approach 3 |
|---|---|---|---|
| Manual login to Rapid UI (separate tab) | ✅ Solved — redirect from JB | ❌ Not solved — CST still logs in manually | ⚠️ Partial |
| Template ID hardcoded | ✅ Solved | ✅ Solved | ❌ Not solved |
| No JB ↔ Rapid UI program link | ✅ Solved | ✅ Solved | ✅ Solved |
| Display title hardcoded | ✅ Solved (all approaches — Section 6.7) | ✅ | ✅ |
| No Manage Pages section | ✅ Built (all approaches) | ✅ | ✅ |
| Copying pages manually, no automation | ✅ Solved | ✅ Solved | ❌ Not solved |
| Publish button required after copy | ❓ Pending Q1 | ❓ Pending Q1 | ✅ N/A (no copy) |
| No guidance on mandatory fields per action | ✅ Solved — page generation | ✅ Solved — page generation | ❌ Broken — no template |

---

## 3. Goals & Non-Goals

### Goals

- [x] **G1:** Add a "Manage Pages" tab inside a JB Program so CST can see all pages associated with a program in one place.
- [ ] **G2:** Establish a clear, reliable link between a JB program and its Rapid UI app.
- [ ] **G3:** Allow CST to create a Rapid UI app with template and copy options — either guided from JB (Approach 1) or manually in Rapid UI (Approach 2).
- [ ] **G4:** Eliminate the requirement for CST to manually log into Rapid UI for page editing — implement silent/SSO authentication.
- [ ] **G5:** Make the template configurable at app level; tenant-level template applies as fallback if none defined at app level.
- [ ] **G6:** Make the display title shown on Rapid UI pages configurable at the tenant level.
- [ ] **G7:** Allow CST to generate new pages from the Canvas based on action-defined mandatory fields, using the app's existing template as the layout.

### Non-Goals

- Replacing the Rapid UI platform or its page editor.
- Rebuilding the page schema upload flow (remains as-is under "Upload Page Schema").
- Managing Rapid UI app permissions or user roles from JB.
- Supporting bulk app creation across multiple programs.
- JB calling Rapid UI APIs to create pages directly (all page creation happens in Rapid UI).

---

## 4. Three Approaches — Comparison

> This section documents all three approaches considered. A final approach has not yet been selected.

---

### 4.1 Approach 1: Guided Redirect from JB

**How it works:**

1. CST is in JB on the Manage Pages tab.
2. No app linked yet → JB shows empty state with a **"Create App in Rapid UI"** button.
3. CST clicks the button → JB constructs a redirect URL with context and sends the CST to Rapid UI.
4. **In Rapid UI:** App name is pre-filled (`{program_name} – {program_code}`), tenant is pre-selected and locked. CST configures:
   - **Template** (page layout) — optional. If not selected, tenant-level template applies automatically.
   - **Copy pages** — optional. CST can copy pages from the tenant library or from another program (page-level selection, independent copies).
5. CST creates the app in Rapid UI.
6. Rapid UI redirects back to JB callback URL with `app_id`.
7. JB stores `app_id` at the program level. JB fetches and displays the page list.

**Context JB passes in redirect:**
```
program_name   → pre-fills app name in Rapid UI
program_code   → pre-selects and locks tenant context
tenant_id      → identifies the lender
callback_url   → where Rapid UI sends CST back after creation
```

**Pros:**
- Guided, low-error flow — CST starts from JB and context is passed automatically.
- No risk of program_code misconfiguration (passed by system, not typed by CST).
- Template and copy options are available (full capability).
- The link (app_id) is established automatically via callback.

**Cons:**
- Requires Rapid UI to support a redirect-based creation flow (accepting context params, returning app_id via callback).
- JB needs a callback endpoint to receive the app_id.
- Slightly more integration work between JB and Rapid UI teams.

**Problems NOT solved by this approach:**
- **Publish button (P7):** If Rapid UI requires a manual "Publish" step after copying template pages, CST still has to do this in Rapid UI after being redirected. Pending Open Q1.

---

### 4.2 Approach 2: Fully Manual in Rapid UI

**How it works:**

1. CST independently opens Rapid UI (no button or prompt from JB).
2. CST creates an app in Rapid UI — sets app name, picks layout template, optionally copies pages from tenant library or another program.
3. CST manually configures the **program code** in the Rapid UI app settings (this is the link back to JB).
4. JB periodically queries (or queries on-demand when CST opens Manage Pages) Rapid UI for apps where `program_code` matches the current program.
5. If a match is found → JB displays the page list. No CST action required in JB.
6. Pages created or updated in Rapid UI reflect in JB automatically.

**Pros:**
- Simplest integration — JB only needs a read API from Rapid UI (query by program_code).
- No redirect flow, no callback URL, no app_id storage in JB.
- Rapid UI is fully autonomous — CST has full power in Rapid UI without any JB constraints.
- Template and copy options are available (full capability, same as Approach 1).

**Cons:**
- CST must manually configure program_code in Rapid UI — risk of typo or misconfiguration causing pages not to appear in JB.
- No guided flow — CST must know to go to Rapid UI independently and set up the link.
- Higher risk of disconnect between what JB expects and what Rapid UI has.
- Onboarding new CST members is harder (no in-JB prompt).

**Problems NOT solved by this approach:**
- **Manual login (P1):** CST still manually opens Rapid UI and logs in independently — the core pain point of switching to a separate tab is NOT resolved for app creation.
- **Publish button (P7):** Same as Approach 1 — if Rapid UI requires a manual publish step after copy, CST still does it manually. Pending Open Q1.
- **Silent login for app creation:** Not applicable — CST is already in Rapid UI. Silent login only helps for page editing from Canvas (same as all approaches).

---

### 4.3 Approach 3: API-Created App with Redirect

**How it works:**

1. CST clicks a button in JB.
2. JB calls Rapid UI's **create-app API** programmatically (passes app_name + program_code).
3. App is created as a blank app (no template, no pages).
4. JB redirects the user to Rapid UI where the newly created app is visible.
5. JB stores the app_id returned from the API.

**Cons (why this approach is weaker):**

| Problem | Impact |
|---|---|
| **No template configured** | App is created blank — no layout template set. When CST tries to generate new pages later (from Canvas), Rapid UI has no template to render against. Page generation is broken. |
| **No copy option** | CST cannot copy pages from the tenant library or another program during creation. App always starts empty. |
| **Template must be set manually later** | CST must remember to go back into Rapid UI app settings and configure the template separately — an extra manual step with no JB guidance. |

**Problems NOT solved by this approach:**
- **Template (P2):** App created blank — no layout template. Page generation from Canvas is broken.
- **Copy pages (P6):** No option to copy from tenant library or other programs.
- **Publish button (P7):** Not applicable — no template copy happens, so publish is not triggered. However the blank app still has no pages.

**Conclusion:** Approach 3 creates a broken page generation experience because the app-level template — which is required when generating new pages from the Canvas — is never set during creation. Approaches 1 and 2 avoid this because template configuration is part of the app creation flow in Rapid UI.

---

### 4.4 Approach Comparison Matrix

| Criteria | Approach 1 | Approach 2 | Approach 3 |
|---|---|---|---|
| **Initiation** | From JB (guided) | From Rapid UI (manual) | From JB (API) |
| **App creation UI** | In Rapid UI (after redirect from JB) | In Rapid UI (manual) | Via JB API call (programmatic) |
| **Context passed** | Automatic (program_name, code, tenant) | Manual (CST types program_code) | Automatic (app_name + program_code via API) |
| **Template option** | ✅ Available in Rapid UI | ✅ Available in Rapid UI | ❌ Not available (blank app) |
| **Copy pages option** | ✅ Available in Rapid UI | ✅ Available in Rapid UI | ❌ Not available |
| **Page generation** | ✅ Works (app template auto-applies) | ✅ Works (app template auto-applies) | ❌ Broken (no template set) |
| **JB ↔ Rapid UI link** | app_id via callback | JB queries by program_code | app_id from API response |
| **Solves manual login (P1)** | ✅ Yes — redirect from JB, no separate login for creation | ❌ No — CST still logs into Rapid UI manually | ⚠️ Partial — redirect for creation only |
| **Publish button risk (P7)** | ❓ Pending Q1 (if copy used) | ❓ Pending Q1 (if copy used) | ✅ Not applicable (no copy) |
| **Silent login for page editing** | ✅ Applicable (pending Q2) | ✅ Applicable (pending Q2) | ✅ Applicable (pending Q2) |
| **Manage Pages empty state** | "Create App in Rapid UI" button (redirect) | Guidance text — no button (CST acts in Rapid UI) | "Create App" button (JB API call) |
| **Integration complexity** | Medium (redirect + callback) | Low (read-only query only) | Low (create API + redirect) |
| **Error risk** | Low | High (manual program_code entry) | Medium |
| **CST experience** | Guided, seamless | Fully manual, no guidance | Partial — no template/copy |

---

## 5. User Stories

### US-01: Manage Pages Tab
> As a CST member, I want to see all UI pages linked to a program in one place within JB, so I don't have to switch to Rapid UI just to view the page list.

**Acceptance Criteria:**
- A "Manage Pages" tab is visible inside every program in JB.
- The tab shows: Name, Page Type, Status, Actions columns.
- Filter by Name and Status (ACTIVE / INACTIVE / DRAFT).
- Eye icon → Page Details screen (view and edit page metadata).

---

### US-02: Create App (Approach 1)
> As a CST member, when I click "Create App in Rapid UI" in JB, I am redirected to Rapid UI with my program context pre-filled, so I can set up the app without manual data entry.

**Acceptance Criteria:**
- Clicking the button redirects to Rapid UI with program name, program code, and tenant pre-filled/locked.
- CST can optionally select a layout template (if not selected, tenant default applies).
- CST can optionally copy pages from tenant library or another program.
- After creation, CST is redirected back to JB and pages appear in Manage Pages.

---

### US-02B: Create App (Approach 2)
> As a CST member, I create the app directly in Rapid UI and configure the program code in the app settings; JB automatically discovers and displays the pages.

**Acceptance Criteria:**
- CST creates app and sets program_code in Rapid UI app settings.
- JB queries Rapid UI by program_code — no manual linking in JB required.
- Pages appear in Manage Pages tab automatically once the link exists.

---

### US-03: Copy Pages During App Creation
> As a CST member, when setting up a new program's app, I want to copy pages from an existing program or the tenant library so I don't build from scratch.

**Acceptance Criteria:**
- Copy from tenant library: shows pre-built pages with checkboxes (page-level selection).
- Copy from another program: shows a program dropdown → then that program's pages with checkboxes.
- Copies are independent — changes in source do not affect destination.
- Cross-tenant copy is not allowed.

---

### US-04: Canvas — Assign Existing Page
> As a CST member configuring a Canvas block, I want to assign an already-created Rapid UI page to a step, so the journey knows which screen to show.

**Acceptance Criteria:**
- UI Configuration section shows a dropdown of pages from this program's Rapid UI app.
- If no app is linked, dropdown is disabled with a message directing CST to Manage Pages.
- Selection is saved immediately (no Save button).

---

### US-05: Canvas — Edit Existing Page
> As a CST member, I want to edit a page's layout and content directly in Rapid UI from the Canvas without a separate login.

**Acceptance Criteria:**
- "Edit in Rapid UI" button triggers silent login and opens the page in Rapid UI editor.
- No separate Rapid UI login required.

---

### US-06: Canvas — Generate New Page
> As a CST member, when a step has no page yet, I want to generate a new page that automatically includes the mandatory fields for the configured action, so I don't miss any required inputs.

**Acceptance Criteria:**
- CST selects an action for the step (e.g., PAN_VERIFY).
- System shows the mandatory fields derived from the action contract.
- CST can add more fields if needed.
- Clicking "Generate Page" redirects to Rapid UI — mandatory fields are pre-seeded and locked.
- Rapid UI uses the app's existing layout template automatically (JB does not pass template_id).
- After page creation in Rapid UI, CST is redirected back to JB and page is auto-assigned to the step.

---

### US-07: Dynamic Template per App
> As a system, when a CST creates a new page from the Canvas, the page layout should use the template configured at the app level in Rapid UI, with the tenant-level template as fallback.

**Acceptance Criteria:**
- JB does not pass a template_id when generating pages — Rapid UI uses its own app-level template.
- Template hierarchy: app-level template → tenant-level default → blank.
- Changing the app's template in Rapid UI automatically applies to all subsequent page creations for that app.

---

### US-08: Tenant-Level Display Title
> As a product manager, I want the message/title shown on Rapid UI pages to be configurable per tenant.

**Acceptance Criteria:**
- A tenant-level `display_title` field exists in JB.
- The title is passed in the silent login context when opening Rapid UI.
- Each tenant can have a different title.

---

## 6. Feature Specifications

---

### 6.1 Manage Pages Tab

**Status:** ✅ Built

**Location:** Program View → "Manage Pages" tab (second tab)

**Tab Order:**
1. Program Details
2. **Manage Pages**
3. Scheme
4. Manage Custom Fields
5. Document Templates
6. Login Checklist
7. Manage Workflow

**Empty State (no app linked):**

```
┌──────────────────────────────────────────────────────────┐
│  Manage Pages                                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   No pages have been set up for this program.            │
│   Create an app in Rapid UI to get started.              │
│                                                          │
│              [ → Create App in Rapid UI ]                │
│                                                          │
│   Already have page schemas?  [ Upload Page Schema ]     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

> Note: Empty state button text and behavior differs by approach (see 6.2).

**App Linked State:**

| Column | Description |
|---|---|
| Name | Page name as stored in Rapid UI |
| Page Type | Currently always `APP_STATE_PAGE` |
| Status | `ACTIVE` / `INACTIVE` / `DRAFT` |
| Actions | Eye icon → Page Details |

**Buttons (top-right when app linked):**
- `Upload Page Schema` — existing file-upload flow
- `+ Create Page` — redirects to Rapid UI create-page flow for this app

---

### 6.2 App Creation (All Approaches)

#### Approach 1 — Guided Redirect

**Empty state in Manage Pages:**
```
No pages have been set up for this program.
Create an app in Rapid UI to get started.

        [ → Create App in Rapid UI ]

Already have page schemas?  [ Upload Page Schema ]
```

**Trigger:** "Create App in Rapid UI" button on empty state.

**JB constructs redirect URL with:**
```
program_name  → pre-fills app name field in Rapid UI
program_code  → pre-selects tenant and is locked
tenant_id     → identifies the lender instance
callback_url  → JB endpoint to receive app_id after creation
```

**In Rapid UI (Rapid UI's responsibility to build):**
- App name pre-filled as `{program_name} – {program_code}`, editable
- Tenant pre-selected and locked (from context)
- Option 1: **Template** — select page layout template (optional; if not selected, tenant-level default applies silently)
- Option 2: **Copy pages** — copy from tenant library OR from another program (page-level checkbox selection, independent copies, same tenant only)
- "Create App" button → creates app → redirects to JB callback with `app_id`

**After redirect back to JB:**
- JB stores `rapid_ui_app_id` at program level
- JB fetches page list from Rapid UI and displays in table

#### Approach 2 — Fully Manual

**Empty state in Manage Pages:**
```
No pages found for this program.

To set up pages:
1. Open Rapid UI platform and create an app.
2. In the app settings, enter this program code: HDFC_PL_001
3. Pages will appear here automatically once linked.

[ Upload Page Schema ]
```
> Note: No redirect button — CST acts in Rapid UI independently. JB shows the program code prominently so CST can copy it exactly (reduces typo risk).

**Trigger:** CST navigates to Rapid UI independently (no JB button).

**In Rapid UI:**
- CST creates app, picks template, copies pages as needed
- CST goes to app settings → enters the program code in a designated field

**JB Discovery:**
- JB queries Rapid UI: `GET /apps?program_code={program_code}&tenant_id={tenant_id}`
- No CST action required in JB to complete the link
- Query runs when CST opens the Manage Pages tab (or on-demand refresh)

#### Approach 3 — API-Created (Not Recommended)

**Empty state in Manage Pages:**
```
No pages have been set up for this program.

        [ → Create App ]

Already have page schemas?  [ Upload Page Schema ]
```
> Note: Button triggers a JB API call (not a redirect dialog). App is created programmatically then user is redirected to Rapid UI.

**Trigger:** Button in JB.

**JB calls:** `POST /rapid-ui/api/apps` with `{ app_name, program_code }`

**Result:** Blank app created, user redirected to Rapid UI.

**Why not recommended:** App is blank — no template configured. Page generation from Canvas is broken because Rapid UI has no layout to render against.

---

### 6.3 Canvas — UI Configuration (3 Options)

**Location:** Configuration Panel → UI Configuration section → per step/page within a block.

**Prerequisite:** A Rapid UI app must be linked to this program. If not:
```
⚠  No Rapid UI app set up for this program.
   Go to Manage Pages to create one first.  →
```
All three options are disabled until an app is linked.

**Three options per step:**

```
UI Configuration — PAN Verification
──────────────────────────────────────────────────────
Step: PAN Input          Action: PAN_VERIFY

○  Assign existing page
   [ Select page ▼ ]  ← dropdown from this program's Rapid UI app

○  Edit existing page
   [ ✎ Edit in Rapid UI ↗ ]  ← silent login → opens Rapid UI editor

○  Generate new page
   Action mandatory fields:
     • PAN Number      (required, locked)
     • Entity Type     (required, locked)
   [ + Add more fields ]
   [ Generate Page → Rapid UI ]
──────────────────────────────────────────────────────
```

**Option A — Assign Existing Page:**
- JB fetches pages from Rapid UI using stored `app_id`
- Dropdown shows all pages from the program's app
- Selection saved immediately (no Save button — consistent with JB convention)

**Option B — Edit Existing Page:**
- JB generates a session/silent-login token
- Redirects to Rapid UI editor for the assigned page
- No callback needed — page edits are saved in Rapid UI

**Option C — Generate New Page:**
- See Section 6.4 for full detail

---

### 6.4 Page Generation (Blank App Scenario)

**When this is used:**
A program has a Rapid UI app with a layout template configured but no pre-assigned pages. CST is building the journey in Canvas and needs to create the page for a step.

**The Action Contract:**

Each action in JB has a defined set of mandatory input fields — fields the customer MUST provide on the page for the action to execute. This contract is defined in `blockDefinitions.ts` per block action:

```
Block: PAN Verification
  Step: PAN Input
  Action: PAN_VERIFY
  requiredInputFields:
    - key: pan_number,  label: PAN Number,  type: text,   required: true
    - key: entity_type, label: Entity Type, type: select, required: true
```

**Flow:**

```
CST selects block → UI Configuration
    ↓
Sees action = PAN_VERIFY
Mandatory fields shown: PAN Number, Entity Type (locked — cannot be removed)
CST can add additional fields if needed
    ↓
Clicks "Generate Page → Rapid UI"
    ↓
JB redirects to Rapid UI with:
  - app_id          (links to correct app)
  - action_id       (e.g., PAN_VERIFY)
  - prefill_fields  (mandatory fields with locked=true flag)
  - callback_url    (to receive page_id after creation)
    ↓
In Rapid UI:
  - App's layout template is applied automatically (no template_id needed from JB)
  - Mandatory fields are pre-placed on the page with lock icon
  - CST can add more fields, adjust layout, reorder
  - CST CANNOT delete locked mandatory fields
    ↓
CST saves page in Rapid UI
Rapid UI redirects back to JB with page_id
    ↓
JB auto-assigns the new page to the step that triggered generation
```

**Template Resolution (Rapid UI's responsibility):**
```
App-level template defined?
  YES → use it
  NO  → use tenant-level default template
  NO tenant default → blank layout (CST builds from scratch in Rapid UI)
```

JB does not pass a `template_id` during page generation. Rapid UI resolves the template from the app's own configuration. This ensures the correct layout is always used without JB needing to track template state.

**Locked Field Behavior:**
- Mandatory fields show a lock icon in the Rapid UI page editor
- CST can edit label, styling, position — but cannot delete
- Lock is enforced by Rapid UI (the `locked: true` flag is passed via the redirect/API)
- JB does not re-validate — Rapid UI owns enforcement

---

### 6.5 Silent Login / Page Editing

**Status:** 🔲 Not implemented — pending confirmation from Rapid UI team

**Used when:** CST clicks "Edit in Rapid UI" on an assigned page.

**Proposed flow:**
```
CST clicks Edit in Rapid UI
  → JB calls silent login endpoint with user identity + app_id + display_title
  → Rapid UI returns a redirect URL with session token
  → JB redirects CST to Rapid UI editor (new tab)
  → CST edits page directly in Rapid UI — no separate login needed
```

**Two implementation options (Rapid UI team to decide):**

| Option | Description |
|---|---|
| **A — SSO** | JB passes its auth token; Rapid UI trusts JB as identity provider |
| **B — System-provisioned credentials** | JB auto-provisions a Rapid UI account per user (or per tenant) and manages sessions silently |

**Proposed silent login payload:**
```json
{
  "user_identity": "<jb_user_token_or_id>",
  "app_id": "<rapid_ui_app_id>",
  "display_title": "<tenant_level_title>",
  "redirect_to": "editor",
  "page_id": "<page_id_to_open>"
}
```

> See Open Questions Q2, Q4, Q5

---

### 6.6 Template Handling

**Template hierarchy (two levels):**

| Level | What it is | Set by |
|---|---|---|
| **App-level template** | Page layout specific to this program's app | CST during app creation in Rapid UI (Approach 1 or 2) |
| **Tenant-level template** | Default layout for all apps under this tenant | Platform/admin team in Rapid UI tenant settings |

**Resolution logic (Rapid UI owns this):**
```
Creating a new page for app X:
  IF app X has a layout template defined → use it
  ELSE IF tenant has a default template → use tenant default
  ELSE → blank layout
```

**JB's role:** JB does NOT manage or store template IDs for page generation. JB passes `app_id` — Rapid UI resolves the template internally.

**JB does store** `template_id` only for the purpose of silent login context (Section 6.5), not for page layout resolution.

---

### 6.7 Display Title — Tenant Level

**Status:** 🔲 Not implemented

**Current state:** Display title shown on Rapid UI pages is hardcoded.

**Proposed state:**
- Add `display_title` field to the tenant/lender configuration in JB.
- Passed in the silent login payload when opening Rapid UI.
- Each tenant has a different title (e.g., "HDFC Personal Loan", "Axis Bank Loans").

---

### 6.8 Tenant-Level Rapid UI Credentials

**Status:** 🔲 Not implemented — needs decision (see Open Question Q6)

**Problem:** Different tenants may have separate Rapid UI instances with different base URLs and credentials. A single hardcoded credential breaks multi-tenant setup.

**Proposed tenant-level config in JB:**
```json
{
  "tenant_id": "hdfc_001",
  "rapid_ui": {
    "base_url": "https://hdfc.rapid-ui.perfios.com",
    "client_id": "hdfc_jb_client",
    "client_secret": "<encrypted>",
    "auth_type": "CLIENT_CREDENTIALS",
    "display_title": "HDFC Personal Loan"
  }
}
```

**Security rules:**
- `client_secret` stored encrypted — never exposed to frontend.
- All Rapid UI API calls proxied through JB backend — frontend never calls Rapid UI directly.
- JB backend reads tenant credentials, makes the API call, returns result to frontend.

---

## 7. UI/UX Specifications

### 7.1 Manage Pages Tab — Empty State

```
┌──────────────────────────────────────────────────────────────┐
│  Manage Pages                                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│     No pages have been set up for this program.              │
│     Create an app in Rapid UI to get started.                │
│                                                              │
│                [ → Create App in Rapid UI ]                  │
│                                                              │
│     Already have page schemas?  [ Upload Page Schema ]       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 Manage Pages Tab — App Linked

```
┌───────────────────────────────────────────────────────────────────┐
│  Manage Pages             [Show Filters] [Upload Page Schema]      │
│                                                [+ Create Page]    │
├───────────────────────────────────────────────────────────────────┤
│  [Filters — collapsible]                                          │
│  Name: [____________]   Status: [ACTIVE ▼ ×]                     │
│  [Apply Filters]  [Clear Filters]                                 │
├──────────────────────┬──────────────────┬──────────┬─────────────┤
│  Name                │  Page Type       │  Status  │  Actions    │
├──────────────────────┼──────────────────┼──────────┼─────────────┤
│  basicdetailsv4      │  APP_STATE_PAGE  │  ACTIVE  │  👁         │
│  panInputPage        │  APP_STATE_PAGE  │  ACTIVE  │  👁         │
│  aadhaarInputPage    │  APP_STATE_PAGE  │  DRAFT   │  👁         │
└──────────────────────┴──────────────────┴──────────┴─────────────┘
  Showing 12 of 12 items
```

### 7.3 Canvas — UI Configuration Section

```
┌─────────────────────────────────────────────────────────────────┐
│  UI Configuration                                               │
├─────────────────────────────────────────────────────────────────┤
│  PAN Input Step                         Action: PAN_VERIFY      │
│                                                                 │
│  [ Select existing page ▼ ]                                     │
│  basicdetailsv4                                                 │
│  panInputPage                                                   │
│  aadhaarInputPage                                               │
│                                                                 │
│  [ ✎ Edit in Rapid UI ↗ ]    [ + Generate New Page ↗ ]         │
└─────────────────────────────────────────────────────────────────┘
```

**No app linked:**
```
┌─────────────────────────────────────────────────────────────────┐
│  UI Configuration                                               │
├─────────────────────────────────────────────────────────────────┤
│  ⚠  No Rapid UI app set up for this program.                    │
│     Go to Manage Pages to create one first.  →                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 Generate New Page — Field Preview

```
┌─────────────────────────────────────────────────────────────────┐
│  Generate Page — PAN Input                                      │
├─────────────────────────────────────────────────────────────────┤
│  Action: PAN_VERIFY                                             │
│                                                                 │
│  Mandatory fields (locked — cannot be removed from page)        │
│  🔒 PAN Number       text     required                          │
│  🔒 Entity Type      select   required                          │
│                                                                 │
│  Additional fields (optional)                                   │
│  [ + Add field ]                                                │
│                                                                 │
│  Page layout: App template will be applied in Rapid UI          │
│                                                                 │
│            [ Cancel ]  [ → Generate in Rapid UI ]              │
└─────────────────────────────────────────────────────────────────┘
```

### 7.5 Page Details View

```
← Back to Manage Pages

┌──────────────────────────────────────────────────────┐
│  Page Details                      [Cancel]  [Save]  │
├────────────────────────┬─────────────────────────────┤
│  Page Name *           │  Page Type *                │
│  [_________________]   │  [APP_STATE_PAGE ▼]         │
│                        │                             │
│  Status *              │  Page Config *              │
│  [ACTIVE       ▼ ×]   │  { "customConfig": ... }    │
│                        │                             │
├────────────────────────┴─────────────────────────────┤
│  Created: 08/04/2026       Last updated: 24/04/2026  │
└──────────────────────────────────────────────────────┘
```

---

## 8. API Contract (Proposed)

> Proposed contracts for the Rapid UI platform team. Actual contracts to be confirmed.

### 8.1 Query App by Program Code (Approach 2)
```
GET /rapid-ui/api/apps?program_code={code}&tenant_id={tenant_id}
Authorization: Bearer <jb_service_token>

Response 200:
{
  "app_id": "app_xyz123",
  "app_name": "HDFC Personal Loan – HDFC_PL_001",
  "template_id": "tpl_pl_01" | null,
  "created_at": "2026-04-28T10:00:00Z"
}
```

### 8.2 Create App — Guided Redirect (Approach 1)
```
Redirect URL:
GET {rapid_ui_base}/create-app
  ?program_name=HDFC+Personal+Loan
  &program_code=HDFC_PL_001
  &tenant_id=hdfc_001
  &callback_url=https://jb.../api/rapid-ui/callback

Callback (Rapid UI → JB):
POST {callback_url}
{
  "app_id": "app_xyz123",
  "program_code": "HDFC_PL_001"
}
```

### 8.3 Create App — API (Approach 3)
```
POST /rapid-ui/api/apps
Authorization: Bearer <jb_service_token>

Request:
{
  "app_name": "HDFC Personal Loan – HDFC_PL_001",
  "program_code": "HDFC_PL_001",
  "tenant_id": "hdfc_001"
}

Response 201:
{
  "app_id": "app_xyz123",
  "app_name": "HDFC Personal Loan – HDFC_PL_001"
}
```

### 8.4 List Pages in App
```
GET /rapid-ui/api/apps/{app_id}/pages
Authorization: Bearer <jb_service_token>

Response 200:
{
  "pages": [
    { "id": "pg_001", "page_name": "panInputPage", "page_type": "APP_STATE_PAGE", "status": "ACTIVE" },
    { "id": "pg_002", "page_name": "aadhaarInputPage", "page_type": "APP_STATE_PAGE", "status": "DRAFT" }
  ]
}
```

### 8.5 Generate New Page — Redirect
```
Redirect URL:
GET {rapid_ui_base}/apps/{app_id}/create-page
  ?action_id=PAN_VERIFY
  &prefill_fields=[{"key":"pan_number","label":"PAN Number","type":"text","required":true,"locked":true},...]
  &callback_url=https://jb.../api/rapid-ui/page-callback

Callback (Rapid UI → JB):
POST {callback_url}
{
  "page_id": "pg_003",
  "page_name": "panInputPage",
  "app_id": "app_xyz123"
}
```

### 8.6 Silent Login
```
POST /rapid-ui/api/auth/silent-login
Authorization: Bearer <jb_service_token>

Request:
{
  "user_identity": "<jb_user_id_or_token>",
  "app_id": "app_xyz123",
  "page_id": "pg_001",
  "display_title": "HDFC Personal Loan"
}

Response 200:
{
  "redirect_url": "https://rapid-ui.../editor?session=<token>",
  "expires_at": "2026-04-28T11:00:00Z"
}
```

### 8.7 List Templates
```
GET /rapid-ui/api/templates?tenant_id={tenant_id}
Authorization: Bearer <jb_service_token>

Response 200:
{
  "templates": [
    { "id": "tpl_pl_01", "name": "Personal Loan Template", "page_count": 12 },
    { "id": "tpl_bl_01", "name": "Business Loan Template", "page_count": 8 }
  ]
}
```

---

## 9. Open Questions

> Questions marked ✅ are resolved. Questions marked ❓ are pending.

---

### Q1 — Publish Dependency After Template Copy ❓
**Question:** When pages are copied from a template into a new app in Rapid UI, is a manual "Publish" step required, or can copy + publish be done automatically?

**Why it matters:** If CST must manually publish in Rapid UI after every template copy, the seamless flow from JB is broken.

**Desired answer:** Template copy should be auto-published — no manual step required.

---

### Q2 — Silent Login / SSO Support ❓
**Question:** Does Rapid UI support silent authentication via SSO or token-based login?

**Options:**
- Option A: SSO — JB auth token accepted by Rapid UI.
- Option B: JB provisions Rapid UI accounts per user and manages sessions silently.

**Desired answer:** Token-based silent auth (Option A preferred).

---

### Q3 — Approach 1 Callback Mechanism ❓
**Question:** After CST creates the app in Rapid UI (Approach 1), how does JB receive the `app_id`?

**Options:**
- Option A: Rapid UI redirects back to a JB callback URL with `app_id` as a query param.
- Option B: JB polls Rapid UI for apps matching the `program_code` after redirect.

**Preferred answer:** Option A (explicit callback) — avoids polling and is more reliable.

---

### Q4 — Username / Identity Linking ❓
**Question:** How is a JB user identity mapped to a Rapid UI user for silent login?

**Why it matters:** For silent login to work, Rapid UI must recognize the user identity JB provides.

---

### Q5 — First-Time Login Credential ❓
**Question:** For CST members who have never logged into Rapid UI before, who provisions their Rapid UI account for silent login?

---

### Q6 — Tenant-Level Rapid UI Credentials ❓
**Question:** Do different tenants have separate Rapid UI instances or separate credential sets?

**Sub-questions:**
- Do all tenants share one Rapid UI deployment, or is it separate per tenant?
- Are template IDs globally unique, or scoped per tenant's Rapid UI instance?

**Recommendation:** Design for per-tenant credentials from the start (see Section 6.8) even if only one tenant exists today. Avoids a breaking change when a second lender is onboarded.

---

### Q7 — Approach 2: Rapid UI Query API ❓
**Question:** Does Rapid UI support querying apps by `program_code`? Is `program_code` a first-class field in Rapid UI app settings?

**Why it matters:** Approach 2 depends entirely on this API existing. If Rapid UI doesn't support querying by program_code, JB has no way to auto-discover the linked app.

---

### Q8 — Locked Fields in Rapid UI Editor ❓
**Question:** When JB passes `locked: true` in the prefill_fields during page generation, does Rapid UI enforce this in its page editor? Are locked fields truly undeletable, or only softly flagged?

**Preferred answer:** Hard lock — CST cannot delete mandatory fields in the Rapid UI editor.

---

### Q9 — Final Approach Selection ❓
**Question:** Which approach (1, 2, or 3) should be implemented?

**Current status:** Approach 3 is not recommended (see Section 4.3). Decision between Approach 1 and Approach 2 is pending.

---

## 10. Decisions Made

| # | Decision | Rationale |
|---|---|---|
| D1 | Manage Pages is the **second tab** in Program view | Aligns to production tab order |
| D2 | Two buttons on Manage Pages: **Upload Page Schema** (existing) and **Create App / Create Page** (new) | Upload flow still needed for technical users; new flow for CST guided setup |
| D3 | **Approach 3 is not recommended** | Blank app creation via API loses template configuration — page generation from Canvas is broken without an app-level template |
| D4 | **Template is app-level, not passed by JB during page generation** | JB passes `app_id`; Rapid UI resolves the template internally. Hierarchy: app template → tenant default |
| D5 | **Page generation redirects to Rapid UI** — not a JB-side generation | JB passes action_id and mandatory fields; Rapid UI creates the page using its own template and editor |
| D6 | **Mandatory fields per action are locked on generated pages** | CST cannot accidentally delete fields the action requires; enforced by Rapid UI via `locked: true` flag |
| D7 | **Action-to-mandatory-fields contract lives in `blockDefinitions.ts`** | Business logic fact about what an action requires — belongs in JB, not Rapid UI |
| D8 | **Display title is tenant-level config** | Different lenders show different titles; not hardcoded |
| D9 | **Design for per-tenant Rapid UI credentials from the start** | Avoids breaking change when second lender is onboarded; all Rapid UI calls proxied through JB backend |
| D10 | **Cross-tenant page copy is not allowed** | Tenant context is locked during app creation; copy source must be within same tenant |
| D11 | Page Details is a **separate route** (not a modal) | Matches production UI pattern; full-page editing of page config JSON |

---

## 11. Out of Scope

- Replacing or redesigning the Rapid UI page editor.
- Managing access control / permissions within Rapid UI from JB.
- Bulk operations (creating multiple apps at once).
- Versioning of Rapid UI pages within JB.
- Analytics or usage tracking of Rapid UI pages.
- Linked/synced page copies across programs (copies are always independent).
- The "Scheme" and "Document Templates" tabs (separate initiative).
