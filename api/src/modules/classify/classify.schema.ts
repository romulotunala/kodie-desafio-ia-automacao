import { z } from 'zod';

import { envelopeSchema } from '../../lib/envelope.js';
import {
  AMBIGUOUS_MAX_CONFIDENCE,
  CATEGORIES,
  CHANNELS,
  CUSTOMER_MAX_LENGTH,
  DEFAULT_CHANNEL,
  DEPARTMENTS,
  KEYWORDS_MAX,
  KEYWORDS_MIN,
  MESSAGE_MAX_LENGTH,
  MESSAGE_MIN_LENGTH,
  RATIONALE_MAX_LENGTH,
  SENTIMENTS,
  SUMMARY_MAX_LENGTH,
  URGENCIES,
} from './classify.constants.js';

export const ClassifyInputSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(MESSAGE_MIN_LENGTH)
      .max(MESSAGE_MAX_LENGTH)
      .meta({
        description: `Texto enviado pelo cliente (${String(MESSAGE_MIN_LENGTH)}–${String(MESSAGE_MAX_LENGTH)} caracteres)`,
      }),
    customer: z
      .string()
      .trim()
      .max(CUSTOMER_MAX_LENGTH)
      .optional()
      .meta({ description: 'Nome do cliente (opcional)' }),
    channel: z
      .enum(CHANNELS)
      .default(DEFAULT_CHANNEL)
      .meta({ description: 'Canal de origem da mensagem' }),
  })
  .meta({
    id: 'ClassifyInput',
    example: {
      message: 'Comprei um tênis há 10 dias e ainda não chegou. Já é a segunda vez!',
      customer: 'Maria Souza',
      channel: 'whatsapp',
    },
  });

export const ClassificationSchema = z
  .object({
    category: z.enum(CATEGORIES).meta({
      description: 'Dúvida · Reclamação · Solicitação · Elogio · Outro',
    }),
    department: z.enum(DEPARTMENTS).meta({
      description:
        'Setor responsável: Atendimento · Financeiro · Logística · Suporte técnico · Comercial',
    }),
    urgency: z.enum(URGENCIES).meta({ description: 'Urgência: Baixa · Média · Alta' }),
    sentiment: z.enum(SENTIMENTS).meta({ description: 'Sentimento: Positivo · Neutro · Negativo' }),
    summary: z
      .string()
      .min(1)
      .max(SUMMARY_MAX_LENGTH)
      .meta({ description: 'Resumo em português do Brasil' }),
    keywords: z
      .array(z.string().min(1))
      .min(KEYWORDS_MIN)
      .max(KEYWORDS_MAX)
      .meta({ description: 'Palavras-chave em português do Brasil' }),
    confidence: z
      .number()
      .min(0)
      .max(1)
      .meta({
        description: `Confiança da IA (0–1). Mensagens ambíguas ou spam ficam em até ${String(AMBIGUOUS_MAX_CONFIDENCE)}`,
      }),
    rationale: z
      .string()
      .min(1)
      .max(RATIONALE_MAX_LENGTH)
      .meta({ description: 'Justificativa curta da classificação, em português do Brasil' }),
  })
  .meta({
    id: 'Classification',
    example: {
      category: 'complaint',
      department: 'logistics',
      urgency: 'high',
      sentiment: 'negative',
      summary: 'Cliente relata atraso de 10 dias na entrega de um tênis, pela segunda vez.',
      keywords: ['atraso', 'entrega', 'tênis'],
      confidence: 0.93,
      rationale: 'Relato de problema com entrega e insatisfação explícita.',
    },
  });

export const ClassifyResponseSchema = envelopeSchema(
  ClassifyInputSchema,
  ClassificationSchema,
).meta({ id: 'ClassifyResponse' });

export type ClassifyInput = z.output<typeof ClassifyInputSchema>;
export type Classification = z.output<typeof ClassificationSchema>;
export type ClassifyResponse = z.output<typeof ClassifyResponseSchema>;
