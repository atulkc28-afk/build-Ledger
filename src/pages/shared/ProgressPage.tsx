import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  HardHat,
  Info,
  Plus,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SummaryCard } from '../../components/common/SummaryCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { ProgressUpdateModal } from '../../components/modals/ProgressUpdateModal';
import { DisputeModal } from '../../components/modals/DisputeModal';
import { calculateOverallReportedProgress } from '../../utils/calculations';
import { formatDate } from '../../utils/formatters';

export const ProgressPage: React.FC = () => {
  const {
    currentRole,
    activeProject,
    stages,
    progressUpdates,
    acknowledgeRecord,
    raiseDispute,
  } = useApp();

  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [concernTargetId, setConcernTargetId] = useState<string | null>(null);

  const projectStages = useMemo(
    () =>
      stages
        .filter((s) => s.projectId === activeProject.id)
        .sort((a, b) => a.order - b.order),
    [stages, activeProject.id],
  );

  const projectUpdates = useMemo(
    () =>
      progressUpdates
        .filter((u) => u.projectId === activeProject.id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [progressUpdates, activeProject.id],
  );

  const overallProgress = calculateOverallReportedProgress(stages, activeProject.id);
  const completedCount = projectStages.filter((s) => s.status === 'Completed').length;
  const currentStage =
    projectStages.find((s) => s.status === 'In Progress') ?? projectStages[0];
  const latestUpdateDate = projectUpdates[0]?.date;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#172B4D]">
            {currentRole === 'homeowner' ? 'Construction Progress' : 'Progress Updates'}
          </h1>
          <p className="mt-1 text-sm text-[#707987]">
            Stage-wise milestone tracking and site photographs for {activeProject.name}
          </p>
        </div>

        {currentRole === 'contractor' && (
          <button
            type="button"
            onClick={() => setUpdateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Submit Progress Update
          </button>
        )}
      </div>

      {/* Explicit Contractor-Reported Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-[#E6E9EF] text-xs text-[#707987]">
        <Info className="w-4 h-4 text-[#172B4D] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#172B4D]">Contractor-Reported Information:</strong> Progress
          percentages and stage milestones below are submitted by the contractor. Homeowner
          acknowledgement confirms receipt of the update and does not constitute an independent
          engineering or structural inspection.
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Overall Reported Progress"
          value={`${overallProgress}%`}
          subtitle="Contractor-reported average"
          icon={HardHat}
          statusLabel={activeProject.status}
          statusTone="blue"
        />
        <SummaryCard
          title="Current Stage"
          value={currentStage?.name || '—'}
          subtitle={`${currentStage?.reportedProgress ?? 0}% reported in stage`}
          icon={HardHat}
        />
        <SummaryCard
          title="Latest Update Date"
          value={latestUpdateDate ? formatDate(latestUpdateDate) : '—'}
          subtitle={`${projectUpdates.length} logged site updates`}
          icon={Calendar}
        />
        <SummaryCard
          title="Completed Stages"
          value={`${completedCount} / ${projectStages.length}`}
          subtitle="Milestones marked 100%"
          icon={CheckCircle2}
          statusLabel="On Track"
          statusTone="green"
        />
      </div>

      {/* 10 Construction Stages Visual Tracker */}
      <section className="bg-white border border-[#E6E9EF] rounded-xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-[#172B4D]">Construction Stages</h2>
            <p className="text-xs text-[#707987]">
              Sequential residential build schedule ({projectStages.length} stages)
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-[#172B4D]">
            {overallProgress}% overall
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projectStages.map((stage) => (
            <div
              key={stage.id}
              className="p-4 rounded-xl border border-[#E6E9EF] bg-[#F7F8FA]/50 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-[#172B4D]">
                    {String(stage.order).padStart(2, '0')}. {stage.name}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#707987] font-mono">
                    {stage.startDate ? `Started ${formatDate(stage.startDate)} · ` : ''}
                    {stage.actualCompletionDate
                      ? `Completed ${formatDate(stage.actualCompletionDate)}`
                      : `Target ${formatDate(stage.expectedCompletionDate)}`}
                  </div>
                </div>
                <StatusBadge label={stage.status} />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-[#E6E9EF] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      stage.status === 'Completed'
                        ? 'bg-[#16A34A]'
                        : stage.status === 'Delayed'
                          ? 'bg-[#DC2626]'
                          : 'bg-[#172B4D]'
                    }`}
                    style={{ width: `${stage.reportedProgress}%` }}
                  />
                </div>
                <span className="font-mono text-xs font-semibold text-[#172B4D] w-10 text-right tabular-nums">
                  {stage.reportedProgress}%
                </span>
              </div>

              <p className="text-xs text-[#707987] leading-relaxed">{stage.contractorNotes}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Chronological Progress Updates */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-[#172B4D]">
          Site Progress Updates ({projectUpdates.length})
        </h2>

        {projectUpdates.length === 0 ? (
          <EmptyState
            icon={HardHat}
            title="No progress updates recorded yet"
            description="Site engineers or contractors can submit stage updates along with site photographs."
            actionLabel={currentRole === 'contractor' ? 'Submit Progress Update' : undefined}
            onAction={
              currentRole === 'contractor' ? () => setUpdateModalOpen(true) : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {projectUpdates.map((upd) => (
              <div
                key={upd.id}
                className="bg-white border border-[#E6E9EF] rounded-xl p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
              >
                {upd.photoUrls.length > 0 && (
                  <div className="lg:col-span-4 rounded-lg overflow-hidden border border-[#E6E9EF] bg-[#F7F8FA]">
                    <img
                      src={upd.photoUrls[0]}
                      alt={`${upd.stageName} site update`}
                      referrerPolicy="no-referrer"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                <div
                  className={`${
                    upd.photoUrls.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'
                  } space-y-3`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#707987]">
                      <span className="font-mono font-semibold text-[#172B4D]">{upd.id}</span>
                      <span>·</span>
                      <span className="font-semibold text-[#172B4D]">{upd.stageName}</span>
                      <span>·</span>
                      <span className="font-mono">{formatDate(upd.date)}</span>
                      <span>·</span>
                      <span>Reported by {upd.submittedBy}</span>
                    </div>
                    <StatusBadge
                      label={
                        upd.approvalStatus === 'Approved'
                          ? 'Acknowledged'
                          : upd.approvalStatus
                      }
                      tone={
                        upd.approvalStatus === 'Approved'
                          ? 'green'
                          : upd.approvalStatus === 'Disputed'
                            ? 'red'
                            : 'amber'
                      }
                    />
                  </div>

                  <p className="text-sm text-[#20252D] leading-relaxed">{upd.description}</p>

                  <div className="text-xs text-[#707987]">
                    Contractor-reported stage completion:{' '}
                    <strong className="font-mono text-[#172B4D]">{upd.reportedPercentage}%</strong>
                  </div>

                  {upd.dispute && (
                    <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#7F1D1D]">
                      <strong>Concern Raised ({upd.dispute.reason}):</strong>{' '}
                      {upd.dispute.description}
                    </div>
                  )}

                  {currentRole === 'homeowner' && upd.approvalStatus !== 'Approved' && (
                    <div className="pt-2 flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => acknowledgeRecord('progress', upd.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#16A34A] text-white hover:bg-[#15803D] cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Acknowledge Update
                      </button>
                      {upd.approvalStatus !== 'Disputed' && (
                        <button
                          type="button"
                          onClick={() => setConcernTargetId(upd.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2] cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Raise Concern
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ProgressUpdateModal open={updateModalOpen} onClose={() => setUpdateModalOpen(false)} />

      <DisputeModal
        open={Boolean(concernTargetId)}
        onClose={() => setConcernTargetId(null)}
        recordLabel={concernTargetId || ''}
        onSubmitDispute={(reason, description, att) => {
          if (concernTargetId) {
            raiseDispute('progress', concernTargetId, reason, description, att);
          }
        }}
      />
    </div>
  );
};
