/**
 * Mock API Service
 * All functions mirror real axios calls to the FastAPI backend.
 * To switch to the real backend, replace the mock implementations
 * with: return axios.get/post/put/delete(`${API}/<endpoint>`, ...)
 *
 * Backend base: process.env.VITE_BACKEND_URL + '/api'
 */

import type { Program, NativeField, CustomField, ProgramDocument, Scheme, ClosureAction, Role, VariableMaster, OpsDashboardConfig, ProgramPage, ProgramPageCreate } from '../types/program';
import type { Master, SubMaster, MasterField, CreateMasterPayload, CreateSubMasterPayload, UpdateMasterPayload, MasterListFilters } from '../types/masterManagement';
import type { RequiredDocument, RequiredDocumentCreate } from '../types/requiredDocument';
import type { FieldManagementEntry } from '../types/fieldManagement';
import type { Workflow, WorkflowVersion } from '../types/workflow';
import type { Application } from '../types/opsDashboard';
import type { BlockData } from '../types/journey';
import { buildCCBlocks, buildSABlocks } from './mockApiHelpers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
const uuid = () => Math.random().toString(36).slice(2);
const now = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// In-memory stores (simulate a database)
// ---------------------------------------------------------------------------

const PROGRAMS_STORE: Program[] = [
  { id: '1',  program_name: 'Demo PL',                  product_category: 'PERSONAL_LOAN', vertical: ['RETAIL'], program_code: 'DPL01',  description: 'Demo personal loan program', status: 'Active',   supported_identifiers: [{ type: 'mobile', label: 'Mobile Number', placeholder: 'e.g. +91 9876543210' }, { type: 'pan', label: 'PAN Number', placeholder: 'e.g. ABCDE1234F' }],                                                                                                                    created_at: '2026-01-15T10:00:00Z', updated_at: '2026-03-20T14:30:00Z' },
  { id: '2',  program_name: 'Sample Test Cases',         product_category: 'PERSONAL_LOAN', vertical: ['GOLD'],   program_code: 'STC02',  description: '',                           status: 'Active',   supported_identifiers: [{ type: 'mobile', label: 'Mobile Number', placeholder: 'e.g. +91 9876543210' }, { type: 'pan', label: 'PAN Number', placeholder: 'e.g. ABCDE1234F' }, { type: 'aadhaar', label: 'Aadhaar Number', placeholder: 'e.g. 1234 5678 9012' }],                        created_at: '2026-01-20T09:00:00Z', updated_at: '2026-02-10T11:00:00Z' },
  { id: '3',  program_name: 'TestSMB',                   product_category: 'PERSONAL_LOAN', vertical: ['GOLD'],   program_code: 'TSMB03', description: 'Test SMB program',           status: 'Active',   supported_identifiers: [{ type: 'mobile', label: 'Mobile Number', placeholder: 'e.g. +91 9876543210' }, { type: 'account', label: 'Account Number', placeholder: 'e.g. 001234567890' }],                                                                                               created_at: '2026-02-01T08:00:00Z', updated_at: '2026-03-01T10:00:00Z' },
  { id: '4',  program_name: 'Smart Block Personal Loan', product_category: 'PERSONAL_LOAN', vertical: ['GOLD'],   program_code: 'SBPL04', description: '',                           status: 'Active',   supported_identifiers: [{ type: 'pan', label: 'PAN Number', placeholder: 'e.g. ABCDE1234F' }, { type: 'mobile', label: 'Mobile Number', placeholder: 'e.g. +91 9876543210' }],                                                                                                        created_at: '2026-02-10T10:00:00Z', updated_at: '2026-03-15T09:00:00Z' },
  { id: '5',  program_name: 'CI MSME LOAN',              product_category: 'BUSINESS_LOAN', vertical: ['MSME'],   program_code: 'CIML05', description: 'CI MSME business loan',      status: 'Active',   supported_identifiers: [{ type: 'account', label: 'Account Number', placeholder: 'e.g. 001234567890' }, { type: 'pan', label: 'PAN Number', placeholder: 'e.g. ABCDE1234F' }, { type: 'mobile', label: 'Mobile Number', placeholder: 'e.g. +91 9876543210' }],                    created_at: '2026-02-15T11:00:00Z', updated_at: '2026-04-01T08:00:00Z' },
  { id: '6',  program_name: 'Test Condition',            product_category: 'PERSONAL_LOAN', vertical: ['MSME'],   program_code: 'TC06',   description: '',                           status: 'Active',   supported_identifiers: [{ type: 'mobile', label: 'Mobile Number', placeholder: 'e.g. +91 9876543210' }],                                                                                                                                                                            created_at: '2026-02-20T12:00:00Z', updated_at: '2026-03-20T13:00:00Z' },
  { id: '7',  program_name: 'CIMSME',                    product_category: 'BUSINESS_LOAN', vertical: ['MSME'],   program_code: 'CIMS07', description: 'CI MSME program',            status: 'Active',   supported_identifiers: [{ type: 'account', label: 'Account Number', placeholder: 'e.g. 001234567890' }, { type: 'pan', label: 'PAN Number', placeholder: 'e.g. ABCDE1234F' }],                                                                                                    created_at: '2026-03-01T09:00:00Z', updated_at: '2026-04-05T10:00:00Z' },
  { id: '8',  program_name: 'genPLDemo',                 product_category: 'PERSONAL_LOAN', vertical: ['GOLD'],   program_code: 'GPL08',  description: '',                           status: 'Active',   supported_identifiers: [{ type: 'pan', label: 'PAN Number', placeholder: 'e.g. ABCDE1234F' }, { type: 'aadhaar', label: 'Aadhaar Number', placeholder: 'e.g. 1234 5678 9012' }],                                                                                                   created_at: '2026-03-05T10:00:00Z', updated_at: '2026-04-08T11:00:00Z' },
  { id: '9',  program_name: 'DemoPL',                    product_category: 'PERSONAL_LOAN', vertical: ['GOLD'],   program_code: 'DPL09',  description: 'Demo PL variant',            status: 'Active',   supported_identifiers: [{ type: 'mobile', label: 'Mobile Number', placeholder: 'e.g. +91 9876543210' }, { type: 'pan', label: 'PAN Number', placeholder: 'e.g. ABCDE1234F' }],                                                                                                    created_at: '2026-03-10T08:00:00Z', updated_at: '2026-04-10T09:00:00Z' },
  { id: '10', program_name: 'CIMSME01',                  product_category: 'BUSINESS_LOAN', vertical: ['MSME'],   program_code: 'CIM10',  description: '',                           status: 'Active',   supported_identifiers: [{ type: 'account', label: 'Account Number', placeholder: 'e.g. 001234567890' }, { type: 'mobile', label: 'Mobile Number', placeholder: 'e.g. +91 9876543210' }, { type: 'pan', label: 'PAN Number', placeholder: 'e.g. ABCDE1234F' }],                  created_at: '2026-03-12T10:00:00Z', updated_at: '2026-04-12T10:00:00Z' },
  { id: '11', program_name: 'MSME Pilot Program',        product_category: 'BUSINESS_LOAN', vertical: ['MSME'],   program_code: 'MPP11',  description: 'Pilot MSME program',         status: 'Draft',    supported_identifiers: [{ type: 'mobile', label: 'Mobile Number', placeholder: 'e.g. +91 9876543210' }],                                                                                                                                                                            created_at: '2026-03-15T11:00:00Z', updated_at: '2026-04-01T12:00:00Z' },
  { id: '12', program_name: 'Gold Loan Express',         product_category: 'PERSONAL_LOAN', vertical: ['GOLD'],   program_code: 'GLE12',  description: '',                           status: 'Inactive', supported_identifiers: [{ type: 'mobile', label: 'Mobile Number', placeholder: 'e.g. +91 9876543210' }],                                                                                                                                                                            created_at: '2026-03-18T09:00:00Z', updated_at: '2026-04-02T09:00:00Z' },
  { id: '13', program_name: 'Credit Card Onboarding',    product_category: 'CREDIT_CARD',   vertical: ['RETAIL'], program_code: 'CCO01',  description: 'End-to-end digital credit card onboarding for ETB and NTB customers', status: 'Active', supported_identifiers: [{ type: 'mobile', label: 'Mobile Number', placeholder: 'e.g. +91 9876543210' }, { type: 'pan', label: 'PAN Number', placeholder: 'e.g. ABCDE1234F' }], created_at: '2026-05-08T10:00:00Z', updated_at: '2026-05-08T10:00:00Z' },
  { id: '14', program_name: 'Savings Account STP',       product_category: 'SAVINGS_ACCOUNT', vertical: ['RETAIL'], program_code: 'SA_STP_01', description: 'End-to-end digital savings account opening for ETB and NTB customers via STP', status: 'Active', supported_identifiers: [{ type: 'mobile', label: 'Mobile Number', placeholder: 'e.g. +91 9876543210' }], created_at: '2026-05-19T10:00:00Z', updated_at: '2026-05-19T10:00:00Z' },
];

const DOCS_STORE: RequiredDocument[] = [
  { id: 'd1', document_code: 'DOC001', document_name: 'Aadhaar Card', document_category: 'POI', supported_formats: ['PDF', 'JPG', 'PNG'], min_size: 0.1, max_size: 5, status: 'Active', created_at: '2026-01-10T10:00:00Z', updated_at: '2026-01-10T10:00:00Z' },
  { id: 'd2', document_code: 'DOC002', document_name: 'PAN Card', document_category: 'POI', supported_formats: ['PDF', 'JPG'], min_size: 0.1, max_size: 2, status: 'Active', created_at: '2026-01-12T10:00:00Z', updated_at: '2026-01-12T10:00:00Z' },
  { id: 'd3', document_code: 'DOC003', document_name: 'Bank Statement (6 months)', document_category: 'Bank Statement', supported_formats: ['PDF', 'XLSX', 'CSV'], min_size: 0.5, max_size: 10, status: 'Active', created_at: '2026-01-15T10:00:00Z', updated_at: '2026-02-01T10:00:00Z' },
  { id: 'd4', document_code: 'DOC004', document_name: 'ITR - Last 2 Years', document_category: 'ITR', supported_formats: ['PDF'], min_size: 0.1, max_size: 5, status: 'Draft', created_at: '2026-02-01T10:00:00Z', updated_at: '2026-02-01T10:00:00Z' },
  { id: 'd5', document_code: 'DOC005', document_name: 'Salary Slip', document_category: 'Income Proof', supported_formats: ['PDF', 'JPG', 'PNG'], min_size: 0.1, max_size: 3, status: 'Active', created_at: '2026-02-10T10:00:00Z', updated_at: '2026-03-01T10:00:00Z' },
];

const VARIABLE_MASTER_STORE: VariableMaster[] = [
  { id: 'v1', variable_name: 'customer_name', data_type: 'Native', field_type: 'String', category: 'Personal Information', description: 'Full name of customer' },
  { id: 'v2', variable_name: 'date_of_birth', data_type: 'Native', field_type: 'Date', category: 'Personal Information', description: 'Date of birth' },
  { id: 'v3', variable_name: 'pan_number', data_type: 'Native', field_type: 'String', category: 'Identity Documents', description: 'PAN card number' },
  { id: 'v4', variable_name: 'mobile_number', data_type: 'Native', field_type: 'String', category: 'Contact Information', description: 'Mobile phone number' },
  { id: 'v5', variable_name: 'email_id', data_type: 'Native', field_type: 'String', category: 'Contact Information', description: 'Email address' },
  { id: 'v6', variable_name: 'loan_amount', data_type: 'Native', field_type: 'Float', category: 'Loan Details', description: 'Requested loan amount' },
  { id: 'v7', variable_name: 'monthly_income', data_type: 'Native', field_type: 'Float', category: 'Financial Details', description: 'Monthly income' },
  { id: 'v8', variable_name: 'employment_type', data_type: 'Native', field_type: 'String', category: 'Employment Details', description: 'Employment category' },
  { id: 'v9', variable_name: 'credit_score', data_type: 'Native', field_type: 'Integer', category: 'Financial Details', description: 'Bureau credit score' },
  { id: 'v10', variable_name: 'pincode', data_type: 'Native', field_type: 'String', category: 'Contact Information', description: 'Area pincode' },
];

const FIELD_MGMT_STORE: FieldManagementEntry[] = [
  { id: 'f1', variable_id: 'v1', variable_name: 'customer_name', field_type: 'String', alias: 'Customer Name', description: 'Full name of customer', category: 'Personal Information', status: 'Active' },
  { id: 'f2', variable_id: 'v3', variable_name: 'pan_number', field_type: 'String', alias: 'PAN Number', description: 'PAN card number', category: 'Identity Documents', status: 'Active' },
  { id: 'f3', variable_id: 'v6', variable_name: 'loan_amount', field_type: 'Float', alias: 'Loan Amount', description: 'Requested loan amount', category: 'Loan Details', status: 'Active' },
  { id: 'f4', variable_id: 'v9', variable_name: 'credit_score', field_type: 'Integer', alias: 'Credit Score', description: 'Bureau credit score', category: 'Financial Details', status: 'Active' },
];

const WORKFLOWS_STORE: Workflow[] = [
  {
    id: 'wf1',
    program_id: '1',
    workflow_name: 'Perfios PL Workflow',
    workflow_code: 'PPL02W',
    description: 'KYC and credit assessment workflow for personal loans',
    default_version: 'v1',
    status: 'ACTIVE',
    created_at: '2026-04-09T07:11:33Z',
    updated_at: '2026-04-09T07:15:02Z',
    versions: [
      {
        id: 'wfv1',
        workflow_id: 'wf1',
        version: 'v1',
        status: 'ACTIVE',
        canvas_blocks: [],
        created_at: '2026-04-09T07:14:29Z',
        updated_at: '2026-04-13T08:01:57Z',
      },
      {
        id: 'wfv2',
        workflow_id: 'wf1',
        version: 'v2',
        status: 'DRAFT',
        canvas_blocks: [],
        created_at: '2026-04-12T10:00:00Z',
        updated_at: '2026-04-12T10:00:00Z',
      },
    ],
  },
  {
    id: 'wf2',
    program_id: '1',
    workflow_name: 'Onboarding Flow',
    workflow_code: 'ONBOARD_01',
    description: 'Customer onboarding and document collection',
    default_version: 'v1',
    status: 'DRAFT',
    created_at: '2026-04-10T09:00:00Z',
    updated_at: '2026-04-10T09:00:00Z',
    versions: [
      {
        id: 'wfv3',
        workflow_id: 'wf2',
        version: 'v1',
        status: 'DRAFT',
        canvas_blocks: [],
        created_at: '2026-04-10T09:00:00Z',
        updated_at: '2026-04-10T09:00:00Z',
      },
    ],
  },
  {
    id: 'wf3',
    program_id: '5',
    workflow_name: 'MSME Credit Flow',
    workflow_code: 'MSME_CREDIT_01',
    description: 'Credit assessment for MSME loan applications',
    default_version: 'v1',
    status: 'ACTIVE',
    created_at: '2026-04-05T08:00:00Z',
    updated_at: '2026-04-05T08:00:00Z',
    versions: [
      {
        id: 'wfv4',
        workflow_id: 'wf3',
        version: 'v1',
        status: 'ACTIVE',
        canvas_blocks: [],
        created_at: '2026-04-05T08:00:00Z',
        updated_at: '2026-04-05T08:00:00Z',
      },
    ],
  },
  {
    id: 'wf4',
    program_id: '13',
    workflow_name: 'Credit Card Onboarding Journey',
    workflow_code: 'CCO_MAIN_01',
    description: 'End-to-end STP journey â€” 25 blocks covering ETB/NTB KYC, income verification, credit assessment, card selection, eSign, and VKYC',
    default_version: 'v1',
    status: 'ACTIVE',
    created_at: '2026-05-08T10:00:00Z',
    updated_at: '2026-05-08T10:00:00Z',
    versions: [
      {
        id: 'wfv5',
        workflow_id: 'wf4',
        version: 'v1',
        status: 'ACTIVE',
        created_at: '2026-05-08T10:00:00Z',
        updated_at: '2026-05-08T10:00:00Z',
        canvas_blocks: [
          /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
           * CREDIT CARD ONBOARDING â€” 25 blocks
           * Common path: Start â†’ PAN Verify â†’ Entry Router
           * ETB branch:  Entry Router â†’ ETB Profile â†’ Employment & Income
           * NTB branch:  Entry Router â†’ Aadhaar â†’ Liveness â†’ NTB Profile â†’ Employment & Income
           * Income:      Employment & Income â†’ Income Router â†’ [Payslip | ITR] â†’ BSA
           * Decision:    BSA â†’ Credit Assessment â†’ Credit Router â†’ [Pre-Qual | Rejection]
           * Fulfilment:  Pre-Qual â†’ Card Select â†’ Card Prefs â†’ MITC â†’ Consent â†’ eSign
           * Close:       eSign â†’ Post-eSign Router â†’ [ETB End | VKYC â†’ NTB End]
           * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

          // 1 â”€ Journey Start
          {
            id: 'blk_start', type: 'start', name: 'Journey Start',
            description: 'Credit card application entry via web channel with OTP authentication',
            configured: true,
            entrySource: 'web', authRequired: true, authMethod: 'otp',
            collectConsent: true, consentScope: 'credit_card_application',
            prefillSource: 'none', passthroughParams: [], startWebhookEnabled: false,
          },
          // 2 â”€ PAN Verification â€” checks + 4 data hooks (CBS, CMS, LMS, CIBIL)
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
          // 3 â”€ Entry Router â€” reject existing card holders; route ETB vs NTB
          {
            id: 'blk_entry_router', type: 'router', name: 'Entry Router',
            description: 'Reject applicants with active credit card; route ETB to pre-filled profile; default NTB to Aadhaar OTP eKYC',
            configured: true, routerBranchType: 'exclusive', defaultRoute: 'blk_aadhaar',
            routings: [
              {
                id: 'route_reject_card', label: 'Has Existing Card â†’ Reject', routingType: 'condition', saved: true,
                conditionGroups: [{ id: 'cg_has_card', operator: 'AND', conditions: [{ id: 'c_has_card', parameter: 'has_existing_card', operator: '=', value: 'true', fieldType: 'text' }] }], targetBlockId: 'blk_rejection_end',
              },
              {
                id: 'route_etb', label: 'ETB Customer â†’ Profile Review', routingType: 'condition', saved: true,
                conditionGroups: [{ id: 'cg_etb', operator: 'AND', conditions: [{ id: 'c_etb', parameter: 'is_etb', operator: '=', value: 'true', fieldType: 'text' }] }], targetBlockId: 'blk_etb_profile',
              },
            ],
          },
          // 4 â”€ ETB Customer Profile (form â€” CBS pre-fill, 3 pages)
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
          // 5 â”€ Aadhaar OTP eKYC (NTB path)
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
          // 6 â”€ Liveness & Face Match (NTB path)
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
          // 7 â”€ NTB Customer Profile (form â€” 3 pages)
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
          // 8 â”€ Employment & Income Details (form â€” 2 pages)
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
                  { id: 'inp_income', key: 'monthly_income', label: 'Net Monthly Income (â‚¹)',      type: 'number', required: true,  fieldSource: 'native' },
                  { id: 'inp_emi',    key: 'existing_emi',   label: 'Monthly EMI Obligations (â‚¹)', type: 'number', required: false, fieldSource: 'custom' },
                ],
              },
            ],
          },
          // 9 â”€ Employment Type Router
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
          // 10 â”€ Salary Slip Upload (Salaried path)
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
          // 11 â”€ ITR Fetch & Analysis (Self-employed path)
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
          // 12 â”€ Bank Statement Analysis
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
          // 13 â”€ Credit Assessment Decision (CIBIL score captured at PAN step)
          {
            id: 'blk_credit_decision', type: 'decision', name: 'Credit Assessment',
            description: 'Evaluate credit eligibility using CIBIL score from PAN step: score â‰¥ 740 = PASS, score = 0 (NAI) = FLAG, 0 < score < 740 = REJECT',
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
          // 14 â”€ Credit Verdict Router
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
          // 15 â”€ Pre-Qualification Offer
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
          // 16 â”€ Card Variant Selection
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
          // 17 â”€ Card Preferences (form â€” 2 pages: add-on card + embossing)
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
          // 18 â”€ MITC / KFS Document
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
          // 19 â”€ Final Consent (form â€” 1 page)
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
          // 20 â”€ Application eSign
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
          // 21 â”€ Post eSign Router
          {
            id: 'blk_post_esign_router', type: 'router', name: 'Post eSign Router',
            description: 'Route ETB customers to completion (no VKYC); route NTB customers to mandatory video KYC',
            configured: true, routerBranchType: 'exclusive', defaultRoute: 'blk_vkyc',
            routings: [
              {
                id: 'route_etb_done', label: 'ETB â€” Skip VKYC', routingType: 'condition', saved: true,
                conditionGroups: [{ id: 'cg_etb_done', operator: 'AND', conditions: [{ id: 'c_etb_done', parameter: 'is_etb', operator: '=', value: 'true', fieldType: 'text' }] }], targetBlockId: 'blk_etb_end',
              },
              {
                id: 'route_ntb_vkyc', label: 'NTB â€” Proceed to VKYC', routingType: 'condition', saved: true,
                conditionGroups: [{ id: 'cg_ntb_vkyc', operator: 'AND', conditions: [{ id: 'c_ntb_vkyc', parameter: 'is_etb', operator: '=', value: 'false', fieldType: 'text' }] }], targetBlockId: 'blk_vkyc',
              },
            ],
          },
          // 22 â”€ ETB Success End
          {
            id: 'blk_etb_end', type: 'end', name: 'Application Successful (ETB)',
            description: 'Terminal success state for existing bank customers â€” card issuance order placed in CMS',
            configured: true, journeyState: 'ETB_COMPLETE',
          },
          // 23 â”€ Video KYC (NTB mandatory)
          {
            id: 'blk_vkyc', type: 'smart', blockTypeId: 'vkyc',
            name: 'Video KYC', category: 'identity', provider: 'VKYC Vendor',
            description: 'Mandatory video KYC for NTB customers â€” must be completed within 3 working days of eSign',
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
                options: [{ label: '9 AM â€“ 6 PM (Monâ€“Sat)', value: '9am_6pm' }, { label: '9 AM â€“ 8 PM (Monâ€“Sat)', value: '9am_8pm' }, { label: '9 AM â€“ 6 PM (Monâ€“Sun)', value: '9am_6pm_all' }] },
            ],
          },
          // 24 â”€ NTB Success End
          {
            id: 'blk_ntb_end', type: 'end', name: 'Application Successful (NTB)',
            description: 'Terminal success state for NTB customers after VKYC completion â€” card issuance order placed',
            configured: true, journeyState: 'NTB_COMPLETE',
          },
          // 25 â”€ Rejection Terminal State
          {
            id: 'blk_rejection_end', type: 'end', name: 'Application Rejected',
            description: 'Terminal state for rejected credit card applications â€” rejection SMS/email triggered',
            configured: true, journeyState: 'REJECTED',
          },
        ],
      },
    ],
  },
  {
    id: 'wf5',
    program_id: '14',
    workflow_name: 'Savings Account STP Journey',
    workflow_code: 'SA_STP_01',
    description: 'End-to-end STP savings account opening â€” 20 blocks covering ETB/NTB KYC, scheme selection, eSign, account creation, funding, and KYC closure',
    default_version: 'v1',
    status: 'ACTIVE',
    created_at: '2026-05-19T10:00:00Z',
    updated_at: '2026-05-19T10:00:00Z',
    versions: [
      {
        id: 'wfv6',
        workflow_id: 'wf5',
        version: 'v1',
        status: 'ACTIVE',
        created_at: '2026-05-19T10:00:00Z',
        updated_at: '2026-05-19T10:00:00Z',
        canvas_blocks: [
          /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
           * SAVINGS ACCOUNT STP â€” 20 blocks
           * Common:    Start â†' PAN Verify â†' Entry Router
           * ETB:       Entry Router â†' ETB Profile â†' Merge
           * NTB:       Entry Router â†' Aadhaar â†' NTB Personal â†' Merge
           * Common:    Merge â†' Branch & Nominee â†' BRE Scheme â†' VAS â†' FATCA
           *            â†' eSign â†' Account Funding â†' KYC Closure Router
           * ETB close: KYC Closure â†' Liveness â†' ETB Success End
           * NTB close: KYC Closure â†' VKYC â†' NTB VKYC Pending End
           * Reject:    PAN checks â†' Rejected End | Funding fail â†' Payment End
           * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

          // 1 â”€ Journey Start
          {
            id: 'sab_start', type: 'start', name: 'Journey Start',
            description: 'Savings account application entry via web channel with mobile OTP authentication',
            configured: true,
            entrySource: 'web', authRequired: true, authMethod: 'otp',
            collectConsent: true, consentScope: 'Terms & Conditions, Privacy Policy, Product T&C',
            prefillSource: 'none', passthroughParams: [], startWebhookEnabled: false,
          },

          // 2 â”€ PAN Verification â€” NSDL/PAN Profile provider + AML/CFR/age/pincode checks + 3 data hooks
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

          // 3 â”€ Entry Router â€” ETB vs NTB; Lead ID created after routing
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

          // 4 â”€ ETB Customer Profile (form â€” CBS pre-fill, 3 pages)
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

          // 5 â”€ Aadhaar OTP eKYC (NTB path)
          {
            id: 'sab_aadhaar', type: 'smart', blockTypeId: 'aadhaar_verification',
            name: 'Aadhaar OTP eKYC', category: 'identity', provider: 'DigiLocker',
            description: 'OTP-based Aadhaar eKYC for NTB customers. Aadhaar XML fetched â€” number never stored, ARK retained in Vault.',
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

          // 6 â”€ NTB Personal Details (form â€” post Aadhaar, 3 pages)
          {
            id: 'sab_ntb_personal', type: 'form', name: 'NTB Personal Details',
            description: 'Collect additional personal details for NTB customers â€” pre-filled from Aadhaar where available. Includes place of birth per BRD requirement.',
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

          // 7 â”€ ETB / NTB Merge
          {
            id: 'sab_merge', type: 'merge', name: 'ETB / NTB Merge',
            description: 'Converge ETB and NTB paths into single common journey flow',
            configured: true,
          },

          // 8 â”€ Branch & Nominee Details (form â€” 2 pages, common to ETB and NTB)
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

          // 9 â”€ BRE Scheme Selection (Smart â€” offer_generation, savings_account)
          {
            id: 'sab_bre', type: 'smart', blockTypeId: 'offer_generation',
            name: 'BRE Scheme Selection', category: 'decision', provider: 'BRE Integration',
            description: 'BRE determines eligible savings scheme code (SB101â€”SB190) based on age, gender, employment and income. Customer previews scheme before eSign.',
            configured: true, hasRetry: false,
            pages: [
              { id: 'generate_offer', name: 'Scheme Evaluation â€” Loader', actions: ['Scheme evaluation initiated'], userInputs: [] },
              { id: 'show_offer',     name: 'Scheme Preview Page',        actions: ['Scheme displayed', 'Scheme accepted'], userInputs: [] },
            ],
            generalConfig: [
              { id: 'bre', name: 'Which BRE to Call', type: 'select', value: 'bre_v1',
                options: [{ label: 'BRE v1 - Standard', value: 'bre_v1' }, { label: 'BRE v2 - Advanced', value: 'bre_v2' }, { label: 'BRE v3 - Premium', value: 'bre_v3' }] },
              { id: 'product_type', name: 'Product Type', type: 'select', value: 'savings_account',
                options: [{ label: 'Lending (Loans)', value: 'lending' }, { label: 'Credit Card', value: 'credit_card' }, { label: 'Savings Account', value: 'savings_account' }] },
            ],
          },

          // 10 â”€ Value Added Services (form â€” 1 page)
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

          // 11 â”€ FATCA + PEP + Terms & Conditions (form â€” 2 pages)
          {
            id: 'sab_fatca', type: 'form', name: 'FATCA, PEP & Terms',
            description: 'Regulatory declarations â€” FATCA (US person), PEP, source of funds, annual income, and T&C acceptance',
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

          // 12 â”€ eSign â€” Savings Account Opening Form + 7 post-sign data hooks
          {
            id: 'sab_esign', type: 'smart', blockTypeId: 'esign',
            name: 'eSign â€” Account Opening Form', category: 'fulfilment', provider: 'TKYC',
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
                    id: 'sab_dhapi_lms_final', apiId: 'lms_lead_update', apiName: 'LMS Lead Update â€” Account Created',
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
                    id: 'sab_dhapi_dms1', apiId: 'dms_document_push', apiName: 'DMS Document Push â€” Push 1 (Account Created)',
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

          // 13 — Payment Collection (Smart — BillDesk, max ₹10,000, customer enters amount)
          {
            id: 'sab_funding', type: 'smart', blockTypeId: 'payment_gateway',
            name: 'Payment Collection', category: 'fulfilment', provider: 'billdesk',
            description: 'Initial deposit up to ₹10,000 via BillDesk. Debit freeze applied at account creation per RBI Min KYC — removed only after KYC closure.',
            configured: true, hasRetry: true,
            pages: [
              { id: 'payment_summary',    name: 'Payment Summary Page',    actions: ['Payment initiated'],                    userInputs: [{ id: 'payment_amount', name: 'Payment Amount (₹)', type: 'number', dataType: 'NUMBER', required: true, fieldSource: 'custom', key: 'payment_amount' }] },
              { id: 'payment_processing', name: 'Payment Processing Page', actions: ['Payment submitted'],                    userInputs: [] },
              { id: 'payment_result',     name: 'Payment Result Page',     actions: ['Payment completed', 'Payment failed'], userInputs: [] },
            ],
            generalConfig: [
              { id: 'payment_purpose',   name: 'Payment Description',   type: 'text',   value: 'Initial deposit for savings account activation' },
              { id: 'amount_source',     name: 'Amount Source',         type: 'select', value: 'customer_enters',
                options: [{ label: 'Fixed Amount (configured here)', value: 'fixed_amount' }, { label: 'Customer Enters Amount', value: 'customer_enters' }, { label: 'Amount from an Earlier Step', value: 'previous_step' }] },
              { id: 'min_amount',        name: 'Minimum Amount (₹)',    type: 'number', value: 1 },
              { id: 'max_amount',        name: 'Maximum Amount (₹)',    type: 'number', value: 10000 },
              { id: 'currency',          name: 'Currency',              type: 'select', value: 'INR',
                options: [{ label: 'Indian Rupee (₹ INR)', value: 'INR' }, { label: 'US Dollar ($ USD)', value: 'USD' }] },
              { id: 'allowed_payment_methods', name: 'Allowed Payment Methods', type: 'multiselect', value: ['upi', 'cards', 'emi', 'netbanking', 'wallet', 'paylater'],
                options: [{ label: 'UPI', value: 'upi' }, { label: 'Credit & Debit Cards', value: 'cards' }, { label: 'EMI', value: 'emi' }, { label: 'Net Banking', value: 'netbanking' }, { label: 'Wallets', value: 'wallet' }, { label: 'Pay Later', value: 'paylater' }] },
              { id: 'prefill_customer_details', name: 'Pre-fill Customer Contact Details', type: 'toggle', value: true },
              { id: 'payment_timeout_minutes',  name: 'Payment Session Timeout (minutes)', type: 'number', value: 15 },
            ],
            dataHooks: [
              {
                id: 'hook_sab_payment', eventKey: 'after_payment_result_page', eventLabel: 'After Payment Result Page',
                apis: [
                  {
                    id: 'sab_dhapi_billdesk', apiId: 'billdesk_payment', apiName: 'BillDesk Payment Gateway',
                    trigger: 'after_block_complete', latencyP95Ms: 2000,
                    inputMappings: [
                      { requestPath: 'account_number', label: 'Account Number', sourceType: 'custom', sourceValue: 'account_number',  isAutoMapped: false },
                      { requestPath: 'amount',         label: 'Payment Amount', sourceType: 'custom', sourceValue: 'payment_amount',  isAutoMapped: true },
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

          // 14 â”€ KYC Closure Router â€” ETB â†' Liveness; NTB â†' VKYC
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

          // 15 â”€ Liveness & Face Match (ETB path â€” debit freeze removal on pass)
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

          // 16 â”€ ETB Success End
          {
            id: 'sab_etb_end', type: 'end', name: 'Account Opened Successfully (ETB)',
            description: 'Terminal success state for ETB customers â€” account active, debit card issued, internet banking and UPI registered, debit freeze removed',
            configured: true, journeyState: 'ETB_ACCOUNT_ACTIVE',
          },

          // 17 â”€ Video KYC (NTB mandatory â€” DMS Push 2 after Concurrent Auditor certifies)
          {
            id: 'sab_vkyc', type: 'smart', blockTypeId: 'vkyc',
            name: 'Video KYC', category: 'identity', provider: 'VKYC Vendor',
            description: 'Mandatory Video KYC for NTB customers â€” must be completed within 3 working days of eSign. Concurrent Auditor certification triggers DMS Push 2.',
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
                options: [{ label: '9 AM â€” 6 PM (Monâ€”Sat)', value: '9am_6pm' }, { label: '9 AM â€” 8 PM (Monâ€”Sat)', value: '9am_8pm' }, { label: '9 AM â€” 6 PM (Monâ€”Sun)', value: '9am_6pm_all' }] },
            ],
            dataHooks: [
              {
                id: 'hook_sab_vkyc_post', eventKey: 'after_vkyc_outcome_page', eventLabel: 'After VKYC Outcome Page',
                apis: [
                  {
                    id: 'sab_dhapi_dms2', apiId: 'dms_document_push', apiName: 'DMS Document Push â€” Push 2 (Post CA Certification)',
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

          // 18 â”€ NTB VKYC Pending End
          {
            id: 'sab_ntb_end', type: 'end', name: 'Account Opened â€” VKYC Pending (NTB)',
            description: 'Terminal state for NTB customers â€” account created with debit freeze, VKYC appointment scheduled, customer notified via SMS/email',
            configured: true, journeyState: 'NTB_VKYC_PENDING',
          },

          // 19 â”€ Application Rejected End
          {
            id: 'sab_rejected', type: 'end', name: 'Application Rejected',
            description: 'Terminal rejection state â€” AML / CFR / age / pincode check failure; rejection SMS and email triggered to applicant',
            configured: true, journeyState: 'APPLICATION_REJECTED',
          },

          // 20 â”€ Payment Not Completed End
          {
            id: 'sab_payment_failed', type: 'end', name: 'Payment Not Completed',
            description: 'Terminal state when initial funding payment fails or is abandoned â€” account placed on hold, retry link sent to customer within 24 hours',
            configured: true, journeyState: 'PAYMENT_PENDING',
          },
        ],
      },
    ],
  },

  // ── Canvas A: Credit Card Onboarding (Step Divider approach) ──────────────
  {
    id: 'wf-cc-a',
    program_id: '13',
    workflow_name: 'CC Onboarding — Canvas A (Step Divider)',
    workflow_code: 'CCO_A_01',
    description: 'Credit Card Onboarding replica for Canvas A — Step Divider blocks separate logical steps',
    default_version: 'v1',
    status: 'DRAFT',
    created_at: '2026-05-25T10:00:00Z',
    updated_at: '2026-05-25T10:00:00Z',
    versions: [
      {
        id: 'wfv-cc-a',
        workflow_id: 'wf-cc-a',
        version: 'v1',
        status: 'DRAFT',
        created_at: '2026-05-25T10:00:00Z',
        updated_at: '2026-05-25T10:00:00Z',
        canvas_blocks: buildCCBlocks('a'),
      },
    ],
  },

  // ── Canvas B: Credit Card Onboarding (Ask When You Add approach) ──────────
  {
    id: 'wf-cc-b',
    program_id: '13',
    workflow_name: 'CC Onboarding — Canvas B (Ask When Add)',
    workflow_code: 'CCO_B_01',
    description: 'Credit Card Onboarding replica for Canvas B — step badge assigned to each block via dialog',
    default_version: 'v1',
    status: 'DRAFT',
    created_at: '2026-05-25T10:00:00Z',
    updated_at: '2026-05-25T10:00:00Z',
    versions: [
      {
        id: 'wfv-cc-b',
        workflow_id: 'wf-cc-b',
        version: 'v1',
        status: 'DRAFT',
        created_at: '2026-05-25T10:00:00Z',
        updated_at: '2026-05-25T10:00:00Z',
        canvas_blocks: buildCCBlocks('b'),
      },
    ],
  },

  // ── Canvas C: Credit Card Onboarding (Container Box approach) ────────────
  {
    id: 'wf-cc-c',
    program_id: '13',
    workflow_name: 'CC Onboarding — Canvas C (Container Box)',
    workflow_code: 'CCO_C_01',
    description: 'Credit Card Onboarding replica for Canvas C — group container boxes wrap related blocks',
    default_version: 'v1',
    status: 'DRAFT',
    created_at: '2026-05-25T10:00:00Z',
    updated_at: '2026-05-25T10:00:00Z',
    versions: [
      {
        id: 'wfv-cc-c',
        workflow_id: 'wf-cc-c',
        version: 'v1',
        status: 'DRAFT',
        created_at: '2026-05-25T10:00:00Z',
        updated_at: '2026-05-25T10:00:00Z',
        canvas_blocks: buildCCBlocks('c'),
      },
    ],
  },

  // ── Canvas A: Savings Account STP (Step Divider approach) ────────────────
  {
    id: 'wf-sa-a',
    program_id: '14',
    workflow_name: 'SA STP — Canvas A (Step Divider)',
    workflow_code: 'SA_A_01',
    description: 'Savings Account STP replica for Canvas A — Step Divider blocks separate logical steps',
    default_version: 'v1',
    status: 'DRAFT',
    created_at: '2026-05-25T10:00:00Z',
    updated_at: '2026-05-25T10:00:00Z',
    versions: [
      {
        id: 'wfv-sa-a',
        workflow_id: 'wf-sa-a',
        version: 'v1',
        status: 'DRAFT',
        created_at: '2026-05-25T10:00:00Z',
        updated_at: '2026-05-25T10:00:00Z',
        canvas_blocks: buildSABlocks('a'),
      },
    ],
  },

  // ── Canvas B: Savings Account STP (Ask When You Add approach) ────────────
  {
    id: 'wf-sa-b',
    program_id: '14',
    workflow_name: 'SA STP — Canvas B (Ask When Add)',
    workflow_code: 'SA_B_01',
    description: 'Savings Account STP replica for Canvas B — step badge assigned to each block via dialog',
    default_version: 'v1',
    status: 'DRAFT',
    created_at: '2026-05-25T10:00:00Z',
    updated_at: '2026-05-25T10:00:00Z',
    versions: [
      {
        id: 'wfv-sa-b',
        workflow_id: 'wf-sa-b',
        version: 'v1',
        status: 'DRAFT',
        created_at: '2026-05-25T10:00:00Z',
        updated_at: '2026-05-25T10:00:00Z',
        canvas_blocks: buildSABlocks('b'),
      },
    ],
  },

  // ── Canvas C: Savings Account STP (Container Box approach) ───────────────
  {
    id: 'wf-sa-c',
    program_id: '14',
    workflow_name: 'SA STP — Canvas C (Container Box)',
    workflow_code: 'SA_C_01',
    description: 'Savings Account STP replica for Canvas C — group container boxes wrap related blocks',
    default_version: 'v1',
    status: 'DRAFT',
    created_at: '2026-05-25T10:00:00Z',
    updated_at: '2026-05-25T10:00:00Z',
    versions: [
      {
        id: 'wfv-sa-c',
        workflow_id: 'wf-sa-c',
        version: 'v1',
        status: 'DRAFT',
        created_at: '2026-05-25T10:00:00Z',
        updated_at: '2026-05-25T10:00:00Z',
        canvas_blocks: buildSABlocks('c'),
      },
    ],
  },
];

const APPLICATIONS_STORE: Application[] = [
  { id: 'app1', application_id: 'APP-2026-001', program_id: '1', program_name: 'Demo PL', program_code: 'DPL01', status: 'Approved', customer_name: 'Rahul Sharma', loan_amount: 500000, monthly_income: 80000, pan_number: 'ABCPS1234D', mobile_number: '9876543210', created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-15T14:00:00Z' },
  { id: 'app2', application_id: 'APP-2026-002', program_id: '1', program_name: 'Demo PL', program_code: 'DPL01', status: 'Pending', customer_name: 'Priya Patel', loan_amount: 300000, monthly_income: 55000, pan_number: 'XYZPP9876C', mobile_number: '9812345678', created_at: '2026-03-10T11:00:00Z', updated_at: '2026-03-10T11:00:00Z' },
  { id: 'app3', application_id: 'APP-2026-003', program_id: '5', program_name: 'CI MSME LOAN', program_code: 'CIML05', status: 'Rejected', customer_name: 'Vikram Singh', loan_amount: 2000000, monthly_income: 150000, pan_number: 'LMNVS5432E', mobile_number: '9988776655', created_at: '2026-04-01T09:00:00Z', updated_at: '2026-04-05T10:00:00Z' },
];

const SCHEMES_STORE: Scheme[] = [
  { id: 's1', scheme_name: 'Standard Scheme', scheme_code: 'STD01', status: 'Active' },
  { id: 's2', scheme_name: 'Premium Scheme', scheme_code: 'PRM02', status: 'Active' },
];

const CLOSURE_ACTIONS_STORE: ClosureAction[] = [
  { id: 'ca1', action_name: 'Loan Disbursement', action_code: 'LD01' },
  { id: 'ca2', action_name: 'Application Rejection', action_code: 'AR02' },
];

const ROLES_STORE: Role[] = [
  { id: 'r1', role_name: 'Branch Manager', role_code: 'BM01' },
  { id: 'r2', role_name: 'Credit Officer', role_code: 'CO02' },
  { id: 'r3', role_name: 'Field Officer', role_code: 'FO03' },
];

const NATIVE_FIELDS_STORE: Record<string, NativeField[]> = {};
const CUSTOM_FIELDS_STORE: Record<string, CustomField[]> = {};
const PROGRAM_DOCS_STORE: Record<string, ProgramDocument[]> = {};
const OPS_CONFIG_STORE: Record<string, OpsDashboardConfig> = {};

// ---------------------------------------------------------------------------
// Programs
// ---------------------------------------------------------------------------
export const programsApi = {
  list: async (): Promise<Program[]> => {
    await delay();
    // Real: return (await axios.get(`${API}/programs`)).data;
    return [...PROGRAMS_STORE];
  },
  get: async (id: string): Promise<Program> => {
    await delay();
    const p = PROGRAMS_STORE.find((x) => x.id === id);
    if (!p) throw new Error('Program not found');
    return { ...p };
  },
  create: async (data: Partial<Program>): Promise<Program> => {
    await delay();
    const p: Program = { ...data as Program, id: uuid(), created_at: now(), updated_at: now() };
    PROGRAMS_STORE.push(p);
    return p;
  },
  update: async (id: string, data: Partial<Program>): Promise<Program> => {
    await delay();
    const idx = PROGRAMS_STORE.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Program not found');
    PROGRAMS_STORE[idx] = { ...PROGRAMS_STORE[idx], ...data, updated_at: now() };
    return { ...PROGRAMS_STORE[idx] };
  },
};

// ---------------------------------------------------------------------------
// Required Documents
// ---------------------------------------------------------------------------
export const documentsApi = {
  list: async (params?: { search?: string; category?: string; status?: string }): Promise<RequiredDocument[]> => {
    await delay();
    let result = [...DOCS_STORE];
    if (params?.search) result = result.filter((d) => d.document_name.toLowerCase().includes(params.search!.toLowerCase()));
    if (params?.category && params.category.trim()) result = result.filter((d) => d.document_category === params.category);
    if (params?.status && params.status.trim()) result = result.filter((d) => d.status === params.status);
    return result;
  },
  get: async (id: string): Promise<RequiredDocument> => {
    await delay();
    const d = DOCS_STORE.find((x) => x.id === id);
    if (!d) throw new Error('Document not found');
    return { ...d };
  },
  create: async (data: RequiredDocumentCreate): Promise<RequiredDocument> => {
    await delay();
    const count = DOCS_STORE.length + 1;
    const d: RequiredDocument = { ...data, id: uuid(), document_code: `DOC${String(count).padStart(3, '0')}`, created_at: now(), updated_at: now() };
    DOCS_STORE.push(d);
    return d;
  },
  update: async (id: string, data: Partial<RequiredDocument>): Promise<RequiredDocument> => {
    await delay();
    const idx = DOCS_STORE.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Document not found');
    DOCS_STORE[idx] = { ...DOCS_STORE[idx], ...data, updated_at: now() };
    return { ...DOCS_STORE[idx] };
  },
  delete: async (id: string): Promise<void> => {
    await delay();
    const idx = DOCS_STORE.findIndex((x) => x.id === id);
    if (idx !== -1) DOCS_STORE.splice(idx, 1);
  },
};

// ---------------------------------------------------------------------------
// Field Management
// ---------------------------------------------------------------------------
export const fieldManagementApi = {
  list: async (params?: { search?: string; category?: string; status?: string; data_type?: string }): Promise<{ fields: FieldManagementEntry[]; total: number }> => {
    await delay();
    let result = [...FIELD_MGMT_STORE];
    if (params?.search) result = result.filter((f) => f.variable_name.toLowerCase().includes(params.search!.toLowerCase()) || f.alias.toLowerCase().includes(params.search!.toLowerCase()));
    if (params?.category && params.category !== 'all') result = result.filter((f) => f.category === params.category);
    if (params?.status && params.status !== 'all') result = result.filter((f) => f.status === params.status);
    return { fields: result, total: result.length };
  },
  create: async (data: Partial<FieldManagementEntry>): Promise<FieldManagementEntry> => {
    await delay();
    const f: FieldManagementEntry = { ...data as FieldManagementEntry, id: uuid() };
    FIELD_MGMT_STORE.push(f);
    return f;
  },
  update: async (id: string, data: Partial<FieldManagementEntry>): Promise<FieldManagementEntry> => {
    await delay();
    const idx = FIELD_MGMT_STORE.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Field not found');
    FIELD_MGMT_STORE[idx] = { ...FIELD_MGMT_STORE[idx], ...data };
    return { ...FIELD_MGMT_STORE[idx] };
  },
  getVariableMaster: async (): Promise<VariableMaster[]> => {
    await delay();
    return [...VARIABLE_MASTER_STORE];
  },
};

// ---------------------------------------------------------------------------
// Native Fields (per program)
// ---------------------------------------------------------------------------
export const nativeFieldsApi = {
  list: async (programId: string, params?: { search?: string; category?: string; status?: string; alias?: string }): Promise<{ fields: NativeField[] }> => {
    await delay();
    let result = [...(NATIVE_FIELDS_STORE[programId] || [])];
    if (params?.search) result = result.filter((f) => f.variable_name.toLowerCase().includes(params.search!.toLowerCase()));
    if (params?.category && params.category !== 'all') result = result.filter((f) => f.category === params.category);
    if (params?.status && params.status !== 'all') result = result.filter((f) => f.status === params.status);
    return { fields: result };
  },
  create: async (programId: string, data: Partial<NativeField>): Promise<NativeField> => {
    await delay();
    if (!NATIVE_FIELDS_STORE[programId]) NATIVE_FIELDS_STORE[programId] = [];
    const f: NativeField = { ...data as NativeField, id: uuid() };
    NATIVE_FIELDS_STORE[programId].push(f);
    return f;
  },
  update: async (programId: string, id: string, data: Partial<NativeField>): Promise<NativeField> => {
    await delay();
    const arr = NATIVE_FIELDS_STORE[programId] || [];
    const idx = arr.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Field not found');
    arr[idx] = { ...arr[idx], ...data };
    return { ...arr[idx] };
  },
  getVariableMaster: async (): Promise<VariableMaster[]> => {
    await delay();
    return VARIABLE_MASTER_STORE.filter((v) => v.data_type === 'Native');
  },
};

// ---------------------------------------------------------------------------
// Custom Fields (per program)
// ---------------------------------------------------------------------------
export const customFieldsApi = {
  list: async (programId: string, params?: { search?: string; category?: string; status?: string }): Promise<{ fields: CustomField[] }> => {
    await delay();
    let result = [...(CUSTOM_FIELDS_STORE[programId] || [])];
    if (params?.search) result = result.filter((f) => f.field_name.toLowerCase().includes(params.search!.toLowerCase()));
    if (params?.category && params.category !== 'all') result = result.filter((f) => f.category === params.category);
    if (params?.status && params.status !== 'all') result = result.filter((f) => f.status === params.status);
    return { fields: result };
  },
  create: async (programId: string, data: Partial<CustomField>): Promise<CustomField> => {
    await delay();
    if (!CUSTOM_FIELDS_STORE[programId]) CUSTOM_FIELDS_STORE[programId] = [];
    const f: CustomField = { ...data as CustomField, id: uuid(), created_at: now(), updated_at: now() };
    CUSTOM_FIELDS_STORE[programId].push(f);
    return f;
  },
  update: async (programId: string, id: string, data: Partial<CustomField>): Promise<CustomField> => {
    await delay();
    const arr = CUSTOM_FIELDS_STORE[programId] || [];
    const idx = arr.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Field not found');
    arr[idx] = { ...arr[idx], ...data, updated_at: now() };
    return { ...arr[idx] };
  },
  delete: async (programId: string, id: string): Promise<void> => {
    await delay();
    const arr = CUSTOM_FIELDS_STORE[programId] || [];
    const idx = arr.findIndex((x) => x.id === id);
    if (idx !== -1) arr.splice(idx, 1);
  },
};

// ---------------------------------------------------------------------------
// Program Documents (Login Checklist)
// ---------------------------------------------------------------------------
export const programDocumentsApi = {
  list: async (programId: string): Promise<ProgramDocument[]> => {
    await delay();
    return [...(PROGRAM_DOCS_STORE[programId] || [])];
  },
  getDetail: async (id: string): Promise<ProgramDocument> => {
    await delay();
    for (const arr of Object.values(PROGRAM_DOCS_STORE)) {
      const f = arr.find((x) => x.id === id);
      if (f) return { ...f };
    }
    throw new Error('Document not found');
  },
  create: async (programId: string, data: Partial<ProgramDocument>): Promise<ProgramDocument> => {
    await delay();
    if (!PROGRAM_DOCS_STORE[programId]) PROGRAM_DOCS_STORE[programId] = [];
    const f: ProgramDocument = { ...data as ProgramDocument, id: uuid(), program_id: programId };
    PROGRAM_DOCS_STORE[programId].push(f);
    return f;
  },
  update: async (id: string, data: Partial<ProgramDocument>): Promise<ProgramDocument> => {
    await delay();
    for (const arr of Object.values(PROGRAM_DOCS_STORE)) {
      const idx = arr.findIndex((x) => x.id === id);
      if (idx !== -1) { arr[idx] = { ...arr[idx], ...data }; return { ...arr[idx] }; }
    }
    throw new Error('Document not found');
  },
  delete: async (id: string): Promise<void> => {
    await delay();
    for (const arr of Object.values(PROGRAM_DOCS_STORE)) {
      const idx = arr.findIndex((x) => x.id === id);
      if (idx !== -1) { arr.splice(idx, 1); return; }
    }
  },
};

// ---------------------------------------------------------------------------
// Schemes, Closure Actions, Roles
// ---------------------------------------------------------------------------
export const schemesApi = { list: async (): Promise<Scheme[]> => { await delay(); return [...SCHEMES_STORE]; } };
export const closureActionsApi = { list: async (): Promise<ClosureAction[]> => { await delay(); return [...CLOSURE_ACTIONS_STORE]; } };
export const rolesApi = { list: async (): Promise<Role[]> => { await delay(); return [...ROLES_STORE]; } };

// ---------------------------------------------------------------------------
// Ops Dashboard Config
// ---------------------------------------------------------------------------
export const opsDashboardConfigApi = {
  get: async (programId: string): Promise<OpsDashboardConfig> => {
    await delay();
    return OPS_CONFIG_STORE[programId] || { program_id: programId, filters: [], listing_columns: [], view_categories: [], field_aliases: {} };
  },
  save: async (config: OpsDashboardConfig): Promise<OpsDashboardConfig> => {
    await delay();
    OPS_CONFIG_STORE[config.program_id] = { ...config };
    return { ...config };
  },
};

// ---------------------------------------------------------------------------
// Applications (Ops Dashboard)
// ---------------------------------------------------------------------------
export const applicationsApi = {
  list: async (programId?: string, params?: Record<string, string>): Promise<Application[]> => {
    await delay();
    let result = [...APPLICATIONS_STORE];
    if (programId) result = result.filter((a) => a.program_id === programId);
    if (params?.search) result = result.filter((a) => JSON.stringify(a).toLowerCase().includes(params.search!.toLowerCase()));
    return result;
  },
  get: async (id: string): Promise<Application> => {
    await delay();
    const a = APPLICATIONS_STORE.find((x) => x.id === id);
    if (!a) throw new Error('Application not found');
    return { ...a };
  },
  deleteByIdentifier: async (identifier: string): Promise<{ deleted_count: number }> => {
    await delay();
    const before = APPLICATIONS_STORE.length;
    const toRemove = APPLICATIONS_STORE.filter((a) => a.application_id === identifier || a.pan_number === identifier || a.mobile_number === identifier);
    toRemove.forEach((a) => { const idx = APPLICATIONS_STORE.indexOf(a); if (idx !== -1) APPLICATIONS_STORE.splice(idx, 1); });
    return { deleted_count: before - APPLICATIONS_STORE.length };
  },
};

// ---------------------------------------------------------------------------
// Workflows
// ---------------------------------------------------------------------------
export const workflowsApi = {
  list: async (programId?: string): Promise<Workflow[]> => {
    await delay();
    const store = programId ? WORKFLOWS_STORE.filter((w) => w.program_id === programId) : WORKFLOWS_STORE;
    return store.map((w) => ({ ...w, versions: [...w.versions] }));
  },
  get: async (id: string): Promise<Workflow> => {
    await delay();
    const w = WORKFLOWS_STORE.find((x) => x.id === id);
    if (!w) throw new Error('Workflow not found');
    return { ...w, versions: w.versions.map((v) => ({ ...v })) };
  },
  create: async (data: Partial<Workflow>): Promise<Workflow> => {
    await delay();
    const w: Workflow = { ...data as Workflow, id: uuid(), versions: [], created_at: now(), updated_at: now() };
    WORKFLOWS_STORE.push(w);
    return { ...w, versions: [] };
  },
  update: async (id: string, data: Partial<Workflow>): Promise<Workflow> => {
    await delay();
    const idx = WORKFLOWS_STORE.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Workflow not found');
    WORKFLOWS_STORE[idx] = { ...WORKFLOWS_STORE[idx], ...data, updated_at: now() };
    return { ...WORKFLOWS_STORE[idx] };
  },
  createVersion: async (workflowId: string): Promise<WorkflowVersion> => {
    await delay();
    const w = WORKFLOWS_STORE.find((x) => x.id === workflowId);
    if (!w) throw new Error('Workflow not found');
    const vNum = w.versions.length + 1;
    const v: WorkflowVersion = { id: uuid(), workflow_id: workflowId, version: `v${vNum}`, status: 'DRAFT', canvas_blocks: [], created_at: now(), updated_at: now() };
    w.versions.push(v);
    w.updated_at = now();
    return { ...v };
  },
  saveCanvasBlocks: async (workflowId: string, versionId: string, blocks: BlockData[]): Promise<void> => {
    await delay(100);
    const w = WORKFLOWS_STORE.find((x) => x.id === workflowId);
    if (!w) return;
    const v = w.versions.find((x) => x.id === versionId);
    if (!v) return;
    v.canvas_blocks = blocks;
    v.updated_at = now();
    w.updated_at = now();
  },
  publishVersion: async (workflowId: string, versionId: string): Promise<void> => {
    await delay();
    const w = WORKFLOWS_STORE.find((x) => x.id === workflowId);
    if (!w) return;
    w.versions.forEach((v) => { v.status = v.id === versionId ? 'ACTIVE' : 'INACTIVE'; });
    const published = w.versions.find((v) => v.id === versionId);
    if (published) w.default_version = published.version;
    w.updated_at = now();
  },
};

// ---------------------------------------------------------------------------
// Master Management
// ---------------------------------------------------------------------------

const makeFid = () => Math.random().toString(36).slice(2);

const MASTERS_STORE: Master[] = [
  {
    id: 'm1', name: 'CFR', masterCode: 'PLG_CFR', description: 'Central fraud registry for Pan',
    status: 'ACTIVE', defaultVersion: 2,
    fields: [{ id: 'mf1', fieldName: 'pan', dataType: 'TEXT', isPrimary: true, validations: [] }],
    subMasters: [],
    records: [
      { id: 'r1', pan: 'ABCPM1234Q' }, { id: 'r2', pan: 'RKCPM3344Z' }, { id: 'r3', pan: 'WECPJ1122A' },
      { id: 'r4', pan: 'JDCPN4567P' }, { id: 'r5', pan: 'BHCPI6789U' }, { id: 'r6', pan: 'TRCPG2345Y' },
      { id: 'r7', pan: 'MNCPK7890E' }, { id: 'r8', pan: 'QWCPS3456T' }, { id: 'r9', pan: 'LKCPV9012R' },
      { id: 'r10', pan: 'XYCPR5678L' },
    ],
    createdAt: '2026-04-14T11:34:21Z', updatedAt: '2026-04-14T11:34:21Z',
  },
  {
    id: 'm2', name: 'InputFields', masterCode: 'PLG_INF', description: 'InputFields',
    status: 'DRAFT', defaultVersion: 5,
    fields: [{ id: 'mf2', fieldName: 'field_name', dataType: 'TEXT', isPrimary: true, validations: [] }],
    subMasters: [], records: [],
    createdAt: '2026-04-23T10:35:06Z', updatedAt: '2026-04-23T10:35:06Z',
  },
  {
    id: 'm3', name: 'PersonalDetails', masterCode: 'PLG_PD', description: 'PersonalDetails',
    status: 'IN_PROGRESS', defaultVersion: 5,
    fields: [{ id: 'mf3', fieldName: 'name', dataType: 'TEXT', isPrimary: true, validations: [] }],
    subMasters: [], records: [],
    createdAt: '2026-04-23T10:36:07Z', updatedAt: '2026-04-23T10:36:07Z',
  },
  {
    id: 'm4', name: 'EmployementDetails1', masterCode: 'PLG_ED', description: 'EmploymentDetails',
    status: 'IN_PROGRESS', defaultVersion: 5,
    fields: [{ id: 'mf4', fieldName: 'employer_name', dataType: 'TEXT', isPrimary: true, validations: [] }],
    subMasters: [], records: [],
    createdAt: '2026-04-23T10:37:02Z', updatedAt: '2026-04-23T10:37:02Z',
  },
  {
    id: 'm5', name: 'PINCODE MASTER', masterCode: 'PLG_PIN', description: 'Pincode',
    status: 'ACTIVE', defaultVersion: 2,
    fields: [{ id: 'mf5', fieldName: 'pincode', dataType: 'TEXT', isPrimary: true, validations: [] }],
    subMasters: [], records: [],
    createdAt: '2026-04-23T15:17:18Z', updatedAt: '2026-04-23T15:17:18Z',
  },
  {
    id: 'm6', name: 'StateDetails', masterCode: 'PLG_SD', description: 'Details of a state to be captured',
    status: 'ACTIVE', defaultVersion: 5,
    fields: [{ id: 'mf6', fieldName: 'state_code', dataType: 'TEXT', isPrimary: true, validations: [] }],
    subMasters: [], records: [],
    createdAt: '2026-04-23T10:39:26Z', updatedAt: '2026-04-23T10:39:26Z',
  },
  {
    id: 'm7', name: 'City', masterCode: 'PLG_CTY', description: 'City',
    status: 'ACTIVE', defaultVersion: 1,
    fields: [{ id: 'mf7', fieldName: 'city_name', dataType: 'TEXT', isPrimary: true, validations: [] }],
    subMasters: [], records: [],
    createdAt: '2025-12-12T10:25:59Z', updatedAt: '2025-12-12T10:25:59Z',
  },
  {
    id: 'm8', name: 'District', masterCode: 'PLG_DST', description: 'all district records',
    status: 'ACTIVE', defaultVersion: 1,
    fields: [{ id: 'mf8', fieldName: 'district_name', dataType: 'TEXT', isPrimary: true, validations: [] }],
    subMasters: [], records: [],
    createdAt: '2025-12-12T10:18:24Z', updatedAt: '2025-12-12T10:18:24Z',
  },
  {
    id: 'm9', name: 'Country', masterCode: 'PLG_CNT', description: 'country records',
    status: 'ACTIVE', defaultVersion: 1,
    fields: [{ id: 'mf9', fieldName: 'country_name', dataType: 'TEXT', isPrimary: true, validations: [] }],
    subMasters: [], records: [],
    createdAt: '2025-12-12T10:14:29Z', updatedAt: '2025-12-12T10:14:29Z',
  },
  {
    id: 'm10', name: 'BranchCircle', masterCode: 'PLG_BC', description: 'Branch circle records',
    status: 'ACTIVE', defaultVersion: 5,
    fields: [{ id: 'mf10', fieldName: 'branch_code', dataType: 'TEXT', isPrimary: true, validations: [] }],
    subMasters: [], records: [],
    createdAt: '2026-04-23T10:40:11Z', updatedAt: '2026-04-23T10:40:11Z',
  },
];

export const masterManagementApi = {
  list: async (filters?: Partial<MasterListFilters>): Promise<Master[]> => {
    await delay();
    let result = [...MASTERS_STORE];
    if (filters?.name) result = result.filter((m) => m.name.toLowerCase().includes(filters.name!.toLowerCase()));
    if (filters?.status) result = result.filter((m) => m.status === filters.status);
    if (filters?.dateFrom) result = result.filter((m) => new Date(m.updatedAt) >= new Date(filters.dateFrom!));
    if (filters?.dateTo) result = result.filter((m) => new Date(m.updatedAt) <= new Date(filters.dateTo! + 'T23:59:59Z'));
    return result.map((m) => ({ ...m, fields: [...m.fields], subMasters: [...m.subMasters], records: [...m.records] }));
  },

  get: async (id: string): Promise<Master> => {
    await delay();
    const m = MASTERS_STORE.find((x) => x.id === id);
    if (!m) throw new Error('Master not found');
    return { ...m, fields: [...m.fields], subMasters: m.subMasters.map((s) => ({ ...s })), records: [...m.records] };
  },

  create: async (data: CreateMasterPayload): Promise<Master> => {
    await delay();
    const m: Master = {
      id: uuid(),
      name: data.name,
      masterCode: data.masterCode,
      description: data.description,
      status: 'DRAFT',
      defaultVersion: 1,
      fields: data.fields.map((f) => ({ ...f, id: makeFid(), validations: f.validations.map((v) => ({ ...v, id: makeFid() })) })),
      subMasters: [],
      records: [],
      createdAt: now(),
      updatedAt: now(),
    };
    MASTERS_STORE.push(m);
    return { ...m };
  },

  update: async (id: string, data: UpdateMasterPayload): Promise<Master> => {
    await delay();
    const idx = MASTERS_STORE.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Master not found');
    MASTERS_STORE[idx] = { ...MASTERS_STORE[idx], name: data.name, description: data.description, status: data.status, updatedAt: now() };
    return { ...MASTERS_STORE[idx] };
  },

  createSubMaster: async (masterId: string, data: CreateSubMasterPayload): Promise<SubMaster> => {
    await delay();
    const master = MASTERS_STORE.find((x) => x.id === masterId);
    if (!master) throw new Error('Master not found');
    const sub: SubMaster = {
      id: uuid(),
      name: data.name,
      subMasterCode: data.subMasterCode,
      description: data.description,
      parentMasterId: masterId,
      parentMasterName: master.name,
      status: 'DRAFT',
      entries: 0,
      fields: data.fields.map((f) => ({ ...f, id: makeFid(), validations: f.validations.map((v) => ({ ...v, id: makeFid() })) })),
      records: [],
      createdAt: now(),
      updatedAt: now(),
    };
    master.subMasters.push(sub);
    master.updatedAt = now();
    return { ...sub };
  },

  uploadRecords: async (masterId: string, action: 'CREATE' | 'UPDATE', newRecords: Record<string, string>[]): Promise<void> => {
    await delay(500);
    const master = MASTERS_STORE.find((x) => x.id === masterId);
    if (!master) throw new Error('Master not found');
    if (action === 'CREATE') {
      const toAdd = newRecords.map((r) => ({ ...r, id: uuid() }));
      master.records.push(...toAdd);
    } else {
      newRecords.forEach((r) => {
        const idx = master.records.findIndex((x) => x.id === r.id);
        if (idx !== -1) master.records[idx] = { ...master.records[idx], ...r };
      });
    }
    master.defaultVersion += 1;
    master.updatedAt = now();
  },

  deleteRecords: async (masterId: string, recordIds: string[]): Promise<void> => {
    await delay(500);
    const master = MASTERS_STORE.find((x) => x.id === masterId);
    if (!master) throw new Error('Master not found');
    const idSet = new Set(recordIds);
    master.records = master.records.filter((r) => !idSet.has(r.id));
    master.defaultVersion += 1;
    master.updatedAt = now();
  },
};

// ---------------------------------------------------------------------------
// Program Pages
// ---------------------------------------------------------------------------

const SAMPLE_PAGE_CONFIG = JSON.stringify({
  customComponentConfig: {
    basicDetailsPage: {
      uiConfig: [
        { componentType: 'TEXT_INPUT', fieldId: 'customer_name', label: 'Full Name', required: true },
        { componentType: 'TEXT_INPUT', fieldId: 'mobile_number', label: 'Mobile Number', required: true },
        { componentType: 'DATE_PICKER', fieldId: 'date_of_birth', label: 'Date of Birth', required: false },
      ],
    },
  },
}, null, 2);

const PAGES_STORE: ProgramPage[] = [
  { id: 'pg1',  program_id: '1', page_name: 'basicdetail2404withAIv1',   page_type: 'APP_STATE_PAGE', status: 'ACTIVE',   page_config: SAMPLE_PAGE_CONFIG, created_at: '2026-08-04T08:24:00Z', updated_at: '2026-04-24T07:18:30Z' },
  { id: 'pg2',  program_id: '1', page_name: 'basicdetailsv4',            page_type: 'APP_STATE_PAGE', status: 'ACTIVE',   page_config: SAMPLE_PAGE_CONFIG, created_at: '2026-01-15T10:00:00Z', updated_at: '2026-03-10T09:00:00Z' },
  { id: 'pg3',  program_id: '1', page_name: 'basicdetailsv3',            page_type: 'APP_STATE_PAGE', status: 'ACTIVE',   page_config: SAMPLE_PAGE_CONFIG, created_at: '2026-01-10T10:00:00Z', updated_at: '2026-02-15T09:00:00Z' },
  { id: 'pg4',  program_id: '1', page_name: 'basicdetailsv2',            page_type: 'APP_STATE_PAGE', status: 'ACTIVE',   page_config: SAMPLE_PAGE_CONFIG, created_at: '2026-01-05T10:00:00Z', updated_at: '2026-02-01T09:00:00Z' },
  { id: 'pg5',  program_id: '1', page_name: 'basicDetails2304withAIv1',  page_type: 'APP_STATE_PAGE', status: 'ACTIVE',   page_config: SAMPLE_PAGE_CONFIG, created_at: '2026-04-23T10:00:00Z', updated_at: '2026-04-23T10:00:00Z' },
  { id: 'pg6',  program_id: '1', page_name: 'Test1234',                  page_type: 'APP_STATE_PAGE', status: 'ACTIVE',   page_config: '{}',               created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-15T09:00:00Z' },
  { id: 'pg7',  program_id: '1', page_name: 'basicDetailsPage1404v1',    page_type: 'APP_STATE_PAGE', status: 'ACTIVE',   page_config: SAMPLE_PAGE_CONFIG, created_at: '2026-04-14T10:00:00Z', updated_at: '2026-04-14T10:00:00Z' },
  { id: 'pg8',  program_id: '1', page_name: 'AIbasicDetails01',          page_type: 'APP_STATE_PAGE', status: 'ACTIVE',   page_config: SAMPLE_PAGE_CONFIG, created_at: '2026-03-20T10:00:00Z', updated_at: '2026-04-01T09:00:00Z' },
  { id: 'pg9',  program_id: '1', page_name: 'AIBasicLoanPage',           page_type: 'APP_STATE_PAGE', status: 'ACTIVE',   page_config: SAMPLE_PAGE_CONFIG, created_at: '2026-03-25T10:00:00Z', updated_at: '2026-04-05T09:00:00Z' },
  { id: 'pg10', program_id: '1', page_name: 'AIUserDetails',             page_type: 'APP_STATE_PAGE', status: 'ACTIVE',   page_config: SAMPLE_PAGE_CONFIG, created_at: '2026-04-01T10:00:00Z', updated_at: '2026-04-10T09:00:00Z' },
  { id: 'pg11', program_id: '1', page_name: 'panVerificationPage',       page_type: 'APP_STATE_PAGE', status: 'ACTIVE',   page_config: '{}',               created_at: '2026-02-10T10:00:00Z', updated_at: '2026-03-01T09:00:00Z' },
  { id: 'pg12', program_id: '1', page_name: 'aadhaarInputPage',          page_type: 'APP_STATE_PAGE', status: 'DRAFT',    page_config: '{}',               created_at: '2026-04-20T10:00:00Z', updated_at: '2026-04-20T10:00:00Z' },
  { id: 'pg13', program_id: '2', page_name: 'loanDetailsPage',           page_type: 'APP_STATE_PAGE', status: 'ACTIVE',   page_config: SAMPLE_PAGE_CONFIG, created_at: '2026-02-01T10:00:00Z', updated_at: '2026-03-01T09:00:00Z' },
  { id: 'pg14', program_id: '2', page_name: 'offerDisplayPage',          page_type: 'APP_STATE_PAGE', status: 'INACTIVE', page_config: '{}',               created_at: '2026-01-15T10:00:00Z', updated_at: '2026-02-15T09:00:00Z' },
];

export const pagesApi = {
  list: async (programId: string): Promise<ProgramPage[]> => {
    await delay();
    return PAGES_STORE.filter((p) => p.program_id === programId).map((p) => ({ ...p }));
  },
  get: async (id: string): Promise<ProgramPage> => {
    await delay();
    const p = PAGES_STORE.find((x) => x.id === id);
    if (!p) throw new Error('Page not found');
    return { ...p };
  },
  create: async (data: ProgramPageCreate): Promise<ProgramPage> => {
    await delay();
    const p: ProgramPage = { ...data, id: uuid(), created_at: now(), updated_at: now() };
    PAGES_STORE.push(p);
    return { ...p };
  },
  update: async (id: string, data: Partial<ProgramPageCreate>): Promise<ProgramPage> => {
    await delay();
    const idx = PAGES_STORE.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Page not found');
    PAGES_STORE[idx] = { ...PAGES_STORE[idx], ...data, updated_at: now() };
    return { ...PAGES_STORE[idx] };
  },
};


