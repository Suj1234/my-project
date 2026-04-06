# Antigravity Journey Builder — Full Project Context

> **For AI Agents:** Read this file in full before starting any task on this project.
> Each section is numbered and named. You can ask the human: "Should I read section X?" to scope your context.
> Do NOT guess or infer — if the answer is not here, read the actual source file listed in Section 11 (File Map).

---

## 0. Project Identity

| Property | Value |
|---|---|
| Product name | Antigravity Journey Builder |
| Type | Visual no-code/low-code journey builder for financial product onboarding |
| Target users | CST (Customer Success Team) — non-technical business users who configure loan/credit card onboarding flows |
| Working directory | `c:\Users\sujeet.kumar\OneDrive - Perfios SW Solns P L\Desktop\Antigravity\my-project` |
| Dev server | `npm run dev` → usually http://localhost:5175 |
| Build | `npm run build` → outputs to `dist/` |
| Stack | React 18, TypeScript, Vite, Tailwind CSS, Radix UI, React Flow (@xyflow/react), Lucide icons |

---

## 1. High-Level Architecture

### 1.1 Three-Panel Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  LEFT: Block Library       CENTER: Journey Canvas    RIGHT: Config   │
│  (280px, fixed)            (flex-1, React Flow)      Panel (420px)   │
│  - Smart Blocks            - Nodes = Blocks          - Accordion     │
│  - Form Block              - Edges = Connections     - Sections vary │
│  - Logic (Router, Merge)   - Drag-to-add             - by block type │
│  - End Block               - Click node to config                    │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.2 State Management

- No Redux/Zustand. All state lives in `App.tsx` via `useState`.
- `nodes: Node[]` and `edges: Edge[]` are the React Flow state.
- Each node carries `data: FlowNodeData` (extends `BlockData`).
- When a block is configured, `onSave(updatedBlock)` updates the node's data in-place.
- Configuration Panel receives `block: BlockData | null` (the selected block's data).

### 1.3 Node → Block Relationship

Every canvas block is a React Flow node. The `type` field of the node maps to a node component:

| Node type string | Component | Block type |
|---|---|---|
| `start` | `StartNode` | Start Block |
| `smart` | `SmartBlockNode` | Smart Block |
| `form` | `FormBlockNode` | Form Block |
| `router` | `RouterNode` | Conditional Router |
| `merge` | `MergeNode` | Merge Block |
| `end` | `EndNode` | End Block |
| `decision` | `DecisionNode` | Decision Block (canvas only, config is via Data Hooks) |

---

## 2. Block Library (Left Sidebar)

**File:** `src/app/components/BlockLibrary.tsx`

The left panel has a search bar at the top and four collapsible sections:

### 2.1 Smart Blocks (Blue, `border-l-4 border-blue-500`)
Grouped into four categories: **identity**, **financial**, **documents**, **profile**.

| Block ID | Block Name | Category | Provider |
|---|---|---|---|
| `pan_verification` | PAN Verification | identity | PAN Profile Detailed API |
| `aadhaar_verification` | Aadhaar Verification | identity | DigiLocker |
| `liveness_selfie` | Liveness & Selfie Check | identity | Liveness SDK |
| `bank_statement` | Bank Statement Analysis | financial | Perfios BSA |
| `offer_generation` | Offer Generation | financial | BRE Engine |
| `bank_account_selection` | Bank Account Selection | financial | Penny Drop / UPI |
| `kfs_document` | KFS Document | documents | — |
| `sanction_letter` | Sanction Letter | documents | — |
| `esign` | eSign | documents | Aadhaar eSign |
| `profile_address` | Profile & Address | profile | — |

Each smart block is defined in `src/app/data/blockDefinitions.ts` as a `SmartBlockDefinition` object.

### 2.2 Form Block (Green, `border-l-4 border-green-500`)
Single entry: **Custom Form Block** — creates a blank form where you add fields manually.

### 2.3 Logic (Orange/Indigo)
- **Conditional Router** (orange) — branches journey based on field conditions
- **Merge Block** (indigo) — joins multiple paths back to one

### 2.4 End Blocks (Red)
- **End Block** — terminates the journey with a type: `success`, `rejection`, or `manual_review`

---

## 3. Journey Canvas

**File:** `src/app/components/JourneyCanvas.tsx`

- Built on React Flow (`@xyflow/react`)
- All block nodes are registered in `nodeTypes` map
- Edges connect blocks; clicking a node opens Configuration Panel
- Nodes show a `+` add button for connecting to a new block
- `onConnect` handles edge creation; `onNodeClick` triggers `onConfigure`
- Router blocks generate multiple output handles (one per routing condition + default)
- Merge blocks show N input handles and 1 output handle

---

## 4. Smart Block — Full Detail

**Canvas node:** `src/app/components/nodes/SmartBlockNode.tsx`
**Type string on canvas:** `"smart"`

Smart blocks are pre-built blocks for standard KYC/financial steps. They are NOT blank — each has:
- Pre-defined pages (UI screens shown to the applicant)
- Pre-configured checks (AML, age verification, pincode check, etc.)
- Optional retry configuration

### 4.1 SmartBlockNode (Canvas Display)

Shows:
- Block name (e.g., "PAN Verification")
- Short description (e.g., "Identity verification")
- Blue badge: `SMART`
- Blue left border
- Provider name if present (e.g., "PAN Profile Detailed API")
- Purple hook pills at the bottom if any Data Hooks are configured

### 4.2 Configuration Panel — Smart Block Sections

The Configuration Panel (right sidebar) shows accordion sections depending on the smart block:

#### Section: Block Info
- Always visible for smart blocks
- Shows: Block name (read-only), description (read-only), provider badge
- Name/description are not editable for smart blocks (only form/end/merge blocks allow editing)

#### Section: General Configuration (if `generalConfig` exists)
- Renders a list of configurable key-value settings
- Field types: `select`, `number`, `text`, `date`
- Example: PAN Verification has no general config; Aadhaar Verification might have consent settings

#### Section: UI Configuration (Pages)
- Available when `block.pages` is non-empty
- Shows each page as a `PageConfigCard`
- Each page card shows the page name, action label, and list of user inputs
- Pages are pre-defined per smart block — CST can view/assign but not add new pages
- User inputs within a page are `FormInputField` objects

**PageConfigCard** (`src/app/components/PageConfigCard.tsx`):
- Shows page name, action label
- Lists `userInputs` (each with field key, label, type, required flag)
- Configuration method badge: `assigned` or `ai_generated`

#### Section: Checks (if `hasChecks` and `block.checks` non-empty)
- Toggle to enable/disable each check
- Each check has:
  - Enable/disable toggle
  - `outputResponse`: what to do if check fails — `pass` (continue) or `reject` (end journey)
  - Sub-fields specific to the check (dropdowns, text inputs, numbers)
- Example checks for PAN Verification:
  - AML Check (toggle, outputResponse)
  - CFR Check (toggle, CFR master code select, column field name)
  - Age Verification (toggle, min age, max age, outputResponse)
  - Serviceable Pincode Check (toggle, block type, outputResponse)

#### Section: Retry Configuration (if `hasRetry`)
- Controls retry behavior when the block fails
- `RetryConfigItem[]` — each item is a named retry scenario with:
  - `maxAttempts` (number)
  - `coolingPeriod` (number, in seconds)
  - `velocityCycle` (number)

#### Section: Data Hooks (always present for smart blocks)
- See **Section 7** for full Data Hooks documentation

---

## 5. Form Block — Full Detail

**Canvas node:** `src/app/components/nodes/FormBlockNode.tsx`
**Type string on canvas:** `"form"`

Form blocks are blank, fully customizable input collection forms. The CST builds the form from scratch using the Add Input Dialog.

### 5.1 FormBlockNode (Canvas Display)
- Shows block name, description
- Green badge: `FORM`
- Green left border
- Lists up to 3 form fields (by name) with a `+N more` if there are more
- Purple hook pills at bottom if Data Hooks configured

### 5.2 Configuration Panel — Form Block Sections

#### Section: Block Info
- **Name**: Editable text input — the form's title shown to the applicant
- **Description**: Editable textarea — optional subtitle

#### Section: Form Fields (User Inputs)
- The core section for building the form
- Lists all configured `FormInputField` items
- Each field card shows:
  - Field label/name
  - Field type badge (`text`, `number`, `email`, `tel`, `date`, `select`)
  - Required indicator
  - Backend key (e.g., `pan_number`) — non-editable identifier
  - `fieldSource`: `native` (standard Antigravity field) or `custom` (CST-defined)
  - Delete button (×)
- **Add Input Dialog** (`src/app/components/AddInputDialog.tsx`):
  - Opens when CST clicks "Add Input Field"
  - Label-first flow: CST types a label → system suggests backend key
  - Can select from native fields (pre-defined: PAN, Aadhaar, mobile, etc.)
  - Or create a custom field
  - Field type selector: text, number, email, tel, date, select
  - Rich validation rules (`ValidationRule[]`):
    - `regex` — pattern validation with error message
    - `min_length` / `max_length` — character count limits
    - `min_date` / `max_date` — date range validation
    - `boolean_match` — true/false check
    - `api` — external API validation
    - `is_in_list` — value must be in allowed list
    - `not_allowed` — value must not be in blocked list

#### Section: Data Hooks (always present for form blocks)
- See **Section 7** for full Data Hooks documentation

---

## 6. Router Block (Conditional Router) — Full Detail

**Canvas node:** `src/app/components/nodes/RouterNode.tsx`
**Type string on canvas:** `"router"`

Routes the journey to different paths based on field value conditions. First matching condition wins.

### 6.1 RouterNode (Canvas Display)
- Shows block name
- Orange badge: `LOGIC`
- Orange left border
- Lists configured routing rules as short summaries
- Shows a default route indicator

### 6.2 Configuration Panel — Router Block Sections

#### Section: Block Info
- Name is read-only for router blocks

#### Section: Routing Rules
- List of `RoutingConfig` objects, each is a branch
- Each branch card contains:
  - **Conditions**: One or more `Condition` objects
    - `parameter`: the field name (native or custom, e.g., `pan_number`, `cibil_score`)
    - `operator`: `=` | `!=` | `>` | `<` | `>=` | `<=` | `contains` | `not contains` | `is empty` | `is not empty`
    - `value`: the comparison value (string)
  - **Condition operator**: `AND` or `OR` (applies between all conditions in the branch)
  - **Target block**: dropdown to select which block to route to if this branch matches
  - Save button — marks the routing as saved (turns the card green)
- **Default Route**: fallback block if no routing condition matches
- Routings are ordered top-to-bottom; first match wins (waterfall)
- A saved routing creates an edge on the canvas from this router to the target block
- Merging: when a routing is saved and the target block connects downstream to a merge block, the merge block automatically registers the incoming connection

---

## 7. Data Hooks — Full Detail

**Files:**
- `src/app/components/DataHooksSection.tsx` — the accordion section in Configuration Panel
- `src/app/components/AddHookDialog.tsx` — the 3-step wizard modal
- `src/app/components/ResponseTree.tsx` — visual JSON tree for output capture
- `src/app/data/apiCatalog.ts` — mock API catalog
- `src/app/data/hookEventTemplates.ts` — generates default event slots per block
- Types in `src/app/types/journey.ts` under `// ─── Data Hooks ───`

### 7.1 Concept

Data Hooks allow Smart and Form blocks to call external APIs at specific lifecycle events within that block. For example: after the user submits a PAN form, automatically call the CIBIL API, capture the credit score, and store it as a custom field for use in routing decisions downstream.

### 7.2 Event Slots

Each block has a fixed set of **event slots** — predefined lifecycle points where APIs can be triggered. These are generated by `getDefaultHookEventSlots(block)` in `hookEventTemplates.ts`:

**Smart Blocks with pages** (most smart blocks):
- For each page in the block, two slots are generated:
  - `before_<page_key>` — e.g., "Before PAN Input"
  - `after_<page_key>` — e.g., "After PAN Input"

**PAN Verification specifically:**
- `before_pan_input` — "Before PAN Input"
- `after_pan_input` — "After PAN Input"

**Form Blocks:**
- `before_form_submit` — "Before Form Submit"
- `after_form_submit` — "After Form Submit"

**Data structure: `HookEventSlot`**
```typescript
interface HookEventSlot {
  id: string;           // same as eventKey
  eventKey: string;     // e.g. "after_pan_input"
  eventLabel: string;   // e.g. "After PAN Input"
  apis: DataHookApiBinding[];    // APIs configured for this event
  decisionConfig?: DecisionBlockConfig;  // Rules for this event's outputs
}
```

### 7.3 API Catalog

Mock catalog in `src/app/data/apiCatalog.ts`. Each API has:
- `id`, `name`, `description`, `icon`, `category`
- `requestFields: ApiRequestField[]` — the API's input parameters
- `sampleResponse: Record<string, any>` — actual sample JSON for output tree

**Current mock APIs:**

#### CIBIL Bureau Report (`cibil_bureau`)
Category: Credit Bureau
Input fields (15 total):
- `applicant.name.firstName` → native: first_name
- `applicant.name.lastName` → native: last_name
- `applicant.dateOfBirth` → native: dob
- `applicant.gender` → native: gender
- `applicant.identifiers.pan` → native: pan_number
- `applicant.identifiers.aadhaar` → native: aadhaar_number
- `applicant.contact.mobile` → native: mobile
- `applicant.contact.email` → native: email
- `applicant.addresses[0].pincode` → native: pincode
- `consent.consentGiven` → system: `true` (auto)
- `consent.consentTimestamp` → system: `current_timestamp` (auto)
- `config.reportType` → system: `CCR_FULL` (auto)
- `consent.purpose` → manual (no suggestion)
- `config.includeEnquiries` → manual
- `config.includeDerogatory` → manual

Sample response top-level keys: `status`, `reportId`, `generatedAt`, `consumerProfile`, `scoreDetails`, `accountDetails`, `enquiryDetails`, `summary`, `derogatorySummary`, `riskIndicators`

Notable nested paths:
- `scoreDetails.score` → integer credit score (e.g., 752)
- `accountDetails[].dpdSummary.maxDPD` → max DPD per account (use MAX aggregation across all accounts)
- `consumerProfile.addresses[].Pincode` → pincode per address (note capital P)
- `derogatorySummary.totalDelinquencies` → count of delinquencies
- `riskIndicators.hasRecentDelinquency` → boolean

#### CRM Customer Lookup (`crm_lookup`)
Category: Internal CRM
Input fields: `pan`, `mobile`
Response: customer profile, isExistingCustomer, segment, riskCategory, kycStatus, activeLoans, dedupeFlags

#### MCA Company Check (`mca_check`)
Category: Government
Input fields: `pan`, `companyId`
Response: directorInfo (DIN, companies list, defaultedCount), flags (hasDefaultedCompany, hasDisqualification)

### 7.4 Adding a Data Hook — 3-Step Wizard (AddHookDialog)

**File:** `src/app/components/AddHookDialog.tsx`

The CST adds APIs to an event slot via a 3-step wizard modal. Modal size: `max-w-5xl w-[90vw] h-[88vh]` (wide, fixed height for proper scrolling).

#### Step 1: Select API
- Search bar to filter APIs by name/description
- API cards showing icon, name, category badge, description, input field count
- Trigger dropdown (irrelevant now — event is determined by which slot you clicked)
- Select an API → click Next

#### Step 2: Map Inputs
- Shows all API request fields in a scrollable 3-column table
- Columns: `API Field` (path + label) | `Source` (dropdown) | `Value`
- Source types:
  - **Native field** — maps to a standard journey field (dropdown of native fields)
  - **Custom field** — maps to a CST-created field (text input)
  - **Static value** — hardcoded string (text input)
  - **System auto** — auto-filled, read-only badge (e.g., timestamp, consent=true)
  - **Prior API output** — references output of a previously called API (text input)
- All fields are pre-filled with suggestions from the API catalog but fully editable
- System fields show read-only "System auto" badge
- Scroll: `ScrollArea` with `flex-1 min-h-0` — scrolls within the fixed dialog height

#### Step 3: Capture Outputs
- **Split panel layout:**
  - **LEFT (flex-1)**: Full API response tree (visual JSON explorer)
  - **RIGHT (w-72)**: Captured fields list + inline store form
- **Response Tree (ResponseTree component):**
  - Renders the `sampleResponse` from the API catalog as an interactive tree
  - Primitive fields: show `[key]: [sample value]` with a `+ Capture` button on the right
  - Array fields (object arrays): show `[key]: [ N objects ]` with expand/collapse
    - When expanded, shows one representative item's fields with `+ From array` buttons
    - `+ From array` opens an `ArrayCapturePanel` inline below the row
  - Object fields: show `[key]: { object }` with expand/collapse chevron
  - Auto-expands top 2 levels, deeper levels collapsed by default
  - Once captured, button changes to `✓ Captured` (green)
- **ArrayCapturePanel:**
  - Asks 3 questions: How to select? (aggregate), Filter: only where... (optional), Result preview
  - Aggregate options: First item only, Last item only, All values (as list), Maximum value, Minimum value, Total (sum), Count of items
  - Filter: checkbox to enable, then field=value dropdowns (only string fields in the array items)
  - Live result preview computed from sample data
- **Right panel — Captured Fields:**
  - When `+ Capture` is clicked, an inline store form appears at the top of the right panel:
    - Field label and sample value shown
    - Store as: Custom field | Native field | Reference only
    - Field name input (auto-suggested from label, e.g., `credit_score`)
    - Cancel / Add buttons
  - Saved captures listed as cards: `path → custom.field_name` or `ref only`
  - Delete button (trash icon) on each capture

**Data structure: `DataHookApiBinding`** (saved when the wizard completes)
```typescript
interface DataHookApiBinding {
  id: string;
  apiId: string;       // e.g. "cibil_bureau"
  apiName: string;     // e.g. "CIBIL Bureau Report"
  trigger?: HookTrigger;  // not used (event determined by slot)
  latencyP95Ms?: number;  // for display only
  inputMappings: InputMapping[];
  outputCaptures: OutputCapture[];
}
```

**Data structure: `InputMapping`**
```typescript
interface InputMapping {
  requestPath: string;        // e.g. "applicant.identifiers.pan"
  label: string;              // e.g. "PAN Number"
  sourceType: InputSourceType; // 'native' | 'custom' | 'static' | 'system' | 'api_output'
  sourceValue: string;        // e.g. "pan_number" | "true" | "cibil_api.scoreDetails.score"
  extractPath?: string;
  transforms?: TransformationStep[];
  isAutoMapped: boolean;
}
```

**Data structure: `OutputCapture`**
```typescript
interface OutputCapture {
  id: string;
  path: string;           // e.g. "scoreDetails.score" or "MAX(accountDetails[].dpdSummary.maxDPD)"
  label: string;          // e.g. "Credit Score"
  storeType: 'custom' | 'native' | 'none';
  storeName: string;      // e.g. "cibil_score"
  isArrayExtract?: boolean;
  arrayPath?: string;     // e.g. "accountDetails"
  aggregation?: AggregationType; // 'max' | 'min' | 'sum' | 'count' | 'first' | 'last' | 'all' | 'unique'
  filterField?: string;   // e.g. "accountType"
  filterValue?: string;   // e.g. "Credit Card"
  transforms?: TransformationStep[];
}
```

### 7.5 DataHooksSection UI (within Configuration Panel)

**File:** `src/app/components/DataHooksSection.tsx`

Shows inside the accordion of a Smart or Form block. Displays all event slots as expandable cards.

Each event slot card:
- Header: event label, API count, `Event` badge — click to expand/collapse
- Inside expanded slot:
  - Each configured API as a nested card with:
    - API name, p95 latency badge (if set), capture count, manual input count
    - Expanded: shows Inputs table (requestPath → sourceType.sourceValue) and Outputs table (path → storeType.storeName)
    - Delete button to remove the API from this slot
  - **"Add API in [Event]" button** — opens AddHookDialog wizard
  - **EventDecisionEditor** — rule builder for this event's captured outputs (see Section 7.6)

### 7.6 Event Decision Rules (within each Event Slot)

**Defined inside:** `src/app/components/DataHooksSection.tsx` as `EventDecisionEditor`

After APIs are configured in an event slot and outputs are captured, the CST can define decision rules that evaluate those captured fields and produce a verdict.

**Where it lives:** At the bottom of each expanded event slot card (below the API list)

**Available fields:** Auto-derived from `outputCaptures` of all APIs in the same slot where `storeType !== 'none'` and `storeName` is non-empty.

**Rule structure:**
- Rules are priority-ordered (top-to-bottom, first match wins)
- Each rule has:
  - One or more `Condition` objects: `field [operator] value`
  - `conditionOperator`: `AND` or `OR` (applies between all conditions in the rule)
  - `verdict`: `PASS` | `REJECT` | `FLAG` | `MANUAL_REVIEW`
- **Default verdict** — applied if no rule matches

**Condition operators:** `=`, `!=`, `>`, `<`, `>=`, `<=`, `between`, `contains`, `is empty`, `is not empty`

**`between` operator:** shows two value inputs (from / to)

**Verdict meanings:**
- `PASS` — applicant passes this check, journey continues normally
- `REJECT` — applicant is rejected, journey routes to a rejection end block
- `FLAG` — applicant is flagged for review (can still continue or be manually reviewed)
- `MANUAL_REVIEW` — routes to manual review queue

**Data structure: `DecisionBlockConfig`**
```typescript
interface DecisionBlockConfig {
  rules: DecisionRule[];
  defaultVerdict: DecisionVerdict;
}

interface DecisionRule {
  id: string;
  conditions: DecisionCondition[];
  conditionOperator: 'AND' | 'OR';
  verdict: DecisionVerdict;
}

interface DecisionCondition {
  id: string;
  field: string;       // storeName of a captured output, e.g. "cibil_score"
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'between' | 'contains' | 'is empty' | 'is not empty';
  value: string;
  valueTo?: string;    // only for 'between'
}
```

---

## 8. Merge Block — Full Detail

**Canvas node:** `src/app/components/nodes/MergeNode.tsx`
**Type string on canvas:** `"merge"`

Merges two or more parallel branches back into a single flow path. Has no configuration sections.

- Visual: Indigo badge `LOGIC`, indigo left border
- N input connection points (one per incoming branch), 1 output
- Editable name and description (unlike smart blocks)
- No Configuration Panel sections beyond Block Info

---

## 9. End Block — Full Detail

**Canvas node:** `src/app/components/nodes/EndNode.tsx`
**Type string on canvas:** `"end"`

Terminates the journey.

### 9.1 Configuration Panel — End Block Sections

#### Section: Block Info
- Editable name and description

#### Section: End Type
- `endType`: `success` | `rejection` | `manual_review`
- Shown as badge: green (`success`), red (`rejection`), amber (`manual_review`)

#### Section: Completion Message
- `completionMessage`: text shown to the applicant when they reach this end block

---

## 10. Native Fields Reference

Standard fields always available in every journey without needing custom field creation:

| Key | Label | Type |
|---|---|---|
| `first_name` | First Name | text |
| `last_name` | Last Name | text |
| `dob` | Date of Birth | date |
| `gender` | Gender | select |
| `pan_number` | PAN Number | text |
| `aadhaar_number` | Aadhaar Number | text |
| `mobile` | Mobile Number | tel |
| `email` | Email | email |
| `pincode` | Pincode | text |

Custom fields are created by:
1. Adding a field to a Form Block with `fieldSource: 'custom'`
2. Capturing an API output with `storeType: 'custom'`

---

## 11. File Map

```
src/
  app/
    App.tsx                        # Root component; holds nodes/edges state; creates new blocks
    types/
      journey.ts                   # ALL TypeScript interfaces and types — single source of truth
    data/
      blockDefinitions.ts          # SMART_BLOCKS array; SmartBlockDefinition objects for all 10 smart blocks
      apiCatalog.ts                # Mock API catalog: CIBIL, CRM, MCA — request fields + sample responses
      hookEventTemplates.ts        # getDefaultHookEventSlots(), mergeWithDefaultSlots() — per-block event generation
    components/
      BlockLibrary.tsx             # Left sidebar — block picker by category
      JourneyCanvas.tsx            # React Flow canvas; nodeTypes registration
      ConfigurationPanel.tsx       # Right sidebar — all accordion sections for all block types
      PageConfigCard.tsx           # Renders a single page config card (smart block pages)
      AddInputDialog.tsx           # Modal for adding form fields to Form Block
      AddBlockDialog.tsx           # Modal/flow for adding a new block from the canvas
      DataHooksSection.tsx         # Data Hooks accordion section + EventDecisionEditor
      DecisionRulesSection.tsx     # Standalone Decision rules section (legacy, for decision-type blocks)
      AddHookDialog.tsx            # 3-step wizard: Select API → Map Inputs → Capture Outputs
      ResponseTree.tsx             # Visual JSON tree explorer for output capture (Step 3)
      nodes/
        StartNode.tsx              # Canvas node: Start Block
        SmartBlockNode.tsx         # Canvas node: Smart Block (blue)
        FormBlockNode.tsx          # Canvas node: Form Block (green)
        RouterNode.tsx             # Canvas node: Conditional Router (orange)
        MergeNode.tsx              # Canvas node: Merge Block (indigo)
        EndNode.tsx                # Canvas node: End Block (red)
        DecisionNode.tsx           # Canvas node: Decision Block (purple, shows rule summary)
      ui/
        button.tsx, input.tsx, label.tsx, badge.tsx  # Shadcn/Radix primitives
        dialog.tsx                 # Used by AddHookDialog, AddInputDialog
        select.tsx                 # Radix Select used throughout
        scroll-area.tsx            # Radix ScrollArea — critical for modal scrolling
        accordion.tsx              # Used in ConfigurationPanel for sections
        switch.tsx, textarea.tsx   # Form primitives
```

---

## 12. UI/UX Patterns & Conventions

### 12.1 Color Coding (Consistent Everywhere)
| Block Type | Color | Tailwind |
|---|---|---|
| Smart | Blue | `border-blue-500`, `bg-blue-100`, `text-blue-700` |
| Form | Green | `border-green-500`, `bg-green-100`, `text-green-700` |
| Router | Orange | `border-orange-500`, `bg-orange-100`, `text-orange-700` |
| Merge | Indigo | `border-indigo-500`, `bg-indigo-100`, `text-indigo-700` |
| End | Red | `border-red-500`, `bg-red-100`, `text-red-700` |
| Data Hook | Purple | pills on canvas nodes: `bg-purple-100 text-purple-600` |

### 12.2 Dialog / Modal Sizing
- All modals that need vertical scrolling use `h-[88vh]` (fixed height, not max-height) so flex children know their bounds
- Inner scroll areas: `ScrollArea` with `flex-1 min-h-0` — the `min-h-0` is required for flex shrinking to work
- Wide modals (like AddHookDialog): `max-w-5xl w-[90vw]`

### 12.3 Configuration Panel Accordion
- All sections are `AccordionItem` components
- Default open sections: Block Info
- Sections only render if applicable (e.g., Checks only if `block.checks` exists)
- Changes are saved immediately (no Save button in panel) — `onSave(updatedBlock)` is called on every change

### 12.4 Naming Conventions
- Block IDs: `block-<timestamp>` (e.g., `block-1712345678901`)
- Hook IDs: `hook-<timestamp>`
- Field IDs: `field-<timestamp>`
- Rule IDs: `rule-<timestamp>`
- Condition IDs: `cond-<timestamp>`
- Custom field keys: lowercase, underscores (e.g., `cibil_score`, `max_dpd_all_accounts`)

### 12.5 Transformations (InputMapping + OutputCapture)
Both `InputMapping` and `OutputCapture` support an optional `transforms: TransformationStep[]` array.
These are not yet implemented in the UI but the types are defined:
- `trim`, `uppercase`, `lowercase`, `replace`, `regex_extract`
- `to_number`, `round`
- `default_if_empty`
- `timezone_convert`, `date_format`
- `join`, `unique`

---

## 13. Known Decisions & Constraints

1. **No auto-mapping concept** — all API input fields must be manually mapped by the CST. Pre-filled values are suggestions only.
2. **Event slots are fixed** — the CST cannot add custom event slots. They are generated per block type.
3. **Decision rules live inside event slots** — not as a separate canvas block. The "Decision Block" node on the canvas is a legacy design; rule evaluation is done inside `HookEventSlot.decisionConfig`.
4. **API catalog is mocked** — `src/app/data/apiCatalog.ts` is a static array. In production, this will be fetched from backend.
5. **React Flow state** — nodes/edges are stored in React state in `App.tsx`. No persistence yet (no localStorage, no backend save).
6. **Radix ScrollArea** — must use `ScrollArea` from Radix (not native scroll) to match the design system. Always pair `flex-1 min-h-0` inside flex containers.
7. **Target users are non-technical** — all UI must avoid developer jargon. No JSONPath. No code. Use plain English labels and dropdowns.

---

## 14. Current Implementation Status

| Feature | Status |
|---|---|
| Canvas with all block types | ✅ Complete |
| Block Library (sidebar) | ✅ Complete |
| Smart Block configuration (all 10 blocks) | ✅ Complete |
| Form Block with AddInputDialog | ✅ Complete |
| Router Block with condition builder | ✅ Complete |
| Merge Block | ✅ Complete |
| End Block | ✅ Complete |
| Data Hooks — Event Slots UI | ✅ Complete |
| Data Hooks — AddHookDialog (3-step wizard) | ✅ Complete |
| Data Hooks — Input Mapping table | ✅ Complete |
| Data Hooks — ResponseTree (visual output capture) | ✅ Complete |
| Data Hooks — ArrayCapturePanel with aggregation | ✅ Complete |
| Event Decision Rules (within event slots) | ✅ Complete |
| Hook pills on canvas nodes | ✅ Complete |
| Transformation steps UI | ❌ Not started |
| API catalog from backend (live fetch) | ❌ Mocked only |
| Journey persistence (save/load) | ❌ Not started |
| Journey export (JSON/YAML) | ❌ Not started |
