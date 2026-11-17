import {
  Delivery,
  Expense,
  ExpenseCategory,
  Payment,
  ProgressStage,
  Project,
  Purchase,
} from '../types';

export interface ProjectFinancialSummary {
  totalBudget: number;
  totalRecordedExpenses: number;
  approvedExpensesAmount: number;
  pendingReviewExpensesAmount: number;
  disputedExpensesAmount: number;
  remainingBudget: number;
  budgetUtilisationPct: number;
  totalPaid: number;
  pendingPayments: number;
  overduePaymentsCount: number;
  completedPaymentsCount: number;
}

/**
 * Computes consistent project financial totals.
 * Draft expenses are excluded from committed recorded expenses until submitted.
 * Payments are strictly separate from expenses (money paid vs cost incurred).
 */
export function calculateProjectFinancials(
  project: Project,
  expenses: Expense[],
  payments: Payment[],
): ProjectFinancialSummary {
  const projectExpenses = expenses.filter(
    (e) => e.projectId === project.id && e.status !== 'Draft',
  );
  const totalRecordedExpenses = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
  const approvedExpensesAmount = projectExpenses
    .filter((e) => e.status === 'Approved')
    .reduce((sum, e) => sum + e.amount, 0);
  const pendingReviewExpensesAmount = projectExpenses
    .filter((e) => e.status === 'Pending')
    .reduce((sum, e) => sum + e.amount, 0);
  const disputedExpensesAmount = projectExpenses
    .filter((e) => e.status === 'Disputed')
    .reduce((sum, e) => sum + e.amount, 0);

  const remainingBudget = project.totalBudget - totalRecordedExpenses;
  const budgetUtilisationPct =
    project.totalBudget > 0
      ? Number(((totalRecordedExpenses / project.totalBudget) * 100).toFixed(1))
      : 0;

  const projectPayments = payments.filter((p) => p.projectId === project.id);
  const completedPayments = projectPayments.filter((p) => p.status === 'Completed');
  const totalPaid = completedPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const pendingPayments = Math.max(0, totalRecordedExpenses - totalPaid);
  const overduePaymentsCount = projectPayments.filter((p) => p.status === 'Overdue').length;

  return {
    totalBudget: project.totalBudget,
    totalRecordedExpenses,
    approvedExpensesAmount,
    pendingReviewExpensesAmount,
    disputedExpensesAmount,
    remainingBudget,
    budgetUtilisationPct,
    totalPaid,
    pendingPayments,
    overduePaymentsCount,
    completedPaymentsCount: completedPayments.length,
  };
}

export interface PurchaseDeliveryStats {
  deliveredQuantity: number;
  pendingQuantity: number;
  deliveryPercentage: number;
  deliveryStatus: 'Pending' | 'Partially Delivered' | 'Delivered';
  deliveriesCount: number;
}

export function getPurchaseDeliveryStats(
  purchase: Purchase,
  deliveries: Delivery[],
): PurchaseDeliveryStats {
  const related = deliveries.filter((d) => d.purchaseId === purchase.id);
  const rawDelivered = related.reduce((sum, d) => sum + d.quantityDelivered, 0);
  const deliveredQuantity = Math.min(purchase.quantityOrdered, Number(rawDelivered.toFixed(2)));
  const pendingQuantity = Math.max(
    0,
    Number((purchase.quantityOrdered - deliveredQuantity).toFixed(2)),
  );
  const deliveryPercentage =
    purchase.quantityOrdered > 0
      ? Math.min(100, Math.round((deliveredQuantity / purchase.quantityOrdered) * 100))
      : 0;

  let deliveryStatus: 'Pending' | 'Partially Delivered' | 'Delivered' = 'Pending';
  if (deliveredQuantity >= purchase.quantityOrdered && purchase.quantityOrdered > 0) {
    deliveryStatus = 'Delivered';
  } else if (deliveredQuantity > 0) {
    deliveryStatus = 'Partially Delivered';
  }

  return {
    deliveredQuantity,
    pendingQuantity,
    deliveryPercentage,
    deliveryStatus,
    deliveriesCount: related.length,
  };
}

export interface PaymentAgainstTargetStats {
  totalOwed: number;
  amountPaid: number;
  outstandingAmount: number;
  relatedPayments: Payment[];
  statusLabel: 'Paid' | 'Partial' | 'Unpaid';
}

/**
 * Matches payments recorded directly against an expense OR its linked purchase
 * so partial payments never double-count or show inconsistent balances.
 */
export function getExpensePaymentStats(
  expense: Expense,
  payments: Payment[],
): PaymentAgainstTargetStats {
  const relatedPayments = payments.filter(
    (p) =>
      p.status === 'Completed' &&
      ((p.linkedType === 'expense' && p.linkedId === expense.id) ||
        (expense.linkedPurchaseId &&
          p.linkedType === 'purchase' &&
          p.linkedId === expense.linkedPurchaseId)),
  );
  const amountPaid = relatedPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const outstandingAmount = Math.max(0, expense.amount - amountPaid);
  let statusLabel: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
  if (amountPaid >= expense.amount && expense.amount > 0) statusLabel = 'Paid';
  else if (amountPaid > 0) statusLabel = 'Partial';

  return {
    totalOwed: expense.amount,
    amountPaid,
    outstandingAmount,
    relatedPayments,
    statusLabel,
  };
}

export function getPurchasePaymentStats(
  purchase: Purchase,
  expenses: Expense[],
  payments: Payment[],
): PaymentAgainstTargetStats {
  const linkedExpenseIds = expenses
    .filter((e) => e.linkedPurchaseId === purchase.id)
    .map((e) => e.id);

  const relatedPayments = payments.filter(
    (p) =>
      p.status === 'Completed' &&
      ((p.linkedType === 'purchase' && p.linkedId === purchase.id) ||
        (p.linkedType === 'expense' && linkedExpenseIds.includes(p.linkedId))),
  );
  const amountPaid = relatedPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const outstandingAmount = Math.max(0, purchase.totalAmount - amountPaid);
  let statusLabel: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
  if (amountPaid >= purchase.totalAmount && purchase.totalAmount > 0) statusLabel = 'Paid';
  else if (amountPaid > 0) statusLabel = 'Partial';

  return {
    totalOwed: purchase.totalAmount,
    amountPaid,
    outstandingAmount,
    relatedPayments,
    statusLabel,
  };
}

export interface CategoryBreakdownItem {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
  color: string;
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Steel: '#172B4D',
  Labour: '#2563EB',
  Cement: '#0F766E',
  Sand: '#D97706',
  Bricks: '#B45309',
  Electrical: '#4F46E5',
  Plumbing: '#0284C7',
  Flooring: '#059669',
  Painting: '#7C3AED',
  Other: '#64748B',
};

export function getCategoryBreakdown(expenses: Expense[], projectId: string): CategoryBreakdownItem[] {
  const valid = expenses.filter((e) => e.projectId === projectId && e.status !== 'Draft');
  const total = valid.reduce((sum, e) => sum + e.amount, 0);
  const map = new Map<ExpenseCategory, number>();

  for (const exp of valid) {
    map.set(exp.category, (map.get(exp.category) ?? 0) + exp.amount);
  }

  return Array.from(map.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? Number(((amount / total) * 100).toFixed(1)) : 0,
      color: CATEGORY_COLORS[category] ?? '#64748B',
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function getMonthlyExpenditure(expenses: Expense[], projectId: string) {
  const valid = expenses.filter((e) => e.projectId === projectId && e.status !== 'Draft');
  const map = new Map<string, { label: string; sortKey: string; expenses: number; approved: number }>();

  for (const exp of valid) {
    const d = new Date(exp.date);
    if (Number.isNaN(d.getTime())) continue;
    const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    const entry = map.get(sortKey) ?? { label, sortKey, expenses: 0, approved: 0 };
    entry.expenses += exp.amount;
    if (exp.status === 'Approved') entry.approved += exp.amount;
    map.set(sortKey, entry);
  }

  return Array.from(map.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

export function getWeeklyExpenditure(expenses: Expense[], projectId: string) {
  const valid = expenses
    .filter((e) => e.projectId === projectId && e.status !== 'Draft')
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  const map = new Map<string, { label: string; sortKey: string; expenses: number }>();
  for (const exp of valid) {
    const d = new Date(exp.date);
    if (Number.isNaN(d.getTime())) continue;
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const sortKey = weekStart.toISOString().slice(0, 10);
    const label = weekStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const entry = map.get(sortKey) ?? { label, sortKey, expenses: 0 };
    entry.expenses += exp.amount;
    map.set(sortKey, entry);
  }

  return Array.from(map.values())
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .slice(-8);
}

export function calculateOverallReportedProgress(stages: ProgressStage[], projectId: string): number {
  const projectStages = stages.filter((s) => s.projectId === projectId);
  if (projectStages.length === 0) return 0;
  const sum = projectStages.reduce((acc, s) => acc + s.reportedProgress, 0);
  return Math.round(sum / projectStages.length);
}

export function exportRowsToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((r) => r.map(escapeCell).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
