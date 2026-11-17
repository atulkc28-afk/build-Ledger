import React, { useState } from 'react';
import { CheckCircle2, Eye, FileText, Package, Plus, Truck, XCircle } from 'lucide-react';
import { Drawer } from '../common/Drawer';
import { StatusBadge } from '../common/StatusBadge';
import { DisputeModal } from '../modals/DisputeModal';
import { DocumentPreviewModal } from '../modals/DocumentPreviewModal';
import { useApp } from '../../context/AppContext';
import { DocumentRecord, Purchase } from '../../types';
import { formatDate, formatINR } from '../../utils/formatters';
import { getPurchaseDeliveryStats, getPurchasePaymentStats } from '../../utils/calculations';

interface PurchaseDetailDrawerProps {
  purchase: Purchase | null;
  onClose: () => void;
  onRecordDelivery?: (purchaseId: string) => void;
  onRecordPayment?: (purchaseId: string) => void;
}

export const PurchaseDetailDrawer: React.FC<PurchaseDetailDrawerProps> = ({
  purchase,
  onClose,
  onRecordDelivery,
}) => {
  const {
    currentRole,
    deliveries,
    expenses,
    payments,
    documents,
    acknowledgeRecord,
    raiseDispute,
  } = useApp();

  const [disputeOpen, setDisputeOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);

  if (!purchase) return null;

  const deliveryStats = getPurchaseDeliveryStats(purchase, deliveries);
  const purchaseDeliveries = deliveries.filter((d) => d.purchaseId === purchase.id);
  const paymentStats = getPurchasePaymentStats(purchase, expenses, payments);
  const attachedDocs = documents.filter(
    (d) => purchase.documentIds.includes(d.id) || d.relatedId === purchase.id,
  );

  return (
    <>
      <Drawer
        open={Boolean(purchase)}
        onClose={onClose}
        title={`${purchase.id} · ${purchase.materialName}`}
        subtitle={`Supplier: ${purchase.supplier} · Ordered ${formatDate(purchase.purchaseDate)}`}
      >
        <div className="space-y-6">
          {/* Purchase Information */}
          <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E6E9EF] space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-[#707987]">Total Purchase Value</div>
                <div className="mt-0.5 text-2xl font-bold font-mono tabular-nums text-[#172B4D]">
                  {formatINR(purchase.totalAmount)}
                </div>
                <div className="mt-1 text-xs text-[#707987] font-mono tabular-nums">
                  {purchase.quantityOrdered} {purchase.unit} × {formatINR(purchase.unitPrice)} /{' '}
                  {purchase.unit}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <StatusBadge label={deliveryStats.deliveryStatus} size="md" />
                <span className="text-[11px] text-[#707987]">
                  Review: {purchase.approvalStatus}
                </span>
              </div>
            </div>

            {currentRole === 'homeowner' && purchase.approvalStatus !== 'Approved' && (
              <div className="pt-2 flex flex-wrap gap-2 border-t border-[#E6E9EF]">
                <button
                  type="button"
                  onClick={() => acknowledgeRecord('purchase', purchase.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#16A34A] text-white hover:bg-[#15803D] cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Acknowledge PO
                </button>
                {purchase.approvalStatus !== 'Disputed' && (
                  <button
                    type="button"
                    onClick={() => setDisputeOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Raise Dispute
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Delivery Progress & Batches */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#172B4D]">
                <Truck className="w-4 h-4" />
                Delivery Progress
              </div>
              {currentRole === 'contractor' &&
                deliveryStats.pendingQuantity > 0 &&
                onRecordDelivery && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRecordDelivery(purchase.id);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Record Delivery
                  </button>
                )}
            </div>

            <div className="p-4 rounded-xl border border-[#E6E9EF] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#707987]">
                  Delivered:{' '}
                  <strong className="font-mono text-[#172B4D]">
                    {deliveryStats.deliveredQuantity} / {purchase.quantityOrdered} {purchase.unit}
                  </strong>
                </span>
                <span className="font-mono font-semibold text-[#172B4D]">
                  {deliveryStats.deliveryPercentage}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[#F0F2F5] overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    deliveryStats.deliveryStatus === 'Delivered'
                      ? 'bg-[#16A34A]'
                      : 'bg-[#2563EB]'
                  }`}
                  style={{ width: `${deliveryStats.deliveryPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-[#707987]">
                <span>
                  Pending: {deliveryStats.pendingQuantity} {purchase.unit}
                </span>
                <span>Expected by {formatDate(purchase.expectedDeliveryDate)}</span>
              </div>
            </div>

            <div className="space-y-2">
              {purchaseDeliveries.length === 0 ? (
                <div className="text-xs text-[#707987] py-3 px-4 rounded-lg border border-dashed border-[#E6E9EF]">
                  No deliveries logged yet against this order.
                </div>
              ) : (
                purchaseDeliveries.map((del, idx) => (
                  <div
                    key={del.id}
                    className="p-3 rounded-lg border border-[#E6E9EF] bg-white flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[#172B4D]">
                        Delivery {idx + 1}: {del.quantityDelivered} {purchase.unit}
                      </div>
                      <div className="text-[11px] text-[#707987] mt-0.5">
                        {formatDate(del.deliveryDate)} · Challan {del.challanNumber}
                        {del.vehicleNumber ? ` · ${del.vehicleNumber}` : ''}
                      </div>
                      {del.notes && (
                        <div className="text-xs text-[#20252D] mt-1">{del.notes}</div>
                      )}
                    </div>
                    <StatusBadge label={del.approvalStatus} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#172B4D]">
              <Package className="w-4 h-4" />
              Financial Payment Summary
            </div>
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl border border-[#E6E9EF] bg-[#F7F8FA]">
              <div>
                <div className="text-[11px] text-[#707987]">Order Value</div>
                <div className="text-sm font-bold font-mono tabular-nums text-[#172B4D]">
                  {formatINR(paymentStats.totalOwed)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#707987]">Amount Paid</div>
                <div className="text-sm font-bold font-mono tabular-nums text-[#15803D]">
                  {formatINR(paymentStats.amountPaid)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#707987]">Pending</div>
                <div className="text-sm font-bold font-mono tabular-nums text-[#D97706]">
                  {formatINR(paymentStats.outstandingAmount)}
                </div>
              </div>
            </div>

            {paymentStats.relatedPayments.length > 0 && (
              <div className="space-y-2">
                {paymentStats.relatedPayments.map((pay) => (
                  <div
                    key={pay.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[#E6E9EF] text-xs"
                  >
                    <div>
                      <span className="font-mono font-semibold text-[#172B4D]">{pay.id}</span> ·{' '}
                      <span className="text-[#707987]">
                        {formatDate(pay.paymentDate)} · {pay.paymentMethod} ({pay.referenceNumber})
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-[#15803D]">
                      {formatINR(pay.amountPaid)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documents */}
          <div>
            <div className="text-xs font-semibold text-[#172B4D] mb-2">
              Associated Invoices & Challans ({attachedDocs.length})
            </div>
            {attachedDocs.length === 0 ? (
              <div className="text-xs text-[#707987]">No documents attached yet.</div>
            ) : (
              <div className="space-y-2">
                {attachedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-[#E6E9EF]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-[#172B4D] shrink-0" />
                      <span className="text-xs font-medium text-[#172B4D] truncate">{doc.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-[#E6E9EF] hover:bg-[#F0F2F5] cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      Preview
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Drawer>

      <DisputeModal
        open={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        recordLabel={purchase.id}
        onSubmitDispute={(reason, desc, att) =>
          raiseDispute('purchase', purchase.id, reason, desc, att)
        }
      />

      <DocumentPreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
    </>
  );
};
