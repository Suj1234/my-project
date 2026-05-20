import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Eye, SlidersHorizontal, Plus, Upload, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { pagesApi } from '../../../services/mockApi';
import type { ProgramPage, PageStatus } from '../../../types/program';

interface Props { programId: string; }

const STATUS_BADGE: Record<PageStatus, string> = {
  ACTIVE:   'bg-green-100 text-green-700 border-green-200',
  INACTIVE: 'bg-gray-100 text-gray-500 border-gray-200',
  DRAFT:    'bg-yellow-50 text-yellow-700 border-yellow-200',
};

export default function ManagePagesTab({ programId }: Props) {
  const navigate = useNavigate();
  const [subTab, setSubTab] = useState('pages');

  // Pages state
  const [pages, setPages] = useState<ProgramPage[]>([]);
  const [filtered, setFiltered] = useState<ProgramPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Upload Page Schema dialog
  const [uploadOpen, setUploadOpen] = useState(false);
  const [appConfigFile, setAppConfigFile] = useState<File | null>(null);
  const [pageSchemaFile, setPageSchemaFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const appConfigRef = useRef<HTMLInputElement>(null);
  const pageSchemaRef = useRef<HTMLInputElement>(null);

  // Rapid UI app linkage (pre-populated from backend; mocked as not linked)
  const rapidUiAppId = '';
  const rapidUiAppName = '';
  const [defaultTemplate, setDefaultTemplate] = useState('');
  const [defaultTemplateInput, setDefaultTemplateInput] = useState('');

  // Create Page dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createAppName, setCreateAppName] = useState('');
  const [createTemplate, setCreateTemplate] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { load(); }, [programId]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await pagesApi.list(programId);
      setPages(data);
      setFiltered(data);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...pages];
    if (filterName.trim()) result = result.filter((p) => p.page_name.toLowerCase().includes(filterName.toLowerCase()));
    if (filterStatus) result = result.filter((p) => p.status === filterStatus);
    setFiltered(result);
  };

  const clearFilters = () => {
    setFilterName('');
    setFilterStatus('');
    setFiltered(pages);
  };

  const closeUpload = () => {
    setUploadOpen(false);
    setAppConfigFile(null);
    setPageSchemaFile(null);
  };

  const handleUploadSave = async () => {
    if (!appConfigFile || !pageSchemaFile) return;
    setUploading(true);
    try {
      await pagesApi.create({
        program_id: programId,
        page_name: appConfigFile.name.replace(/\.json$/i, ''),
        page_type: 'APP_STATE_PAGE',
        status: 'ACTIVE',
        page_config: '{}',
      });
      closeUpload();
      load();
    } finally {
      setUploading(false);
    }
  };

  const openCreate = () => {
    setCreateAppName('');
    setCreateTemplate(defaultTemplate);
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreateAppName('');
    setCreateTemplate('');
  };

  const handleCreatePage = async () => {
    if (!createAppName.trim()) return;
    setCreating(true);
    try {
      await pagesApi.create({
        program_id: programId,
        page_name: createAppName.trim(),
        page_type: 'APP_STATE_PAGE',
        status: 'ACTIVE',
        page_config: '{}',
      });
      closeCreate();
      load();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      {/* Sub-tabs */}
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="bg-gray-100 rounded-lg p-1 mb-5 h-auto">
          <TabsTrigger
            value="pages"
            className="rounded-md px-4 py-1.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-500"
          >
            Pages
          </TabsTrigger>
          <TabsTrigger
            value="rapid-ui"
            className="rounded-md px-4 py-1.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-500"
          >
            Rapid UI App Setup
          </TabsTrigger>
        </TabsList>

        {/* ── Pages sub-tab ─────────────────────────────────────────── */}
        <TabsContent value="pages">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pages</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)}>
                <SlidersHorizontal size={15} className="mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
                <Upload size={15} className="mr-2" />
                Upload Page Schema
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={openCreate}>
                <Plus size={15} className="mr-2" />
                Create Page
              </Button>
            </div>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Filters</p>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <Input
                  placeholder="Name"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                />
                <div className="relative flex items-center">
                  <Select value={filterStatus || undefined} onValueChange={(v) => setFilterStatus(v)}>
                    <SelectTrigger className={filterStatus ? 'pr-8' : ''}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                      <SelectItem value="DRAFT">DRAFT</SelectItem>
                    </SelectContent>
                  </Select>
                  {filterStatus && (
                    <button
                      onClick={() => setFilterStatus('')}
                      className="absolute right-8 text-gray-400 hover:text-gray-600 z-10"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={applyFilters}>
                  Apply Filters
                </Button>
                <Button size="sm" variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg">
            {loading ? (
              <div className="p-12 text-center text-gray-500 text-sm">Loading...</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Page Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-gray-400 text-sm">
                          No pages found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((page) => (
                        <TableRow key={page.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-900">{page.page_name}</TableCell>
                          <TableCell className="text-sm text-gray-600">{page.page_type}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs font-medium ${STATUS_BADGE[page.status]}`}>
                              {page.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => navigate(`/manage-programs/${programId}/pages/${page.id}/view`)}
                              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                              title="View Details"
                            >
                              <Eye size={16} className="text-blue-600" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <div className="px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
                  Showing {filtered.length} of {pages.length} items
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* ── Rapid UI App Setup sub-tab ────────────────────────────── */}
        <TabsContent value="rapid-ui">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Rapid UI App Setup</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">

            {/* App ID + App Name (read-only, pre-populated from Rapid UI) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">App ID</Label>
                <p className="h-9 flex items-center px-3 rounded-md bg-gray-50 border border-gray-200 text-sm text-gray-800">
                  {rapidUiAppId || <span className="text-gray-400 italic">Not linked</span>}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">App Name</Label>
                <p className="h-9 flex items-center px-3 rounded-md bg-gray-50 border border-gray-200 text-sm text-gray-800">
                  {rapidUiAppName || <span className="text-gray-400 italic">Not linked</span>}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Default Page Template */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold text-gray-800">Default Page Template</Label>
                <span className="text-xs text-gray-400 font-normal">(optional)</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  className="h-9 text-sm max-w-xs"
                  placeholder="e.g. PPL01"
                  value={defaultTemplateInput}
                  onChange={(e) => setDefaultTemplateInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setDefaultTemplate(defaultTemplateInput.trim());
                  }}
                />
                {defaultTemplateInput.trim() && defaultTemplateInput.trim() !== defaultTemplate && (
                  <Button
                    size="sm"
                    className="h-9 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setDefaultTemplate(defaultTemplateInput.trim())}
                  >
                    Save
                  </Button>
                )}
                {defaultTemplate && (
                  <button
                    onClick={() => { setDefaultTemplate(''); setDefaultTemplateInput(''); }}
                    className="text-gray-400 hover:text-gray-600"
                    title="Clear template"
                  >
                    <X size={15} />
                  </button>
                )}
                {defaultTemplate && defaultTemplateInput.trim() === defaultTemplate && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle2 size={13} />
                    Saved
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Defines the base layout of pages in this program. Sourced from the Rapid UI platform.
                Optional for manual page creation —{' '}
                <span className="font-medium text-gray-700">required when generating pages with AI on the canvas.</span>
              </p>

              {!defaultTemplate && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    No default template set. AI page generation on the canvas will not work until a template is entered.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Upload Page Schema Dialog */}
      <Dialog open={uploadOpen} onOpenChange={(o) => { if (!o) closeUpload(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Page Schema Files</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div
              className="flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => appConfigRef.current?.click()}
            >
              <Upload size={17} className="text-gray-400 shrink-0" />
              <span className={`text-sm truncate ${appConfigFile ? 'text-gray-800' : 'text-gray-400'}`}>
                {appConfigFile ? appConfigFile.name : 'Upload appConfig'}
              </span>
              <input
                ref={appConfigRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => setAppConfigFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div
              className="flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => pageSchemaRef.current?.click()}
            >
              <Upload size={17} className="text-gray-400 shrink-0" />
              <span className={`text-sm truncate ${pageSchemaFile ? 'text-gray-800' : 'text-gray-400'}`}>
                {pageSchemaFile ? pageSchemaFile.name : 'Upload pageSchema'}
              </span>
              <input
                ref={pageSchemaRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => setPageSchemaFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeUpload}>Cancel</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!appConfigFile || !pageSchemaFile || uploading}
              onClick={handleUploadSave}
            >
              {uploading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Page Dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) closeCreate(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>App Name <span className="text-red-500">*</span></Label>
              <Input
                className="mt-1"
                placeholder="Enter app name"
                value={createAppName}
                onChange={(e) => setCreateAppName(e.target.value)}
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                Template
                <span className="text-xs text-gray-400 font-normal">(from Rapid UI)</span>
              </Label>
              <Input
                className="mt-1"
                placeholder="e.g. PPL01"
                value={createTemplate}
                onChange={(e) => setCreateTemplate(e.target.value)}
              />
              {!createTemplate && (
                <p className="text-xs text-amber-600 mt-1">
                  No template set. Set a Default Page Template in Rapid UI App Setup to pre-fill this automatically.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeCreate}>Cancel</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!createAppName.trim() || creating}
              onClick={handleCreatePage}
            >
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
