# Fase 1 — Classificação de mensagens (API + n8n) · MVP OBRIGATÓRIO

**Branch:** `fase-1-classificacao-api` · **Tag ao final:** `v1.0.0`

## Objetivo

Entregar o desafio completo com o caso 4.1: mensagem entra pelo webhook do n8n → API Express classifica com Gemini → n8n grava no Google Sheets e responde. Ao fim desta fase o projeto **já pode ser entregue**.

## Fora do escopo

Front, casos 4.2/4.3/4.4, autenticação, banco de dados.

## Ao fim de cada bloco

Lint + type-check + testes · diagnósticos do editor (Sonar) limpos nos arquivos alterados · checkboxes marcados · **parar** e sugerir a mensagem de commit (o usuário commita).

## Checklist

### Bloco A — Fundação do repositório
- [x] `.nvmrc` com `24`
- [x] Estrutura de pastas conforme `01-arquitetura.md`
- [x] `.gitignore`, `.env.example`, `.editorconfig`
- [x] `api/`: `package.json` (npm, `"engines": { "node": ">=24" }`), `tsconfig.json` (strict), scripts `dev` (tsx watch), `build` (tsc), `start`, `test`, `lint`, `typecheck` (`tsc --noEmit`), `format`
- [x] ESLint (`typescript-eslint`, regras que reforcem os itens Sonar do `CLAUDE.md`) + Prettier
- [x] `config/env.ts` validando variáveis com Zod (falha rápido e com mensagem clara se faltar `GEMINI_API_KEY`)

### Bloco B — Esqueleto da API
- [x] `app.ts` (Express, `express.json` com limite, helmet, pino-http) e `server.ts`
- [x] `GET /health`
- [x] Middleware de validação Zod (`validate(schema)`)
- [x] `AppError` + middleware de erro com o envelope padrão + 404
- [x] Swagger: registry OpenAPI a partir do Zod, `GET /docs` (UI) e `GET /docs.json`
- [x] Teste: `/health` responde 200

### Bloco C — Integração com Gemini
- [x] `lib/gemini.ts` com `generateStructured<T>()` (saída JSON + schema, validação Zod, 1 retry, timeout, mapeamento de erros 502/503)
- [x] Testes unitários com o SDK mockado: sucesso · JSON inválido → retry → sucesso · falha dupla → 502 · timeout → 503

### Bloco D — Módulo `classify`
- [x] `classify.constants.ts` (enums e limites)
- [x] `classify.schema.ts` (contrato da arquitetura, com descrições e exemplos para o Swagger)
- [x] `classify.prompt.ts` — system prompt estruturado com:
  - papel ("triage assistant for Loja Aurora")
  - definição de cada categoria e setor
  - regras de urgência e sentimento
  - regras de formato (JSON only, `summary` ≤ 200 caracteres, não inventar dados)
  - instrução explícita: textos livres (`summary`, `keywords`, `rationale`) em português do Brasil
  - 2–3 exemplos few-shot
  - mensagens ambíguas/spam → `other`, confiança baixa
- [x] `classify.service.ts` e `classify.route.ts` (`POST /api/v1/classify`), registrado no Swagger
- [x] Testes de rota (Supertest, Gemini mockado): 200 com envelope correto · 400 em entrada inválida · 502 quando a IA falha
- [x] `api/samples/messages.json` com ~12 mensagens realistas (em português) cobrindo todas as categorias, setores e urgências
- [ ] Teste manual real (com chave) via Swagger; registrar no README um exemplo de requisição/resposta

### Bloco E — Docker
- [ ] `api/Dockerfile` multi-stage (`node:24-alpine`, `npm ci`), usuário não-root, `.dockerignore`
- [ ] `docker-compose.yml` com `api` + `n8n` (volume nomeado, timezone, encryption key, healthcheck da API)
- [ ] `docker compose up --build` sobe tudo; `curl localhost:3000/health` ok; n8n abre em `localhost:5678`

### Bloco F — n8n + Google Sheets (parte manual do usuário, com apoio do Claude Code)
- [ ] Usuário cria a planilha e a aba `classificacoes` com os cabeçalhos da arquitetura
- [ ] Usuário configura a credencial Google Sheets no n8n (`docs/guias/google-sheets-n8n.md`)
- [ ] Claude Code gera um rascunho de `n8n/workflows/4.1-classify.json` para importar:
  Webhook `POST /webhook/classify` → Edit Fields → HTTP Request `http://api:3000/api/v1/classify` → Edit Fields (enums → rótulos PT) → Google Sheets (Append Row) → Respond to Webhook, com ramo de erro
- [ ] Usuário importa, liga a credencial, testa, **ativa** o workflow e reexporta o JSON final para `n8n/workflows/`
- [ ] (Opcional) Switch por `urgency` para destacar mensagens de urgência alta
- [ ] `scripts/send-samples.sh` (ou `.ts`) que envia `api/samples/messages.json` ao webhook — popula a planilha antes dos prints

### Bloco G — Documentação
- [ ] `README.md` com as 6 seções obrigatórias (ver `00-desafio.md`) + extras:
  - Arquitetura (diagrama Mermaid)
  - Endpoints e Swagger
  - Como a resposta da IA é garantida em JSON (structured output + Zod + retry)
  - Por que 5 categorias: o desafio sugere dúvida, reclamação e solicitação; adicionamos elogio (comum no atendimento real) e outro (evita forçar mensagens ambíguas/spam numa categoria errada). Setor, urgência e sentimento viabilizam o encaminhamento
  - Por que contrato em inglês e planilha em português
  - Como executar com Docker e sem Docker (incluindo `fnm use`)
  - Documentação do fluxo n8n com prints e descrições
  - Estrutura de pastas
  - Próximos passos (fases opcionais)
- [ ] `docs/adicionar-novo-caso.md` — passo a passo para criar um módulo novo
- [ ] Placeholders de imagem no README apontando para `docs/prints/fase-1/`

### Bloco H — Prints (usuário) e fechamento
- [ ] Usuário captura os prints da lista abaixo
- [ ] Revisão final contra o checklist de `00-desafio.md`
- [ ] Conferir que não há segredos no repositório (`git grep -iE "api_key|secret|token"`)
- [ ] Claude Code apresenta o resumo da fase e sugere título/descrição do PR; **o usuário** faz commit, push, PR, merge e tag `v1.0.0`

## Prints a capturar (salvar em `docs/prints/fase-1/`)

| Arquivo | Conteúdo |
|---|---|
| `01-fluxo-completo.png` | Workflow inteiro com todos os nodes conectados |
| `02-node-webhook.png` | Configuração do Webhook (método, path, modo de resposta) |
| `03-node-edit-fields.png` | Configuração do Edit Fields de entrada |
| `04-node-http-request.png` | Configuração do HTTP Request (URL, método, body) |
| `05-node-traducao.png` | Edit Fields que traduz enums para rótulos PT |
| `06-node-google-sheets.png` | Configuração do Sheets (planilha, aba, mapeamento de colunas) |
| `07-node-respond.png` | Configuração do Respond to Webhook |
| `08-execucao-sucesso.png` | Execução concluída com sucesso (todos os nodes verdes) |
| `09-dados-http-request.png` | Entrada/saída do HTTP Request (JSON da IA) |
| `10-dados-sheets.png` | Dados que chegaram ao node do Sheets |
| `11-planilha.png` | Planilha preenchida com várias mensagens classificadas |
| `12-swagger.png` | Swagger com uma requisição e resposta reais |

## Critérios de aceite

- `docker compose up --build` sobe API e n8n sem passos manuais além do `.env`.
- Uma mensagem enviada ao webhook aparece classificada na planilha e a resposta do webhook traz o JSON da API.
- Entrada inválida → 400 com envelope de erro; falha da IA → 502/503 sem derrubar a API.
- Lint, type-check e testes passando; diagnósticos Sonar limpos.
- README cobre as 6 seções e inclui os prints com descrições.
- Nenhuma credencial no Git.
