import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { pagesApi } from '../../services/mockApi';
import type { ProgramPage, PageStatus, PageType } from '../../types/program';

const PAGE_TYPES: PageType[] = ['APP_STATE_PAGE'];
const PAGE_STATUSES: PageStatus[] = ['ACTIVE', 'INACTIVE', 'DRAFT'];

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  let hh = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ampm = hh >= 12 ? 'PM' : 'AM';
  hh = hh % 12 || 12;
  return `${dd}/${mm}/${yyyy} ${String(hh).padStart(2, '0')}:${min}:${ss} ${ampm}`;
}

export function PageDetailsView() {
  const { programId, pageId } = useParams<{ programId: string; pageId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<ProgramPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    page_name: '',
    page_type: 'APP_STATE_PAGE' as PageType,
    status: '' as PageStatus | '',
    page_config: '',
  });

  useEffect(() => {
    if (!pageId) return;
    setLoading(true);
    pagesApi.get(pageId)
      .then((p) => {
        setPage(p);
        setForm({ page_name: p.page_name, page_type: p.page_type, status: p.status, page_config: p.page_config });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [pageId]);

  const handleSave = async () => {
    if (!pageId || !form.page_name.trim() || !form.status) return;
    setSaving(true);
    try {
      await pagesApi.update(pageId, {
        page_name: form.page_name.trim(),
        page_type: form.page_type,
        status: form.status as PageStatus,
        page_config: form.page_config,
      });
      navigate(`/manage-programs/${programId}/view?tab=manage-pages`);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(`/manage-programs/${programId}/view?tab=manage-pages`);
  };

  if (loading) return <div className="p-6 text-center py-16 text-gray-500">Loading...</div>;
  if (!page) return <div className="p-6 text-center py-16 text-gray-500">Page not found</div>;

  const canSave = form.page_name.trim() && form.page_type && form.status;

  return (
    <div className="bg-white min-h-full">
      {/* Back nav */}
      <div className="border-b border-gray-200 px-6 py-3">
        <button
          onClick={handleBack}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1.5" />
          Back to Manage Page
        </button>
      </div>

      {/* Content card */}
      <div className="p-6">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Card header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Page Details</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleBack}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!canSave || saving}
                onClick={handleSave}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              {/* Left column */}
              <div className="flex flex-col gap-5">
                {/* Page Name */}
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">
                    Page Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={form.page_name}
                    onChange={(e) => setForm({ ...form, page_name: e.target.value })}
                    placeholder="Enter page name"
                  />
                </div>

                {/* Status */}
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.status || undefined}
                    onValueChange={(v) => setForm({ ...form, status: v as PageStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right column */}
              <div className="flex flex-col gap-5">
                {/* Page Type */}
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">
                    Page Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.page_type}
                    onValueChange={(v) => setForm({ ...form, page_type: v as PageType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Page Config */}
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">
                    Page Config <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    value={form.page_config}
                    onChange={(e) => setForm({ ...form, page_config: e.target.value })}
                    rows={8}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs font-mono text-gray-800 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="{}"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer with timestamps */}
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>Created: {formatDateTime(page.created_at)}</span>
            <span>Last updated: {formatDateTime(page.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
