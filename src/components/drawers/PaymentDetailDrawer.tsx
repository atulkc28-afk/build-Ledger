import React, { useState } from 'react';
import { Eye, FileText, Plus } from 'lucide-react';
import { Drawer } from '../common/Drawer';
import { StatusBadge } from '../common/StatusBadge';
import { DocumentPreviewModal } from '../modals/DocumentPreviewModal';
import { useApp } from '../../context/AppContext';
import { DocumentRecord, Payment } from '../../types';
import { formatDate, formatDateTime, formatINR } from '../../utils/formatters';

interface PaymentDetailDrawerProps {
  payment: Payment | null;
  onClose: () => void;
  onRecordPartialPayment?: (linkedExpenseId?: string) => void;
}

export const PaymentDetailDrawer: React.FC<PaymentDetailDrawerProps> = ({
  payment,
  onClose,
  onRecordPartialPayment,
}) => {
  const { expenses, purchases, payments, documents } = useApp();
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);

  if (!payment) return null;

  // Compute full owed & paid history across the same linked target
  const linkedExpense = expenses.find(
    (e) =>
      (payment.linkedType === 'expense' && e.id === payment.linkedId) ||
      (payment.linkedType === 'purchase' && e.linkedPurchaseId === payment.linkedId),
  );
  const linkedPurchase = purchases.find(
    (p) => payment.linkedType === 'purchase' && p.id === payment.linkedId,
  );

  const totalOwed = linkedPurchase?.totalAmount ?? linkedExpense?.amount ?? payment.amountPaid;
  const siblingPayments = payments.filter(
    (p) => p.linkedType === payment.linkedType && p.linkedId === payment.linkedId,
  );
  const totalPaidAcrossTranches = siblingPayments.reduce((s, p) => s + p.amountPaid, 0);
  const outstandingAmount = Math.max(0, totalOwed - totalPaidAcrossTranches);

  const proofDocs = documents.filter(
    (d) => payment.documentIds.includes(d.id) || d.relatedId === payment.id,
  );

  return (
    <>
      <Drawer
        open={Boolean(payment)}
        onClose={onClose}
        title={`${payment.id} · ${payment.recipient}`}
        subtitle={`Recorded by ${payment.recordedBy} on ${formatDateTime(payment.recordedAt)}`}
      >
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E6E9EF] flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-[#707987]">This Payment Tranche</div>
              <div className="mt-0.5 text-2xl font-bold font-mono tabular-nums text-[#172B4D]">
                {formatINR(payment.amountPaid)}
              </div>
              <div className="mt-1 text-xs text-[#707987]">
                {payment.paymentMethod} · Ref{' '}
                <span className="font-mono text-[#172B4D]">{payment.referenceNumber}</span>
              </div>
            </div>
            <StatusBadge label={payment.status} size="md" />
          </div>

          {/* Linked Obligation Breakdown */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl border border-[#E6E9EF]">
            <div>
              <div className="text-[11px] text-[#707987]">Total Owed</div>
              <div className="text-sm font-bold font-mono tabular-nums text-[#172B4D]">
                {formatINR(totalOwed)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#707987]">Total Paid</div>
              <div className="text-sm font-bold font-mono tabular-nums text-[#15803D]">
                {formatINR(totalPaidAcrossTranches)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#707987]">Outstanding</div>
              <div className="text-sm font-bold font-mono tabular-nums text-[#D97706]">
                {formatINR(outstandingAmount)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm border-t border-b border-[#E6E9EF] py-4">
            <div>
              <div className="text-xs text-[#707987]">Linked Record</div>
              <div className="mt-0.5 font-medium text-[#172B4D]">{payment.linkedLabel}</div>
            </div>
            <div>
              <div className="text-xs text-[#707987]">Payment Date</div>
              <div className="mt-0.5 font-mono text-[#172B4D]">
                {formatDate(payment.paymentDate)}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#707987]">Recipient</div>
              <div className="mt-0.5 font-medium text-[#172B4D]">{payment.recipient}</div>
            </div>
            <div>
              <div className="text-xs text-[#707987]">Recorded By</div>
              <div className="mt-0.5 font-medium text-[#172B4D]">{payment.recordedBy}</div>
            </div>
          </div>

          {payment.notes && (
            <div>
              <div className="text-xs font-semibold text-[#172B4D] mb-1">Notes</div>
              <p className="text-sm text-[#20252D]">{payment.notes}</p>
            </div>
          )}

          {/* All Partial Payments for Same Linked Target */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#172B4D]">
                Payment Tranches for {payment.linkedId} ({siblingPayments.length})
              </span>
              {outstandingAmount > 0 && onRecordPartialPayment && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRecordPartialPayment(linkedExpense?.id);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Pay Balance
                </button>
              )}
            </div>
            <div className="space-y-2">
              {siblingPayments.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs ${
                    p.id === payment.id
                      ? 'border-[#172B4D] bg-[#F7F8FA]'
                      : 'border-[#E6E9EF] bg-white'
                  }`}
                >
                  <div>
                    <span className="font-mono font-semibold text-[#172B4D]">{p.id}</span> ·{' '}
                    <span className="text-[#707987]">
                      {formatDate(p.paymentDate)} · {p.paymentMethod} ({p.referenceNumber})
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-[#15803D]">
                    {formatINR(p.amountPaid)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Proofs */}
          <div>
            <div className="text-xs font-semibold text-[#172B4D] mb-2">
              Payment Proof ({proofDocs.length})
            </div>
            {proofDocs.length === 0 ? (
              <div className="text-xs text-[#707987] py-3 px-4 rounded-lg border border-dashed border-[#E6E9EF]">
                No transfer receipt attached for this tranche.
              </div>
            ) : (
              <div className="space-y-2">
                {proofDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-[#E6E9EF]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-[#172B4D] shrink-0" />
                      <span className="text-xs font-medium text-[#172B4D] truncate">
                        {doc.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-[#E6E9EF] hover:bg-[#F0F2F5] cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Drawer>

      <DocumentPreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
    </>
  );
};
