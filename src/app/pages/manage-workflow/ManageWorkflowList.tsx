import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Eye, Plus, Filter, X, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { workflowsApi } from '../../services/mockApi';
import type { Workflow, WorkflowCreate } from '../../types/workflow';

const statusClass = (s: string) => {
  if (s === 'ACTIVE') return 'bg-green-100 text-green-800';
  if (s === 'INACTIVE') return 'bg-gray-100 text-gray-800';
  return 'bg-yellow-100 text-yellow-800';
};

const EMPTY: WorkflowCreate = { workflow_name: '', workflow_code: '', description: '', status: 'DRAFT' };

export function ManageWorkflowList() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<WorkflowCreate>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = () => {
    setLoading(true);
    workflowsApi.list().then(setWorkflows).catch(console.error).finally(() => setLoading(false));
  };

  const filtered = workflows.filter((w) => {
    const matchSearch = !search || w.workflow_name.toLowerCase().includes(search.toLowerCase()) ||
      w.workflow_code.toLowerCase().includes(search.toLowerCase()) ||
      w.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || w.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelected(selected.length === filtered.length ? [] : filtered.map((w) => w.id));
  };

  const handleCreate = async () => {
    if (!formData.workflow_name.trim() || !formData.workflow_code.trim()) return;
    setSaving(true);
    try {
      const created = await workflowsApi.create(formData);
      setIsCreateOpen(false);
      setFormData(EMPTY);
      load();
      navigate(`/manage-programs/workflows/${created.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    for (const wId of selected) {
      const w = workflows.find((x) => x.id === wId);
      if (w) {
        const draftVersion = w.versions.find((v) => v.status === 'DRAFT') || w.versions[0];
        if (draftVersion) await workflowsApi.publishVersion(wId, draftVersion.id);
      }
    }
    setSelected([]);
    load();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Manage Workflow</h1>
          <p className="text-sm text-gray-600 mt-1">Create and manage workflows for your programs</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} className="mr-2" />{showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button variant="outline" onClick={handlePublish} disabled={selected.length === 0}>
            Publish
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus size={16} className="mr-2" />Create Workflow
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs mb-1 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <Input placeholder="Name, code, description..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Status</Label>
              <Select value={statusFilter || '__all__'} onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={() => { setSearch(''); setStatusFilter(''); }}>
                <X size={14} className="mr-2" />Clear Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {!showFilters && (search || statusFilter) && (
        <div className="flex items-center space-x-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <Input placeholder="Search workflows..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <button onClick={() => { setSearch(''); setStatusFilter(''); }} className="flex items-center text-sm text-gray-500 hover:text-gray-800">
            <X size={14} className="mr-1" />Clear
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Workflows ({filtered.length})</h2>
          {selected.length > 0 && (
            <span className="text-xs text-blue-600">{selected.length} selected</span>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selected.length === filtered.length}
                  onChange={toggleAll}
                  className="rounded border-gray-300"
                />
              </TableHead>
              <TableHead>Workflow Name</TableHead>
              <TableHead>Workflow Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Default Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-gray-500">No workflows found</TableCell></TableRow>
            ) : filtered.map((w) => (
              <TableRow key={w.id} className="hover:bg-gray-50">
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.includes(w.id)}
                    onChange={() => toggleSelect(w.id)}
                    className="rounded border-gray-300"
                  />
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => navigate(`/manage-programs/workflows/${w.id}`)}
                    className="font-medium text-blue-600 hover:underline text-left"
                  >
                    {w.workflow_name}
                  </button>
                </TableCell>
                <TableCell className="font-mono text-sm text-gray-700">{w.workflow_code}</TableCell>
                <TableCell className="max-w-xs truncate text-sm text-gray-600">{w.description || '-'}</TableCell>
                <TableCell className="text-sm text-gray-700">{w.default_version || '-'}</TableCell>
                <TableCell>
                  <Badge className={`${statusClass(w.status)} text-xs`}>{w.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => navigate(`/manage-programs/workflows/${w.id}`)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                    title="View"
                  >
                    <Eye size={16} className="text-blue-600" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Workflow Modal */}
      <Dialog open={isCreateOpen} onOpenChange={(o) => { if (!o) { setIsCreateOpen(false); setFormData(EMPTY); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Workflow</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Workflow Name <span className="text-red-500">*</span></Label>
              <Input
                className="mt-1"
                placeholder="e.g. KYC Verification Flow"
                value={formData.workflow_name}
                onChange={(e) => setFormData({ ...formData, workflow_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Workflow Code <span className="text-red-500">*</span></Label>
              <Input
                className="mt-1 font-mono"
                placeholder="e.g. KYC_FLOW_001"
                value={formData.workflow_code}
                onChange={(e) => setFormData({ ...formData, workflow_code: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                className="mt-1"
                placeholder="Brief description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as WorkflowCreate['status'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); setFormData(EMPTY); }}>Cancel</Button>
              <Button
                onClick={handleCreate}
                disabled={!formData.workflow_name.trim() || !formData.workflow_code.trim() || saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? 'Creating...' : 'Create Workflow'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
