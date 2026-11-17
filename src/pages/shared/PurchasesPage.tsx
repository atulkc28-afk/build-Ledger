import React, { useMemo, useState } from 'react';
import { CheckCircle2, Eye, Package, Plus, Search, Truck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SummaryCard } from '../../components/common/SummaryCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { PurchaseFormModal } from '../../components/modals/PurchaseFormModal';
import { DeliveryFormModal } from '../../components/modals/DeliveryFormModal';
import { PurchaseDetailDrawer } from '../../components/drawers/PurchaseDetailDrawer';
import { MaterialCategory } from '../../types';
import { formatDate, formatINR } from '../../utils/formatters';
import { getPurchaseDeliveryStats } from '../../utils/calculations';

const MAT_CATEGORIES: ('All' | MaterialCategory)[] = [
  'All',
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

export const PurchasesPage: React.FC = () => {
  const { currentRole, activeProject, purchases, deliveries } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | MaterialCategory>('All');
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryDefaultPo, setDeliveryDefaultPo] = useState<string | undefined>(undefined);

  const projectPurchases = useMemo(
    () => purchases.filter((p) => p.projectId === activeProject.id),
    [purchases, activeProject.id],
  );

  const summary = useMemo(() => {
    const totalValue = projectPurchases.reduce((s, p) => s + p.totalAmount, 0);
    let pendingDeliveries = 0;
    let completedDeliveries = 0;
    for (const po of projectPurchases) {
      const st = getPurchaseDeliveryStats(po, deliveries);
      if (st.deliveryStatus === 'Delivered') completedDeliveries += 1;
      else pendingDeliveries += 1;
    }
    return {
      totalValue,
      totalOrders: projectPurchases.length,
      pendingDeliveries,
      completedDeliveries,
    };
  }, [projectPurchases, deliveries]);

  const filteredPurchases = useMemo(() => {
    return projectPurchases.filter((p) => {
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.id.toLowerCase().includes(q) ||
          p.materialName.toLowerCase().includes(q) ||
          p.supplier.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [projectPurchases, categoryFilter, search]);

  const selectedPurchase = selectedPurchaseId
    ? purchases.find((p) => p.id === selectedPurchaseId) ?? null
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#172B4D]">
            {currentRole === 'homeowner' ? 'Materials & Purchases' : 'Material Purchases'}
          </h1>
          <p className="mt-1 text-sm text-[#707987]">
            Track supplier purchase orders and multi-batch site deliveries for {activeProject.name}
          </p>
        </div>

        {currentRole === 'contractor' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDeliveryDefaultPo(undefined);
                setDeliveryModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#E6E9EF] bg-white text-[#172B4D] hover:bg-[#F0F2F5] cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" />
              Record Delivery
            </button>
            <button
              type="button"
              onClick={() => setPurchaseModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Material Purchase
            </button>
          </div>
        )}
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Purchase Value"
          value={formatINR(summary.totalValue)}
          subtitle="Across all material POs"
          icon={Package}
        />
        <SummaryCard
          title="Total Purchase Orders"
          value={String(summary.totalOrders)}
          subtitle="Active supplier orders"
          icon={Package}
        />
        <SummaryCard
          title="Pending Deliveries"
          value={String(summary.pendingDeliveries)}
          subtitle="Orders with balance quantity"
          icon={Truck}
          statusLabel={summary.pendingDeliveries > 0 ? 'In Transit / Partial' : 'None Pending'}
          statusTone={summary.pendingDeliveries > 0 ? 'amber' : 'green'}
        />
        <SummaryCard
          title="Completed Deliveries"
          value={String(summary.completedDeliveries)}
          subtitle="100% quantity received"
          icon={CheckCircle2}
          statusLabel="Delivered"
          statusTone="green"
        />
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E6E9EF] rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#707987] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by PO ID, material, or supplier..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as 'All' | MaterialCategory)}
          className="px-3 py-2 text-xs rounded-lg border border-[#E6E9EF] bg-white focus:outline-none focus:border-[#172B4D]"
        >
          {MAT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === 'All' ? 'All Material Categories' : c}
            </option>
          ))}
        </select>
      </div>

      {filteredPurchases.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No material purchases found"
          description="Record supplier purchase orders here to track batch deliveries and unit pricing."
          actionLabel={currentRole === 'contractor' ? 'Add Material Purchase' : undefined}
          onAction={currentRole === 'contractor' ? () => setPurchaseModalOpen(true) : undefined}
        />
      ) : (
        <div className="bg-white border border-[#E6E9EF] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[820px]">
              <thead>
                <tr className="border-b border-[#E6E9EF] bg-[#F7F8FA] text-[11px] font-semibold text-[#707987]">
                  <th className="py-3 px-4">Purchase ID</th>
                  <th className="py-3 px-4">Material</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4 text-right">Ordered Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4">Delivery Progress</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Delivery Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E9EF] text-xs">
                {filteredPurchases.map((po) => {
                  const delStats = getPurchaseDeliveryStats(po, deliveries);
                  return (
                    <tr
                      key={po.id}
                      onClick={() => setSelectedPurchaseId(po.id)}
                      className="hover:bg-[#F7F8FA] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-[#172B4D] whitespace-nowrap">
                        {po.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#20252D]">{po.materialName}</div>
                        <div className="text-[11px] text-[#707987]">{po.category}</div>
                      </td>
                      <td className="py-3 px-4 text-[#20252D]">{po.supplier}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                        {po.quantityOrdered} {po.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#707987] whitespace-nowrap">
                        {formatINR(po.unitPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#172B4D] whitespace-nowrap">
                        {formatINR(po.totalAmount)}
                      </td>
                      <td className="py-3 px-4 min-w-[140px]">
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                          <span>
                            {delStats.deliveredQuantity}/{po.quantityOrdered}
                          </span>
                          <span>{delStats.deliveryPercentage}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#F0F2F5] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              delStats.deliveryStatus === 'Delivered'
                                ? 'bg-[#16A34A]'
                                : 'bg-[#2563EB]'
                            }`}
                            style={{ width: `${delStats.deliveryPercentage}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#707987] whitespace-nowrap">
                        {formatDate(po.purchaseDate)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge label={delStats.deliveryStatus} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPurchaseId(po.id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E6E9EF] text-[#172B4D] hover:bg-[#F0F2F5] cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PurchaseDetailDrawer
        purchase={selectedPurchase}
        onClose={() => setSelectedPurchaseId(null)}
        onRecordDelivery={(poId) => {
          setDeliveryDefaultPo(poId);
          setDeliveryModalOpen(true);
        }}
      />

      <PurchaseFormModal open={purchaseModalOpen} onClose={() => setPurchaseModalOpen(false)} />

      <DeliveryFormModal
        open={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        defaultPurchaseId={deliveryDefaultPo}
      />
    </div>
  );
};
