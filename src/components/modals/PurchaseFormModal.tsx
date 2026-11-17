import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { FileUploadField } from '../common/FileUploadField';
import { useApp } from '../../context/AppContext';
import { MaterialCategory } from '../../types';
import { formatINR } from '../../utils/formatters';

interface PurchaseFormModalProps {
  open: boolean;
  onClose: () => void;
}

const MATERIAL_CATEGORIES: MaterialCategory[] = [
  'Cement',
  'Steel',
  'Sand',
  'Aggregates',
  'Bricks',
  'Blocks',
  'Tiles',
  'Electrical materials',
  'Plumbing materials',
  'Paint',
  'Other',
];

const UNITS = ['Bags', 'MT', 'Kg', 'Tonnes', 'Nos', 'Sq.ft', 'Lengths', 'Units', 'Litres', 'Loads'];

export const PurchaseFormModal: React.FC<PurchaseFormModalProps> = ({ open, onClose }) => {
  const { activeProject, vendors, addPurchase } = useApp();

  const [materialName, setMaterialName] = useState('');
  const [category, setCategory] = useState<MaterialCategory>('Cement');
  const [supplier, setSupplier] = useState(vendors[0]?.name || '');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Bags');
  const [unitPrice, setUnitPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [createLinkedExpense, setCreateLinkedExpense] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setMaterialName('');
    setCategory('Cement');
    setSupplier(vendors[0]?.name || '');
    setQuantity('');
    setUnit('Bags');
    setUnitPrice('');
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setExpectedDeliveryDate(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
    setNotes('');
    setDocumentName('');
    setCreateLinkedExpense(true);
    setErrors({});
  }, [open]);

  const totalAmount =
    Number(quantity) > 0 && Number(unitPrice) > 0
      ? Math.round(Number(quantity) * Number(unitPrice))
      : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!materialName.trim()) nextErrors.materialName = 'Material name is required.';
    if (!supplier.trim()) nextErrors.supplier = 'Supplier is required.';
    if (!quantity || Number(quantity) <= 0) nextErrors.quantity = 'Enter quantity > 0.';
    if (!unitPrice || Number(unitPrice) <= 0) nextErrors.unitPrice = 'Enter unit price > 0.';
    if (!purchaseDate) nextErrors.purchaseDate = 'Purchase date is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    addPurchase({
      materialName: materialName.trim(),
      category,
      supplier: supplier.trim(),
      quantityOrdered: Number(quantity),
      unit,
      unitPrice: Number(unitPrice),
      purchaseDate,
      expectedDeliveryDate,
      notes: notes.trim() || undefined,
      documentName: documentName || undefined,
      createLinkedExpense,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record Material Purchase Order"
      subtitle={`Project: ${activeProject.name} · Deliveries can be logged in multiple batches`}
      maxWidthClass="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">
              Material Name *
            </label>
            <input
              type="text"
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              placeholder="e.g., UltraTech PPC Cement"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
            />
            {errors.materialName && (
              <p className="mt-1 text-xs text-[#DC2626]">{errors.materialName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MaterialCategory)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] bg-white focus:outline-none focus:border-[#172B4D]"
            >
              {MATERIAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#20252D] mb-1">Supplier *</label>
          <input
            type="text"
            list="po-suppliers"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="e.g., Shree Balaji Traders"
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
          />
          <datalist id="po-suppliers">
            {vendors.map((v) => (
              <option key={v.id} value={v.name} />
            ))}
          </datalist>
          {errors.supplier && <p className="mt-1 text-xs text-[#DC2626]">{errors.supplier}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">Quantity *</label>
            <input
              type="number"
              min="0.1"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="200"
              className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
            />
            {errors.quantity && <p className="mt-1 text-xs text-[#DC2626]">{errors.quantity}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">Unit *</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] bg-white focus:outline-none focus:border-[#172B4D]"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">
              Unit Price (₹) *
            </label>
            <input
              type="number"
              min="1"
              step="any"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="400"
              className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
            />
            {errors.unitPrice && <p className="mt-1 text-xs text-[#DC2626]">{errors.unitPrice}</p>}
          </div>
        </div>

        <div className="px-4 py-3 rounded-lg bg-[#F7F8FA] border border-[#E6E9EF] flex items-center justify-between">
          <span className="text-xs font-medium text-[#707987]">
            Calculated Purchase Total
          </span>
          <span className="text-base font-bold font-mono tabular-nums text-[#172B4D]">
            {formatINR(totalAmount)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">
              Purchase Date *
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">
              Expected Delivery Date
            </label>
            <input
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-[#20252D] cursor-pointer">
          <input
            type="checkbox"
            checked={createLinkedExpense}
            onChange={(e) => setCreateLinkedExpense(e.target.checked)}
            className="rounded border-[#CBD5E1] text-[#172B4D]"
          />
          <span>Also create a linked project expense entry for budget tracking</span>
        </label>

        <div>
          <label className="block text-xs font-medium text-[#20252D] mb-1">Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Grade specification, delivery schedule, or supplier terms..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
          />
        </div>

        <FileUploadField
          label="Purchase Order / Invoice Upload"
          fileName={documentName}
          onChange={setDocumentName}
          sampleFileName="PO_Supplier_Quote_Invoice.pdf"
        />

        <div className="pt-3 border-t border-[#E6E9EF] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#E6E9EF] text-[#20252D] hover:bg-[#F0F2F5] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 cursor-pointer"
          >
            Save Purchase Order
          </button>
        </div>
      </form>
    </Modal>
  );
};
