import { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Badge } from '../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { fieldManagementApi } from '../../../services/mockApi';
import type { OpsDashboardConfig, OpsDashboardColumn } from '../../../types/program';
import type { FieldManagementEntry } from '../../../types/fieldManagement';

interface Props { programId: string; config: OpsDashboardConfig | null; updateConfig: (u: Partial<OpsDashboardConfig>) => Promise<void>; }

const ListingColumnsConfig = ({ config, updateConfig }: Props) => {
  const [columns, setColumns] = useState<OpsDashboardColumn[]>([]);
  const [allFields, setAllFields] = useState<FieldManagementEntry[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<FieldManagementEntry | null>(null);

  useEffect(() => { if (config?.listing_columns) setColumns(config.listing_columns); }, [config]);
  useEffect(() => { fieldManagementApi.list({ status: 'Active' }).then(({ fields }) => setAllFields(fields)); }, []);

  const filtered = allFields.filter((f) =>
    (f.alias || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.variable_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isUsed = (varName: string) => columns.some((c) => c.variable_name === varName);

  const handleAdd = async () => {
    if (!selected) return;
    if (columns.length >= 15) return alert('Maximum 15 columns allowed');
    if (isUsed(selected.variable_name)) return alert('Field already added');
    const sortable = ['String', 'Integer', 'Float', 'Date', 'Number'].includes(selected.field_type);
    const col: OpsDashboardColumn = { field_id: selected.id, variable_name: selected.variable_name, is_sortable: sortable };
    const updated = [...columns, col];
    setColumns(updated); await updateConfig({ listing_columns: updated });
    setIsAddOpen(false); setSelected(null); setSearchTerm('');
  };

  const remove = async (idx: number) => {
    const updated = columns.filter((_, i) => i !== idx);
    setColumns(updated); await updateConfig({ listing_columns: updated });
  };

  const move = async (idx: number, dir: number) => {
    const arr = [...columns]; const to = idx + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[idx], arr[to]] = [arr[to], arr[idx]];
    setColumns(arr); await updateConfig({ listing_columns: arr });
  };

  const getAlias = (varName: string) => config?.field_aliases?.[varName] || allFields.find((f) => f.variable_name === varName)?.alias || varName;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold">Listing Columns</h3>
          <p className="text-sm text-gray-500">{columns.length}/15 columns configured</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} disabled={columns.length >= 15} className="bg-gray-900 text-white"><Plus size={15} className="mr-2" />Add Column</Button>
      </div>

      {columns.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-500">
          <p className="text-sm">No columns configured. Add columns to define what appears in the listing table.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Order</TableHead>
                <TableHead>Variable Name</TableHead><TableHead>Alias</TableHead>
                <TableHead>Sortable</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {columns.map((c, i) => (
                <TableRow key={c.variable_name}>
                  <TableCell className="text-gray-500 text-sm">{i + 1}</TableCell>
                  <TableCell className="font-mono text-sm text-blue-600">{c.variable_name}</TableCell>
                  <TableCell>{getAlias(c.variable_name)}</TableCell>
                  <TableCell>{c.is_sortable ? <Badge className="bg-green-100 text-green-800">Yes</Badge> : <span className="text-gray-400 text-sm">No</span>}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ArrowUp size={14} /></button>
                    <button onClick={() => move(i, 1)} disabled={i === columns.length - 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ArrowDown size={14} /></button>
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
          <DialogHeader><DialogTitle>Add Listing Column</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <div className="text-sm font-medium mb-1">Field</div>
              {selected ? (
                <div className="p-3 bg-gray-50 rounded border flex justify-between items-center">
                  <div><p className="font-mono text-sm">{selected.variable_name}</p><p className="text-xs text-gray-500">{selected.field_type} • {selected.alias}</p></div>
                  <button onClick={() => setSelected(null)} className="text-xs text-blue-600 hover:underline">Change</button>
                </div>
              ) : (
                <div className="relative">
                  <Input placeholder="Search fields..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} />
                  {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-48 overflow-y-auto">
                      {filtered.filter((f) => !isUsed(f.variable_name)).slice(0, 15).map((f) => (
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
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => { setIsAddOpen(false); setSelected(null); setSearchTerm(''); }}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!selected} className="bg-gray-900 text-white">Add Column</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ListingColumnsConfig;
