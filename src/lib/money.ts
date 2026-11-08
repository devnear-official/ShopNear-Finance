import Decimal from 'decimal.js';

/**
 * Money utilities for ShopNear Finance.
 * All monetary amounts in the database are stored as INTEGER PAISA (1 BDT = 100 paisa).
 * E.g., ৳1,250.50 is stored as 125050.
 */

export class InvalidMoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMoneyError';
  }
}

/**
 * Converts a BDT string, number, or decimal into integer paisa.
 * Validates that input is a valid finite number with at most 2 decimal places.
 * Negative numbers can be disallowed by default.
 */
export function toPaisa(amount: string | number, allowNegative: boolean = false): number {
  if (amount === '' || amount === null || amount === undefined) {
    throw new InvalidMoneyError('Amount is required');
  }

  const str = String(amount).trim().replace(/,/g, '');
  if (!/^-?\d+(\.\d{1,2})?$/.test(str)) {
    throw new InvalidMoneyError(`Invalid amount format: "${amount}". Maximum 2 decimal places allowed.`);
  }

  const dec = new Decimal(str);
  if (!dec.isFinite()) {
    throw new InvalidMoneyError('Amount must be a finite number');
  }

  if (!allowNegative && dec.isNegative()) {
    throw new InvalidMoneyError('Negative amount is not allowed');
  }

  // Multiply by 100 and round half-up to ensure exact integer paisa
  return dec.times(100).round().toNumber();
}

/**
 * Converts integer paisa into a standard decimal string (e.g. 125050 -> "1250.50").
 */
export function fromPaisa(paisa: number): string {
  if (!Number.isInteger(paisa)) {
    throw new InvalidMoneyError(`Paisa must be an integer, received: ${paisa}`);
  }
  const dec = new Decimal(paisa).dividedBy(100);
  return dec.toFixed(2);
}

/**
 * Converts integer paisa into a floating decimal number for math if needed (e.g. 125050 -> 1250.50).
 */
export function paisaToDecimal(paisa: number): Decimal {
  if (!Number.isInteger(paisa)) {
    throw new InvalidMoneyError(`Paisa must be an integer, received: ${paisa}`);
  }
  return new Decimal(paisa).dividedBy(100);
}

/**
 * Formats integer paisa as Bangladeshi Taka string (e.g. 125050 -> "৳1,250.50").
 * Formats negatives as "-৳1,250.50".
 */
export function formatBDT(paisa: number, showSymbol: boolean = true): string {
  if (!Number.isInteger(paisa)) {
    paisa = Math.round(paisa);
  }

  const isNegative = paisa < 0;
  const absPaisa = Math.abs(paisa);
  const integerPart = Math.floor(absPaisa / 100);
  const decimalPart = (absPaisa % 100).toString().padStart(2, '0');

  // Format with Bangladeshi/Indian numbering style (lakhs/crores: 12,34,567.89)
  // or standard international: 1,234,567.89
  const formattedInteger = formatBangladeshiNumber(integerPart);
  const formatted = `${formattedInteger}.${decimalPart}`;
  const prefix = showSymbol ? '৳' : '';

  if (isNegative) {
    return `-${prefix}${formatted}`;
  }
  return `${prefix}${formatted}`;
}

/**
 * Helper to format integers using Bangladeshi/South Asian numbering (e.g. 1,00,000).
 */
function formatBangladeshiNumber(num: number): string {
  const str = num.toString();
  if (str.length <= 3) {
    return str;
  }
  const lastThree = str.substring(str.length - 3);
  const rest = str.substring(0, str.length - 3);
  const withCommas = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${withCommas},${lastThree}`;
}

/**
 * Calculate percentage of an integer paisa amount, returning rounded integer paisa.
 * Rounding mode: HALF_UP.
 */
export function calculatePercentagePaisa(paisa: number, percentRate: number | string): number {
  const base = new Decimal(paisa);
  const rate = new Decimal(percentRate).dividedBy(100);
  return base.times(rate).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}
