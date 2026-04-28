# PRD + FSD: RapidUI Integration with Journey Builder

**Version:** 1.0  
**Date:** 2026-04-28  
**Author:** Product Discussion (Sujeet Kumar)  
**Status:** Draft — Pending Open Questions

---

## Table of Contents

1. [Background & Context](#1-background--context)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Non-Goals](#3-goals--non-goals)
4. [User Stories](#4-user-stories)
5. [Feature Specifications](#5-feature-specifications)
   - 5.1 Manage Pages Tab
   - 5.2 Create Page (RapidUI App Creation)
   - 5.3 Silent Login
   - 5.4 Template ID — Dynamic Handling
   - 5.5 Display Title — Tenant Level
   - 5.6 Tenant-Level Rapid UI Credentials
6. [UI/UX Specifications](#6-uiux-specifications)
7. [API Contract (Proposed)](#7-api-contract-proposed)
8. [Open Questions](#8-open-questions)
9. [Decisions Made](#9-decisions-made)
10. [Out of Scope](#10-out-of-scope)

---

## 1. Background & Context

### Two Platforms

| Platform | Purpose |
|---|---|
| **Journey Builder (JB)** | Configure loan programs, build journeys/workflows, define blocks/steps a customer goes through |
| **Rapid UI Platform** | Create and manage UI pages (screens) that are rendered during a customer's loan application journey |

### How They Connect Today

- JB defines the **journey flow** (what happens and in what order).
- Rapid UI renders the **actual UI screens** that the customer sees at each step.
- CST (Customer Success Team) members use JB to configure programs and use Rapid UI to create/edit the pages for those programs.

### Current Pain Points

1. To create UI pages for a program, CST must **manually log into Rapid UI** on a separate tab first, then come back to JB.
2. When navigating from JB to Rapid UI for creating/editing pages, the **template ID is hardcoded**, meaning all programs use the same default template regardless of the lender/tenant.
3. There is **no link between a JB program and a Rapid UI app** — CST must manually manage this association.
4. The display title/message shown on Rapid UI pages is **hardcoded**, not configurable per tenant.
5. Currently there is **no "Manage Pages" section** in JB that shows the pages associated with a program (this has been built as part of this initiative).

---

## 2. Problem Statement

When a CST member sets up a new lending program in Journey Builder, they need to also set up the corresponding UI pages in the Rapid UI platform. This currently requires:

- Switching to a different browser tab and manually logging into Rapid UI.
- Manually creating an app in Rapid UI with no reference back to the JB program.
- Copying templates manually with no automated linking.
- Clicking a "Publish" button in Rapid UI after copying template pages.

This creates friction, increases setup time, and risks configuration mismatches between what the journey expects and what pages actually exist in Rapid UI.

---

## 3. Goals & Non-Goals

### Goals

- [x] **G1:** Add a "Manage Pages" tab inside a JB Program so CST can see all pages associated with a program in one place.
- [ ] **G2:** Allow CST to create a Rapid UI app directly from JB (from the "Create Page" dialog), without switching to a separate Rapid UI tab.
- [ ] **G3:** Allow CST to optionally select a page template during app creation; all pages from the selected template should be auto-copied into the new app.
- [ ] **G4:** Eliminate the requirement for CST to manually log into Rapid UI separately — implement silent/SSO authentication.
- [ ] **G5:** Make the template ID dynamic per tenant/program rather than hardcoded.
- [ ] **G6:** Make the display title shown on Rapid UI pages configurable at the tenant level.

### Non-Goals

- Replacing the Rapid UI platform or its page editor.
- Rebuilding the page schema upload flow (that remains as-is under "Upload Page Schema").
- Managing Rapid UI app permissions or user roles from JB.
- Supporting bulk app creation across multiple programs.

---

## 4. User Stories

### US-01: Manage Pages Tab
> As a CST member, I want to see all UI pages linked to a program in one place within JB, so I don't have to switch to Rapid UI just to view the page list.

**Acceptance Criteria:**
- A "Manage Pages" tab is visible inside every program in JB.
- The tab shows a list with columns: Name, Page Type, Status, Actions.
- I can filter by Name and Status (ACTIVE / INACTIVE / DRAFT).
- Clicking the view (eye) icon opens the Page Details screen where I can view and edit the page metadata.

---

### US-02: Create App in Rapid UI from JB
> As a CST member, when I click "Create Page" in JB, I want a Rapid UI app to be created automatically, so I don't have to switch tabs and do it manually.

**Acceptance Criteria:**
- Clicking "Create Page" opens a dialog with:
  - **App Name** (required text field)
  - **Template** (optional dropdown, populated from available Rapid UI templates)
- On submit:
  - If only App Name is given → a blank app is created in Rapid UI.
  - If App Name + Template are given → an app is created AND all pages from the selected template are copied into it.
- After creation, the page list in "Manage Pages" reflects the new app/pages.

---

### US-03: Optional Template Selection
> As a CST member, when creating pages for a PL (Personal Loan) program, I want to select an existing PL template so that I don't have to build pages from scratch.

**Acceptance Criteria:**
- The template dropdown in "Create Page" is populated from Rapid UI's available templates.
- Template selection is optional — the user can create a blank app without selecting any template.
- If a template is selected, all pages present in that template are exported/copied into the new app.
- Page list in JB shows these copied pages immediately after creation.

---

### US-04: Silent Login
> As a CST member, when I click "Edit Page" (to open Rapid UI's page editor), I want to land directly in the Rapid UI editor without having to log in on a separate tab first.

**Acceptance Criteria:**
- Clicking "Edit" on any page opens the Rapid UI editor directly within JB context (new tab or embedded, TBD).
- The user is authenticated silently — no separate Rapid UI login required.
- This works on first use as well as subsequent uses within the same session.

---

### US-05: Dynamic Template ID
> As a system, when performing silent login to Rapid UI for page editing, the correct template context should be passed dynamically based on what template was used during app creation.

**Acceptance Criteria:**
- If the program's app was created with a template, that template ID is stored and passed in the silent login context.
- If the app was created blank (no template), a defined fallback behavior is used (see Open Questions).

---

### US-06: Tenant-Level Display Title
> As a product manager, I want the message/title shown on Rapid UI pages to be configurable per tenant (e.g., HDFC sees "HDFC Home Loans", Axis sees "Axis Bank"), rather than showing a hardcoded default.

**Acceptance Criteria:**
- A tenant-level configuration exists for the display title/message.
- The title passed during silent login is read from this tenant config.
- Changing the tenant config updates the title on all new Rapid UI sessions for that tenant.

---

## 5. Feature Specifications

---

### 5.1 Manage Pages Tab

**Status:** ✅ Built

**Location:** Program View → "Manage Pages" tab (second tab, after Program Details)

**Tab Order (aligned to production):**
1. Program Details
2. **Manage Pages**
3. Scheme
4. Manage Custom Fields
5. Document Templates
6. Login Checklist
7. Manage Workflow

**Page List Table:**

| Column | Description |
|---|---|
| Name | Page name as stored in Rapid UI |
| Page Type | Currently always `APP_STATE_PAGE` |
| Status | `ACTIVE` / `INACTIVE` / `DRAFT` |
| Actions | Eye (view) icon → navigates to Page Details |

**Filters:**
- Name (text search, partial match)
- Status (dropdown: ACTIVE / INACTIVE / DRAFT)
- Apply Filters / Clear Filters buttons
- Show Filters / Hide Filters toggle

**Buttons:**
- **Upload Page Schema** — existing flow (Upload appConfig + Upload pageSchema JSON files)
- **+ Create Page** — new RapidUI integration flow (see 5.2)

---

### 5.2 Create Page (RapidUI App Creation)

**Status:** 🔲 Placeholder built — backend integration pending

**Trigger:** Click "+ Create Page" button on Manage Pages tab.

**Dialog: "Create Page"**

| Field | Type | Required | Notes |
|---|---|---|---|
| App Name | Text input | Yes | Name of the app to create in Rapid UI |
| Template | Dropdown | No | Populated from Rapid UI's available templates API |

**Behavior on Submit:**

```
IF template selected:
  1. Call Rapid UI API → Create App (pass app_name)
  2. Call Rapid UI API → Copy template pages into new app (pass template_id)
  3. [QUESTION] → Does copy require a Publish step? (See Open Questions Q1)
  4. Fetch new page list → display in Manage Pages table

IF no template selected:
  1. Call Rapid UI API → Create App (pass app_name)
  2. Page list shows empty (blank app)
```

**Template Dropdown Population:**
- Fetched from Rapid UI via API on dialog open.
- Examples from notes: Personal Loan Template, Business Loan Template, HDFC Template, Axis Template.
- Each tenant may have different available templates.

**Storage:**
- After successful creation, store in JB:
  - `rapid_ui_app_id` — the ID of the created Rapid UI app (linked to this program)
  - `rapid_ui_template_id` — the template ID used (if any), for use in silent login (see 5.3 and 5.4)

---

### 5.3 Silent Login

**Status:** 🔲 Not implemented — pending confirmation from Rapid UI team

**Current Flow (painful):**
```
CST member opens Rapid UI in a new tab
  → Logs in with Rapid UI credentials manually
  → Comes back to JB
  → Now can create/edit pages
```

**Proposed Flow (seamless):**
```
CST member clicks "Edit" on a page in JB
  → JB silently authenticates to Rapid UI on behalf of the user
  → Rapid UI editor opens directly (new tab or embedded)
  → No separate login required
```

**Two Implementation Options (for Rapid UI team to decide):**

| Option | Description | Requirement from Rapid UI |
|---|---|---|
| **A — SSO** | JB passes its auth token; Rapid UI trusts JB as identity provider | Rapid UI must support SSO or token federation |
| **B — System-provisioned credentials** | JB auto-provisions a Rapid UI account per CST user (or per tenant) and manages credentials silently | Rapid UI must support programmatic user creation + token-based login |

**Silent Login Payload (proposed):**
```json
{
  "user_identity": "<jb_user_token_or_id>",
  "app_id": "<rapid_ui_app_id>",
  "template_id": "<rapid_ui_template_id_or_null>",
  "display_title": "<tenant_level_title>",
  "redirect_to": "editor"
}
```

> ⚠️ See Open Questions Q2, Q3, Q4, Q5

---

### 5.4 Template ID — Dynamic Handling

**Status:** 🔲 Not implemented — dependent on 5.2 and 5.3

**Current State:** Template ID is hardcoded in the silent login call.

**Proposed State:**

```
CASE 1: App created with template
  → Store template_id at program level in JB
  → Pass stored template_id in silent login context

CASE 2: App created without template (blank app)
  → template_id is null / empty
  → ❓ What does Rapid UI expect? (See Open Questions Q3)

CASE 3: App created via "Upload Page Schema" (old flow)
  → No template_id exists
  → Same as Case 2
```

**Storage Model (proposed addition to JB program):**
```
Program
  └── rapid_ui_config
        ├── app_id: string
        ├── template_id: string | null
        └── created_at: datetime
```

---

### 5.5 Display Title — Tenant Level

**Status:** 🔲 Not implemented

**Current State:** Display title shown on Rapid UI pages is hardcoded.

**Proposed State:**
- Add a `display_title` field to the tenant/lender configuration in JB.
- This value is passed in the silent login payload when opening Rapid UI.
- Each tenant can have a different title (e.g., "HDFC Personal Loan", "Axis Bank Loans").

**Configuration Location (proposed):** Tenant settings / Program-level config (TBD — depends on whether title is per-tenant or per-program).

---

### 5.6 Tenant-Level Rapid UI Credentials

**Status:** 🔲 Not implemented — needs decision (see Open Question Q6)

#### The Problem

Different tenants (lenders) may have **separate Rapid UI instances or separate credential sets**. For example:
- HDFC might have its own Rapid UI deployment with its own base URL and service credentials.
- Axis Bank might have a completely different Rapid UI instance.

If JB uses a **single hardcoded Rapid UI credential** for all API calls (create app, copy template, silent login), it will break the moment a second tenant with different Rapid UI credentials is onboarded.

#### Do We Need This?

Yes — if any of the following is true:
- Different tenants have different Rapid UI base URLs.
- Different tenants have different service API keys / client credentials.
- Different tenants have different Rapid UI user account systems (separate SSO realms).
- Template IDs are scoped per tenant's Rapid UI instance (e.g., `tpl_pl_01` in HDFC's instance is different from `tpl_pl_01` in Axis's instance).

Even if today all tenants share one Rapid UI instance, **designing for per-tenant credentials now avoids a breaking change later**.

#### Proposed Solution: Tenant-Level Rapid UI Config in JB

Store a `rapid_ui_config` block at the **tenant/lender level** in JB. Every API call JB makes to Rapid UI uses the credentials and base URL from the calling tenant's config.

**Proposed Tenant Rapid UI Config Model:**

```json
{
  "tenant_id": "hdfc_001",
  "tenant_name": "HDFC Bank",
  "rapid_ui": {
    "base_url": "https://hdfc.rapid-ui.perfios.com",
    "client_id": "hdfc_jb_client",
    "client_secret": "<encrypted>",
    "auth_type": "CLIENT_CREDENTIALS",
    "default_template_id": "tpl_hdfc_pl_01",
    "display_title": "HDFC Personal Loan"
  }
}
```

**Fields Explained:**

| Field | Purpose |
|---|---|
| `base_url` | Rapid UI API base for this tenant — different per tenant if separate deployments |
| `client_id` | Service account client ID used by JB to call Rapid UI on behalf of this tenant |
| `client_secret` | Encrypted secret — never exposed to frontend, only used server-side by JB backend |
| `auth_type` | How JB authenticates to Rapid UI (`CLIENT_CREDENTIALS` / `API_KEY` / `SSO_TOKEN`) |
| `default_template_id` | Fallback template ID when no template is selected during app creation |
| `display_title` | Tenant-level title shown on Rapid UI pages (resolves point 5.5 too) |

#### How It Fits Into the Full Flow

```
CST clicks "Create Page" for a program
  → JB reads the program's tenant_id
  → JB fetches tenant's rapid_ui config (base_url + credentials)
  → JB calls Rapid UI API using THAT tenant's credentials:
       POST {base_url}/api/apps
       Authorization: Bearer <token obtained via client_id + client_secret>
  → App created in the correct tenant's Rapid UI instance

CST clicks "Edit Page"
  → JB reads tenant's rapid_ui config
  → JB calls {base_url}/api/auth/silent-login
       with tenant's credentials + user identity + display_title
  → Redirect URL returned → opens correct tenant's Rapid UI editor
```

#### Security Considerations

- `client_secret` must be **stored encrypted** in JB's backend (e.g., via a secrets manager — not in the database as plain text).
- The frontend (React app) must **never receive or store** these credentials.
- All Rapid UI API calls must be **proxied through JB's backend** — the frontend only tells the backend "create an app for this program" and the backend handles the credential lookup and API call.
- Token caching: JB backend can cache the Rapid UI service token (respecting `expires_in`) to avoid fetching a new token on every request.

#### What Needs to Be Built in JB

1. **Tenant Rapid UI Config UI** — An admin screen (likely in Organization/Tenant settings) where the Rapid UI credentials for each tenant can be configured.
2. **Secrets Storage** — Encrypted credential storage in JB backend.
3. **Rapid UI Proxy API in JB Backend** — A backend route that:
   - Receives requests from the JB frontend (create app, list templates, silent login).
   - Looks up the tenant's Rapid UI credentials.
   - Calls Rapid UI with those credentials.
   - Returns the result to the frontend.

```
JB Frontend → JB Backend (proxy) → Rapid UI (tenant instance)
                    ↑
             Reads encrypted
             tenant credentials
```

> ⚠️ See Open Question Q6

---

## 6. UI/UX Specifications

### 6.1 Manage Pages Tab — List View

```
┌─────────────────────────────────────────────────────────────────────┐
│  Manage Pages                    [Show Filters] [Upload Page Schema] │
│                                                      [+ Create Page] │
├─────────────────────────────────────────────────────────────────────┤
│  [Filters section — collapsible]                                     │
│  Name: [____________]   Status: [ACTIVE ▼ ×]                        │
│  [Apply Filters]  [Clear Filters]                                    │
├──────────────────────┬──────────────────┬──────────┬────────────────┤
│  Name                │  Page Type       │  Status  │  Actions       │
├──────────────────────┼──────────────────┼──────────┼────────────────┤
│  basicdetailsv4      │  APP_STATE_PAGE  │  ACTIVE  │  👁            │
│  AIBasicLoanPage     │  APP_STATE_PAGE  │  ACTIVE  │  👁            │
│  aadhaarInputPage    │  APP_STATE_PAGE  │  DRAFT   │  👁            │
└──────────────────────┴──────────────────┴──────────┴────────────────┘
  Showing 12 of 12 items
```

### 6.2 Create Page Dialog

```
┌─────────────────────────────┐
│  Create Page                │
├─────────────────────────────┤
│  App Name *                 │
│  [_______________________]  │
│                             │
│  Template (optional)        │
│  [Select a template ▼    ]  │
│    Personal Loan Template   │
│    Business Loan Template   │
│    HDFC Template            │
│    Axis Template            │
│                             │
│        [Cancel]  [Create]   │
└─────────────────────────────┘
```

### 6.3 Upload Page Schema Dialog

```
┌─────────────────────────────────┐
│  Upload Page Schema Files       │
├─────────────────────────────────┤
│  ☁  Upload appConfig            │
│                                 │
│  ☁  Upload pageSchema           │
│                                 │
│           [Cancel]  [Save]      │
└─────────────────────────────────┘
```

### 6.4 Page Details View

```
← Back to Manage Page

┌────────────────────────────────────────┐
│  Page Details              [Cancel] [Save] │
├──────────────────────┬─────────────────┤
│  Page Name *         │  Page Type *    │
│  [_________________] │  [APP_STATE ▼]  │
│                      │                 │
│  Status *            │  Page Config *  │
│  [ACTIVE      ▼ ×]  │  {              │
│                      │    "customCo... │
│                      │  }              │
├──────────────────────┴─────────────────┤
│  Created: 08/04/2026  Last updated: 24/04/2026 │
└────────────────────────────────────────┘
```

---

## 7. API Contract (Proposed)

> These are proposed contracts for the Rapid UI platform team. Actual contracts to be confirmed.

### 7.1 List Templates
```
GET /rapid-ui/api/templates
Authorization: Bearer <jb_service_token>

Response 200:
{
  "templates": [
    { "id": "tpl_pl_01", "name": "Personal Loan Template", "page_count": 12 },
    { "id": "tpl_bl_01", "name": "Business Loan Template", "page_count": 8 }
  ]
}
```

### 7.2 Create App
```
POST /rapid-ui/api/apps
Authorization: Bearer <jb_service_token>

Request:
{
  "app_name": "HDFC PL Program 2026",
  "tenant_id": "hdfc_001"
}

Response 201:
{
  "app_id": "app_xyz123",
  "app_name": "HDFC PL Program 2026",
  "created_at": "2026-04-28T10:00:00Z"
}
```

### 7.3 Copy Template into App
```
POST /rapid-ui/api/apps/{app_id}/copy-template
Authorization: Bearer <jb_service_token>

Request:
{
  "template_id": "tpl_pl_01"
}

Response 200:
{
  "pages_copied": 12,
  "status": "READY"  // or "PENDING_PUBLISH" — see Open Question Q1
}
```

### 7.4 Silent Login / Generate Session Token
```
POST /rapid-ui/api/auth/silent-login
Authorization: Bearer <jb_service_token>

Request:
{
  "user_identity": "<jb_user_id_or_token>",
  "app_id": "app_xyz123",
  "template_id": "tpl_pl_01",   // null if blank app
  "display_title": "HDFC Personal Loan"
}

Response 200:
{
  "redirect_url": "https://rapid-ui.perfios.com/editor?session=<token>",
  "expires_at": "2026-04-28T11:00:00Z"
}
```

### 7.5 List Pages in App
```
GET /rapid-ui/api/apps/{app_id}/pages
Authorization: Bearer <jb_service_token>

Response 200:
{
  "pages": [
    { "id": "pg_001", "page_name": "basicDetailsPage", "page_type": "APP_STATE_PAGE", "status": "ACTIVE" }
  ]
}
```

---

## 8. Open Questions

> These must be answered by the **Rapid UI platform team** before implementation can proceed.

---

### Q1 — Publish Dependency After Template Copy
**Question:** When pages are copied from a template into a new app via API, is a manual "Publish" step required? Can the copy + publish be done silently in a single API call?

**Why it matters:** If CST must manually click "Publish" in Rapid UI after every template copy, the seamless "Create Page" flow from JB is broken.

**Desired answer:** Template copy should be auto-published via API, requiring no manual step.

**Raised by:** Notes from discussion — "can we remove this dependency (Publish button)?"

---

### Q2 — Silent Login / SSO Support
**Question:** Does the Rapid UI platform support silent authentication via SSO or token-based login? Can JB pass a user identity token that Rapid UI accepts without requiring a separate login?

**Why it matters:** Currently, every CST member must log into Rapid UI on a separate browser tab before JB can open the editor. This is the primary friction point.

**Options to evaluate:**
- Option A: Rapid UI supports SSO — JB's auth token is accepted as identity proof.
- Option B: JB provisions a Rapid UI account per user silently and manages session tokens.

**Desired answer:** Rapid UI supports token-based silent auth (Option A preferred).

---

### Q3 — Silent Login with Blank App (No Template)
**Question:** When a program's app was created without any template (blank app), what should be passed as `template_id` in the silent login context? Can Rapid UI open correctly without a template ID?

**Why it matters:** Template ID is currently always passed (hardcoded). If we make it dynamic, there will be programs with no template ID. We need to know if Rapid UI can handle `null`/empty template ID gracefully.

**Options:**
- Pass `null` — Rapid UI opens without template context.
- Pass a default system-level template ID.
- Block "Edit Page" for blank apps until a template is assigned.

---

### Q4 — Username / Identity Linking
**Question:** How should a JB user identity be mapped to a Rapid UI user? Can the same username/email be used across both platforms?

**Why it matters:** For silent login to work, there must be a user identity that Rapid UI recognizes. If Rapid UI has separate user accounts, we need a mapping strategy.

**From notes:** "Can username be linked to Rapid UI?"

---

### Q5 — First-Time Login Credential
**Question:** For CST members who have never logged into Rapid UI before, what credential should be used for the first silent login? Who provisions their Rapid UI account?

**Why it matters:** Silent login assumes the user already has (or can be auto-assigned) a Rapid UI account. If not, the first session will fail.

**From notes:** "First time login — with which username?"

---

### Q6 — Tenant-Level Rapid UI Credentials
**Question:** Do different tenants (lenders) have separate Rapid UI instances or separate sets of credentials? Is a single shared service credential sufficient, or must JB store and use per-tenant Rapid UI credentials?

**Why it matters:** If each tenant has a separate Rapid UI instance with its own base URL and API credentials, all Rapid UI API calls from JB must be routed using the correct tenant's credentials. A single hardcoded credential would fail for all but one tenant.

**Sub-questions:**
- Do all tenants share one Rapid UI deployment, or is it deployed separately per tenant?
- Are template IDs globally unique, or are they scoped per tenant's Rapid UI instance?
- Is the Rapid UI user authentication (silent login) per-tenant or shared?

**Proposed answer / recommendation:** Assume per-tenant credentials are needed (even if today there's only one tenant). Build the `rapid_ui_config` at the tenant level from the start (see section 5.6). This avoids a breaking architectural change when a second tenant is onboarded.

**Action required:** Rapid UI platform team + JB backend team to confirm the deployment model.

---

## 9. Decisions Made

| # | Decision | Rationale |
|---|---|---|
| D1 | "Create Page" trigger is the **"+ Create Page" button** inside the Manage Pages tab | Just-in-time creation — only create a Rapid UI app when the user explicitly needs it. Avoids wasted app creation for programs that never use Rapid UI pages. |
| D2 | **Template selection is optional** | Not all programs need a template. Some start from blank. |
| D3 | Two separate buttons on Manage Pages: **"Upload Page Schema"** (existing file-upload flow, renamed) and **"+ Create Page"** (new RapidUI integration flow) | The upload flow is still needed for technical users. The new flow is for CST guided setup. |
| D4 | The "Manage Pages" tab is added as the **second tab** in the Program view, matching production tab order | Align to production; Manage Pages is a primary concern when setting up a program. |
| D5 | **Tab order aligned to production:** Program Details → Manage Pages → Scheme → Manage Custom Fields → Document Templates → Login Checklist → Manage Workflow | "Manage Native Fields" and "Ops Dashboard" removed from Program tabs (as in production). |
| D6 | **Display title is tenant-level config** | Different lenders show different titles. Should not be hardcoded. |
| D7 | When pages are created via template, **store the template_id** against the program in JB for use in silent login | Ensures correct context is passed to Rapid UI editor for subsequent edits. |
| D8 | Page Details screen is a **separate route** (not a modal), navigating back to Manage Pages tab via `?tab=manage-pages` | Matches production UI pattern; allows full-page editing of page config JSON. |
| D9 | **Design for per-tenant Rapid UI credentials from the start**, even if only one tenant exists today | Avoids a breaking architectural change when a second lender is onboarded. Single shared credential is a short-term trap. All Rapid UI API calls must go through JB backend (proxy), never directly from frontend. |

---

## 10. Out of Scope

- Replacing or redesigning the Rapid UI page editor itself.
- Managing access control / permissions within Rapid UI from JB.
- Bulk operations (creating multiple apps at once).
- Versioning of Rapid UI pages within JB.
- Analytics or usage tracking of Rapid UI pages.
- The "Scheme" and "Document Templates" tabs (placeholder — separate initiative).

---

*Document status: Draft. All open questions (Q1–Q5) must be resolved with the Rapid UI platform team before development of sections G2–G6 can begin.*
