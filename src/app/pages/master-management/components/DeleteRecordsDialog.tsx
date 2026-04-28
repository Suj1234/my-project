import { useState, useRef } from 'react';
import { X, Download, Upload, AlertTriangle } from 'lucide-react';
import { masterManagementApi } from '../../../services/mockApi';
import type { Master } from '../../../types/masterManagement';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  master: Master;
}

export function DeleteRecordsDialog({ open, onClose, onSuccess, master }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const primaryField = master.fields.find((f) => f.isPrimary) ?? master.fields[0];

  const handleClose = () => {
    setSelectedFile(null);
    setError('');
    onClose();
  };

  const handleDownloadExistingRecords = () => {
    if (master.records.length === 0) return;
    const headers = ['id', ...master.fields.map((f) => f.fieldName)];
    const rows = master.records.map((r) =>
      headers.map((h) => r[h] ?? '').join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${master.masterCode}_existing_records.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!selectedFile) { setError('Please select a file to upload'); return; }
    try {
      setDeleting(true);
      setError('');
      // In real integration, parse the CSV to extract IDs from the file.
      // Here we pass empty array as placeholder; backend would parse real IDs.
      await masterManagementApi.deleteRecords(master.id, []);
      handleClose();
      onSuccess();
    } catch {
      setError('Delete failed. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Delete Records</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Warning banner */}
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-700">
              <span className="font-semibold">Warning:</span> Deleting records is irreversible and will create a new version of this master. The existing version will go into deprecated state for existing applications, and this new version will be used in new applications. Please verify your file carefully before proceeding.
            </p>
          </div>

          {/* Step 1 — Download existing records */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">Step 1 — Download Existing Records</p>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-800 mb-1">Current Records</p>
              <p className="text-xs text-gray-500 mb-3">
                Download all existing records (with IDs) to identify which ones you want to delete.
                {master.records.length === 0 && (
                  <span className="text-amber-600 font-medium"> No records exist yet.</span>
                )}
              </p>
              <button
                onClick={handleDownloadExistingRecords}
                disabled={master.records.length === 0}
                className="flex items-center gap-2 text-sm text-blue-600 border border-blue-300 rounded-lg px-3 py-1.5 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download size={14} />
                Download Existing Records
              </button>
            </div>
          </div>

          {/* Primary key info */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">Step 2 — Prepare Delete File</p>
            <div className="border border-gray-200 rounded-lg p-4 space-y-2">
              <p className="text-xs text-gray-600">
                Your upload file must contain an <span className="font-semibold text-gray-800">id</span> column. Only records whose IDs appear in the file will be deleted. All other records remain unchanged.
              </p>
              {primaryField && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Primary key field</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{primaryField.fieldName}</p>
                  <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium border border-blue-200 mt-1">
                    {primaryField.dataType}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Step 3 — Upload file */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Step 3 — Upload Delete File</p>
            <p className="text-xs text-gray-500 mb-3">Supports .csv, .xlsx, .xls — must include the <span className="font-medium text-gray-700">id</span> column</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => { setSelectedFile(e.target.files?.[0] ?? null); setError(''); }}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg py-8 flex flex-col items-center gap-2 hover:border-red-400 hover:bg-red-50 transition-colors"
            >
              <Upload size={24} className="text-gray-400" />
              <p className="text-sm text-gray-600">
                {selectedFile ? selectedFile.name : 'Click to select a file (.csv, .xlsx)'}
              </p>
            </button>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handleClose}
            className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-60 flex items-center gap-2"
          >
            <Upload size={14} />
            {deleting ? 'Deleting...' : 'Delete Records'}
          </button>
        </div>
      </div>
    </div>
  );
}
