import React, { useMemo, useState } from 'react';
import { Plus, Truck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { DeliveryFormModal } from '../../components/modals/DeliveryFormModal';
import { getPurchaseDeliveryStats } from '../../utils/calculations';
import { formatDate } from '../../utils/formatters';

export const ContractorDeliveriesPage: React.FC = () => {
  const { activeProject, purchases, deliveries } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultPurchaseId, setDefaultPurchaseId] = useState<string | undefined>(undefined);

  const openOrders = useMemo(
    () =>
      purchases
        .filter((p) => p.projectId === activeProject.id)
        .map((p) => ({
          purchase: p,
          stats: getPurchaseDeliveryStats(p, deliveries),
        }))
        .filter((item) => item.stats.pendingQuantity > 0),
    [purchases, deliveries, activeProject.id],
  );

  const projectDeliveries = useMemo(
    () =>
      deliveries
        .filter((d) => d.projectId === activeProject.id)
        .slice()
        .sort((a, b) => b.deliveryDate.localeCompare(a.deliveryDate)),
    [deliveries, activeProject.id],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#172B4D]">Deliveries</h1>
          <p className="mt-1 text-sm text-[#707987]">
            Log site material deliveries and delivery challans for {activeProject.name}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setDefaultPurchaseId(undefined);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Record Delivery
        </button>
      </div>

      {/* Pending PO Deliveries */}
      {openOrders.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[#172B4D]">
            Purchase Orders Awaiting Delivery ({openOrders.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {openOrders.map(({ purchase, stats }) => (
              <div
                key={purchase.id}
                className="bg-white border border-[#E6E9EF] rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-xs font-semibold text-[#172B4D]">
                      {purchase.id}
                    </div>
                    <div className="text-sm font-semibold text-[#172B4D] mt-0.5">
                      {purchase.materialName}
                    </div>
                    <div className="text-xs text-[#707987]">{purchase.supplier}</div>
                  </div>
                  <StatusBadge label={stats.deliveryStatus} />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-[#707987]">
                      Delivered: {stats.deliveredQuantity}/{purchase.quantityOrdered}{' '}
                      {purchase.unit}
                    </span>
                    <span className="font-semibold text-[#D97706]">
                      {stats.pendingQuantity} left
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F0F2F5] overflow-hidden">
                    <div
                      className="h-full bg-[#2563EB] rounded-full"
                      style={{ width: `${stats.deliveryPercentage}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDefaultPurchaseId(purchase.id);
                    setModalOpen(true);
                  }}
                  className="w-full py-2 text-xs font-semibold rounded-lg border border-[#E6E9EF] bg-[#F7F8FA] text-[#172B4D] hover:bg-[#F0F2F5] cursor-pointer"
                >
                  Log Batch Delivery
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Delivery Ledger */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#172B4D]">
          Recorded Delivery Challans ({projectDeliveries.length})
        </h2>

        {projectDeliveries.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No deliveries recorded"
            description="Record partial or full deliveries against purchase orders with challan numbers."
            actionLabel="Record Delivery"
            onAction={() => setModalOpen(true)}
          />
        ) : (
          <div className="bg-white border border-[#E6E9EF] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="border-b border-[#E6E9EF] bg-[#F7F8FA] text-[11px] font-semibold text-[#707987]">
                    <th className="py-3 px-4">Delivery ID</th>
                    <th className="py-3 px-4">Purchase Order</th>
                    <th className="py-3 px-4">Material</th>
                    <th className="py-3 px-4 text-right">Qty Delivered</th>
                    <th className="py-3 px-4">Challan No.</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Homeowner Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E9EF] text-xs">
                  {projectDeliveries.map((del) => {
                    const po = purchases.find((p) => p.id === del.purchaseId);
                    return (
                      <tr key={del.id} className="hover:bg-[#F7F8FA]">
                        <td className="py-3 px-4 font-mono font-semibold text-[#172B4D]">
                          {del.id}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#707987]">{del.purchaseId}</td>
                        <td className="py-3 px-4 font-medium text-[#20252D]">
                          {po?.materialName || del.purchaseId}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#172B4D]">
                          {del.quantityDelivered} {po?.unit || 'units'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#20252D]">{del.challanNumber}</td>
                        <td className="py-3 px-4 font-mono text-[#707987]">
                          {formatDate(del.deliveryDate)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge label={del.approvalStatus} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <DeliveryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultPurchaseId={defaultPurchaseId}
      />
    </div>
  );
};
