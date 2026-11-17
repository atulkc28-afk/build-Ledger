import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { FileUploadField } from '../common/FileUploadField';

interface DisputeModalProps {
  open: boolean;
  onClose: () => void;
  recordLabel: string;
  onSubmitDispute: (reason: string, description: string, attachmentName?: string) => void;
}

const DISPUTE_REASONS = [
  'Quantity mismatch against delivery',
  'Rate / unit price discrepancy',
  'Missing or unclear supporting invoice',
  'Duplicate billing entry',
  'Work quality or scope concern',
  'Other discrepancy',
];

export const DisputeModal: React.FC<DisputeModalProps> = ({
  open,
  onClose,
  recordLabel,
  onSubmitDispute,
}) => {
  const [reason, setReason] = useState(DISPUTE_REASONS[0]);
  const [description, setDescription] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setReason(DISPUTE_REASONS[0]);
    setDescription('');
    setAttachmentName('');
    setError('');
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please describe the discrepancy so the contractor can respond.');
      return;
    }
    onSubmitDispute(reason, description.trim(), attachmentName || undefined);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Raise Dispute · ${recordLabel}`}
      subtitle="Flagging a record keeps it visible in audit history until clarified"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#20252D] mb-1">
            Dispute Reason *
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] bg-white focus:outline-none focus:border-[#172B4D]"
          >
            {DISPUTE_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#20252D] mb-1">
            Detailed Explanation *
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Specify the invoice line item, site count difference, or clarification needed..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
          />
          {error && <p className="mt-1 text-xs text-[#DC2626]">{error}</p>}
        </div>

        <FileUploadField
          label="Supporting Photo or Note (Optional)"
          fileName={attachmentName}
          onChange={setAttachmentName}
          sampleFileName="Site_Tally_Photo_Note.jpg"
        />

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
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#DC2626] text-white hover:bg-[#B91C1C] cursor-pointer"
          >
            Submit Dispute
          </button>
        </div>
      </form>
    </Modal>
  );
};
