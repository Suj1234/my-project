import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Eye, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { documentsApi } from '../../services/mockApi';
import type { RequiredDocument } from '../../types/requiredDocument';
import { DOCUMENT_CATEGORIES } from '../../types/requiredDocument';

export function RequiredDocumentList() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<RequiredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: '', status: '' });

  useEffect(() => { fetchDocuments(); }, [filters]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentsApi.list({ search: filters.search, category: filters.category, status: filters.status });
      setDocuments(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this document?')) return;
    await documentsApi.delete(id); fetchDocuments();
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Required Document Management</h1>
          <p className="text-sm text-gray-600 mt-1">Define document requirements at tenant level</p>
        </div>
        <Button onClick={() => navigate('/required-documents/new')} className="bg-gray-900 hover:bg-gray-800 text-white">
          <Plus size={16} className="mr-2" />Create Document
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input placeholder="Search documents..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="pl-9" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Category</label>
            <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v === '__all__' ? '' : v })}>
              <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Categories</SelectItem>
                {DOCUMENT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v === '__all__' ? '' : v })}>
              <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={() => setFilters({ search: '', category: '', status: '' })} className="w-full">
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Required Documents</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><input type="checkbox" className="rounded" /></TableHead>
                <TableHead>Document Code</TableHead>
                <TableHead>Document Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Supported Formats</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-gray-500">Loading...</TableCell></TableRow>
              ) : documents.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-gray-500">No documents found</TableCell></TableRow>
              ) : documents.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-gray-50">
                  <TableCell><input type="checkbox" className="rounded" /></TableCell>
                  <TableCell className="font-semibold text-blue-600">{doc.document_code || 'N/A'}</TableCell>
                  <TableCell className="font-medium">{doc.document_name}</TableCell>
                  <TableCell>{doc.document_category}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {doc.supported_formats.slice(0, 3).map((f) => <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>)}
                      {doc.supported_formats.length > 3 && <Badge variant="secondary" className="text-xs">+{doc.supported_formats.length - 3}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={doc.status === 'Active' ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}>{doc.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button onClick={() => navigate(`/required-documents/${doc.id}/view`)} className="p-2 hover:bg-gray-100 rounded-lg"><Eye size={16} className="text-gray-600" /></button>
                      <button onClick={() => navigate(`/required-documents/${doc.id}/edit`)} className="p-2 hover:bg-gray-100 rounded-lg"><Pencil size={16} className="text-gray-600" /></button>
                      <button onClick={() => handleDelete(doc.id)} className="p-2 hover:bg-gray-100 rounded-lg"><Trash2 size={16} className="text-red-500" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
