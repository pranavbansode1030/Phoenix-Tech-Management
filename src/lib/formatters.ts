/**
 * Phoenix Finance - Currency & Date Formatters
 * Formatted for Indian Standard Accounting (INR ₹, Lakhs & Crores)
 */

export function formatINR(amount: number, showDecimals: boolean = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0.00';
  }

  // Format using Indian locale
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });

  return formatter.format(amount);
}

export function formatShortINR(amount: number): string {
  if (Math.abs(amount) >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  if (Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(1)} K`;
  }
  return formatINR(amount, false);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatMonthYear(dateString: string): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

export function formatPercentage(val: number): string {
  return `${(val || 0).toFixed(1)}%`;
}

