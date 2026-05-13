/**
 * Canvas B — Branch Builder + Canvas Wire
 * Action trigger is a dedicated top card (not a condition row).
 * Conditions defined in panel. Target assigned by drawing wire OR clicking "+" on canvas handle.
 * Default route: dropdown stays in panel.
 */
import { useState } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronRight, ArrowUp, ArrowDown, Link, Unlink, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { BlockData, RoutingConfig, ConditionGroup, ConditionOperator } from '../types/journey';
import { RouterConditionBuilder } from './routing/RouterConditionBuilder';
import {
  getRouterFields, getPreviousBlockActions, makeEmptyRouting, ACTION_PARAM,
} from './routing/routerShared';

interface RouterPanelBProps {
  block: BlockData;
  allBlocks: BlockData[];
  onClose: () => void;
  onSave: (block: BlockData) => void;
  onDelete: (blockId: string) => void;
  onAddDefaultBlock?: () => void;
}

function getRoutingAction(routing: RoutingConfig): string {
  for (const group of routing.conditionGroups ?? []) {
    const c = group.conditions.find((c) => c.parameter === ACTION_PARAM);
    if (c) return c.value;
  }
  return '';
}

function setRoutingAction(routing: RoutingConfig, actionValue: string): RoutingConfig {
  const groups = routing.conditionGroups ?? [];
  const hasActionGroup = groups.some((g) => g.conditions.some((c) => c.parameter === ACTION_PARAM));

  if (!hasActionGroup) {
    const actionGroup: ConditionGroup = {
      id: `ag-${Date.now()}`,
      operator: 'AND',
      conditions: [{
        id: `ac-${Date.now()}`,
        parameter: ACTION_PARAM,
        operator: '=' as ConditionOperator,
        value: actionValue,
        fieldType: 'text',
      }],
    };
    return { ...routing, conditionGroups: [actionGroup, ...groups] };
  }

  return {
    ...routing,
    conditionGroups: groups.map((g) => ({
      ...g,
      conditions: g.conditions.map((c) =>
        c.parameter === ACTION_PARAM ? { ...c, value: actionValue } : c
      ),
    })),
  };
}

function getNonActionGroups(routing: RoutingConfig): ConditionGroup[] {
  return (routing.conditionGroups ?? []).filter(
    (g) => !g.conditions.every((c) => c.parameter === ACTION_PARAM)
  );
}

function mergeNonActionGroups(routing: RoutingConfig, groups: ConditionGroup[]): RoutingConfig {
  const actionGroups = (routing.conditionGroups ?? []).filter(
    (g) => g.conditions.some((c) => c.parameter === ACTION_PARAM)
  );
  return { ...routing, conditionGroups: [...actionGroups, ...groups] };
}

export function RouterPanelB({ block, allBlocks, onClose, onSave, onDelete, onAddDefaultBlock }: RouterPanelBProps) {
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

  const updateAction = (idx: number, actionValue: string) => {
    const r = [...routings];
    r[idx] = setRoutingAction({ ...r[idx], saved: false }, actionValue);
    updateRoutings(r);
  };

  const updateConditionGroups = (idx: number, groups: ConditionGroup[]) => {
    const r = [...routings];
    r[idx] = mergeNonActionGroups({ ...r[idx], saved: false }, groups);
    updateRoutings(r);
  };

  const saveBranch = (idx: number) => {
    const r = [...routings];
    r[idx] = { ...r[idx], saved: true };
    updateRoutings(r);
    setExpandedIds((prev) => ({ ...prev, [routings[idx].id]: false }));
  };

  const addRouting = () => {
    let newR = makeEmptyRouting(routerFields);
    // Auto-populate action if only 1 available
    if (prevBlockActions.length === 1) {
      newR = setRoutingAction(newR, prevBlockActions[0]);
    } else if (prevBlockActions.length > 1) {
      // Pre-add action condition with empty value — user must pick
      newR = setRoutingAction(newR, '');
    }
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
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px]">Canvas B</Badge>
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
                  <div className="flex items-start gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                    <Link className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700">
                      Define branch conditions here. Then draw a wire from each branch handle on the canvas to connect it, or click <strong>+</strong> on the handle to add a block directly.
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">Rules evaluated top-to-bottom. First matching rule wins.</p>

                  {routings.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">No branches configured yet.</p>
                  )}

                  {routings.map((routing, idx) => {
                    const expanded = !!expandedIds[routing.id];
                    const isConnected = !!routing.targetBlockId;
                    const connectedBlockName = isConnected
                      ? allBlocks.find((b) => b.id === routing.targetBlockId)?.name
                      : null;
                    const currentAction = getRoutingAction(routing);
                    const nonActionGroups = getNonActionGroups(routing);
                    const condCount = nonActionGroups.reduce((s, g) => s + g.conditions.length, 0);

                    const subtitle = [
                      currentAction ? `⚡ ${currentAction}` : prevBlockActions.length > 0 ? '⚡ No action set' : null,
                      condCount > 0 ? `${condCount} condition${condCount !== 1 ? 's' : ''}` : null,
                    ].filter(Boolean).join(' · ') || 'No conditions yet';

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
                              <Label className="text-xs text-gray-500">Branch label (shown on canvas handle)</Label>
                              <Input value={routing.label ?? ''} placeholder={`Branch ${idx + 1}`}
                                onChange={(e) => updateRoutingLabel(idx, e.target.value)}
                                className="h-8 text-xs mt-1" />
                            </div>

                            {/* Action trigger — compact chip row */}
                            {prevBlockActions.length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1 shrink-0">
                                  <Zap className="h-3 w-3 text-orange-500" />
                                  <span className="text-xs text-orange-600 font-medium">User tapped</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {prevBlockActions.map((a) => {
                                    const isSelected = currentAction === a;
                                    return (
                                      <button
                                        key={a}
                                        onClick={() => updateAction(idx, a)}
                                        className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                                          isSelected
                                            ? 'bg-orange-500 border-orange-500 text-white'
                                            : 'bg-white border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300'
                                        }`}
                                      >
                                        {a}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Additional conditions */}
                            <div>
                              <Label className="text-xs text-gray-500 mb-1.5 block">
                                {prevBlockActions.length > 0 ? 'Additional conditions (optional)' : 'Conditions'}
                              </Label>
                              <RouterConditionBuilder
                                conditionGroups={nonActionGroups}
                                routerFields={routerFields}
                                prevBlockActions={prevBlockActions}
                                onChange={(groups) => updateConditionGroups(idx, groups)}
                                hideAction
                              />
                            </div>

                            {/* Canvas connection status */}
                            <div className="pt-2 border-t">
                              {isConnected ? (
                                <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                                  <Link className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-emerald-700">Connected on canvas</p>
                                    <p className="text-xs text-emerald-600 truncate">→ {connectedBlockName}</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 p-2 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                                  <Unlink className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                  <div>
                                    <p className="text-xs font-medium text-gray-500">Not connected</p>
                                    <p className="text-xs text-gray-400">
                                      Save branch, then draw a wire or click <strong>+</strong> on the
                                      <span className="font-semibold"> "{routing.label || `Branch ${idx + 1}`}" </span>
                                      handle on the canvas
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>

                            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700"
                              onClick={() => saveBranch(idx)}>
                              Save Branch
                            </Button>
                          </div>
                        )}

                        {/* Collapsed connected status */}
                        {!expanded && routing.saved && (
                          <div className="px-3 py-1.5 border-t flex items-center gap-1.5">
                            {isConnected
                              ? <><Link className="h-3 w-3 text-emerald-500" /><span className="text-xs text-emerald-600">→ {connectedBlockName}</span></>
                              : <><Unlink className="h-3 w-3 text-gray-400" /><span className="text-xs text-gray-400">Draw wire or click + on canvas</span></>
                            }
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <Button variant="outline" className="w-full" onClick={addRouting}>
                    <Plus className="h-4 w-4 mr-2" /> Add Branch
                  </Button>

                  {/* Default route — pinned card, no conditions */}
                  <div className="border-2 border-dashed border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-dashed border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Default (fallback)</p>
                        <p className="text-xs text-gray-400">Runs if no branch conditions match</p>
                      </div>
                    </div>
                    <div className="p-3">
                      {block.defaultRoute ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 flex-1 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <Link className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-emerald-700">Connected</p>
                              <p className="text-xs text-emerald-600 truncate">
                                → {allBlocks.find((b) => b.id === block.defaultRoute)?.name ?? block.defaultRoute}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-300 hover:text-red-500 shrink-0"
                            onClick={() => update('defaultRoute', '')}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Option 1 — direct block picker */}
                          <div>
                            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1.5">Option 1</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 flex items-center gap-2 p-2 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                                <Unlink className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <p className="text-xs text-gray-400">Not set — click + to add</p>
                              </div>
                              <Button
                                size="icon"
                                className="h-7 w-7 bg-blue-500 hover:bg-blue-600 text-white shrink-0"
                                onClick={onAddDefaultBlock}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-px bg-gray-100" />
                            <span className="text-[10px] text-gray-300 font-medium">OR</span>
                            <div className="flex-1 h-px bg-gray-100" />
                          </div>

                          {/* Option 2 — canvas wire style */}
                          <div>
                            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1.5">Option 2</p>
                            <div className="flex flex-col items-center py-1 gap-0">
                              <div
                                style={{
                                  width: 2,
                                  height: 36,
                                  background: 'repeating-linear-gradient(to bottom, #94a3b8 0px, #94a3b8 6px, transparent 6px, transparent 12px)',
                                }}
                              />
                              <button
                                className="mt-1 bg-white border-2 border-slate-400 rounded-full px-4 py-1 text-xs text-slate-600 font-semibold hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-colors"
                                onClick={onAddDefaultBlock}
                              >
                                <Plus className="h-3 w-3" /> Add
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
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
