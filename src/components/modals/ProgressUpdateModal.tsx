import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { StageStatus } from '../../types';
import { SITE_PHOTOS } from '../../data/sitePhotos';

interface ProgressUpdateModalProps {
  open: boolean;
  onClose: () => void;
}

const SAMPLE_SITE_PHOTOS = [
  { label: 'Foundation & Footings', url: SITE_PHOTOS.foundation },
  { label: 'RCC Frame & Roof Slab', url: SITE_PHOTOS.structuralRcc },
  { label: 'Clay Brick Masonry', url: SITE_PHOTOS.brickwork },
  { label: 'Electrical & Plumbing Rough-In', url: SITE_PHOTOS.mepRoughin },
];

export const ProgressUpdateModal: React.FC<ProgressUpdateModalProps> = ({ open, onClose }) => {
  const { activeProject, stages, addProgressUpdate } = useApp();
  const projectStages = stages
    .filter((s) => s.projectId === activeProject.id)
    .sort((a, b) => a.order - b.order);

  const [stageId, setStageId] = useState('');
  const [stageStatus, setStageStatus] = useState<StageStatus>('In Progress');
  const [reportedPercentage, setReportedPercentage] = useState(50);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(SITE_PHOTOS.mepRoughin);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const activeStage =
      projectStages.find((s) => s.status === 'In Progress') ?? projectStages[0];
    if (activeStage) {
      setStageId(activeStage.id);
      setStageStatus(activeStage.status === 'Not Started' ? 'In Progress' : activeStage.status);
      setReportedPercentage(activeStage.reportedProgress);
    }
    setDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setSelectedPhotoUrl(SITE_PHOTOS.mepRoughin);
    setError('');
  }, [open]);

  const handleStageChange = (id: string) => {
    setStageId(id);
    const st = projectStages.find((s) => s.id === id);
    if (st) {
      setReportedPercentage(st.reportedProgress);
      setStageStatus(st.status === 'Not Started' ? 'In Progress' : st.status);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageId) {
      setError('Select a construction stage.');
      return;
    }
    if (!description.trim()) {
      setError('Provide a concise description of work completed.');
      return;
    }
    addProgressUpdate({
      stageId,
      date,
      description: description.trim(),
      reportedPercentage: stageStatus === 'Completed' ? 100 : reportedPercentage,
      stageStatus,
      photoUrls: selectedPhotoUrl ? [selectedPhotoUrl] : [],
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Submit Construction Progress Update"
      subtitle="Progress updates are logged as contractor-reported milestones for homeowner review"
      maxWidthClass="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">
              Construction Stage *
            </label>
            <select
              value={stageId}
              onChange={(e) => handleStageChange(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] bg-white focus:outline-none focus:border-[#172B4D]"
            >
              {projectStages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.order}. {s.name} ({s.reportedProgress}%)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">Stage Status *</label>
            <select
              value={stageStatus}
              onChange={(e) => {
                const next = e.target.value as StageStatus;
                setStageStatus(next);
                if (next === 'Completed') setReportedPercentage(100);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] bg-white focus:outline-none focus:border-[#172B4D]"
            >
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
              <option value="Not Started">Not Started</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">
              Contractor-Reported Stage Completion ({reportedPercentage}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={stageStatus === 'Completed' ? 100 : reportedPercentage}
              onChange={(e) => setReportedPercentage(Number(e.target.value))}
              className="w-full accent-[#172B4D]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#20252D] mb-1">Update Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#20252D] mb-1">
            Work Completed & Site Notes *
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe structural, masonry, or MEP work completed on site..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E9EF] focus:outline-none focus:border-[#172B4D]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#20252D] mb-1.5">
            Attach Site Photograph
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SAMPLE_SITE_PHOTOS.map((photo) => (
              <button
                key={photo.label}
                type="button"
                onClick={() => setSelectedPhotoUrl(photo.url)}
                className={`text-left rounded-lg border overflow-hidden cursor-pointer transition-colors ${
                  selectedPhotoUrl === photo.url
                    ? 'border-[#172B4D] ring-2 ring-[#172B4D]/20'
                    : 'border-[#E6E9EF] hover:border-[#94A3B8]'
                }`}
              >
                <img
                  src={photo.url}
                  alt={photo.label}
                  referrerPolicy="no-referrer"
                  className="w-full h-16 object-cover"
                />
                <div className="px-1.5 py-1 text-[10px] font-medium text-[#20252D] truncate">
                  {photo.label}
                </div>
              </button>
            ))}
          </div>
        </div>

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
            Submit Progress Update
          </button>
        </div>
      </form>
    </Modal>
  );
};
