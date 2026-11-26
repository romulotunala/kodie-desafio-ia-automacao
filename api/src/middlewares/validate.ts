import type { RequestHandler } from 'express';
import type { z } from 'zod';

import { AppError, type ErrorDetail } from '../lib/errors.js';

function toErrorDetails(error: z.ZodError): ErrorDetail[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '(body)',
    message: issue.message,
  }));
}

/**
 * Validates `req.body` against a Zod schema and replaces it with the parsed output
 * (defaults applied, unknown keys stripped). The returned handler is typed with the
 * schema output, so the next handler in the same route receives a typed `req.body`.
 */
export function validate<TSchema extends z.ZodType>(
  schema: TSchema,
): RequestHandler<Record<string, string>, unknown, z.output<TSchema>> {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(
        new AppError('VALIDATION_ERROR', 'Request body is invalid', {
          details: toErrorDetails(result.error),
        }),
      );
      return;
    }

    req.body = result.data;
    next();
  };
}
