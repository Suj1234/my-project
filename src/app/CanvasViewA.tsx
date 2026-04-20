import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Save, Settings2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { BlockLibrary } from './components/BlockLibrary';
import { JourneyCanvasA } from './components/JourneyCanvasA';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { AddBlockDialog } from './components/AddBlockDialog';
import { JourneySettingsPanel } from './components/JourneySettingsPanel';
import { BlockData, JourneySettings, DEFAULT_JOURNEY_SETTINGS } from './types/journey';
import type { WorkflowVersion } from './types/workflow';
import { SMART_BLOCKS } from './data/blockDefinitions';
import { Connection } from '@xyflow/react';
import { workflowsApi } from './services/mockApi';

const DEFAULT_BLOCKS: BlockData[] = [
  {
    id: 'start-1',
    type: 'start',
    name: 'Journey Start',
    description: 'Entry point of the journey',
    configured: true,
    entrySource: 'web',
    authMethod: 'otp',
    collectConsent: false,
    pages: [
      { id: 'start-welcome', name: 'Welcome Screen', action: 'Applicant views welcome screen', userInputs: [], isConfigured: false },
      { id: 'start-consent', name: 'Consent Screen', action: 'Applicant provides consent', userInputs: [], isConfigured: false },
    ],
  },
];

export default function CanvasViewA() {
  const { workflowId, versionId } = useParams<{ workflowId?: string; versionId?: string }>();
  const navigate = useNavigate();
  const isWorkflowMode = !!(workflowId && versionId);

  const [blocks, setBlocks] = useState<BlockData[]>(DEFAULT_BLOCKS);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [journeySettingsOpen, setJourneySettingsOpen] = useState(false);
  const [journeySettings, setJourneySettings] = useState<JourneySettings>(DEFAULT_JOURNEY_SETTINGS);
  const [addBlockDialogOpen, setAddBlockDialogOpen] = useState(false);
  const [addBlockAfterNodeId, setAddBlockAfterNodeId] = useState<string | null>(null);
  const [loadingCanvas, setLoadingCanvas] = useState(isWorkflowMode);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [workflowName, setWorkflowName] = useState('');
  const [, setVersionLabel] = useState('');
  const [allVersions, setAllVersions] = useState<WorkflowVersion[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isWorkflowMode) return;
    setLoadingCanvas(true);
    workflowsApi.get(workflowId!).then((w) => {
      setWorkflowName(w.workflow_name);
      setAllVersions(w.versions);
      const version = w.versions.find((v) => v.id === versionId);
      if (version) {
        setVersionLabel(version.version);
        setBlocks(version.canvas_blocks.length > 0 ? version.canvas_blocks : DEFAULT_BLOCKS);
      }
    }).catch(console.error).finally(() => setLoadingCanvas(false));
  }, [workflowId, versionId, isWorkflowMode]);

  const autoSave = useCallback((updatedBlocks: BlockData[]) => {
    if (!isWorkflowMode) return;
    setSaveStatus('unsaved');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await workflowsApi.saveCanvasBlocks(workflowId!, versionId!, updatedBlocks);
        setSaveStatus('saved');
      } catch (err) {
        console.error('Auto-save failed', err);
        setSaveStatus('unsaved');
      }
    }, 1500);
  }, [isWorkflowMode, workflowId, versionId]);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  const handleBlockSelect = useCallback((blockType: string, blockTypeId?: string) => {
    const newBlockId = `${blockType}-${Date.now()}`;
    let newBlock: BlockData;

    if (blockType === 'smart' && blockTypeId) {
      const smartBlockDef = SMART_BLOCKS.find((b) => b.id === blockTypeId);
      if (!smartBlockDef) return;
      newBlock = {
        id: newBlockId,
        type: 'smart',
        blockTypeId: smartBlockDef.id,
        hasRetry: smartBlockDef.hasRetry,
        category: smartBlockDef.category,
        name: smartBlockDef.name,
        description: smartBlockDef.description,
        configured: false,
        provider: smartBlockDef.provider,
        checks: smartBlockDef.checks ? JSON.parse(JSON.stringify(smartBlockDef.checks)) : [],
        generalConfig: smartBlockDef.generalConfig ? JSON.parse(JSON.stringify(smartBlockDef.generalConfig)) : [],
        pages: smartBlockDef.pages ? JSON.parse(JSON.stringify(smartBlockDef.pages)) : [],
        retryConfig: smartBlockDef.retryConfig
          ? JSON.parse(JSON.stringify(smartBlockDef.retryConfig))
          : smartBlockDef.hasRetry
          ? { maxAttempts: 3, coolingPeriod: 120, velocityCycle: 3 }
          : undefined,
      };
    } else if (blockType === 'form') {
      newBlock = {
        id: newBlockId,
        type: 'form',
        name: 'Custom Form',
        description: 'User-defined input collection',
        configured: false,
        formFields: [],
        pages: [{ id: 'form-page', name: 'Form Page', action: 'Form submitted', userInputs: [] }],
      };
    } else if (blockType === 'router') {
      newBlock = {
        id: newBlockId,
        type: 'router',
        name: 'Conditional Router',
        description: 'Branch based on conditions',
        configured: false,
        routings: [],
        defaultRoute: '',
      };
    } else if (blockType === 'merge') {
      newBlock = {
        id: newBlockId,
        type: 'merge',
        name: 'Merge Block',
        description: 'Merge multiple branches into a single flow',
        configured: false,
      };
    } else if (blockType === 'decision') {
      newBlock = {
        id: newBlockId,
        type: 'decision',
        name: 'Decision Block',
        description: 'Evaluate rules to produce PASS / REJECT / FLAG verdict',
        configured: false,
        decisionConfig: { rules: [], defaultVerdict: 'PASS' },
      };
    } else if (blockType === 'end') {
      newBlock = {
        id: newBlockId,
        type: 'end',
        name: 'Journey End',
        description: 'Journey terminus',
        configured: false,
        pages: [{ id: 'outcome-page', name: 'Outcome Screen', action: 'Journey completed', userInputs: [] }],
      };
    } else {
      return;
    }

    setBlocks((prev) => {
      const updated = [...prev, newBlock];
      autoSave(updated);
      return updated;
    });
    setSelectedBlockId(newBlockId);
  }, [autoSave]);

  const handleBlockUpdate = useCallback((updatedBlock: BlockData) => {
    setBlocks((prev) => {
      const updated = prev.map((b) => (b.id === updatedBlock.id ? updatedBlock : b));
      autoSave(updated);
      return updated;
    });
  }, [autoSave]);

  const handleBlockDelete = useCallback((blockId: string) => {
    setBlocks((prev) => {
      const updated = prev.filter((b) => b.id !== blockId);
      autoSave(updated);
      return updated;
    });
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  }, [selectedBlockId, autoSave]);

  const handleAddBlockAfter = useCallback((sourceBlockId: string) => {
    setAddBlockAfterNodeId(sourceBlockId);
    setAddBlockDialogOpen(true);
  }, []);

  const handleDialogSelect = useCallback((blockType: string, blockTypeId?: string) => {
    handleBlockSelect(blockType, blockTypeId);
    setAddBlockDialogOpen(false);
    setAddBlockAfterNodeId(null);
  }, [handleBlockSelect]);

  const handleConnect = useCallback((connection: Connection) => {
    console.log('Connection created:', connection);
  }, []);

  const handleClosePanel = useCallback(() => setSelectedBlockId(null), []);

  const handleSave = useCallback((block: BlockData) => {
    setBlocks((prev) => {
      const updated = prev.map((b) => (b.id === block.id ? { ...block, configured: true } : b));
      autoSave(updated);
      return updated;
    });
  }, [autoSave]);

  const handleNodeSelect = useCallback((blockId: string | null) => {
    setSelectedBlockId(blockId);
    if (blockId) setJourneySettingsOpen(false);
  }, []);

  const handleSettingsToggle = useCallback(() => {
    setJourneySettingsOpen((prev) => !prev);
    setSelectedBlockId(null);
  }, []);

  const handleExport = useCallback(() => {
    const data = JSON.stringify({ blocks, journeySettings }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journey-${workflowName || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [blocks, journeySettings, workflowName]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string);
          if (parsed.blocks) setBlocks(parsed.blocks);
          if (parsed.journeySettings) setJourneySettings(parsed.journeySettings);
        } catch { console.error('Invalid JSON'); }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  if (loadingCanvas) {
    return <div className="h-full flex items-center justify-center text-gray-500">Loading canvas...</div>;
  }

  const showRightPanel = !!selectedBlock || journeySettingsOpen;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          {isWorkflowMode && (
            <>
              <button
                onClick={() => navigate(`/manage-programs/workflows/${workflowId}`)}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={15} className="mr-1" />Back
              </button>
              <span className="text-gray-300">|</span>
              <span className="text-sm font-medium text-gray-800">{workflowName || 'Untitled Journey'}</span>
            </>
          )}
          {!isWorkflowMode && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Canvas A</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 tracking-wide">
                Pill / Stadium
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="text-xs text-gray-400 flex items-center gap-1"><Save size={11} className="animate-pulse" />Saving...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-green-600 flex items-center gap-1"><Save size={11} />Saved</span>
          )}
          {saveStatus === 'unsaved' && (
            <span className="text-xs text-orange-500 flex items-center gap-1"><Save size={11} />Unsaved</span>
          )}

          <button
            onClick={handleSettingsToggle}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border font-medium transition-all ${
              journeySettingsOpen
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            <Settings2 size={13} />
            Settings
          </button>

          <div className="w-px h-5 bg-gray-200" />

          <button
            onClick={() => {
              if (selectedBlock) handleSave(selectedBlock);
              setSaveStatus('saved');
            }}
            className="text-xs px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            Save
          </button>

          <Select value={versionId ?? 'v1'} onValueChange={() => {}}>
            <SelectTrigger className="h-7 text-xs font-mono bg-blue-50 border-blue-200 text-blue-700 w-auto min-w-[72px] px-2 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allVersions.length > 0 ? (
                allVersions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{v.version}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        v.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {v.status}
                      </span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="v1">
                  <span className="font-mono text-xs">v1</span>
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          <button
            className="text-xs px-3 py-1.5 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-700 transition-all shadow-sm"
            onClick={() => alert('Publish flow coming soon!')}
          >
            Publish
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <BlockLibrary onBlockSelect={handleBlockSelect} />
        <JourneyCanvasA
          blocks={blocks}
          selectedBlockId={selectedBlockId}
          onBlockSelect={handleNodeSelect}
          onBlockUpdate={handleBlockUpdate}
          onBlockDelete={handleBlockDelete}
          onAddBlockAfter={handleAddBlockAfter}
          onConnect={handleConnect}
        />

        {selectedBlock && !journeySettingsOpen && (
          <ConfigurationPanel
            block={selectedBlock}
            allBlocks={blocks}
            onClose={handleClosePanel}
            onSave={handleSave}
            onDelete={handleBlockDelete}
          />
        )}
        {journeySettingsOpen && !selectedBlock && (
          <JourneySettingsPanel
            settings={journeySettings}
            onChange={setJourneySettings}
            onClose={() => setJourneySettingsOpen(false)}
            onExport={handleExport}
            onImport={handleImport}
          />
        )}
        {!showRightPanel && (
          <div className="w-[420px] bg-white border-l border-gray-200 flex items-center justify-center text-gray-400 flex-col gap-2">
            <Settings2 className="h-8 w-8 opacity-20" />
            <p className="text-sm">Select a block to configure</p>
            <p className="text-xs opacity-60">or click Settings to configure the journey</p>
          </div>
        )}

        <AddBlockDialog
          open={addBlockDialogOpen}
          onClose={() => { setAddBlockDialogOpen(false); setAddBlockAfterNodeId(null); }}
          onSelect={handleDialogSelect}
        />
      </div>
    </div>
  );
}
