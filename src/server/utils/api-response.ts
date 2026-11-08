import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';

export interface PaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  code: string;
}

export class ApiResponse {
  static success<T>(
    data: T,
    message: string = 'Success',
    meta?: PaginationMeta,
    statusCode: number = 200
  ): NextResponse<ApiSuccessResponse<T>> {
    const body: ApiSuccessResponse<T> = {
      success: true,
      message,
      data,
      ...(meta ? { meta } : {}),
    };
    return NextResponse.json(body, { status: statusCode });
  }

  static created<T>(
    data: T,
    message: string = 'Created successfully'
  ): NextResponse<ApiSuccessResponse<T>> {
    return this.success(data, message, undefined, 201);
  }

  static error(
    message: string = 'An unexpected error occurred',
    statusCode: number = 500,
    code: string = 'INTERNAL_SERVER_ERROR',
    errors?: Record<string, string[]>
  ): NextResponse<ApiErrorResponse> {
    const body: ApiErrorResponse = {
      success: false,
      message,
      code,
      ...(errors ? { errors } : {}),
    };
    return NextResponse.json(body, { status: statusCode });
  }

  static handle(error: unknown): NextResponse<ApiErrorResponse> {
    if (error instanceof AppError) {
      return this.error(error.message, error.statusCode, error.code, error.errors);
    }

    if (error instanceof ZodError) {
      const formattedErrors: Record<string, string[]> = {};
      for (const issue of error.issues) {
        const path = issue.path.join('.') || 'general';
        if (!formattedErrors[path]) {
          formattedErrors[path] = [];
        }
        formattedErrors[path].push(issue.message);
      }
      return this.error('Validation failed', 400, 'VALIDATION_ERROR', formattedErrors);
    }

    const err = error as Error;
    console.error('[API Unhandled Error]:', err);
    return this.error(
      process.env.NODE_ENV === 'production' ? 'An internal server error occurred' : err?.message || 'Unknown error',
      500,
      'INTERNAL_SERVER_ERROR'
    );
  }
}
