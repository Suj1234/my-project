import { Plus, Trash2, GripVertical } from 'lucide-react';
import { KeyValuePair } from '../../../types/apiIntegration';
import { VariableInput } from './VariableInput';

interface KeyValueTableProps {
  rows: KeyValuePair[];
  onChange: (rows: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  addLabel?: string;
  showDescription?: boolean;
}

function nextId(rows: KeyValuePair[]) {
  return String(Math.max(0, ...rows.map((r) => Number(r.id) || 0)) + 1);
}

export function KeyValueTable({
  rows,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  addLabel = 'Add Row',
  showDescription = false,
}: KeyValueTableProps) {
  const update = (id: string, field: keyof KeyValuePair, value: any) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const remove = (id: string) => onChange(rows.filter((r) => r.id !== id));

  const add = () =>
    onChange([...rows, { id: nextId(rows), key: '', value: '', enabled: true }]);

  return (
    <div className="space-y-1">
      {rows.length > 0 && (
        <div className={`grid gap-x-2 mb-1 ${showDescription ? 'grid-cols-[16px_1fr_1fr_1fr_28px]' : 'grid-cols-[16px_1fr_1fr_28px]'}`}>
          <div />
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide px-1">Key</p>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide px-1">Value</p>
          {showDescription && <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide px-1">Description</p>}
          <div />
        </div>
      )}

      {rows.map((row) => (
        <div
          key={row.id}
          className={`grid gap-x-2 items-center ${
            showDescription ? 'grid-cols-[16px_1fr_1fr_1fr_28px]' : 'grid-cols-[16px_1fr_1fr_28px]'
          } ${!row.enabled ? 'opacity-50' : ''}`}
        >
          {/* Enable toggle / drag handle */}
          <div className="flex flex-col items-center gap-0.5">
            <input
              type="checkbox"
              checked={row.enabled}
              onChange={(e) => update(row.id, 'enabled', e.target.checked)}
              className="w-3 h-3 accent-teal-600 cursor-pointer"
              title="Enable/disable this row"
            />
          </div>

          {/* Key */}
          <input
            type="text"
            value={row.key}
            onChange={(e) => update(row.id, 'key', e.target.value)}
            placeholder={keyPlaceholder}
            className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 w-full font-mono placeholder:text-gray-300"
          />

          {/* Value */}
          <VariableInput
            value={row.value}
            onChange={(v) => update(row.id, 'value', v)}
            placeholder={valuePlaceholder}
            className="!text-xs !py-1.5 !px-2.5"
          />

          {showDescription && (
            <input
              type="text"
              value={row.description ?? ''}
              onChange={(e) => update(row.id, 'description', e.target.value)}
              placeholder="Description (optional)"
              className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 w-full placeholder:text-gray-300"
            />
          )}

          {/* Delete */}
          <button
            onClick={() => remove(row.id)}
            className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}

      <button
        onClick={add}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-teal-600 mt-1 py-1 px-1 rounded hover:bg-teal-50 transition-colors"
      >
        <Plus size={12} />
        {addLabel}
      </button>
    </div>
  );
}
