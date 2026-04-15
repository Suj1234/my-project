import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { documentsApi } from '../../services/mockApi';
import { DOCUMENT_CATEGORIES, FILE_FORMATS } from '../../types/requiredDocument';
import type { RequiredDocumentCreate } from '../../types/requiredDocument';

const EMPTY: RequiredDocumentCreate = { document_name: '', document_category: '', supported_formats: [], min_size: undefined, max_size: undefined, status: 'Draft' };

export function RequiredDocumentForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const [formData, setFormData] = useState<RequiredDocumentCreate & { min_size_str?: string; max_size_str?: string }>({ ...EMPTY, min_size_str: '', max_size_str: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      documentsApi.get(id).then((doc) => {
        setFormData({ document_name: doc.document_name, document_category: doc.document_category, supported_formats: doc.supported_formats, min_size: doc.min_size, max_size: doc.max_size, status: doc.status, min_size_str: doc.min_size?.toString() || '', max_size_str: doc.max_size?.toString() || '' });
      });
    }
  }, [id, isEdit]);

  const toggleFormat = (format: string) => {
    setFormData((prev) => ({ ...prev, supported_formats: prev.supported_formats.includes(format) ? prev.supported_formats.filter((f) => f !== format) : [...prev.supported_formats, format] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.document_name || !formData.document_category || formData.supported_formats.length === 0) {
      alert('Please fill in all required fields and select at least one format'); return;
    }
    setLoading(true);
    try {
      const payload: RequiredDocumentCreate = {
        document_name: formData.document_name,
        document_category: formData.document_category,
        supported_formats: formData.supported_formats,
        min_size: formData.min_size_str ? parseFloat(formData.min_size_str) : undefined,
        max_size: formData.max_size_str ? parseFloat(formData.max_size_str) : undefined,
        status: formData.status,
      };
      if (isEdit && id) await documentsApi.update(id, payload);
      else await documentsApi.create(payload);
      navigate('/required-documents');
    } catch (err) { console.error(err); alert('Error saving document'); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/required-documents')} className="mb-4 text-gray-600">
          <ArrowLeft size={16} className="mr-2" />Back to Documents
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">{isEdit ? 'Edit' : 'Create'} Required Document</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label htmlFor="doc_name">Document Name *</Label>
              <Input id="doc_name" value={formData.document_name} onChange={(e) => setFormData({ ...formData, document_name: e.target.value })} placeholder="Enter document name" required className="mt-1" />
            </div>
            <div>
              <Label>Document Category *</Label>
              <Select value={formData.document_category} onValueChange={(v) => setFormData({ ...formData, document_category: v })} required>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{DOCUMENT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status *</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as any })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Active">Active</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="min_size">Minimum Size (MB)</Label>
              <Input id="min_size" type="number" step="0.01" value={formData.min_size_str} onChange={(e) => setFormData({ ...formData, min_size_str: e.target.value })} placeholder="e.g., 0.1" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="max_size">Maximum Size (MB)</Label>
              <Input id="max_size" type="number" step="0.01" value={formData.max_size_str} onChange={(e) => setFormData({ ...formData, max_size_str: e.target.value })} placeholder="e.g., 5" className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label>Supported Formats * <span className="text-xs text-gray-500 font-normal">(Select one or more)</span></Label>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-3 mt-2">
                {FILE_FORMATS.map((format) => (
                  <div key={format} className="flex items-center space-x-1.5">
                    <Checkbox id={format} checked={formData.supported_formats.includes(format)} onCheckedChange={() => toggleFormat(format)} />
                    <Label htmlFor={format} className="text-sm cursor-pointer font-normal">{format}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={() => navigate('/required-documents')}>Cancel</Button>
            <Button type="submit" disabled={loading || formData.supported_formats.length === 0} className="bg-gray-900 hover:bg-gray-800 text-white">
              {loading ? 'Saving...' : isEdit ? 'Update Document' : 'Create Document'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
