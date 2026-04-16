import { useCallback, useMemo, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { StartNode } from './nodes/StartNode';
import { SmartBlockNode } from './nodes/SmartBlockNode';
import { FormBlockNode } from './nodes/FormBlockNode';
import { EndNode } from './nodes/EndNode';
import { RouterNode } from './nodes/RouterNode';
import { MergeNode } from './nodes/MergeNode';
import { DecisionNode } from './nodes/DecisionNode';
import { FlowNodeData, BlockData } from '../types/journey';
import { MousePointer2, Hand, Undo2, Redo2 } from 'lucide-react';

const nodeTypes = {
  start: StartNode,
  smart: SmartBlockNode,
  form: FormBlockNode,
  end: EndNode,
  router: RouterNode,
  merge: MergeNode,
  decision: DecisionNode,
};

interface JourneyCanvasProps {
  blocks: BlockData[];
  selectedBlockId: string | null;
  onBlockSelect: (blockId: string | null) => void;
  onBlockUpdate: (block: BlockData) => void;
  onBlockDelete: (blockId: string) => void;
  onAddBlockAfter: (sourceBlockId: string) => void;
  onConnect: (connection: Connection) => void;
}

function CanvasInner({
  blocks,
  selectedBlockId,
  onBlockSelect,
  onBlockUpdate,
  onBlockDelete,
  onAddBlockAfter,
  onConnect,
}: JourneyCanvasProps) {
  const { undo, redo } = useReactFlow() as any;
  const [cursorMode, setCursorMode] = useState<'select' | 'pan'>('select');

  const initialNodes: Node<FlowNodeData>[] = useMemo(() => {
    return blocks.map((block, index) => ({
      id: block.id,
      type: block.type,
      position: { x: 400, y: index * 280 },
      data: {
        ...block,
        onAddBlock: (nodeId: string) => { onAddBlockAfter(nodeId); },
        onConfigure: (nodeId: string) => { onBlockSelect(nodeId); },
        onDelete: (nodeId: string) => { onBlockDelete(nodeId); },
      },
    }));
  }, [blocks, onBlockSelect, onBlockDelete, onAddBlockAfter]);

  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    blocks.forEach((block, index) => {
      if (block.type === 'router') {
        (block.routings || []).forEach((routing) => {
          if (!routing.saved || !routing.targetBlockId) return;
          edges.push({
            id: `${block.id}-${routing.id}`,
            source: block.id,
            target: routing.targetBlockId,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
            style: { stroke: '#64748b', strokeWidth: 2 },
          });
        });
        if (block.defaultRoute) {
          edges.push({
            id: `${block.id}-default-route`,
            source: block.id,
            target: block.defaultRoute,
            type: 'smoothstep',
            label: 'Default',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
            style: { stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '4 2' },
            labelStyle: { fill: '#64748b', fontSize: 10 },
          });
        }
        return;
      }
      if (index < blocks.length - 1) {
        edges.push({
          id: `${block.id}-${blocks[index + 1].id}`,
          source: block.id,
          target: blocks[index + 1].id,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
          style: { stroke: '#64748b', strokeWidth: 2 },
        });
      }
    });
    return edges;
  }, [blocks]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  useEffect(() => { setNodes(initialNodes); }, [initialNodes, setNodes]);
  useEffect(() => { setEdges(initialEdges); }, [initialEdges, setEdges]);

  const onConnectHandler = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({
      ...connection,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
      style: { stroke: '#64748b', strokeWidth: 2 },
    }, eds));
    onConnect(connection);
  }, [setEdges, onConnect]);

  const onNodeClick = useCallback((_: any, node: Node) => { onBlockSelect(node.id); }, [onBlockSelect]);
  const onPaneClick = useCallback(() => { onBlockSelect(null); }, [onBlockSelect]);

  const handleUndo = useCallback(() => {
    if (historyIdx > 0) {
      const prev = history[historyIdx - 1];
      setNodes(prev.nodes);
      setEdges(prev.edges);
      setHistoryIdx(h => h - 1);
    }
  }, [history, historyIdx, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      const next = history[historyIdx + 1];
      setNodes(next.nodes);
      setEdges(next.edges);
      setHistoryIdx(h => h + 1);
    }
  }, [history, historyIdx, setNodes, setEdges]);

  return (
    <div className="flex-1 bg-gray-50 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnectHandler}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.4}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        panOnDrag={cursorMode === 'pan'}
        selectionOnDrag={cursorMode === 'select'}
      >
        <Background color="#e2e8f0" gap={20} size={1} />

        {/* ── Bottom Bar ── */}
        <Panel position="bottom-center">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl shadow-lg px-2 py-1.5 mb-3">
            {/* Select */}
            <button
              title="Select (V)"
              onClick={() => setCursorMode('select')}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                cursorMode === 'select' ? 'bg-slate-800 text-white shadow-inner' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <MousePointer2 className="h-4 w-4" />
            </button>
            {/* Pan */}
            <button
              title="Pan (H)"
              onClick={() => setCursorMode('pan')}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                cursorMode === 'pan' ? 'bg-slate-800 text-white shadow-inner' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Hand className="h-4 w-4" />
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Undo */}
            <button
              title="Undo (Ctrl+Z)"
              onClick={handleUndo}
              disabled={historyIdx <= 0}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-all"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            {/* Redo */}
            <button
              title="Redo (Ctrl+Y)"
              onClick={handleRedo}
              disabled={historyIdx >= history.length - 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-all"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function JourneyCanvas(props: JourneyCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
