import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';

/**
 * Shared registry: each route file registers its own paths at import time.
 * The document must be generated only after all routes are imported (see app.ts).
 *
 * Schemas become `components.schemas` entries (named by `.meta({ id })`) when a
 * registered path references them; standalone schemas are not emitted.
 */
export const registry = new OpenAPIRegistry();

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
