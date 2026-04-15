import { useState, useEffect } from 'react';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Label } from '../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { programDocumentsApi, schemesApi, closureActionsApi, rolesApi, documentsApi } from '../../../services/mockApi';
import type { ProgramDocument, Scheme, ClosureAction, Role } from '../../../types/program';
import type { RequiredDocument } from '../../../types/requiredDocument';

interface Props { programId: string; }

const DocumentChecklistTab = ({ programId }: Props) => {
  const [documents, setDocuments] = useState<ProgramDocument[]>([]);
  const [availableDocs, setAvailableDocs] = useState<RequiredDocument[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [actions, setActions] = useState<ClosureAction[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selected, setSelected] = useState<ProgramDocument | null>(null);

  const emptyForm = { document_id: '', scheme_ids: [] as string[], closure_action_ids: [] as string[], role_ids: [] as string[], status: 'Active' };
  const [addForm, setAddForm] = useState({ ...emptyForm });
  const [editForm, setEditForm] = useState({ scheme_ids: [] as string[], closure_action_ids: [] as string[], role_ids: [] as string[], status: 'Active' });

  useEffect(() => { fetchAll(); }, [programId]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [docs, avail, sc, ca, ro] = await Promise.all([
        programDocumentsApi.list(programId),
        documentsApi.list(),
        schemesApi.list(),
        closureActionsApi.list(),
        rolesApi.list(),
      ]);
      setDocuments(docs); setAvailableDocs(avail); setSchemes(sc); setActions(ca); setRoles(ro);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!addForm.document_id) return alert('Select a document');
    const doc = availableDocs.find((d) => d.id === addForm.document_id);
    await programDocumentsApi.create(programId, { ...addForm, document_name: doc?.document_name, document_code: doc?.document_code, document_category: doc?.document_category });
    setIsAddOpen(false); setAddForm({ ...emptyForm }); fetchAll();
  };

  const handleEdit = async () => {
    if (!selected) return;
    await programDocumentsApi.update(selected.id, editForm);
    setIsEditOpen(false); setSelected(null); fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this document from checklist?')) return;
    await programDocumentsApi.delete(id); fetchAll();
  };

  const openView = async (doc: ProgramDocument) => {
    const detail = await programDocumentsApi.getDetail(doc.id);
    setSelected(detail); setIsViewOpen(true);
  };

  const openEdit = async (doc: ProgramDocument) => {
    const detail = await programDocumentsApi.getDetail(doc.id);
    setSelected(detail);
    setEditForm({ scheme_ids: detail.scheme_ids, closure_action_ids: detail.closure_action_ids, role_ids: detail.role_ids, status: detail.status });
    setIsEditOpen(true);
  };

  const toggleArr = (arr: string[], id: string) => arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Login Checklist</h2>
          <p className="text-sm text-gray-600">Configure required documents for this program</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-gray-900 text-white"><Plus size={16} className="mr-2" />Add Document</Button>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Code</TableHead><TableHead>Document Name</TableHead>
              <TableHead>Category</TableHead><TableHead>Schemes</TableHead>
              <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow> :
             documents.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No documents in checklist</TableCell></TableRow> :
             documents.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-semibold text-blue-600">{d.document_code || 'N/A'}</TableCell>
                <TableCell className="font-medium">{d.document_name || '-'}</TableCell>
                <TableCell>{d.document_category || '-'}</TableCell>
                <TableCell>{d.scheme_ids.length > 0 ? <Badge variant="secondary">{d.scheme_ids.length} scheme(s)</Badge> : <span className="text-gray-400 text-sm">None</span>}</TableCell>
                <TableCell><Badge className={d.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}>{d.status}</Badge></TableCell>
                <TableCell className="text-right space-x-1">
                  <button onClick={() => openView(d)} className="p-1.5 hover:bg-gray-100 rounded"><Eye size={14} /></button>
                  <button onClick={() => openEdit(d)} className="p-1.5 hover:bg-gray-100 rounded"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(d.id)} className="p-1.5 hover:bg-gray-100 rounded"><Trash2 size={14} className="text-red-500" /></button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Modal */}
      <Dialog open={isAddOpen} onOpenChange={(o) => !o && (setIsAddOpen(false), setAddForm({ ...emptyForm }))}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Document to Checklist</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Document *</Label>
              <Select value={addForm.document_id} onValueChange={(v) => setAddForm({ ...addForm, document_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select document" /></SelectTrigger>
                <SelectContent>{availableDocs.map((d) => <SelectItem key={d.id} value={d.id}>{d.document_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Schemes</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {schemes.map((s) => (
                  <label key={s.id} className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={addForm.scheme_ids.includes(s.id)} onChange={() => setAddForm({ ...addForm, scheme_ids: toggleArr(addForm.scheme_ids, s.id) })} className="rounded" />
                    <span className="text-sm">{s.scheme_name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Closure Actions</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {actions.map((a) => (
                  <label key={a.id} className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={addForm.closure_action_ids.includes(a.id)} onChange={() => setAddForm({ ...addForm, closure_action_ids: toggleArr(addForm.closure_action_ids, a.id) })} className="rounded" />
                    <span className="text-sm">{a.action_name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Roles</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {roles.map((r) => (
                  <label key={r.id} className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={addForm.role_ids.includes(r.id)} onChange={() => setAddForm({ ...addForm, role_ids: toggleArr(addForm.role_ids, r.id) })} className="rounded" />
                    <span className="text-sm">{r.role_name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div><Label>Status</Label>
              <Select value={addForm.status} onValueChange={(v) => setAddForm({ ...addForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => { setIsAddOpen(false); setAddForm({ ...emptyForm }); }}>Cancel</Button>
              <Button onClick={handleAdd} className="bg-gray-900 text-white">Add Document</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewOpen} onOpenChange={(o) => !o && (setIsViewOpen(false), setSelected(null))}>
        <DialogContent>
          <DialogHeader><DialogTitle>Document Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 py-4">
              {[['Document Code', selected.document_code], ['Document Name', selected.document_name], ['Category', selected.document_category], ['Status', selected.status]].map(([k, v]) => (
                <div key={k as string}><p className="text-xs text-gray-500">{k}</p><p className="font-medium">{v || '-'}</p></div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={(o) => !o && (setIsEditOpen(false), setSelected(null))}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Document in Checklist</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {selected && <div className="bg-gray-50 rounded p-3"><p className="text-xs text-gray-500">Document</p><p className="font-medium">{selected.document_name}</p></div>}
            <div><Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => { setIsEditOpen(false); setSelected(null); }}>Cancel</Button>
              <Button onClick={handleEdit} className="bg-gray-900 text-white">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentChecklistTab;
