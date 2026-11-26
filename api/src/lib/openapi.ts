import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';

import { ERROR_STATUS, ErrorResponseSchema, type ErrorCode } from './errors.js';

/** Base path for the business endpoints (one router per case is mounted under it). */
export const API_PREFIX = '/api/v1';

/**
 * Shared registry: each route file registers its own paths at import time.
 * The document must be generated only after all routes are imported (see app.ts).
 *
 * Schemas become `components.schemas` entries (named by `.meta({ id })`) when a
 * registered path references them; standalone schemas are not emitted.
 */
export const registry = new OpenAPIRegistry();

const ERROR_DESCRIPTIONS = {
  VALIDATION_ERROR: 'Entrada inválida (detalhes por campo em `details`)',
  NOT_FOUND: 'Rota inexistente',
  PAYLOAD_TOO_LARGE: 'Corpo da requisição acima do limite',
  INTERNAL_ERROR: 'Erro interno (inclui configuração inválida do Gemini)',
  AI_INVALID_RESPONSE: 'A IA respondeu fora do formato esperado, mesmo após 1 nova tentativa',
  AI_UNAVAILABLE: 'IA indisponível: timeout, falha de rede ou limite de uso',
} as const satisfies Record<ErrorCode, string>;

/** OpenAPI `responses` entries for the given error codes, all using the error envelope. */
export function errorResponses(codes: readonly ErrorCode[]) {
  return Object.fromEntries(
    codes.map((code) => [
      ERROR_STATUS[code],
      {
        description: `\`${code}\` — ${ERROR_DESCRIPTIONS[code]}`,
        content: { 'application/json': { schema: ErrorResponseSchema } },
      },
    ]),
  );
}

export function buildOpenApiDocument() {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Loja Aurora — API de IA',
      version: '1.0.0',
      description:
        'API que interpreta mensagens de clientes da Loja Aurora com Google Gemini e devolve JSON estruturado.',
    },
  });
}
