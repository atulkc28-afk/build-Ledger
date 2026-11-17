import React, { useMemo, useState } from 'react';
import { CheckCircle2, Eye, ShieldAlert, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { DisputeModal } from '../../components/modals/DisputeModal';
import { ExpenseDetailDrawer } from '../../components/drawers/ExpenseDetailDrawer';
import { PurchaseDetailDrawer } from '../../components/drawers/PurchaseDetailDrawer';
import { Expense, Purchase } from '../../types';
import { formatDate, formatINR } from '../../utils/formatters';

interface UnifiedReviewItem {
  kind: 'expense' | 'purchase' | 'delivery' | 'progress';
  id: string;
  title: string;
  subtitle: string;
  amount?: number;
  date: string;
  submittedBy: string;
  status: 'Pending' | 'Approved' | 'Disputed';
  disputeReason?: string;
  disputeDescription?: string;
  contractorResponse?: string;
  rawExpense?: Expense;
  rawPurchase?: Purchase;
}

export const ApprovalsDisputesPage: React.FC = () => {
  const {
    activeProject,
    expenses,
    purchases,
    deliveries,
    progressUpdates,
    acknowledgeRecord,
    raiseDispute,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Disputed'>('Pending');
  const [disputeTarget, setDisputeTarget] = useState<UnifiedReviewItem | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  const items: UnifiedReviewItem[] = useMemo(() => {
    const expItems: UnifiedReviewItem[] = expenses
      .filter((e) => e.projectId === activeProject.id && e.status !== 'Draft')
      .map((e) => ({
        kind: 'expense',
        id: e.id,
        title: e.description,
        subtitle: `Expense · ${e.category} · ${e.vendor}`,
        amount: e.amount,
        date: e.date,
        submittedBy: e.submittedBy,
        status: e.status as 'Pending' | 'Approved' | 'Disputed',
        disputeReason: e.dispute?.reason,
        disputeDescription: e.dispute?.description,
        contractorResponse: e.dispute?.contractorResponse,
        rawExpense: e,
      }));

    const poItems: UnifiedReviewItem[] = purchases
      .filter((p) => p.projectId === activeProject.id)
      .map((p) => ({
        kind: 'purchase',
        id: p.id,
        title: `${p.materialName} (${p.quantityOrdered} ${p.unit})`,
        subtitle: `Purchase Order · ${p.supplier}`,
        amount: p.totalAmount,
        date: p.purchaseDate,
        submittedBy: p.submittedBy,
        status: p.approvalStatus,
        disputeReason: p.dispute?.reason,
        disputeDescription: p.dispute?.description,
        contractorResponse: p.dispute?.contractorResponse,
        rawPurchase: p,
      }));

    const delItems: UnifiedReviewItem[] = deliveries
      .filter((d) => d.projectId === activeProject.id)
      .map((d) => {
        const po = purchases.find((p) => p.id === d.purchaseId);
        return {
          kind: 'delivery',
          id: d.id,
          title: `Delivery: ${d.quantityDelivered} ${po?.unit || 'units'} ${po?.materialName || d.purchaseId}`,
          subtitle: `Delivery Challan ${d.challanNumber} · Against ${d.purchaseId}`,
          date: d.deliveryDate,
          submittedBy: d.recordedBy,
          status: d.approvalStatus,
          disputeReason: d.dispute?.reason,
          disputeDescription: d.dispute?.description,
          contractorResponse: d.dispute?.contractorResponse,
        };
      });

    const progItems: UnifiedReviewItem[] = progressUpdates
      .filter((u) => u.projectId === activeProject.id)
      .map((u) => ({
        kind: 'progress',
        id: u.id,
        title: `${u.stageName} — ${u.reportedPercentage}% Contractor-Reported`,
        subtitle: u.description,
        date: u.date,
        submittedBy: u.submittedBy,
        status: u.approvalStatus,
        disputeReason: u.dispute?.reason,
        disputeDescription: u.dispute?.description,
        contractorResponse: u.dispute?.contractorResponse,
      }));

    return [...expItems, ...poItems, ...delItems, ...progItems].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
  }, [activeProject.id, expenses, purchases, deliveries, progressUpdates]);

  const counts = {
    Pending: items.filter((i) => i.status === 'Pending').length,
    Approved: items.filter((i) => i.status === 'Approved').length,
    Disputed: items.filter((i) => i.status === 'Disputed').length,
  };

  const visibleItems = items.filter((i) => i.status === activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#172B4D]">Approvals & Disputes</h1>
        <p className="mt-1 text-sm text-[#707987]">
          Acknowledge contractor-submitted records or raise disputes for clarification.
        </p>
      </div>

      {/* Explicit Business Rule Notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-[#E6E9EF] text-xs text-[#707987]">
        <ShieldAlert className="w-4 h-4 text-[#172B4D] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#172B4D]">Acknowledgement Policy:</strong> Homeowner
          acknowledgement confirms review of submitted records and supporting files—not independent
          quality inspection. Records never auto-approve due to homeowner inactivity.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#F0F2F5] rounded-lg w-fit">
        {(['Pending', 'Approved', 'Disputed'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab
                ? 'bg-white text-[#172B4D] shadow-xs'
                : 'text-[#707987] hover:text-[#20252D]'
            }`}
          >
            {tab === 'Pending' ? 'Pending Reviews' : tab} ({counts[tab]})
          </button>
        ))}
      </div>

      {visibleItems.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={`No ${activeTab.toLowerCase()} records`}
          description={
            activeTab === 'Pending'
              ? 'All submitted expenses, purchases, deliveries, and progress updates have been reviewed.'
              : activeTab === 'Disputed'
                ? 'No records are currently flagged for dispute.'
                : 'Acknowledged records will appear here once reviewed.'
          }
        />
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => (
            <div
              key={`${item.kind}-${item.id}`}
              className="bg-white border border-[#E6E9EF] rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-xs font-semibold text-[#172B4D]">{item.id}</span>
                  <span className="text-xs text-[#707987]">·</span>
                  <span className="text-xs text-[#707987]">{formatDate(item.date)}</span>
                  <span className="text-xs text-[#707987]">·</span>
                  <span className="text-xs text-[#707987]">By {item.submittedBy}</span>
                  <StatusBadge label={item.status} />
                </div>
                <div className="text-sm font-semibold text-[#172B4D]">{item.title}</div>
                <div className="text-xs text-[#707987]">{item.subtitle}</div>

                {item.disputeReason && (
                  <div className="mt-2 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs space-y-1">
                    <div className="font-semibold text-[#B91C1C]">
                      Dispute: {item.disputeReason}
                    </div>
                    {item.disputeDescription && (
                      <div className="text-[#7F1D1D]">{item.disputeDescription}</div>
                    )}
                    {item.contractorResponse && (
                      <div className="pt-1 border-t border-[#FECACA] text-[#172B4D]">
                        <strong>Contractor response:</strong> {item.contractorResponse}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {typeof item.amount === 'number' && (
                  <div className="text-right mr-2">
                    <div className="text-[11px] text-[#707987]">Amount</div>
                    <div className="text-sm font-bold font-mono tabular-nums text-[#172B4D]">
                      {formatINR(item.amount)}
                    </div>
                  </div>
                )}

                {(item.rawExpense || item.rawPurchase) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (item.rawExpense) setSelectedExpense(item.rawExpense);
                      if (item.rawPurchase) setSelectedPurchase(item.rawPurchase);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border border-[#E6E9EF] text-[#172B4D] hover:bg-[#F0F2F5] cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect
                  </button>
                )}

                {item.status !== 'Approved' && (
                  <button
                    type="button"
                    onClick={() => acknowledgeRecord(item.kind, item.id)}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg bg-[#16A34A] text-white hover:bg-[#15803D] cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Acknowledge
                  </button>
                )}

                {item.status !== 'Disputed' && (
                  <button
                    type="button"
                    onClick={() => setDisputeTarget(item)}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2] cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Dispute
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <DisputeModal
        open={Boolean(disputeTarget)}
        onClose={() => setDisputeTarget(null)}
        recordLabel={disputeTarget?.id || ''}
        onSubmitDispute={(reason, description, att) => {
          if (!disputeTarget) return;
          raiseDispute(disputeTarget.kind, disputeTarget.id, reason, description, att);
        }}
      />

      <ExpenseDetailDrawer
        expense={
          selectedExpense
            ? expenses.find((e) => e.id === selectedExpense.id) ?? null
            : null
        }
        onClose={() => setSelectedExpense(null)}
      />

      <PurchaseDetailDrawer
        purchase={
          selectedPurchase
            ? purchases.find((p) => p.id === selectedPurchase.id) ?? null
            : null
        }
        onClose={() => setSelectedPurchase(null)}
      />
    </div>
  );
};
