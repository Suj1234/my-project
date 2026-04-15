import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Badge } from '../../../components/ui/badge';
import { fieldManagementApi } from '../../../services/mockApi';
import type { OpsDashboardConfig, OpsDashboardViewCategory, OpsDashboardViewField } from '../../../types/program';
import type { FieldManagementEntry } from '../../../types/fieldManagement';

const VIEW_CATEGORIES = ['Personal Information', 'Contact Information', 'Identity Documents', 'Employment Details', 'Financial Details', 'Bank Details', 'Loan Details', 'Business Details', 'Other'];

interface Props { programId: string; config: OpsDashboardConfig | null; updateConfig: (u: Partial<OpsDashboardConfig>) => Promise<void>; }

const ViewDetailsConfig = ({ config, updateConfig }: Props) => {
  const [categories, setCategories] = useState<OpsDashboardViewCategory[]>([]);
  const [allFields, setAllFields] = useState<FieldManagementEntry[]>([]);
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [currentCatIdx, setCurrentCatIdx] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedField, setSelectedField] = useState<FieldManagementEntry | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (config?.view_categories) setCategories(config.view_categories);
    else if ((config as any)?.view_tabs) {
      const cats = (config as any).view_tabs.map((t: any) => ({ category_name: t.tab_name || t.category, fields: t.fields || [] }));
      setCategories(cats);
    }
  }, [config]);

  useEffect(() => { fieldManagementApi.list({ status: 'Active' }).then(({ fields }) => setAllFields(fields)); }, []);

  const filteredFields = allFields.filter((f) =>
    (f.alias || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.variable_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    const updated = [...categories, { category_name: newCatName.trim(), fields: [] }];
    setCategories(updated); await updateConfig({ view_categories: updated });
    setIsAddCatOpen(false); setNewCatName('');
  };

  const removeCategory = async (idx: number) => {
    const updated = categories.filter((_, i) => i !== idx);
    setCategories(updated); await updateConfig({ view_categories: updated });
  };

  const addFieldToCategory = async () => {
    if (!selectedField || currentCatIdx === null) return;
    const updated = categories.map((cat, i) => {
      if (i !== currentCatIdx) return cat;
      return { ...cat, fields: [...cat.fields, { field_id: selectedField.id, variable_name: selectedField.variable_name, field_type: selectedField.field_type }] };
    });
    setCategories(updated); await updateConfig({ view_categories: updated });
    setIsAddFieldOpen(false); setSelectedField(null); setSearchTerm('');
  };

  const removeField = async (catIdx: number, fieldIdx: number) => {
    const updated = categories.map((cat, i) => i === catIdx ? { ...cat, fields: cat.fields.filter((_, j) => j !== fieldIdx) } : cat);
    setCategories(updated); await updateConfig({ view_categories: updated });
  };

  const getAlias = (varName: string) => config?.field_aliases?.[varName] || allFields.find((f) => f.variable_name === varName)?.alias || varName;

  const toggleCat = (idx: number) => setExpandedCats((prev) => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });

  const isFieldUsedInCat = (catIdx: number, varName: string) => categories[catIdx]?.fields.some((f) => f.variable_name === varName);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold">View Details Configuration</h3>
          <p className="text-sm text-gray-500">Configure what fields appear in the application detail view</p>
        </div>
        <Button onClick={() => setIsAddCatOpen(true)} className="bg-gray-900 text-white"><Plus size={15} className="mr-2" />Add Category</Button>
      </div>

      {categories.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-500">
          <p className="text-sm">No categories configured. Add categories and fields for the application detail view.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat, catIdx) => (
            <div key={catIdx} className="border rounded-lg bg-white">
              <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50" onClick={() => toggleCat(catIdx)}>
                <div className="flex items-center space-x-2">
                  <ChevronRight size={16} className={`text-gray-400 transition-transform ${expandedCats.has(catIdx) ? 'rotate-90' : ''}`} />
                  <span className="font-medium text-sm">{cat.category_name}</span>
                  <Badge variant="secondary" className="text-xs">{cat.fields.length} fields</Badge>
                </div>
                <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => { setCurrentCatIdx(catIdx); setIsAddFieldOpen(true); }} className="p-1 hover:bg-gray-100 rounded text-blue-600">
                    <Plus size={14} />
                  </button>
                  <button onClick={() => removeCategory(catIdx)} className="p-1 hover:bg-gray-100 rounded">
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
              {expandedCats.has(catIdx) && (
                <div className="border-t px-4 py-3">
                  {cat.fields.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No fields. Click + to add fields.</p>
                  ) : (
                    <div className="space-y-1">
                      {cat.fields.map((f, fIdx) => (
                        <div key={fIdx} className="flex items-center justify-between py-1.5 border-b last:border-0">
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-xs text-blue-600">{f.variable_name}</span>
                            <span className="text-sm text-gray-600">{getAlias(f.variable_name)}</span>
                          </div>
                          <button onClick={() => removeField(catIdx, fIdx)} className="p-1 hover:bg-gray-100 rounded">
                            <Trash2 size={13} className="text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      <Dialog open={isAddCatOpen} onOpenChange={(o) => !o && (setIsAddCatOpen(false), setNewCatName(''))}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Category Name</Label>
              <Select value={newCatName} onValueChange={setNewCatName}>
                <SelectTrigger><SelectValue placeholder="Select or type name" /></SelectTrigger>
                <SelectContent>{VIEW_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Or type a custom name:</p>
              <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Custom category name" className="mt-1" />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => { setIsAddCatOpen(false); setNewCatName(''); }}>Cancel</Button>
              <Button onClick={addCategory} disabled={!newCatName.trim()} className="bg-gray-900 text-white">Add Category</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Field Modal */}
      <Dialog open={isAddFieldOpen} onOpenChange={(o) => !o && (setIsAddFieldOpen(false), setSelectedField(null), setSearchTerm(''))}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Field to {currentCatIdx !== null ? categories[currentCatIdx]?.category_name : ''}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <div className="text-sm font-medium mb-1">Field</div>
              {selectedField ? (
                <div className="p-3 bg-gray-50 rounded border flex justify-between items-center">
                  <div><p className="font-mono text-sm">{selectedField.variable_name}</p><p className="text-xs text-gray-500">{selectedField.field_type} • {selectedField.alias}</p></div>
                  <button onClick={() => setSelectedField(null)} className="text-xs text-blue-600 hover:underline">Change</button>
                </div>
              ) : (
                <div className="relative">
                  <Input placeholder="Search fields..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} />
                  {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-48 overflow-y-auto">
                      {filteredFields.filter((f) => currentCatIdx === null || !isFieldUsedInCat(currentCatIdx, f.variable_name)).slice(0, 15).map((f) => (
                        <button key={f.id} onClick={() => { setSelectedField(f); setShowDropdown(false); setSearchTerm(''); }} className="w-full p-2 text-left hover:bg-gray-50 border-b last:border-0">
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
              <Button variant="outline" onClick={() => { setIsAddFieldOpen(false); setSelectedField(null); setSearchTerm(''); }}>Cancel</Button>
              <Button onClick={addFieldToCategory} disabled={!selectedField} className="bg-gray-900 text-white">Add Field</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewDetailsConfig;
