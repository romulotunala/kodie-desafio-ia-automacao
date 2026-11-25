import type { ErrorRequestHandler, RequestHandler } from 'express';
import { z } from 'zod';

export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'PAYLOAD_TOO_LARGE',
  'INTERNAL_ERROR',
  'AI_INVALID_RESPONSE',
  'AI_UNAVAILABLE',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** HTTP status for each error code; `satisfies` guarantees every code is mapped. */
export const ERROR_STATUS = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL_ERROR: 500,
  AI_INVALID_RESPONSE: 502,
  AI_UNAVAILABLE: 503,
} as const satisfies Record<ErrorCode, number>;

export const ErrorDetailSchema = z.object({
  field: z.string().meta({ example: 'message' }),
  message: z.string().meta({ example: 'Too small: expected string to have >=5 characters' }),
});

export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;

export const ErrorResponseSchema = z
  .object({
    error: z.object({
      code: z.enum(ERROR_CODES),
      message: z.string().meta({ example: 'Request body is invalid' }),
      details: z.array(ErrorDetailSchema),
    }),
  })
  .meta({ id: 'ErrorResponse', description: 'Envelope padrão de erro' });

type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export class AppError extends Error {
  override readonly name = 'AppError';
  readonly status: number;

  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details: readonly ErrorDetail[] = [],
  ) {
    super(message);
    this.status = ERROR_STATUS[code];
  }
}

/** Shape of errors thrown by Express's body parser (http-errors). */
const BodyParserErrorSchema = z.object({
  status: z.number().int().min(400).max(499),
  type: z.string(),
});

const INTERNAL_ERROR_MESSAGE = 'Internal server error';

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const bodyParserError = BodyParserErrorSchema.safeParse(error);
  if (!bodyParserError.success) {
    return new AppError('INTERNAL_ERROR', INTERNAL_ERROR_MESSAGE);
  }

  if (bodyParserError.data.status === ERROR_STATUS.PAYLOAD_TOO_LARGE) {
    return new AppError('PAYLOAD_TOO_LARGE', 'Request body is too large');
  }

  return new AppError('VALIDATION_ERROR', 'Request body is not valid JSON');
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError('NOT_FOUND', `Route ${req.method} ${req.path} not found`));
};

// Express identifies error middleware by arity, so all 4 parameters are required.
export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  const appError = toAppError(error);

  if (appError.status >= 500) {
    req.log.error({ err: error }, appError.message);
  }

  const body: ErrorResponse = {
    error: { code: appError.code, message: appError.message, details: [...appError.details] },
  };

  res.status(appError.status).json(body);
};
