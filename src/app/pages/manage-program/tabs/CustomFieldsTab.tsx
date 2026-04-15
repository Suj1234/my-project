import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Textarea } from '../../../components/ui/textarea';
import { Checkbox } from '../../../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { customFieldsApi } from '../../../services/mockApi';
import type { CustomField } from '../../../types/program';

const DATA_TYPES = ['String', 'Number', 'Date', 'Boolean', 'Dropdown'];
const CATEGORIES = ['Personal Information', 'Business Information', 'Financial Details', 'Additional Information', 'Documents', 'Verification', 'Other'];
const MASTER_LISTS: Record<string, string[]> = {
  gender: ['Male', 'Female', 'Other'],
  marital_status: ['Single', 'Married', 'Divorced', 'Widowed'],
  employment_type: ['Salaried', 'Self-Employed', 'Business Owner', 'Retired'],
  education: ['High School', 'Graduate', 'Post Graduate', 'Doctorate'],
  residence_type: ['Owned', 'Rented', 'Family Owned', 'Company Provided'],
  business_type: ['Proprietorship', 'Partnership', 'Private Limited', 'LLP'],
  industry: ['IT/Software', 'Manufacturing', 'Healthcare', 'Finance', 'Retail'],
};

interface Validations { min_length?: string; max_length?: string; regex?: string; min_value?: string; max_value?: string; min_date?: string; max_date?: string; }

interface FormData {
  field_name: string; data_type: string; description: string; value: string;
  master_list: string; category: string; alias: string; status: string;
  is_required: boolean; validations: Validations;
}

const EMPTY_FORM: FormData = {
  field_name: '', data_type: '', description: '', value: '', master_list: '',
  category: '', alias: '', status: 'Active', is_required: false,
  validations: { min_length: '', max_length: '', regex: '', min_value: '', max_value: '', min_date: '', max_date: '' },
};

const STATUS_CLASS: Record<string, string> = {
  Active: 'bg-green-100 text-green-800', Inactive: 'bg-gray-100 text-gray-800', Draft: 'bg-yellow-100 text-yellow-800',
};

interface Props { programId: string; }

const CustomFieldsTab = ({ programId }: Props) => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [filters, setFilters] = useState({ search: '', alias: '', category: 'all', data_type: 'all', status: 'all' });
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);

  useEffect(() => { fetchFields(); }, [programId, filters]);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const { fields: data } = await customFieldsApi.list(programId, { search: filters.search, category: filters.category !== 'all' ? filters.category : undefined, status: filters.status !== 'all' ? filters.status : undefined });
      setFields(data);
    } catch (err) {
      console.error(err);
      setFields([]);
    } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!formData.field_name || !formData.data_type || !formData.category) return alert('Fill required fields');
    await customFieldsApi.create(programId, formData as Partial<CustomField>);
    setIsCreateOpen(false); resetForm(); fetchFields();
  };

  const handleEdit = async () => {
    if (!editingField) return;
    await customFieldsApi.update(programId, editingField.id, formData as Partial<CustomField>);
    setIsEditOpen(false); setEditingField(null); resetForm(); fetchFields();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this field?')) return;
    await customFieldsApi.delete(programId, id); fetchFields();
  };

  const openEdit = (field: CustomField) => {
    setEditingField(field);
    setFormData({ ...field, validations: (field as any).validations || {}, value: (field as any).value || '' });
    setIsEditOpen(true);
  };

  const resetForm = () => setFormData(EMPTY_FORM);
  const closeModal = () => { setIsCreateOpen(false); setIsEditOpen(false); setEditingField(null); resetForm(); };

  const renderValidations = () => {
    const v = formData.validations;
    const upd = (patch: Partial<Validations>) => setFormData({ ...formData, validations: { ...v, ...patch } });
    if (formData.data_type === 'String') return (
      <div className="grid grid-cols-3 gap-3">
        <div><Label className="text-xs">Min Length</Label><Input type="number" value={v.min_length} onChange={(e) => upd({ min_length: e.target.value })} /></div>
        <div><Label className="text-xs">Max Length</Label><Input type="number" value={v.max_length} onChange={(e) => upd({ max_length: e.target.value })} /></div>
        <div><Label className="text-xs">Regex</Label><Input value={v.regex} onChange={(e) => upd({ regex: e.target.value })} placeholder="^[a-zA-Z]+$" /></div>
      </div>
    );
    if (formData.data_type === 'Number') return (
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Min Value</Label><Input type="number" value={v.min_value} onChange={(e) => upd({ min_value: e.target.value })} /></div>
        <div><Label className="text-xs">Max Value</Label><Input type="number" value={v.max_value} onChange={(e) => upd({ max_value: e.target.value })} /></div>
      </div>
    );
    if (formData.data_type === 'Date') return (
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Min Date</Label><Input type="date" value={v.min_date} onChange={(e) => upd({ min_date: e.target.value })} /></div>
        <div><Label className="text-xs">Max Date</Label><Input type="date" value={v.max_date} onChange={(e) => upd({ max_date: e.target.value })} /></div>
      </div>
    );
    return null;
  };

  const formatValidations = (field: CustomField) => {
    const v = (field as any).validations;
    if (!v) return '-';
    const parts: string[] = [];
    if (v.min_length) parts.push(`Min: ${v.min_length}`);
    if (v.max_length) parts.push(`Max: ${v.max_length}`);
    if (v.regex) parts.push('Regex');
    if (v.min_value !== '' && v.min_value != null) parts.push(`Min: ${v.min_value}`);
    if (v.max_value !== '' && v.max_value != null) parts.push(`Max: ${v.max_value}`);
    if (v.min_date) parts.push(`From: ${v.min_date}`);
    if (v.max_date) parts.push(`To: ${v.max_date}`);
    return parts.length ? parts.join(', ') : '-';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Manage Custom Fields</h2>
          <p className="text-sm text-gray-600">Create and manage custom fields for this program</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-gray-900 text-white"><Plus size={16} className="mr-2" />Create Custom Field</Button>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4 grid grid-cols-5 gap-3">
        {[
          { label: 'Search', el: <Input placeholder="Name..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /> },
          { label: 'Alias', el: <Input placeholder="Alias..." value={filters.alias} onChange={(e) => setFilters({ ...filters, alias: e.target.value })} /> },
        ].map(({ label, el }) => <div key={label}><Label className="text-xs">{label}</Label>{el}</div>)}
        <div><Label className="text-xs">Category</Label>
          <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All</SelectItem>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">Data Type</Label>
          <Select value={filters.data_type} onValueChange={(v) => setFilters({ ...filters, data_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All</SelectItem>{DATA_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">Status</Label>
          <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem><SelectItem value="Draft">Draft</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead><TableHead>Data Type</TableHead><TableHead>Value/Enum</TableHead>
              <TableHead>Validations</TableHead><TableHead>Required</TableHead><TableHead>Category</TableHead>
              <TableHead>Alias</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={9} className="text-center py-8">Loading...</TableCell></TableRow> :
             fields.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-500">No custom fields configured</TableCell></TableRow> :
             fields.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.field_name}</TableCell>
                <TableCell><Badge variant="outline">{f.data_type}</Badge></TableCell>
                <TableCell className="max-w-xs truncate text-sm">{f.data_type === 'Dropdown' && (f as any).master_list ? MASTER_LISTS[(f as any).master_list]?.join(', ') : (f as any).value || '-'}</TableCell>
                <TableCell className="text-xs">{formatValidations(f)}</TableCell>
                <TableCell>{f.is_required ? <Badge className="bg-red-100 text-red-800">Yes</Badge> : <span className="text-gray-400 text-sm">No</span>}</TableCell>
                <TableCell><Badge variant="secondary">{f.category}</Badge></TableCell>
                <TableCell>{(f as any).alias || '-'}</TableCell>
                <TableCell><Badge className={STATUS_CLASS[f.status] || STATUS_CLASS.Draft}>{f.status}</Badge></TableCell>
                <TableCell className="text-right space-x-1">
                  <button onClick={() => openEdit(f)} className="p-1.5 hover:bg-gray-100 rounded"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(f.id)} className="p-1.5 hover:bg-gray-100 rounded"><Trash2 size={14} className="text-red-500" /></button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{isEditOpen ? 'Edit' : 'Create'} Custom Field</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
            <div><Label>Field Name *</Label><Input value={formData.field_name} onChange={(e) => setFormData({ ...formData, field_name: e.target.value })} placeholder="custom_field_name" /></div>
            <div><Label>Data Type *</Label>
              <Select value={formData.data_type} onValueChange={(v) => setFormData({ ...formData, data_type: v, value: '', master_list: '', validations: {} })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{DATA_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {formData.data_type === 'Dropdown' && (
              <div>
                <Label>Master List *</Label>
                <Select value={formData.master_list} onValueChange={(v) => setFormData({ ...formData, master_list: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.keys(MASTER_LISTS).map((k) => <SelectItem key={k} value={k}>{k.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
                {formData.master_list && <p className="text-xs text-gray-500 mt-1">Values: {MASTER_LISTS[formData.master_list]?.join(', ')}</p>}
              </div>
            )}
            {['String', 'Number', 'Date'].includes(formData.data_type) && <div><Label>Validations</Label><div className="mt-2">{renderValidations()}</div></div>}
            <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} /></div>
            <div><Label>Category *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Alias</Label><Input value={formData.alias} onChange={(e) => setFormData({ ...formData, alias: e.target.value })} /></div>
            <div><Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem><SelectItem value="Draft">Draft</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="req" checked={formData.is_required} onCheckedChange={(c) => setFormData({ ...formData, is_required: !!c })} />
              <Label htmlFor="req" className="font-normal cursor-pointer">Required field</Label>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={closeModal}>Cancel</Button>
              <Button onClick={isEditOpen ? handleEdit : handleCreate} className="bg-gray-900 text-white">{isEditOpen ? 'Save' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomFieldsTab;
