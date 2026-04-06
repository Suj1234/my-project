import { InputSourceType } from '../types/journey';

export interface ApiRequestField {
  path: string;           // e.g. "applicant.name.firstName"
  label: string;          // human-readable
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
    latencyP95Ms: 1450,
    requestFields: [
      { path: 'applicant.name.firstName',         label: 'First Name',          isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'first_name' } },
      { path: 'applicant.name.lastName',          label: 'Last Name',           isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'last_name' } },
      { path: 'applicant.dateOfBirth',            label: 'Date of Birth',       isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'dob' } },
      { path: 'applicant.gender',                 label: 'Gender',              isRequired: false, isAutoMapped: true,  autoMapSource: { type: 'native', value: 'gender' } },
      { path: 'applicant.identifiers.pan',        label: 'PAN Number',          isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'pan_number' } },
      { path: 'applicant.identifiers.aadhaar',    label: 'Aadhaar Number',      isRequired: false, isAutoMapped: true,  autoMapSource: { type: 'native', value: 'aadhaar_number' } },
      { path: 'applicant.contact.mobile',         label: 'Mobile Number',       isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'mobile' } },
      { path: 'applicant.contact.email',          label: 'Email',               isRequired: false, isAutoMapped: true,  autoMapSource: { type: 'native', value: 'email' } },
      { path: 'applicant.addresses[0].pincode',   label: 'Pincode',             isRequired: false, isAutoMapped: true,  autoMapSource: { type: 'native', value: 'pincode' } },
      { path: 'consent.consentGiven',             label: 'Consent Given',       isRequired: true,  isAutoMapped: true,  isSystem: true, staticValue: 'true' },
      { path: 'consent.consentTimestamp',         label: 'Consent Timestamp',   isRequired: true,  isAutoMapped: true,  isSystem: true, staticValue: 'current_timestamp' },
      { path: 'config.reportType',                label: 'Report Type',         isRequired: true,  isAutoMapped: true,  isSystem: true, staticValue: 'CCR_FULL' },
      { path: 'consent.purpose',                  label: 'Enquiry Purpose',     isRequired: true,  isAutoMapped: false },
      { path: 'config.includeEnquiries',          label: 'Include Enquiries',   isRequired: false, isAutoMapped: false },
      { path: 'config.includeDerogatory',         label: 'Include Derogatory',  isRequired: false, isAutoMapped: false },
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
    category: 'Internal CRM',
    latencyP95Ms: 420,
    requestFields: [
      { path: 'pan',    label: 'PAN Number',    isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'pan_number' } },
      { path: 'mobile', label: 'Mobile Number', isRequired: false, isAutoMapped: true,  autoMapSource: { type: 'native', value: 'mobile' } },
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
    latencyP95Ms: 920,
    requestFields: [
      { path: 'pan',       label: 'Director PAN',  isRequired: true,  isAutoMapped: true,  autoMapSource: { type: 'native', value: 'pan_number' } },
      { path: 'companyId', label: 'Company CIN',   isRequired: false, isAutoMapped: false },
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
];

export function getApiById(id: string): ApiDefinition | undefined {
  return API_CATALOG.find((a) => a.id === id);
}
