import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  Package,
  Receipt,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { SummaryCard } from '../../components/common/SummaryCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  calculateOverallReportedProgress,
  calculateProjectFinancials,
  getCategoryBreakdown,
  getMonthlyExpenditure,
  getPurchaseDeliveryStats,
  getWeeklyExpenditure,
} from '../../utils/calculations';
import { formatDateTime, formatINR, formatINRCompact, getGreeting } from '../../utils/formatters';

export const HomeownerOverviewPage: React.FC = () => {
  const {
    currentUser,
    activeProject,
    expenses,
    purchases,
    deliveries,
    payments,
    stages,
    progressUpdates,
    activities,
    acknowledgeRecord,
  } = useApp();
  const navigate = useNavigate();

  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'all'>('monthly');

  const financials = useMemo(
    () => calculateProjectFinancials(activeProject, expenses, payments),
    [activeProject, expenses, payments],
  );

  const categoryData = useMemo(
    () => getCategoryBreakdown(expenses, activeProject.id),
    [expenses, activeProject.id],
  );

  const chartData = useMemo(() => {
    if (timeframe === 'weekly') return getWeeklyExpenditure(expenses, activeProject.id);
    if (timeframe === 'monthly') return getMonthlyExpenditure(expenses, activeProject.id);
    // All time cumulative
    const monthly = getMonthlyExpenditure(expenses, activeProject.id);
    let running = 0;
    return monthly.map((m) => {
      running += m.expenses;
      return { ...m, expenses: running };
    });
  }, [timeframe, expenses, activeProject.id]);

  const reportedProgress = useMemo(
    () => calculateOverallReportedProgress(stages, activeProject.id),
    [stages, activeProject.id],
  );

  const pendingExpenses = expenses.filter(
    (e) => e.projectId === activeProject.id && e.status === 'Pending',
  );
  const pendingDeliveries = deliveries.filter(
    (d) => d.projectId === activeProject.id && d.approvalStatus === 'Pending',
  );
  const pendingUpdates = progressUpdates.filter(
    (u) => u.projectId === activeProject.id && u.approvalStatus === 'Pending',
  );
  const openPurchasesWithPendingQty = purchases.filter((p) => {
    if (p.projectId !== activeProject.id) return false;
    return getPurchaseDeliveryStats(p, deliveries).pendingQuantity > 0;
  });

  const projectActivities = activities
    .filter((a) => a.projectId === activeProject.id)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Greeting & Project Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172B4D]">
            {getGreeting()}, {currentUser.name}
          </h1>
          <p className="mt-1 text-sm text-[#707987]">
            {activeProject.name} · {activeProject.location} · Contractor-reported progress:{' '}
            <span className="font-mono font-semibold text-[#172B4D]">{reportedProgress}%</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/homeowner/approvals')}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#E6E9EF] bg-white text-[#172B4D] hover:bg-[#F0F2F5] whitespace-nowrap cursor-pointer"
          >
            Review Queue ({pendingExpenses.length + pendingDeliveries.length + pendingUpdates.length})
          </button>
          <button
            type="button"
            onClick={() => navigate('/homeowner/reports')}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 whitespace-nowrap cursor-pointer"
          >
            Financial Reports
          </button>
        </div>
      </div>

      {/* 4 Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Budget"
          value={formatINR(financials.totalBudget)}
          subtitle={`${activeProject.builtUpAreaSqFt.toLocaleString('en-IN')} sq.ft estimate`}
          icon={Wallet}
          statusLabel={activeProject.status}
          statusTone="blue"
          onClick={() => navigate('/homeowner/settings')}
        />
        <SummaryCard
          title="Total Expenses"
          value={formatINR(financials.totalRecordedExpenses)}
          subtitle={`${formatINR(financials.approvedExpensesAmount)} acknowledged`}
          icon={Receipt}
          statusLabel={
            financials.pendingReviewExpensesAmount > 0 ? 'Pending Review' : 'All Reviewed'
          }
          statusTone={financials.pendingReviewExpensesAmount > 0 ? 'amber' : 'green'}
          onClick={() => navigate('/homeowner/expenses')}
        />
        <SummaryCard
          title="Remaining Budget"
          value={formatINR(financials.remainingBudget)}
          subtitle={`${(100 - financials.budgetUtilisationPct).toFixed(1)}% available`}
          icon={TrendingDown}
          statusLabel={financials.remainingBudget >= 0 ? 'Within Budget' : 'Over Budget'}
          statusTone={financials.remainingBudget >= 0 ? 'green' : 'red'}
          onClick={() => navigate('/homeowner/reports')}
        />
        <SummaryCard
          title="Pending Payments"
          value={formatINR(financials.pendingPayments)}
          subtitle={`Paid ${formatINR(financials.totalPaid)} across ${financials.completedPaymentsCount} txns`}
          icon={CreditCard}
          statusLabel={financials.pendingPayments > 0 ? 'Balance Due' : 'Settled'}
          statusTone={financials.pendingPayments > 0 ? 'amber' : 'green'}
          onClick={() => navigate('/homeowner/payments')}
        />
      </div>

      {/* Budget Utilisation Bar */}
      <section className="bg-white border border-[#E6E9EF] rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-[#172B4D]">Budget Utilisation</h2>
            <p className="text-xs text-[#707987]">
              Approved budget vs recorded project expenses (payments tracked separately)
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#172B4D]">
              {financials.budgetUtilisationPct}%
            </span>
            <span className="ml-1.5 text-xs text-[#707987]">utilised</span>
          </div>
        </div>

        <div className="h-3 rounded-full bg-[#F0F2F5] overflow-hidden flex">
          <div
            className="h-full bg-[#172B4D] transition-all"
            style={{
              width: `${Math.min(
                100,
                (financials.approvedExpensesAmount / financials.totalBudget) * 100,
              )}%`,
            }}
            title={`Acknowledged: ${formatINR(financials.approvedExpensesAmount)}`}
          />
          <div
            className="h-full bg-[#D97706] transition-all"
            style={{
              width: `${Math.min(
                100,
                ((financials.pendingReviewExpensesAmount + financials.disputedExpensesAmount) /
                  financials.totalBudget) *
                  100,
              )}%`,
            }}
            title="Pending review or disputed"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-[#E6E9EF] text-xs">
          <div>
            <div className="text-[#707987]">Total Budget</div>
            <div className="mt-0.5 font-mono font-semibold text-[#172B4D] tabular-nums">
              {formatINR(financials.totalBudget)}
            </div>
          </div>
          <div>
            <div className="text-[#707987]">Recorded Expenses</div>
            <div className="mt-0.5 font-mono font-semibold text-[#172B4D] tabular-nums">
              {formatINR(financials.totalRecordedExpenses)}
            </div>
          </div>
          <div>
            <div className="text-[#707987]">Remaining Budget</div>
            <div className="mt-0.5 font-mono font-semibold text-[#15803D] tabular-nums">
              {formatINR(financials.remainingBudget)}
            </div>
          </div>
          <div>
            <div className="text-[#707987]">Awaiting Review / Disputed</div>
            <div className="mt-0.5 font-mono font-semibold text-[#D97706] tabular-nums">
              {formatINR(
                financials.pendingReviewExpensesAmount + financials.disputedExpensesAmount,
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Charts Row: Expense Overview + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white border border-[#E6E9EF] rounded-xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-[#172B4D]">Expense Overview</h2>
              <p className="text-xs text-[#707987]">
                {timeframe === 'all' ? 'Cumulative spend curve' : 'Recorded expenditure over time'}
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-[#F0F2F5] rounded-lg">
              {(['weekly', 'monthly', 'all'] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors capitalize cursor-pointer ${
                    timeframe === tf
                      ? 'bg-white text-[#172B4D] shadow-xs'
                      : 'text-[#707987] hover:text-[#20252D]'
                  }`}
                >
                  {tf === 'all' ? 'All time' : tf}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="navyArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#172B4D" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#172B4D" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E9EF" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#707987', fontSize: 11 }}
                  axisLine={{ stroke: '#E6E9EF' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatINRCompact(v)}
                  tick={{ fill: '#707987', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip
                  formatter={(value) => [formatINR(Number(value ?? 0)), 'Recorded Expenses']}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #E6E9EF',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#172B4D"
                  strokeWidth={2}
                  fill="url(#navyArea)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="lg:col-span-5 bg-white border border-[#E6E9EF] rounded-xl p-5 sm:p-6">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-[#172B4D]">Expense Category Breakdown</h2>
            <p className="text-xs text-[#707987]">Distribution across materials & labour</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 items-center">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={76}
                    paddingAngle={2}
                  >
                    {categoryData.map((entry) => (
                      <Cell key={entry.category} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatINR(Number(value ?? 0))}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #E6E9EF',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {categoryData.map((item) => (
                <div key={item.category} className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[#20252D] truncate">{item.category}</span>
                  </div>
                  <div className="font-mono tabular-nums text-[#172B4D] shrink-0">
                    {formatINRCompact(item.amount)}{' '}
                    <span className="text-[#707987]">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Row: Pending Actions + Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Actions */}
        <section className="lg:col-span-6 bg-white border border-[#E6E9EF] rounded-xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-[#172B4D]">Pending Actions</h2>
              <p className="text-xs text-[#707987]">
                Items awaiting your acknowledgement or settlement
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/homeowner/approvals')}
              className="text-xs font-semibold text-[#172B4D] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {pendingExpenses.slice(0, 3).map((exp) => (
              <div
                key={exp.id}
                className="p-3.5 rounded-lg border border-[#E6E9EF] bg-[#F7F8FA]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#172B4D] truncate">
                    {exp.id} · {exp.description}
                  </div>
                  <div className="mt-0.5 text-xs text-[#707987]">
                    {exp.vendor} ·{' '}
                    <span className="font-mono font-medium text-[#172B4D]">
                      {formatINR(exp.amount)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => acknowledgeRecord('expense', exp.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-[#16A34A] text-white hover:bg-[#15803D] cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Acknowledge
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/homeowner/expenses')}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-[#E6E9EF] bg-white text-[#172B4D] hover:bg-[#F0F2F5] cursor-pointer"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            ))}

            {pendingUpdates.slice(0, 1).map((upd) => (
              <div
                key={upd.id}
                className="p-3.5 rounded-lg border border-[#E6E9EF] bg-[#F7F8FA]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#172B4D] truncate">
                    Progress Update · {upd.stageName} ({upd.reportedPercentage}% reported)
                  </div>
                  <div className="mt-0.5 text-xs text-[#707987] truncate">{upd.description}</div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/homeowner/progress')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[#172B4D] text-white hover:bg-[#172B4D]/90 shrink-0 cursor-pointer"
                >
                  Review Update
                </button>
              </div>
            ))}

            {openPurchasesWithPendingQty.length > 0 && (
              <div className="p-3.5 rounded-lg border border-[#E6E9EF] bg-[#F7F8FA]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-[#172B4D]">
                      {openPurchasesWithPendingQty.length} Purchase Orders awaiting balance delivery
                    </span>
                    <div className="text-[#707987]">
                      Track partial batch deliveries and challans
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/homeowner/materials')}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-[#E6E9EF] bg-white text-[#172B4D] hover:bg-[#F0F2F5] shrink-0 cursor-pointer"
                >
                  Check Deliveries
                </button>
              </div>
            )}

            {financials.pendingPayments > 0 && (
              <div className="p-3.5 rounded-lg border border-[#E6E9EF] bg-[#F7F8FA]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <IndianRupee className="w-4 h-4 text-[#D97706] shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-[#172B4D]">
                      {formatINR(financials.pendingPayments)} pending against recorded bills
                    </span>
                    <div className="text-[#707987]">Review payment ledger & tranches</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/homeowner/payments')}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-[#E6E9EF] bg-white text-[#172B4D] hover:bg-[#F0F2F5] shrink-0 cursor-pointer"
                >
                  View Payments
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Recent Activity Timeline */}
        <section className="lg:col-span-6 bg-white border border-[#E6E9EF] rounded-xl p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-[#172B4D]">Recent Activities</h2>
            <p className="text-xs text-[#707987]">Chronological ledger across site operations</p>
          </div>

          <div className="divide-y divide-[#E6E9EF]">
            {projectActivities.map((act) => (
              <div
                key={act.id}
                className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium text-[#20252D]">{act.description}</div>
                  <div className="mt-1 text-[11px] text-[#707987]">
                    {act.actorName} ({act.actorRole}) ·{' '}
                    <span className="font-mono">{formatDateTime(act.timestamp)}</span>
                  </div>
                </div>
                {act.statusLabel && <StatusBadge label={act.statusLabel} tone={act.statusTone} />}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
