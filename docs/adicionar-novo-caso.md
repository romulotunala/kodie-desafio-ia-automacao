# Como adicionar um novo caso

Cada caso de uso (4.1 Classificação, 4.2 Resumo, 4.3 Tarefas, 4.4 FAQ) é um **módulo independente** em `api/src/modules/<case>/`. Ele reaproveita a infraestrutura comum e não altera os módulos que já existem.

| Já pronto em `api/src/lib/` | O que oferece |
|---|---|
| `gemini.ts` | `generateStructured({ system, user, schema })`: saída JSON estruturada, validação Zod, retry, timeout e mapeamento de erros (502/503) |
| `envelope.ts` | `envelopeSchema(input, result)` e `buildEnvelope(...)`: o envelope de sucesso padrão |
| `errors.ts` | `AppError` e o envelope de erro |
| `openapi.ts` | `registry`, `API_PREFIX` e `errorResponses([...])` para o Swagger |
| `../middlewares/validate.ts` | `validate(schema)`: valida o corpo e responde 400 |

O caminho abaixo usa como exemplo um módulo `summarize` (caso 4.2), **simplificado**. O contrato completo de cada caso está no arquivo da fase em `docs/planejamento/`. Use [`modules/classify/`](../api/src/modules/classify/) como referência real.

## 1. Constantes — `summarize.constants.ts`

Enums e limites ficam num lugar só, porque são usados **pelo schema e pelo prompt**. Assim os dois nunca divergem.

```ts
export const LENGTHS = ['short', 'medium', 'long'] as const;
export type Length = (typeof LENGTHS)[number];
export const DEFAULT_LENGTH: Length = 'medium';

export const TEXT_MIN_LENGTH = 50;
export const TEXT_MAX_LENGTH = 20000;
export const KEY_POINTS_MIN = 3;
export const KEY_POINTS_MAX = 7;

export const LENGTH_DEFINITIONS = {
  short: '1 to 2 sentences.',
  medium: 'One paragraph.',
  long: '2 to 3 paragraphs.',
} as const satisfies Record<Length, string>;
```

`satisfies Record<Length, string>` faz o compilador acusar quando um valor do enum fica sem definição.

## 2. Schemas — `summarize.schema.ts`

Entrada e saída em Zod, com `description` e `example` em português para o Swagger. Os tipos saem do schema com `z.infer`.

```ts
import { z } from 'zod';

import { envelopeSchema } from '../../lib/envelope.js';
import { DEFAULT_LENGTH, KEY_POINTS_MAX, KEY_POINTS_MIN, LENGTHS, TEXT_MAX_LENGTH, TEXT_MIN_LENGTH } from './summarize.constants.js';

export const SummarizeInputSchema = z
  .object({
    text: z.string().trim().min(TEXT_MIN_LENGTH).max(TEXT_MAX_LENGTH).meta({ description: 'Texto a resumir' }),
    length: z.enum(LENGTHS).default(DEFAULT_LENGTH).meta({ description: 'Tamanho do resumo' }),
  })
  .meta({ id: 'SummarizeInput', example: { text: 'Relatório mensal...', length: 'medium' } });

export const SummarySchema = z
  .object({
    summary: z.string().meta({ description: 'Resumo em português' }),
    key_points: z.array(z.string()).min(KEY_POINTS_MIN).max(KEY_POINTS_MAX),
  })
  .meta({ id: 'Summary' });

export const SummarizeResponseSchema = envelopeSchema(SummarizeInputSchema, SummarySchema).meta({
  id: 'SummarizeResponse',
});

export type SummarizeInput = z.infer<typeof SummarizeInputSchema>;
export type Summary = z.infer<typeof SummarySchema>;
export type SummarizeResponse = z.infer<typeof SummarizeResponseSchema>;
```

Pontos de atenção:

- O schema de **saída** é enviado ao Gemini como JSON Schema. Restrições que o Gemini não aceita (como tamanho de string) continuam valendo na validação Zod da volta: deixe-as no schema e repita o limite no prompt.
- Não envolva o `input` com `.meta()` ao chamar `envelopeSchema`: isso clona o schema e o Swagger perde o nome do componente.

## 3. Prompt — `summarize.prompt.ts`

O prompt nunca fica dentro da rota. Siga a estrutura do `classify.prompt.ts`:

- **Instruções em inglês; textos gerados pela IA em português do Brasil.**
- Papel, critérios (montados a partir das constantes), regras de formato e 2 ou 3 exemplos few-shot **tipados com o tipo de saída**, para que um exemplo fora do contrato não compile.
- O conteúdo do usuário entre tags delimitadoras (ex.: `<source_text>`), com a instrução de tratá-lo só como dado. Remova essas tags do texto recebido antes de montar o prompt.

```ts
export const SYSTEM_PROMPT = `You summarize internal documents for Loja Aurora...
## Length (field "length")
${toBulletList(LENGTH_DEFINITIONS)}
## Rules
- Write "summary" and "key_points" in Brazilian Portuguese (pt-BR).
- Never add information that is not in the text.
...`;

export function buildUserPrompt({ text, length }: SummarizeInput): string {
  return [`Length: ${length}`, `<source_text>${stripDelimiters(text)}</source_text>`].join('\n');
}
```

## 4. Service — `summarize.service.ts`

Chama o Gemini pelo helper comum e devolve o envelope. Regras de negócio calculadas pela API (e não pela IA) entram aqui.

```ts
import { buildEnvelope } from '../../lib/envelope.js';
import { generateStructured } from '../../lib/gemini.js';
import { SYSTEM_PROMPT, buildUserPrompt } from './summarize.prompt.js';
import { type SummarizeInput, type SummarizeResponse, SummarySchema } from './summarize.schema.js';

export async function summarizeText(input: SummarizeInput): Promise<SummarizeResponse> {
  const { data, model, latencyMs } = await generateStructured({
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(input),
    schema: SummarySchema,
  });

  return buildEnvelope({ input, result: data, model, latencyMs });
}
```

O service não trata erros do Gemini: `generateStructured` já transforma tudo em `AppError` (502 ou 503), e o middleware de erro responde.

## 5. Rota — `summarize.route.ts`

Rota, validação e registro no Swagger no mesmo arquivo:

```ts
import { Router } from 'express';

import { API_PREFIX, errorResponses, registry } from '../../lib/openapi.js';
import { validate } from '../../middlewares/validate.js';
import { SummarizeInputSchema, SummarizeResponseSchema } from './summarize.schema.js';
import { summarizeText } from './summarize.service.js';

const PATH = '/summarize';

registry.registerPath({
  method: 'post',
  path: `${API_PREFIX}${PATH}`,
  tags: ['4.2 Resumo'],
  summary: 'Resume um texto longo',
  request: { body: { content: { 'application/json': { schema: SummarizeInputSchema } } } },
  responses: {
    200: { description: 'Texto resumido', content: { 'application/json': { schema: SummarizeResponseSchema } } },
    ...errorResponses(['VALIDATION_ERROR', 'PAYLOAD_TOO_LARGE', 'INTERNAL_ERROR', 'AI_INVALID_RESPONSE', 'AI_UNAVAILABLE']),
  },
});

export const summarizeRouter = Router();

summarizeRouter.post(PATH, validate(SummarizeInputSchema), async (req, res) => {
  res.json(await summarizeText(req.body));
});
```

O Express 5 encaminha erros de handlers `async` ao middleware de erro, então não precisa de `try/catch`.

> Textos longos podem passar do limite de corpo de 32 kb (`JSON_BODY_LIMIT` em `app.ts`). Se o caso precisar, ajuste esse limite junto com o `TEXT_MAX_LENGTH`.

## 6. Registrar o módulo — `routes/api.router.ts`

Uma linha:

```ts
apiRouter.use(classifyRouter);
apiRouter.use(summarizeRouter);
```

O endpoint aparece sozinho no Swagger (`/docs`), porque o documento é gerado a partir do `registry`.

## 7. Testes — `summarize.test.ts`

Siga o `classify.test.ts`. O Gemini é **sempre mockado**: os testes não precisam de chave nem gastam cota.

```ts
vi.mock('../../lib/gemini.js', () => ({ generateStructured: vi.fn() }));
```

Cubra no mínimo:

- 200 com o envelope (valide o corpo com `SummarizeResponseSchema.parse`);
- valores padrão e `trim` aplicados à entrada;
- 400 para entrada faltando, curta, longa ou com enum desconhecido;
- 502 e 503 repassados quando `generateStructured` rejeita com `AppError`;
- o endpoint presente em `/docs.json`;
- o prompt cobrindo todos os valores dos enums;
- os exemplos de `api/samples/` válidos contra o schema de entrada.

Depois rode `npm run lint`, `npm run typecheck` e `npm test`.

## 8. Exemplos — `api/samples/<case>.json`

De 4 a 14 entradas realistas da Loja Aurora, cobrindo todos os valores dos enums e pelo menos um caso difícil (ambíguo ou fora do escopo). Elas servem aos testes, ao Swagger e aos prints.

## 9. Planilha e workflow do n8n

1. Crie a aba do caso na planilha, com **cabeçalhos em português** (ver o arquivo da fase).
2. Duplique o workflow `n8n/workflows/4.1-classify.json` e ajuste:
   - path do Webhook: `/webhook/<case>`;
   - **Normaliza entrada**: os campos do novo contrato;
   - URL do HTTP Request: `http://api:3000/api/v1/<case>` (`api` é o nome do serviço no Compose, não `localhost`);
   - **Traduz para PT**: enums → rótulos, arrays → texto (ex.: itens separados por `•`), com os nomes exatos das colunas;
   - aba do node do Google Sheets;
   - mantenha o IF de sucesso e o ramo de erro.
3. Teste pela URL `/webhook-test/<case>` com o editor escutando, **ative** o workflow e exporte para `n8n/workflows/<numero>-<case>.json`.
4. Confira que o JSON exportado não tem segredos (só a referência à credencial) e que o `pinData` está vazio.

## 10. Documentação

- README: uma seção do caso (problema, solução, endpoint, fluxo e prints em `docs/prints/fase-N/`).
- `docs/planejamento/01-arquitetura.md`: o contrato, se mudou durante a implementação.

## Checklist

- [ ] `constants`, `schema`, `prompt`, `service`, `route` e `test` em `modules/<case>/`
- [ ] Rota registrada em `routes/api.router.ts` e visível em `/docs`
- [ ] `npm run lint`, `npm run typecheck` e `npm test` passando
- [ ] `api/samples/<case>.json`
- [ ] Aba na planilha e workflow exportado em `n8n/workflows/`
- [ ] README e prints
