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
import { StartNodeC } from './nodes/StartNodeC';
import { SmartBlockNode } from './nodes/SmartBlockNode';
import { FormBlockNode } from './nodes/FormBlockNode';
import { EndNodeC } from './nodes/EndNodeC';
import { RouterNodeB } from './nodes/RouterNodeB';
import { MergeNode } from './nodes/MergeNode';
import { DecisionNode } from './nodes/DecisionNode';
import { StepBadgeNode } from './nodes/StepBadgeNode';
import { StepDefinition } from './StepAssignmentDialog';
import { FlowNodeData, BlockData } from '../types/journey';

const nodeTypes = {
  start: StartNodeC,
  smart: SmartBlockNode,
  form: FormBlockNode,
  end: EndNodeC,
  router: RouterNodeB,
  merge: MergeNode,
  decision: DecisionNode,
  stepbadge: StepBadgeNode,
};

const LOGIC_TYPES = new Set(['router', 'merge', 'decision']);
const BLOCK_X = 400;
const BLOCK_STEP = 280;
const LANE_WIDTH = 380; // horizontal spread per branch

function isVisibleToApplicant(block: BlockData): boolean {
  if (LOGIC_TYPES.has(block.type)) return false;
  if (block.visibleToApplicant === false) return false;
  return true;
}

interface JourneyCanvasCProps {
  blocks: BlockData[];
  selectedBlockId: string | null;
  onBlockSelect: (blockId: string | null) => void;
  onBlockUpdate: (block: BlockData) => void;
  onBlockDelete: (blockId: string) => void;
  onAddBlockAfter: (sourceBlockId: string) => void;
  onAddBlockFromBranch?: (routerBlockId: string, routingId: string) => void;
  onConnect: (connection: Connection) => void;
  steps: StepDefinition[];
}

function CanvasCInner({
  blocks,
  selectedBlockId,
  onBlockSelect,
  onBlockUpdate,
  onBlockDelete,
  onAddBlockAfter,
  onAddBlockFromBranch,
  onConnect,
  steps,
}: JourneyCanvasCProps) {

  const initialNodes: Node<FlowNodeData>[] = useMemo(() => {
    // Ignore legacy 'group' blocks — flat layout only
    const flatBlocks = blocks.filter((b) => b.type !== 'group');

    // Assign Y positions
    const positions: Record<string, number> = {};
    flatBlocks.forEach((block, idx) => {
      positions[block.id] = idx * BLOCK_STEP;
    });

    // Assign X lane offsets: branch targets of each router fan out horizontally.
    // Offsets propagate sequentially until a merge or another router (which reset to 0).
    const laneOffsets: Record<string, number> = {};

    // Phase 1 — direct branch targets get spread offsets centered on BLOCK_X
    flatBlocks.forEach((block) => {
      if (block.type !== 'router') return;
      const targets: string[] = [];
      (block.routings ?? []).forEach((r) => { if (r.targetBlockId) targets.push(r.targetBlockId); });
      if (block.defaultRoute) targets.push(block.defaultRoute);
      const n = targets.length;
      if (n === 0) return;
      targets.forEach((id, i) => {
        laneOffsets[id] = (i - (n - 1) / 2) * LANE_WIDTH;
      });
    });

    // Phase 2 — propagate lanes sequentially (skip merge/router which reset to center)
    flatBlocks.forEach((block, idx) => {
      if (block.type === 'merge' || block.type === 'router') {
        laneOffsets[block.id] = 0;
        return;
      }
      if (laneOffsets[block.id] !== undefined) return; // already assigned by Phase 1
      if (idx > 0) {
        const prev = flatBlocks[idx - 1];
        if (prev.type !== 'router' && laneOffsets[prev.id] !== undefined && laneOffsets[prev.id] !== 0) {
          laneOffsets[block.id] = laneOffsets[prev.id];
        }
      }
    });

    const nodes: Node<FlowNodeData>[] = [];

    // ── Block nodes ────────────────────────────────────────────────────────────
    const subStepCounters: Record<string, number> = {};

    flatBlocks.forEach((block, idx) => {
      const y = positions[block.id];
      const x = BLOCK_X + (laneOffsets[block.id] ?? 0);

      nodes.push({
        id: block.id,
        type: block.type,
        position: { x, y },
        zIndex: 1,
        data: {
          ...block,
          onAddBlock: (nodeId: string) => { onAddBlockAfter(nodeId); },
          onConfigure: (nodeId: string) => { onBlockSelect(nodeId); },
          onDelete: (nodeId: string) => { onBlockDelete(nodeId); },
          onAddBlockFromBranch: onAddBlockFromBranch
            ? (routerBlockId: string, routingId: string) => { onAddBlockFromBranch(routerBlockId, routingId); }
            : undefined,
        } as FlowNodeData,
      });

      // Sub-step chip — assigned blocks get a two-part label chip; unassigned get an amber warning
      if (isVisibleToApplicant(block) && block.type !== 'start' && block.type !== 'end') {
        if (block.stepId) {
          const step = steps.find((s) => s.id === block.stepId);
          if (step) {
            const stepIdx = steps.findIndex((s) => s.id === step.id) + 1;
            subStepCounters[step.id] = (subStepCounters[step.id] ?? 0) + 1;
            const subIdx = subStepCounters[step.id];
            const chipLabel = `${stepIdx}.${subIdx}  ${block.subStepLabel || block.name}`;

            nodes.push({
              id: `__chip__${block.id}`,
              type: 'stepbadge',
              position: { x: x + 8, y: y - 28 },
              zIndex: 10,
              selectable: false,
              draggable: false,
              data: {
                id: `__chip__${block.id}`,
                type: 'smart' as any,
                name: '',
                description: '',
                configured: true,
                stepLabel: chipLabel,
                stepName: step.name,
              } as any,
            });
          }
        } else {
          nodes.push({
            id: `__chip__${block.id}`,
            type: 'stepbadge',
            position: { x: x + 8, y: y - 28 },
            zIndex: 10,
            selectable: false,
            draggable: false,
            data: {
              id: `__chip__${block.id}`,
              type: 'smart' as any,
              name: '',
              description: '',
              configured: true,
              unassigned: true,
            } as any,
          });
        }
      }
    });

    return nodes;
  }, [blocks, steps, onBlockSelect, onBlockDelete, onAddBlockAfter]);

  const initialEdges: Edge[] = useMemo(() => {
    const flatBlocks = blocks.filter((b) => b.type !== 'group');
    const edges: Edge[] = [];

    // All blocks that are direct targets of a router branch or default route.
    // Sequential edges must never point INTO these blocks — the router provides those edges.
    const routerTargetIds = new Set<string>();
    flatBlocks.forEach((b) => {
      if (b.type !== 'router') return;
      (b.routings ?? []).forEach((r) => { if (r.targetBlockId) routerTargetIds.add(r.targetBlockId); });
      if (b.defaultRoute) routerTargetIds.add(b.defaultRoute);
    });

    flatBlocks.forEach((block, index) => {
      if (block.type === 'router') {
        // Draw an edge for every routing that has a target (regardless of saved state).
        // sourceHandle must match the handle ID on RouterNodeB so ReactFlow routes from the correct position.
        (block.routings || []).forEach((routing) => {
          if (!routing.targetBlockId) return;
          edges.push({
            id: `${block.id}-${routing.id}`,
            source: block.id,
            sourceHandle: `route-${routing.id}`,
            target: routing.targetBlockId,
            type: 'smoothstep',
            label: routing.label,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
            style: { stroke: '#64748b', strokeWidth: 2 },
            labelStyle: { fill: '#64748b', fontSize: 10 },
          });
        });
        if (block.defaultRoute) {
          edges.push({
            id: `${block.id}-default`,
            source: block.id,
            sourceHandle: 'default-route',
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

      if (index < flatBlocks.length - 1) {
        const next = flatBlocks[index + 1];
        // Skip sequential edge if the next block is a router's direct branch/default target.
        // The router already provides that edge; a sequential one would be spurious.
        if (routerTargetIds.has(next.id)) return;
        edges.push({
          id: `${block.id}-${next.id}`,
          source: block.id,
          target: next.id,
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

  const onNodeClick = useCallback((_: any, node: Node) => {
    if (node.id.startsWith('__band__') || node.id.startsWith('__chip__')) return;
    onBlockSelect(node.id);
  }, [onBlockSelect]);

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
        minZoom={0.3}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
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

export function JourneyCanvasC(props: JourneyCanvasCProps) {
  return (
    <ReactFlowProvider>
      <CanvasCInner {...props} />
    </ReactFlowProvider>
  );
}
