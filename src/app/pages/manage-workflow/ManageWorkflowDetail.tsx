import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { ArrowLeft, Pencil, Plus, GitBranch } from 'lucide-react';
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

export function ManageWorkflowDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  // program_id passed as query param from ManageWorkflowTab navigation
  const programId = new URLSearchParams(location.search).get('program_id') || '';
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<WorkflowCreate>>({});
  const [saving, setSaving] = useState(false);
  const [creatingVersion, setCreatingVersion] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!id) return;
    load();
  }, [id]);

  const load = () => {
    if (!id) return;
    setLoading(true);
    workflowsApi.get(id).then((w) => {
      setWorkflow(w);
      setEditForm({ workflow_name: w.workflow_name, workflow_code: w.workflow_code, description: w.description, status: w.status });
    }).catch(console.error).finally(() => setLoading(false));
  };

  const handleEdit = async () => {
    if (!id || !editForm.workflow_name?.trim()) return;
    setSaving(true);
    try {
      await workflowsApi.update(id, editForm);
      setIsEditOpen(false);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!id) return;
    setCreatingVersion(true);
    try {
      await workflowsApi.createVersion(id);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingVersion(false);
    }
  };

  const handlePublish = async (versionId: string) => {
    if (!id) return;
    setPublishing(true);
    try {
      await workflowsApi.publishVersion(id, versionId);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <div className="p-6 text-center py-16 text-gray-500">Loading...</div>;
  if (!workflow) return <div className="p-6 text-center py-16 text-gray-500">Workflow not found</div>;

  return (
    <div className="p-6">
      {/* Back + Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => {
              const pid = programId || workflow?.program_id;
              if (pid) navigate(`/manage-programs/${pid}/view`);
              else navigate('/manage-programs');
            }}
            className="mb-3 -ml-2 text-gray-600"
          >
            <ArrowLeft size={16} className="mr-2" />Back to Program
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">{workflow.workflow_name}</h1>
          <p className="text-sm text-gray-500 mt-1">Code: <span className="font-mono">{workflow.workflow_code}</span></p>
        </div>
        <div className="flex items-center space-x-2 mt-10">
          <Button variant="outline" onClick={() => setIsEditOpen(true)}>
            <Pencil size={15} className="mr-2" />Edit Workflow
          </Button>
          {workflow.versions.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                const activeVersion = workflow.versions.find((v) => v.status === 'DRAFT') || workflow.versions[0];
                if (activeVersion) handlePublish(activeVersion.id);
              }}
              disabled={publishing}
              className="border-green-500 text-green-700 hover:bg-green-50"
            >
              {publishing ? 'Publishing...' : 'Publish'}
            </Button>
          )}
        </div>
      </div>

      {/* Workflow Details Card */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Workflow Details</h2>
          <button onClick={() => setIsEditOpen(true)} className="text-sm text-blue-600 hover:underline flex items-center">
            <Pencil size={13} className="mr-1" />Edit Details
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Workflow Name</p>
            <p className="font-semibold text-gray-900">{workflow.workflow_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Workflow Code</p>
            <p className="font-mono font-semibold text-blue-600">{workflow.workflow_code}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500 mb-1">Description</p>
            <p className="text-gray-800">{workflow.description || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <Badge className={`${statusClass(workflow.status)} text-sm`}>{workflow.status}</Badge>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Default Version</p>
            <p className="font-medium text-gray-900">{workflow.default_version || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Created</p>
            <p className="text-sm text-gray-700">{new Date(workflow.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Last Updated</p>
            <p className="text-sm text-gray-700">{new Date(workflow.updated_at).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Workflow Versions */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitBranch size={18} className="text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">Workflow Versions ({workflow.versions.length})</h2>
          </div>
          <Button
            onClick={handleCreateVersion}
            disabled={creatingVersion}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <Plus size={15} className="mr-2" />{creatingVersion ? 'Creating...' : 'Create Version'}
          </Button>
        </div>

        {workflow.versions.length === 0 ? (
          <div className="p-12 text-center">
            <GitBranch size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No versions yet. Create a version to start building the canvas.</p>
            <Button
              onClick={handleCreateVersion}
              disabled={creatingVersion}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus size={15} className="mr-2" />Create First Version
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Canvas Blocks</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Updated Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflow.versions.map((v) => (
                <TableRow key={v.id} className="hover:bg-gray-50">
                  <TableCell className="font-semibold text-gray-900">{v.version}</TableCell>
                  <TableCell>
                    <Badge className={`${statusClass(v.status)} text-xs`}>{v.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{v.canvas_blocks.length} blocks</TableCell>
                  <TableCell className="text-sm text-gray-600">{new Date(v.created_at).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell className="text-sm text-gray-600">{new Date(v.updated_at).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => {
                          const suffix = workflow.id.endsWith('-a') ? 'canvas-a' : workflow.id.endsWith('-b') ? 'canvas-b' : workflow.id.endsWith('-c') ? 'canvas-c' : 'canvas';
                          navigate(`/manage-programs/workflows/${workflow.id}/versions/${v.id}/${suffix}`);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full"
                        title="Edit Canvas"
                      >
                        <Pencil size={15} className="text-blue-600" />
                      </button>
                      {v.status === 'DRAFT' && (
                        <button
                          onClick={() => handlePublish(v.id)}
                          disabled={publishing}
                          className="px-2 py-1 text-xs text-green-700 border border-green-400 rounded hover:bg-green-50"
                          title="Publish this version"
                        >
                          Publish
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Edit Workflow Modal */}
      <Dialog open={isEditOpen} onOpenChange={(o) => { if (!o) setIsEditOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Workflow</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Workflow Name <span className="text-red-500">*</span></Label>
              <Input
                className="mt-1"
                value={editForm.workflow_name || ''}
                onChange={(e) => setEditForm({ ...editForm, workflow_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Workflow Code</Label>
              <Input
                className="mt-1 font-mono bg-gray-50"
                value={editForm.workflow_code || ''}
                disabled
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                className="mt-1"
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={editForm.status || 'DRAFT'} onValueChange={(v) => setEditForm({ ...editForm, status: v as WorkflowCreate['status'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button
                onClick={handleEdit}
                disabled={!editForm.workflow_name?.trim() || saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
