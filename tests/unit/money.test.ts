import { describe, it, expect } from 'vitest';
import { toPaisa, fromPaisa, formatBDT, calculatePercentagePaisa, InvalidMoneyError } from '@/lib/money';

describe('lib/money', () => {
  it('converts decimal string and numbers to paisa correctly', () => {
    expect(toPaisa('1250.50')).toBe(125050);
    expect(toPaisa('1250')).toBe(125000);
    expect(toPaisa(1250.5)).toBe(125050);
    expect(toPaisa('0.05')).toBe(5);
    expect(toPaisa('1,250.50')).toBe(125050);
  });

  it('rejects invalid formats and excess decimals', () => {
    expect(() => toPaisa('1250.555')).toThrow(InvalidMoneyError);
    expect(() => toPaisa('abc')).toThrow(InvalidMoneyError);
    expect(() => toPaisa('-50')).toThrow(InvalidMoneyError);
    expect(toPaisa('-50', true)).toBe(-5000);
  });

  it('converts paisa back to decimal string', () => {
    expect(fromPaisa(125050)).toBe('1250.50');
    expect(fromPaisa(500)).toBe('5.00');
    expect(fromPaisa(5)).toBe('0.05');
    expect(fromPaisa(0)).toBe('0.00');
  });

  it('formats BDT with correct symbol and thousands grouping', () => {
    expect(formatBDT(125050)).toBe('৳1,250.50');
    expect(formatBDT(10000000)).toBe('৳1,00,000.00'); // 1 Lakh BDT
    expect(formatBDT(-50000)).toBe('-৳500.00');
  });

  it('calculates rounded percentage', () => {
    // 15% of 1,000 BDT (100000 paisa) = 150 BDT (15000 paisa)
    expect(calculatePercentagePaisa(100000, 15)).toBe(15000);
    // 33.333% of 100 BDT (10000 paisa) = 3333 paisa (rounded)
    expect(calculatePercentagePaisa(10000, 33.333)).toBe(3333);
  });
});
