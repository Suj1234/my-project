import { useState } from 'react';
import { Plus, Eye, Trash2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  ApiIntegrationV1, createDefaultIntegrationV1, IntegrationStatusV1,
} from '../../types/apiIntegrationV1';
import { ApiIntegrationEditorV1 } from './ApiIntegrationEditorV1';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_INTEGRATIONS: ApiIntegrationV1[] = [
  // ── v1-1: POST, no path params, JSON body ─────────────────────────────────
  {
    ...createDefaultIntegrationV1(),
    id: 'v1-1',
    name: 'Credit Bureau Check',
    description: 'Fetch credit score and bureau report for applicant',
    method: 'POST',
    url: 'https://api.bureau.com/v1/credit-check',
    auth: { type: 'bearer', bearerToken: 'sample-token' },
    headers: [
      { id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
      { id: '2', key: 'X-Request-Source', value: 'journey-engine', enabled: true },
    ],
    bodyRaw: JSON.stringify({ pan: '{{applicant_pan}}', dob: '{{applicant_dob}}', mobile: '{{applicant_mobile}}', consent: true }, null, 2),
    bodySchema: [
      { id: '1', path: 'pan',    required: true,  fieldType: 'regex',  pattern: '^[A-Z]{5}[0-9]{4}[A-Z]$', description: 'PAN number (e.g. ABCDE1234F)' },
      { id: '2', path: 'dob',    required: true,  fieldType: 'date',   description: 'Date of birth (YYYY-MM-DD)' },
      { id: '3', path: 'mobile', required: true,  fieldType: 'phone',  description: '10-digit mobile number' },
      { id: '4', path: 'consent',required: false, fieldType: 'boolean',description: 'Applicant consent flag' },
    ],
    responseJson: JSON.stringify({ status: 'success', score: 748, bureau: 'CIBIL', reportId: 'RPT-2024-00123', creditAge: '4 years 3 months', activeAccounts: 3, enquiries: 2 }, null, 2),
    status: 'active',
    category: 'Credit Bureau',
    provider: 'CIBIL',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ── v1-2: POST, no path params, JSON body ─────────────────────────────────
  {
    ...createDefaultIntegrationV1(),
    id: 'v1-2',
    name: 'PAN Verification',
    description: 'Verify PAN card authenticity via NSDL',
    method: 'POST',
    url: 'https://api.kyc.com/v2/pan/verify',
    auth: { type: 'api_key', apiKeyName: 'X-API-Key', apiKeyValue: 'sample-key', apiKeyPlacement: 'header' },
    headers: [
      { id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
    ],
    bodyRaw: JSON.stringify({ pan_number: '{{pan_number}}', full_name: '{{applicant_name}}', date_of_birth: '{{applicant_dob}}' }, null, 2),
    bodySchema: [
      { id: '1', path: 'pan_number',    required: true,  fieldType: 'regex', pattern: '^[A-Z]{5}[0-9]{4}[A-Z]$', description: 'PAN number' },
      { id: '2', path: 'full_name',     required: true,  fieldType: 'string', description: 'Full name as on PAN' },
      { id: '3', path: 'date_of_birth', required: true,  fieldType: 'date',   description: 'Date of birth (YYYY-MM-DD)' },
    ],
    responseJson: JSON.stringify({ status: 'valid', panNumber: 'ABCDE1234F', name: 'Rahul Kumar', type: 'Individual', aadhaarLinked: true, lastVerified: '2024-03-15' }, null, 2),
    status: 'active',
    category: 'KYC',
    provider: 'NSDL',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ── v1-3: GET, no path params, query params only ──────────────────────────
  {
    ...createDefaultIntegrationV1(),
    id: 'v1-3',
    name: 'Bank Account Verification',
    description: 'Verify bank account details using penny drop method',
    method: 'GET',
    url: 'https://api.fintech.com/v1/bank/verify',
    auth: { type: 'basic', basicUsername: 'api_user', basicPassword: 'api_pass_123' },
    params: [
      { id: '1', key: 'account_number', value: '{{account_number}}', enabled: true, required: true,  fieldType: 'number', description: 'Bank account number' },
      { id: '2', key: 'ifsc',           value: '{{ifsc_code}}',      enabled: true, required: true,  fieldType: 'regex',  description: 'IFSC code (e.g. HDFC0001234)' },
      { id: '3', key: 'name',           value: '{{account_holder}}', enabled: true, required: false, fieldType: 'string', description: 'Account holder name for name-match' },
    ],
    responseJson: JSON.stringify({ status: 'success', verified: true, nameMatch: 'full', bank: 'HDFC Bank', branch: 'Koramangala, Bengaluru', accountType: 'Savings' }, null, 2),
    status: 'active',
    category: 'Financial',
    provider: 'Internal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ── v1-4: GET, path param + query param ──────────────────────────────────
  {
    ...createDefaultIntegrationV1(),
    id: 'v1-4',
    name: 'Pincode Lookup',
    description: 'Get city and state details from a pincode',
    method: 'GET',
    url: 'https://api.postalpincode.in/pincode/{{pincode}}',
    auth: { type: 'none' },
    pathParams: [
      { id: '1', key: 'pincode', value: '', enabled: true, required: true, fieldType: 'regex', description: '6-digit Indian postal pincode' },
    ],
    params: [
      { id: '1', key: 'format', value: 'json', enabled: true, required: false, fieldType: 'string', description: 'Response format' },
    ],
    responseJson: JSON.stringify({ status: 'Success', postOffices: [{ name: 'Indiranagar', district: 'Bengaluru', state: 'Karnataka', pincode: '560038', deliveryStatus: 'Delivery' }] }, null, 2),
    status: 'inactive',
    category: 'KYC',
    provider: 'Internal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ── v1-5: POST, no path params, JSON body ─────────────────────────────────
  {
    ...createDefaultIntegrationV1(),
    id: 'v1-5',
    name: 'GST Verification',
    description: 'Verify GST number and fetch business details',
    method: 'POST',
    url: 'https://api.gst.gov.in/verify',
    auth: { type: 'bearer', bearerToken: 'gst-api-bearer-token' },
    headers: [
      { id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
    ],
    bodyRaw: JSON.stringify({ gstin: '{{gstin}}', business_name: '{{business_name}}' }, null, 2),
    bodySchema: [
      { id: '1', path: 'gstin',         required: true,  fieldType: 'regex',  pattern: '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$', description: 'GST Identification Number' },
      { id: '2', path: 'business_name', required: false, fieldType: 'string', description: 'Business name for cross-verification' },
    ],
    responseJson: JSON.stringify({ status: 'success', gstin: '29ABCDE1234F1Z5', legalName: 'Acme Pvt Ltd', tradeName: 'Acme', state: 'Karnataka', registrationDate: '2018-07-01', taxpayerType: 'Regular', filingStatus: 'Active' }, null, 2),
    status: 'active',
    category: 'Government',
    provider: 'Internal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ── v1-6: GET, path param ONLY (no query params) ──────────────────────────
  {
    ...createDefaultIntegrationV1(),
    id: 'v1-6',
    name: 'Loan Application Status',
    description: 'Fetch status and details of a loan application by its ID',
    method: 'GET',
    url: 'https://api.lending.com/v1/applications/{{application_id}}',
    auth: { type: 'bearer', bearerToken: 'lending-api-bearer-token' },
    pathParams: [
      { id: '1', key: 'application_id', value: '', enabled: true, required: true, fieldType: 'string', description: 'Unique loan application identifier' },
    ],
    params: [],
    responseJson: JSON.stringify({ id: 'APP-2024-00456', status: 'under_review', applicantName: 'Priya Sharma', loanAmount: 500000, product: 'Personal Loan', appliedAt: '2024-03-10T09:30:00Z', lastUpdated: '2024-03-12T14:20:00Z' }, null, 2),
    status: 'active',
    category: 'Financial',
    provider: 'Internal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ── v1-7: POST, path params + JSON body ───────────────────────────────────
  {
    ...createDefaultIntegrationV1(),
    id: 'v1-7',
    name: 'Upload Loan Document',
    description: 'Upload or replace a document for an existing loan application',
    method: 'POST',
    url: 'https://api.lending.com/v1/loans/{{loan_id}}/documents/{{doc_type}}',
    auth: { type: 'bearer', bearerToken: 'lending-api-bearer-token' },
    headers: [
      { id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
    ],
    pathParams: [
      { id: '1', key: 'loan_id',  value: '', enabled: true, required: true,  fieldType: 'string', description: 'Loan identifier' },
      { id: '2', key: 'doc_type', value: '', enabled: true, required: true,  fieldType: 'string', description: 'Document type (aadhaar / pan / income_proof / bank_statement)' },
    ],
    bodyRaw: JSON.stringify({ document_url: '{{doc_url}}', uploaded_by: '{{agent_id}}', remarks: '' }, null, 2),
    bodySchema: [
      { id: '1', path: 'document_url', required: true,  fieldType: 'string', description: 'Accessible URL of the uploaded document' },
      { id: '2', path: 'uploaded_by',  required: true,  fieldType: 'string', description: 'Agent or user ID performing the upload' },
      { id: '3', path: 'remarks',      required: false, fieldType: 'string', description: 'Optional remarks or notes' },
    ],
    responseJson: JSON.stringify({ success: true, documentId: 'DOC-789', loanId: 'LN-2024-00456', docType: 'aadhaar', uploadedAt: '2024-03-15T11:00:00Z' }, null, 2),
    status: 'active',
    category: 'Document',
    provider: 'Internal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ── v1-8: CBS Dedupe ──────────────────────────────────────────────────────
  {
    ...createDefaultIntegrationV1(),
    id: 'v1-8',
    name: 'CBS Dedupe',
    description: 'Core Banking System lookup — determines ETB vs NTB and pre-fills CBS profile data for existing customers',
    method: 'POST',
    url: 'https://api.cbs.internal/v1/dedupe/check',
    auth: { type: 'bearer', bearerToken: 'cbs-internal-bearer-token' },
    headers: [
      { id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
      { id: '2', key: 'X-Channel', value: 'digital', enabled: true },
    ],
    bodyRaw: JSON.stringify({ pan_number: '{{pan_number}}', date_of_birth: '{{date_of_birth}}' }, null, 2),
    bodySchema: [
      { id: '1', path: 'pan_number',    required: true, fieldType: 'regex',  pattern: '^[A-Z]{5}[0-9]{4}[A-Z]$', description: 'PAN number of applicant' },
      { id: '2', path: 'date_of_birth', required: true, fieldType: 'date',   description: 'Date of birth (YYYY-MM-DD)' },
    ],
    responseJson: JSON.stringify({ status: 'SUCCESS', is_etb: true, customer_name: 'RAVI KUMAR', customer_id: 'CBS-00123456', mobile_number: '9876543210', email_id: 'ravi@email.com', address: '12 MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' }, null, 2),
    status: 'active',
    category: 'Dedupe',
    provider: 'CBS',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ── v1-9: CMS Dedupe ──────────────────────────────────────────────────────
  {
    ...createDefaultIntegrationV1(),
    id: 'v1-9',
    name: 'CMS Dedupe',
    description: 'Card Management System lookup — checks if applicant already holds an active credit card; triggers hard reject if found',
    method: 'POST',
    url: 'https://api.cms.internal/v1/cards/dedupe',
    auth: { type: 'bearer', bearerToken: 'cms-internal-bearer-token' },
    headers: [
      { id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
    ],
    bodyRaw: JSON.stringify({ pan_number: '{{pan_number}}' }, null, 2),
    bodySchema: [
      { id: '1', path: 'pan_number', required: true, fieldType: 'regex', pattern: '^[A-Z]{5}[0-9]{4}[A-Z]$', description: 'PAN number of applicant' },
    ],
    responseJson: JSON.stringify({ status: 'SUCCESS', has_existing_card: false, existing_card_count: 0, cards: [] }, null, 2),
    status: 'active',
    category: 'Dedupe',
    provider: 'CMS',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ── v1-10: LMS Dedupe ─────────────────────────────────────────────────────
  {
    ...createDefaultIntegrationV1(),
    id: 'v1-10',
    name: 'LMS Dedupe',
    description: 'Loan Management System lookup — checks for active in-progress credit card applications; enables resume flow for returning applicants',
    method: 'POST',
    url: 'https://api.lms.internal/v1/applications/dedupe',
    auth: { type: 'bearer', bearerToken: 'lms-internal-bearer-token' },
    headers: [
      { id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
    ],
    bodyRaw: JSON.stringify({ pan_number: '{{pan_number}}' }, null, 2),
    bodySchema: [
      { id: '1', path: 'pan_number', required: true, fieldType: 'regex', pattern: '^[A-Z]{5}[0-9]{4}[A-Z]$', description: 'PAN number of applicant' },
    ],
    responseJson: JSON.stringify({ status: 'SUCCESS', has_active_application: false, application_id: null, application_status: null }, null, 2),
    status: 'active',
    category: 'Dedupe',
    provider: 'LMS',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const ROWS_PER_PAGE = 10;

const STATUS_COLORS: Record<IntegrationStatusV1, string> = {
  active:   'bg-green-100 text-green-700 border-green-200',
  inactive: 'bg-gray-100 text-gray-500 border-gray-200',
};

// ─── Filter state ─────────────────────────────────────────────────────────────

interface Filters {
  name: string;
  category: string;
  provider: string;
  status: IntegrationStatusV1 | '';
}

const EMPTY_FILTERS: Filters = { name: '', category: '', provider: '', status: '' };

// ─── Delete confirmation modal ────────────────────────────────────────────────

function DeleteConfirmModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-[400px] p-6">
        <h2 className="text-sm font-bold text-gray-900 mb-2">Delete Integration</h2>
        <p className="text-xs text-gray-500 mb-5">
          Are you sure you want to delete <span className="font-semibold text-gray-700">"{name}"</span>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onCancel} className="text-xs">Cancel</Button>
          <Button size="sm" onClick={onConfirm} className="text-xs bg-red-600 hover:bg-red-700 text-white border-0">Delete</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ViewState = { mode: 'list' } | { mode: 'editor'; item: ApiIntegrationV1 | 'new' };

export function ApiIntegrationsPageV1() {
  const [items, setItems]             = useState<ApiIntegrationV1[]>(MOCK_INTEGRATIONS);
  const [view, setView]               = useState<ViewState>({ mode: 'list' });
  const [showFilters, setShowFilters] = useState(false);
  const [applied, setApplied]         = useState<Filters>(EMPTY_FILTERS);
  const [draft, setDraft]             = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage]               = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ApiIntegrationV1 | null>(null);

  // ── Editor view ──
  if (view.mode === 'editor') {
    return (
      <ApiIntegrationEditorV1
        integration={view.item === 'new' ? undefined : view.item}
        onBack={() => setView({ mode: 'list' })}
        onSave={(saved) => {
          setItems((prev) => {
            const exists = prev.some((i) => i.id === saved.id);
            return exists ? prev.map((i) => (i.id === saved.id ? saved : i)) : [saved, ...prev];
          });
          setView({ mode: 'list' });
        }}
      />
    );
  }

  // ── Filtering ──
  const filtered = items.filter((item) => {
    if (applied.name     && !item.name.toLowerCase().includes(applied.name.toLowerCase())) return false;
    if (applied.category && item.category !== applied.category) return false;
    if (applied.provider && item.provider !== applied.provider) return false;
    if (applied.status   && item.status !== applied.status) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

  const applyFilters = () => { setApplied({ ...draft }); setPage(1); };
  const clearFilters = () => { setDraft(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); setPage(1); };
  const hasActive    = Object.values(applied).some(Boolean);

  return (
    <div className="p-6">

      {/* ── Header ── */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">API Integrations</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowFilters((v) => !v)}>
            <Filter size={16} className="mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            {hasActive && <span className="ml-2 w-2 h-2 rounded-full bg-blue-600 inline-block" />}
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setView({ mode: 'editor', item: 'new' })}
          >
            <Plus size={16} className="mr-2" />
            New Integration
          </Button>
        </div>
      </div>

      {/* ── Filters panel ── */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Filters</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">

            <select
              value={draft.name ? '' : ''}
              className="hidden"
              aria-hidden
            />

            {/* Integration Name */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Integration Name</label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraft((f) => ({ ...f, name: e.target.value }))}
                placeholder="Search by name…"
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Category</label>
              <select
                value={draft.category}
                onChange={(e) => setDraft((f) => ({ ...f, category: e.target.value }))}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="">All Categories</option>
                {['Identity', 'Credit Bureau', 'KYC', 'Financial', 'Document', 'CRM', 'Government', 'Dedupe', 'Communication'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Provider */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Provider</label>
              <select
                value={draft.provider}
                onChange={(e) => setDraft((f) => ({ ...f, provider: e.target.value }))}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="">All Providers</option>
                {['CIBIL', 'Experian', 'Equifax', 'Perfios', 'NSDL', 'DigiLocker', 'MCA', 'CBS', 'CMS', 'LMS', 'Internal', 'Custom'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select
                value={draft.status}
                onChange={(e) => setDraft((f) => ({ ...f, status: e.target.value as IntegrationStatusV1 | '' }))}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm" onClick={applyFilters}>
              Apply Filters
            </Button>
            <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-800 underline underline-offset-2">
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Integration Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                    {hasActive ? 'No integrations match the applied filters.' : 'No integrations yet. Create your first one.'}
                  </td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setView({ mode: 'editor', item })}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>

                    <td className="px-4 py-3 text-gray-600 max-w-xs">
                      <span className="line-clamp-1 text-xs">{item.description || '—'}</span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium bg-gray-50 text-gray-600 border-gray-200">
                        {item.category || '—'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium bg-blue-50 text-blue-700 border-blue-200">
                        {item.provider || '—'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded border text-xs font-medium uppercase ${STATUS_COLORS[item.status]}`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(item.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>

                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setView({ mode: 'editor', item })}
                          title="View / Edit"
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <Eye size={16} className="text-blue-600" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          title="Delete"
                          className="p-2 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 size={16} className="text-red-400 hover:text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Showing {(safePage - 1) * ROWS_PER_PAGE + 1}–{Math.min(safePage * ROWS_PER_PAGE, filtered.length)} of {filtered.length} items
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 hover:bg-gray-100"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded text-sm font-medium transition-colors ${p === safePage ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 hover:bg-gray-100"
              >
                <ChevronRight size={16} />
              </button>
              <span className="text-xs text-gray-400 ml-3">Rows per page</span>
              <span className="text-xs font-medium text-gray-600 ml-1">{ROWS_PER_PAGE}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete confirmation ── */}
      {deleteTarget && (
        <DeleteConfirmModal
          name={deleteTarget.name}
          onConfirm={() => { setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id)); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
