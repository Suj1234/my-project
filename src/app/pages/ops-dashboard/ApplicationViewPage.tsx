import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { applicationsApi, opsDashboardConfigApi } from '../../services/mockApi';
import type { Application } from '../../types/opsDashboard';
import type { OpsDashboardConfig } from '../../types/program';

const getStatusColor = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s.includes('approved') || s.includes('disbursed')) return 'bg-green-100 text-green-800';
  if (s.includes('rejected') || s.includes('declined')) return 'bg-red-100 text-red-800';
  if (s.includes('pending')) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
};

const formatCurrency = (value: unknown) => {
  if (!value) return '-';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value));
};

const CURRENCY_FIELDS = ['loan_amount', 'monthly_income', 'annual_income', 'business_turnover', 'emi_amount'];

export function ApplicationViewPage() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const programId = new URLSearchParams(location.search).get('program_id') || '';

  const [application, setApplication] = useState<Application | null>(null);
  const [config, setConfig] = useState<OpsDashboardConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    if (!appId) return;
    Promise.all([
      applicationsApi.get(appId),
      programId ? opsDashboardConfigApi.get(programId) : Promise.resolve(null),
    ]).then(([app, cfg]) => {
      setApplication(app);
      setConfig(cfg);
      if (cfg?.view_categories?.length) setActiveTab(cfg.view_categories[0].category_name);
    }).catch(console.error).finally(() => setLoading(false));
  }, [appId, programId]);

  if (loading) return <div className="p-6 text-center py-16 text-gray-500">Loading...</div>;
  if (!application) return <div className="p-6 text-center py-16 text-gray-500">Application not found</div>;

  const getAlias = (varName: string) => {
    if (config?.field_aliases?.[varName]) return config.field_aliases[varName];
    return varName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatValue = (value: unknown, varName: string) => {
    if (value === null || value === undefined) return '-';
    if (CURRENCY_FIELDS.includes(varName)) return formatCurrency(value);
    return String(value);
  };

  const hasViewCategories = config?.view_categories && config.view_categories.length > 0;

  const renderFields = (fields: { variable_name: string }[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((f, i) => (
        <div key={i} className="bg-gray-50 rounded p-3">
          <p className="text-xs text-gray-500 mb-0.5">{getAlias(f.variable_name)}</p>
          <p className="font-medium text-gray-900">{formatValue(application[f.variable_name], f.variable_name)}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate(`/ops-dashboard${programId ? `?program_id=${programId}` : ''}`)} className="mb-3 -ml-2 text-gray-600">
            <ArrowLeft size={16} className="mr-2" />Back to Dashboard
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">Application Details</h1>
          <p className="text-sm text-gray-500 mt-1">ID: {application.application_id}</p>
        </div>
        <Badge className={`${getStatusColor(application.status)} mt-10 text-sm px-3 py-1`}>{application.status}</Badge>
      </div>

      {hasViewCategories ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-gray-200 mb-6">
            <TabsList className="bg-transparent h-auto p-0 space-x-1">
              {config!.view_categories.map((cat) => (
                <TabsTrigger
                  key={cat.category_name}
                  value={cat.category_name}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 px-4 py-2 text-sm"
                >
                  {cat.category_name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {config!.view_categories.map((cat) => (
            <TabsContent key={cat.category_name} value={cat.category_name}>
              <div className="bg-white rounded-lg border p-5">
                {renderFields(cat.fields)}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        /* Default view: show all fields */
        <div className="bg-white rounded-lg border p-5">
          <h2 className="text-base font-semibold mb-4">Application Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(application)
              .filter(([k]) => !['id', 'program_id'].includes(k))
              .map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded p-3">
                  <p className="text-xs text-gray-500 mb-0.5">{getAlias(k)}</p>
                  <p className="font-medium text-gray-900">{formatValue(v, k)}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
