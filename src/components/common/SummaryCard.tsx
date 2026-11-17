import React from 'react';
import { LucideIcon } from 'lucide-react';
import { StatusBadge, StatusTone } from './StatusBadge';

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  statusLabel?: string;
  statusTone?: StatusTone;
  onClick?: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  statusLabel,
  statusTone,
  onClick,
}) => {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full text-left bg-white border border-[#E6E9EF] rounded-xl p-5 transition-colors ${
        onClick ? 'hover:border-[#172B4D]/30 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#172B4D]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium text-[#707987] leading-snug">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-[#F0F2F5] flex items-center justify-center text-[#172B4D] shrink-0">
          <Icon className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-2.5 text-2xl font-bold tracking-tight text-[#172B4D] font-mono tabular-nums">
        {value}
      </div>
      {(subtitle || statusLabel) && (
        <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap">
          {subtitle && <span className="text-xs text-[#707987]">{subtitle}</span>}
          {statusLabel && <StatusBadge label={statusLabel} tone={statusTone} />}
        </div>
      )}
    </Comp>
  );
};
