export type FieldDataType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';

export interface CatalogField {
  key: string;
  label: string;
  dataType: FieldDataType;
  sampleStructure: any;
}

export interface ProgramConfigField extends CatalogField {
  configuredValue: any;
}

export const NATIVE_FIELD_CATALOG: CatalogField[] = [
  { key: 'first_name',     label: 'First Name',     dataType: 'string',  sampleStructure: 'Ravi' },
  { key: 'last_name',      label: 'Last Name',      dataType: 'string',  sampleStructure: 'Kumar' },
  { key: 'dob',            label: 'Date of Birth',  dataType: 'date',    sampleStructure: '1990-05-15' },
  { key: 'gender',         label: 'Gender',         dataType: 'string',  sampleStructure: 'Male' },
  { key: 'pan_number',     label: 'PAN Number',     dataType: 'string',  sampleStructure: 'ABCDE1234F' },
  { key: 'aadhaar_number', label: 'Aadhaar Number', dataType: 'string',  sampleStructure: 'XXXX-XXXX-1234' },
  { key: 'mobile',         label: 'Mobile Number',  dataType: 'string',  sampleStructure: '9876543210' },
  { key: 'email',          label: 'Email',          dataType: 'string',  sampleStructure: 'user@example.com' },
  { key: 'pincode',        label: 'Pincode',        dataType: 'string',  sampleStructure: '560001' },
  {
    key: 'addresses', label: 'Addresses', dataType: 'array',
    sampleStructure: [{ type: 'current', line1: '123 Main St', city: 'Bangalore', pincode: '560001' }],
  },
  {
    key: 'income_details', label: 'Income Details', dataType: 'object',
    sampleStructure: { monthly: 50000, annual: 600000, source: 'salary' },
  },
  {
    key: 'existing_loans', label: 'Existing Loans', dataType: 'array',
    sampleStructure: [{ lender: 'HDFC Bank', emi: 15000, outstanding: 500000, type: 'home_loan' }],
  },
];

export const CUSTOM_FIELD_CATALOG: CatalogField[] = [
  { key: 'applicant_segment',      label: 'Applicant Segment',      dataType: 'string',  sampleStructure: 'PREMIUM' },
  { key: 'existing_customer',      label: 'Existing Customer',      dataType: 'boolean', sampleStructure: true },
  { key: 'credit_limit_requested', label: 'Credit Limit Requested', dataType: 'number',  sampleStructure: 50000 },
  { key: 'kyc_status',             label: 'KYC Status',             dataType: 'string',  sampleStructure: 'VERIFIED' },
  {
    key: 'employment_details', label: 'Employment Details', dataType: 'object',
    sampleStructure: { employer: 'Infosys Ltd', type: 'salaried', years: 5, designation: 'Senior Manager' },
  },
  {
    key: 'address_history', label: 'Address History', dataType: 'array',
    sampleStructure: [{ type: 'current', city: 'Bangalore', since: '2020-01-01', pincode: '560001' }],
  },
  {
    key: 'document_ids', label: 'Document IDs', dataType: 'object',
    sampleStructure: { pan: 'ABCDE1234F', aadhaar: 'XXXX1234', passport: null },
  },
  {
    key: 'risk_flags', label: 'Risk Flags', dataType: 'array',
    sampleStructure: [{ flag: 'HIGH_DPD', severity: 'critical', raised_at: '2024-01-10' }],
  },
  { key: 'consent_timestamp', label: 'Consent Timestamp', dataType: 'date',   sampleStructure: '2024-01-15T10:30:00Z' },
  { key: 'lead_source',       label: 'Lead Source',       dataType: 'string', sampleStructure: 'web_application' },
];

export const PROGRAM_CONFIG_CATALOG: ProgramConfigField[] = [
  { key: 'loan_amount',         label: 'Loan Amount',          dataType: 'number', sampleStructure: 500000,      configuredValue: 500000 },
  { key: 'product_type',        label: 'Product Type',         dataType: 'string', sampleStructure: 'home_loan', configuredValue: 'home_loan' },
  { key: 'tenure_months',       label: 'Tenure (Months)',      dataType: 'number', sampleStructure: 240,         configuredValue: 240 },
  { key: 'interest_rate',       label: 'Interest Rate (%)',    dataType: 'number', sampleStructure: 8.5,         configuredValue: 8.5 },
  { key: 'processing_fee_pct',  label: 'Processing Fee (%)',   dataType: 'number', sampleStructure: 1.5,         configuredValue: 1.5 },
  { key: 'max_ltv_ratio',       label: 'Max LTV Ratio (%)',    dataType: 'number', sampleStructure: 80,          configuredValue: 80 },
  { key: 'bureau_score_cutoff', label: 'Bureau Score Cutoff',  dataType: 'number', sampleStructure: 700,         configuredValue: 700 },
  { key: 'repayment_mode',      label: 'Repayment Mode',       dataType: 'string', sampleStructure: 'emi',       configuredValue: 'emi' },
];
