import React, { useMemo, useState } from 'react';
import { ArrowUpDown, Eye, Plus, Receipt, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { ExpenseFormModal } from '../../components/modals/ExpenseFormModal';
import { PaymentFormModal } from '../../components/modals/PaymentFormModal';
import { ExpenseDetailDrawer } from '../../components/drawers/ExpenseDetailDrawer';
import { Expense, ExpenseCategory, ExpenseStatus } from '../../types';
import { formatDate, formatINR } from '../../utils/formatters';
import { calculateProjectFinancials } from '../../utils/calculations';

const CATEGORIES: ('All' | ExpenseCategory)[] = [
  'All',
  'Cement',
  'Steel',
  'Sand',
  'Bricks',
  'Labour',
  'Electrical',
  'Plumbing',
  'Flooring',
  'Painting',
  'Other',
];

const STATUSES: ('All' | ExpenseStatus)[] = ['All', 'Pending', 'Approved', 'Disputed', 'Draft'];

export const ExpensesPage: React.FC = () => {
  const { currentRole, activeProject, expenses, payments } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | ExpenseCategory>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | ExpenseStatus>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [paymentModalExpenseId, setPaymentModalExpenseId] = useState<string | undefined>(undefined);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const financials = useMemo(
    () => calculateProjectFinancials(activeProject, expenses, payments),
    [activeProject, expenses, payments],
  );

  const projectExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.projectId === activeProject.id)
      .filter((e) => {
        if (currentRole === 'homeowner' && e.status === 'Draft') return false;
        if (categoryFilter !== 'All' && e.category !== categoryFilter) return false;
        if (statusFilter !== 'All' && e.status !== statusFilter) return false;
        if (dateFrom && e.date < dateFrom) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            e.id.toLowerCase().includes(q) ||
            e.description.toLowerCase().includes(q) ||
            e.vendor.toLowerCase().includes(q) ||
            e.category.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const cmp = sortBy === 'amount' ? a.amount - b.amount : a.date.localeCompare(b.date);
        return sortAsc ? cmp : -cmp;
      });
  }, [
    expenses,
    activeProject.id,
    currentRole,
    categoryFilter,
    statusFilter,
    dateFrom,
    search,
    sortBy,
    sortAsc,
  ]);

  const selectedExpense = selectedExpenseId
    ? expenses.find((e) => e.id === selectedExpenseId) ?? null
    : null;

  const toggleSort = (col: 'date' | 'amount') => {
    if (sortBy === col) setSortAsc((v) => !v);
    else {
      setSortBy(col);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#172B4D]">Expenses</h1>
          <p className="mt-1 text-sm text-[#707987]">
            Recorded project costs for {activeProject.name} · Invoices and contractor submissions
          </p>
        </div>

        {currentRole === 'contractor' && (
          <button
            type="button"
            onClick={() => {
              setEditingExpense(null);
              setFormOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        )}
      </div>

      {/* Top Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E6E9EF] rounded-xl p-4">
          <div className="text-xs text-[#707987]">Total Recorded Expenses</div>
          <div className="mt-1 text-xl font-bold font-mono tabular-nums text-[#172B4D]">
            {formatINR(financials.totalRecordedExpenses)}
          </div>
        </div>
        <div className="bg-white border border-[#E6E9EF] rounded-xl p-4">
          <div className="text-xs text-[#707987]">Pending Homeowner Review</div>
          <div className="mt-1 text-xl font-bold font-mono tabular-nums text-[#D97706]">
            {formatINR(financials.pendingReviewExpensesAmount)}
          </div>
        </div>
        <div className="bg-white border border-[#E6E9EF] rounded-xl p-4">
          <div className="text-xs text-[#707987]">Acknowledged Expenses</div>
          <div className="mt-1 text-xl font-bold font-mono tabular-nums text-[#15803D]">
            {formatINR(financials.approvedExpensesAmount)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E6E9EF] rounded-xl p-4 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#707987] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, description, or vendor..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'All' | ExpenseCategory)}
            className="px-3 py-2 text-xs rounded-lg border border-[#E6E9EF] bg-white focus:outline-none focus:border-[#172B4D]"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Categories' : c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | ExpenseStatus)}
            className="px-3 py-2 text-xs rounded-lg border border-[#E6E9EF] bg-white focus:outline-none focus:border-[#172B4D]"
          >
            {STATUSES.filter((s) => !(currentRole === 'homeowner' && s === 'Draft')).map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Statuses' : s}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="Filter from date"
            className="px-3 py-2 text-xs font-mono rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
          />
        </div>
      </div>

      {/* Table / Mobile Cards */}
      {projectExpenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No expenses match your filters"
          description="Try clearing your search query or adjusting the category, status, or date filters."
          actionLabel={currentRole === 'contractor' ? 'Add First Expense' : 'Clear Filters'}
          onAction={() => {
            if (currentRole === 'contractor') {
              setEditingExpense(null);
              setFormOpen(true);
            } else {
              setSearch('');
              setCategoryFilter('All');
              setStatusFilter('All');
              setDateFrom('');
            }
          }}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-[#E6E9EF] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E6E9EF] bg-[#F7F8FA] text-[11px] font-semibold text-[#707987]">
                    <th className="py-3 px-4">Expense ID</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => toggleSort('amount')}
                        className="inline-flex items-center gap-1 hover:text-[#172B4D] cursor-pointer"
                      >
                        Amount
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => toggleSort('date')}
                        className="inline-flex items-center gap-1 hover:text-[#172B4D] cursor-pointer"
                      >
                        Date
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">Submitted By</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E9EF] text-xs">
                  {projectExpenses.map((exp) => (
                    <tr
                      key={exp.id}
                      onClick={() => setSelectedExpenseId(exp.id)}
                      className="hover:bg-[#F7F8FA] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-[#172B4D] whitespace-nowrap">
                        {exp.id}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#20252D] max-w-xs truncate">
                        {exp.description}
                      </td>
                      <td className="py-3 px-4 text-[#707987] whitespace-nowrap">{exp.category}</td>
                      <td className="py-3 px-4 text-[#20252D] max-w-[160px] truncate">
                        {exp.vendor}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#172B4D] whitespace-nowrap">
                        {formatINR(exp.amount)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#707987] whitespace-nowrap">
                        {formatDate(exp.date)}
                      </td>
                      <td className="py-3 px-4 text-[#707987] whitespace-nowrap">
                        {exp.submittedBy}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge label={exp.status} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedExpenseId(exp.id);
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

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {projectExpenses.map((exp) => (
              <button
                key={exp.id}
                type="button"
                onClick={() => setSelectedExpenseId(exp.id)}
                className="w-full text-left bg-white border border-[#E6E9EF] rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-[#172B4D]">{exp.id}</span>
                  <StatusBadge label={exp.status} />
                </div>
                <div className="text-sm font-semibold text-[#172B4D]">{exp.description}</div>
                <div className="flex items-center justify-between text-xs text-[#707987]">
                  <span>
                    {exp.category} · {exp.vendor}
                  </span>
                  <span className="font-mono font-bold text-[#172B4D]">
                    {formatINR(exp.amount)}
                  </span>
                </div>
                <div className="text-[11px] text-[#707987] font-mono">{formatDate(exp.date)}</div>
              </button>
            ))}
          </div>
        </>
      )}

      <ExpenseDetailDrawer
        expense={selectedExpense}
        onClose={() => setSelectedExpenseId(null)}
        onEdit={(exp) => {
          setEditingExpense(exp);
          setFormOpen(true);
        }}
        onRecordPayment={(expId) => {
          setPaymentModalExpenseId(expId);
          setPaymentModalOpen(true);
        }}
      />

      <ExpenseFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingExpense(null);
        }}
        editingExpense={editingExpense}
      />

      <PaymentFormModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        defaultExpenseId={paymentModalExpenseId}
      />
    </div>
  );
};
