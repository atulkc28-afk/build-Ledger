export function formatINR(amount: number): string {
  const isNegative = amount < 0;
  const abs = Math.round(Math.abs(amount));
  const formatted = abs.toLocaleString('en-IN');
  return `${isNegative ? '-' : ''}₹${formatted}`;
}

export function formatINRCompact(amount: number): string {
  const abs = Math.abs(amount);
  const prefix = amount < 0 ? '-' : '';
  if (abs >= 10000000) {
    return `${prefix}₹${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${prefix}₹${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${prefix}₹${(abs / 1000).toFixed(1)}k`;
  }
  return formatINR(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(isoStr: string): string {
  if (!isoStr) return '—';
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return isoStr;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function generateReferenceId(prefix: string, existingIds: string[]): string {
  const numbers = existingIds
    .map((id) => {
      const match = id.match(/\d+$/);
      return match ? parseInt(match[0], 10) : 0;
    })
    .filter((n) => !Number.isNaN(n));
  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1001;
  return `${prefix}-${next}`;
}
