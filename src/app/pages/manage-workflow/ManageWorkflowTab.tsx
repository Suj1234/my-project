import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Eye, Plus, GitBranch } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { workflowsApi } from '../../services/mockApi';
import type { Workflow, WorkflowCreate } from '../../types/workflow';

const statusClass = (s: string) => {
  if (s === 'ACTIVE') return 'bg-green-100 text-green-800';
  if (s === 'INACTIVE') return 'bg-gray-100 text-gray-800';
  return 'bg-yellow-100 text-yellow-800';
};

interface Props {
  programId: string;
}

export default function ManageWorkflowTab({ programId }: Props) {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<WorkflowCreate, 'program_id'>>({
    workflow_name: '',
    workflow_code: '',
    description: '',
    status: 'DRAFT',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [programId]);

  const load = () => {
    setLoading(true);
    workflowsApi.list(programId).then(setWorkflows).catch(console.error).finally(() => setLoading(false));
  };

  const resetForm = () => setFormData({ workflow_name: '', workflow_code: '', description: '', status: 'DRAFT' });

  const handleCreate = async () => {
    if (!formData.workflow_name.trim() || !formData.workflow_code.trim()) return;
    setSaving(true);
    try {
      const created = await workflowsApi.create({ ...formData, program_id: programId });
      setIsCreateOpen(false);
      resetForm();
      load();
      navigate(`/manage-programs/workflows/${created.id}?program_id=${programId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Manage Workflow</h3>
          <p className="text-sm text-gray-500 mt-0.5">Workflows defined for this program</p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          <Plus size={15} className="mr-2" />Create Workflow
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workflow Name</TableHead>
              <TableHead>Workflow Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Default Version</TableHead>
              <TableHead>Versions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-gray-500">Loading...</TableCell></TableRow>
            ) : workflows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-14">
                  <GitBranch size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">No workflows yet.</p>
                  <Button onClick={() => setIsCreateOpen(true)} className="mt-3 bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                    <Plus size={14} className="mr-1.5" />Create First Workflow
                  </Button>
                </TableCell>
              </TableRow>
            ) : workflows.map((w) => (
              <TableRow key={w.id} className="hover:bg-gray-50">
                <TableCell>
                  <button
                    onClick={() => navigate(`/manage-programs/workflows/${w.id}?program_id=${programId}`)}
                    className="font-medium text-blue-600 hover:underline text-left"
                  >
                    {w.workflow_name}
                  </button>
                </TableCell>
                <TableCell className="font-mono text-sm text-gray-700">{w.workflow_code}</TableCell>
                <TableCell className="max-w-xs truncate text-sm text-gray-600">{w.description || '-'}</TableCell>
                <TableCell className="text-sm text-gray-700">{w.default_version || '-'}</TableCell>
                <TableCell className="text-sm text-gray-600">{w.versions.length}</TableCell>
                <TableCell>
                  <Badge className={`${statusClass(w.status)} text-xs`}>{w.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => navigate(`/manage-programs/workflows/${w.id}?program_id=${programId}`)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                    title="View Details"
                  >
                    <Eye size={15} className="text-blue-600" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Workflow Modal */}
      <Dialog open={isCreateOpen} onOpenChange={(o) => { if (!o) { setIsCreateOpen(false); resetForm(); } }}>
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
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>Cancel</Button>
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
