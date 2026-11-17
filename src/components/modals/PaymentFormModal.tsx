import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../common/Modal';
import { FileUploadField } from '../common/FileUploadField';
import { useApp } from '../../context/AppContext';
import { PaymentMethod } from '../../types';
import { getExpensePaymentStats } from '../../utils/calculations';
import { formatINR } from '../../utils/formatters';

interface PaymentFormModalProps {
  open: boolean;
  onClose: () => void;
  defaultExpenseId?: string;
}

const METHODS: PaymentMethod[] = ['UPI', 'Bank transfer', 'Cash', 'Cheque', 'Other'];

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  open,
  onClose,
  defaultExpenseId,
}) => {
  const { activeProject, expenses, payments, addPayment } = useApp();

  const payableTargets = useMemo(() => {
    return expenses
      .filter((e) => e.projectId === activeProject.id && e.status !== 'Draft')
      .map((e) => {
        const stats = getExpensePaymentStats(e, payments);
        return {
          expense: e,
          stats,
        };
      })
      .filter((item) => item.stats.outstandingAmount > 0);
  }, [expenses, payments, activeProject.id]);

  const [selectedExpenseId, setSelectedExpenseId] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const initial =
      payableTargets.find((t) => t.expense.id === defaultExpenseId) ?? payableTargets[0];
    if (initial) {
      setSelectedExpenseId(initial.expense.id);
      setRecipient(initial.expense.vendor);
      setAmountPaid(String(initial.stats.outstandingAmount));
    } else {
      setSelectedExpenseId('');
      setRecipient('');
      setAmountPaid('');
    }
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod('Bank transfer');
    setReferenceNumber('');
    setNotes('');
    setDocumentName('');
    setError('');
  }, [open, defaultExpenseId]);

  const selectedTarget = payableTargets.find((t) => t.expense.id === selectedExpenseId);

  const handleSelectExpense = (expId: string) => {
    setSelectedExpenseId(expId);
    const found = payableTargets.find((t) => t.expense.id === expId);
    if (found) {
      setRecipient(found.expense.vendor);
      setAmountPaid(String(found.stats.outstandingAmount));
    }
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedTarget) {
      setError('Please select a pending expense or purchase to pay against.');
      return;
    }
    const amt = Math.round(Number(amountPaid));
    if (!amt || amt <= 0) {
      setError('Payment amount must be greater than ₹0.');
      return;
    }
    if (amt > selectedTarget.stats.outstandingAmount) {
      setError(
        `Amount cannot exceed outstanding balance of ${formatINR(selectedTarget.stats.outstandingAmount)}.`,
      );
      return;
    }
    if (!referenceNumber.trim()) {
      setError('Transaction or reference number is required for traceability.');
      return;
    }

    const exp = selectedTarget.expense;
    const linkedType = exp.linkedPurchaseId ? 'purchase' : 'expense';
    const linkedId = exp.linkedPurchaseId ? exp.linkedPurchaseId : exp.id;
    const linkedLabel = exp.linkedPurchaseId
      ? `${exp.linkedPurchaseId} · ${exp.description}`
      : `${exp.id} · ${exp.description}`;

    addPayment({
      linkedType,
      linkedId,
      linkedLabel,
      recipient: recipient.trim() || exp.vendor,
      amountPaid: amt,
      paymentDate,
      paymentMethod,
      referenceNumber: referenceNumber.trim(),
      notes: notes.trim() || undefined,
      documentName: documentName || undefined,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record Payment"
      subtitle="Log an actual disbursement (UPI, NEFT/RTGS, Cheque, Cash) — separate from expense entry"
      maxWidthClass="max-w-xl"
    >
      {payableTargets.length === 0 ? (
        <div className="py-6 text-center text-sm text-[#707987]">
          All recorded expenses for {activeProject.name} are fully paid.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">
              Linked Expense / Purchase *
            </label>
            <select
              value={selectedExpenseId}
              onChange={(e) => handleSelectExpense(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] bg-white focus:outline-none focus:border-[#172B4D]"
            >
              {payableTargets.map(({ expense, stats }) => (
                <option key={expense.id} value={expense.id}>
                  {expense.linkedPurchaseId ? `${expense.linkedPurchaseId} (${expense.id})` : expense.id} ·{' '}
                  {expense.description} — Due {formatINR(stats.outstandingAmount)}
                </option>
              ))}
            </select>
          </div>

          {selectedTarget && (
            <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-[#F7F8FA] border border-[#E6E9EF] text-center">
              <div>
                <div className="text-[11px] text-[#707987]">Total Owed</div>
                <div className="text-sm font-semibold font-mono tabular-nums text-[#172B4D]">
                  {formatINR(selectedTarget.stats.totalOwed)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#707987]">Paid So Far</div>
                <div className="text-sm font-semibold font-mono tabular-nums text-[#15803D]">
                  {formatINR(selectedTarget.stats.amountPaid)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#707987]">Outstanding</div>
                <div className="text-sm font-semibold font-mono tabular-nums text-[#D97706]">
                  {formatINR(selectedTarget.stats.outstandingAmount)}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#20252D] mb-1">Recipient *</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#20252D] mb-1">
                Amount Paid (INR) *
              </label>
              <input
                type="number"
                min="1"
                max={selectedTarget?.stats.outstandingAmount}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#20252D] mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#20252D] mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] bg-white focus:outline-none focus:border-[#172B4D]"
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#20252D] mb-1">
                UTR / Reference No. *
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g., UPI-631490221"
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Partial tranche 1 of 2"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
            />
          </div>

          <FileUploadField
            label="Payment Proof (UPI Screenshot / NEFT Receipt)"
            fileName={documentName}
            onChange={setDocumentName}
            sampleFileName="NEFT_Transfer_Confirmation.pdf"
          />

          {error && <p className="text-xs text-[#DC2626] font-medium">{error}</p>}

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
              Record Payment
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
