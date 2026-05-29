import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'sonner';
import { Layout } from './components/shell/Layout';

// Manage Program
import { ManageProgramList }   from './pages/manage-program/ManageProgramList';
import { ManageProgramView }   from './pages/manage-program/ManageProgramView';
import { PageDetailsView }     from './pages/manage-program/PageDetailsView';

// Manage Workflow (accessed as tab in ManageProgramView; detail + canvas are standalone routes)
import { ManageWorkflowDetail } from './pages/manage-workflow/ManageWorkflowDetail';

// Manage Actions
import CanvasView                from './CanvasView';
import CanvasViewA               from './CanvasViewA';
import CanvasViewB               from './CanvasViewB';
import CanvasViewC               from './CanvasViewC';
import { ApiIntegrationsPage }   from './pages/manage-actions/ApiIntegrationsPage';
import { ApiIntegrationsPageV1 } from './pages/manage-actions/ApiIntegrationsPageV1';

// Required Documents
import { RequiredDocumentList } from './pages/required-documents/RequiredDocumentList';
import { RequiredDocumentForm } from './pages/required-documents/RequiredDocumentForm';
import { RequiredDocumentView } from './pages/required-documents/RequiredDocumentView';

// Field Management
import { FieldManagementList } from './pages/field-management/FieldManagementList';

// Ops Dashboard
import { OpsDashboardPage }   from './pages/ops-dashboard/OpsDashboardPage';
import { ApplicationViewPage } from './pages/ops-dashboard/ApplicationViewPage';

// Application Management
import { ApplicationManagementPage } from './pages/application-management/ApplicationManagementPage';

// Master Management
import { MasterManagementList } from './pages/master-management/MasterManagementList';
import { MasterManagementView } from './pages/master-management/MasterManagementView';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-right" richColors />
      <Routes>
        <Route element={<Layout />}>
          {/* Default */}
          <Route index element={<Navigate to="/manage-programs" replace />} />

          {/* Manage Programs */}
          <Route path="manage-programs" element={<ManageProgramList />} />
          <Route path="manage-programs/:id/view" element={<ManageProgramView />} />
          <Route path="manage-programs/:programId/pages/:pageId/view" element={<PageDetailsView />} />

          {/* Manage Workflow — list is a tab inside ManageProgramView */}
          <Route path="manage-programs/workflows/:id" element={<ManageWorkflowDetail />} />
          <Route path="manage-programs/workflows/:workflowId/versions/:versionId/canvas" element={<CanvasView />} />
          <Route path="manage-programs/workflows/:workflowId/versions/:versionId/canvas-a" element={<CanvasViewA />} />
          <Route path="manage-programs/workflows/:workflowId/versions/:versionId/canvas-b" element={<CanvasViewB />} />
          <Route path="manage-programs/workflows/:workflowId/versions/:versionId/canvas-c" element={<CanvasViewC />} />

          {/* Manage Actions */}
          <Route path="manage-actions/canvas" element={<CanvasView />} />
          <Route path="manage-actions/canvas-a" element={<CanvasViewA />} />
          <Route path="manage-actions/canvas-b" element={<CanvasViewB />} />
          <Route path="manage-actions/canvas-c" element={<CanvasViewC />} />
          <Route path="manage-actions/api-integrations" element={<ApiIntegrationsPage />} />
          <Route path="manage-actions/api-integrations-v1" element={<ApiIntegrationsPageV1 />} />

          {/* Required Documents */}
          <Route path="required-documents" element={<RequiredDocumentList />} />
          <Route path="required-documents/new" element={<RequiredDocumentForm />} />
          <Route path="required-documents/:id/edit" element={<RequiredDocumentForm />} />
          <Route path="required-documents/:id/view" element={<RequiredDocumentView />} />

          {/* Field Management */}
          <Route path="field-management" element={<FieldManagementList />} />

          {/* Ops Dashboard */}
          <Route path="ops-dashboard" element={<OpsDashboardPage />} />
          <Route path="ops-dashboard/:appId/view" element={<ApplicationViewPage />} />

          {/* Master Management */}
          <Route path="master-management" element={<MasterManagementList />} />
          <Route path="master-management/:id/view" element={<MasterManagementView />} />

          {/* Application Management */}
          <Route path="application-management" element={<ApplicationManagementPage />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/manage-programs" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
