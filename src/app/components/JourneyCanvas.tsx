import { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { StartNode } from './nodes/StartNode';
import { SmartBlockNode } from './nodes/SmartBlockNode';
import { FormBlockNode } from './nodes/FormBlockNode';
import { EndNode } from './nodes/EndNode';
import { RouterNode } from './nodes/RouterNode';
import { FlowNodeData, BlockData } from '../types/journey';

// Define nodeTypes outside component to prevent recreation on every render
const nodeTypes = {
  start: StartNode,
  smart: SmartBlockNode,
  form: FormBlockNode,
  end: EndNode,
  router: RouterNode,
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

export function JourneyCanvas({
  blocks,
  selectedBlockId,
  onBlockSelect,
  onBlockUpdate,
  onBlockDelete,
  onAddBlockAfter,
  onConnect,
}: JourneyCanvasProps) {
  // Convert blocks to React Flow nodes
  const initialNodes: Node<FlowNodeData>[] = useMemo(() => {
    return blocks.map((block, index) => ({
      id: block.id,
      type: block.type,
      position: { x: 400, y: index * 250 },
      data: {
        ...block,
        onAddBlock: (nodeId: string) => {
          onAddBlockAfter(nodeId); // This will open the dialog
        },
        onConfigure: (nodeId: string) => {
          onBlockSelect(nodeId);
        },
        onDelete: (nodeId: string) => {
          onBlockDelete(nodeId);
        },
      },
    }));
  }, [blocks, onBlockSelect, onBlockDelete, onAddBlockAfter]);

  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    blocks.forEach((block, index) => {
      if (index < blocks.length - 1) {
        edges.push({
          id: `${block.id}-${blocks[index + 1].id}`,
          source: block.id,
          target: blocks[index + 1].id,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#64748b',
          },
          style: {
            stroke: '#64748b',
            strokeWidth: 2,
          },
        });
      }
    });
    return edges;
  }, [blocks]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when blocks change
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Update edges when blocks change
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onConnectHandler = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'smoothstep',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#64748b',
            },
            style: {
              stroke: '#64748b',
              strokeWidth: 2,
            },
          },
          eds
        )
      );
      onConnect(connection);
    },
    [setEdges, onConnect]
  );

  const onNodeClick = useCallback(
    (_: any, node: Node) => {
      onBlockSelect(node.id);
    },
    [onBlockSelect]
  );

  const onPaneClick = useCallback(() => {
    onBlockSelect(null);
  }, [onBlockSelect]);

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
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}