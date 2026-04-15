import { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle, X, Smartphone, FlaskConical, Beaker } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { applicationsApi } from '../../services/mockApi';

type Environment = 'test' | 'sandbox';
interface Toast { message: string; type: 'success' | 'error'; }

const ENV_CONFIG: Record<Environment, { label: string; description: string; color: string; icon: React.ReactNode }> = {
  test: {
    label: 'Test Environment',
    description: 'Non-production data for development & QA',
    color: 'border-blue-500 bg-blue-50 text-blue-700',
    icon: <FlaskConical size={18} />,
  },
  sandbox: {
    label: 'Sandbox Environment',
    description: 'Simulated production environment for UAT',
    color: 'border-orange-500 bg-orange-50 text-orange-700',
    icon: <Beaker size={18} />,
  },
};

const isValidMobile = (v: string) => /^[6-9]\d{9}$/.test(v.trim());

export function ApplicationManagementPage() {
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDelete = async () => {
    if (!environment || !isValidMobile(mobile)) return;
    setLoading(true);
    try {
      const result = await applicationsApi.deleteByIdentifier(mobile.trim());
      setShowConfirm(false);
      setMobile('');
      showToast(
        result.deleted_count > 0
          ? `Successfully deleted ${result.deleted_count} application(s) in ${ENV_CONFIG[environment].label}`
          : 'No applications found for this mobile number',
        result.deleted_count > 0 ? 'success' : 'error',
      );
    } catch {
      showToast('Error deleting applications. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = environment !== null && isValidMobile(mobile);
  const mobileError = mobile.length > 0 && !isValidMobile(mobile);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg border max-w-sm
          ${toast.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {toast.type === 'success'
            ? <CheckCircle className="text-green-500 flex-shrink-0" size={18} />
            : <AlertTriangle className="text-red-500 flex-shrink-0" size={18} />}
          <span className={`text-sm font-medium ${toast.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {toast.message}
          </span>
          <button onClick={() => setToast(null)} className="ml-auto text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Application Management</h1>
          <p className="text-sm text-gray-500 mt-1">Delete all applications associated with a mobile number from a specific environment.</p>
        </div>

        {/* Step 1 — Environment */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
            <h2 className="text-sm font-semibold text-gray-800">Select Environment</h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-3">
            {(Object.keys(ENV_CONFIG) as Environment[]).map((env) => {
              const cfg = ENV_CONFIG[env];
              const selected = environment === env;
              return (
                <button
                  key={env}
                  onClick={() => setEnvironment(env)}
                  className={`relative text-left p-4 rounded-lg border-2 transition-all
                    ${selected
                      ? cfg.color + ' shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <div className={`flex items-center space-x-2 mb-1.5 ${selected ? '' : 'text-gray-600'}`}>
                    {cfg.icon}
                    <span className="font-medium text-sm">{cfg.label}</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${selected ? 'opacity-80' : 'text-gray-400'}`}>
                    {cfg.description}
                  </p>
                  {selected && (
                    <span className="absolute top-3 right-3">
                      <CheckCircle size={16} className="text-current opacity-70" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2 — Mobile Number */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center space-x-2">
            <span className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0
              ${environment ? 'bg-blue-600' : 'bg-gray-300'}`}>2</span>
            <h2 className={`text-sm font-semibold ${environment ? 'text-gray-800' : 'text-gray-400'}`}>
              Enter Mobile Number
            </h2>
          </div>
          <div className="p-6">
            <div className="flex items-stretch space-x-2">
              {/* Country code */}
              <div className="flex items-center px-3 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600 font-medium flex-shrink-0 space-x-1.5">
                <Smartphone size={14} className="text-gray-400" />
                <span>+91</span>
              </div>
              {/* Input */}
              <div className="flex-1">
                <Input
                  type="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit mobile number"
                  disabled={!environment}
                  className={`font-mono tracking-wider ${mobileError ? 'border-red-400 focus-visible:ring-red-300' : ''} ${!environment ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>
            {mobileError && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center space-x-1">
                <AlertTriangle size={11} />
                <span>Enter a valid 10-digit Indian mobile number (starting with 6-9)</span>
              </p>
            )}
            {!environment && (
              <p className="text-xs text-gray-400 mt-1.5">Select an environment above to enable this field.</p>
            )}
          </div>
        </div>

        {/* Warning + Action */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-start space-x-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-5">
              <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={17} />
              <div>
                <p className="text-sm font-semibold text-red-800">This action is permanent and irreversible</p>
                <p className="text-xs text-red-700 mt-0.5">
                  All applications linked to the provided mobile number will be
                  {environment ? ` permanently deleted from ${ENV_CONFIG[environment].label}.` : ' permanently deleted.'}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={!canProceed}
              className="w-full bg-red-600 hover:bg-red-700 text-white h-11 text-sm font-medium disabled:opacity-50"
            >
              <Trash2 size={16} className="mr-2" />
              Delete Applications
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && environment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Confirm Deletion</h3>
                <p className="text-xs text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 mb-5 text-sm">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-gray-500">Environment</span>
                <span className={`font-medium px-2 py-0.5 rounded text-xs ${ENV_CONFIG[environment].color}`}>
                  {ENV_CONFIG[environment].label}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-gray-500">Mobile Number</span>
                <span className="font-mono font-semibold text-gray-900">+91 {mobile}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center mb-5">
              All applications linked to this mobile number in <strong>{ENV_CONFIG[environment].label}</strong> will be permanently removed.
            </p>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 size={15} className="mr-2" />
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
