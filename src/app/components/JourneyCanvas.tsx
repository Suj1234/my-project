import { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
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
            sourceHandle: `route-${routing.id}`,
            target: routing.targetBlockId,
            type: 'smoothstep',
            label: routing.label || undefined,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#f97316' },
            style: { stroke: '#f97316', strokeWidth: 2 },
            labelStyle: { fill: '#9a3412', fontSize: 10, fontWeight: 600 },
            labelBgStyle: { fill: '#fff7ed', fillOpacity: 0.9 },
          });
        });
        if (block.defaultRoute) {
          edges.push({
            id: `${block.id}-default-route`,
            source: block.id,
            sourceHandle: 'default-route',
            target: block.defaultRoute,
            type: 'smoothstep',
            label: 'Default',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
            style: { stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '4 2' },
            labelStyle: { fill: '#64748b', fontSize: 10 },
            labelBgStyle: { fill: '#f8fafc', fillOpacity: 0.9 },
          });
        }
        return;
      }
      if (block.type === 'decision') {
        const verdictRoutes = block.decisionConfig?.verdictRoutes ?? {};
        const hasAnyRoute = Object.values(verdictRoutes).some(Boolean);
        if (hasAnyRoute) {
          const VERDICT_COLORS: Record<string, string> = {
            PASS: '#16a34a', REJECT: '#dc2626', FLAG: '#ea580c', MANUAL_REVIEW: '#6b7280',
          };
          Object.entries(verdictRoutes).forEach(([verdict, targetBlockId]) => {
            if (!targetBlockId) return;
            edges.push({
              id: `${block.id}-verdict-${verdict}`,
              source: block.id,
              sourceHandle: `verdict-${verdict}`,
              target: targetBlockId,
              type: 'smoothstep',
              label: verdict.replace('_', ' '),
              markerEnd: { type: MarkerType.ArrowClosed, color: VERDICT_COLORS[verdict] ?? '#64748b' },
              style: { stroke: VERDICT_COLORS[verdict] ?? '#64748b', strokeWidth: 2 },
              labelStyle: { fill: VERDICT_COLORS[verdict] ?? '#64748b', fontSize: 10, fontWeight: 600 },
              labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
            });
          });
          return;
        }
        // fall through to default sequential edge if no verdict routes configured
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

  return (
    <div className="flex-1 bg-white relative">
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
        panOnDrag={true}
        selectionOnDrag={false}
        multiSelectionKeyCode="Shift"
      >
        <Background variant={BackgroundVariant.Dots} color="#d1d5db" gap={24} size={1.5} />
        <Controls showInteractive={false} />
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
