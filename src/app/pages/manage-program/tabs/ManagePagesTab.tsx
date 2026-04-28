import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Eye, SlidersHorizontal, Plus, Upload, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { pagesApi } from '../../../services/mockApi';
import type { ProgramPage, PageStatus } from '../../../types/program';

interface Props { programId: string; }

const STATUS_BADGE: Record<PageStatus, string> = {
  ACTIVE:   'bg-green-100 text-green-700 border-green-200',
  INACTIVE: 'bg-gray-100 text-gray-500 border-gray-200',
  DRAFT:    'bg-yellow-50 text-yellow-700 border-yellow-200',
};

const MOCK_RAPID_TEMPLATES = [
  { id: 'tpl_pl_01', name: 'Personal Loan Template' },
  { id: 'tpl_bl_01', name: 'Business Loan Template' },
  { id: 'tpl_hl_01', name: 'Home Loan Template' },
  { id: 'tpl_gl_01', name: 'Gold Loan Template' },
];

export default function ManagePagesTab({ programId }: Props) {
  const navigate = useNavigate();
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

  // Create Page dialog (RapidUI flow)
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
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Manage Pages</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)}>
            <SlidersHorizontal size={15} className="mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
            <Upload size={15} className="mr-2" />
            Upload Page Schema
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setCreateOpen(true)}>
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

      {/* Create Page Dialog (RapidUI flow) */}
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
                <span className="text-xs text-gray-400 font-normal">(optional)</span>
              </Label>
              <div className="relative flex items-center mt-1">
                <Select value={createTemplate || undefined} onValueChange={setCreateTemplate}>
                  <SelectTrigger className={createTemplate ? 'pr-8' : ''}>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_RAPID_TEMPLATES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {createTemplate && (
                  <button
                    onClick={() => setCreateTemplate('')}
                    className="absolute right-8 text-gray-400 hover:text-gray-600 z-10"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
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
