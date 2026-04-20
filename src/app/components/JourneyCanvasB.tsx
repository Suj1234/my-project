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
import { StartNodeB } from './nodes/StartNodeB';
import { SmartBlockNode } from './nodes/SmartBlockNode';
import { FormBlockNode } from './nodes/FormBlockNode';
import { EndNodeB } from './nodes/EndNodeB';
import { RouterNode } from './nodes/RouterNode';
import { MergeNode } from './nodes/MergeNode';
import { DecisionNode } from './nodes/DecisionNode';
import { FlowNodeData, BlockData } from '../types/journey';

const nodeTypes = {
  start: StartNodeB,
  smart: SmartBlockNode,
  form: FormBlockNode,
  end: EndNodeB,
  router: RouterNode,
  merge: MergeNode,
  decision: DecisionNode,
};

interface JourneyCanvasBProps {
  blocks: BlockData[];
  selectedBlockId: string | null;
  onBlockSelect: (blockId: string | null) => void;
  onBlockUpdate: (block: BlockData) => void;
  onBlockDelete: (blockId: string) => void;
  onAddBlockAfter: (sourceBlockId: string) => void;
  onConnect: (connection: Connection) => void;
}

function CanvasBInner({
  blocks,
  selectedBlockId,
  onBlockSelect,
  onBlockUpdate,
  onBlockDelete,
  onAddBlockAfter,
  onConnect,
}: JourneyCanvasBProps) {

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

export function JourneyCanvasB(props: JourneyCanvasBProps) {
  return (
    <ReactFlowProvider>
      <CanvasBInner {...props} />
    </ReactFlowProvider>
  );
}
