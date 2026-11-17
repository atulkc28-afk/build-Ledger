import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Clock,
  CreditCard,
  FolderKanban,
  HardHat,
  Package,
  Plus,
  Receipt,
  Truck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SummaryCard } from '../../components/common/SummaryCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ExpenseFormModal } from '../../components/modals/ExpenseFormModal';
import { PurchaseFormModal } from '../../components/modals/PurchaseFormModal';
import { DeliveryFormModal } from '../../components/modals/DeliveryFormModal';
import { PaymentFormModal } from '../../components/modals/PaymentFormModal';
import { ProgressUpdateModal } from '../../components/modals/ProgressUpdateModal';
import {
  calculateOverallReportedProgress,
  calculateProjectFinancials,
  getPurchaseDeliveryStats,
} from '../../utils/calculations';
import { formatDate, formatDateTime, formatINR, getGreeting } from '../../utils/formatters';

export const ContractorDashboardPage: React.FC = () => {
  const {
    currentUser,
    projects,
    expenses,
    purchases,
    deliveries,
    payments,
    stages,
    activities,
    setActiveProjectId,
  } = useApp();
  const navigate = useNavigate();

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);

  const aggregateStats = useMemo(() => {
    let totalExpenses = 0;
    let totalPaid = 0;
    let pendingReviews = 0;
    let disputedCount = 0;

    for (const prj of projects) {
      const fin = calculateProjectFinancials(prj, expenses, payments);
      totalExpenses += fin.totalRecordedExpenses;
      totalPaid += fin.totalPaid;
    }

    pendingReviews = expenses.filter((e) => e.status === 'Pending').length;
    disputedCount = expenses.filter((e) => e.status === 'Disputed').length;

    return {
      activeProjects: projects.filter((p) => p.status === 'In Progress').length,
      totalExpenses,
      pendingReviews,
      outstandingPayments: Math.max(0, totalExpenses - totalPaid),
      disputedCount,
    };
  }, [projects, expenses, payments]);

  const disputedExpenses = expenses.filter((e) => e.status === 'Disputed');
  const pendingPurchasesDelivery = purchases.filter(
    (po) => getPurchaseDeliveryStats(po, deliveries).pendingQuantity > 0,
  );
  const recentActivities = activities.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172B4D]">
            {getGreeting()}, {currentUser.name}
          </h1>
          <p className="mt-1 text-sm text-[#707987]">
            {currentUser.companyName || 'Contractor Workspace'} · Operations across {projects.length}{' '}
            projects
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="bg-white border border-[#E6E9EF] rounded-xl p-4 sm:p-5">
        <div className="text-xs font-semibold text-[#172B4D] mb-3">Quick Site Actions</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <button
            type="button"
            onClick={() => setExpenseModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Expense
          </button>
          <button
            type="button"
            onClick={() => setPurchaseModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-lg border border-[#E6E9EF] bg-[#F7F8FA] text-[#172B4D] hover:bg-[#F0F2F5] cursor-pointer"
          >
            <Package className="w-3.5 h-3.5" />
            Add Purchase
          </button>
          <button
            type="button"
            onClick={() => setDeliveryModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-lg border border-[#E6E9EF] bg-[#F7F8FA] text-[#172B4D] hover:bg-[#F0F2F5] cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5" />
            Record Delivery
          </button>
          <button
            type="button"
            onClick={() => setPaymentModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-lg border border-[#E6E9EF] bg-[#F7F8FA] text-[#172B4D] hover:bg-[#F0F2F5] cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Record Payment
          </button>
          <button
            type="button"
            onClick={() => setProgressModalOpen(true)}
            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-lg border border-[#E6E9EF] bg-[#F7F8FA] text-[#172B4D] hover:bg-[#F0F2F5] cursor-pointer"
          >
            <HardHat className="w-3.5 h-3.5" />
            Submit Progress
          </button>
        </div>
      </section>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Active Projects"
          value={String(aggregateStats.activeProjects)}
          subtitle={`${projects.length} total assigned`}
          icon={FolderKanban}
          onClick={() => navigate('/contractor/projects')}
        />
        <SummaryCard
          title="Total Expenses Recorded"
          value={formatINR(aggregateStats.totalExpenses)}
          subtitle="Across assigned projects"
          icon={Receipt}
          onClick={() => navigate('/contractor/expenses')}
        />
        <SummaryCard
          title="Pending Homeowner Reviews"
          value={String(aggregateStats.pendingReviews)}
          subtitle={`${aggregateStats.disputedCount} disputed record(s)`}
          icon={Clock}
          statusLabel={aggregateStats.disputedCount > 0 ? 'Dispute Open' : 'Awaiting Review'}
          statusTone={aggregateStats.disputedCount > 0 ? 'red' : 'amber'}
          onClick={() => navigate('/contractor/notifications')}
        />
        <SummaryCard
          title="Outstanding Payments"
          value={formatINR(aggregateStats.outstandingPayments)}
          subtitle="Balance against recorded costs"
          icon={CreditCard}
          statusLabel={aggregateStats.outstandingPayments > 0 ? 'Receivable' : 'Settled'}
          statusTone={aggregateStats.outstandingPayments > 0 ? 'amber' : 'green'}
          onClick={() => navigate('/contractor/payments')}
        />
      </div>

      {/* Assigned Projects Overview */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#172B4D]">Assigned Projects</h2>
          <button
            type="button"
            onClick={() => navigate('/contractor/projects')}
            className="text-xs font-semibold text-[#172B4D] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            All projects
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map((prj) => {
            const fin = calculateProjectFinancials(prj, expenses, payments);
            const prog = calculateOverallReportedProgress(stages, prj.id);
            return (
              <div
                key={prj.id}
                className="bg-white border border-[#E6E9EF] rounded-xl p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-bold text-[#172B4D]">{prj.name}</div>
                    <div className="text-xs text-[#707987] mt-0.5">
                      Homeowner: {prj.homeownerName} · {prj.location}
                    </div>
                  </div>
                  <StatusBadge label={prj.status} />
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs pt-2 border-t border-[#E6E9EF]">
                  <div>
                    <div className="text-[#707987]">Budget</div>
                    <div className="mt-0.5 font-mono font-semibold text-[#172B4D]">
                      {formatINR(prj.totalBudget)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#707987]">Recorded</div>
                    <div className="mt-0.5 font-mono font-semibold text-[#172B4D]">
                      {formatINR(fin.totalRecordedExpenses)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#707987]">Reported Progress</div>
                    <div className="mt-0.5 font-mono font-semibold text-[#2563EB]">{prog}%</div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6E9EF]">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveProjectId(prj.id);
                      navigate('/contractor/expenses');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 cursor-pointer"
                  >
                    Open Project Workspace
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pending Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 bg-white border border-[#E6E9EF] rounded-xl p-5 space-y-3">
          <h2 className="text-base font-semibold text-[#172B4D]">Pending Site & Review Actions</h2>

          {disputedExpenses.map((exp) => (
            <div
              key={exp.id}
              className="p-3.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#B91C1C]">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Dispute on {exp.id}</span>
                </div>
                <div className="text-xs text-[#7F1D1D] mt-0.5 truncate">
                  {exp.dispute?.reason || exp.description}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveProjectId(exp.projectId);
                  navigate('/contractor/notifications');
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[#DC2626] text-white hover:bg-[#B91C1C] shrink-0 cursor-pointer"
              >
                Respond
              </button>
            </div>
          ))}

          {pendingPurchasesDelivery.map((po) => {
            const st = getPurchaseDeliveryStats(po, deliveries);
            return (
              <div
                key={po.id}
                className="p-3.5 rounded-lg border border-[#E6E9EF] bg-[#F7F8FA] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#172B4D] truncate">
                    {po.id} · {po.materialName}
                  </div>
                  <div className="text-xs text-[#707987] mt-0.5">
                    {st.pendingQuantity} {po.unit} pending · Due {formatDate(po.expectedDeliveryDate)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveProjectId(po.projectId);
                    setDeliveryModalOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md border border-[#E6E9EF] bg-white text-[#172B4D] hover:bg-[#F0F2F5] shrink-0 cursor-pointer"
                >
                  Log Delivery
                </button>
              </div>
            );
          })}
        </section>

        <section className="lg:col-span-6 bg-white border border-[#E6E9EF] rounded-xl p-5">
          <h2 className="text-base font-semibold text-[#172B4D] mb-3">
            Recent Activity Across Projects
          </h2>
          <div className="divide-y divide-[#E6E9EF]">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium text-[#20252D]">{act.description}</div>
                  <div className="mt-1 text-[11px] text-[#707987]">
                    {act.actorName} · <span className="font-mono">{formatDateTime(act.timestamp)}</span>
                  </div>
                </div>
                {act.statusLabel && <StatusBadge label={act.statusLabel} tone={act.statusTone} />}
              </div>
            ))}
          </div>
        </section>
      </div>

      <ExpenseFormModal open={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} />
      <PurchaseFormModal open={purchaseModalOpen} onClose={() => setPurchaseModalOpen(false)} />
      <DeliveryFormModal open={deliveryModalOpen} onClose={() => setDeliveryModalOpen(false)} />
      <PaymentFormModal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} />
      <ProgressUpdateModal open={progressModalOpen} onClose={() => setProgressModalOpen(false)} />
    </div>
  );
};
