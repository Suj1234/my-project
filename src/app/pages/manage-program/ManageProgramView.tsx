import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { programsApi } from '../../services/mockApi';
import type { Program } from '../../types/program';
import ManageNativeFieldsTab from './tabs/ManageNativeFieldsTab';
import CustomFieldsTab from './tabs/CustomFieldsTab';
import DocumentChecklistTab from './tabs/DocumentChecklistTab';
import OpsDashboardTab from './tabs/OpsDashboardTab';
import ManageWorkflowTab from '../manage-workflow/ManageWorkflowTab';

const STATUS_CLASS: Record<string, string> = {
  Active: 'bg-green-100 text-green-700 border-green-200',
  Draft: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Inactive: 'bg-gray-100 text-gray-500 border-gray-200',
};

export function ManageProgramView() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    programsApi.get(id).then(setProgram).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6 text-center py-16 text-gray-500">Loading...</div>;
  if (!program) return <div className="p-6 text-center py-16 text-gray-500">Program not found</div>;

  return (
    <div className="bg-white min-h-full">
      {/* Back nav */}
      <div className="border-b border-gray-200 px-6 py-3">
        <Button variant="ghost" onClick={() => navigate('/manage-programs')} className="text-sm text-gray-600">
          <ArrowLeft size={16} className="mr-2" />Back to Programs
        </Button>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <div className="border-b border-gray-200 px-6">
          <TabsList className="bg-transparent h-auto p-0 space-x-1">
            {[
              { value: 'details', label: 'Program Details' },
              { value: 'native-fields', label: 'Manage Native Fields' },
              { value: 'custom-fields', label: 'Manage Custom Fields' },
              { value: 'checklist', label: 'Login Checklist' },
              { value: 'workflow', label: 'Manage Workflow' },
              { value: 'ops-dashboard', label: 'Ops Dashboard' },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Program Details */}
        <TabsContent value="details" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Program Details</h2>
            <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
              <Pencil size={15} className="mr-2" />Edit Details
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><p className="text-sm text-gray-500 mb-1">Name</p><p className="text-base font-medium text-gray-900">{program.program_name}</p></div>
            <div><p className="text-sm text-gray-500 mb-1">Product Category</p><p className="text-base text-gray-900">{program.product_category}</p></div>
            <div><p className="text-sm text-gray-500 mb-1">Description</p><p className="text-base text-gray-900">{program.description || 'N/A'}</p></div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Vertical</p>
              <div className="flex flex-wrap gap-2">
                {program.vertical.map((v, i) => (
                  <Badge key={i} variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">{v}</Badge>
                ))}
              </div>
            </div>
            <div><p className="text-sm text-gray-500 mb-1">Program Code</p><p className="text-base font-medium text-gray-900">{program.program_code}</p></div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded border text-xs font-medium ${STATUS_CLASS[program.status] || STATUS_CLASS.Draft}`}>
                {program.status.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
            <span>Created: {new Date(program.created_at).toLocaleString()}</span>
            <span>Last updated: {new Date(program.updated_at).toLocaleString()}</span>
          </div>
        </TabsContent>

        <TabsContent value="native-fields" className="p-6">
          <ManageNativeFieldsTab programId={program.id} />
        </TabsContent>

        <TabsContent value="custom-fields" className="p-6">
          <CustomFieldsTab programId={program.id} />
        </TabsContent>

        <TabsContent value="checklist" className="p-6">
          <DocumentChecklistTab programId={program.id} />
        </TabsContent>

        <TabsContent value="workflow" className="p-6">
          <ManageWorkflowTab programId={program.id} />
        </TabsContent>

        <TabsContent value="ops-dashboard" className="p-6">
          <OpsDashboardTab programId={program.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
