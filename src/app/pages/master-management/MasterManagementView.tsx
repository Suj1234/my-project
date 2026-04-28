import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Pencil, Plus, Upload, ChevronLeft, ChevronRight, Save, X, Eye, Trash2 } from 'lucide-react';
import { masterManagementApi } from '../../services/mockApi';
import type { Master, MasterStatus } from '../../types/masterManagement';
import { STATUS_LABELS } from '../../types/masterManagement';
import { CreateMasterDialog } from './components/CreateMasterDialog';
import { UploadFileDialog } from './components/UploadFileDialog';
import { DeleteRecordsDialog } from './components/DeleteRecordsDialog';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:      'bg-green-100 text-green-700 border-green-200',
  DRAFT:       'bg-yellow-50 text-yellow-700 border-yellow-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-600 border-blue-200',
  INACTIVE:    'bg-gray-100 text-gray-500 border-gray-200',
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  const dd = d.getDate().toString().padStart(2, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  const h = d.getHours();
  const min = d.getMinutes().toString().padStart(2, '0');
  const sec = d.getSeconds().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = (h % 12 || 12).toString().padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${h12}:${min}:${sec} ${ampm}`;
};

const RECORDS_PER_PAGE = 10;

// ─── Status Dropdown ─────────────────────────────────────────────────────────

function StatusSelect({ value, onChange }: { value: MasterStatus; onChange: (v: MasterStatus) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <div className={`flex items-center border rounded-lg px-3 py-2 bg-gray-50 ${open ? 'border-blue-500' : 'border-gray-300'}`}>
        <span className="flex-1 text-sm text-gray-800">{value}</span>
        <button
          type="button"
          onClick={() => onChange('' as MasterStatus)}
          className="mr-1 text-gray-400 hover:text-gray-600"
        >
          <X size={12} />
        </button>
        <button type="button" onClick={() => setOpen((v) => !v)} className="text-gray-400">
          {open ? '▲' : '▼'}
        </button>
      </div>
      {open && (
        <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 overflow-hidden">
          {STATUS_LABELS.map((s) => (
            <button
              key={s}
              onClick={() => { onChange(s); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${value === s ? 'bg-blue-600 text-white hover:bg-blue-600' : 'text-gray-700'}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg width="120" height="90" viewBox="0 0 120 90" fill="none" className="mb-4 opacity-30">
        <rect x="10" y="20" width="70" height="55" rx="4" fill="#CBD5E0" />
        <rect x="20" y="10" width="70" height="55" rx="4" fill="#E2E8F0" stroke="#CBD5E0" strokeWidth="1.5" />
        <rect x="30" y="30" width="40" height="4" rx="2" fill="#CBD5E0" />
        <rect x="30" y="40" width="30" height="4" rx="2" fill="#CBD5E0" />
        <rect x="30" y="50" width="35" height="4" rx="2" fill="#CBD5E0" />
        <rect x="85" y="5" width="12" height="12" rx="2" fill="#E2E8F0" stroke="#CBD5E0" strokeWidth="1" transform="rotate(15 85 5)" />
        <rect x="95" y="45" width="8" height="8" rx="1" fill="#E2E8F0" stroke="#CBD5E0" strokeWidth="1" transform="rotate(-10 95 45)" />
      </svg>
      <p className="text-sm font-semibold text-gray-600">No Data Available.</p>
      <p className="text-xs text-gray-400 mt-1">No data to show at this time</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MasterManagementView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [master, setMaster] = useState<Master | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'records'>('details');

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<MasterStatus>('ACTIVE');
  const [editErrors, setEditErrors] = useState<{ name?: string; description?: string }>({});
  const [saving, setSaving] = useState(false);

  // Sub master dialog
  const [subMasterOpen, setSubMasterOpen] = useState(false);

  // Upload dialog
  const [uploadOpen, setUploadOpen] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Records pagination
  const [recordPage, setRecordPage] = useState(1);

  const fetchMaster = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await masterManagementApi.get(id);
      setMaster(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchMaster(); }, [fetchMaster]);

  if (loading) {
    return <div className="flex items-center justify-center h-full p-12 text-gray-500">Loading...</div>;
  }

  if (!master) {
    return <div className="flex items-center justify-center h-full p-12 text-gray-500">Master not found.</div>;
  }

  // ── Edit handlers ──

  const startEdit = () => {
    setEditName(master.name);
    setEditDescription(master.description);
    setEditStatus(master.status);
    setEditErrors({});
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditErrors({});
  };

  const saveEdit = async () => {
    const errors: typeof editErrors = {};
    if (!editName.trim()) errors.name = 'This field is required';
    if (!editDescription.trim()) errors.description = 'This field is required';
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setSaving(true);
      const updated = await masterManagementApi.update(master.id, {
        name: editName.trim(),
        description: editDescription.trim(),
        status: editStatus,
      });
      setMaster(updated);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ── Records pagination ──
  const totalRecordPages = Math.ceil(master.records.length / RECORDS_PER_PAGE);
  const paginatedRecords = master.records.slice(
    (recordPage - 1) * RECORDS_PER_PAGE,
    recordPage * RECORDS_PER_PAGE,
  );

  return (
    <div className="min-h-full bg-gray-50">
      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          {(['details', 'records'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'bg-blue-50 text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'details' ? 'Master Details' : 'Master Records'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* ══ MASTER DETAILS TAB ══════════════════════════════════════════════ */}
        {activeTab === 'details' && (
          <>
            {/* Master Information card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-gray-900">
                  {isEditing ? 'Master information' : 'Master Information'}
                </h2>
                {isEditing ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={cancelEdit}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60"
                    >
                      <Save size={14} />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startEdit}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Pencil size={14} />
                    Edit Master Information
                  </button>
                )}
              </div>

              {isEditing ? (
                /* Edit form */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Name *</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => { setEditName(e.target.value); setEditErrors((p) => ({ ...p, name: undefined })); }}
                        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${editErrors.name ? 'border-red-400' : 'border-gray-300'}`}
                      />
                      {editErrors.name && <p className="text-xs text-red-500 mt-1">{editErrors.name}</p>}
                    </div>
                    {/* Status */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Status *</label>
                      <StatusSelect value={editStatus} onChange={setEditStatus} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Master Code (readonly) */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Master Code</label>
                      <input
                        type="text"
                        value={master.masterCode}
                        readOnly
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                      />
                    </div>
                    {/* Default Version (readonly) */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Default Version *</label>
                      <input
                        type="text"
                        value={`v${master.defaultVersion}`}
                        readOnly
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  {/* Description */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Description *</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => { setEditDescription(e.target.value); setEditErrors((p) => ({ ...p, description: undefined })); }}
                      rows={4}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${editErrors.description ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {editErrors.description && <p className="text-xs text-red-500 mt-1">{editErrors.description}</p>}
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="grid grid-cols-2 gap-y-5 gap-x-8">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Name</p>
                    <p className="text-sm text-gray-900">{master.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded border text-xs font-medium ${STATUS_COLORS[master.status]}`}>
                      {master.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Default Version</p>
                    <p className="text-sm text-gray-900">v{master.defaultVersion}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Description</p>
                    <p className="text-sm text-gray-900">{master.description}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Master Code</p>
                    <p className="text-sm text-gray-900">{master.masterCode}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Field Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Field Details</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Field Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Data Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Primary</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Validations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {master.fields.map((f) => (
                      <tr key={f.id}>
                        <td className="px-4 py-3 text-gray-800">{f.fieldName}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium border border-blue-200">
                            {f.dataType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {f.isPrimary && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium border border-gray-200">
                              Yes
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {f.validations.length > 0
                            ? f.validations.map((v) => `${v.type}: ${v.value}`).join(', ')
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sub Masters */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">Sub Masters</h2>
                <button
                  onClick={() => setSubMasterOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  <Plus size={14} />
                  Create Sub Master
                </button>
              </div>

              {master.subMasters.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Parent Master</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Entries</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Last Updated</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {master.subMasters.map((sub) => (
                        <tr key={sub.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{sub.name}</td>
                          <td className="px-4 py-3 text-gray-600">{sub.description}</td>
                          <td className="px-4 py-3 text-gray-600">{sub.parentMasterName}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded border text-xs font-medium ${STATUS_COLORS[sub.status]}`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{sub.entries}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDateTime(sub.updatedAt)}</td>
                          <td className="px-4 py-3">
                            <button className="p-1.5 hover:bg-gray-100 rounded-full" title="View">
                              <Eye size={16} className="text-blue-600" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ MASTER RECORDS TAB ═════════════════════════════════════════════ */}
        {activeTab === 'records' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Master Records</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 border border-red-300 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={14} />
                  Delete Records
                </button>
                <button
                  onClick={() => setUploadOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  <Upload size={14} />
                  Import Records
                </button>
              </div>
            </div>

            {master.records.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {master.fields.map((f) => (
                          <th key={f.id} className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                            {f.fieldName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedRecords.map((record, idx) => (
                        <tr key={record.id ?? idx} className="hover:bg-gray-50">
                          {master.fields.map((f) => (
                            <td key={f.id} className="px-4 py-3 text-gray-700">
                              {record[f.fieldName] ?? '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                  <span className="text-sm text-gray-600">
                    Showing {(recordPage - 1) * RECORDS_PER_PAGE + 1}–{Math.min(recordPage * RECORDS_PER_PAGE, master.records.length)} of {master.records.length} items
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setRecordPage((p) => Math.max(1, p - 1))}
                      disabled={recordPage === 1}
                      className="p-1.5 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 hover:bg-gray-100"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalRecordPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setRecordPage(p)}
                        className={`w-8 h-8 rounded text-sm font-medium ${p === recordPage ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setRecordPage((p) => Math.min(totalRecordPages, p + 1))}
                      disabled={recordPage === totalRecordPages}
                      className="p-1.5 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 hover:bg-gray-100"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <span className="text-xs text-gray-400 ml-3">Rows per page</span>
                    <span className="text-xs font-medium text-gray-600 ml-1">{RECORDS_PER_PAGE}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Sub Master dialog */}
      <CreateMasterDialog
        open={subMasterOpen}
        onClose={() => setSubMasterOpen(false)}
        onSuccess={() => { setSubMasterOpen(false); fetchMaster(); }}
        mode="submaster"
        masterId={master.id}
      />

      {/* Upload dialog */}
      <UploadFileDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => { setUploadOpen(false); fetchMaster(); }}
        master={master}
      />

      {/* Delete dialog */}
      <DeleteRecordsDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onSuccess={() => { setDeleteOpen(false); fetchMaster(); }}
        master={master}
      />
    </div>
  );
}
