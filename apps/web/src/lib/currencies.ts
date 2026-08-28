export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rateToInr: number; // 1 Unit in INR
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', rateToInr: 1.0 },
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', rateToInr: 83.5 },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', rateToInr: 91.2 },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', rateToInr: 108.5 },
  NPR: { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨', flag: '🇳🇵', rateToInr: 0.625 },
  THB: { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', rateToInr: 2.35 },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', rateToInr: 22.75 },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', rateToInr: 63.8 },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', rateToInr: 0.58 },
};

/**
 * Convert an amount from one currency to another using INR as base
 */
export function convertCurrency(
  amount: number,
  fromCode: string = 'INR',
  toCode: string = 'INR'
): number {
  if (fromCode === toCode || !amount) return amount;

  const fromRate = SUPPORTED_CURRENCIES[fromCode]?.rateToInr || 1.0;
  const toRate = SUPPORTED_CURRENCIES[toCode]?.rateToInr || 1.0;

  // Convert to INR first, then to target
  const amountInInr = amount * fromRate;
  const convertedAmount = amountInInr / toRate;

  return Math.round(convertedAmount * 100) / 100;
}

/**
 * Format currency with native symbol and standard delimiters
 */
export function formatCurrencyWithSymbol(amount: number, currencyCode: string = 'INR'): string {
  const curr = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.INR;
  return `${curr.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
