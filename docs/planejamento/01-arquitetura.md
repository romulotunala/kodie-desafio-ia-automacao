# Arquitetura, contratos e convenções

## Visão geral

```
                 ┌──────────────┐
 (cliente/front) │   Next.js    │  Fase 2+ (opcional)
       │         │  /web :3001  │
       │         └──────┬───────┘
       │                │ Route Handler (server-side) → webhook
       ▼                ▼
 ┌─────────────────────────────┐     ┌────────────────────┐     ┌─────────┐
 │ n8n :5678                   │ ──▶ │ API Express :3000  │ ──▶ │ Gemini  │
 │ Webhook → Edit Fields →     │ ◀── │ Zod + Swagger      │ ◀── │  (JSON) │
 │ HTTP Request → Sheets →     │     └────────────────────┘     └─────────┘
 │ Respond to Webhook          │
 └──────────────┬──────────────┘
                ▼
         Google Sheets
```

**Responsabilidades:**
- **API Express:** recebe dados, valida (Zod), monta o prompt, chama o Gemini, valida a resposta, devolve JSON padronizado. Não conhece o Google Sheets.
- **Gemini:** interpreta o texto e devolve JSON conforme o schema pedido.
- **n8n:** ponto de entrada (webhook) e orquestração: normaliza, chama a API, grava no Sheets, responde a quem chamou.
- **Next (opcional):** interface para enviar dados e ver o resultado. Chama o webhook do n8n pelo servidor (Route Handler): o fluxo completo é exercitado, sem CORS e sem expor URLs internas no navegador.

## Estrutura do repositório

```
.
├── CLAUDE.md
├── README.md
├── .nvmrc                       # 24
├── docker-compose.yml
├── .env.example
├── .gitignore
├── api/
│   ├── Dockerfile
│   ├── package.json / package-lock.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── samples/                 # dados de exemplo (JSON) para testes e prints
│   ├── data/                    # Fase 7: base de conhecimento do FAQ
│   └── src/
│       ├── server.ts            # sobe o servidor
│       ├── app.ts               # cria o app Express (exportado para testes)
│       ├── config/env.ts        # leitura + validação Zod das variáveis de ambiente
│       ├── lib/
│       │   ├── gemini.ts        # cliente Gemini + generateStructured<T>()
│       │   ├── openapi.ts       # registry OpenAPI e montagem do documento
│       │   ├── errors.ts        # AppError + middleware de erro
│       │   ├── envelope.ts      # monta o envelope de sucesso
│       │   └── logger.ts
│       ├── middlewares/validate.ts
│       ├── routes/              # health, docs, registro dos módulos
│       └── modules/
│           ├── classify/        # 4.1 (Fase 1)
│           │   ├── classify.constants.ts  # enums e limites (compartilhados schema ↔ prompt)
│           │   ├── classify.schema.ts     # Zod: entrada e saída
│           │   ├── classify.prompt.ts     # system prompt + montagem do prompt
│           │   ├── classify.service.ts    # chama o Gemini e valida
│           │   ├── classify.route.ts      # rota + registro OpenAPI
│           │   └── classify.test.ts
│           ├── summarize/       # 4.2 (Fase 3)
│           ├── tasks/           # 4.3 (Fase 5)
│           └── faq/             # 4.4 (Fase 7)
├── n8n/workflows/               # JSONs exportados, um por caso
├── web/                         # Fase 2+ (Next.js)
├── scripts/                     # ex.: enviar exemplos ao webhook
└── docs/
    ├── planejamento/
    ├── guias/
    ├── adicionar-novo-caso.md   # criado na Fase 1
    └── prints/fase-N/
```

## Padrão de módulo (vale para todos os casos)

1. **`*.constants.ts`** — enums (`as const`) e limites. Usados pelo schema **e** pelo prompt, para que nunca divirjam.
2. **`*.schema.ts`** — `InputSchema` e `OutputSchema` em Zod, com descrições e exemplos para o Swagger. Tipos via `z.infer`.
3. **`*.prompt.ts`** — `SYSTEM_PROMPT` (papel, regras, critérios, formato) e `buildUserPrompt(input)`. 2–3 exemplos few-shot quando ajudar.
4. **`*.service.ts`** — chama `generateStructured({ system, user, schema: OutputSchema })`; pós-validações de regra de negócio; devolve o envelope.
5. **`*.route.ts`** — `POST /api/v1/<case>`, middleware de validação, registro no OpenAPI.

Adicionar um caso = criar a pasta + registrar a rota. Documentado em `docs/adicionar-novo-caso.md` (Fase 1).

## Integração com o Gemini (`lib/gemini.ts`)

- SDK oficial `@google/genai`. Conferir a documentação atual antes de implementar.
- Modelo em `GEMINI_MODEL` (confirmar no Google AI Studio o nome atual do modelo desejado).
- **Saída estruturada:** `responseMimeType: "application/json"` + schema de resposta derivado do Zod (`z.toJSONSchema` no Zod 4 ou conversão equivalente). `temperature` baixa (ex.: 0.2) em classificação.
- `generateStructured<T>({ system, user, schema })`:
  1. chama o modelo;
  2. `JSON.parse` + `schema.safeParse`;
  3. inválido → **1 retry**; falhou de novo → `AppError(502, "AI_INVALID_RESPONSE")`;
  4. timeout (`GEMINI_TIMEOUT_MS`); erro de rede/quota → `AppError(503, "AI_UNAVAILABLE")`;
  5. retorna `{ data, model, latency_ms }`.
- Nos testes, `lib/gemini.ts` é sempre mockado.

## Contratos da API

### Convenções gerais

- Base `/api/v1`. JSON UTF-8. Campos em inglês, `snake_case`.
- `GET /health` → `{ "status": "ok", "uptime_s": 12 }`
- `GET /docs` → Swagger UI · `GET /docs.json` → documento OpenAPI.
- **Envelope de sucesso** (todos os casos):

```json
{
  "id": "uuid",
  "processed_at": "2026-11-25T12:00:00.000Z",
  "input": { "...": "eco da entrada validada" },
  "result": { "...": "saída do caso, validada pelo OutputSchema" },
  "meta": { "model": "model-name", "latency_ms": 850 }
}
```

- **Envelope de erro** (mensagens em inglês; o front traduz por `code`):

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Field 'message' is required", "details": [] } }
```

| HTTP | `code` | Quando |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Entrada inválida (detalhes do Zod) |
| 404 | `NOT_FOUND` | Rota inexistente |
| 502 | `AI_INVALID_RESPONSE` | Gemini devolveu JSON fora do schema após retry |
| 503 | `AI_UNAVAILABLE` | Erro de rede, timeout ou quota no Gemini |
| 500 | `INTERNAL_ERROR` | Qualquer outro erro |

### 4.1 — `POST /api/v1/classify` (Fase 1)

Entrada:

```json
{
  "message": "Comprei um tênis há 10 dias e ainda não chegou. Já é a segunda vez!",
  "customer": "Maria Souza",
  "channel": "whatsapp"
}
```

- `message`: string, 5–5000 caracteres, obrigatória.
- `customer`: string opcional (até 120).
- `channel`: `email` · `whatsapp` · `website` · `phone` · `other` — opcional, padrão `other`.

`result`:

```json
{
  "category": "complaint",
  "department": "logistics",
  "urgency": "high",
  "sentiment": "negative",
  "summary": "Cliente relata atraso de 10 dias na entrega de um tênis, pela segunda vez.",
  "keywords": ["atraso", "entrega", "tênis"],
  "confidence": 0.93,
  "rationale": "Relato de problema com entrega e insatisfação explícita."
}
```

| Campo | Valores | Rótulo PT (planilha/front) |
|---|---|---|
| `category` | `question` · `complaint` · `request` · `compliment` · `other` | Dúvida · Reclamação · Solicitação · Elogio · Outro |
| `department` | `customer_service` · `finance` · `logistics` · `tech_support` · `sales` | Atendimento · Financeiro · Logística · Suporte técnico · Comercial |
| `urgency` | `low` · `medium` · `high` | Baixa · Média · Alta |
| `sentiment` | `positive` · `neutral` · `negative` | Positivo · Neutro · Negativo |
| `summary` | string PT-BR, até 200 caracteres | |
| `keywords` | 1–5 strings PT-BR | |
| `confidence` | número 0–1 | |
| `rationale` | string PT-BR, até 200 caracteres | |

Critérios do prompt (`SYSTEM_PROMPT`): definição de cada categoria; qual setor cuida de quê (pagamento/reembolso → `finance`; entrega/troca/devolução → `logistics`; site/app/login → `tech_support`; orçamento/parceria/compra em volume → `sales`; demais → `customer_service`); regras de urgência (`high` = prejuízo financeiro, reincidência, ameaça de cancelar/Procon, linguagem muito negativa); mensagens ambíguas/spam → `other` com confiança baixa.

### Casos opcionais

Contratos em cada arquivo de fase: `fase-3` (`/summarize`), `fase-5` (`/tasks`), `fase-7` (`/faq`).

## Fluxo n8n — padrão

Um workflow por caso em `n8n/workflows/<numero>-<case>.json` (ex.: `4.1-classify.json`).

```
Webhook (POST /webhook/<case>)
  → Edit Fields      (normaliza campos, adiciona received_at)
  → HTTP Request     (POST http://api:3000/api/v1/<case>)
  → Edit Fields      (traduz enums para rótulos PT da planilha)
  → [Switch/IF]      (opcional: ramifica por department/urgency)
  → Google Sheets    (Append Row na aba do caso)
  → Respond to Webhook (devolve o JSON da API a quem chamou)
```

- Tratar erro do HTTP Request (ramo de erro) e responder ao webhook com o erro em vez de travar.
- O Claude Code pode gerar um **rascunho** do JSON do workflow; o usuário ajusta a credencial do Sheets na interface e **reexporta** o JSON final para `n8n/workflows/`.

### Planilha (Google Sheets)

Planilha "Loja Aurora — Atendimento", uma aba por caso, cabeçalhos em português. Aba `classificacoes` (Fase 1):

`recebido_em | cliente | canal | mensagem | categoria | setor | urgencia | sentimento | resumo | confianca`

## Docker

| Serviço | Imagem/Build | Porta host | Observações |
|---|---|---|---|
| `api` | `./api` — multi-stage sobre `node:24-alpine`: `npm ci` + `tsc` no build; runtime só `dist` + `npm ci --omit=dev`; usuário não-root | 3000 | `env_file: .env`, healthcheck em `/health` |
| `n8n` | imagem oficial `n8nio/n8n` (fixar versão) | 5678 | volume nomeado `n8n_data:/home/node/.n8n`; `GENERIC_TIMEZONE`, `TZ`, `N8N_ENCRYPTION_KEY`; `depends_on: api` (healthy) |
| `web` | `./web` (`node:24-alpine`, Next `output: "standalone"`) | 3001 | **Fase 2+**; `N8N_WEBHOOK_BASE_URL=http://n8n:5678/webhook` |

`.env.example` (raiz):

```dotenv
# API
PORT=3000
NODE_ENV=development
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=model-name
GEMINI_TIMEOUT_MS=20000
LOG_LEVEL=info

# n8n
N8N_ENCRYPTION_KEY=generate-a-long-random-string
GENERIC_TIMEZONE=America/Sao_Paulo

# Web (Fase 2+)
N8N_WEBHOOK_BASE_URL=http://n8n:5678/webhook
```

`.gitignore`: `node_modules`, `dist`, `.next`, `.env`, `.env.*` (exceto `.env.example`), `n8n_data/`, `.n8n/`, `*.sqlite`, `coverage`.
