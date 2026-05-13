/**
 * Canvas C — IF → THEN Strip Cards
 * All branches visible at once as compact horizontal strips.
 * Each strip: IF [condition summary] THEN [Route To dropdown] [expand ▾] [delete]
 * Expanding a strip reveals the full condition builder inline.
 * Default route: pinned last strip, always visible.
 */
import { useState } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { BlockData, RoutingConfig, ConditionGroup } from '../types/journey';
import { RouterConditionBuilder } from './routing/RouterConditionBuilder';
import {
  getRouterFields, getPreviousBlockActions, makeEmptyRouting, getConditionSummary,
} from './routing/routerShared';

interface RouterPanelCProps {
  block: BlockData;
  allBlocks: BlockData[];
  onClose: () => void;
  onSave: (block: BlockData) => void;
  onDelete: (blockId: string) => void;
}

export function RouterPanelC({ block, allBlocks, onClose, onSave, onDelete }: RouterPanelCProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const routerFields = getRouterFields(allBlocks, block.id);
  const prevBlockActions = getPreviousBlockActions(allBlocks, block.id);
  const routings = block.routings ?? [];

  const update = (field: string, value: unknown) => onSave({ ...block, [field]: value });
  const updateRoutings = (updated: RoutingConfig[]) => update('routings', updated);
  const toggleExpand = (id: string) => setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));

  const moveRouting = (idx: number, dir: -1 | 1) => {
    const r = [...routings];
    [r[idx], r[idx + dir]] = [r[idx + dir], r[idx]];
    updateRoutings(r);
  };

  const deleteRouting = (idx: number) => updateRoutings(routings.filter((_, i) => i !== idx));

  const updateRoutingLabel = (idx: number, label: string) => {
    const r = [...routings];
    r[idx] = { ...r[idx], label, saved: false };
    updateRoutings(r);
  };

  const updateConditionGroups = (idx: number, groups: ConditionGroup[]) => {
    const r = [...routings];
    r[idx] = { ...r[idx], conditionGroups: groups, saved: true };
    updateRoutings(r);
  };

  const updateTarget = (idx: number, targetBlockId: string) => {
    const r = [...routings];
    r[idx] = { ...r[idx], targetBlockId, saved: true };
    updateRoutings(r);
  };

  const addRouting = () => {
    const newR = makeEmptyRouting(routerFields);
    updateRoutings([...routings, newR]);
    setExpandedIds((prev) => ({ ...prev, [newR.id]: true }));
  };

  return (
    <div className="w-[420px] bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-semibold">{block.name}</h2>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">LOGIC</Badge>
              <Badge variant="secondary" className="bg-violet-100 text-violet-700 text-[10px]">Canvas C</Badge>
            </div>
            <p className="text-sm text-gray-600">{block.description}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
          <Accordion type="multiple" defaultValue={['routing-conditions']}>

            {/* Component Info */}
            <AccordionItem value="block-info">
              <AccordionTrigger>Component Info</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500">Name</Label>
                    <Input value={block.name} disabled className="bg-gray-50 mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Description</Label>
                    <Input value={block.description} disabled className="bg-gray-50 mt-1" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Routing Conditions */}
            <AccordionItem value="routing-conditions">
              <AccordionTrigger>Routing Conditions</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1.5">
                  <p className="text-xs text-gray-500 mb-3">Rules evaluated top-to-bottom. First matching rule wins.</p>

                  {routings.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">No branches yet. Add one below.</p>
                  )}

                  {/* IF → THEN strips */}
                  {routings.map((routing, idx) => {
                    const expanded = !!expandedIds[routing.id];
                    const summary = getConditionSummary(routing);
                    const targetName = routing.targetBlockId
                      ? allBlocks.find((b) => b.id === routing.targetBlockId)?.name ?? '?'
                      : null;

                    return (
                      <div key={routing.id} className={`border rounded-lg overflow-hidden transition-all ${
                        routing.saved ? 'border-gray-200' : 'border-amber-200 bg-amber-50/30'
                      }`}>
                        {/* Collapsed strip */}
                        <div className="flex items-center gap-2 px-2.5 py-2 bg-white">
                          {/* Reorder */}
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button disabled={idx === 0} onClick={() => moveRouting(idx, -1)}
                              className="text-gray-300 hover:text-gray-600 disabled:opacity-20">
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button disabled={idx === routings.length - 1} onClick={() => moveRouting(idx, 1)}
                              className="text-gray-300 hover:text-gray-600 disabled:opacity-20">
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>

                          {/* IF label + summary */}
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded shrink-0">IF</span>
                            <span className="text-xs text-gray-600 truncate" title={summary}>{summary}</span>
                          </div>

                          {/* THEN label + Route To dropdown */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">THEN</span>
                            <Select value={routing.targetBlockId ?? ''}
                              onValueChange={(v) => updateTarget(idx, v)}>
                              <SelectTrigger className="h-7 text-xs w-[110px] border-blue-200">
                                <SelectValue placeholder="Route to..." />
                              </SelectTrigger>
                              <SelectContent>
                                {allBlocks.filter((b) => b.id !== block.id).map((b) => (
                                  <SelectItem key={b.id} value={b.id} className="text-xs">
                                    {b.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Expand / Delete */}
                          <button onClick={() => toggleExpand(routing.id)}
                            className="text-gray-400 hover:text-gray-700 shrink-0 p-0.5">
                            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                          <button onClick={() => deleteRouting(idx)}
                            className="text-gray-300 hover:text-red-500 shrink-0 p-0.5">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Expanded: full condition builder */}
                        {expanded && (
                          <div className="px-3 pb-3 pt-2 border-t bg-gray-50 space-y-3">
                            {/* Branch label */}
                            <div>
                              <Label className="text-xs text-gray-500">Branch label</Label>
                              <Input value={routing.label ?? ''} placeholder={`Branch ${idx + 1}`}
                                onChange={(e) => updateRoutingLabel(idx, e.target.value)}
                                className="h-8 text-xs mt-1" />
                            </div>

                            {/* Full condition builder */}
                            <div>
                              <Label className="text-xs text-gray-500 mb-1.5 block">When (conditions)</Label>
                              <RouterConditionBuilder
                                conditionGroups={routing.conditionGroups ?? []}
                                routerFields={routerFields}
                                prevBlockActions={prevBlockActions}
                                onChange={(groups) => updateConditionGroups(idx, groups)}
                              />
                            </div>

                            {/* Route To also visible in expanded for clarity */}
                            <div className="pt-2 border-t">
                              <Label className="text-xs font-medium text-gray-600">Then route to:</Label>
                              <Select value={routing.targetBlockId ?? ''}
                                onValueChange={(v) => updateTarget(idx, v)}>
                                <SelectTrigger className="h-8 mt-1 text-xs">
                                  <SelectValue placeholder="Select target block..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {allBlocks.filter((b) => b.id !== block.id).map((b) => (
                                    <SelectItem key={b.id} value={b.id} className="text-xs">
                                      {b.name} ({b.type})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <button onClick={() => toggleExpand(routing.id)}
                              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                              <ChevronUp className="h-3 w-3" /> Collapse
                            </button>
                          </div>
                        )}

                        {/* Status indicator */}
                        {routing.targetBlockId && !expanded && (
                          <div className="px-3 py-1 bg-emerald-50 border-t border-emerald-100">
                            <span className="text-[10px] text-emerald-600">→ {targetName}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <Button variant="outline" size="sm" className="w-full h-8 text-xs border-dashed mt-2" onClick={addRouting}>
                    <Plus className="h-3 w-3 mr-1" /> Add Branch
                  </Button>

                  {/* Default route — pinned strip at bottom */}
                  <div className="border border-dashed border-gray-300 rounded-lg overflow-hidden mt-3">
                    <div className="flex items-center gap-2 px-2.5 py-2 bg-gray-50">
                      <div className="flex-1 flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded shrink-0">DEFAULT</span>
                        <span className="text-xs text-gray-400">If no conditions match</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">THEN</span>
                        <Select value={block.defaultRoute ?? ''}
                          onValueChange={(v) => update('defaultRoute', v)}>
                          <SelectTrigger className="h-7 text-xs w-[110px] border-blue-200">
                            <SelectValue placeholder="Route to..." />
                          </SelectTrigger>
                          <SelectContent>
                            {allBlocks.filter((b) => b.id !== block.id).map((b) => (
                              <SelectItem key={b.id} value={b.id} className="text-xs">{b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 flex gap-2">
        <Button variant="outline" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(block.id)}>Delete</Button>
        <Button size="sm" onClick={() => onSave(block)} className="flex-1">Save</Button>
      </div>
    </div>
  );
}
