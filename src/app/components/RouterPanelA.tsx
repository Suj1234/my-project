/**
 * Canvas A — Unified Panel
 * One condition builder for all scenarios. No routing-type toggle.
 * "User tapped" is a condition type. "Then route to" stays in each branch card.
 * Default route: dropdown at bottom.
 */
import { useState } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BlockData, RoutingConfig, ConditionGroup } from '../types/journey';
import { RouterConditionBuilder } from './routing/RouterConditionBuilder';
import {
  getRouterFields, getPreviousBlockActions, makeEmptyRouting,
} from './routing/routerShared';

interface RouterPanelAProps {
  block: BlockData;
  allBlocks: BlockData[];
  onClose: () => void;
  onSave: (block: BlockData) => void;
  onDelete: (blockId: string) => void;
}

export function RouterPanelA({ block, allBlocks, onClose, onSave, onDelete }: RouterPanelAProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const routerFields = getRouterFields(allBlocks, block.id);
  const prevBlockActions = getPreviousBlockActions(allBlocks, block.id);

  const routings = block.routings ?? [];

  const update = (field: string, value: unknown) => onSave({ ...block, [field]: value });

  const updateRoutings = (updated: RoutingConfig[]) => update('routings', updated);

  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));

  const moveRouting = (idx: number, dir: -1 | 1) => {
    const r = [...routings];
    [r[idx], r[idx + dir]] = [r[idx + dir], r[idx]];
    updateRoutings(r);
  };

  const deleteRouting = (idx: number) =>
    updateRoutings(routings.filter((_, i) => i !== idx));

  const updateRoutingLabel = (idx: number, label: string) => {
    const r = [...routings];
    r[idx] = { ...r[idx], label, saved: false };
    updateRoutings(r);
  };

  const updateConditionGroups = (idx: number, groups: ConditionGroup[]) => {
    const r = [...routings];
    r[idx] = { ...r[idx], conditionGroups: groups, saved: false };
    updateRoutings(r);
  };

  const updateTarget = (idx: number, targetBlockId: string) => {
    const r = [...routings];
    r[idx] = { ...r[idx], targetBlockId, saved: false };
    updateRoutings(r);
  };

  const saveRouting = (idx: number) => {
    if (!routings[idx].targetBlockId) return;
    const r = [...routings];
    r[idx] = { ...r[idx], saved: true };
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
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px]">Canvas A</Badge>
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
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">Rules evaluated top-to-bottom. First matching rule wins.</p>

                  {routings.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">No routes configured yet.</p>
                  )}

                  {routings.map((routing, idx) => {
                    const expanded = !!expandedIds[routing.id];
                    const targetName = routing.targetBlockId
                      ? allBlocks.find((b) => b.id === routing.targetBlockId)?.name ?? 'Selected'
                      : 'No target';
                    const groups = routing.conditionGroups ?? [];
                    const condCount = groups.reduce((s, g) => s + g.conditions.length, 0);
                    const subtitle = `${groups.length} group · ${condCount} condition · ${targetName}`;

                    return (
                      <div key={routing.id} className="border rounded-lg bg-gray-50 overflow-hidden">
                        {/* Branch header */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b">
                          <button className="flex items-center gap-2 text-left flex-1"
                            onClick={() => toggleExpand(routing.id)}>
                            {expanded
                              ? <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
                              : <ChevronRight className="h-4 w-4 text-gray-500 shrink-0" />}
                            <div>
                              <p className="font-medium text-sm">{routing.label || `Branch ${idx + 1}`}</p>
                              <p className="text-xs text-gray-500">{subtitle}</p>
                            </div>
                          </button>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === 0}
                              onClick={() => moveRouting(idx, -1)}><ArrowUp className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === routings.length - 1}
                              onClick={() => moveRouting(idx, 1)}><ArrowDown className="h-3 w-3" /></Button>
                            <Badge variant="secondary"
                              className={routing.saved ? 'bg-emerald-100 text-emerald-700 text-xs' : 'bg-amber-100 text-amber-700 text-xs'}>
                              {routing.saved ? 'Saved' : 'Draft'}
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-500"
                              onClick={() => deleteRouting(idx)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </div>

                        {expanded && (
                          <div className="p-3 space-y-3">
                            {/* Branch label */}
                            <div>
                              <Label className="text-xs text-gray-500">Branch label (shown on canvas edge)</Label>
                              <Input value={routing.label ?? ''} placeholder={`Branch ${idx + 1}`}
                                onChange={(e) => updateRoutingLabel(idx, e.target.value)}
                                className="h-8 text-xs mt-1" />
                            </div>

                            {/* Condition builder — unified, no type toggle */}
                            <div>
                              <Label className="text-xs text-gray-500 mb-1.5 block">When (conditions)</Label>
                              <RouterConditionBuilder
                                conditionGroups={routing.conditionGroups ?? []}
                                routerFields={routerFields}
                                prevBlockActions={prevBlockActions}
                                onChange={(groups) => updateConditionGroups(idx, groups)}
                              />
                            </div>

                            {/* Then route to */}
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

                            <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600"
                              disabled={!routing.targetBlockId}
                              onClick={() => saveRouting(idx)}>
                              Save Branch
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <Button variant="outline" className="w-full" onClick={addRouting}>
                    <Plus className="h-4 w-4 mr-2" /> Add Branch
                  </Button>

                  {/* Default route */}
                  <div className="pt-4 border-t">
                    <Label className="text-sm font-medium">Default Route</Label>
                    <p className="text-xs text-gray-500 mb-2">If no conditions match, route here:</p>
                    <Select value={block.defaultRoute ?? ''}
                      onValueChange={(v) => update('defaultRoute', v)}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select default block..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allBlocks.filter((b) => b.id !== block.id).map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.name} ({b.type})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
