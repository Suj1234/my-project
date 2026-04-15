import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Eye, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { programsApi } from '../../services/mockApi';
import type { Program } from '../../types/program';

const ROWS_PER_PAGE = 10;

const STATUS_COLORS: Record<string, string> = {
  Active:   'bg-green-100 text-green-700 border-green-200',
  Draft:    'bg-yellow-50 text-yellow-700 border-yellow-200',
  Inactive: 'bg-gray-100 text-gray-500 border-gray-200',
};

export function ManageProgramList() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => { fetchPrograms(); }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const data = await programsApi.list();
      setPrograms(data);
    } catch (err) {
      console.error('Error fetching programs:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(programs.length / ROWS_PER_PAGE);
  const paginated = programs.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Manage Programs</h1>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} className="mr-2" />
            Show Filters
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus size={16} className="mr-2" />
            Create Program
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vertical</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-500">Loading...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-500">No programs found</td></tr>
              ) : (
                paginated.map((program) => (
                  <tr key={program.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{program.program_name}</td>
                    <td className="px-4 py-3 text-gray-600">{program.product_category}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {program.vertical.map((v, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded border text-xs font-medium ${STATUS_COLORS[program.status] || STATUS_COLORS.Draft}`}>
                        {program.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/manage-programs/${program.id}/view`)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="View Program"
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
        {programs.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Showing {(page - 1) * ROWS_PER_PAGE + 1}–{Math.min(page * ROWS_PER_PAGE, programs.length)} of {programs.length} items
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
    </div>
  );
}
