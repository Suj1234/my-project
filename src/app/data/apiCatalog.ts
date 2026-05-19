import { InputSourceType } from '../types/journey';

export type ApiFieldType = 'string' | 'number' | 'boolean' | 'date' | 'phone' | 'email';

export interface ApiRequestField {
  path: string;           // e.g. "applicant.name.firstName"
  label: string;          // human-readable
  fieldType?: ApiFieldType;
  isRequired: boolean;
  isAutoMapped: boolean;
  autoMapSource?: { type: InputSourceType; value: string }; // pre-filled mapping
  isSystem?: boolean;     // auto-filled by system (timestamp, consent=true, etc.)
  staticValue?: string;   // if always a fixed value
}

export interface ApiDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;           // emoji for now
  category: string;
  provider: string;
  latencyP95Ms?: number;
  requestFields: ApiRequestField[];
  sampleResponse: Record<string, any>;
}

export const API_CATALOG: ApiDefinition[] = [
  // ─────────────────────────────────────────────────────────────
  // CIBIL Bureau Report
  // ─────────────────────────────────────────────────────────────
  {
    id: 'cibil_bureau',
    name: 'CIBIL Bureau Report',
    description: 'Credit score, account history, DPD, derogatory summary from CIBIL',
    icon: '📊',
    category: 'Credit Bureau',
    provider: 'CIBIL',
    latencyP95Ms: 1450,
    requestFields: [
      { path: 'applicant.name.firstName',         label: 'First Name',          fieldType: 'string',  isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'first_name' } },
      { path: 'applicant.name.lastName',          label: 'Last Name',           fieldType: 'string',  isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'last_name' } },
      { path: 'applicant.dateOfBirth',            label: 'Date of Birth',       fieldType: 'date',    isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'dob' } },
      { path: 'applicant.gender',                 label: 'Gender',              fieldType: 'string',  isRequired: false, isAutoMapped: true,  autoMapSource: { type: 'native', value: 'gender' } },
      { path: 'applicant.identifiers.pan',        label: 'PAN Number',          fieldType: 'string',  isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'pan_number' } },
      { path: 'applicant.identifiers.aadhaar',    label: 'Aadhaar Number',      fieldType: 'string',  isRequired: false, isAutoMapped: true,  autoMapSource: { type: 'native', value: 'aadhaar_number' } },
      { path: 'applicant.contact.mobile',         label: 'Mobile Number',       fieldType: 'phone',   isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'mobile' } },
      { path: 'applicant.contact.email',          label: 'Email',               fieldType: 'email',   isRequired: false, isAutoMapped: true,  autoMapSource: { type: 'native', value: 'email' } },
      { path: 'applicant.addresses[0].pincode',   label: 'Pincode',             fieldType: 'string',  isRequired: false, isAutoMapped: true,  autoMapSource: { type: 'native', value: 'pincode' } },
      { path: 'consent.consentGiven',             label: 'Consent Given',       fieldType: 'boolean', isRequired: true,  isAutoMapped: true,  isSystem: true, staticValue: 'true' },
      { path: 'consent.consentTimestamp',         label: 'Consent Timestamp',   fieldType: 'date',    isRequired: true,  isAutoMapped: true,  isSystem: true, staticValue: 'current_timestamp' },
      { path: 'config.reportType',                label: 'Report Type',         fieldType: 'string',  isRequired: true,  isAutoMapped: true,  isSystem: true, staticValue: 'CCR_FULL' },
      { path: 'consent.purpose',                  label: 'Enquiry Purpose',     fieldType: 'string',  isRequired: true,  isAutoMapped: false },
      { path: 'config.includeEnquiries',          label: 'Include Enquiries',   fieldType: 'boolean', isRequired: false, isAutoMapped: false },
      { path: 'config.includeDerogatory',         label: 'Include Derogatory',  fieldType: 'boolean', isRequired: false, isAutoMapped: false },
    ],
    sampleResponse: {
      status: 'SUCCESS',
      reportId: 'TU-CCR-999999',
      generatedAt: '2026-03-20T10:00:00',
      consumerProfile: {
        personalInfo: {
          name: 'RAVI KUMAR',
          dob: '1990-05-15',
          gender: 'Male',
          age: 35,
        },
        identification: {
          pan: 'ABCDE1234F',
          aadhaar: 'XXXXXXXX1234',
          passport: null,
          voterId: null,
        },
        contact: {
          mobile: ['9876543210'],
          email: ['ravi@email.com'],
        },
        addresses: [
          { type: 'CURRENT',   address: 'Bangalore, KA', Pincode: '560001', reportedDate: '2025-01-01' },
          { type: 'PERMANENT', address: 'Mysore, KA',    Pincode: '570001', reportedDate: '2023-01-01' },
        ],
      },
      scoreDetails: {
        score: 752,
        scoreVersion: 'CIBIL 3.0',
        scoreType: 'Generic',
        scoreFactors: ['Low credit utilization', 'Timely payments', 'Long credit history'],
        scoreHistory: [
          { month: 'Jan-25', score: 750 },
          { month: 'Feb-25', score: 752 },
        ],
      },
      accountDetails: [
        {
          accountNumber: 'CC001',
          subscriberName: 'HDFC BANK',
          subscriberCode: 'HDFC123',
          accountType: 'Credit Card',
          accountCategory: 'Unsecured',
          ownershipType: 'Individual',
          dateOpened: '2020-01-01',
          dateClosed: null,
          dateReported: '2025-01-01',
          lastPaymentDate: '2024-12-01',
          creditLimit: 100000,
          cashLimit: 50000,
          highCredit: 120000,
          currentBalance: 25000,
          amountOverdue: 2000,
          pastDueAmount: 2000,
          emiAmount: null,
          interestRate: 36,
          paymentFrequency: 'Monthly',
          accountStatus: 'Active',
          assetClassification: 'STD',
          writtenOffAmount: 0,
          writtenOffStatus: 'NO',
          settlementAmount: 0,
          settlementStatus: 'NONE',
          wilfulDefault: false,
          suitFiled: false,
          paymentHistory: {
            startDate: '2024-01',
            endDate: '2024-12',
            dpd: ['000','000','030','000','000','000','000','060','000','000','000','000'],
            paymentHistoryProfile: '000000030000000060000000000000',
          },
          assetClassificationHistory: [
            { month: 'Jan-24', status: 'STD' },
            { month: 'Feb-24', status: 'STD' },
            { month: 'Mar-24', status: 'SUB' },
            { month: 'Apr-24', status: 'STD' },
          ],
          dpdSummary: { dpd30: 1, dpd60: 1, dpd90: 0, maxDPD: 60, recent6MonthsDPD: 1 },
        },
        {
          accountNumber: 'PL002',
          subscriberName: 'ICICI BANK',
          accountType: 'Personal Loan',
          accountCategory: 'Unsecured',
          dateOpened: '2021-06-01',
          dateReported: '2025-01-01',
          sanctionAmount: 500000,
          currentBalance: 150000,
          emiAmount: 15000,
          tenure: 36,
          interestRate: 14.5,
          accountStatus: 'Active',
          assetClassification: 'STD',
          paymentHistory: {
            dpd: ['000','000','000','000','030','000','000','000','000','000','000','000'],
          },
          dpdSummary: { dpd30: 1, dpd60: 0, dpd90: 0, maxDPD: 30 },
        },
        {
          accountNumber: 'HL003',
          subscriberName: 'SBI BANK',
          accountType: 'Home Loan',
          accountCategory: 'Secured',
          dateOpened: '2018-01-01',
          dateReported: '2025-01-01',
          sanctionAmount: 3000000,
          currentBalance: 1800000,
          emiAmount: 25000,
          tenure: 240,
          accountStatus: 'Active',
          assetClassification: 'SUB',
          paymentHistory: {
            dpd: ['000','060','090','060','030','000','000','000','000','000','000','000'],
          },
          dpdSummary: { dpd30: 1, dpd60: 2, dpd90: 1, maxDPD: 90 },
        },
      ],
      enquiryDetails: [
        { date: '2025-01-01', institution: 'AXIS BANK',     purpose: 'Credit Card',    amount: 100000, type: 'Hard' },
        { date: '2024-12-01', institution: 'BAJAJ FINANCE',  purpose: 'Personal Loan', amount: 200000, type: 'Hard' },
      ],
      summary: {
        totalAccounts: 3,
        activeAccounts: 3,
        closedAccounts: 0,
        securedAccounts: 1,
        unsecuredAccounts: 2,
        totalOutstanding: 1975000,
        totalOverdue: 2000,
        creditUtilization: 32,
        averageAgeOfAccounts: 48,
      },
      derogatorySummary: {
        totalDelinquencies: 4,
        dpd30Count: 3,
        dpd60Count: 3,
        dpd90Count: 1,
        writtenOffAccounts: 0,
        settledAccounts: 0,
        mostRecentDelinquency: '2024-03',
      },
      riskIndicators: {
        hasRecentDelinquency: true,
        hasHighUtilization: false,
        hasMultipleEnquiries: true,
        isThinFile: false,
      },
    },
  },

  // ─────────────────────────────────────────────────────────────
  // CRM Customer Lookup
  // ─────────────────────────────────────────────────────────────
  {
    id: 'crm_lookup',
    name: 'CRM Customer Lookup',
    description: 'Fetch existing customer profile and loan history from internal CRM',
    icon: '🏢',
    category: 'CRM',
    provider: 'Internal',
    latencyP95Ms: 420,
    requestFields: [
      { path: 'pan',    label: 'PAN Number',    fieldType: 'string', isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'pan_number' } },
      { path: 'mobile', label: 'Mobile Number', fieldType: 'phone',  isRequired: false, isAutoMapped: true,  autoMapSource: { type: 'native', value: 'mobile' } },
    ],
    sampleResponse: {
      status: 'FOUND',
      customerId: 'CUST-00123',
      isExistingCustomer: true,
      customer: {
        name: 'RAVI KUMAR',
        segment: 'PRIME',
        riskCategory: 'LOW',
        kycStatus: 'VERIFIED',
        existingLoanCount: 2,
        totalExposure: 650000,
        relationshipSince: '2020-03-15',
        lastActivity: '2025-12-01',
      },
      activeLoans: [
        { loanId: 'HL-001', type: 'Home Loan',     disbursedAmount: 3000000, outstanding: 1800000, status: 'ACTIVE' },
        { loanId: 'PL-002', type: 'Personal Loan', disbursedAmount: 500000,  outstanding: 150000,  status: 'ACTIVE' },
      ],
      dedupeFlags: {
        isDuplicate: false,
        duplicateCustomerIds: [],
      },
    },
  },

  // ─────────────────────────────────────────────────────────────
  // MCA Company Check
  // ─────────────────────────────────────────────────────────────
  {
    id: 'mca_check',
    name: 'MCA Company Check',
    description: 'Director verification and company status via MCA21 database',
    icon: '📋',
    category: 'Government',
    provider: 'MCA',
    latencyP95Ms: 920,
    requestFields: [
      { path: 'pan',       label: 'Director PAN',  fieldType: 'string', isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'pan_number' } },
      { path: 'companyId', label: 'Company CIN',   fieldType: 'string', isRequired: false, isAutoMapped: false },
    ],
    sampleResponse: {
      status: 'SUCCESS',
      directorInfo: {
        name: 'RAVI KUMAR',
        din: 'DIN00123456',
        isActiveDirector: true,
        companies: [
          {
            companyName: 'ACME PRIVATE LIMITED',
            cin: 'U12345KA2015PTC123456',
            designation: 'Director',
            dateOfAppointment: '2015-01-01',
            companyStatus: 'ACTIVE',
            paidUpCapital: 1000000,
          },
        ],
        totalCompaniesCount: 1,
        defaultedCompaniesCount: 0,
      },
      flags: {
        hasDefaultedCompany: false,
        hasDisqualification: false,
        hasPendingLitigation: false,
      },
    },
  },

  // ─────────────────────────────────────────────────────────────
  // CBS Dedupe — ETB / NTB determination
  // ─────────────────────────────────────────────────────────────
  {
    id: 'cbs_dedupe',
    name: 'CBS Dedupe',
    description: 'Check Core Banking System to determine if applicant is an Existing-to-Bank (ETB) customer; pre-fills CBS profile data for ETB customers',
    icon: '🏦',
    category: 'Dedupe',
    provider: 'CBS',
    latencyP95Ms: 800,
    requestFields: [
      { path: 'pan_number',    label: 'PAN Number',    fieldType: 'string', isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'pan_number' } },
      { path: 'date_of_birth', label: 'Date of Birth', fieldType: 'date',   isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'date_of_birth' } },
    ],
    sampleResponse: {
      status: 'SUCCESS',
      is_etb: true,
      customer_name: 'RAVI KUMAR',
      customer_id: 'CBS-CUST-00123456',
      account_type: 'Savings',
      account_number: 'SB001234567890',
      address: '12, MG Road, Bengaluru, Karnataka - 560001',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      mobile_number: '9876543210',
      email_id: 'ravi@email.com',
    },
  },

  // ─────────────────────────────────────────────────────────────
  // CMS Dedupe — existing credit card check
  // ─────────────────────────────────────────────────────────────
  {
    id: 'cms_dedupe',
    name: 'CMS Dedupe',
    description: 'Check Card Management System for existing active credit cards held by the applicant; hard-rejects applicants who already hold a card',
    icon: '💳',
    category: 'Dedupe',
    provider: 'CMS',
    latencyP95Ms: 400,
    requestFields: [
      { path: 'pan_number', label: 'PAN Number', fieldType: 'string', isRequired: true, isAutoMapped: true, autoMapSource: { type: 'native', value: 'pan_number' } },
    ],
    sampleResponse: {
      status: 'SUCCESS',
      has_existing_card: false,
      existing_card_count: 0,
      cards: [],
    },
  },

  // ─────────────────────────────────────────────────────────────
  // LMS Dedupe — active in-progress application check
  // ─────────────────────────────────────────────────────────────
  {
    id: 'lms_dedupe',
    name: 'LMS Dedupe',
    description: 'Check Loan Management System for active in-progress credit card applications; enables resume flow for returning applicants',
    icon: '📋',
    category: 'Dedupe',
    provider: 'LMS',
    latencyP95Ms: 400,
    requestFields: [
      { path: 'pan_number', label: 'PAN Number', fieldType: 'string', isRequired: true, isAutoMapped: true, autoMapSource: { type: 'native', value: 'pan_number' } },
    ],
    sampleResponse: {
      status: 'SUCCESS',
      has_active_application: false,
      application_id: null,
      application_status: null,
      last_updated_at: null,
    },
  },

  // ─────────────────────────────────────────────────────────────
  // CBS Dedupe by Mobile — ETB/NTB detection for Savings STP
  // ─────────────────────────────────────────────────────────────
  {
    id: 'cbs_dedupe_mobile',
    name: 'CBS Dedupe by Mobile',
    description: 'Determine ETB/NTB status using mobile number against Core Banking System. Returns customer_id and profile data for ETB customers without requiring PAN.',
    icon: '🏦',
    category: 'Dedupe',
    provider: 'CBS',
    latencyP95Ms: 600,
    requestFields: [
      { path: 'mobile_number', label: 'Mobile Number', fieldType: 'phone', isRequired: true, isAutoMapped: true, autoMapSource: { type: 'native', value: 'mobile_number' } },
    ],
    sampleResponse: {
      status: 'SUCCESS',
      is_etb: true,
      customer_id: 'CBS-CUST-00123456',
      customer_name: 'RAVI KUMAR',
      account_number: 'SB001234567890',
      branch_code: 'BOI0001234',
    },
  },

  // ─────────────────────────────────────────────────────────────
  // CERSAI C-KYC Fetch — silent background KYC pre-fill
  // ─────────────────────────────────────────────────────────────
  {
    id: 'cersai_ckyc_fetch',
    name: 'CERSAI C-KYC Fetch',
    description: 'Fetch Central KYC record from CERSAI registry using PAN, name, and DOB. Runs silently in background to pre-fill address and identity fields. C-KYC number stored for compliance.',
    icon: '🔍',
    category: 'KYC',
    provider: 'CERSAI',
    latencyP95Ms: 1200,
    requestFields: [
      { path: 'pan_number',    label: 'PAN Number',    fieldType: 'string', isRequired: true,  isAutoMapped: true, autoMapSource: { type: 'native', value: 'pan_number' } },
      { path: 'full_name',     label: 'Full Name',     fieldType: 'string', isRequired: true,  isAutoMapped: true, autoMapSource: { type: 'native', value: 'customer_name' } },
      { path: 'date_of_birth', label: 'Date of Birth', fieldType: 'date',   isRequired: true,  isAutoMapped: true, autoMapSource: { type: 'native', value: 'date_of_birth' } },
    ],
    sampleResponse: {
      status: 'SUCCESS',
      ckyc_found: true,
      ckyc_number: 'CKYC12345678901234',
      address: '12, MG Road, Bengaluru, Karnataka - 560001',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      aadhaar_seeding_status: 'SEEDED',
    },
  },

  // ─────────────────────────────────────────────────────────────
  // LMS Lead ID Creation — fired at Entry Router after routing
  // ─────────────────────────────────────────────────────────────
  {
    id: 'lms_lead_create',
    name: 'LMS Lead ID Creation',
    description: 'Create a new lead record in the Loan Management System immediately after ETB/NTB routing. Lead ID is used to track the application through all downstream stages.',
    icon: '📋',
    category: 'LMS',
    provider: 'LMS',
    latencyP95Ms: 500,
    requestFields: [
      { path: 'pan_number',    label: 'PAN Number',    fieldType: 'string',  isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'pan_number' } },
      { path: 'mobile_number', label: 'Mobile Number', fieldType: 'phone',   isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'mobile_number' } },
      { path: 'is_etb',        label: 'Is ETB',        fieldType: 'boolean', isRequired: true,  isAutoMapped: false },
      { path: 'program_code',  label: 'Program Code',  fieldType: 'string',  isRequired: true,  isAutoMapped: false, staticValue: 'SA_STP_01' },
    ],
    sampleResponse: {
      status: 'SUCCESS',
      lead_id: 'LMS-SA-2026-000001',
      created_at: '2026-05-19T10:00:00Z',
    },
  },

  // ─────────────────────────────────────────────────────────────
  // CBS Customer ID Creation — NTB only, post eSign
  // ─────────────────────────────────────────────────────────────
  {
    id: 'cbs_customer_create',
    name: 'CBS Customer ID Creation',
    description: 'Create a new customer record in CBS for NTB applicants post eSign. Generates CBS customer ID (CIF) used for all downstream account and product creation.',
    icon: '🏦',
    category: 'CBS',
    provider: 'CBS',
    latencyP95Ms: 1000,
    requestFields: [
      { path: 'full_name',     label: 'Full Name',     fieldType: 'string', isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'customer_name' } },
      { path: 'date_of_birth', label: 'Date of Birth', fieldType: 'date',   isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'date_of_birth' } },
      { path: 'pan_number',    label: 'PAN Number',    fieldType: 'string', isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'pan_number' } },
      { path: 'mobile_number', label: 'Mobile Number', fieldType: 'phone',  isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'mobile_number' } },
      { path: 'gender',        label: 'Gender',        fieldType: 'string', isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'gender' } },
      { path: 'address',       label: 'Address',       fieldType: 'string', isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'address_line_1' } },
    ],
    sampleResponse: {
      status: 'SUCCESS',
      customer_id: 'CBS-CUST-00987654',
      cif_number: 'CIF-2026-000001',
      created_at: '2026-05-19T10:01:00Z',
    },
  },

  // ─────────────────────────────────────────────────────────────
  // CBS Account Creation — post eSign, uses BRE scheme code
  // ─────────────────────────────────────────────────────────────
  {
    id: 'cbs_account_create',
    name: 'CBS Account Creation',
    description: 'Create savings account in CBS using customer ID, BRE-determined scheme code, preferred branch, and nominee details. Debit freeze applied automatically per RBI Min KYC.',
    icon: '🏦',
    category: 'CBS',
    provider: 'CBS',
    latencyP95Ms: 1500,
    requestFields: [
      { path: 'customer_id',  label: 'CBS Customer ID',   fieldType: 'string', isRequired: true,  isAutoMapped: false },
      { path: 'scheme_code',  label: 'Scheme Code (BRE)', fieldType: 'string', isRequired: true,  isAutoMapped: false },
      { path: 'branch_code',  label: 'Branch Code',       fieldType: 'string', isRequired: true,  isAutoMapped: false },
      { path: 'nominee_name', label: 'Nominee Name',      fieldType: 'string', isRequired: true,  isAutoMapped: false },
    ],
    sampleResponse: {
      status: 'SUCCESS',
      account_number: 'SB009876543210',
      ifsc_code: 'BKID0001234',
      cif_number: 'CIF-2026-000001',
      scheme_code: 'SB101',
      debit_freeze: true,
      created_at: '2026-05-19T10:02:00Z',
    },
  },

  // ─────────────────────────────────────────────────────────────
  // DCMS Virtual Debit Card — issued immediately post account creation
  // ─────────────────────────────────────────────────────────────
  {
    id: 'dcms_virtual_debit_card',
    name: 'DCMS Virtual Debit Card',
    description: 'Issue a virtual debit card via Debit Card Management System immediately after account creation. Physical card dispatched separately; virtual card active for online transactions.',
    icon: '💳',
    category: 'DCMS',
    provider: 'DCMS',
    latencyP95Ms: 800,
    requestFields: [
      { path: 'account_number', label: 'Account Number', fieldType: 'string', isRequired: true,  isAutoMapped: false },
      { path: 'customer_id',    label: 'Customer ID',    fieldType: 'string', isRequired: true,  isAutoMapped: false },
      { path: 'card_variant',   label: 'Card Variant',   fieldType: 'string', isRequired: true,  isAutoMapped: false },
    ],
    sampleResponse: {
      status: 'SUCCESS',
      masked_card_number: '4111XXXXXXXX1234',
      kit_number: 'KIT-2026-000001',
      card_type: 'VISA_CLASSIC',
      valid_thru: '05/29',
    },
  },

  // ─────────────────────────────────────────────────────────────
  // Internet Banking Registration — post account creation
  // ─────────────────────────────────────────────────────────────
  {
    id: 'internet_banking_register',
    name: 'Internet Banking Registration',
    description: 'Auto-register the customer for internet banking using customer ID, mobile, and email. Credentials sent via SMS to registered mobile number.',
    icon: '🌐',
    category: 'Banking',
    provider: 'CBS',
    latencyP95Ms: 700,
    requestFields: [
      { path: 'customer_id',   label: 'Customer ID',   fieldType: 'string', isRequired: true,  isAutoMapped: false },
      { path: 'mobile_number', label: 'Mobile Number', fieldType: 'phone',  isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'mobile_number' } },
      { path: 'email_id',      label: 'Email ID',      fieldType: 'email',  isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'email_id' } },
    ],
    sampleResponse: {
      status: 'SUCCESS',
      ib_user_id: 'IB-2026-000001',
      sms_sent: true,
      registered_at: '2026-05-19T10:03:00Z',
    },
  },

  // ─────────────────────────────────────────────────────────────
  // UPI VPA Registration — post account creation
  // ─────────────────────────────────────────────────────────────
  {
    id: 'upi_vpa_register',
    name: 'UPI VPA Registration',
    description: 'Register a UPI Virtual Payment Address for the new account using account number and mobile. Default VPA format: mobilenumber@bankcode.',
    icon: '📱',
    category: 'Payments',
    provider: 'NPCI',
    latencyP95Ms: 600,
    requestFields: [
      { path: 'account_number', label: 'Account Number', fieldType: 'string', isRequired: true,  isAutoMapped: false },
      { path: 'mobile_number',  label: 'Mobile Number',  fieldType: 'phone',  isRequired: true,  isAutoMapped: true, autoMapSource: { type: 'native', value: 'mobile_number' } },
    ],
    sampleResponse: {
      status: 'SUCCESS',
      vpa: '9876543210@boi',
      registered_at: '2026-05-19T10:04:00Z',
    },
  },

  // ─────────────────────────────────────────────────────────────
  // LMS Lead Status Update — post account creation
  // ─────────────────────────────────────────────────────────────
  {
    id: 'lms_lead_update',
    name: 'LMS Lead Status Update',
    description: 'Update the LMS lead record with account number and current journey status. Called after account creation and at key milestones for end-to-end application tracking.',
    icon: '📋',
    category: 'LMS',
    provider: 'LMS',
    latencyP95Ms: 400,
    requestFields: [
      { path: 'lead_id',        label: 'Lead ID',        fieldType: 'string', isRequired: true,  isAutoMapped: false },
      { path: 'account_number', label: 'Account Number', fieldType: 'string', isRequired: false, isAutoMapped: false },
      { path: 'status',         label: 'Status',         fieldType: 'string', isRequired: true,  isAutoMapped: false },
    ],
    sampleResponse: {
      status: 'SUCCESS',
      lead_id: 'LMS-SA-2026-000001',
      updated_status: 'ACCOUNT_CREATED',
      updated_at: '2026-05-19T10:05:00Z',
    },
  },

  // ─────────────────────────────────────────────────────────────
  // DMS Document Push — dual push (post account creation + post CA certification)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'dms_document_push',
    name: 'DMS Document Push',
    description: 'Push signed documents to the Document Management System. Called twice: Push 1 after account creation (eSign form), Push 2 after Concurrent Auditor KYC certification.',
    icon: '📁',
    category: 'DMS',
    provider: 'DMS',
    latencyP95Ms: 1000,
    requestFields: [
      { path: 'account_number', label: 'Account Number', fieldType: 'string', isRequired: true,  isAutoMapped: false },
      { path: 'cif_number',     label: 'CIF Number',     fieldType: 'string', isRequired: true,  isAutoMapped: false },
      { path: 'document_type',  label: 'Document Type',  fieldType: 'string', isRequired: true,  isAutoMapped: false },
    ],
    sampleResponse: {
      status: 'SUCCESS',
      push_status: 'PUSHED',
      dms_reference: 'DMS-2026-000001',
      pushed_at: '2026-05-19T10:06:00Z',
    },
  },

  // ─────────────────────────────────────────────────────────────
  // BillDesk Payment Gateway — initial account funding
  // ─────────────────────────────────────────────────────────────
  {
    id: 'billdesk_payment',
    name: 'BillDesk Payment Gateway',
    description: 'Initiate and confirm initial deposit payment via BillDesk. Maximum funding limit Rs.10,000 per RBI Min KYC guidelines. Returns payment ID and transaction reference for reconciliation.',
    icon: '💰',
    category: 'Payments',
    provider: 'BillDesk',
    latencyP95Ms: 2000,
    requestFields: [
      { path: 'account_number', label: 'Account Number', fieldType: 'string', isRequired: true,  isAutoMapped: false },
      { path: 'amount',         label: 'Deposit Amount', fieldType: 'number', isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'funding_amount' } },
      { path: 'customer_id',    label: 'Customer ID',    fieldType: 'string', isRequired: true,  isAutoMapped: false },
    ],
    sampleResponse: {
      status: 'SUCCESS',
      payment_id: 'BD-PAY-2026-000001',
      transaction_ref: 'TXN-2026-0519-001',
      amount: 5000,
      payment_status: 'CAPTURED',
      paid_at: '2026-05-19T10:07:00Z',
    },
  },

  // ─────────────────────────────────────────────────────────────
  // CBS Debit Freeze Removal — ETB post liveness, NTB post CA certification
  // ─────────────────────────────────────────────────────────────
  {
    id: 'cbs_debit_freeze_remove',
    name: 'CBS Debit Freeze Removal',
    description: 'Remove debit freeze on the savings account after KYC closure. For ETB: triggered after successful liveness selfie. For NTB: triggered after Concurrent Auditor certifies VKYC.',
    icon: '🔓',
    category: 'CBS',
    provider: 'CBS',
    latencyP95Ms: 600,
    requestFields: [
      { path: 'account_number', label: 'Account Number', fieldType: 'string', isRequired: true,  isAutoMapped: false },
      { path: 'customer_id',    label: 'Customer ID',    fieldType: 'string', isRequired: true,  isAutoMapped: false },
    ],
    sampleResponse: {
      status: 'SUCCESS',
      freeze_removal_status: 'REMOVED',
      account_number: 'SB009876543210',
      removed_at: '2026-05-19T10:08:00Z',
    },
  },
];

export function getApiById(id: string): ApiDefinition | undefined {
  return API_CATALOG.find((a) => a.id === id);
}
