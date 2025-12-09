import { format } from 'date-fns';
import type { Provider } from './database.types';

export function generateTxnId(): string {
  const date = format(new Date(), 'yyyyMMdd');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${date}-${random}`;
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return format(date, 'MMM dd, yyyy • hh:mm a');
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return format(date, 'MMM dd, yyyy');
}

export function formatTimeShort(dateString: string): string {
  const date = new Date(dateString);
  return format(date, 'hh:mm a');
}

export function getProviderColors(provider: Provider) {
  switch (provider) {
    case 'GPay':
      return {
        primary: '#1a73e8', // Google Blue
        secondary: '#34A853',
        gradient: 'bg-white', // GPay is mostly white now
        headerBg: 'bg-white',
        bg: 'bg-white',
        text: 'text-gray-900',
        border: 'border-gray-200',
        accent: 'text-blue-600',
      };
    case 'PhonePe':
      return {
        primary: '#6739b7', // PhonePe Purple
        secondary: '#7C3AA8',
        gradient: 'from-[#6739b7] to-[#512da8]',
        headerBg: 'bg-[#6739b7]',
        bg: 'bg-[#f1f3f6]', // Light gray background
        text: 'text-[#6739b7]',
        border: 'border-[#6739b7]',
        accent: 'text-[#6739b7]',
      };
    case 'Paytm':
      return {
        primary: '#00BAF2', // Paytm Blue
        secondary: '#002E6E', // Dark Blue
        gradient: 'from-[#00baf2] to-[#002e6e]',
        headerBg: 'bg-white', // Paytm new UI is white header
        bg: 'bg-[#f5f7fa]',
        text: 'text-[#002E6E]',
        border: 'border-[#e0e0e0]',
        accent: 'text-[#00BAF2]',
      };
  }
}

export function validateUPIId(upiId: string): boolean {
  const upiRegex = /^[\w.-]+@[\w.-]+$/;
  return upiRegex.test(upiId);
}

export function validateAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 100000;
}

export function exportToJSON(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          const stringValue = value?.toString() || '';
          return `"${stringValue.replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ];

  const csv = csvRows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateQRPayload(upiId: string, name: string, amount?: number): string {
  let payload = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}`;
  if (amount) {
    payload += `&am=${amount}`;
  }
  payload += '&cu=INR';
  return payload;
}

export function parseQRPayload(payload: string): {
  upiId: string;
  name: string;
  amount?: number;
} | null {
  try {
    const url = new URL(payload);
    if (url.protocol !== 'upi:' || !url.pathname.startsWith('//pay')) {
      return null;
    }

    const params = url.searchParams;
    const upiId = params.get('pa');
    const name = params.get('pn');
    const amount = params.get('am');

    if (!upiId || !name) {
      return null;
    }

    return {
      upiId,
      name: decodeURIComponent(name),
      amount: amount ? parseFloat(amount) : undefined,
    };
  } catch {
    return null;
  }
}

export function getRandomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shouldTransactionSucceed(successRate: number): boolean {
  return Math.random() < successRate;
}

export function getRandomFailureReason(): string {
  const reasons = [
    'Insufficient funds',
    'Network timeout',
    'UPI ID not found',
    'Bank server unavailable',
    'Transaction declined by bank',
    'Daily limit exceeded',
    'Invalid UPI PIN',
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
}