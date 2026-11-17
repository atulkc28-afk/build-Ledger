import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { FileUploadField } from '../common/FileUploadField';
import { useApp } from '../../context/AppContext';
import { DocumentCategory, DocumentRecord } from '../../types';

interface DocumentUploadModalProps {
  open: boolean;
  onClose: () => void;
}

const DOC_CATEGORIES: DocumentCategory[] = [
  'Invoices',
  'Receipts',
  'Purchase orders',
  'Payment proofs',
  'Contracts',
  'Progress photographs',
  'Other documents',
];

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ open, onClose }) => {
  const { expenses, purchases, activeProject, uploadDocument } = useApp();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Invoices');
  const [relatedId, setRelatedId] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName('');
    setCategory('Invoices');
    setRelatedId('');
    setSummaryText('');
    setError('');
  }, [open]);

  const projectExpenses = expenses.filter((e) => e.projectId === activeProject.id);
  const projectPurchases = purchases.filter((p) => p.projectId === activeProject.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Select or attach a file before uploading.');
      return;
    }
    const ext = name.split('.').pop()?.toUpperCase();
    const fileType: DocumentRecord['fileType'] =
      ext === 'JPG' || ext === 'JPEG'
        ? 'JPG'
        : ext === 'PNG'
          ? 'PNG'
          : ext === 'DOCX'
            ? 'DOCX'
            : 'PDF';

    uploadDocument({
      name: name.trim(),
      category,
      relatedId: relatedId || activeProject.id,
      relatedLabel: relatedId || activeProject.name,
      fileType,
      summaryText: summaryText.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload Project Document"
      subtitle="Uploaded documents are stored as submitted user records without automated authenticity claims"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FileUploadField
          label="Document File *"
          fileName={name}
          onChange={setName}
          sampleFileName="Supplier_Tax_Invoice_Nov2026.pdf"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] bg-white focus:outline-none focus:border-[#172B4D]"
            >
              {DOC_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">
              Related Record (Optional)
            </label>
            <select
              value={relatedId}
              onChange={(e) => setRelatedId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] bg-white focus:outline-none focus:border-[#172B4D]"
            >
              <option value="">General Project Document</option>
              {projectExpenses.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.id} · {exp.description}
                </option>
              ))}
              {projectPurchases.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.id} · {po.materialName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#20252D] mb-1">
            Document Summary / Notes
          </label>
          <textarea
            rows={2}
            value={summaryText}
            onChange={(e) => setSummaryText(e.target.value)}
            placeholder="Brief description of what this bill, challan, or contract covers..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
          />
        </div>

        {error && <p className="text-xs text-[#DC2626]">{error}</p>}

        <div className="pt-3 border-t border-[#E6E9EF] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#E6E9EF] text-[#20252D] hover:bg-[#F0F2F5] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 cursor-pointer"
          >
            Upload Document
          </button>
        </div>
      </form>
    </Modal>
  );
};
