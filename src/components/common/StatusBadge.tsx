import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileEdit,
  Info,
  XCircle,
} from 'lucide-react';

export type StatusTone = 'green' | 'amber' | 'red' | 'blue' | 'neutral';

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  size?: 'sm' | 'md';
}

const TONE_MAP: Record<StatusTone, string> = {
  green: 'text-[#15803D] bg-[#F0FDF4] border-[#BBF7D0]',
  amber: 'text-[#B45309] bg-[#FFFBEB] border-[#FDE68A]',
  red: 'text-[#B91C1C] bg-[#FEF2F2] border-[#FECACA]',
  blue: 'text-[#1D4ED8] bg-[#EFF6FF] border-[#BFDBFE]',
  neutral: 'text-[#475569] bg-[#F8FAFC] border-[#E2E8F0]',
};

export function inferStatusTone(status: string): StatusTone {
  const s = status.toLowerCase();
  if (
    s === 'approved' ||
    s === 'completed' ||
    s === 'paid' ||
    s === 'delivered' ||
    s === 'acknowledged' ||
    s === 'resolved'
  ) {
    return 'green';
  }
  if (
    s === 'pending' ||
    s === 'pending review' ||
    s === 'awaiting review' ||
    s === 'partial' ||
    s === 'partially delivered'
  ) {
    return 'amber';
  }
  if (s === 'disputed' || s === 'overdue' || s === 'delayed' || s === 'over budget') {
    return 'red';
  }
  if (s === 'in progress' || s === 'partial delivery') {
    return 'blue';
  }
  return 'neutral';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, tone, size = 'sm' }) => {
  const resolvedTone = tone ?? inferStatusTone(label);

  const Icon =
    resolvedTone === 'green'
      ? CheckCircle2
      : resolvedTone === 'amber'
        ? Clock
        : resolvedTone === 'red'
          ? label.toLowerCase().includes('overdue') || label.toLowerCase().includes('delayed')
            ? AlertTriangle
            : XCircle
          : resolvedTone === 'blue'
            ? Info
            : FileEdit;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium whitespace-nowrap shrink-0 ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      } ${TONE_MAP[resolvedTone]}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};
