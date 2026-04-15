import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Upload, Download, Info, FileText } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { nativeFieldsApi } from '../../../services/mockApi';
import type { NativeField, VariableMaster } from '../../../types/program';
import { FIELD_CATEGORIES } from '../../../types/fieldManagement';

const CATEGORIES = [...FIELD_CATEGORIES];

interface FormData { variable_id: string; variable_name: string; data_type: string; category: string; description: string; alias: string; status: string; }
const EMPTY_FORM: FormData = { variable_id: '', variable_name: '', data_type: '', category: '', description: '', alias: '', status: 'Active' };

interface Props { programId: string; }

const ManageNativeFieldsTab = ({ programId }: Props) => {
  const [fields, setFields] = useState<NativeField[]>([]);
  const [loading, setLoading] = useState(true);
  const [variableMaster, setVariableMaster] = useState<VariableMaster[]>([]);
  const [filters, setFilters] = useState({ search: '', alias: '', category: 'all', status: 'all' });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingField, setEditingField] = useState<NativeField | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchFields(); }, [programId, filters]);
  useEffect(() => { nativeFieldsApi.getVariableMaster().then(setVariableMaster); }, []);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const { fields: data } = await nativeFieldsApi.list(programId, { search: filters.search, category: filters.category !== 'all' ? filters.category : undefined, status: filters.status !== 'all' ? filters.status : undefined, alias: filters.alias });
      setFields(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const getAvailable = () => {
    const existing = fields.map((f) => f.variable_id);
    return variableMaster.filter((v) => !existing.includes(v.id));
  };

  const filtered = getAvailable().filter((v) =>
    v.variable_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectVariable = (v: VariableMaster) => {
    setFormData({ variable_id: v.id, variable_name: v.variable_name, data_type: v.field_type, category: v.category || 'Other', description: v.description || '', alias: v.variable_name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()), status: 'Active' });
    setSearchTerm(''); setShowDropdown(false);
  };

  const handleAdd = async () => {
    if (!formData.variable_id) return alert('Select a variable');
    await nativeFieldsApi.create(programId, formData as Partial<NativeField>);
    setIsAddOpen(false); resetForm(); fetchFields();
  };

  const handleEdit = async () => {
    if (!editingField) return;
    await nativeFieldsApi.update(programId, editingField.id, formData as Partial<NativeField>);
    setIsEditOpen(false); setEditingField(null); resetForm(); fetchFields();
  };

  const openEdit = (f: NativeField) => { setEditingField(f); setFormData({ variable_id: f.variable_id, variable_name: f.variable_name, data_type: f.field_type, category: f.category, description: f.description || '', alias: f.alias, status: f.status }); setIsEditOpen(true); };
  const resetForm = () => setFormData(EMPTY_FORM);

  const downloadTemplate = () => {
    const csv = 'Variable Name,Data Type,Category,Description,Alias,Status\ncustomer_name,String,Personal Information,Customer full name,Customer Name,Active';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'native_fields_template.csv'; a.click();
  };

  const getStatusClass = (s: string) => s === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Manage Native Fields</h2>
          <p className="text-sm text-gray-600">Configure native database fields for this program</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsBulkOpen(true)}><Upload size={16} className="mr-2" />Bulk Upload</Button>
          <Button onClick={() => setIsAddOpen(true)} className="bg-gray-900 text-white"><Plus size={16} className="mr-2" />Add Field</Button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start space-x-2">
        <Info size={17} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-800">This module is for Native fields only. Custom fields are managed in the "Manage Custom Fields" tab.</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4 grid grid-cols-4 gap-3">
        <div><Label className="text-xs">Search</Label><Input placeholder="Search name..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></div>
        <div><Label className="text-xs">Alias</Label><Input placeholder="Search alias..." value={filters.alias} onChange={(e) => setFilters({ ...filters, alias: e.target.value })} /></div>
        <div><Label className="text-xs">Category</Label>
          <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All</SelectItem>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">Status</Label>
          <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead><TableHead>Data Type</TableHead><TableHead>Alias</TableHead>
              <TableHead>Description</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
             fields.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No native fields configured</TableCell></TableRow> :
             fields.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-mono text-sm text-blue-600">{f.variable_name}</TableCell>
                <TableCell><Badge variant="outline">{f.field_type}</Badge></TableCell>
                <TableCell className="font-medium">{f.alias}</TableCell>
                <TableCell className="max-w-xs truncate text-gray-600">{f.description || '-'}</TableCell>
                <TableCell><Badge variant="secondary">{f.category}</Badge></TableCell>
                <TableCell><Badge className={getStatusClass(f.status)}>{f.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <button onClick={() => openEdit(f)} className="p-1.5 hover:bg-gray-100 rounded"><Pencil size={14} /></button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Modal */}
      <Dialog open={isAddOpen} onOpenChange={(o) => !o && (setIsAddOpen(false), resetForm())}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Native Field</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Variable Name *</Label>
              {formData.variable_id ? (
                <div className="mt-1 p-3 bg-gray-50 rounded border flex justify-between items-center">
                  <span className="font-mono text-sm">{formData.variable_name}</span>
                  <button onClick={resetForm} className="text-blue-600 text-xs hover:underline">Change</button>
                </div>
              ) : (
                <div className="relative mt-1" ref={dropdownRef}>
                  <Input placeholder="Search variable..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} />
                  {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-48 overflow-y-auto">
                      {filtered.length === 0 ? <div className="p-3 text-sm text-gray-500">No variables available</div> :
                        filtered.slice(0, 15).map((v) => (
                          <button key={v.id} onClick={() => selectVariable(v)} className="w-full p-2 text-left hover:bg-gray-50 border-b last:border-0">
                            <p className="font-mono text-sm">{v.variable_name}</p>
                            <p className="text-xs text-gray-500">{v.field_type} • {v.category}</p>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {formData.variable_id && (
              <>
                <div><Label>Data Type</Label><Input value={formData.data_type} disabled className="bg-gray-50" /></div>
                <div><Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Description</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
                <div><Label>Alias</Label><Input value={formData.alias} onChange={(e) => setFormData({ ...formData, alias: e.target.value })} /></div>
                <div><Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleAdd} className="bg-gray-900 text-white" disabled={!formData.variable_id}>Add Field</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={(o) => !o && (setIsEditOpen(false), setEditingField(null), resetForm())}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Native Field</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Variable Name</Label><Input value={formData.variable_name} disabled className="bg-gray-50 font-mono" /></div>
            <div><Label>Data Type</Label><Input value={formData.data_type} disabled className="bg-gray-50" /></div>
            <div><Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            <div><Label>Alias</Label><Input value={formData.alias} onChange={(e) => setFormData({ ...formData, alias: e.target.value })} /></div>
            <div><Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => { setIsEditOpen(false); setEditingField(null); resetForm(); }}>Cancel</Button>
              <Button onClick={handleEdit} className="bg-gray-900 text-white">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Modal */}
      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Bulk Upload Native Fields</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-800"><strong>Steps:</strong> Download template → Fill data → Upload CSV</p>
            </div>
            <div className="border rounded p-4">
              <p className="font-medium mb-2 text-sm">Download Template</p>
              <Button variant="outline" onClick={downloadTemplate}><Download size={16} className="mr-2" />Download Template</Button>
            </div>
            <div className="border rounded p-4">
              <p className="font-medium mb-2 text-sm">Upload File</p>
              <div className="border-2 border-dashed rounded p-6 text-center">
                <FileText size={30} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to upload CSV (max 5MB)</p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsBulkOpen(false)}>Cancel</Button>
              <Button className="bg-gray-900 text-white" disabled>Upload</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageNativeFieldsTab;
