import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { FileUploadField } from '../common/FileUploadField';
import { useApp } from '../../context/AppContext';
import { getPurchaseDeliveryStats } from '../../utils/calculations';

interface DeliveryFormModalProps {
  open: boolean;
  onClose: () => void;
  defaultPurchaseId?: string;
}

export const DeliveryFormModal: React.FC<DeliveryFormModalProps> = ({
  open,
  onClose,
  defaultPurchaseId,
}) => {
  const { activeProject, purchases, deliveries, addDelivery } = useApp();

  const openPurchases = purchases.filter((p) => {
    if (p.projectId !== activeProject.id) return false;
    const stats = getPurchaseDeliveryStats(p, deliveries);
    return stats.pendingQuantity > 0;
  });

  const [purchaseId, setPurchaseId] = useState('');
  const [quantityDelivered, setQuantityDelivered] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [challanNumber, setChallanNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const initialId = defaultPurchaseId || openPurchases[0]?.id || '';
    setPurchaseId(initialId);
    setQuantityDelivered('');
    setDeliveryDate(new Date().toISOString().slice(0, 10));
    setChallanNumber('');
    setVehicleNumber('');
    setNotes('');
    setDocumentName('');
    setError('');
  }, [open, defaultPurchaseId]);

  const selectedPurchase = purchases.find((p) => p.id === purchaseId);
  const selectedStats = selectedPurchase
    ? getPurchaseDeliveryStats(selectedPurchase, deliveries)
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedPurchase || !selectedStats) {
      setError('Select a purchase order with pending delivery quantity.');
      return;
    }
    const qty = Number(quantityDelivered);
    if (!qty || qty <= 0) {
      setError('Enter a valid delivered quantity greater than 0.');
      return;
    }
    if (qty > selectedStats.pendingQuantity) {
      setError(
        `Delivered quantity cannot exceed remaining ${selectedStats.pendingQuantity} ${selectedPurchase.unit}.`,
      );
      return;
    }
    if (!challanNumber.trim()) {
      setError('Delivery challan number is required.');
      return;
    }

    const ok = addDelivery({
      purchaseId: selectedPurchase.id,
      quantityDelivered: qty,
      deliveryDate,
      challanNumber: challanNumber.trim(),
      vehicleNumber: vehicleNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      documentName: documentName || undefined,
    });
    if (ok) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record Material Delivery"
      subtitle="Log partial or full batch receipt against a purchase order"
    >
      {openPurchases.length === 0 ? (
        <div className="py-6 text-center text-sm text-[#707987]">
          All purchase orders for {activeProject.name} are already 100% delivered.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">
              Purchase Order *
            </label>
            <select
              value={purchaseId}
              onChange={(e) => {
                setPurchaseId(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] bg-white focus:outline-none focus:border-[#172B4D]"
            >
              {openPurchases.map((p) => {
                const st = getPurchaseDeliveryStats(p, deliveries);
                return (
                  <option key={p.id} value={p.id}>
                    {p.id} · {p.materialName} ({st.pendingQuantity} {p.unit} pending)
                  </option>
                );
              })}
            </select>
          </div>

          {selectedPurchase && selectedStats && (
            <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-[#F7F8FA] border border-[#E6E9EF] text-center">
              <div>
                <div className="text-[11px] text-[#707987]">Ordered</div>
                <div className="text-sm font-semibold font-mono tabular-nums text-[#172B4D]">
                  {selectedPurchase.quantityOrdered} {selectedPurchase.unit}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#707987]">Delivered</div>
                <div className="text-sm font-semibold font-mono tabular-nums text-[#15803D]">
                  {selectedStats.deliveredQuantity} {selectedPurchase.unit}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#707987]">Remaining</div>
                <div className="text-sm font-semibold font-mono tabular-nums text-[#D97706]">
                  {selectedStats.pendingQuantity} {selectedPurchase.unit}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#20252D] mb-1">
                Quantity Delivered ({selectedPurchase?.unit || 'Units'}) *
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                max={selectedStats?.pendingQuantity}
                value={quantityDelivered}
                onChange={(e) => setQuantityDelivered(e.target.value)}
                placeholder={selectedStats ? `Max ${selectedStats.pendingQuantity}` : '0'}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#20252D] mb-1">
                Delivery Date *
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#20252D] mb-1">
                Delivery Challan No. *
              </label>
              <input
                type="text"
                value={challanNumber}
                onChange={(e) => setChallanNumber(e.target.value)}
                placeholder="e.g., DC-9482"
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#20252D] mb-1">
                Vehicle Number
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g., KA-53-C-9104"
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">Site Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Condition on arrival, storage shed location..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
            />
          </div>

          <FileUploadField
            label="Delivery Challan / Site Photo"
            fileName={documentName}
            onChange={setDocumentName}
            sampleFileName="Delivery_Challan_Signed.jpg"
          />

          {error && <p className="text-xs text-[#DC2626] font-medium">{error}</p>}

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
              Record Delivery
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
