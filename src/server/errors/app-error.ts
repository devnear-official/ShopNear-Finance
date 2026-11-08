export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'PERIOD_CLOSED'
  | 'UNBALANCED_ENTRY'
  | 'INSUFFICIENT_FUNDS'
  | 'INSUFFICIENT_CAPITAL'
  | 'DUPLICATE_REQUEST'
  | 'CONFLICT'
  | 'IMMUTABLE_RECORD'
  | 'INTERNAL_SERVER_ERROR';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly errors?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = 'INTERNAL_SERVER_ERROR',
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', errors?: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR', errors);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class PeriodClosedError extends AppError {
  constructor(message: string = 'Accounting period is closed or locked') {
    super(message, 400, 'PERIOD_CLOSED');
    this.name = 'PeriodClosedError';
  }
}

export class UnbalancedEntryError extends AppError {
  constructor(message: string = 'Debit and credit must be equal for all journal entries') {
    super(message, 400, 'UNBALANCED_ENTRY');
    this.name = 'UnbalancedEntryError';
  }
}

export class InsufficientFundsError extends AppError {
  constructor(message: string = 'Insufficient funds in the selected account') {
    super(message, 400, 'INSUFFICIENT_FUNDS');
    this.name = 'InsufficientFundsError';
  }
}

export class InsufficientCapitalError extends AppError {
  constructor(message: string = 'Withdrawal amount exceeds investor available capital') {
    super(message, 400, 'INSUFFICIENT_CAPITAL');
    this.name = 'InsufficientCapitalError';
  }
}

export class DuplicateRequestError extends AppError {
  constructor(message: string = 'Duplicate request or idempotency conflict') {
    super(message, 409, 'DUPLICATE_REQUEST');
    this.name = 'DuplicateRequestError';
  }
}

export class ImmutableRecordError extends AppError {
  constructor(message: string = 'Posted financial records are immutable and cannot be updated or deleted') {
    super(message, 400, 'IMMUTABLE_RECORD');
    this.name = 'ImmutableRecordError';
  }
}
