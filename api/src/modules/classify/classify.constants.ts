/**
 * Enums, limits and definitions for case 4.1.
 * Shared by the schema (validation + Swagger) and the prompt so they never diverge.
 */

export const CATEGORIES = ['question', 'complaint', 'request', 'compliment', 'other'] as const;
export type Category = (typeof CATEGORIES)[number];

export const DEPARTMENTS = [
  'customer_service',
  'finance',
  'logistics',
  'tech_support',
  'sales',
] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const URGENCIES = ['low', 'medium', 'high'] as const;
export type Urgency = (typeof URGENCIES)[number];

export const SENTIMENTS = ['positive', 'neutral', 'negative'] as const;
export type Sentiment = (typeof SENTIMENTS)[number];

export const CHANNELS = ['email', 'whatsapp', 'website', 'phone', 'other'] as const;
export type Channel = (typeof CHANNELS)[number];
export const DEFAULT_CHANNEL: Channel = 'other';

export const MESSAGE_MIN_LENGTH = 5;
export const MESSAGE_MAX_LENGTH = 5000;
export const CUSTOMER_MAX_LENGTH = 120;

export const SUMMARY_MAX_LENGTH = 200;
export const RATIONALE_MAX_LENGTH = 200;
export const KEYWORDS_MIN = 1;
export const KEYWORDS_MAX = 5;

/** Ambiguous messages and spam must not report confidence above this value. */
export const AMBIGUOUS_MAX_CONFIDENCE = 0.5;

export const CATEGORY_DEFINITIONS = {
  question: 'The customer wants information (prices, deadlines, policies, how something works).',
  complaint: 'The customer reports a problem or dissatisfaction with a product, order or service.',
  request:
    'The customer asks the store to perform an action (exchange, refund, cancel, update data).',
  compliment: 'The customer praises the store, a product, the delivery or the service.',
  other: 'Spam, unrelated content or messages too ambiguous to classify with confidence.',
} as const satisfies Record<Category, string>;

export const DEPARTMENT_DEFINITIONS = {
  finance: 'Payments, charges, invoices, refunds, installments.',
  logistics: 'Delivery, shipping, tracking, delays, exchanges and returns of products.',
  tech_support: 'Website, app, login, password, checkout errors.',
  sales: 'Quotes, bulk purchases, partnerships, resellers, corporate orders.',
  customer_service: 'Everything else, including compliments and messages classified as other.',
} as const satisfies Record<Department, string>;

export const URGENCY_DEFINITIONS = {
  high: 'Financial loss, repeated problem, threat to cancel, file a complaint (Procon, Reclame Aqui) or take legal action, or very aggressive language.',
  medium:
    'The customer is blocked or needs an action soon, without the aggravating factors of high.',
  low: 'Questions, compliments, requests without a deadline, and messages classified as other.',
} as const satisfies Record<Urgency, string>;
