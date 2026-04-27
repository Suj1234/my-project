import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Filter, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { masterManagementApi } from '../../services/mockApi';
import type { Master, MasterListFilters } from '../../types/masterManagement';
import { CreateMasterDialog } from './components/CreateMasterDialog';

const ROWS_PER_PAGE = 10;

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:      'bg-green-100 text-green-700 border-green-200',
  DRAFT:       'bg-yellow-50 text-yellow-700 border-yellow-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-600 border-blue-200',
  INACTIVE:    'bg-gray-100 text-gray-500 border-gray-200',
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  const dd = d.getDate().toString().padStart(2, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  const h = d.getHours();
  const min = d.getMinutes().toString().padStart(2, '0');
  const sec = d.getSeconds().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = (h % 12 || 12).toString().padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${h12}:${min}:${sec} ${ampm}`;
};

const EMPTY_FILTERS: MasterListFilters = { name: '', status: '', dateFrom: '', dateTo: '' };

export function MasterManagementList() {
  const navigate = useNavigate();
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<MasterListFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<MasterListFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchMasters = useCallback(async (f: MasterListFilters) => {
    try {
      setLoading(true);
      const data = await masterManagementApi.list(f);
      setMasters(data);
      setPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMasters(EMPTY_FILTERS); }, [fetchMasters]);

  const applyFilters = () => {
    setAppliedFilters(filters);
    fetchMasters(filters);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    fetchMasters(EMPTY_FILTERS);
  };

  const totalPages = Math.ceil(masters.length / ROWS_PER_PAGE);
  const paginated = masters.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Master Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage master data entities across all programs</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters((v) => !v)}
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Filter size={15} className="mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus size={15} className="mr-2" />
            Create Master
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <p className="text-sm font-semibold text-gray-800 mb-3">Filters</p>
          <div className="grid grid-cols-4 gap-4">
            {/* Master Name */}
            <div>
              <input
                type="text"
                placeholder="Master Name"
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status */}
            <div>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
              >
                <option value="">Status</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
              </select>
            </div>

            {/* Date From */}
            <div className="relative">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                placeholder="Date From"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
              />
            </div>

            {/* Date To */}
            <div className="relative">
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                placeholder="Date To"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <Button
              onClick={applyFilters}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              Apply Filters
            </Button>
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-900"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Master Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Last Updated</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Default Version</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">Loading...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">No masters found</td></tr>
              ) : (
                paginated.map((master) => (
                  <tr key={master.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{master.name}</td>
                    <td className="px-4 py-3 text-gray-600">{master.description}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDateTime(master.updatedAt)}</td>
                    <td className="px-4 py-3 text-gray-600">{master.defaultVersion}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded border text-xs font-medium ${STATUS_COLORS[master.status] ?? STATUS_COLORS.INACTIVE}`}>
                        {master.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/master-management/${master.id}/view`)}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                        title="View"
                      >
                        <Eye size={18} className="text-blue-600" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {masters.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Showing {(page - 1) * ROWS_PER_PAGE + 1}–{Math.min(page * ROWS_PER_PAGE, masters.length)} of {masters.length} items
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 hover:bg-gray-100"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded text-sm font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 hover:bg-gray-100"
              >
                <ChevronRight size={16} />
              </button>
              <span className="text-xs text-gray-400 ml-3">Rows per page</span>
              <span className="text-xs font-medium text-gray-600 ml-1">{ROWS_PER_PAGE}</span>
            </div>
          </div>
        )}
      </div>

      <CreateMasterDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => { setCreateOpen(false); fetchMasters(appliedFilters); }}
        mode="master"
      />
    </div>
  );
}
