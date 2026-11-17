import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="bg-white border border-[#E6E9EF] rounded-xl px-6 py-12 text-center flex flex-col items-center justify-center">
      <div className="w-11 h-11 rounded-lg bg-[#F0F2F5] flex items-center justify-center text-[#707987] mb-3">
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-[#172B4D]">{title}</h3>
      <p className="mt-1 text-sm text-[#707987] max-w-md">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-[#172B4D] text-white hover:bg-[#172B4D]/90 transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
