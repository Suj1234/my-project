import { BlockData, HookEventSlot } from '../types/journey';

function titleToKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function buildSlot(id: string, label: string): HookEventSlot {
  return {
    id,
    eventKey: id,
    eventLabel: label,
    apis: [],
    decisionConfig: {
      rules: [],
      defaultVerdict: 'PASS',
    },
  };
}

export function getDefaultHookEventSlots(block: BlockData): HookEventSlot[] {
  if (block.type === 'smart' && block.blockTypeId === 'pan_verification') {
    return [
      buildSlot('before_pan_input', 'Before PAN Input'),
      buildSlot('after_pan_input', 'After PAN Input'),
    ];
  }

  if (block.type === 'smart' && (block.pages?.length ?? 0) > 0) {
    return (block.pages ?? []).flatMap((page) => {
      const key = titleToKey(page.name || page.id);
      return [
        buildSlot(`before_${key}`, `Before ${page.name}`),
        buildSlot(`after_${key}`, `After ${page.name}`),
      ];
    });
  }

  if (block.type === 'form') {
    return [
      buildSlot('before_form_submit', 'Before Form Submit'),
      buildSlot('after_form_submit', 'After Form Submit'),
    ];
  }

  if (block.type === 'start') {
    return [
      buildSlot('before_journey_start', 'Before Journey Start'),
      buildSlot('after_journey_start', 'After Journey Start'),
    ];
  }

  return [];
}

export function mergeWithDefaultSlots(existing: HookEventSlot[] | undefined, defaults: HookEventSlot[]): HookEventSlot[] {
  const existingMap = new Map((existing ?? []).map((slot) => [slot.eventKey, slot]));
  return defaults.map((slot) => {
    const current = existingMap.get(slot.eventKey);
    return current
      ? {
          ...slot,
          ...current,
          apis: current.apis ?? [],
          decisionConfig: current.decisionConfig ?? slot.decisionConfig,
        }
      : slot;
  });
}
