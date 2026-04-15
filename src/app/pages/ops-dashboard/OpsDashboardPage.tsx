import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Eye, Search, Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { programsApi, applicationsApi } from '../../services/mockApi';
import type { Program } from '../../types/program';
import type { Application } from '../../types/opsDashboard';

const getStatusColor = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s.includes('approved') || s.includes('disbursed') || s.includes('sanctioned')) return 'bg-green-100 text-green-800';
  if (s.includes('rejected') || s.includes('declined') || s.includes('failed')) return 'bg-red-100 text-red-800';
  if (s.includes('pending') || s.includes('awaiting')) return 'bg-yellow-100 text-yellow-800';
  if (s.includes('initiated') || s.includes('collection')) return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-800';
};

const formatCurrency = (value: unknown) => {
  if (!value) return '-';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value));
};

const formatDate = (d: string) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export function OpsDashboardPage() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => { programsApi.list().then(setPrograms); }, []);

  useEffect(() => {
    if (!selectedProgram) { setApplications([]); return; }
    setLoading(true);
    applicationsApi.list(selectedProgram).then(setApplications).catch(console.error).finally(() => setLoading(false));
  }, [selectedProgram]);

  const filtered = applications.filter((a) => {
    const matchSearch = !search || JSON.stringify(a).toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    const av = String(a[sortField] || ''); const bv = String(b[sortField] || '');
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ChevronDown size={13} className="text-gray-300 ml-1" />;
    return sortDir === 'asc' ? <ChevronUp size={13} className="text-blue-600 ml-1" /> : <ChevronDown size={13} className="text-blue-600 ml-1" />;
  };

  const statuses = [...new Set(applications.map((a) => a.status))];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Ops Dashboard</h1>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter size={16} className="mr-2" />{showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      {/* Program selector */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">Select Program:</span>
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="bg-white/10 border border-white/30 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[280px]"
          >
            <option value="" className="text-gray-900">-- Select a Program --</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id} className="text-gray-900">{p.program_name} ({p.program_code})</option>
            ))}
          </select>
        </div>
        {selectedProgram && (
          <Badge className="bg-white/20 text-white border-white/30">
            {programs.find((p) => p.id === selectedProgram)?.program_code}
          </Badge>
        )}
      </div>

      {!selectedProgram ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
          <p className="text-base">Select a program above to view applications</p>
        </div>
      ) : (
        <>
          {/* Search + Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input placeholder="Search applications..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              {(search || statusFilter) && (
                <button onClick={() => { setSearch(''); setStatusFilter(''); }} className="flex items-center text-sm text-gray-500 hover:text-gray-800">
                  <X size={14} className="mr-1" />Clear
                </button>
              )}
            </div>

            {showFilters && (
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
                  <Select value={statusFilter || '__all__'} onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Status</SelectItem>
                      {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Applications table */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Applications ({sorted.length})</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    { key: 'application_id', label: 'Application ID' },
                    { key: 'status', label: 'Status' },
                    { key: 'customer_name', label: 'Customer Name' },
                    { key: 'loan_amount', label: 'Loan Amount' },
                    { key: 'created_at', label: 'Created Date' },
                  ].map(({ key, label }) => (
                    <TableHead key={key} className="cursor-pointer select-none" onClick={() => toggleSort(key)}>
                      <div className="flex items-center">{label}<SortIcon field={key} /></div>
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10">Loading...</TableCell></TableRow>
                ) : sorted.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-gray-500">No applications found</TableCell></TableRow>
                ) : sorted.map((app) => (
                  <TableRow key={app.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-blue-600">{app.application_id}</TableCell>
                    <TableCell><Badge className={`${getStatusColor(app.status)} text-xs`}>{app.status}</Badge></TableCell>
                    <TableCell>{String(app.customer_name || '-')}</TableCell>
                    <TableCell>{formatCurrency(app.loan_amount)}</TableCell>
                    <TableCell className="text-sm text-gray-600">{formatDate(app.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => navigate(`/ops-dashboard/${app.id}/view?program_id=${selectedProgram}`)} className="p-2 hover:bg-gray-100 rounded-full">
                        <Eye size={16} className="text-blue-600" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
