import { useState, useCallback } from 'react';
import { BlockLibrary } from './components/BlockLibrary';
import { JourneyCanvas } from './components/JourneyCanvas';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { AddBlockDialog } from './components/AddBlockDialog';
import { BlockData } from './types/journey';
import { SMART_BLOCKS } from './data/blockDefinitions';
import { Connection } from '@xyflow/react';

export default function App() {
  const [blocks, setBlocks] = useState<BlockData[]>([
    {
      id: 'start-1',
      type: 'start',
      name: 'Start',
      description: 'Journey start point',
      configured: true,
    },
  ]);

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [addBlockDialogOpen, setAddBlockDialogOpen] = useState(false);
  const [addBlockAfterNodeId, setAddBlockAfterNodeId] = useState<string | null>(null);

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
        generalConfig: smartBlockDef.generalConfig
          ? JSON.parse(JSON.stringify(smartBlockDef.generalConfig))
          : [],
        pages: smartBlockDef.pages ? JSON.parse(JSON.stringify(smartBlockDef.pages)) : [],
        retryConfig: smartBlockDef.retryConfig
          ? JSON.parse(JSON.stringify(smartBlockDef.retryConfig))
          : smartBlockDef.hasRetry
          ? {
              maxAttempts: 3,
              coolingPeriod: 120,
              velocityCycle: 3,
            }
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
        pages: [
          {
            id: 'form-page',
            name: 'Form Page',
            action: 'Form submitted',
            userInputs: [],
          },
        ],
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
        decisionConfig: {
          rules: [],
          defaultVerdict: 'PASS',
        },
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
        pages: [
          {
            id: 'completion-page',
            name: 'Completion Page',
            action: 'Journey completed',
            userInputs: [],
          },
        ],
      };
    } else {
      return;
    }

    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlockId);
  }, []);

  const handleBlockUpdate = useCallback((updatedBlock: BlockData) => {
    setBlocks((prev) => prev.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)));
  }, []);

  const handleBlockDelete = useCallback((blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  }, [selectedBlockId]);

  const handleAddBlockAfter = useCallback(
    (sourceBlockId: string) => {
      setAddBlockAfterNodeId(sourceBlockId);
      setAddBlockDialogOpen(true);
    },
    []
  );

  const handleDialogSelect = useCallback(
    (blockType: string, blockTypeId?: string) => {
      handleBlockSelect(blockType, blockTypeId);
      setAddBlockDialogOpen(false);
      setAddBlockAfterNodeId(null);
    },
    [handleBlockSelect]
  );

  const handleConnect = useCallback((connection: Connection) => {
    console.log('Connection created:', connection);
    // Handle edge creation
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedBlockId(null);
  }, []);

  const handleSave = useCallback((block: BlockData) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === block.id ? { ...block, configured: true } : b))
    );
  }, []);

  return (
    <div className="h-screen flex">
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
        onClose={() => {
          setAddBlockDialogOpen(false);
          setAddBlockAfterNodeId(null);
        }}
        onSelect={handleDialogSelect}
      />
    </div>
  );
}
