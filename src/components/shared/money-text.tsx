import React from 'react';
import { formatBDT } from '@/lib/money';
import { cn } from '@/lib/utils';

export interface MoneyTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  paisa: number;
  showSignColor?: boolean;
  showSymbol?: boolean;
  prefix?: string;
}

export function MoneyText({
  paisa,
  showSignColor = false,
  showSymbol = true,
  prefix = '',
  className,
  ...props
}: MoneyTextProps) {
  const isNegative = paisa < 0;
  const isPositive = paisa > 0;
  const formatted = formatBDT(paisa, showSymbol);

  return (
    <span
      className={cn(
        'font-medium tabular-nums tracking-tight',
        showSignColor && isNegative && 'text-red-600 dark:text-red-400',
        showSignColor && isPositive && 'text-emerald-600 dark:text-emerald-400',
        className
      )}
      {...props}
    >
      {prefix}
      {formatted}
    </span>
  );
}
