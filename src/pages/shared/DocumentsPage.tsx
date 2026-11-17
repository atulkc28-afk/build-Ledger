import React, { useMemo, useState } from 'react';
import { Download, Eye, FileText, Plus, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../../components/common/EmptyState';
import { DocumentUploadModal } from '../../components/modals/DocumentUploadModal';
import {
  DocumentPreviewModal,
  triggerDocumentDownload,
} from '../../components/modals/DocumentPreviewModal';
import { DocumentCategory, DocumentRecord } from '../../types';
import { formatDate } from '../../utils/formatters';

const DOC_CATEGORIES: ('All' | DocumentCategory)[] = [
  'All',
  'Invoices',
  'Receipts',
  'Purchase orders',
  'Payment proofs',
  'Contracts',
  'Progress photographs',
  'Other documents',
];

export const DocumentsPage: React.FC = () => {
  const { activeProject, documents } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | DocumentCategory>('All');
  const [dateFilter, setDateFilter] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);

  const filteredDocs = useMemo(() => {
    return documents
      .filter((d) => d.projectId === activeProject.id)
      .filter((d) => {
        if (categoryFilter !== 'All' && d.category !== categoryFilter) return false;
        if (dateFilter && d.uploadDate < dateFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            d.name.toLowerCase().includes(q) ||
            (d.relatedLabel || '').toLowerCase().includes(q) ||
            d.uploadedBy.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.uploadDate.localeCompare(a.uploadDate));
  }, [documents, activeProject.id, categoryFilter, dateFilter, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#172B4D]">Documents</h1>
          <p className="mt-1 text-sm text-[#707987]">
            Centralised repository of invoices, delivery challans, payment proofs, contracts, and
            site photos
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {DOC_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
              categoryFilter === cat
                ? 'bg-[#172B4D] text-white border-[#172B4D]'
                : 'bg-white text-[#20252D] border-[#E6E9EF] hover:bg-[#F0F2F5]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search & Date */}
      <div className="bg-white border border-[#E6E9EF] rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#707987] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by file name, expense/PO ID, or uploader..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
          />
        </div>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          aria-label="Filter documents from date"
          className="px-3 py-2 text-xs font-mono rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
        />
      </div>

      {filteredDocs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents found"
          description="Upload vendor invoices, payment screenshots, or site photographs to keep a transparent project audit trail."
          actionLabel="Upload Document"
          onAction={() => setUploadOpen(true)}
        />
      ) : (
        <div className="bg-white border border-[#E6E9EF] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[740px]">
              <thead>
                <tr className="border-b border-[#E6E9EF] bg-[#F7F8FA] text-[11px] font-semibold text-[#707987]">
                  <th className="py-3 px-4">Document Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Related Record</th>
                  <th className="py-3 px-4">Uploaded By</th>
                  <th className="py-3 px-4">Upload Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E9EF] text-xs">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#F7F8FA] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-[#172B4D] shrink-0" />
                        <span className="font-medium text-[#172B4D] truncate max-w-[260px]">
                          {doc.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#707987] whitespace-nowrap">{doc.category}</td>
                    <td className="py-3 px-4 font-mono text-[#20252D] whitespace-nowrap">
                      {doc.relatedLabel || '—'}
                    </td>
                    <td className="py-3 px-4 text-[#707987] whitespace-nowrap">
                      {doc.uploadedBy}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#707987] whitespace-nowrap">
                      {formatDate(doc.uploadDate)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#707987] whitespace-nowrap">
                      {doc.fileType} · {doc.fileSize}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E6E9EF] text-[#172B4D] hover:bg-[#F0F2F5] cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerDocumentDownload(doc)}
                          aria-label={`Download ${doc.name}`}
                          className="p-1.5 rounded-md border border-[#E6E9EF] text-[#707987] hover:text-[#172B4D] hover:bg-[#F0F2F5] cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DocumentUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <DocumentPreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
    </div>
  );
};
