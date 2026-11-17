import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { FileUploadField } from '../common/FileUploadField';
import { useApp } from '../../context/AppContext';
import { Expense, ExpenseCategory, PaymentMethod } from '../../types';
import { formatINR } from '../../utils/formatters';

interface ExpenseFormModalProps {
  open: boolean;
  onClose: () => void;
  editingExpense?: Expense | null;
}

const CATEGORIES: ExpenseCategory[] = [
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

const PAYMENT_METHODS: PaymentMethod[] = ['Bank transfer', 'UPI', 'Cash', 'Cheque', 'Other'];

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  open,
  onClose,
  editingExpense,
}) => {
  const { activeProject, purchases, stages, vendors, addExpense, updateExpense } = useApp();
  const projectPurchases = purchases.filter((p) => p.projectId === activeProject.id);
  const projectStages = stages.filter((s) => s.projectId === activeProject.id);

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Cement');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [vendor, setVendor] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank transfer');
  const [linkedPurchaseId, setLinkedPurchaseId] = useState('');
  const [stageName, setStageName] = useState('Structural Framework');
  const [notes, setNotes] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (editingExpense) {
      setDescription(editingExpense.description);
      setCategory(editingExpense.category);
      setAmount(String(editingExpense.amount));
      setDate(editingExpense.date);
      setVendor(editingExpense.vendor);
      setPaymentMethod(editingExpense.paymentMethod);
      setLinkedPurchaseId(editingExpense.linkedPurchaseId || '');
      setStageName(editingExpense.stageName);
      setNotes(editingExpense.notes || '');
      setDocumentName('');
    } else {
      setDescription('');
      setCategory('Cement');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setVendor(vendors[0]?.name || '');
      setPaymentMethod('Bank transfer');
      setLinkedPurchaseId('');
      setStageName(
        projectStages.find((s) => s.status === 'In Progress')?.name ||
          projectStages[0]?.name ||
          'Structural Framework',
      );
      setNotes('');
      setDocumentName('');
    }
    setErrors({});
  }, [open, editingExpense]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!description.trim()) nextErrors.description = 'Expense description is required.';
    const numAmount = Number(amount);
    if (!amount || Number.isNaN(numAmount) || numAmount <= 0) {
      nextErrors.amount = 'Enter a valid amount greater than ₹0.';
    }
    if (!date) nextErrors.date = 'Expense date is required.';
    if (!vendor.trim()) nextErrors.vendor = 'Vendor or service provider is required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (targetStatus: 'Draft' | 'Pending') => {
    if (!validate()) return;
    const numericAmount = Math.round(Number(amount));

    if (editingExpense) {
      updateExpense(editingExpense.id, {
        description: description.trim(),
        category,
        amount: numericAmount,
        date,
        vendor: vendor.trim(),
        paymentMethod,
        linkedPurchaseId: linkedPurchaseId || undefined,
        stageName,
        notes: notes.trim() || undefined,
        status: targetStatus,
      });
    } else {
      addExpense({
        description: description.trim(),
        category,
        amount: numericAmount,
        date,
        vendor: vendor.trim(),
        paymentMethod,
        linkedPurchaseId: linkedPurchaseId || undefined,
        stageName,
        notes: notes.trim() || undefined,
        status: targetStatus,
        documentName: documentName || undefined,
      });
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingExpense ? `Edit Expense ${editingExpense.id}` : 'Add Construction Expense'}
      subtitle={`Project: ${activeProject.name} · Recording an expense does not mark it paid`}
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#20252D] mb-1">
            Expense Description *
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., UltraTech PPC Cement 100 Bags for Lintels"
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-[#DC2626]">{errors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">
              Expense Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] bg-white focus:outline-none focus:border-[#172B4D]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">
              Amount (INR) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-[#707987]">
                ₹
              </span>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="42000"
                className="w-full pl-7 pr-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
              />
            </div>
            {Number(amount) > 0 && (
              <p className="mt-1 text-[11px] font-mono text-[#707987]">
                Formatted: {formatINR(Number(amount))}
              </p>
            )}
            {errors.amount && <p className="mt-1 text-xs text-[#DC2626]">{errors.amount}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">
              Vendor / Service Provider *
            </label>
            <input
              type="text"
              list="vendor-suggestions"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g., Shree Balaji Traders"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
            />
            <datalist id="vendor-suggestions">
              {vendors.map((v) => (
                <option key={v.id} value={v.name} />
              ))}
              <option value="Kulkarni Civil Works LLP (Crew Billing)" />
            </datalist>
            {errors.vendor && <p className="mt-1 text-xs text-[#DC2626]">{errors.vendor}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">
              Expense Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
            />
            {errors.date && <p className="mt-1 text-xs text-[#DC2626]">{errors.date}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">
              Preferred Payment Mode
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] bg-white focus:outline-none focus:border-[#172B4D]"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">
              Construction Stage
            </label>
            <select
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] bg-white focus:outline-none focus:border-[#172B4D]"
            >
              {projectStages.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">
              Linked Purchase (Optional)
            </label>
            <select
              value={linkedPurchaseId}
              onChange={(e) => setLinkedPurchaseId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] bg-white focus:outline-none focus:border-[#172B4D]"
            >
              <option value="">None</option>
              {projectPurchases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} · {p.materialName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#20252D] mb-1">Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="GST invoice number, site location, or measurement notes..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
          />
        </div>

        <FileUploadField
          label="Invoice or Receipt Upload"
          fileName={documentName}
          onChange={setDocumentName}
          sampleFileName="Vendor_GST_Invoice_Nov2026.pdf"
        />

        <div className="pt-3 border-t border-[#E6E9EF] flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#E6E9EF] text-[#20252D] hover:bg-[#F0F2F5] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('Draft')}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#E6E9EF] bg-[#F7F8FA] text-[#172B4D] hover:bg-[#F0F2F5] cursor-pointer"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('Pending')}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 cursor-pointer"
          >
            Submit Expense
          </button>
        </div>
      </div>
    </Modal>
  );
};
