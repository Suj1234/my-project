import { SmartBlockDefinition } from '../types/journey';

// Helper function to get short descriptions for canvas display
export function getShortDescription(blockTypeId: string): string {
  const shortDescriptions: Record<string, string> = {
    pan_verification: 'Identity verification',
    aadhaar_verification: 'DigiLocker authentication',
    liveness_selfie: 'Selfie & liveness',
    bank_statement: 'Financial analysis',
    itr_fetch_analysis: 'ITR fetch & analysis',
    gst_fetch_analysis: 'GST fetch & analysis',
    offer_generation: 'Soft offer via BRE',
    final_offer_generation: 'Final offer via BRE',
    bank_account_selection: 'Account verification',
    kfs_document: 'KFS display',
    sanction_letter: 'Sanction acceptance',
    esign: 'Digital signing',
    profile_address: 'Profile & address',
  };
  return shortDescriptions[blockTypeId] || 'Block configuration';
}

export const SMART_BLOCKS: SmartBlockDefinition[] = [
  // Identity Category
  {
    id: 'pan_verification',
    name: 'PAN Verification',
    description: 'Perform comprehensive PAN verification with AML screening, CFR validation, age verification, and serviceable pincode checks. Identity details are fetched using PAN Profile Detailed API with configurable retry mechanism.',
    category: 'identity',
    icon: 'CreditCard',
    provider: 'PAN Profile Detailed API',
    hasChecks: true,
    hasRetry: true,
    pages: [
      {
        id: 'pan_input',
        name: 'PAN Input Page',
        action: 'PAN initiated',
        userInputs: [
          {
            id: 'pan_number',
            name: 'PAN Number',
            type: 'text',
            dataType: 'STRING',
            required: true,
          },
        ],
      },
      {
        id: 'pan_confirmed',
        name: 'PAN Confirmed Page',
        action: 'PAN verified',
        userInputs: [],
      },
    ],
    checks: [
      {
        id: 'aml_check',
        name: 'AML Check',
        enabled: false,
        outputResponse: 'reject',
        fields: [],
      },
      {
        id: 'cfr_check',
        name: 'CFR Check',
        enabled: false,
        outputResponse: 'reject',
        fields: [
          {
            id: 'master_code',
            name: 'Configure Master Code',
            type: 'select',
            value: '',
            options: [
              { label: 'CFR Master 1', value: 'cfr_master_1' },
              { label: 'CFR Master 2', value: 'cfr_master_2' },
              { label: 'CFR Master 3', value: 'cfr_master_3' },
            ],
          },
          {
            id: 'column_field',
            name: 'Column Field Name',
            type: 'dependent-select',
            value: '',
            dependsOn: 'master_code',
            masterColumns: {
              cfr_master_1: [
                { label: 'Applicant ID', value: 'applicant_id', isPrimaryKey: true, dataType: 'Integer' },
                { label: 'PAN Number', value: 'pan_number', isPrimaryKey: false, dataType: 'String' },
                { label: 'CFR Score', value: 'cfr_score', isPrimaryKey: false, dataType: 'Float' },
                { label: 'Risk Category', value: 'risk_category', isPrimaryKey: false, dataType: 'String' },
              ],
              cfr_master_2: [
                { label: 'Customer ID', value: 'customer_id', isPrimaryKey: true, dataType: 'Integer' },
                { label: 'Full Name', value: 'full_name', isPrimaryKey: false, dataType: 'String' },
                { label: 'CFR Flag', value: 'cfr_flag', isPrimaryKey: false, dataType: 'Boolean' },
                { label: 'Check Date', value: 'check_date', isPrimaryKey: false, dataType: 'Date' },
              ],
              cfr_master_3: [
                { label: 'Record ID', value: 'record_id', isPrimaryKey: true, dataType: 'Integer' },
                { label: 'Bureau Ref', value: 'bureau_ref', isPrimaryKey: false, dataType: 'String' },
                { label: 'Fraud Indicator', value: 'fraud_indicator', isPrimaryKey: false, dataType: 'Boolean' },
                { label: 'Source System', value: 'source_system', isPrimaryKey: false, dataType: 'String' },
              ],
            },
          },
        ],
      },
      {
        id: 'age_check',
        name: 'Age Check',
        enabled: false,
        outputResponse: 'reject',
        fields: [
          {
            id: 'min_age',
            name: 'Minimum Age',
            type: 'number',
            value: 18,
          },
          {
            id: 'max_age',
            name: 'Maximum Age',
            type: 'number',
            value: 65,
          },
        ],
      },
      {
        id: 'pincode_check',
        name: 'Serviceable Pincode Check',
        enabled: false,
        outputResponse: 'reject',
        fields: [
          {
            id: 'master_code',
            name: 'Configure Master Code',
            type: 'select',
            value: '',
            options: [
              { label: 'Pincode Master 1', value: 'pincode_master_1' },
              { label: 'Pincode Master 2', value: 'pincode_master_2' },
              { label: 'Pincode Master 3', value: 'pincode_master_3' },
            ],
          },
          {
            id: 'column_field',
            name: 'Column Field Name',
            type: 'dependent-select',
            value: '',
            dependsOn: 'master_code',
            masterColumns: {
              pincode_master_1: [
                { label: 'Pincode', value: 'pincode', isPrimaryKey: true, dataType: 'String' },
                { label: 'City', value: 'city', isPrimaryKey: false, dataType: 'String' },
                { label: 'State', value: 'state', isPrimaryKey: false, dataType: 'String' },
                { label: 'Is Serviceable', value: 'is_serviceable', isPrimaryKey: false, dataType: 'Boolean' },
              ],
              pincode_master_2: [
                { label: 'Zip Code', value: 'zip_code', isPrimaryKey: true, dataType: 'String' },
                { label: 'District', value: 'district', isPrimaryKey: false, dataType: 'String' },
                { label: 'Region', value: 'region', isPrimaryKey: false, dataType: 'String' },
                { label: 'Service Type', value: 'service_type', isPrimaryKey: false, dataType: 'String' },
              ],
              pincode_master_3: [
                { label: 'Postal Code', value: 'postal_code', isPrimaryKey: true, dataType: 'String' },
                { label: 'Tier', value: 'tier', isPrimaryKey: false, dataType: 'String' },
                { label: 'Coverage Area', value: 'coverage_area', isPrimaryKey: false, dataType: 'String' },
                { label: 'Is Active', value: 'is_active', isPrimaryKey: false, dataType: 'Boolean' },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    id: 'aadhaar_verification',
    name: 'Aadhaar Verification',
    description: 'Verify Aadhaar through DigiLocker with OTP authentication. Includes mobile linkage verification, age validation, and serviceable pincode checks with automated retry handling.',
    category: 'identity',
    icon: 'Fingerprint',
    provider: 'DigiLocker',
    hasChecks: true,
    hasRetry: true,
    pages: [
      {
        id: 'aadhaar_info',
        name: 'Aadhaar Info Page',
        action: 'Confirm DigiLocker Details',
        userInputs: [],
      },
    ],
    checks: [
      {
        id: 'mobile_linkage',
        name: 'Aadhaar Mobile Linkage Check',
        enabled: false,
        outputResponse: 'reject',
        fields: [],
      },
      {
        id: 'age_check',
        name: 'Age Check',
        enabled: false,
        outputResponse: 'reject',
        fields: [
          {
            id: 'min_age',
            name: 'Minimum Age',
            type: 'number',
            value: 18,
          },
          {
            id: 'max_age',
            name: 'Maximum Age',
            type: 'number',
            value: 65,
          },
        ],
      },
      {
        id: 'pincode_check',
        name: 'Serviceable Pincode Check',
        enabled: false,
        outputResponse: 'reject',
        fields: [
          {
            id: 'master_code',
            name: 'Configure Master Code',
            type: 'select',
            value: '',
            options: [
              { label: 'Pincode Master 1', value: 'pincode_master_1' },
              { label: 'Pincode Master 2', value: 'pincode_master_2' },
              { label: 'Pincode Master 3', value: 'pincode_master_3' },
            ],
          },
          {
            id: 'column_field',
            name: 'Column Field Name',
            type: 'dependent-select',
            value: '',
            dependsOn: 'master_code',
            masterColumns: {
              pincode_master_1: [
                { label: 'Pincode', value: 'pincode', isPrimaryKey: true, dataType: 'String' },
                { label: 'City', value: 'city', isPrimaryKey: false, dataType: 'String' },
                { label: 'State', value: 'state', isPrimaryKey: false, dataType: 'String' },
                { label: 'Is Serviceable', value: 'is_serviceable', isPrimaryKey: false, dataType: 'Boolean' },
              ],
              pincode_master_2: [
                { label: 'Zip Code', value: 'zip_code', isPrimaryKey: true, dataType: 'String' },
                { label: 'District', value: 'district', isPrimaryKey: false, dataType: 'String' },
                { label: 'Region', value: 'region', isPrimaryKey: false, dataType: 'String' },
                { label: 'Service Type', value: 'service_type', isPrimaryKey: false, dataType: 'String' },
              ],
              pincode_master_3: [
                { label: 'Postal Code', value: 'postal_code', isPrimaryKey: true, dataType: 'String' },
                { label: 'Tier', value: 'tier', isPrimaryKey: false, dataType: 'String' },
                { label: 'Coverage Area', value: 'coverage_area', isPrimaryKey: false, dataType: 'String' },
                { label: 'Is Active', value: 'is_active', isPrimaryKey: false, dataType: 'Boolean' },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    id: 'liveness_selfie',
    name: 'Liveness & Selfie Verification',
    description: 'Capture selfie with liveness detection to prevent spoofing. Includes optional face matching against PAN/Aadhaar with configurable threshold percentage and liveness score validation.',
    category: 'identity',
    icon: 'Camera',
    provider: 'TKYC',
    hasChecks: true,
    hasRetry: true,
    pages: [
      {
        id: 'landing',
        name: 'Liveness Landing Page',
        action: 'Liveness check initiated',
        userInputs: [],
      },
      {
        id: 'photo_capture',
        name: 'Photo Capture Page',
        action: 'Photo captured',
        userInputs: [],
      },
      {
        id: 'photo_preview',
        name: 'Photo Preview Page',
        action: 'Photo confirmed',
        userInputs: [],
      },
    ],
    checks: [
      {
        id: 'face_match',
        name: 'Face Match',
        enabled: false,
        outputResponse: 'reject',
        fields: [
          {
            id: 'source',
            name: 'Face Match Source',
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
            value: 80,
          },
        ],
      },
      {
        id: 'liveness_score',
        name: 'Liveness Score',
        enabled: false,
        outputResponse: 'reject',
        fields: [
          {
            id: 'threshold',
            name: 'Minimum Score %',
            type: 'number',
            value: 80,
          },
        ],
      },
    ],
    retryConfig: [
      {
        id: 'face_match_retry',
        name: 'Face Match Retry',
        maxAttempts: 3,
        coolingPeriod: 120,
        velocityCycle: 3,
      },
      {
        id: 'liveness_retry',
        name: 'Liveness Retry',
        maxAttempts: 3,
        coolingPeriod: 120,
        velocityCycle: 3,
      },
    ],
  },
  // Financial Category
  {
    id: 'bank_statement',
    name: 'Bank Statement Analysis',
    description: 'Analyze bank statements through Insights API with configurable date ranges. Performs name matching against PAN/Aadhaar with threshold validation and comprehensive financial assessment.',
    category: 'financial',
    icon: 'Building',
    provider: 'Insights',
    hasChecks: true,
    hasRetry: true,
    pages: [
      {
        id: 'bank_statement',
        name: 'Bank Statement Page',
        action: 'Bank statement submitted',
        userInputs: [],
      },
    ],
    checks: [
      {
        id: 'name_match',
        name: 'Name Match Configuration',
        enabled: false,
        outputResponse: 'reject',
        fields: [
          {
            id: 'source',
            name: 'Name Source Selection',
            type: 'select',
            value: '',
            options: [
              { label: 'PAN', value: 'pan' },
              { label: 'Aadhaar', value: 'aadhaar' },
            ],
          },
          {
            id: 'threshold',
            name: 'Threshold %',
            type: 'number',
            value: 80,
          },
        ],
      },
    ],
    generalConfig: [
      {
        id: 'start_month',
        name: 'Start Month',
        type: 'select',
        value: '1',
        options: [
          { label: 'January', value: '1' },
          { label: 'February', value: '2' },
          { label: 'March', value: '3' },
          { label: 'April', value: '4' },
          { label: 'May', value: '5' },
          { label: 'June', value: '6' },
          { label: 'July', value: '7' },
          { label: 'August', value: '8' },
          { label: 'September', value: '9' },
          { label: 'October', value: '10' },
          { label: 'November', value: '11' },
          { label: 'December', value: '12' },
        ],
      },
      {
        id: 'start_year',
        name: 'Start Year',
        type: 'select',
        value: '2024',
        options: [
          { label: '2024', value: '2024' },
          { label: '2025', value: '2025' },
          { label: '2026', value: '2026' },
        ],
      },
      {
        id: 'end_month',
        name: 'End Month',
        type: 'select',
        value: '12',
        options: [
          { label: 'January', value: '1' },
          { label: 'February', value: '2' },
          { label: 'March', value: '3' },
          { label: 'April', value: '4' },
          { label: 'May', value: '5' },
          { label: 'June', value: '6' },
          { label: 'July', value: '7' },
          { label: 'August', value: '8' },
          { label: 'September', value: '9' },
          { label: 'October', value: '10' },
          { label: 'November', value: '11' },
          { label: 'December', value: '12' },
        ],
      },
      {
        id: 'end_year',
        name: 'End Year',
        type: 'select',
        value: '2026',
        options: [
          { label: '2024', value: '2024' },
          { label: '2025', value: '2025' },
          { label: '2026', value: '2026' },
        ],
      },
    ],
  },
  {
    id: 'itr_fetch_analysis',
    name: 'ITR Fetch & Analysis',
    description: 'Fetch and analyse Income Tax Returns (ITR) directly online to assess income profile, tax compliance, and financial health. Supports multi-year retrieval with configurable ITR type for comprehensive financial underwriting.',
    category: 'financial',
    icon: 'FileBarChart',
    provider: 'ITR Fetch (Online)',
    hasChecks: false,
    hasRetry: true,
    pages: [
      {
        id: 'itr_initiation',
        name: 'ITR Fetch Initiation Page',
        action: 'ITR fetch initiated',
        userInputs: [],
      },
      {
        id: 'itr_result',
        name: 'ITR Analysis Result Page',
        action: 'ITR analysis complete',
        userInputs: [],
      },
    ],
    generalConfig: [
      {
        id: 'number_of_years',
        name: 'Number of Years',
        type: 'select',
        value: '2',
        options: [
          { label: '1 Year', value: '1' },
          { label: '2 Years', value: '2' },
          { label: '3 Years', value: '3' },
          { label: '4 Years', value: '4' },
        ],
      },
      {
        id: 'itr_type',
        name: 'ITR Type',
        type: 'select',
        value: 'itr_1',
        options: [
          { label: 'ITR-1 (Sahaj)', value: 'itr_1' },
          { label: 'ITR-2', value: 'itr_2' },
          { label: 'ITR-3', value: 'itr_3' },
          { label: 'ITR-4 (Sugam)', value: 'itr_4' },
          { label: 'ITR-5', value: 'itr_5' },
          { label: 'ITR-6', value: 'itr_6' },
        ],
      },
    ],
  },
  {
    id: 'gst_fetch_analysis',
    name: 'GST Fetch & Analysis',
    description: 'Fetch and analyse GST returns and filing history online to evaluate business revenue, GST compliance, and turnover trends. Supports multi-year retrieval with configurable GST return type for business loan underwriting.',
    category: 'financial',
    icon: 'ReceiptText',
    provider: 'GST Fetch (Online)',
    hasChecks: false,
    hasRetry: true,
    pages: [
      {
        id: 'gst_initiation',
        name: 'GST Fetch Initiation Page',
        action: 'GST fetch initiated',
        userInputs: [],
      },
      {
        id: 'gst_result',
        name: 'GST Analysis Result Page',
        action: 'GST analysis complete',
        userInputs: [],
      },
    ],
    generalConfig: [
      {
        id: 'number_of_years',
        name: 'Number of Years',
        type: 'select',
        value: '2',
        options: [
          { label: '1 Year', value: '1' },
          { label: '2 Years', value: '2' },
          { label: '3 Years', value: '3' },
          { label: '4 Years', value: '4' },
        ],
      },
      {
        id: 'gst_type',
        name: 'GST Type',
        type: 'select',
        value: 'gstr_1',
        options: [
          { label: 'GSTR-1 (Outward Supplies)', value: 'gstr_1' },
          { label: 'GSTR-2A (Auto-populated Purchases)', value: 'gstr_2a' },
          { label: 'GSTR-3B (Summary Return)', value: 'gstr_3b' },
          { label: 'GSTR-9 (Annual Return)', value: 'gstr_9' },
        ],
      },
    ],
  },
  {
    id: 'offer_generation',
    name: 'Soft Offer Generation',
    description: 'Generate preliminary soft loan offers using Business Rule Engine (BRE). Automatically computes personalized pre-qualified offers based on applicant profile, credit assessment, and configured business rules — before final underwriting.',
    category: 'decision',
    icon: 'TrendingUp',
    hasChecks: false,
    hasRetry: false,
    pages: [
      {
        id: 'generate_offer',
        name: 'Generate Offer - Loader',
        action: 'Offer generation initiated',
        userInputs: [],
      },
      {
        id: 'show_offer',
        name: 'Show Offer Page',
        action: 'Offer displayed',
        userInputs: [],
      },
    ],
    generalConfig: [
      {
        id: 'bre',
        name: 'Which BRE to Call',
        type: 'select',
        value: 'bre_v1',
        options: [
          { label: 'BRE v1 - Standard', value: 'bre_v1' },
          { label: 'BRE v2 - Advanced', value: 'bre_v2' },
          { label: 'BRE v3 - Premium', value: 'bre_v3' },
        ],
      },
    ],
  },
  {
    id: 'bank_account_selection',
    name: 'Bank Account Selection',
    description: 'Select or add disbursement bank account with penny drop verification. Validates account with name matching against applicant details and checks account validity status.',
    category: 'fulfilment',
    icon: 'Landmark',
    provider: 'tkyc_api_v1',
    hasChecks: true,
    hasRetry: true,
    pages: [
      {
        id: 'bank_account_list',
        name: 'Bank Account List Page',
        action: 'Account selection initiated',
        userInputs: [],
      },
      {
        id: 'bank_account_selected',
        name: 'Bank Account Selected Page',
        action: 'Account selected',
        userInputs: [],
      },
    ],
    checks: [
      {
        id: 'penny_drop',
        name: 'Penny Drop Verification',
        enabled: false,
        outputResponse: 'reject',
        fields: [],
      },
      {
        id: 'name_match',
        name: 'Name Match with Applicant',
        enabled: false,
        outputResponse: 'reject',
        fields: [
          {
            id: 'threshold',
            name: 'Name Match Threshold %',
            type: 'number',
            value: 80,
          },
        ],
      },
      {
        id: 'account_validity',
        name: 'Account Validity Status',
        enabled: false,
        outputResponse: 'reject',
        fields: [],
      },
    ],
    retryConfig: [
      {
        id: 'penny_entry_retry',
        name: 'Penny Entry Retry',
        maxAttempts: 3,
        coolingPeriod: 120,
        velocityCycle: 3,
      },
      {
        id: 'ifsc_verification_retry',
        name: 'IFSC Verification Retry',
        maxAttempts: 3,
        coolingPeriod: 120,
        velocityCycle: 3,
      },
    ],
  },
  // Fulfilment Category
  {
    id: 'kfs_document',
    name: 'KFS Document Display',
    description: 'Display Key Fact Statement (KFS) document to customer and capture digital acknowledgement. Configurable template selection based on product and loan type.',
    category: 'fulfilment',
    icon: 'FileText',
    hasChecks: false,
    hasRetry: false,
    pages: [
      {
        id: 'display_kfs',
        name: 'KFS Display Page',
        action: 'KFS displayed',
        userInputs: [],
      },
    ],
    generalConfig: [
      {
        id: 'template_id',
        name: 'KFS Template Selection',
        type: 'select',
        value: '',
        options: [
          { label: 'Personal Loan KFS', value: 'kfs_personal_loan' },
          { label: 'Home Loan KFS', value: 'kfs_home_loan' },
          { label: 'Business Loan KFS', value: 'kfs_business_loan' },
          { label: 'Two-Wheeler Loan KFS', value: 'kfs_two_wheeler_loan' },
        ],
      },
    ],
  },
  {
    id: 'sanction_letter',
    name: 'Sanction Letter Display & Acceptance',
    description: 'Display sanction letter with loan terms, allow document download, and capture customer acceptance. Template is selectable per product configuration.',
    category: 'fulfilment',
    icon: 'FileCheck',
    hasChecks: false,
    hasRetry: false,
    pages: [
      {
        id: 'display_letter',
        name: 'Sanction Letter Display Page',
        action: 'Sanction letter displayed',
        userInputs: [],
      },
    ],
    generalConfig: [
      {
        id: 'template_id',
        name: 'Sanction Template Selection',
        type: 'select',
        value: '',
        options: [
          { label: 'Standard Sanction Letter', value: 'sanction_standard' },
          { label: 'Premium Sanction Letter', value: 'sanction_premium' },
          { label: 'MSME Sanction Letter', value: 'sanction_msme' },
          { label: 'Agricultural Loan Sanction', value: 'sanction_agricultural' },
        ],
      },
    ],
  },
  {
    id: 'esign',
    name: 'eSign',
    description: 'Enable digital signing of loan documents through TKYC eSign service. Secure Aadhaar-based authentication with document template selection and retry mechanism.',
    category: 'fulfilment',
    icon: 'PenTool',
    provider: 'TKYC',
    hasChecks: false,
    hasRetry: true,
    pages: [
      {
        id: 'esign_initiation',
        name: 'eSign Initiation Page',
        action: 'eSign initiated',
        userInputs: [],
      },
      {
        id: 'esign_completion',
        name: 'eSign Completion Page',
        action: 'Document signed',
        userInputs: [],
      },
    ],
    generalConfig: [
      {
        id: 'template_id',
        name: 'Document Template Selection',
        type: 'select',
        value: '',
        options: [
          { label: 'Personal Loan Agreement', value: 'esign_personal_loan' },
          { label: 'Home Loan Agreement', value: 'esign_home_loan' },
          { label: 'Business Loan Agreement', value: 'esign_business_loan' },
          { label: 'Overdraft Agreement', value: 'esign_overdraft' },
        ],
      },
    ],
  },
  // Identity Category (continued)
  {
    id: 'profile_address',
    name: 'Profile & Address Details',
    description: 'Pre-populate customer profile details fetched from Aadhaar and PAN verification. Collect and validate communication address with editable fields for accuracy.',
    category: 'identity',
    icon: 'User',
    hasChecks: false,
    hasRetry: false,
    pages: [
      {
        id: 'profile_details',
        name: 'Profile Details Page',
        action: 'Profile viewed',
        userInputs: [],
      },
      {
        id: 'address_update',
        name: 'Communication Address Update Page',
        action: 'Address updated',
        userInputs: [],
      },
    ],
  },
];