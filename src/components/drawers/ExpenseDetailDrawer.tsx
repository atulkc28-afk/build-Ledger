import React, { useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Eye,
  FileText,
  MessageSquare,
  Send,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { Drawer } from '../common/Drawer';
import { StatusBadge } from '../common/StatusBadge';
import { FileUploadField } from '../common/FileUploadField';
import { DisputeModal } from '../modals/DisputeModal';
import { DocumentPreviewModal } from '../modals/DocumentPreviewModal';
import { useApp } from '../../context/AppContext';
import { DocumentRecord, Expense } from '../../types';
import { formatDate, formatDateTime, formatINR } from '../../utils/formatters';
import { getExpensePaymentStats } from '../../utils/calculations';

interface ExpenseDetailDrawerProps {
  expense: Expense | null;
  onClose: () => void;
  onEdit?: (expense: Expense) => void;
  onRecordPayment?: (expenseId: string) => void;
}

export const ExpenseDetailDrawer: React.FC<ExpenseDetailDrawerProps> = ({
  expense,
  onClose,
  onEdit,
  onRecordPayment,
}) => {
  const {
    currentRole,
    documents,
    payments,
    acknowledgeRecord,
    raiseDispute,
    respondToDispute,
    addComment,
  } = useApp();

  const [commentText, setCommentText] = useState('');
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyAttachment, setReplyAttachment] = useState('');
  const [markResolved, setMarkResolved] = useState(true);

  if (!expense) return null;

  const attachedDocs = documents.filter(
    (d) => expense.documentIds.includes(d.id) || d.relatedId === expense.id,
  );
  const payStats = getExpensePaymentStats(expense, payments);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment('expense', expense.id, commentText);
    setCommentText('');
  };

  const handleRespondDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    respondToDispute(
      'expense',
      expense.id,
      replyText.trim(),
      markResolved,
      replyAttachment || undefined,
    );
    setReplyText('');
    setReplyAttachment('');
  };

  return (
    <>
      <Drawer
        open={Boolean(expense)}
        onClose={onClose}
        title={`${expense.id} · ${expense.description}`}
        subtitle={`Submitted by ${expense.submittedBy} on ${formatDateTime(expense.submittedAt)}`}
      >
        <div className="space-y-6">
          {/* Status + Amount Summary */}
          <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E6E9EF] flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-[#707987]">Recorded Expense Amount</div>
              <div className="mt-0.5 text-2xl font-bold font-mono tabular-nums text-[#172B4D]">
                {formatINR(expense.amount)}
              </div>
              <div className="mt-1 text-xs text-[#707987]">
                Paid: <span className="font-mono text-[#15803D]">{formatINR(payStats.amountPaid)}</span>{' '}
                · Due:{' '}
                <span className="font-mono text-[#D97706]">{formatINR(payStats.outstandingAmount)}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge label={expense.status} size="md" />
              <span className="text-[11px] text-[#707987]">
                Payment Status: {payStats.statusLabel}
              </span>
            </div>
          </div>

          {/* Role Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {currentRole === 'homeowner' && expense.status !== 'Approved' && expense.status !== 'Draft' && (
              <button
                type="button"
                onClick={() => acknowledgeRecord('expense', expense.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#16A34A] text-white hover:bg-[#15803D] cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Acknowledge Expense
              </button>
            )}
            {currentRole === 'homeowner' && expense.status !== 'Disputed' && expense.status !== 'Draft' && (
              <button
                type="button"
                onClick={() => setDisputeModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2] cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                Raise Dispute
              </button>
            )}
            {currentRole === 'contractor' && expense.status !== 'Approved' && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(expense);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#E6E9EF] bg-white text-[#172B4D] hover:bg-[#F0F2F5] cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Details
              </button>
            )}
            {payStats.outstandingAmount > 0 && expense.status !== 'Draft' && onRecordPayment && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRecordPayment(expense.id);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 cursor-pointer"
              >
                Record Payment
              </button>
            )}
          </div>

          {currentRole === 'homeowner' && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[#F7F8FA] border border-[#E6E9EF] text-xs text-[#707987]">
              <ShieldAlert className="w-4 h-4 text-[#172B4D] shrink-0 mt-0.5" />
              <span>
                Acknowledging this expense confirms review of contractor-submitted figures and does
                not constitute independent professional verification.
              </span>
            </div>
          )}

          {/* Core Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm border-t border-b border-[#E6E9EF] py-4">
            <div>
              <div className="text-xs text-[#707987]">Category</div>
              <div className="mt-0.5 font-medium text-[#172B4D]">{expense.category}</div>
            </div>
            <div>
              <div className="text-xs text-[#707987]">Expense Date</div>
              <div className="mt-0.5 font-mono text-[#172B4D]">{formatDate(expense.date)}</div>
            </div>
            <div>
              <div className="text-xs text-[#707987]">Vendor / Supplier</div>
              <div className="mt-0.5 font-medium text-[#172B4D]">{expense.vendor}</div>
            </div>
            <div>
              <div className="text-xs text-[#707987]">Payment Method</div>
              <div className="mt-0.5 font-medium text-[#172B4D]">{expense.paymentMethod}</div>
            </div>
            <div>
              <div className="text-xs text-[#707987]">Construction Stage</div>
              <div className="mt-0.5 font-medium text-[#172B4D]">{expense.stageName}</div>
            </div>
            <div>
              <div className="text-xs text-[#707987]">Linked Purchase Order</div>
              <div className="mt-0.5 font-mono text-[#172B4D]">
                {expense.linkedPurchaseId || 'Standalone Expense'}
              </div>
            </div>
          </div>

          {expense.notes && (
            <div>
              <div className="text-xs font-semibold text-[#172B4D] mb-1">Contractor Notes</div>
              <p className="text-sm text-[#20252D] leading-relaxed">{expense.notes}</p>
            </div>
          )}

          {/* Dispute Box */}
          {expense.dispute && (
            <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#B91C1C]">
                  Dispute: {expense.dispute.reason}
                </span>
                <span className="text-[11px] font-mono text-[#B91C1C]">
                  {formatDateTime(expense.dispute.raisedAt)}
                </span>
              </div>
              <p className="text-xs text-[#7F1D1D] leading-relaxed">
                {expense.dispute.description}
              </p>
              {expense.dispute.contractorResponse && (
                <div className="pt-2 border-t border-[#FECACA] text-xs text-[#172B4D]">
                  <span className="font-semibold">Contractor Response: </span>
                  {expense.dispute.contractorResponse}
                </div>
              )}

              {currentRole === 'contractor' && !expense.dispute.resolved && (
                <form onSubmit={handleRespondDispute} className="pt-2 space-y-3 border-t border-[#FECACA]">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write clarification or explain credit note..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E6E9EF] bg-white focus:outline-none focus:border-[#172B4D]"
                  />
                  <FileUploadField
                    label="Attach Revised Bill or Challan (Optional)"
                    fileName={replyAttachment}
                    onChange={setReplyAttachment}
                    sampleFileName="Revised_Supplier_Challan.pdf"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-[#20252D] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={markResolved}
                        onChange={(e) => setMarkResolved(e.target.checked)}
                      />
                      <span>Resubmit for homeowner acknowledgement</span>
                    </label>
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 cursor-pointer"
                    >
                      Send Response
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Attached Documents */}
          <div>
            <div className="text-xs font-semibold text-[#172B4D] mb-2">
              Invoices & Receipts ({attachedDocs.length})
            </div>
            {attachedDocs.length === 0 ? (
              <div className="text-xs text-[#707987] py-3 px-4 rounded-lg border border-dashed border-[#E6E9EF]">
                No supporting documents uploaded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {attachedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[#E6E9EF] bg-white"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-[#172B4D] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[#172B4D] truncate">
                          {doc.name}
                        </div>
                        <div className="text-[11px] text-[#707987]">
                          {doc.fileType} · {doc.fileSize} · {formatDate(doc.uploadDate)}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-[#E6E9EF] text-[#172B4D] hover:bg-[#F0F2F5] shrink-0 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approval & Audit History */}
          <div>
            <div className="text-xs font-semibold text-[#172B4D] mb-2">Audit & Approval History</div>
            <div className="space-y-2 border-l border-[#E6E9EF] pl-3 ml-1">
              {expense.history.length === 0 ? (
                <div className="text-xs text-[#707987]">
                  Submitted on {formatDateTime(expense.submittedAt)}
                </div>
              ) : (
                expense.history.map((h) => (
                  <div key={h.id} className="text-xs">
                    <div className="font-medium text-[#20252D]">{h.action}</div>
                    <div className="text-[11px] text-[#707987]">
                      {h.actorName} ({h.actorRole}) · {formatDateTime(h.timestamp)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Comments */}
          <div>
            <div className="text-xs font-semibold text-[#172B4D] mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Notes & Comments ({expense.comments.length})
            </div>
            <div className="space-y-2 mb-3">
              {expense.comments.map((c) => (
                <div key={c.id} className="p-3 rounded-lg bg-[#F7F8FA] border border-[#E6E9EF]">
                  <div className="flex items-center justify-between text-[11px] text-[#707987]">
                    <span className="font-semibold text-[#172B4D]">
                      {c.authorName} ({c.authorRole})
                    </span>
                    <span className="font-mono">{formatDateTime(c.timestamp)}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#20252D]">{c.text}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment or question on this expense..."
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Post
              </button>
            </form>
          </div>
        </div>
      </Drawer>

      <DisputeModal
        open={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        recordLabel={expense.id}
        onSubmitDispute={(reason, description, att) =>
          raiseDispute('expense', expense.id, reason, description, att)
        }
      />

      <DocumentPreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
    </>
  );
};
