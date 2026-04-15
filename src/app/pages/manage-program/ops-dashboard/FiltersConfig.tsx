import { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Info } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Badge } from '../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { fieldManagementApi } from '../../../services/mockApi';
import type { OpsDashboardConfig, OpsDashboardFilter } from '../../../types/program';
import type { FieldManagementEntry } from '../../../types/fieldManagement';

const FILTER_TYPE_MAP: Record<string, string> = {
  String: 'text_search', Number: 'number_range', Integer: 'number_range',
  Float: 'number_range', Date: 'date_range', DateTime: 'date_range', Boolean: 'dropdown',
};

interface Props { programId: string; config: OpsDashboardConfig | null; updateConfig: (u: Partial<OpsDashboardConfig>) => Promise<void>; }

const FiltersConfig = ({ programId, config, updateConfig }: Props) => {
  const [filters, setFilters] = useState<OpsDashboardFilter[]>([]);
  const [allFields, setAllFields] = useState<FieldManagementEntry[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<FieldManagementEntry | null>(null);

  useEffect(() => { if (config?.filters) setFilters(config.filters); }, [config]);
  useEffect(() => { fieldManagementApi.list({ status: 'Active' }).then(({ fields }) => setAllFields(fields)); }, []);

  const filteredFields = allFields.filter((f) =>
    (f.alias || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.variable_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isUsed = (varName: string) => filters.some((f) => f.variable_name === varName);

  const handleAdd = async () => {
    if (!selected) return;
    if (filters.length >= 10) return alert('Maximum 10 filters allowed');
    if (isUsed(selected.variable_name)) return alert('Field already added');
    const newFilter: OpsDashboardFilter = { field_id: selected.id, variable_name: selected.variable_name, filter_type: FILTER_TYPE_MAP[selected.field_type] || 'text_search' };
    const updated = [...filters, newFilter];
    setFilters(updated);
    await updateConfig({ filters: updated });
    setIsAddOpen(false); setSelected(null); setSearchTerm('');
  };

  const remove = async (idx: number) => {
    const updated = filters.filter((_, i) => i !== idx);
    setFilters(updated); await updateConfig({ filters: updated });
  };

  const move = async (idx: number, dir: number) => {
    const arr = [...filters];
    const to = idx + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[idx], arr[to]] = [arr[to], arr[idx]];
    setFilters(arr); await updateConfig({ filters: arr });
  };

  const getAlias = (varName: string) => config?.field_aliases?.[varName] || allFields.find((f) => f.variable_name === varName)?.alias || varName;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold">Filter Configuration</h3>
          <p className="text-sm text-gray-500">{filters.length}/10 filters configured</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} disabled={filters.length >= 10} className="bg-gray-900 text-white"><Plus size={15} className="mr-2" />Add Filter</Button>
      </div>

      {filters.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-500">
          <p className="text-sm">No filters configured. Add filters to enable dashboard filtering.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Order</TableHead>
                <TableHead>Variable Name</TableHead><TableHead>Alias</TableHead>
                <TableHead>Filter Type</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filters.map((f, i) => (
                <TableRow key={f.variable_name}>
                  <TableCell className="text-gray-500 text-sm">{i + 1}</TableCell>
                  <TableCell className="font-mono text-sm text-blue-600">{f.variable_name}</TableCell>
                  <TableCell>{getAlias(f.variable_name)}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{f.filter_type}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ArrowUp size={14} /></button>
                    <button onClick={() => move(i, 1)} disabled={i === filters.length - 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ArrowDown size={14} /></button>
                    <button onClick={() => remove(i)} className="p-1 hover:bg-gray-100 rounded"><Trash2 size={14} className="text-red-500" /></button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isAddOpen} onOpenChange={(o) => !o && (setIsAddOpen(false), setSelected(null), setSearchTerm(''))}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Filter</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <div className="text-sm font-medium mb-1">Field</div>
              {selected ? (
                <div className="p-3 bg-gray-50 rounded border flex justify-between items-center">
                  <div><p className="font-mono text-sm">{selected.variable_name}</p><p className="text-xs text-gray-500">{selected.field_type} • {selected.category}</p></div>
                  <button onClick={() => setSelected(null)} className="text-xs text-blue-600 hover:underline">Change</button>
                </div>
              ) : (
                <div className="relative">
                  <Input placeholder="Search fields..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} />
                  {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-48 overflow-y-auto">
                      {filteredFields.filter((f) => !isUsed(f.variable_name)).slice(0, 15).map((f) => (
                        <button key={f.id} onClick={() => { setSelected(f); setShowDropdown(false); setSearchTerm(''); }} className="w-full p-2 text-left hover:bg-gray-50 border-b last:border-0">
                          <p className="font-mono text-sm">{f.variable_name}</p>
                          <p className="text-xs text-gray-500">{f.field_type} • {f.alias}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {selected && (
              <div className="bg-gray-50 rounded p-3 text-sm">
                <p className="text-gray-500 text-xs mb-1">Filter Type</p>
                <Badge variant="outline">{FILTER_TYPE_MAP[selected.field_type] || 'text_search'}</Badge>
              </div>
            )}
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => { setIsAddOpen(false); setSelected(null); setSearchTerm(''); }}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!selected} className="bg-gray-900 text-white">Add Filter</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FiltersConfig;
