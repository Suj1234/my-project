 Now I will give you all 12 blocks with configuration: 1. PAN Block

Name: PAN Verification
Description: PAN verification + identity fetch
Service Provider

Provider: PAN Profile Detailed API 
Checks & Validations

AML Check (Y/N)

CFR Check – Configure Master Code (Dropdown) & Column Field Name (free text )

Age Check – User will provide min and max age (user input free text )

Serviceable pincode Check (Y/N) – Configure Master Code (Dropdown) & Column Field Name (free text )

General Configuration : No Configuration

UI Configuration :

PAN Input Page

Action: PAN initiated
PAN Confirmed Page

Action: PAN verified
Retry Rules

pan_retry_attempts: 3
cooling_period_minutes: 120
velocity_cycle: 3
AADHAAR Block
Name and Description

Name: Aadhaar Verification
Description: Aadhaar OTP + identity verification
Service Provider

Provider: DigiLocker
Checks & Validations

Aadhaar mobile linkage check (Y/N)

Age Check – User will provide min and max age

Serviceable pincode Check – Configure Master Code (dropdown) & Column Field Name (free text )

General Configuration

No Configuration

UI Configuration

Aadhaar Info Page

Action: Confirm DigiLocker Details
Retry Rules

aadhaar_retry_attempts: 3
cooling_period_minutes: 120
velocity_cycle: 3
PROFILE & ADDRESS DETAILS
Name and Description

Name: Profile Details
Description: Pre-populate details based on Aadhaar and PAN & communication address fields
State: Profile & Address details
Service Provider

No Configuration

Checks & Validations

No Configuration

General Configuration

No Configuration

UI Configuration

Profile Details Page

Action 1

Action 2 – communication address update page

Retry Rules

No Configuration

FORM BLOCK (not a smart block - we discussed this above already)
Name and Description - we will take this from user, when the user will drag this block to the canvas.

Form Block

Service Provider

No Configuration

User Input

Validation / Configuration Rules

Configurable dynamic field list

Field types configurable: text / number / select / date / currency

Required flag per field

Min/max per numeric field

Regex per field supported

Checks & Validations

No Configuration

General Configuration

No Configuration

UI Configuration

Form Page

Action: Action 1
Retry Rules

No Configuration

OFFER GENERATION
Name and Description

Name: Offer Generation
Description: BRE driven offer computation
Service Provider

No Configuration

Checks & Validations

BRE Selection – Which BRE to call to generate offer

General Configuration

No Configuration

UI Configuration

Generate Offer – Loader

Show offer page

Retry Rules

No Configuration

BANK STATEMENT
Name and Description

Name: Bank Statement
Description: Bank statement
Service Provider

Provider: Insights
Checks & Validations

Name match configuration – Name source selection and Threshold %

General Configuration

Date Range to fetch bank statement – user can define start and end in Month & Year

UI Configuration

Bank Statement Page

Action: Action 1
Retry Rules

bank_retry_attempts: 3
cooling_period_minutes: 120
velocity_cycle: 3
LIVENESS
Name and Description

Name: Liveness & Selfie Verification Block
Description: Capture selfie, perform liveness check and optional face match
Service Provider

Provider: TKYC
Checks & Validations

face_match_enabled (Y/N)

face_match_source selectable (Search – assign custom/native field)

    face_match_threshold_percentage
liveness_score %

General Configuration

No Configuration

UI Configuration

Liveness Landing Page

Photo Capture Page

Photo Preview Page

Retry Rules

face_match_retry_limit: 3
cooling_period_minutes: 120
velocity_cycle: 3
liveness_retry_limit: 3
cooling_period_minutes: 120
velocity_cycle: 3
KFS
Name and Description

Name: KFS Document Display
Description: Display KFS document and capture acknowledgement
Service Provider

No Configuration

Checks & Validations

Document Selection Rules

KFS template selection (via manual input – textbox)

General Configuration

No Configuration

UI Configuration

KFS Display page

Action

Retry Rules

No Configuration

SANCTION LETTER
Name and Description

Name: Sanction Letter Display & Acceptance Block
Description: Display sanction letter, allow download, capture acceptance
Service Provider

No Configuration

Checks & Validations

Document Selection Rules

sanction_template selectable per product

General Configuration

No Configuration

UI Configuration

Sanction letter display page

Retry Rules

No Configuration

BANK ACCOUNT SELECTION
Name and Description

Name: Bank Account Selection
Description: Select or add disbursement bank account
Service Provider

No Configuration

User Input

We will prepopulate account

Checks & Validations

Account Verification Rules

penny_drop (Y/N)

name_match_with_applicant (Y/N)

name_match_threshold % configurable

account_validity_status (Y/N)

General Configuration

No Configuration

UI Configuration

Bank Account List Page

Bank account selected page

Retry Rules

penny_retry_limit: 3
cooling_period_minutes: 120
velocity_cycle: 3
ifsc_verification_limit: 3
cooling_period_minutes: 120
velocity_cycle: 3
ESIGN
Name and Description

Name: eSign
Description: Digital signing of loan documents
Service Provider

Provider: TKYC
Checks & Validations

Document Selection Rules

Template selection

General Configuration

No Configuration

UI Configuration

eSign Initiation Page

eSign completion page

Retry Rules

sign_init_retry_limit: 3
cooling_period_minutes: 120
velocity_cycle: 3              don't do any change - please review and put all configuration together for each block. and ask any query if you have. also let me know how are you thinking to differntiate smart blcok vs form block vs conditional bloc.=k. let's finalize the approach and then do change.