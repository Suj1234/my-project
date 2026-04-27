import { useState, useRef } from 'react';
import { X, Download, Upload, AlertCircle } from 'lucide-react';
import { masterManagementApi } from '../../../services/mockApi';
import type { Master } from '../../../types/masterManagement';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  master: Master;
}

type UploadAction = 'CREATE' | 'UPDATE' | '';

export function UploadFileDialog({ open, onClose, onSuccess, master }: Props) {
  const [uploadAction, setUploadAction] = useState<UploadAction>('');
  const [actionOpen, setActionOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleClose = () => {
    setUploadAction('');
    setSelectedFile(null);
    setError('');
    onClose();
  };

  const handleDownloadTemplate = (type: 'add' | 'edit') => {
    const headers = master.fields.map((f) => f.fieldName);
    const rows = type === 'edit' ? [['id', ...headers].join(',')] : [headers.join(',')];
    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${master.masterCode}_${type}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!uploadAction) { setError('Please select an upload action'); return; }
    if (!selectedFile) { setError('Please select a file to upload'); return; }
    try {
      setUploading(true);
      setError('');
      // simulate parsing and uploading — in real integration this would parse the CSV
      await masterManagementApi.uploadRecords(master.id, uploadAction, []);
      handleClose();
      onSuccess();
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Upload Records</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Important banner */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
            <AlertCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-700">
              <span className="font-semibold">Important:</span> Adding new records after approval will create a new version. The existing version will go into deprecated state for existing applications, and this new version will be used in new applications. Please update/edit all records at a single time to avoid creation of multiple versions.
            </p>
          </div>

          {/* Download Templates */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">Download Templates</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-800 mb-1">Add New Records</p>
                <p className="text-xs text-gray-500 mb-3">Use this template to add new records. ID will be auto-generated.</p>
                <button
                  onClick={() => handleDownloadTemplate('add')}
                  className="flex items-center gap-2 text-sm text-blue-600 border border-blue-300 rounded-lg px-3 py-1.5 hover:bg-blue-50"
                >
                  <Download size={14} />
                  Download Add Template
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-800 mb-1">Edit Existing Records</p>
                <p className="text-xs text-gray-500 mb-3">Use this template to edit existing records using their unique IDs.</p>
                <button
                  onClick={() => handleDownloadTemplate('edit')}
                  className="flex items-center gap-2 text-sm text-blue-600 border border-blue-300 rounded-lg px-3 py-1.5 hover:bg-blue-50"
                >
                  <Download size={14} />
                  Download Edit Template
                </button>
              </div>
            </div>
          </div>

          {/* Field Information */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">Field Information</p>
            <div className="border border-gray-200 rounded-lg p-4 space-y-2">
              {master.fields.map((f) => (
                <div key={f.id}>
                  <p className="text-sm font-medium text-gray-800">{f.fieldName}</p>
                  <p className="text-xs text-gray-500">Type: {f.dataType}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Upload File */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Upload File</p>
            <p className="text-xs text-gray-500 mb-3">Supports both adding new records and editing existing ones</p>

            {/* Upload Action dropdown */}
            <div className="relative mb-3">
              <button
                type="button"
                onClick={() => setActionOpen((v) => !v)}
                className={`w-full flex items-center justify-between border rounded-lg px-3 py-2.5 text-sm ${!uploadAction ? 'text-gray-400 border-gray-300' : 'text-gray-800 border-gray-300'} bg-white focus:outline-none`}
              >
                <span>{uploadAction || 'Upload Action *'}</span>
                <span className="text-gray-400">{actionOpen ? '▲' : '▼'}</span>
              </button>
              {actionOpen && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 overflow-hidden">
                  {(['CREATE', 'UPDATE'] as const).map((action) => (
                    <button
                      key={action}
                      onClick={() => { setUploadAction(action); setActionOpen(false); setError(''); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${uploadAction === action ? 'bg-blue-600 text-white hover:bg-blue-600' : 'text-gray-700'}`}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* File picker */}
            {uploadAction && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => { setSelectedFile(e.target.files?.[0] ?? null); setError(''); }}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg py-8 flex flex-col items-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <Upload size={24} className="text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {selectedFile ? selectedFile.name : 'Click to select a file (.csv, .xlsx)'}
                  </p>
                </button>
              </div>
            )}

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
            onClick={handleUpload}
            disabled={uploading}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60 flex items-center gap-2"
          >
            <Upload size={14} />
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>
    </div>
  );
}
