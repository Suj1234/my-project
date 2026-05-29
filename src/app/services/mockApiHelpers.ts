import type { BlockData } from '../types/journey';

const LOGIC_TYPES = new Set(['router', 'merge', 'decision']);

// --- CC step assignment map ---
const CC_STEP_MAP: Record<string, { stepId: string; stepLabel: string; stepColor: string }> = {
  pan_verify:      { stepId: 'cc-step-1', stepLabel: 'Identity Verification', stepColor: 'blue' },
  entry_router:    { stepId: 'cc-step-1', stepLabel: 'Identity Verification', stepColor: 'blue' },
  etb_profile:     { stepId: 'cc-step-1', stepLabel: 'Identity Verification', stepColor: 'blue' },
  aadhaar:         { stepId: 'cc-step-1', stepLabel: 'Identity Verification', stepColor: 'blue' },
  liveness:        { stepId: 'cc-step-1', stepLabel: 'Identity Verification', stepColor: 'blue' },
  ntb_profile:     { stepId: 'cc-step-1', stepLabel: 'Identity Verification', stepColor: 'blue' },
  emp_income:      { stepId: 'cc-step-2', stepLabel: 'Financial Assessment', stepColor: 'green' },
  emp_router:      { stepId: 'cc-step-2', stepLabel: 'Financial Assessment', stepColor: 'green' },
  payslip:         { stepId: 'cc-step-2', stepLabel: 'Financial Assessment', stepColor: 'green' },
  itr:             { stepId: 'cc-step-2', stepLabel: 'Financial Assessment', stepColor: 'green' },
  bsa:             { stepId: 'cc-step-2', stepLabel: 'Financial Assessment', stepColor: 'green' },
  credit_decision: { stepId: 'cc-step-2', stepLabel: 'Financial Assessment', stepColor: 'green' },
  credit_router:   { stepId: 'cc-step-2', stepLabel: 'Financial Assessment', stepColor: 'green' },
  prequal:              { stepId: 'cc-step-3', stepLabel: 'Card Fulfilment', stepColor: 'purple' },
  card_selection:       { stepId: 'cc-step-3', stepLabel: 'Card Fulfilment', stepColor: 'purple' },
  card_prefs:           { stepId: 'cc-step-3', stepLabel: 'Card Fulfilment', stepColor: 'purple' },
  mitc:                 { stepId: 'cc-step-3', stepLabel: 'Card Fulfilment', stepColor: 'purple' },
  consent:              { stepId: 'cc-step-3', stepLabel: 'Card Fulfilment', stepColor: 'purple' },
  esign:                { stepId: 'cc-step-3', stepLabel: 'Card Fulfilment', stepColor: 'purple' },
  post_esign_router:    { stepId: 'cc-step-3', stepLabel: 'Card Fulfilment', stepColor: 'purple' },
  etb_end:              { stepId: 'cc-step-3', stepLabel: 'Card Fulfilment', stepColor: 'purple' },
  vkyc:                 { stepId: 'cc-step-3', stepLabel: 'Card Fulfilment', stepColor: 'purple' },
  ntb_end:              { stepId: 'cc-step-3', stepLabel: 'Card Fulfilment', stepColor: 'purple' },
};

// --- SA step assignment map ---
const SA_STEP_MAP: Record<string, { stepId: string; stepLabel: string; stepColor: string }> = {
  pan:          { stepId: 'sa-step-1', stepLabel: 'KYC Verification', stepColor: 'blue' },
  entry_router: { stepId: 'sa-step-1', stepLabel: 'KYC Verification', stepColor: 'blue' },
  etb_profile:  { stepId: 'sa-step-1', stepLabel: 'KYC Verification', stepColor: 'blue' },
  aadhaar:      { stepId: 'sa-step-1', stepLabel: 'KYC Verification', stepColor: 'blue' },
  ntb_personal: { stepId: 'sa-step-1', stepLabel: 'KYC Verification', stepColor: 'blue' },
  merge:        { stepId: 'sa-step-1', stepLabel: 'KYC Verification', stepColor: 'blue' },
  branch_nominee: { stepId: 'sa-step-2', stepLabel: 'Account Setup', stepColor: 'green' },
  bre:            { stepId: 'sa-step-2', stepLabel: 'Account Setup', stepColor: 'green' },
  vas:            { stepId: 'sa-step-2', stepLabel: 'Account Setup', stepColor: 'green' },
  fatca:          { stepId: 'sa-step-2', stepLabel: 'Account Setup', stepColor: 'green' },
  esign:       { stepId: 'sa-step-3', stepLabel: 'Account Opening', stepColor: 'purple' },
  funding:     { stepId: 'sa-step-3', stepLabel: 'Account Opening', stepColor: 'purple' },
  kyc_router:  { stepId: 'sa-step-3', stepLabel: 'Account Opening', stepColor: 'purple' },
  liveness:    { stepId: 'sa-step-3', stepLabel: 'Account Opening', stepColor: 'purple' },
  etb_end:     { stepId: 'sa-step-3', stepLabel: 'Account Opening', stepColor: 'purple' },
  vkyc:        { stepId: 'sa-step-3', stepLabel: 'Account Opening', stepColor: 'purple' },
  ntb_end:     { stepId: 'sa-step-3', stepLabel: 'Account Opening', stepColor: 'purple' },
};

// --- The exact 25 CC blocks (wf4 clone with original blk_ IDs) ---
function getCCBaseBlocks(): BlockData[] {
  return [
    // 1 — Journey Start
    {
      id: 'blk_start', type: 'start', name: 'Journey Start',
      description: 'Credit card application entry via web channel with OTP authentication',
      configured: true,
      entrySource: 'web', authRequired: true, authMethod: 'otp',
      collectConsent: true, consentScope: 'credit_card_application',
      prefillSource: 'none', passthroughParams: [], startWebhookEnabled: false,
    },
    // 2 — PAN Verification
    {
      id: 'blk_pan_verify', type: 'smart', blockTypeId: 'pan_verification',
      name: 'PAN Verification', category: 'identity', provider: 'PAN Profile Detailed API',
      description: 'Perform comprehensive PAN verification with AML screening, CFR validation, age verification, and serviceable pincode checks. Identity details are fetched using PAN Profile Detailed API with configurable retry mechanism.',
      configured: true, hasRetry: true,
      pages: [
        { id: 'pan_input', name: 'PAN Input Page', actions: ['PAN initiated'], userInputs: [{ id: 'pan_number', name: 'PAN Number', type: 'text', dataType: 'STRING', required: true }] },
        { id: 'pan_confirmed', name: 'PAN Confirmed Page', actions: ['PAN verified'], userInputs: [] },
      ],
      checks: [
        { id: 'aml_check', name: 'AML Check', enabled: false, outputResponse: 'reject', fields: [] },
        { id: 'cfr_check', name: 'CFR Check', enabled: false, outputResponse: 'reject', fields: [
          { id: 'master_code', name: 'Configure Master Code', type: 'select', value: '', options: [{ label: 'CFR Master 1', value: 'cfr_master_1' }, { label: 'CFR Master 2', value: 'cfr_master_2' }, { label: 'CFR Master 3', value: 'cfr_master_3' }] },
          { id: 'column_field', name: 'Column Field Name', type: 'dependent-select', value: '', dependsOn: 'master_code', masterColumns: { cfr_master_1: [{ label: 'Applicant ID', value: 'applicant_id', isPrimaryKey: true, dataType: 'Integer' }, { label: 'PAN Number', value: 'pan_number', isPrimaryKey: false, dataType: 'String' }, { label: 'CFR Score', value: 'cfr_score', isPrimaryKey: false, dataType: 'Float' }, { label: 'Risk Category', value: 'risk_category', isPrimaryKey: false, dataType: 'String' }], cfr_master_2: [{ label: 'Customer ID', value: 'customer_id', isPrimaryKey: true, dataType: 'Integer' }, { label: 'Full Name', value: 'full_name', isPrimaryKey: false, dataType: 'String' }, { label: 'CFR Flag', value: 'cfr_flag', isPrimaryKey: false, dataType: 'Boolean' }, { label: 'Check Date', value: 'check_date', isPrimaryKey: false, dataType: 'Date' }], cfr_master_3: [{ label: 'Record ID', value: 'record_id', isPrimaryKey: true, dataType: 'Integer' }, { label: 'Bureau Ref', value: 'bureau_ref', isPrimaryKey: false, dataType: 'String' }, { label: 'Fraud Indicator', value: 'fraud_indicator', isPrimaryKey: false, dataType: 'Boolean' }, { label: 'Source System', value: 'source_system', isPrimaryKey: false, dataType: 'String' }] } },
        ]},
        { id: 'age_check', name: 'Age Check', enabled: true, outputResponse: 'reject', fields: [
          { id: 'min_age', name: 'Minimum Age', type: 'number', value: 21 },
          { id: 'max_age', name: 'Maximum Age', type: 'number', value: 65 },
        ]},
        { id: 'pincode_check', name: 'Serviceable Pincode Check', enabled: false, outputResponse: 'reject', fields: [
          { id: 'master_code', name: 'Configure Master Code', type: 'select', value: '', options: [{ label: 'Pincode Master 1', value: 'pincode_master_1' }, { label: 'Pincode Master 2', value: 'pincode_master_2' }, { label: 'Pincode Master 3', value: 'pincode_master_3' }] },
          { id: 'column_field', name: 'Column Field Name', type: 'dependent-select', value: '', dependsOn: 'master_code', masterColumns: { pincode_master_1: [{ label: 'Pincode', value: 'pincode', isPrimaryKey: true, dataType: 'String' }, { label: 'City', value: 'city', isPrimaryKey: false, dataType: 'String' }, { label: 'State', value: 'state', isPrimaryKey: false, dataType: 'String' }, { label: 'Is Serviceable', value: 'is_serviceable', isPrimaryKey: false, dataType: 'Boolean' }], pincode_master_2: [{ label: 'Zip Code', value: 'zip_code', isPrimaryKey: true, dataType: 'String' }, { label: 'District', value: 'district', isPrimaryKey: false, dataType: 'String' }, { label: 'Region', value: 'region', isPrimaryKey: false, dataType: 'String' }, { label: 'Service Type', value: 'service_type', isPrimaryKey: false, dataType: 'String' }], pincode_master_3: [{ label: 'Postal Code', value: 'postal_code', isPrimaryKey: true, dataType: 'String' }, { label: 'Tier', value: 'tier', isPrimaryKey: false, dataType: 'String' }, { label: 'Coverage Area', value: 'coverage_area', isPrimaryKey: false, dataType: 'String' }, { label: 'Is Active', value: 'is_active', isPrimaryKey: false, dataType: 'Boolean' }] } },
        ]},
      ],
      dataHooks: [
        {
          id: 'hook_pan_post', eventKey: 'after_pan_input', eventLabel: 'After PAN Input',
          apis: [
            {
              id: 'dhapi_cbs', apiId: 'cbs_dedupe', apiName: 'CBS Dedupe',
              trigger: 'after_block_complete', latencyP95Ms: 800,
              inputMappings: [
                { requestPath: 'pan_number', label: 'PAN Number', sourceType: 'native', sourceValue: 'pan_number', isAutoMapped: true },
                { requestPath: 'date_of_birth', label: 'Date of Birth', sourceType: 'native', sourceValue: 'date_of_birth', isAutoMapped: true },
              ],
              outputCaptures: [
                { id: 'oc_is_etb', path: 'data.is_etb', label: 'Is ETB Customer', storeType: 'custom', storeName: 'is_etb' },
                { id: 'oc_cbs_name', path: 'data.customer_name', label: 'CBS Customer Name', storeType: 'native', storeName: 'customer_name' },
              ],
            },
            {
              id: 'dhapi_cms', apiId: 'cms_dedupe', apiName: 'CMS Dedupe',
              trigger: 'after_block_complete', latencyP95Ms: 400,
              inputMappings: [
                { requestPath: 'pan_number', label: 'PAN Number', sourceType: 'native', sourceValue: 'pan_number', isAutoMapped: true },
              ],
              outputCaptures: [
                { id: 'oc_has_card', path: 'data.has_existing_card', label: 'Has Existing Credit Card', storeType: 'custom', storeName: 'has_existing_card' },
              ],
            },
            {
              id: 'dhapi_lms', apiId: 'lms_dedupe', apiName: 'LMS Dedupe',
              trigger: 'after_block_complete', latencyP95Ms: 400,
              inputMappings: [
                { requestPath: 'pan_number', label: 'PAN Number', sourceType: 'native', sourceValue: 'pan_number', isAutoMapped: true },
              ],
              outputCaptures: [
                { id: 'oc_has_app', path: 'data.has_active_application', label: 'Has Active Application', storeType: 'custom', storeName: 'has_active_application' },
                { id: 'oc_app_id', path: 'data.application_id', label: 'Existing Application ID', storeType: 'custom', storeName: 'existing_application_id' },
              ],
            },
            {
              id: 'dhapi_cibil', apiId: 'cibil_bureau', apiName: 'CIBIL Bureau Report',
              trigger: 'after_block_complete', latencyP95Ms: 1450,
              inputMappings: [
                { requestPath: 'applicant.name.firstName', label: 'First Name', sourceType: 'native', sourceValue: 'first_name', isAutoMapped: true },
                { requestPath: 'applicant.name.lastName', label: 'Last Name', sourceType: 'native', sourceValue: 'last_name', isAutoMapped: true },
                { requestPath: 'applicant.dateOfBirth', label: 'Date of Birth', sourceType: 'native', sourceValue: 'dob', isAutoMapped: true },
                { requestPath: 'applicant.identifiers.pan', label: 'PAN Number', sourceType: 'native', sourceValue: 'pan_number', isAutoMapped: true },
                { requestPath: 'applicant.contact.mobile', label: 'Mobile Number', sourceType: 'native', sourceValue: 'mobile', isAutoMapped: true },
              ],
              outputCaptures: [
                { id: 'oc_score', path: 'data.scoreDetails.score', label: 'Credit Score', storeType: 'native', storeName: 'credit_score' },
                { id: 'oc_dpd90', path: 'data.derogatorySummary.dpd90Count', label: 'DPD 90+ Count', storeType: 'custom', storeName: 'bureau_dpd90' },
                { id: 'oc_enq', path: 'data.enquiryDetails.length', label: 'Total Enquiries', storeType: 'custom', storeName: 'bureau_enquiries' },
              ],
            },
          ],
        },
      ],
    },
    // 3 — Entry Router
    {
      id: 'blk_entry_router', type: 'router', name: 'Entry Router',
      description: 'Reject applicants with active credit card; route ETB to pre-filled profile; default NTB to Aadhaar OTP eKYC',
      configured: true, routerBranchType: 'exclusive', defaultRoute: 'blk_aadhaar',
      routings: [
        {
          id: 'route_reject_card', label: 'Has Existing Card → Reject', routingType: 'condition', saved: true,
          conditionGroups: [{ id: 'cg_has_card', operator: 'AND', conditions: [{ id: 'c_has_card', parameter: 'has_existing_card', operator: '=', value: 'true', fieldType: 'text' }] }], targetBlockId: 'blk_rejection_end',
        },
        {
          id: 'route_etb', label: 'ETB Customer → Profile Review', routingType: 'condition', saved: true,
          conditionGroups: [{ id: 'cg_etb', operator: 'AND', conditions: [{ id: 'c_etb', parameter: 'is_etb', operator: '=', value: 'true', fieldType: 'text' }] }], targetBlockId: 'blk_etb_profile',
        },
      ],
    },
    // 4 — ETB Customer Profile
    {
      id: 'blk_etb_profile', type: 'form', name: 'ETB Customer Profile',
      description: 'Review and confirm pre-filled profile data fetched from CBS for existing bank customers',
      configured: true, journeyState: 'etb_profile_review',
      pages: [
        {
          id: 'pg_etb_personal', name: 'Personal Information',
          userInputs: [
            { id: 'inp_etb_name',    key: 'customer_name',  label: 'Full Name',     type: 'text',   required: true,  fieldSource: 'native' },
            { id: 'inp_etb_dob',     key: 'date_of_birth',  label: 'Date of Birth', type: 'date',   required: true,  fieldSource: 'native' },
            { id: 'inp_etb_pan',     key: 'pan_number',     label: 'PAN Number',    type: 'text',   required: true,  fieldSource: 'native' },
            { id: 'inp_etb_gender',  key: 'gender',         label: 'Gender',        type: 'select', required: false, fieldSource: 'native' },
          ],
        },
        {
          id: 'pg_etb_contact', name: 'Contact Details',
          userInputs: [
            { id: 'inp_etb_mobile',  key: 'mobile_number',  label: 'Mobile Number', type: 'tel',   required: true,  fieldSource: 'native' },
            { id: 'inp_etb_email',   key: 'email_id',       label: 'Email Address', type: 'email', required: true,  fieldSource: 'native' },
          ],
        },
        {
          id: 'pg_etb_address', name: 'Address',
          userInputs: [
            { id: 'inp_etb_addr',    key: 'address',        label: 'Address',       type: 'text', required: true,  fieldSource: 'native' },
            { id: 'inp_etb_city',    key: 'city',           label: 'City',          type: 'text', required: true,  fieldSource: 'native' },
            { id: 'inp_etb_state',   key: 'state',          label: 'State',         type: 'text', required: false, fieldSource: 'native' },
            { id: 'inp_etb_pincode', key: 'pincode',        label: 'Pincode',       type: 'text', required: true,  fieldSource: 'native' },
          ],
        },
      ],
    },
    // 5 — Aadhaar OTP eKYC
    {
      id: 'blk_aadhaar', type: 'smart', blockTypeId: 'aadhaar_verification',
      name: 'Aadhaar OTP eKYC', category: 'identity', provider: 'DigiLocker',
      description: 'OTP-based Aadhaar eKYC for NTB customers; ARK stored in Aadhaar Vault, number never persisted',
      configured: true, hasRetry: true,
      pages: [
        { id: 'aadhaar_info', name: 'Aadhaar Info Page', actions: ['Confirm DigiLocker Details'], userInputs: [] },
        { id: 'aadhaar_otp_input', name: 'Aadhaar OTP eKYC Input Page', actions: ['Aadhaar OTP verified'],
          userInputs: [{ id: 'aadhaar_number', name: 'Aadhaar Number', type: 'text', dataType: 'STRING', required: true }] },
      ],
      generalConfig: [
        { id: 'service_provider', name: 'Service Provider', type: 'select', value: 'otp_ekyc',
          options: [{ label: 'DigiLocker', value: 'digilocker' }, { label: 'OTP eKYC (UIDAI)', value: 'otp_ekyc' }] },
      ],
      checks: [
        { id: 'mobile_linkage', name: 'Aadhaar Mobile Linkage Check', enabled: false, outputResponse: 'reject', fields: [] },
        { id: 'age_check', name: 'Age Check', enabled: false, outputResponse: 'reject',
          fields: [{ id: 'min_age', name: 'Minimum Age', type: 'number', value: 18 }, { id: 'max_age', name: 'Maximum Age', type: 'number', value: 65 }] },
        { id: 'pincode_check', name: 'Serviceable Pincode Check', enabled: false, outputResponse: 'reject',
          fields: [
            { id: 'master_code', name: 'Configure Master Code', type: 'select', value: '',
              options: [{ label: 'Pincode Master 1', value: 'pincode_master_1' }, { label: 'Pincode Master 2', value: 'pincode_master_2' }, { label: 'Pincode Master 3', value: 'pincode_master_3' }] },
            { id: 'column_field', name: 'Column Field Name', type: 'dependent-select', value: '', dependsOn: 'master_code',
              masterColumns: {
                pincode_master_1: [{ label: 'Pincode', value: 'pincode', isPrimaryKey: true, dataType: 'String' }, { label: 'City', value: 'city', isPrimaryKey: false, dataType: 'String' }, { label: 'State', value: 'state', isPrimaryKey: false, dataType: 'String' }, { label: 'Is Serviceable', value: 'is_serviceable', isPrimaryKey: false, dataType: 'Boolean' }],
                pincode_master_2: [{ label: 'Zip Code', value: 'zip_code', isPrimaryKey: true, dataType: 'String' }, { label: 'District', value: 'district', isPrimaryKey: false, dataType: 'String' }, { label: 'Region', value: 'region', isPrimaryKey: false, dataType: 'String' }, { label: 'Service Type', value: 'service_type', isPrimaryKey: false, dataType: 'String' }],
                pincode_master_3: [{ label: 'Postal Code', value: 'postal_code', isPrimaryKey: true, dataType: 'String' }, { label: 'Tier', value: 'tier', isPrimaryKey: false, dataType: 'String' }, { label: 'Coverage Area', value: 'coverage_area', isPrimaryKey: false, dataType: 'String' }, { label: 'Is Active', value: 'is_active', isPrimaryKey: false, dataType: 'Boolean' }],
              } },
          ] },
      ],
      retryConfig: { maxAttempts: 3, coolingPeriod: 120, velocityCycle: 3 },
    },
    // 6 — Liveness & Face Match
    {
      id: 'blk_liveness', type: 'smart', blockTypeId: 'liveness_selfie',
      name: 'Liveness & Face Match', category: 'identity', provider: 'TKYC',
      description: 'Passive liveness detection and selfie-vs-Aadhaar face match for NTB applicants',
      configured: true, hasRetry: true,
      pages: [
        { id: 'landing', name: 'Liveness Landing Page', actions: ['Liveness check initiated'], userInputs: [] },
        { id: 'photo_capture', name: 'Photo Capture Page', actions: ['Photo captured'], userInputs: [] },
        { id: 'photo_preview', name: 'Photo Preview Page', actions: ['Photo confirmed'], userInputs: [] },
      ],
      checks: [
        { id: 'face_match', name: 'Face Match', enabled: false, outputResponse: 'reject',
          fields: [
            { id: 'source', name: 'Face Match Source', type: 'select', value: '',
              options: [{ label: 'PAN', value: 'pan' }, { label: 'Aadhaar', value: 'aadhaar' }] },
            { id: 'threshold', name: 'Match Threshold %', type: 'number', value: 80 },
          ] },
        { id: 'liveness_score', name: 'Liveness Score', enabled: false, outputResponse: 'reject',
          fields: [{ id: 'threshold', name: 'Minimum Score %', type: 'number', value: 80 }] },
      ],
      retryConfig: [
        { id: 'face_match_retry', name: 'Face Match Retry', maxAttempts: 3, coolingPeriod: 120, velocityCycle: 3 },
        { id: 'liveness_retry', name: 'Liveness Retry', maxAttempts: 3, coolingPeriod: 120, velocityCycle: 3 },
      ],
    },
    // 7 — NTB Customer Profile
    {
      id: 'blk_ntb_profile', type: 'form', name: 'NTB Customer Profile',
      description: 'Collect and confirm personal details for new-to-bank credit card applicants',
      configured: true, journeyState: 'ntb_profile_collection',
      pages: [
        {
          id: 'pg_ntb_personal', name: 'Personal Information',
          userInputs: [
            { id: 'inp_ntb_name',   key: 'customer_name',      label: 'Full Name',            type: 'text',   required: true,  fieldSource: 'native' },
            { id: 'inp_ntb_dob',    key: 'date_of_birth',      label: 'Date of Birth',        type: 'date',   required: true,  fieldSource: 'native' },
            { id: 'inp_ntb_father', key: 'father_spouse_name', label: 'Father / Spouse Name', type: 'text',   required: false, fieldSource: 'custom' },
            { id: 'inp_ntb_nat',    key: 'nationality',        label: 'Nationality',          type: 'select', required: true,  fieldSource: 'custom' },
          ],
        },
        {
          id: 'pg_ntb_contact', name: 'Contact Details',
          userInputs: [
            { id: 'inp_ntb_mobile', key: 'mobile_number',      label: 'Mobile Number',        type: 'tel',   required: true,  fieldSource: 'native' },
            { id: 'inp_ntb_email',  key: 'email_id',           label: 'Email Address',        type: 'email', required: true,  fieldSource: 'native' },
          ],
        },
        {
          id: 'pg_ntb_address', name: 'Address',
          userInputs: [
            { id: 'inp_ntb_addr',    key: 'address', label: 'Address Line 1', type: 'text', required: true,  fieldSource: 'native' },
            { id: 'inp_ntb_city',    key: 'city',    label: 'City',           type: 'text', required: true,  fieldSource: 'native' },
            { id: 'inp_ntb_state',   key: 'state',   label: 'State',          type: 'text', required: false, fieldSource: 'native' },
            { id: 'inp_ntb_pincode', key: 'pincode', label: 'Pincode',        type: 'text', required: true,  fieldSource: 'native' },
          ],
        },
      ],
    },
    // 8 — Employment & Income Details
    {
      id: 'blk_emp_income', type: 'form', name: 'Employment & Income Details',
      description: 'Collect employment type, employer name, and net monthly income for credit assessment',
      configured: true, journeyState: 'employment_income',
      pages: [
        {
          id: 'pg_employment', name: 'Employment Details',
          userInputs: [
            { id: 'inp_emp_type', key: 'employment_type',  label: 'Employment Type',          type: 'select', required: true,  fieldSource: 'native' },
            { id: 'inp_employer', key: 'employer_name',    label: 'Employer / Business Name', type: 'text',   required: true,  fieldSource: 'custom' },
            { id: 'inp_tenure',   key: 'job_tenure_years', label: 'Years in Current Job',     type: 'number', required: false, fieldSource: 'custom' },
          ],
        },
        {
          id: 'pg_income', name: 'Income Details',
          userInputs: [
            { id: 'inp_income', key: 'monthly_income', label: 'Net Monthly Income (₹)',      type: 'number', required: true,  fieldSource: 'native' },
            { id: 'inp_emi',    key: 'existing_emi',   label: 'Monthly EMI Obligations (₹)', type: 'number', required: false, fieldSource: 'custom' },
          ],
        },
      ],
    },
    // 9 — Employment Type Router
    {
      id: 'blk_emp_router', type: 'router', name: 'Employment Type Router',
      description: 'Route salaried applicants to payslip upload; self-employed (SEP/SENP) to ITR verification',
      configured: true, routerBranchType: 'exclusive', defaultRoute: 'blk_itr',
      routings: [
        {
          id: 'route_sal', label: 'Salaried', routingType: 'condition', saved: true,
          conditionGroups: [{ id: 'cg_sal', operator: 'AND', conditions: [{ id: 'c_sal', parameter: 'native.employment_type', operator: '=', value: 'SALARIED', fieldType: 'text' }] }], targetBlockId: 'blk_payslip',
        },
        {
          id: 'route_se', label: 'Self-Employed (SEP / SENP)', routingType: 'condition', saved: true,
          conditionGroups: [{ id: 'cg_se', operator: 'OR', conditions: [
            { id: 'c_sep',  parameter: 'native.employment_type', operator: '=', value: 'SEP',  fieldType: 'text' },
            { id: 'c_senp', parameter: 'native.employment_type', operator: '=', value: 'SENP', fieldType: 'text' },
          ]}], targetBlockId: 'blk_itr',
        },
      ],
    },
    // 10 — Salary Slip Upload
    {
      id: 'blk_payslip', type: 'smart', blockTypeId: 'payslip',
      name: 'Salary Slip Upload', category: 'financial', provider: 'Document OCR',
      description: 'Upload and verify last 3 salary slips for salaried credit card applicants',
      configured: true, hasRetry: true,
      pages: [
        { id: 'payslip_upload', name: 'Payslip Upload Page', actions: ['Payslip uploaded'], userInputs: [] },
        { id: 'payslip_confirmed', name: 'Payslip Confirmation Page', actions: ['Payslip confirmed'], userInputs: [] },
      ],
      generalConfig: [
        { id: 'last_n_months', name: 'Last N Months Required', type: 'number', value: 3 },
        { id: 'accepted_formats', name: 'Accepted Formats', type: 'select', value: 'pdf_jpg_png',
          options: [{ label: 'PDF only', value: 'pdf' }, { label: 'PDF, JPG, PNG', value: 'pdf_jpg_png' }] },
      ],
      checks: [
        { id: 'name_match', name: 'Name Match with Applicant', enabled: false, outputResponse: 'reject',
          fields: [
            { id: 'source', name: 'Name Source', type: 'select', value: '',
              options: [{ label: 'PAN', value: 'pan' }, { label: 'Aadhaar', value: 'aadhaar' }] },
            { id: 'threshold', name: 'Match Threshold %', type: 'number', value: 60 },
          ] },
        { id: 'employer_match', name: 'Employer Name Match (vs Declared)', enabled: false, outputResponse: 'reject',
          fields: [{ id: 'threshold', name: 'Match Threshold %', type: 'number', value: 70 }] },
      ],
      retryConfig: [
        { id: 'payslip_upload_retry', name: 'Payslip Upload Retry', maxAttempts: 3, coolingPeriod: 0, velocityCycle: 1 },
      ],
    },
    // 11 — ITR Fetch & Analysis
    {
      id: 'blk_itr', type: 'smart', blockTypeId: 'itr_fetch_analysis',
      name: 'ITR Verification', category: 'financial', provider: 'ITR Fetch (Online)',
      description: 'Fetch and analyse last 2 years ITR for self-employed (SEP / SENP) credit card applicants',
      configured: true, hasRetry: true,
      pages: [
        { id: 'itr_initiation', name: 'ITR Fetch Initiation Page', actions: ['ITR fetch initiated'], userInputs: [] },
        { id: 'itr_result', name: 'ITR Analysis Result Page', actions: ['ITR analysis complete'], userInputs: [] },
      ],
      generalConfig: [
        { id: 'number_of_years', name: 'Number of Years', type: 'select', value: '2',
          options: [{ label: '1 Year', value: '1' }, { label: '2 Years', value: '2' }, { label: '3 Years', value: '3' }, { label: '4 Years', value: '4' }] },
        { id: 'itr_type', name: 'ITR Type', type: 'select', value: 'itr_1',
          options: [{ label: 'ITR-1 (Sahaj)', value: 'itr_1' }, { label: 'ITR-2', value: 'itr_2' }, { label: 'ITR-3', value: 'itr_3' }, { label: 'ITR-4 (Sugam)', value: 'itr_4' }, { label: 'ITR-5', value: 'itr_5' }, { label: 'ITR-6', value: 'itr_6' }] },
      ],
      retryConfig: { maxAttempts: 3, coolingPeriod: 120, velocityCycle: 3 },
    },
    // 12 — Bank Statement Analysis
    {
      id: 'blk_bsa', type: 'smart', blockTypeId: 'bank_statement',
      name: 'Bank Statement Analysis', category: 'financial', provider: 'Insights',
      description: 'Analyse 6-month bank statements for average balance, salary credits, and liability obligations',
      configured: true, hasRetry: true,
      pages: [
        { id: 'bank_statement', name: 'Bank Statement Page', actions: ['Bank statement submitted'], userInputs: [] },
      ],
      checks: [
        { id: 'name_match', name: 'Name Match Configuration', enabled: false, outputResponse: 'reject',
          fields: [
            { id: 'source', name: 'Name Source Selection', type: 'select', value: '',
              options: [{ label: 'PAN', value: 'pan' }, { label: 'Aadhaar', value: 'aadhaar' }] },
            { id: 'threshold', name: 'Threshold %', type: 'number', value: 80 },
          ] },
      ],
      generalConfig: [
        { id: 'start_month', name: 'Start Month', type: 'select', value: '1',
          options: [{ label: 'January', value: '1' }, { label: 'February', value: '2' }, { label: 'March', value: '3' }, { label: 'April', value: '4' }, { label: 'May', value: '5' }, { label: 'June', value: '6' }, { label: 'July', value: '7' }, { label: 'August', value: '8' }, { label: 'September', value: '9' }, { label: 'October', value: '10' }, { label: 'November', value: '11' }, { label: 'December', value: '12' }] },
        { id: 'start_year', name: 'Start Year', type: 'select', value: '2024',
          options: [{ label: '2024', value: '2024' }, { label: '2025', value: '2025' }, { label: '2026', value: '2026' }] },
        { id: 'end_month', name: 'End Month', type: 'select', value: '12',
          options: [{ label: 'January', value: '1' }, { label: 'February', value: '2' }, { label: 'March', value: '3' }, { label: 'April', value: '4' }, { label: 'May', value: '5' }, { label: 'June', value: '6' }, { label: 'July', value: '7' }, { label: 'August', value: '8' }, { label: 'September', value: '9' }, { label: 'October', value: '10' }, { label: 'November', value: '11' }, { label: 'December', value: '12' }] },
        { id: 'end_year', name: 'End Year', type: 'select', value: '2026',
          options: [{ label: '2024', value: '2024' }, { label: '2025', value: '2025' }, { label: '2026', value: '2026' }] },
      ],
      retryConfig: { maxAttempts: 3, coolingPeriod: 120, velocityCycle: 3 },
    },
    // 13 — Credit Assessment Decision
    {
      id: 'blk_credit_decision', type: 'decision', name: 'Credit Assessment',
      description: 'Evaluate credit eligibility using CIBIL score from PAN step: score ≥ 740 = PASS, score = 0 (NAI) = FLAG, 0 < score < 740 = REJECT',
      configured: true,
      decisionConfig: {
        verdictStorageKey: 'custom.credit_verdict',
        verdictField: 'custom.credit_verdict',
        defaultVerdict: 'REJECT',
        verdictRoutes: { PASS: 'blk_credit_router', FLAG: 'blk_credit_router', REJECT: 'blk_rejection_end' },
        rules: [
          {
            id: 'rule_pass_score',
            conditions: [{ id: 'c_pass', field: 'credit_score', operator: '>=', value: '740' }],
            conditionOperator: 'AND', verdict: 'PASS', targetBlockId: 'blk_credit_router',
          },
          {
            id: 'rule_nai_score',
            conditions: [{ id: 'c_nai', field: 'credit_score', operator: '<=', value: '0' }],
            conditionOperator: 'AND', verdict: 'FLAG', targetBlockId: 'blk_credit_router',
          },
          {
            id: 'rule_reject_score',
            conditions: [
              { id: 'c_rej_lo', field: 'credit_score', operator: '>', value: '0' },
              { id: 'c_rej_hi', field: 'credit_score', operator: '<', value: '740' },
            ],
            conditionOperator: 'AND', verdict: 'REJECT', targetBlockId: 'blk_rejection_end',
          },
        ],
      },
    },
    // 14 — Credit Verdict Router
    {
      id: 'blk_credit_router', type: 'router', name: 'Credit Verdict Router',
      description: 'Route PASS and FLAG (NAI) applicants to pre-qualification; route REJECT to terminal state',
      configured: true, routerBranchType: 'exclusive', defaultRoute: 'blk_rejection_end',
      routings: [
        {
          id: 'route_eligible', label: 'Eligible (PASS or NAI)', routingType: 'condition', saved: true,
          conditionGroups: [{ id: 'cg_elig', operator: 'OR', conditions: [
            { id: 'c_pass', parameter: 'custom.credit_verdict', operator: '=', value: 'PASS', fieldType: 'text' },
            { id: 'c_flag', parameter: 'custom.credit_verdict', operator: '=', value: 'FLAG', fieldType: 'text' },
          ]}], targetBlockId: 'blk_prequal',
        },
        {
          id: 'route_ineligible', label: 'Rejected', routingType: 'condition', saved: true,
          conditionGroups: [{ id: 'cg_rej', operator: 'AND', conditions: [
            { id: 'c_rej', parameter: 'custom.credit_verdict', operator: '=', value: 'REJECT', fieldType: 'text' },
          ]}], targetBlockId: 'blk_rejection_end',
        },
      ],
    },
    // 15 — Pre-Qualification Offer
    {
      id: 'blk_prequal', type: 'smart', blockTypeId: 'offer_generation',
      name: 'Pre-Qualification Offer', category: 'decision',
      description: 'Generate eligible credit card offer with pre-approved credit limit based on BRE scoring output',
      configured: true, hasRetry: false,
      pages: [
        { id: 'generate_offer', name: 'Generate Offer - Loader', actions: ['Offer generation initiated'], userInputs: [] },
        { id: 'show_offer', name: 'Show Offer Page', actions: ['Offer displayed'], userInputs: [] },
      ],
      generalConfig: [
        { id: 'bre', name: 'Which BRE to Call', type: 'select', value: 'bre_v1',
          options: [{ label: 'BRE v1 - Standard', value: 'bre_v1' }, { label: 'BRE v2 - Advanced', value: 'bre_v2' }, { label: 'BRE v3 - Premium', value: 'bre_v3' }] },
        { id: 'product_type', name: 'Product Type', type: 'select', value: 'credit_card',
          options: [{ label: 'Lending (Loans)', value: 'lending' }, { label: 'Credit Card', value: 'credit_card' }] },
      ],
    },
    // 16 — Card Variant Selection
    {
      id: 'blk_card_selection', type: 'smart', blockTypeId: 'card_selection',
      name: 'Card Variant Selection', category: 'decision', provider: 'BRE Integration',
      description: 'Present BRE-eligible card variants for applicant to choose',
      configured: true, hasRetry: false,
      pages: [
        { id: 'show_eligible_cards', name: 'Card Selection Page', actions: ['Card selected'], userInputs: [] },
        { id: 'card_confirmed', name: 'Card Confirmation Page', actions: ['Selection confirmed'], userInputs: [] },
      ],
      generalConfig: [
        { id: 'selection_mode', name: 'Card Display Mode', type: 'select', value: 'bre_driven',
          options: [{ label: 'BRE-Driven (show eligible variants only)', value: 'bre_driven' }, { label: 'Show All (highlight eligible)', value: 'show_all' }] },
        { id: 'show_credit_limit', name: 'Show Approved Credit Limit per Variant', type: 'toggle', value: true },
        { id: 'allow_downgrade', name: 'Allow Customer to Select Lower Tier Card', type: 'toggle', value: true },
      ],
    },
    // 17 — Card Preferences
    {
      id: 'blk_card_prefs', type: 'form', name: 'Card Preferences',
      description: 'Capture add-on card request and card embossing name in a single two-page form',
      configured: true, journeyState: 'card_preferences',
      pages: [
        {
          id: 'pg_addon', name: 'Add-On Card',
          userInputs: [
            { id: 'inp_addon_req',  key: 'addon_card_required',   label: 'Request Add-On Card?',        type: 'select', required: true,  fieldSource: 'custom' },
            { id: 'inp_addon_name', key: 'addon_cardholder_name', label: 'Add-On Cardholder Name',      type: 'text',   required: false, fieldSource: 'custom' },
            { id: 'inp_addon_rel',  key: 'addon_relationship',    label: 'Relationship to Primary',     type: 'select', required: false, fieldSource: 'custom' },
          ],
        },
        {
          id: 'pg_embossing', name: 'Card Embossing',
          userInputs: [
            { id: 'inp_emb_name', key: 'embossing_name',        label: 'Name on Card (max 26 chars)', type: 'text',   required: true,  fieldSource: 'custom',
              validations: [{ id: 'val_max', type: 'max_length', value: '26' }] },
            { id: 'inp_delivery', key: 'delivery_address_type', label: 'Card Delivery Address',       type: 'select', required: true,  fieldSource: 'custom' },
          ],
        },
      ],
    },
    // 18 — MITC / KFS Document
    {
      id: 'blk_mitc', type: 'smart', blockTypeId: 'kfs_document',
      name: 'MITC / KFS Document', category: 'fulfilment',
      description: 'Display Key Facts Statement and Most Important Terms & Conditions for the selected credit card variant',
      configured: true, hasRetry: false,
      pages: [
        { id: 'display_kfs', name: 'KFS Display Page', actions: ['KFS displayed'], userInputs: [] },
      ],
      generalConfig: [
        { id: 'template_id', name: 'KFS Template Selection', type: 'select', value: 'kfs_credit_card_mitc',
          options: [
            { label: 'Personal Loan KFS', value: 'kfs_personal_loan' },
            { label: 'Home Loan KFS', value: 'kfs_home_loan' },
            { label: 'Business Loan KFS', value: 'kfs_business_loan' },
            { label: 'Two-Wheeler Loan KFS', value: 'kfs_two_wheeler_loan' },
            { label: 'Credit Card MITC', value: 'kfs_credit_card_mitc' },
          ] },
      ],
    },
    // 19 — Final Consent
    {
      id: 'blk_consent', type: 'form', name: 'Final Consent',
      description: 'Collect explicit consent for credit card issuance, bureau enquiry, and auto-debit mandate',
      configured: true, journeyState: 'final_consent',
      pages: [
        {
          id: 'pg_consent', name: 'Consent & Declarations',
          userInputs: [
            { id: 'inp_con_terms',  key: 'consent_terms',      label: 'I agree to the Terms & Conditions',                type: 'select', required: true,  fieldSource: 'custom' },
            { id: 'inp_con_bureau', key: 'consent_bureau',     label: 'I consent to credit bureau enquiry',               type: 'select', required: true,  fieldSource: 'custom' },
            { id: 'inp_con_debit',  key: 'consent_auto_debit', label: 'Authorise bank for auto-debit on due date',        type: 'select', required: true,  fieldSource: 'custom' },
            { id: 'inp_con_mktg',   key: 'consent_marketing',  label: 'I consent to marketing communications (optional)', type: 'select', required: false, fieldSource: 'custom' },
          ],
        },
      ],
    },
    // 20 — Application eSign
    {
      id: 'blk_esign', type: 'smart', blockTypeId: 'esign',
      name: 'Application eSign', category: 'fulfilment', provider: 'TKYC',
      description: 'Digital signing of credit card application form via Aadhaar OTP eSign',
      configured: true, hasRetry: true,
      pages: [
        { id: 'esign_initiation', name: 'eSign Initiation Page', actions: ['eSign initiated'], userInputs: [] },
        { id: 'esign_completion', name: 'eSign Completion Page', actions: ['Document signed'], userInputs: [] },
      ],
      generalConfig: [
        { id: 'template_id', name: 'Document Template Selection', type: 'select', value: 'esign_credit_card',
          options: [
            { label: 'Personal Loan Agreement', value: 'esign_personal_loan' },
            { label: 'Home Loan Agreement', value: 'esign_home_loan' },
            { label: 'Business Loan Agreement', value: 'esign_business_loan' },
            { label: 'Overdraft Agreement', value: 'esign_overdraft' },
            { label: 'Credit Card Application Form', value: 'esign_credit_card' },
          ] },
      ],
      retryConfig: { maxAttempts: 3, coolingPeriod: 120, velocityCycle: 3 },
    },
    // 21 — Post eSign Router
    {
      id: 'blk_post_esign_router', type: 'router', name: 'Post eSign Router',
      description: 'Route ETB customers to completion (no VKYC); route NTB customers to mandatory video KYC',
      configured: true, routerBranchType: 'exclusive', defaultRoute: 'blk_vkyc',
      routings: [
        {
          id: 'route_etb_done', label: 'ETB — Skip VKYC', routingType: 'condition', saved: true,
          conditionGroups: [{ id: 'cg_etb_done', operator: 'AND', conditions: [{ id: 'c_etb_done', parameter: 'is_etb', operator: '=', value: 'true', fieldType: 'text' }] }], targetBlockId: 'blk_etb_end',
        },
        {
          id: 'route_ntb_vkyc', label: 'NTB — Proceed to VKYC', routingType: 'condition', saved: true,
          conditionGroups: [{ id: 'cg_ntb_vkyc', operator: 'AND', conditions: [{ id: 'c_ntb_vkyc', parameter: 'is_etb', operator: '=', value: 'false', fieldType: 'text' }] }], targetBlockId: 'blk_vkyc',
        },
      ],
    },
    // 22 — ETB Success End
    {
      id: 'blk_etb_end', type: 'end', name: 'Application Successful (ETB)',
      description: 'Terminal success state for existing bank customers — card issuance order placed in CMS',
      configured: true, journeyState: 'ETB_COMPLETE',
    },
    // 23 — Video KYC
    {
      id: 'blk_vkyc', type: 'smart', blockTypeId: 'vkyc',
      name: 'Video KYC', category: 'identity', provider: 'VKYC Vendor',
      description: 'Mandatory video KYC for NTB customers — must be completed within 3 working days of eSign',
      configured: true, hasRetry: false,
      pages: [
        { id: 'vkyc_schedule', name: 'VKYC Slot Scheduling Page', actions: ['VKYC slot scheduled'], userInputs: [] },
        { id: 'vkyc_instructions', name: 'VKYC Instructions & Requirements Page', actions: ['VKYC initiated'], userInputs: [] },
        { id: 'vkyc_result', name: 'VKYC Outcome Page', actions: ['VKYC completed'], userInputs: [] },
      ],
      checks: [
        { id: 'vkyc_completion', name: 'VKYC Session Completion Required', enabled: true, outputResponse: 'reject', fields: [] },
        { id: 'face_match', name: 'Face Match (vs Aadhaar Photo)', enabled: true, outputResponse: 'reject',
          fields: [{ id: 'threshold', name: 'Match Threshold %', type: 'number', value: 80 }] },
        { id: 'liveness_check', name: 'Liveness Detection', enabled: true, outputResponse: 'reject', fields: [] },
        { id: 'document_visibility', name: 'Original Document Visibility (PAN + Aadhaar)', enabled: true, outputResponse: 'reject', fields: [] },
      ],
      generalConfig: [
        { id: 'completion_window_days', name: 'Completion Window (Working Days)', type: 'number', value: 3 },
        { id: 'expiry_window_days', name: 'Expiry After No-Show (Working Days)', type: 'number', value: 7 },
        { id: 'max_reschedules', name: 'Max Reschedules Allowed', type: 'number', value: 2 },
        { id: 'available_hours', name: 'Available Slot Hours', type: 'select', value: '9am_6pm',
          options: [{ label: '9 AM — 6 PM (Mon–Sat)', value: '9am_6pm' }, { label: '9 AM — 8 PM (Mon–Sat)', value: '9am_8pm' }, { label: '9 AM — 6 PM (Mon–Sun)', value: '9am_6pm_all' }] },
      ],
    },
    // 24 — NTB Success End
    {
      id: 'blk_ntb_end', type: 'end', name: 'Application Successful (NTB)',
      description: 'Terminal success state for NTB customers after VKYC completion — card issuance order placed',
      configured: true, journeyState: 'NTB_COMPLETE',
    },
    // 25 — Rejection Terminal State
    {
      id: 'blk_rejection_end', type: 'end', name: 'Application Rejected',
      description: 'Terminal state for rejected credit card applications — rejection SMS/email triggered',
      configured: true, journeyState: 'REJECTED',
    },
  ] as BlockData[];
}

// --- The exact 20 SA blocks (wf5 clone with original sab_ IDs) ---
function getSABaseBlocks(): BlockData[] {
  return [
    // 1 — Journey Start
    {
      id: 'sab_start', type: 'start', name: 'Journey Start',
      description: 'Savings account application entry via web channel with mobile OTP authentication',
      configured: true,
      entrySource: 'web', authRequired: true, authMethod: 'otp',
      collectConsent: true, consentScope: 'Terms & Conditions, Privacy Policy, Product T&C',
      prefillSource: 'none', passthroughParams: [], startWebhookEnabled: false,
    },
    // 2 — PAN Verification
    {
      id: 'sab_pan', type: 'smart', blockTypeId: 'pan_verification',
      name: 'PAN Verification', category: 'identity', provider: 'PAN Profile Detailed API',
      description: 'PAN verification with AML, CFR, age and pincode checks. CBS dedupe by mobile detects ETB/NTB. CERSAI C-KYC runs silently for address pre-fill.',
      configured: true, hasRetry: true,
      pages: [
        { id: 'pan_input', name: 'PAN Input Page', actions: ['PAN initiated'], userInputs: [{ id: 'pan_number', name: 'PAN Number', type: 'text', dataType: 'STRING', required: true }] },
        { id: 'pan_confirmed', name: 'PAN Confirmed Page', actions: ['PAN verified', 'PAN submitted'], userInputs: [] },
      ],
      generalConfig: [
        { id: 'service_provider', name: 'PAN Verification Provider', type: 'select', value: 'pan_profile_detailed',
          options: [{ label: 'PAN Profile Detailed API', value: 'pan_profile_detailed' }, { label: 'NSDL Protean', value: 'nsdl_protean' }] },
      ],
      checks: [
        { id: 'aml_check', name: 'AML Check', enabled: true, outputResponse: 'reject', fields: [] },
        { id: 'cfr_check', name: 'CFR Check', enabled: true, outputResponse: 'reject', fields: [
          { id: 'master_code', name: 'Configure Master Code', type: 'select', value: 'cfr_master_1', options: [{ label: 'CFR Master 1', value: 'cfr_master_1' }, { label: 'CFR Master 2', value: 'cfr_master_2' }, { label: 'CFR Master 3', value: 'cfr_master_3' }] },
          { id: 'column_field', name: 'Column Field Name', type: 'dependent-select', value: '', dependsOn: 'master_code', masterColumns: { cfr_master_1: [{ label: 'Applicant ID', value: 'applicant_id', isPrimaryKey: true, dataType: 'Integer' }, { label: 'PAN Number', value: 'pan_number', isPrimaryKey: false, dataType: 'String' }, { label: 'CFR Score', value: 'cfr_score', isPrimaryKey: false, dataType: 'Float' }, { label: 'Risk Category', value: 'risk_category', isPrimaryKey: false, dataType: 'String' }], cfr_master_2: [{ label: 'Customer ID', value: 'customer_id', isPrimaryKey: true, dataType: 'Integer' }, { label: 'Full Name', value: 'full_name', isPrimaryKey: false, dataType: 'String' }, { label: 'CFR Flag', value: 'cfr_flag', isPrimaryKey: false, dataType: 'Boolean' }, { label: 'Check Date', value: 'check_date', isPrimaryKey: false, dataType: 'Date' }], cfr_master_3: [{ label: 'Record ID', value: 'record_id', isPrimaryKey: true, dataType: 'Integer' }, { label: 'Bureau Ref', value: 'bureau_ref', isPrimaryKey: false, dataType: 'String' }, { label: 'Fraud Indicator', value: 'fraud_indicator', isPrimaryKey: false, dataType: 'Boolean' }, { label: 'Source System', value: 'source_system', isPrimaryKey: false, dataType: 'String' }] } },
        ]},
        { id: 'age_check', name: 'Age Check', enabled: true, outputResponse: 'reject', fields: [
          { id: 'min_age', name: 'Minimum Age', type: 'number', value: 18 },
          { id: 'max_age', name: 'Maximum Age', type: 'number', value: 70 },
        ]},
        { id: 'pincode_check', name: 'Serviceable Pincode Check', enabled: true, outputResponse: 'reject', fields: [
          { id: 'master_code', name: 'Configure Master Code', type: 'select', value: 'pincode_master_1', options: [{ label: 'Pincode Master 1', value: 'pincode_master_1' }, { label: 'Pincode Master 2', value: 'pincode_master_2' }, { label: 'Pincode Master 3', value: 'pincode_master_3' }] },
          { id: 'column_field', name: 'Column Field Name', type: 'dependent-select', value: '', dependsOn: 'master_code', masterColumns: { pincode_master_1: [{ label: 'Pincode', value: 'pincode', isPrimaryKey: true, dataType: 'String' }, { label: 'City', value: 'city', isPrimaryKey: false, dataType: 'String' }, { label: 'State', value: 'state', isPrimaryKey: false, dataType: 'String' }, { label: 'Is Serviceable', value: 'is_serviceable', isPrimaryKey: false, dataType: 'Boolean' }], pincode_master_2: [{ label: 'Zip Code', value: 'zip_code', isPrimaryKey: true, dataType: 'String' }, { label: 'District', value: 'district', isPrimaryKey: false, dataType: 'String' }, { label: 'Region', value: 'region', isPrimaryKey: false, dataType: 'String' }, { label: 'Service Type', value: 'service_type', isPrimaryKey: false, dataType: 'String' }], pincode_master_3: [{ label: 'Postal Code', value: 'postal_code', isPrimaryKey: true, dataType: 'String' }, { label: 'Tier', value: 'tier', isPrimaryKey: false, dataType: 'String' }, { label: 'Coverage Area', value: 'coverage_area', isPrimaryKey: false, dataType: 'String' }, { label: 'Is Active', value: 'is_active', isPrimaryKey: false, dataType: 'Boolean' }] } },
        ]},
      ],
      retryConfig: { maxAttempts: 3, coolingPeriod: 300, velocityCycle: 1 },
      dataHooks: [
        {
          id: 'hook_sab_pan_post', eventKey: 'after_pan_input', eventLabel: 'After PAN Input',
          apis: [
            {
              id: 'sab_dhapi_cbs_dedupe', apiId: 'cbs_dedupe_mobile', apiName: 'CBS Dedupe by Mobile',
              trigger: 'after_block_complete', latencyP95Ms: 600,
              inputMappings: [
                { requestPath: 'mobile_number', label: 'Mobile Number', sourceType: 'native', sourceValue: 'mobile_number', isAutoMapped: true },
              ],
              outputCaptures: [
                { id: 'oc_is_etb',   path: 'data.is_etb',      label: 'Is ETB Customer',      storeType: 'custom', storeName: 'is_etb' },
                { id: 'oc_cbs_cust', path: 'data.customer_id', label: 'CBS Customer ID (ETB)', storeType: 'custom', storeName: 'existing_customer_id' },
              ],
            },
            {
              id: 'sab_dhapi_lms_dedupe', apiId: 'lms_dedupe', apiName: 'LMS Dedupe',
              trigger: 'after_block_complete', latencyP95Ms: 400,
              inputMappings: [
                { requestPath: 'pan_number',    label: 'PAN Number',    sourceType: 'native', sourceValue: 'pan_number',    isAutoMapped: true },
                { requestPath: 'mobile_number', label: 'Mobile Number', sourceType: 'native', sourceValue: 'mobile_number', isAutoMapped: true },
              ],
              outputCaptures: [
                { id: 'oc_lms_exists', path: 'data.lead_exists', label: 'LMS Lead Exists',      storeType: 'custom', storeName: 'lms_lead_exists' },
                { id: 'oc_lms_id',     path: 'data.lead_id',     label: 'Existing LMS Lead ID', storeType: 'custom', storeName: 'existing_lms_lead_id' },
              ],
            },
            {
              id: 'sab_dhapi_ckyc', apiId: 'cersai_ckyc_fetch', apiName: 'CERSAI C-KYC Fetch',
              trigger: 'after_block_complete', latencyP95Ms: 1200,
              inputMappings: [
                { requestPath: 'pan_number',    label: 'PAN Number',    sourceType: 'native', sourceValue: 'pan_number',    isAutoMapped: true },
                { requestPath: 'full_name',     label: 'Full Name',     sourceType: 'native', sourceValue: 'customer_name', isAutoMapped: true },
                { requestPath: 'date_of_birth', label: 'Date of Birth', sourceType: 'native', sourceValue: 'date_of_birth', isAutoMapped: true },
              ],
              outputCaptures: [
                { id: 'oc_ckyc_id',      path: 'data.ckyc_number', label: 'C-KYC Number',          storeType: 'custom', storeName: 'ckyc_number' },
                { id: 'oc_ckyc_found',   path: 'data.ckyc_found',  label: 'C-KYC Record Found',     storeType: 'custom', storeName: 'ckyc_found' },
                { id: 'oc_ckyc_address', path: 'data.address',     label: 'C-KYC Address Pre-fill', storeType: 'native', storeName: 'address' },
              ],
            },
            {
              id: 'sab_dhapi_lead_create', apiId: 'lms_lead_create', apiName: 'LMS Lead ID Creation',
              trigger: 'after_block_complete', latencyP95Ms: 500,
              inputMappings: [
                { requestPath: 'pan_number',    label: 'PAN Number',    sourceType: 'native', sourceValue: 'pan_number',    isAutoMapped: true },
                { requestPath: 'mobile_number', label: 'Mobile Number', sourceType: 'native', sourceValue: 'mobile_number', isAutoMapped: true },
                { requestPath: 'is_etb',        label: 'Is ETB',        sourceType: 'custom', sourceValue: 'is_etb',        isAutoMapped: false },
                { requestPath: 'program_code',  label: 'Program Code',  sourceType: 'static', sourceValue: 'SA_STP_01',    isAutoMapped: false },
              ],
              outputCaptures: [
                { id: 'oc_lead_id', path: 'data.lead_id', label: 'LMS Lead ID', storeType: 'custom', storeName: 'lead_id' },
              ],
            },
          ],
        },
      ],
    },
    // 3 — Entry Router
    {
      id: 'sab_entry_router', type: 'router', name: 'Entry Router',
      description: 'Route ETB customers to CBS pre-filled profile review; route NTB customers to Aadhaar eKYC. LMS Lead ID created after routing.',
      configured: true, routerBranchType: 'exclusive', defaultRoute: 'sab_aadhaar',
      routings: [
        {
          id: 'route_sa_etb', label: 'ETB Customer -> Profile Review', routingType: 'condition', saved: true,
          conditionGroups: [{ id: 'cg_sa_etb', operator: 'AND', conditions: [{ id: 'c_sa_etb', parameter: 'is_etb', operator: '=', value: 'true', fieldType: 'text' }] }],
          targetBlockId: 'sab_etb_profile',
        },
      ],
    },
    // 4 — ETB Customer Profile
    {
      id: 'sab_etb_profile', type: 'form', name: 'ETB Customer Profile',
      description: 'Review and confirm CBS pre-filled personal, contact and address details for existing bank customers',
      configured: true, journeyState: 'etb_profile_review',
      pages: [
        {
          id: 'pg_sa_etb_personal', name: 'Personal Information',
          userInputs: [
            { id: 'inp_etb_name',     key: 'customer_name',     label: 'Full Name',     type: 'text',   required: true,  fieldSource: 'native' },
            { id: 'inp_etb_dob',      key: 'date_of_birth',     label: 'Date of Birth', type: 'date',   required: true,  fieldSource: 'native' },
            { id: 'inp_etb_pan',      key: 'pan_number',        label: 'PAN Number',    type: 'text',   required: true,  fieldSource: 'native' },
            { id: 'inp_etb_gender',   key: 'gender',            label: 'Gender',        type: 'select', required: true,  fieldSource: 'native' },
            { id: 'inp_etb_category', key: 'customer_category', label: 'Category',      type: 'select', required: true,  fieldSource: 'native' },
          ],
        },
        {
          id: 'pg_sa_etb_contact', name: 'Contact Details',
          userInputs: [
            { id: 'inp_etb_mobile', key: 'mobile_number', label: 'Mobile Number', type: 'tel',   required: true, fieldSource: 'native' },
            { id: 'inp_etb_email',  key: 'email_id',      label: 'Email Address', type: 'email', required: true, fieldSource: 'native' },
          ],
        },
        {
          id: 'pg_sa_etb_address', name: 'Address',
          userInputs: [
            { id: 'inp_etb_addr',    key: 'address_line_1', label: 'Address Line 1', type: 'text', required: true,  fieldSource: 'native' },
            { id: 'inp_etb_city',    key: 'city',           label: 'City',           type: 'text', required: true,  fieldSource: 'native' },
            { id: 'inp_etb_state',   key: 'state',          label: 'State',          type: 'text', required: true,  fieldSource: 'native' },
            { id: 'inp_etb_pincode', key: 'pincode',        label: 'Pincode',        type: 'text', required: true,  fieldSource: 'native' },
          ],
        },
      ],
    },
    // 5 — Aadhaar OTP eKYC
    {
      id: 'sab_aadhaar', type: 'smart', blockTypeId: 'aadhaar_verification',
      name: 'Aadhaar OTP eKYC', category: 'identity', provider: 'DigiLocker',
      description: 'OTP-based Aadhaar eKYC for NTB customers. Aadhaar XML fetched — number never stored, ARK retained in Vault.',
      configured: true, hasRetry: true,
      pages: [
        { id: 'aadhaar_info',      name: 'Aadhaar Info Page',     actions: ['Confirm Aadhaar Details'], userInputs: [] },
        { id: 'aadhaar_otp_input', name: 'Aadhaar OTP Input Page', actions: ['Aadhaar OTP verified'],
          userInputs: [{ id: 'aadhaar_number', name: 'Aadhaar Number', type: 'text', dataType: 'STRING', required: true }] },
      ],
      generalConfig: [
        { id: 'service_provider', name: 'Service Provider', type: 'select', value: 'otp_ekyc',
          options: [{ label: 'DigiLocker', value: 'digilocker' }, { label: 'OTP eKYC (UIDAI)', value: 'otp_ekyc' }] },
      ],
      checks: [
        { id: 'mobile_linkage', name: 'Aadhaar Mobile Linkage Check', enabled: true, outputResponse: 'reject', fields: [] },
        { id: 'age_check', name: 'Age Check', enabled: true, outputResponse: 'reject',
          fields: [{ id: 'min_age', name: 'Minimum Age', type: 'number', value: 18 }, { id: 'max_age', name: 'Maximum Age', type: 'number', value: 70 }] },
        { id: 'pincode_check', name: 'Serviceable Pincode Check', enabled: false, outputResponse: 'reject', fields: [
          { id: 'master_code', name: 'Configure Master Code', type: 'select', value: 'pincode_master_1',
            options: [{ label: 'Pincode Master 1', value: 'pincode_master_1' }, { label: 'Pincode Master 2', value: 'pincode_master_2' }, { label: 'Pincode Master 3', value: 'pincode_master_3' }] },
          { id: 'column_field', name: 'Column Field Name', type: 'dependent-select', value: '', dependsOn: 'master_code',
            masterColumns: {
              pincode_master_1: [{ label: 'Pincode', value: 'pincode', isPrimaryKey: true, dataType: 'String' }, { label: 'City', value: 'city', isPrimaryKey: false, dataType: 'String' }, { label: 'State', value: 'state', isPrimaryKey: false, dataType: 'String' }, { label: 'Is Serviceable', value: 'is_serviceable', isPrimaryKey: false, dataType: 'Boolean' }],
              pincode_master_2: [{ label: 'Zip Code', value: 'zip_code', isPrimaryKey: true, dataType: 'String' }, { label: 'District', value: 'district', isPrimaryKey: false, dataType: 'String' }, { label: 'Region', value: 'region', isPrimaryKey: false, dataType: 'String' }, { label: 'Service Type', value: 'service_type', isPrimaryKey: false, dataType: 'String' }],
              pincode_master_3: [{ label: 'Postal Code', value: 'postal_code', isPrimaryKey: true, dataType: 'String' }, { label: 'Tier', value: 'tier', isPrimaryKey: false, dataType: 'String' }, { label: 'Coverage Area', value: 'coverage_area', isPrimaryKey: false, dataType: 'String' }, { label: 'Is Active', value: 'is_active', isPrimaryKey: false, dataType: 'Boolean' }],
            } },
        ]},
      ],
      retryConfig: { maxAttempts: 3, coolingPeriod: 120, velocityCycle: 3 },
    },
    // 6 — NTB Personal Details
    {
      id: 'sab_ntb_personal', type: 'form', name: 'NTB Personal Details',
      description: 'Collect additional personal details for NTB customers — pre-filled from Aadhaar where available. Includes place of birth per BRD requirement.',
      configured: true, journeyState: 'ntb_personal_collection',
      pages: [
        {
          id: 'pg_sa_ntb_personal', name: 'Personal Information',
          userInputs: [
            { id: 'inp_ntb_name',     key: 'customer_name',     label: 'Full Name',       type: 'text',   required: true,  fieldSource: 'native' },
            { id: 'inp_ntb_dob',      key: 'date_of_birth',     label: 'Date of Birth',   type: 'date',   required: true,  fieldSource: 'native' },
            { id: 'inp_ntb_gender',   key: 'gender',            label: 'Gender',          type: 'select', required: true,  fieldSource: 'native' },
            { id: 'inp_ntb_father',   key: 'father_name',       label: 'Father Name',     type: 'text',   required: true,  fieldSource: 'custom' },
            { id: 'inp_ntb_mother',   key: 'mother_name',       label: 'Mother Name',     type: 'text',   required: true,  fieldSource: 'custom' },
            { id: 'inp_ntb_pob',      key: 'place_of_birth',    label: 'Place of Birth',  type: 'text',   required: true,  fieldSource: 'custom' },
            { id: 'inp_ntb_category', key: 'customer_category', label: 'Category',        type: 'select', required: true,  fieldSource: 'custom' },
            { id: 'inp_ntb_marital',  key: 'marital_status',    label: 'Marital Status',  type: 'select', required: true,  fieldSource: 'custom' },
          ],
        },
        {
          id: 'pg_sa_ntb_contact', name: 'Contact Details',
          userInputs: [
            { id: 'inp_ntb_mobile',     key: 'mobile_number', label: 'Mobile Number',    type: 'tel',   required: true,  fieldSource: 'native' },
            { id: 'inp_ntb_alt_mobile', key: 'alt_mobile',    label: 'Alternate Mobile', type: 'tel',   required: false, fieldSource: 'custom' },
            { id: 'inp_ntb_email',      key: 'email_id',      label: 'Email Address',    type: 'email', required: true,  fieldSource: 'custom' },
          ],
        },
        {
          id: 'pg_sa_ntb_address', name: 'Address',
          userInputs: [
            { id: 'inp_ntb_addr1',     key: 'address_line_1', label: 'Address Line 1', type: 'text',   required: true,  fieldSource: 'native' },
            { id: 'inp_ntb_addr2',     key: 'address_line_2', label: 'Address Line 2', type: 'text',   required: false, fieldSource: 'native' },
            { id: 'inp_ntb_city',      key: 'city',           label: 'City',           type: 'text',   required: true,  fieldSource: 'native' },
            { id: 'inp_ntb_state',     key: 'state',          label: 'State',          type: 'text',   required: true,  fieldSource: 'native' },
            { id: 'inp_ntb_pincode',   key: 'pincode',        label: 'Pincode',        type: 'text',   required: true,  fieldSource: 'native' },
            { id: 'inp_ntb_comm_same', key: 'comm_addr_same', label: 'Communication Address Same as Aadhaar Address', type: 'select', required: true, fieldSource: 'custom' },
          ],
        },
      ],
    },
    // 7 — ETB / NTB Merge
    {
      id: 'sab_merge', type: 'merge', name: 'ETB / NTB Merge',
      description: 'Converge ETB and NTB paths into single common journey flow',
      configured: true,
    },
    // 8 — Branch & Nominee Details
    {
      id: 'sab_branch_nominee', type: 'form', name: 'Branch & Nominee Details',
      description: 'Capture preferred branch for account opening and nominee details for the savings account',
      configured: true, journeyState: 'branch_nominee_collection',
      pages: [
        {
          id: 'pg_sa_branch', name: 'Branch Preference',
          userInputs: [
            { id: 'inp_branch_code', key: 'branch_code', label: 'Preferred Branch Code', type: 'text', required: true,  fieldSource: 'custom' },
            { id: 'inp_branch_name', key: 'branch_name', label: 'Branch Name',           type: 'text', required: false, fieldSource: 'custom' },
            { id: 'inp_branch_city', key: 'branch_city', label: 'Branch City',           type: 'text', required: false, fieldSource: 'custom' },
          ],
        },
        {
          id: 'pg_sa_nominee', name: 'Nominee Details',
          userInputs: [
            { id: 'inp_nom_name',     key: 'nominee_name',     label: 'Nominee Full Name',          type: 'text',   required: true,  fieldSource: 'custom' },
            { id: 'inp_nom_relation', key: 'nominee_relation', label: 'Relationship with Nominee',  type: 'select', required: true,  fieldSource: 'custom' },
            { id: 'inp_nom_dob',      key: 'nominee_dob',      label: 'Nominee Date of Birth',      type: 'date',   required: true,  fieldSource: 'custom' },
            { id: 'inp_nom_addr',     key: 'nominee_address',  label: 'Nominee Address',            type: 'text',   required: true,  fieldSource: 'custom' },
            { id: 'inp_nom_guardian', key: 'guardian_name',    label: 'Guardian Name (if minor)',   type: 'text',   required: false, fieldSource: 'custom' },
          ],
        },
      ],
    },
    // 9 — BRE Scheme Selection
    {
      id: 'sab_bre', type: 'smart', blockTypeId: 'offer_generation',
      name: 'BRE Scheme Selection', category: 'decision', provider: 'BRE Integration',
      description: 'BRE determines eligible savings scheme code (SB101–SB190) based on age, gender, employment and income. Customer previews scheme before eSign.',
      configured: true, hasRetry: false,
      pages: [
        { id: 'generate_offer', name: 'Scheme Evaluation — Loader', actions: ['Scheme evaluation initiated'], userInputs: [] },
        { id: 'show_offer',     name: 'Scheme Preview Page',        actions: ['Scheme displayed', 'Scheme accepted'], userInputs: [] },
      ],
      generalConfig: [
        { id: 'bre', name: 'Which BRE to Call', type: 'select', value: 'bre_v1',
          options: [{ label: 'BRE v1 - Standard', value: 'bre_v1' }, { label: 'BRE v2 - Advanced', value: 'bre_v2' }, { label: 'BRE v3 - Premium', value: 'bre_v3' }] },
        { id: 'product_type', name: 'Product Type', type: 'select', value: 'savings_account',
          options: [{ label: 'Lending (Loans)', value: 'lending' }, { label: 'Credit Card', value: 'credit_card' }, { label: 'Savings Account', value: 'savings_account' }] },
      ],
    },
    // 10 — Value Added Services
    {
      id: 'sab_vas', type: 'form', name: 'Value Added Services',
      description: 'Customer selects debit card variant, cheque book, SMS alerts, and optional insurance cover',
      configured: true, journeyState: 'vas_selection',
      pages: [
        {
          id: 'pg_sa_vas', name: 'Value Added Services',
          userInputs: [
            { id: 'inp_vas_card',      key: 'debit_card_variant', label: 'Debit Card Variant',       type: 'select', required: true,  fieldSource: 'custom' },
            { id: 'inp_vas_cheque',    key: 'cheque_book',        label: 'Cheque Book Required',     type: 'select', required: true,  fieldSource: 'custom' },
            { id: 'inp_vas_sms',       key: 'sms_alerts',         label: 'SMS Alerts',               type: 'select', required: true,  fieldSource: 'custom' },
            { id: 'inp_vas_insurance', key: 'accident_insurance', label: 'Accident Insurance Cover', type: 'select', required: false, fieldSource: 'custom' },
          ],
        },
      ],
    },
    // 11 — FATCA + PEP + Terms
    {
      id: 'sab_fatca', type: 'form', name: 'FATCA, PEP & Terms',
      description: 'Regulatory declarations — FATCA (US person), PEP, source of funds, annual income, and T&C acceptance',
      configured: true, journeyState: 'fatca_pep_tnc',
      pages: [
        {
          id: 'pg_sa_fatca', name: 'Regulatory Declarations',
          userInputs: [
            { id: 'inp_fatca_us',      key: 'is_us_person',              label: 'Are you a US Person / US Tax Resident?', type: 'select', required: true,  fieldSource: 'custom' },
            { id: 'inp_fatca_tax_id',  key: 'tax_identification_number', label: 'Tax Identification Number (TIN)',         type: 'text',   required: false, fieldSource: 'custom' },
            { id: 'inp_fatca_country', key: 'tax_country',               label: 'Country of Tax Residence',               type: 'select', required: false, fieldSource: 'custom' },
            { id: 'inp_pep',           key: 'is_pep',                    label: 'Are you a Politically Exposed Person?',  type: 'select', required: true,  fieldSource: 'custom' },
            { id: 'inp_pep_related',   key: 'is_pep_related',            label: 'Are you related to a PEP?',              type: 'select', required: true,  fieldSource: 'custom' },
          ],
        },
        {
          id: 'pg_sa_tnc', name: 'Source of Funds & Terms',
          userInputs: [
            { id: 'inp_sof',    key: 'source_of_funds',     label: 'Source of Funds',                                               type: 'select', required: true, fieldSource: 'custom' },
            { id: 'inp_income', key: 'annual_income_range',  label: 'Annual Income Range',                                           type: 'select', required: true, fieldSource: 'custom' },
            { id: 'inp_tnc',    key: 'tnc_accepted',         label: 'I accept the Terms & Conditions and Deposit Account Agreement', type: 'select', required: true, fieldSource: 'custom' },
          ],
        },
      ],
    },
    // 12 — eSign
    {
      id: 'sab_esign', type: 'smart', blockTypeId: 'esign',
      name: 'eSign — Account Opening Form', category: 'fulfilment', provider: 'TKYC',
      description: 'Digital signing of Savings Account Opening Form via Aadhaar OTP eSign. Triggers CBS account creation chain, banking registrations, and DMS Push 1 post signing.',
      configured: true, hasRetry: true,
      pages: [
        { id: 'esign_initiation', name: 'eSign Initiation Page', actions: ['eSign initiated'], userInputs: [] },
        { id: 'esign_completion', name: 'eSign Completion Page', actions: ['Document signed'],  userInputs: [] },
      ],
      generalConfig: [
        { id: 'template_id', name: 'Document Template Selection', type: 'select', value: 'esign_savings_account',
          options: [
            { label: 'Personal Loan Agreement',      value: 'esign_personal_loan' },
            { label: 'Home Loan Agreement',          value: 'esign_home_loan' },
            { label: 'Business Loan Agreement',      value: 'esign_business_loan' },
            { label: 'Overdraft Agreement',          value: 'esign_overdraft' },
            { label: 'Credit Card Application Form', value: 'esign_credit_card' },
            { label: 'Savings Account Opening Form', value: 'esign_savings_account' },
          ] },
      ],
      retryConfig: { maxAttempts: 3, coolingPeriod: 120, velocityCycle: 3 },
      dataHooks: [
        {
          id: 'hook_sab_post_esign', eventKey: 'after_esign_completion_page', eventLabel: 'After eSign Completion Page',
          apis: [
            {
              id: 'sab_dhapi_cbs_cust', apiId: 'cbs_customer_create', apiName: 'CBS Customer ID Creation (NTB)',
              trigger: 'after_block_complete', latencyP95Ms: 1000,
              inputMappings: [
                { requestPath: 'full_name',     label: 'Full Name',     sourceType: 'native', sourceValue: 'customer_name',  isAutoMapped: true },
                { requestPath: 'date_of_birth', label: 'Date of Birth', sourceType: 'native', sourceValue: 'date_of_birth',  isAutoMapped: true },
                { requestPath: 'pan_number',    label: 'PAN Number',    sourceType: 'native', sourceValue: 'pan_number',     isAutoMapped: true },
                { requestPath: 'mobile_number', label: 'Mobile Number', sourceType: 'native', sourceValue: 'mobile_number',  isAutoMapped: true },
                { requestPath: 'gender',        label: 'Gender',        sourceType: 'native', sourceValue: 'gender',         isAutoMapped: true },
                { requestPath: 'address',       label: 'Address',       sourceType: 'native', sourceValue: 'address_line_1', isAutoMapped: true },
              ],
              outputCaptures: [
                { id: 'oc_cbs_cust_id', path: 'data.customer_id', label: 'CBS Customer ID', storeType: 'custom', storeName: 'cbs_customer_id' },
              ],
            },
            {
              id: 'sab_dhapi_cbs_acc', apiId: 'cbs_account_create', apiName: 'CBS Account Creation',
              trigger: 'after_block_complete', latencyP95Ms: 1500,
              inputMappings: [
                { requestPath: 'customer_id',  label: 'CBS Customer ID', sourceType: 'custom', sourceValue: 'cbs_customer_id', isAutoMapped: false },
                { requestPath: 'scheme_code',  label: 'Scheme Code (BRE)', sourceType: 'custom', sourceValue: 'scheme_code',  isAutoMapped: false },
                { requestPath: 'branch_code',  label: 'Branch Code',     sourceType: 'custom', sourceValue: 'branch_code',    isAutoMapped: false },
                { requestPath: 'nominee_name', label: 'Nominee Name',    sourceType: 'custom', sourceValue: 'nominee_name',   isAutoMapped: false },
              ],
              outputCaptures: [
                { id: 'oc_account_number', path: 'data.account_number', label: 'Account Number', storeType: 'custom', storeName: 'account_number' },
                { id: 'oc_ifsc',           path: 'data.ifsc_code',      label: 'IFSC Code',      storeType: 'custom', storeName: 'account_ifsc' },
                { id: 'oc_cif',            path: 'data.cif_number',     label: 'CIF Number',     storeType: 'custom', storeName: 'cif_number' },
              ],
            },
            {
              id: 'sab_dhapi_dcms', apiId: 'dcms_virtual_debit_card', apiName: 'DCMS Virtual Debit Card',
              trigger: 'after_block_complete', latencyP95Ms: 800,
              inputMappings: [
                { requestPath: 'account_number', label: 'Account Number', sourceType: 'custom', sourceValue: 'account_number',     isAutoMapped: false },
                { requestPath: 'customer_id',    label: 'Customer ID',    sourceType: 'custom', sourceValue: 'cbs_customer_id',    isAutoMapped: false },
                { requestPath: 'card_variant',   label: 'Card Variant',   sourceType: 'custom', sourceValue: 'debit_card_variant', isAutoMapped: false },
              ],
              outputCaptures: [
                { id: 'oc_card_num', path: 'data.masked_card_number', label: 'Virtual Debit Card (masked)', storeType: 'custom', storeName: 'virtual_card_number' },
                { id: 'oc_kit_num',  path: 'data.kit_number',         label: 'Card Kit Number',             storeType: 'custom', storeName: 'card_kit_number' },
              ],
            },
            {
              id: 'sab_dhapi_ib', apiId: 'internet_banking_register', apiName: 'Internet Banking Registration',
              trigger: 'after_block_complete', latencyP95Ms: 700,
              inputMappings: [
                { requestPath: 'customer_id',   label: 'Customer ID',   sourceType: 'custom', sourceValue: 'cbs_customer_id', isAutoMapped: false },
                { requestPath: 'mobile_number', label: 'Mobile Number', sourceType: 'native', sourceValue: 'mobile_number',   isAutoMapped: true },
                { requestPath: 'email_id',      label: 'Email ID',      sourceType: 'native', sourceValue: 'email_id',        isAutoMapped: true },
              ],
              outputCaptures: [
                { id: 'oc_ib_user', path: 'data.ib_user_id', label: 'Internet Banking User ID', storeType: 'custom', storeName: 'ib_user_id' },
              ],
            },
            {
              id: 'sab_dhapi_upi', apiId: 'upi_vpa_register', apiName: 'UPI VPA Registration',
              trigger: 'after_block_complete', latencyP95Ms: 600,
              inputMappings: [
                { requestPath: 'account_number', label: 'Account Number', sourceType: 'custom', sourceValue: 'account_number', isAutoMapped: false },
                { requestPath: 'mobile_number',  label: 'Mobile Number',  sourceType: 'native', sourceValue: 'mobile_number',  isAutoMapped: true },
              ],
              outputCaptures: [
                { id: 'oc_upi_vpa', path: 'data.vpa', label: 'UPI VPA', storeType: 'custom', storeName: 'upi_vpa' },
              ],
            },
            {
              id: 'sab_dhapi_lms_final', apiId: 'lms_lead_update', apiName: 'LMS Lead Update — Account Created',
              trigger: 'after_block_complete', latencyP95Ms: 400,
              inputMappings: [
                { requestPath: 'lead_id',        label: 'Lead ID',        sourceType: 'custom', sourceValue: 'lead_id',        isAutoMapped: false },
                { requestPath: 'account_number', label: 'Account Number', sourceType: 'custom', sourceValue: 'account_number', isAutoMapped: false },
                { requestPath: 'status',         label: 'Status',         sourceType: 'static', sourceValue: 'ACCOUNT_CREATED', isAutoMapped: false },
              ],
              outputCaptures: [
                { id: 'oc_lms_update', path: 'data.status', label: 'LMS Update Status', storeType: 'custom', storeName: 'lms_update_status' },
              ],
            },
            {
              id: 'sab_dhapi_dms1', apiId: 'dms_document_push', apiName: 'DMS Document Push — Push 1 (Account Created)',
              trigger: 'after_block_complete', latencyP95Ms: 1000,
              inputMappings: [
                { requestPath: 'account_number', label: 'Account Number', sourceType: 'custom', sourceValue: 'account_number', isAutoMapped: false },
                { requestPath: 'cif_number',     label: 'CIF Number',     sourceType: 'custom', sourceValue: 'cif_number',     isAutoMapped: false },
                { requestPath: 'document_type',  label: 'Document Type',  sourceType: 'static', sourceValue: 'ACCOUNT_OPENING_FORM', isAutoMapped: false },
              ],
              outputCaptures: [
                { id: 'oc_dms1', path: 'data.push_status', label: 'DMS Push 1 Status', storeType: 'custom', storeName: 'dms_push_1_status' },
              ],
            },
          ],
        },
      ],
    },
    // 13 — Account Funding
    {
      id: 'sab_funding', type: 'smart', blockTypeId: 'account_funding',
      name: 'Account Funding', category: 'fulfilment', provider: 'BillDesk',
      description: 'Initial deposit up to ₹10,000 via BillDesk. Debit freeze applied at account creation per RBI Min KYC — removed only after KYC closure.',
      configured: true, hasRetry: false,
      pages: [
        { id: 'funding_input',      name: 'Funding Amount Page',     actions: ['Funding initiated'],                    userInputs: [{ id: 'funding_amount', name: 'Deposit Amount (₹)', type: 'number', dataType: 'NUMBER', required: true }] },
        { id: 'payment_processing', name: 'Payment Processing Page', actions: ['Payment initiated'],                    userInputs: [] },
        { id: 'funding_result',     name: 'Funding Result Page',     actions: ['Payment completed', 'Payment failed'], userInputs: [] },
      ],
      generalConfig: [
        { id: 'payment_gateway', name: 'Payment Gateway', type: 'select', value: 'billdesk',
          options: [{ label: 'BillDesk', value: 'billdesk' }, { label: 'Razorpay', value: 'razorpay' }, { label: 'PayU', value: 'payu' }] },
        { id: 'min_amount',       name: 'Minimum Funding Amount (₹)',      type: 'number', value: 1 },
        { id: 'max_amount',       name: 'Maximum Funding Amount (₹)',      type: 'number', value: 10000 },
        { id: 'funding_optional', name: 'Funding Optional (Skip Allowed)', type: 'toggle', value: false },
      ],
      checks: [
        { id: 'payment_success',      name: 'Payment Success Required',  enabled: true, outputResponse: 'reject', fields: [] },
        { id: 'minimum_amount_check', name: 'Minimum Amount Validation', enabled: true, outputResponse: 'reject',
          fields: [{ id: 'min_amount_threshold', name: 'Minimum Amount (₹)', type: 'number', value: 1 }] },
      ],
      dataHooks: [
        {
          id: 'hook_sab_payment', eventKey: 'after_funding_result_page', eventLabel: 'After Funding Result Page',
          apis: [
            {
              id: 'sab_dhapi_billdesk', apiId: 'billdesk_payment', apiName: 'BillDesk Payment Gateway',
              trigger: 'after_block_complete', latencyP95Ms: 2000,
              inputMappings: [
                { requestPath: 'account_number', label: 'Account Number', sourceType: 'custom', sourceValue: 'account_number',  isAutoMapped: false },
                { requestPath: 'amount',         label: 'Deposit Amount', sourceType: 'native', sourceValue: 'funding_amount',  isAutoMapped: true },
                { requestPath: 'customer_id',    label: 'Customer ID',    sourceType: 'custom', sourceValue: 'cbs_customer_id', isAutoMapped: false },
              ],
              outputCaptures: [
                { id: 'oc_payment_id',     path: 'data.payment_id',      label: 'Payment ID',            storeType: 'custom', storeName: 'payment_id' },
                { id: 'oc_payment_status', path: 'data.status',          label: 'Payment Status',        storeType: 'custom', storeName: 'payment_status' },
                { id: 'oc_txn_ref',        path: 'data.transaction_ref', label: 'Transaction Reference', storeType: 'custom', storeName: 'transaction_ref' },
              ],
            },
          ],
        },
      ],
    },
    // 14 — KYC Closure Router
    {
      id: 'sab_kyc_router', type: 'router', name: 'KYC Closure Router',
      description: 'Route ETB customers to liveness selfie (triggers debit freeze removal on pass); route NTB customers to mandatory Video KYC',
      configured: true, routerBranchType: 'exclusive', defaultRoute: 'sab_vkyc',
      routings: [
        {
          id: 'route_sa_etb_kyc', label: 'ETB -> Liveness Check', routingType: 'condition', saved: true,
          conditionGroups: [{ id: 'cg_sa_etb_kyc', operator: 'AND', conditions: [{ id: 'c_sa_etb_kyc', parameter: 'is_etb', operator: '=', value: 'true', fieldType: 'text' }] }],
          targetBlockId: 'sab_liveness',
        },
      ],
    },
    // 15 — Liveness & Face Match
    {
      id: 'sab_liveness', type: 'smart', blockTypeId: 'liveness_selfie',
      name: 'Liveness & Face Match', category: 'identity', provider: 'TKYC',
      description: 'Liveness selfie and face match for ETB customers post account creation and funding. Successful completion triggers CBS debit freeze removal.',
      configured: true, hasRetry: true,
      pages: [
        { id: 'landing',       name: 'Liveness Landing Page', actions: ['Liveness check initiated'], userInputs: [] },
        { id: 'photo_capture', name: 'Photo Capture Page',    actions: ['Photo captured'],           userInputs: [] },
        { id: 'photo_preview', name: 'Photo Preview Page',    actions: ['Photo confirmed'],          userInputs: [] },
      ],
      checks: [
        { id: 'face_match', name: 'Face Match', enabled: true, outputResponse: 'reject', fields: [
          { id: 'source',    name: 'Face Match Source',  type: 'select', value: 'pan', options: [{ label: 'PAN', value: 'pan' }, { label: 'Aadhaar', value: 'aadhaar' }] },
          { id: 'threshold', name: 'Match Threshold %', type: 'number', value: 80 },
        ]},
        { id: 'liveness_score', name: 'Liveness Score', enabled: true, outputResponse: 'reject',
          fields: [{ id: 'threshold', name: 'Minimum Score %', type: 'number', value: 80 }] },
      ],
      retryConfig: [
        { id: 'face_match_retry', name: 'Face Match Retry', maxAttempts: 3, coolingPeriod: 120, velocityCycle: 3 },
        { id: 'liveness_retry',   name: 'Liveness Retry',   maxAttempts: 3, coolingPeriod: 120, velocityCycle: 3 },
      ],
      dataHooks: [
        {
          id: 'hook_sab_liveness_post', eventKey: 'after_photo_preview_page', eventLabel: 'After Photo Preview Page',
          apis: [
            {
              id: 'sab_dhapi_freeze_remove', apiId: 'cbs_debit_freeze_remove', apiName: 'CBS Debit Freeze Removal',
              trigger: 'after_block_complete', latencyP95Ms: 600,
              inputMappings: [
                { requestPath: 'account_number', label: 'Account Number', sourceType: 'custom', sourceValue: 'account_number',  isAutoMapped: false },
                { requestPath: 'customer_id',    label: 'Customer ID',    sourceType: 'custom', sourceValue: 'cbs_customer_id', isAutoMapped: false },
              ],
              outputCaptures: [
                { id: 'oc_freeze_status', path: 'data.freeze_removal_status', label: 'Debit Freeze Removal Status', storeType: 'custom', storeName: 'debit_freeze_removal_status' },
              ],
            },
          ],
        },
      ],
    },
    // 16 — ETB Success End
    {
      id: 'sab_etb_end', type: 'end', name: 'Account Opened Successfully (ETB)',
      description: 'Terminal success state for ETB customers — account active, debit card issued, internet banking and UPI registered, debit freeze removed',
      configured: true, journeyState: 'ETB_ACCOUNT_ACTIVE',
    },
    // 17 — Video KYC
    {
      id: 'sab_vkyc', type: 'smart', blockTypeId: 'vkyc',
      name: 'Video KYC', category: 'identity', provider: 'VKYC Vendor',
      description: 'Mandatory Video KYC for NTB customers — must be completed within 3 working days of eSign. Concurrent Auditor certification triggers DMS Push 2.',
      configured: true, hasRetry: false,
      pages: [
        { id: 'vkyc_schedule',     name: 'VKYC Slot Scheduling Page',             actions: ['VKYC slot scheduled'], userInputs: [] },
        { id: 'vkyc_instructions', name: 'VKYC Instructions & Requirements Page', actions: ['VKYC initiated'],     userInputs: [] },
        { id: 'vkyc_result',       name: 'VKYC Outcome Page',                     actions: ['VKYC completed'],     userInputs: [] },
      ],
      checks: [
        { id: 'vkyc_completion',     name: 'VKYC Session Completion Required',           enabled: true, outputResponse: 'reject', fields: [] },
        { id: 'face_match',          name: 'Face Match (vs Aadhaar Photo)',               enabled: true, outputResponse: 'reject',
          fields: [{ id: 'threshold', name: 'Match Threshold %', type: 'number', value: 80 }] },
        { id: 'liveness_check',      name: 'Liveness Detection',                         enabled: true, outputResponse: 'reject', fields: [] },
        { id: 'document_visibility', name: 'Original Document Visibility (PAN + Aadhaar)', enabled: true, outputResponse: 'reject', fields: [] },
      ],
      generalConfig: [
        { id: 'completion_window_days', name: 'Completion Window (Working Days)',   type: 'number', value: 3 },
        { id: 'expiry_window_days',     name: 'Expiry After No-Show (Working Days)', type: 'number', value: 7 },
        { id: 'max_reschedules',        name: 'Max Reschedules Allowed',            type: 'number', value: 2 },
        { id: 'available_hours',        name: 'Available Slot Hours', type: 'select', value: '9am_6pm',
          options: [{ label: '9 AM — 6 PM (Mon–Sat)', value: '9am_6pm' }, { label: '9 AM — 8 PM (Mon–Sat)', value: '9am_8pm' }, { label: '9 AM — 6 PM (Mon–Sun)', value: '9am_6pm_all' }] },
      ],
      dataHooks: [
        {
          id: 'hook_sab_vkyc_post', eventKey: 'after_vkyc_outcome_page', eventLabel: 'After VKYC Outcome Page',
          apis: [
            {
              id: 'sab_dhapi_dms2', apiId: 'dms_document_push', apiName: 'DMS Document Push — Push 2 (Post CA Certification)',
              trigger: 'after_block_complete', latencyP95Ms: 1000,
              inputMappings: [
                { requestPath: 'account_number', label: 'Account Number', sourceType: 'custom', sourceValue: 'account_number', isAutoMapped: false },
                { requestPath: 'cif_number',     label: 'CIF Number',     sourceType: 'custom', sourceValue: 'cif_number',     isAutoMapped: false },
                { requestPath: 'document_type',  label: 'Document Type',  sourceType: 'static', sourceValue: 'CA_KYC_CERTIFICATE', isAutoMapped: false },
              ],
              outputCaptures: [
                { id: 'oc_dms2', path: 'data.push_status', label: 'DMS Push 2 Status', storeType: 'custom', storeName: 'dms_push_2_status' },
              ],
            },
          ],
        },
      ],
    },
    // 18 — NTB VKYC Pending End
    {
      id: 'sab_ntb_end', type: 'end', name: 'Account Opened — VKYC Pending (NTB)',
      description: 'Terminal state for NTB customers — account created with debit freeze, VKYC appointment scheduled, customer notified via SMS/email',
      configured: true, journeyState: 'NTB_VKYC_PENDING',
    },
    // 19 — Application Rejected End
    {
      id: 'sab_rejected', type: 'end', name: 'Application Rejected',
      description: 'Terminal rejection state — AML / CFR / age / pincode check failure; rejection SMS and email triggered to applicant',
      configured: true, journeyState: 'APPLICATION_REJECTED',
    },
    // 20 — Payment Not Completed End
    {
      id: 'sab_payment_failed', type: 'end', name: 'Payment Not Completed',
      description: 'Terminal state when initial funding payment fails or is abandoned — account placed on hold, retry link sent to customer within 24 hours',
      configured: true, journeyState: 'PAYMENT_PENDING',
    },
  ] as BlockData[];
}

// --- Divider injection helpers ---
function makeDivider(id: string, stepName: string, stepNumber: number): BlockData {
  return {
    id,
    type: 'step',
    name: 'Step Divider',
    description: '',
    configured: true,
    stepName,
    stepNumber,
  } as BlockData;
}

function insertAfter(blocks: BlockData[], afterId: string, divider: BlockData): BlockData[] {
  const idx = blocks.findIndex((b) => b.id === afterId);
  if (idx === -1) return blocks;
  const result = [...blocks];
  result.splice(idx + 1, 0, divider);
  return result;
}

function injectCCDividers(blocks: BlockData[], prefix: string): BlockData[] {
  let result = [...blocks];
  result = insertAfter(result, `${prefix}_start`, makeDivider(`${prefix}_step1_div`, 'Identity Verification', 1));
  result = insertAfter(result, `${prefix}_ntb_profile`, makeDivider(`${prefix}_step2_div`, 'Financial Assessment', 2));
  result = insertAfter(result, `${prefix}_credit_router`, makeDivider(`${prefix}_step3_div`, 'Card Fulfilment', 3));
  return result;
}

function injectSADividers(blocks: BlockData[], prefix: string): BlockData[] {
  let result = [...blocks];
  result = insertAfter(result, `${prefix}_start`, makeDivider(`${prefix}_step1_div`, 'KYC Verification', 1));
  result = insertAfter(result, `${prefix}_merge`, makeDivider(`${prefix}_step2_div`, 'Account Setup', 2));
  result = insertAfter(result, `${prefix}_fatca`, makeDivider(`${prefix}_step3_div`, 'Account Opening', 3));
  return result;
}

// --- ID remapping ---
function remapCCIds(blocks: BlockData[], prefix: string): BlockData[] {
  const json = JSON.stringify(blocks).replace(/"blk_/g, `"${prefix}_`);
  return JSON.parse(json) as BlockData[];
}

function remapSAIds(blocks: BlockData[], prefix: string): BlockData[] {
  const json = JSON.stringify(blocks).replace(/"sab_/g, `"${prefix}_`);
  return JSON.parse(json) as BlockData[];
}

// --- Step data helpers ---
function getSuffix(id: string, prefix: string): string {
  return id.startsWith(`${prefix}_`) ? id.slice(prefix.length + 1) : id;
}

function addCCStepData(blocks: BlockData[], prefix: string): BlockData[] {
  return blocks.map((block) => {
    const suffix = getSuffix(block.id, prefix);
    const step = CC_STEP_MAP[suffix];
    if (!step) return block;
    const visibleToApplicant = !LOGIC_TYPES.has(block.type);
    return { ...block, ...step, visibleToApplicant };
  });
}

function addSAStepData(blocks: BlockData[], prefix: string): BlockData[] {
  return blocks.map((block) => {
    const suffix = getSuffix(block.id, prefix);
    const step = SA_STEP_MAP[suffix];
    if (!step) return block;
    const visibleToApplicant = !LOGIC_TYPES.has(block.type);
    return { ...block, ...step, visibleToApplicant };
  });
}

// --- Main exported builders ---
export function buildCCBlocks(variant: 'a' | 'b' | 'c'): BlockData[] {
  const prefixMap = { a: 'cca', b: 'ccb', c: 'ccc' };
  const prefix = prefixMap[variant];
  let blocks = getCCBaseBlocks();
  blocks = remapCCIds(blocks, prefix);
  if (variant === 'a') {
    blocks = injectCCDividers(blocks, prefix);
  } else {
    blocks = addCCStepData(blocks, prefix);
  }
  return blocks;
}

export function buildSABlocks(variant: 'a' | 'b' | 'c'): BlockData[] {
  const prefixMap = { a: 'saa', b: 'saab', c: 'saac' };
  const prefix = prefixMap[variant];
  let blocks = getSABaseBlocks();
  blocks = remapSAIds(blocks, prefix);
  if (variant === 'a') {
    blocks = injectSADividers(blocks, prefix);
  } else {
    blocks = addSAStepData(blocks, prefix);
  }
  return blocks;
}
