import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Save } from 'lucide-react';
import { BlockLibrary } from './components/BlockLibrary';
import { JourneyCanvas } from './components/JourneyCanvas';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { AddBlockDialog } from './components/AddBlockDialog';
import { BlockData } from './types/journey';
import { SMART_BLOCKS } from './data/blockDefinitions';
import { Connection } from '@xyflow/react';
import { workflowsApi } from './services/mockApi';

const DEFAULT_BLOCKS: BlockData[] = [
  {
    id: 'start-1',
    type: 'start',
    name: 'Start',
    description: 'Journey start point',
    configured: true,
  },
];

export default function CanvasView() {
  const { workflowId, versionId } = useParams<{ workflowId?: string; versionId?: string }>();
  const navigate = useNavigate();
  const isWorkflowMode = !!(workflowId && versionId);

  const [blocks, setBlocks] = useState<BlockData[]>(DEFAULT_BLOCKS);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [addBlockDialogOpen, setAddBlockDialogOpen] = useState(false);
  const [addBlockAfterNodeId, setAddBlockAfterNodeId] = useState<string | null>(null);
  const [loadingCanvas, setLoadingCanvas] = useState(isWorkflowMode);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [workflowName, setWorkflowName] = useState('');
  const [versionLabel, setVersionLabel] = useState('');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load canvas blocks when in workflow mode
  useEffect(() => {
    if (!isWorkflowMode) return;
    setLoadingCanvas(true);
    workflowsApi.get(workflowId!).then((w) => {
      setWorkflowName(w.workflow_name);
      const version = w.versions.find((v) => v.id === versionId);
      if (version) {
        setVersionLabel(version.version);
        setBlocks(version.canvas_blocks.length > 0 ? version.canvas_blocks : DEFAULT_BLOCKS);
      }
    }).catch(console.error).finally(() => setLoadingCanvas(false));
  }, [workflowId, versionId, isWorkflowMode]);

  // Auto-save blocks when in workflow mode
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
        name: 'Journey Completed',
        description: 'Success end point',
        configured: false,
        endType: 'success',
        completionMessage: 'Your journey has been completed successfully.',
        pages: [{ id: 'completion-page', name: 'Completion Page', action: 'Journey completed', userInputs: [] }],
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

  if (loadingCanvas) {
    return <div className="h-full flex items-center justify-center text-gray-500">Loading canvas...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Canvas toolbar — only shown in workflow mode */}
      {isWorkflowMode && (
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/manage-programs/workflows/${workflowId}`)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={15} className="mr-1" />Back
            </button>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-medium text-gray-800">{workflowName}</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono">{versionLabel}</span>
          </div>
          <div className="flex items-center space-x-2">
            {saveStatus === 'saving' && (
              <span className="text-xs text-gray-500 flex items-center"><Save size={12} className="mr-1 animate-pulse" />Saving...</span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-green-600 flex items-center"><Save size={12} className="mr-1" />Saved</span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="text-xs text-orange-500 flex items-center"><Save size={12} className="mr-1" />Unsaved changes</span>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <BlockLibrary onBlockSelect={handleBlockSelect} />
        <JourneyCanvas
          blocks={blocks}
          selectedBlockId={selectedBlockId}
          onBlockSelect={setSelectedBlockId}
          onBlockUpdate={handleBlockUpdate}
          onBlockDelete={handleBlockDelete}
          onAddBlockAfter={handleAddBlockAfter}
          onConnect={handleConnect}
        />
        <ConfigurationPanel
          block={selectedBlock}
          allBlocks={blocks}
          onClose={handleClosePanel}
          onSave={handleSave}
          onDelete={handleBlockDelete}
        />
        <AddBlockDialog
          open={addBlockDialogOpen}
          onClose={() => { setAddBlockDialogOpen(false); setAddBlockAfterNodeId(null); }}
          onSelect={handleDialogSelect}
        />
      </div>
    </div>
  );
}
