import { useState } from 'react';
import { Sidebar, AppView } from './components/shell/Sidebar';
import CanvasView from './CanvasView';
import { ManageProgramsPage } from './pages/ManageProgramsPage';
import { ApiIntegrationPage } from './pages/manage-actions/ApiIntegrationPage';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('manage-programs');

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentView === 'manage-programs' && (
          <ManageProgramsPage onOpenCanvas={() => setCurrentView('canvas')} />
        )}
        {currentView === 'canvas' && <CanvasView />}
        {currentView === 'api-integration' && <ApiIntegrationPage />}
      </div>
    </div>
  );
}
