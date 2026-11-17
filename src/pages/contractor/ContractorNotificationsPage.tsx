import React, { useState } from 'react';
import { AlertCircle, Bell, CheckCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FileUploadField } from '../../components/common/FileUploadField';
import { formatDateTime } from '../../utils/formatters';

export const ContractorNotificationsPage: React.FC = () => {
  const {
    expenses,
    purchases,
    notifications,
    respondToDispute,
    markNotificationRead,
    markAllNotificationsRead,
  } = useApp();

  const [replyById, setReplyById] = useState<Record<string, string>>({});
  const [attachmentById, setAttachmentById] = useState<Record<string, string>>({});

  const disputedExpenses = expenses.filter((e) => e.status === 'Disputed');
  const disputedPurchases = purchases.filter((p) => p.approvalStatus === 'Disputed');

  const contractorNotifications = notifications.filter(
    (n) => n.targetRole === 'contractor' || n.targetRole === 'both',
  );

  const handleSendReply = (kind: 'expense' | 'purchase', id: string) => {
    const text = (replyById[id] || '').trim();
    if (!text) return;
    respondToDispute(kind, id, text, true, attachmentById[id] || undefined);
    setReplyById((prev) => ({ ...prev, [id]: '' }));
    setAttachmentById((prev) => ({ ...prev, [id]: '' }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#172B4D]">Notifications & Homeowner Queries</h1>
          <p className="mt-1 text-sm text-[#707987]">
            Respond to disputed records, attach supporting challans, and monitor homeowner updates
          </p>
        </div>
        <button
          type="button"
          onClick={markAllNotificationsRead}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#E6E9EF] bg-white text-[#172B4D] hover:bg-[#F0F2F5] cursor-pointer"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Mark all read
        </button>
      </div>

      {/* Active Homeowner Disputes */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#172B4D] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#DC2626]" />
          Active Homeowner Disputes ({disputedExpenses.length + disputedPurchases.length})
        </h2>

        {disputedExpenses.length + disputedPurchases.length === 0 ? (
          <div className="bg-white border border-[#E6E9EF] rounded-xl p-6 text-center text-xs text-[#707987]">
            No active disputes from homeowners. All flagged records have been clarified.
          </div>
        ) : (
          <div className="space-y-4">
            {disputedExpenses.map((exp) => (
              <div
                key={exp.id}
                className="bg-white border border-[#FECACA] rounded-xl p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#172B4D]">
                        {exp.id}
                      </span>
                      <StatusBadge label="Disputed" />
                    </div>
                    <div className="text-sm font-semibold text-[#172B4D] mt-1">
                      {exp.description}
                    </div>
                    <div className="text-xs text-[#707987]">
                      Vendor: {exp.vendor} · Raised by {exp.dispute?.raisedBy}
                    </div>
                  </div>
                </div>

                {exp.dispute && (
                  <div className="p-3.5 rounded-lg bg-[#FEF2F2] text-xs space-y-1">
                    <div className="font-semibold text-[#B91C1C]">
                      Reason: {exp.dispute.reason}
                    </div>
                    <div className="text-[#7F1D1D]">{exp.dispute.description}</div>
                  </div>
                )}

                <div className="space-y-3 pt-2 border-t border-[#E6E9EF]">
                  <textarea
                    rows={2}
                    value={replyById[exp.id] || ''}
                    onChange={(e) =>
                      setReplyById((prev) => ({ ...prev, [exp.id]: e.target.value }))
                    }
                    placeholder="Write your clarification, credit note reference, or revised delivery confirmation..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
                  />
                  <FileUploadField
                    label="Attach Supporting Document (Optional)"
                    fileName={attachmentById[exp.id] || ''}
                    onChange={(f) => setAttachmentById((prev) => ({ ...prev, [exp.id]: f }))}
                    sampleFileName="Supplier_Credit_Note_MSP.pdf"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSendReply('expense', exp.id)}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 cursor-pointer"
                    >
                      Submit Response & Request Re-Review
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {disputedPurchases
              .filter(
                (po) => !disputedExpenses.some((e) => e.linkedPurchaseId === po.id),
              )
              .map((po) => (
                <div
                  key={po.id}
                  className="bg-white border border-[#FECACA] rounded-xl p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-[#172B4D]">
                      {po.id} · {po.materialName}
                    </div>
                    <StatusBadge label="Disputed" />
                  </div>
                  {po.dispute && (
                    <p className="text-xs text-[#7F1D1D]">{po.dispute.description}</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyById[po.id] || ''}
                      onChange={(e) =>
                        setReplyById((prev) => ({ ...prev, [po.id]: e.target.value }))
                      }
                      placeholder="Reply to homeowner..."
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#E6E9EF]"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendReply('purchase', po.id)}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#172B4D] text-white cursor-pointer"
                    >
                      Respond
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Notifications Timeline */}
      <section className="bg-white border border-[#E6E9EF] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E6E9EF] flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#172B4D]" />
          <h2 className="text-sm font-semibold text-[#172B4D]">Activity Notifications</h2>
        </div>
        <div className="divide-y divide-[#E6E9EF]">
          {contractorNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`px-5 py-3.5 flex items-start justify-between gap-4 cursor-pointer hover:bg-[#F7F8FA] ${
                !n.read ? 'bg-[#EFF6FF]/40' : ''
              }`}
            >
              <div>
                <div className="text-xs font-semibold text-[#172B4D]">{n.title}</div>
                <div className="text-xs text-[#707987] mt-0.5">{n.message}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] font-mono text-[#707987]">
                  {formatDateTime(n.timestamp)}
                </div>
                {!n.read && (
                  <span className="text-[11px] font-semibold text-[#2563EB]">Unread</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
