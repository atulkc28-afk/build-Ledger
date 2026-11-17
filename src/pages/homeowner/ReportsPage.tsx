import React, { useMemo } from 'react';
import { Download, Printer } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  calculateProjectFinancials,
  exportRowsToCSV,
  getCategoryBreakdown,
  getMonthlyExpenditure,
  getPurchaseDeliveryStats,
} from '../../utils/calculations';
import { formatINR, formatINRCompact } from '../../utils/formatters';

export const ReportsPage: React.FC = () => {
  const { activeProject, expenses, purchases, deliveries, payments, pushToast } = useApp();

  const financials = useMemo(
    () => calculateProjectFinancials(activeProject, expenses, payments),
    [activeProject, expenses, payments],
  );

  const categoryBreakdown = useMemo(
    () => getCategoryBreakdown(expenses, activeProject.id),
    [expenses, activeProject.id],
  );

  const monthlyData = useMemo(
    () => getMonthlyExpenditure(expenses, activeProject.id),
    [expenses, activeProject.id],
  );

  const budgetVsActual = useMemo(() => {
    const projectExpenses = expenses.filter(
      (e) => e.projectId === activeProject.id && e.status !== 'Draft',
    );
    return activeProject.categoryBudgets.map((alloc) => {
      const actual = projectExpenses
        .filter((e) => e.category === alloc.category)
        .reduce((s, e) => s + e.amount, 0);
      const remaining = alloc.allocatedAmount - actual;
      return {
        category: alloc.category,
        allocated: alloc.allocatedAmount,
        actual,
        remaining,
        overBudget: remaining < 0,
      };
    });
  }, [activeProject, expenses]);

  const projectPurchases = purchases.filter((p) => p.projectId === activeProject.id);
  const projectPayments = payments.filter((p) => p.projectId === activeProject.id);

  const handleExportCSV = () => {
    const headers = ['Category', 'Estimated Allocation (INR)', 'Actual Expenses (INR)', 'Variance (INR)'];
    const rows = budgetVsActual.map((r) => [r.category, r.allocated, r.actual, r.remaining]);
    exportRowsToCSV(`${activeProject.name.replace(/\s+/g, '_')}_Financial_Report.csv`, headers, rows);
    pushToast('CSV Report Downloaded', 'Budget vs Actual financial report exported.');
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#172B4D]">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-[#707987]">
            Comprehensive financial breakdown for {activeProject.name}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#E6E9EF] bg-white text-[#172B4D] hover:bg-[#F0F2F5] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel (CSV)
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#E6E9EF] bg-white text-[#172B4D] hover:bg-[#F0F2F5] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* 1. Financial Summary */}
      <section className="bg-white border border-[#E6E9EF] rounded-xl p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-[#172B4D] mb-4">1. Financial Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="p-3.5 rounded-lg bg-[#F7F8FA] border border-[#E6E9EF]">
            <div className="text-xs text-[#707987]">Total Budget</div>
            <div className="mt-1 text-base font-bold font-mono tabular-nums text-[#172B4D]">
              {formatINR(financials.totalBudget)}
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-[#F7F8FA] border border-[#E6E9EF]">
            <div className="text-xs text-[#707987]">Total Expenses</div>
            <div className="mt-1 text-base font-bold font-mono tabular-nums text-[#172B4D]">
              {formatINR(financials.totalRecordedExpenses)}
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-[#F7F8FA] border border-[#E6E9EF]">
            <div className="text-xs text-[#707987]">Total Paid</div>
            <div className="mt-1 text-base font-bold font-mono tabular-nums text-[#15803D]">
              {formatINR(financials.totalPaid)}
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-[#F7F8FA] border border-[#E6E9EF]">
            <div className="text-xs text-[#707987]">Outstanding Payments</div>
            <div className="mt-1 text-base font-bold font-mono tabular-nums text-[#D97706]">
              {formatINR(financials.pendingPayments)}
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-[#F7F8FA] border border-[#E6E9EF]">
            <div className="text-xs text-[#707987]">Remaining Budget</div>
            <div className="mt-1 text-base font-bold font-mono tabular-nums text-[#172B4D]">
              {formatINR(financials.remainingBudget)}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Category-wise + 3. Monthly Expenditure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 bg-white border border-[#E6E9EF] rounded-xl p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-[#172B4D] mb-4">2. Category-wise Expenses</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#E6E9EF] text-[#707987]">
                  <th className="py-2 text-left font-medium">Category</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                  <th className="py-2 text-right font-medium">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E9EF]">
                {categoryBreakdown.map((c) => (
                  <tr key={c.category}>
                    <td className="py-2.5 font-medium text-[#20252D]">{c.category}</td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-[#172B4D]">
                      {formatINR(c.amount)}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-[#707987]">
                      {c.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="lg:col-span-7 bg-white border border-[#E6E9EF] rounded-xl p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-[#172B4D] mb-4">
            3. Monthly Expenditure Comparison
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
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
                  width={56}
                />
                <Tooltip
                  formatter={(value) => formatINR(Number(value ?? 0))}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #E6E9EF',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="expenses" name="Recorded" fill="#172B4D" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approved" name="Acknowledged" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* 4. Budget vs Actual */}
      <section className="bg-white border border-[#E6E9EF] rounded-xl p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-[#172B4D] mb-4">4. Budget vs Actual</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-[#E6E9EF] text-[#707987]">
                <th className="py-2.5 text-left font-medium">Category</th>
                <th className="py-2.5 text-right font-medium">Estimated Allocation</th>
                <th className="py-2.5 text-right font-medium">Actual Expenses</th>
                <th className="py-2.5 text-right font-medium">Remaining Allocation</th>
                <th className="py-2.5 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E9EF]">
              {budgetVsActual.map((row) => (
                <tr key={row.category} className="hover:bg-[#F7F8FA]">
                  <td className="py-2.5 font-medium text-[#172B4D]">{row.category}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-[#707987]">
                    {formatINR(row.allocated)}
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums font-semibold text-[#172B4D]">
                    {formatINR(row.actual)}
                  </td>
                  <td
                    className={`py-2.5 text-right font-mono tabular-nums font-semibold ${
                      row.overBudget ? 'text-[#DC2626]' : 'text-[#15803D]'
                    }`}
                  >
                    {formatINR(row.remaining)}
                  </td>
                  <td className="py-2.5 text-right">
                    <StatusBadge
                      label={row.overBudget ? 'Over Budget' : 'Within Budget'}
                      tone={row.overBudget ? 'red' : 'green'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Material Purchases + 6. Payment Report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-[#E6E9EF] rounded-xl p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-[#172B4D] mb-4">5. Material Purchases</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#E6E9EF] text-[#707987]">
                  <th className="py-2 text-left font-medium">Material</th>
                  <th className="py-2 text-right font-medium">Ordered</th>
                  <th className="py-2 text-right font-medium">Delivered</th>
                  <th className="py-2 text-right font-medium">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E9EF]">
                {projectPurchases.map((po) => {
                  const st = getPurchaseDeliveryStats(po, deliveries);
                  return (
                    <tr key={po.id}>
                      <td className="py-2.5 font-medium text-[#20252D]">{po.materialName}</td>
                      <td className="py-2.5 text-right font-mono tabular-nums">
                        {po.quantityOrdered} {po.unit}
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-[#15803D]">
                        {st.deliveredQuantity} {po.unit}
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums font-semibold text-[#172B4D]">
                        {formatINR(po.totalAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white border border-[#E6E9EF] rounded-xl p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-[#172B4D] mb-4">6. Payment Report</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-[#F7F8FA] border border-[#E6E9EF]">
              <div className="text-[11px] text-[#707987]">Completed Payments</div>
              <div className="mt-0.5 text-sm font-bold font-mono text-[#15803D]">
                {formatINR(financials.totalPaid)} ({projectPayments.length} txns)
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#F7F8FA] border border-[#E6E9EF]">
              <div className="text-[11px] text-[#707987]">Outstanding Against Bills</div>
              <div className="mt-0.5 text-sm font-bold font-mono text-[#D97706]">
                {formatINR(financials.pendingPayments)}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#E6E9EF] text-[#707987]">
                  <th className="py-2 text-left font-medium">Payment ID</th>
                  <th className="py-2 text-left font-medium">Recipient</th>
                  <th className="py-2 text-left font-medium">Mode</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E9EF]">
                {projectPayments.map((pay) => (
                  <tr key={pay.id}>
                    <td className="py-2.5 font-mono text-[#172B4D]">{pay.id}</td>
                    <td className="py-2.5 text-[#20252D]">{pay.recipient}</td>
                    <td className="py-2.5 text-[#707987]">{pay.paymentMethod}</td>
                    <td className="py-2.5 text-right font-mono tabular-nums font-semibold text-[#172B4D]">
                      {formatINR(pay.amountPaid)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
