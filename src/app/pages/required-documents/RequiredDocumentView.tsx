import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { documentsApi } from '../../services/mockApi';
import type { RequiredDocument } from '../../types/requiredDocument';

export function RequiredDocumentView() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<RequiredDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    documentsApi.get(id).then(setDocument).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6 text-center py-16 text-gray-500">Loading...</div>;
  if (!document) return <div className="p-6 text-center py-16 text-gray-500">Document not found</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate('/required-documents')} className="mb-4 text-gray-600 -ml-2">
            <ArrowLeft size={16} className="mr-2" />Back to Documents
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">Document Details</h1>
        </div>
        <Button onClick={() => navigate(`/required-documents/${id}/edit`)} className="bg-blue-600 hover:bg-blue-700 text-white mt-10">
          <Pencil size={15} className="mr-2" />Edit Details
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Document Information</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><p className="text-sm text-gray-500 mb-1">Document Code</p><p className="font-semibold text-blue-600">{document.document_code || 'N/A'}</p></div>
          <div><p className="text-sm text-gray-500 mb-1">Document Name</p><p className="text-base text-gray-900">{document.document_name}</p></div>
          <div><p className="text-sm text-gray-500 mb-1">Document Category</p><p className="text-base text-gray-900">{document.document_category}</p></div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <Badge className={document.status === 'Active' ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}>{document.status}</Badge>
          </div>
          <div><p className="text-sm text-gray-500 mb-1">Minimum Size</p><p className="text-base text-gray-900">{document.min_size ? `${document.min_size} MB` : 'Not specified'}</p></div>
          <div><p className="text-sm text-gray-500 mb-1">Maximum Size</p><p className="text-base text-gray-900">{document.max_size ? `${document.max_size} MB` : 'Not specified'}</p></div>
          <div><p className="text-sm text-gray-500 mb-1">Created Date</p><p className="text-base text-gray-900">{new Date(document.created_at).toLocaleString()}</p></div>
          <div><p className="text-sm text-gray-500 mb-1">Last Updated</p><p className="text-base text-gray-900">{new Date(document.updated_at).toLocaleString()}</p></div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500 mb-2">Supported Formats</p>
            <div className="flex flex-wrap gap-2">
              {document.supported_formats.map((f) => <Badge key={f} variant="secondary">{f}</Badge>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
