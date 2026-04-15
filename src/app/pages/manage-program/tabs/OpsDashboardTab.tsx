import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { opsDashboardConfigApi } from '../../../services/mockApi';
import type { OpsDashboardConfig } from '../../../types/program';
import FiltersConfig from '../ops-dashboard/FiltersConfig';
import ListingColumnsConfig from '../ops-dashboard/ListingColumnsConfig';
import ViewDetailsConfig from '../ops-dashboard/ViewDetailsConfig';

interface Props { programId: string; }

const OpsDashboardTab = ({ programId }: Props) => {
  const [config, setConfig] = useState<OpsDashboardConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchConfig(); }, [programId]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await opsDashboardConfigApi.get(programId);
      setConfig(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateConfig = async (updates: Partial<OpsDashboardConfig>) => {
    const updated = { ...config!, ...updates, program_id: programId };
    await opsDashboardConfigApi.save(updated);
    setConfig(updated);
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading configuration...</div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Ops Dashboard Configuration</h2>
        <p className="text-sm text-gray-600 mt-1">Configure filters, listing columns, and view details for the Operations Portal</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-start space-x-2">
        <Info size={17} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-gray-700">
          <strong>Restrictions:</strong> Maximum 10 filters (native fields only), Maximum 15 listing columns (native fields only)
        </p>
      </div>

      <Tabs defaultValue="filters" className="w-full">
        <TabsList className="bg-white border-b border-gray-200 rounded-none w-full justify-start h-auto p-0">
          {['filters', 'listing', 'view-details'].map((tab, i) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 px-4 py-2 text-sm"
            >
              {['Filter Configuration', 'Listing Columns', 'View Details'][i]}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="filters" className="mt-6">
          <FiltersConfig programId={programId} config={config} updateConfig={updateConfig} />
        </TabsContent>
        <TabsContent value="listing" className="mt-6">
          <ListingColumnsConfig programId={programId} config={config} updateConfig={updateConfig} />
        </TabsContent>
        <TabsContent value="view-details" className="mt-6">
          <ViewDetailsConfig programId={programId} config={config} updateConfig={updateConfig} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OpsDashboardTab;
