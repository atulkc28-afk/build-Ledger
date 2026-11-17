import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Eye,
  Info,
  Plus,
  Search,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SummaryCard } from '../../components/common/SummaryCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { PaymentFormModal } from '../../components/modals/PaymentFormModal';
import { PaymentDetailDrawer } from '../../components/drawers/PaymentDetailDrawer';
import { Payment, PaymentMethod } from '../../types';
import { formatDate, formatINR } from '../../utils/formatters';
import { calculateProjectFinancials } from '../../utils/calculations';

const METHODS: ('All' | PaymentMethod)[] = [
  'All',
  'Bank transfer',
  'UPI',
  'Cheque',
  'Cash',
  'Other',
];

export const PaymentsPage: React.FC = () => {
  const { activeProject, expenses, payments } = useApp();

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<'All' | PaymentMethod>('All');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [defaultExpenseId, setDefaultExpenseId] = useState<string | undefined>(undefined);

  const financials = useMemo(
    () => calculateProjectFinancials(activeProject, expenses, payments),
    [activeProject, expenses, payments],
  );

  const projectPayments = useMemo(() => {
    return payments
      .filter((p) => p.projectId === activeProject.id)
      .filter((p) => {
        if (methodFilter !== 'All' && p.paymentMethod !== methodFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            p.id.toLowerCase().includes(q) ||
            p.recipient.toLowerCase().includes(q) ||
            p.linkedLabel.toLowerCase().includes(q) ||
            p.referenceNumber.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
  }, [payments, activeProject.id, methodFilter, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#172B4D]">Payments</h1>
          <p className="mt-1 text-sm text-[#707987]">
            Actual disbursements made against approved and pending obligations for{' '}
            {activeProject.name}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setDefaultExpenseId(undefined);
            setPaymentModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {/* Expense vs Payment Clarification */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-[#E6E9EF] text-xs text-[#707987]">
        <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#172B4D]">Expenses vs Payments Separation:</strong> Expenses
          represent costs recorded on site ({formatINR(financials.totalRecordedExpenses)}). Payments
          record actual money transferred ({formatINR(financials.totalPaid)}). Partial payments are
          supported and never double-counted in project expenditure.
        </div>
      </div>

      {/* 4 Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Amount Paid"
          value={formatINR(financials.totalPaid)}
          subtitle="Confirmed cash/bank outflows"
          icon={CheckCircle2}
          statusLabel="Paid"
          statusTone="green"
        />
        <SummaryCard
          title="Pending Amount"
          value={formatINR(financials.pendingPayments)}
          subtitle="Expenses minus payments made"
          icon={Wallet}
          statusLabel={financials.pendingPayments > 0 ? 'Balance Due' : 'Settled'}
          statusTone={financials.pendingPayments > 0 ? 'amber' : 'green'}
        />
        <SummaryCard
          title="Completed Payments"
          value={String(financials.completedPaymentsCount)}
          subtitle="Traceable UTR / cheque entries"
          icon={CreditCard}
        />
        <SummaryCard
          title="Overdue Payments"
          value={String(financials.overduePaymentsCount)}
          subtitle="Past agreed supplier due date"
          icon={AlertTriangle}
          statusLabel={financials.overduePaymentsCount > 0 ? 'Action Required' : 'None Overdue'}
          statusTone={financials.overduePaymentsCount > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E6E9EF] rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#707987] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Payment ID, recipient, linked PO/expense, or UTR..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
          />
        </div>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value as 'All' | PaymentMethod)}
          className="px-3 py-2 text-xs rounded-lg border border-[#E6E9EF] bg-white focus:outline-none focus:border-[#172B4D]"
        >
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {m === 'All' ? 'All Payment Methods' : m}
            </option>
          ))}
        </select>
      </div>

      {projectPayments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments recorded yet"
          description="Log UPI, NEFT/RTGS, cheque, or cash disbursements against recorded expenses or material purchases."
          actionLabel="Record First Payment"
          onAction={() => setPaymentModalOpen(true)}
        />
      ) : (
        <div className="bg-white border border-[#E6E9EF] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead>
                <tr className="border-b border-[#E6E9EF] bg-[#F7F8FA] text-[11px] font-semibold text-[#707987]">
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">Related Expense / Purchase</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference No.</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E9EF] text-xs">
                {projectPayments.map((pay) => (
                  <tr
                    key={pay.id}
                    onClick={() => setSelectedPayment(pay)}
                    className="hover:bg-[#F7F8FA] transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-[#172B4D] whitespace-nowrap">
                      {pay.id}
                    </td>
                    <td className="py-3 px-4 text-[#20252D] max-w-xs truncate">{pay.linkedLabel}</td>
                    <td className="py-3 px-4 text-[#20252D] whitespace-nowrap">{pay.recipient}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#15803D] whitespace-nowrap">
                      {formatINR(pay.amountPaid)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#707987] whitespace-nowrap">
                      {formatDate(pay.paymentDate)}
                    </td>
                    <td className="py-3 px-4 text-[#707987] whitespace-nowrap">
                      {pay.paymentMethod}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#172B4D] whitespace-nowrap">
                      {pay.referenceNumber}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge label={pay.status} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPayment(pay);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E6E9EF] text-[#172B4D] hover:bg-[#F0F2F5] cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PaymentDetailDrawer
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
        onRecordPartialPayment={(expId) => {
          setDefaultExpenseId(expId);
          setPaymentModalOpen(true);
        }}
      />

      <PaymentFormModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        defaultExpenseId={defaultExpenseId}
      />
    </div>
  );
};
