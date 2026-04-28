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
