import React from 'react';
import { Download, FileText, ShieldAlert } from 'lucide-react';
import { Modal } from '../common/Modal';
import { DocumentRecord } from '../../types';
import { formatDate } from '../../utils/formatters';

interface DocumentPreviewModalProps {
  document: DocumentRecord | null;
  onClose: () => void;
}

export function triggerDocumentDownload(doc: DocumentRecord) {
  const content = [
    `BUILDLEDGER DOCUMENT RECORD`,
    `===========================`,
    `Document ID: ${doc.id}`,
    `File Name: ${doc.name}`,
    `Category: ${doc.category}`,
    `Related Record: ${doc.relatedLabel || '—'}`,
    `Uploaded By: ${doc.uploadedBy} (${doc.uploadedByRole})`,
    `Upload Date: ${doc.uploadDate}`,
    ``,
    `Summary:`,
    doc.summaryText || 'User-submitted project document.',
    ``,
    `Notice: Document uploaded by user; BuildLedger does not independently verify external authenticity.`,
  ].join('\n');

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement('a');
  a.href = url;
  a.download = doc.name.replace(/\.[^.]+$/, '') + '_record.txt';
  window.document.body.appendChild(a);
  a.click();
  window.document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document: doc,
  onClose,
}) => {
  if (!doc) return null;

  return (
    <Modal
      open={Boolean(doc)}
      onClose={onClose}
      title={doc.name}
      subtitle={`${doc.category} · Uploaded ${formatDate(doc.uploadDate)} by ${doc.uploadedBy}`}
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-4">
        {doc.previewUrl ? (
          <div className="rounded-xl overflow-hidden border border-[#E6E9EF] bg-[#F7F8FA]">
            <img
              src={doc.previewUrl}
              alt={doc.name}
              referrerPolicy="no-referrer"
              className="w-full max-h-[400px] object-cover"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-[#E6E9EF] bg-[#F7F8FA] p-6">
            <div className="flex items-start justify-between gap-4 border-b border-[#E6E9EF] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-[#E6E9EF] flex items-center justify-center text-[#172B4D]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#172B4D]">{doc.name}</div>
                  <div className="text-xs text-[#707987]">
                    {doc.fileType} · {doc.fileSize} · Ref {doc.relatedLabel || doc.id}
                  </div>
                </div>
              </div>
              <span className="font-mono text-xs text-[#707987]">{doc.id}</span>
            </div>

            <div className="mt-4 bg-white border border-[#E6E9EF] rounded-lg p-4 space-y-2">
              <div className="text-xs font-semibold text-[#172B4D]">Extracted Record Summary</div>
              <p className="text-sm text-[#20252D] leading-relaxed">
                {doc.summaryText ||
                  'Supporting construction financial document uploaded for project transparency.'}
              </p>
              <div className="pt-2 text-xs text-[#707987] flex flex-wrap gap-x-4 gap-y-1">
                <span>Uploaded by: {doc.uploadedBy}</span>
                <span>Date: {formatDate(doc.uploadDate)}</span>
                <span>Linked: {doc.relatedLabel || 'Project File'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E]">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            This record reflects a user-uploaded document. Homeowner acknowledgement indicates review
            of the submitted file and does not represent independent third-party verification.
          </span>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#E6E9EF] text-[#20252D] hover:bg-[#F0F2F5] cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => triggerDocumentDownload(doc)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download File
          </button>
        </div>
      </div>
    </Modal>
  );
};
