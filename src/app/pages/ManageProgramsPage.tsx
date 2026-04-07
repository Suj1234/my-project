import { useState } from 'react';
import { Eye, Plus, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

interface Program {
  id: string;
  name: string;
  productCategory: string;
  vertical: 'RETAIL' | 'GOLD' | 'MSME';
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
}

const MOCK_PROGRAMS: Program[] = [
  { id: '1',  name: 'Demo PL',                    productCategory: 'PERSONAL_LOAN',  vertical: 'RETAIL', status: 'ACTIVE' },
  { id: '2',  name: 'Sample Test Cases',           productCategory: 'PERSONAL_LOAN',  vertical: 'GOLD',   status: 'ACTIVE' },
  { id: '3',  name: 'TestSMB',                     productCategory: 'PERSONAL_LOAN',  vertical: 'GOLD',   status: 'ACTIVE' },
  { id: '4',  name: 'Smart Block Personal Loan',   productCategory: 'PERSONAL_LOAN',  vertical: 'GOLD',   status: 'ACTIVE' },
  { id: '5',  name: 'CI MSME LOAN',                productCategory: 'BUSINESS_LOAN',  vertical: 'MSME',   status: 'ACTIVE' },
  { id: '6',  name: 'Test Condition',              productCategory: 'PERSONAL_LOAN',  vertical: 'MSME',   status: 'ACTIVE' },
  { id: '7',  name: 'CIMSME',                      productCategory: 'BUSINESS_LOAN',  vertical: 'MSME',   status: 'ACTIVE' },
  { id: '8',  name: 'genPLDemo',                   productCategory: 'PERSONAL_LOAN',  vertical: 'GOLD',   status: 'ACTIVE' },
  { id: '9',  name: 'DemoPL',                      productCategory: 'PERSONAL_LOAN',  vertical: 'GOLD',   status: 'ACTIVE' },
  { id: '10', name: 'CIMSME01',                    productCategory: 'BUSINESS_LOAN',  vertical: 'MSME',   status: 'ACTIVE' },
  { id: '11', name: 'MSME Pilot Program',          productCategory: 'BUSINESS_LOAN',  vertical: 'MSME',   status: 'INACTIVE' },
  { id: '12', name: 'Gold Loan Express',           productCategory: 'PERSONAL_LOAN',  vertical: 'GOLD',   status: 'DRAFT' },
  { id: '13', name: 'Retail Fast Track',           productCategory: 'PERSONAL_LOAN',  vertical: 'RETAIL', status: 'ACTIVE' },
  { id: '14', name: 'SME Business Plus',           productCategory: 'BUSINESS_LOAN',  vertical: 'MSME',   status: 'ACTIVE' },
  { id: '15', name: 'Personal Loan Premium',       productCategory: 'PERSONAL_LOAN',  vertical: 'GOLD',   status: 'ACTIVE' },
];

const ROWS_PER_PAGE = 10;

const VERTICAL_COLORS: Record<string, string> = {
  RETAIL: 'bg-blue-50 text-blue-700 border-blue-200',
  GOLD:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  MSME:   'bg-purple-50 text-purple-700 border-purple-200',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  INACTIVE: 'bg-gray-100 text-gray-500 border-gray-200',
  DRAFT:    'bg-orange-50 text-orange-600 border-orange-200',
};

interface ManageProgramsPageProps {
  onOpenCanvas: () => void;
}

export function ManageProgramsPage({ onOpenCanvas }: ManageProgramsPageProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(MOCK_PROGRAMS.length / ROWS_PER_PAGE);
  const paginated = MOCK_PROGRAMS.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Page header */}
      <div className="px-8 pt-6 pb-4 border-b border-gray-100">
        <h1 className="text-xl font-semibold text-gray-900">Manage Programs</h1>
      </div>

      {/* Toolbar */}
      <div className="px-8 py-3 flex items-center justify-end gap-3 border-b border-gray-100 bg-gray-50/50">
        <Button variant="outline" size="sm" className="gap-2 text-gray-600 border-gray-300 text-xs">
          <SlidersHorizontal size={13} />
          Show Filters
        </Button>
        <Button size="sm" className="gap-2 text-xs" style={{ backgroundColor: '#0B6B5A' }}>
          <Plus size={13} />
          Create Program
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-8 py-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2.5 pr-6 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Program Name
              </th>
              <th className="text-left py-2.5 pr-6 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Product Category
              </th>
              <th className="text-left py-2.5 pr-6 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Vertical
              </th>
              <th className="text-left py-2.5 pr-6 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="text-left py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((program, i) => (
              <tr
                key={program.id}
                className={`border-b border-gray-100 hover:bg-gray-50/80 transition-colors ${
                  i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                }`}
              >
                <td className="py-3 pr-6 text-gray-800 font-medium text-sm">{program.name}</td>
                <td className="py-3 pr-6 text-gray-600 text-xs">{program.productCategory}</td>
                <td className="py-3 pr-6">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded border text-xs font-medium ${VERTICAL_COLORS[program.vertical]}`}>
                    {program.vertical}
                  </span>
                </td>
                <td className="py-3 pr-6">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded border text-xs font-medium ${STATUS_COLORS[program.status]}`}>
                    {program.status}
                  </span>
                </td>
                <td className="py-3">
                  <button
                    onClick={onOpenCanvas}
                    title="Open Canvas"
                    className="p-1.5 rounded text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                  >
                    <Eye size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Showing {(page - 1) * ROWS_PER_PAGE + 1}–{Math.min(page * ROWS_PER_PAGE, MOCK_PROGRAMS.length)} of {MOCK_PROGRAMS.length} items
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 hover:bg-gray-100"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                  p === page
                    ? 'text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                style={p === page ? { backgroundColor: '#0B6B5A' } : {}}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 hover:bg-gray-100"
            >
              <ChevronRight size={14} />
            </button>
            <span className="text-xs text-gray-400 ml-2">Rows per page</span>
            <span className="text-xs text-gray-600 font-medium ml-1">{ROWS_PER_PAGE}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
