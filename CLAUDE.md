# CLAUDE.md

Guia do Claude Code para este repositório. Complementa o `CLAUDE.md` global do usuário; onde este arquivo declarar uma **exceção**, ela vale só neste projeto. Leia este arquivo inteiro antes de qualquer tarefa.

## O projeto

Desafio Técnico KODIE — IA e Automação. Uma empresa fictícia (**Loja Aurora**, um pequeno e-commerce) recebe muitas mensagens de clientes. A solução usa IA para interpretar essas mensagens e um fluxo de automação para encaminhar o resultado.

- **Caso principal (obrigatório):** 4.1 — Classificação de mensagens.
- **Casos opcionais:** 4.2 Resumo, 4.3 Organização de tarefas, 4.4 FAQ.
- **Interface visual (opcional):** front em Next.js.

Requisitos oficiais e checklist de entrega: `docs/planejamento/00-desafio.md`.
Arquitetura, contratos e convenções: `docs/planejamento/01-arquitetura.md`.
Design system do front: `docs/planejamento/02-design-system.md`.
Plano por fases: `docs/planejamento/README.md`.

## Stack (não trocar)

| Camada | Tecnologia |
|---|---|
| Runtime | **Node.js 24 (LTS)** — fixado em `.nvmrc` na raiz; mesma versão nas imagens Docker (`node:24-alpine`) |
| Pacotes | **npm** (`package-lock.json` em `/api` e `/web`; `npm ci` no Docker). Não usar pnpm/yarn |
| Backend | **Express** · TypeScript |
| Validação | Zod (fonte única de verdade: valida, tipa e gera o Swagger) |
| Documentação da API | OpenAPI/Swagger gerado a partir dos schemas Zod, servido em `/docs` |
| IA | Google Gemini via SDK oficial `@google/genai`, com saída JSON estruturada |
| Automação | n8n (self-hosted no Docker) → Google Sheets |
| Front (opcional) | Next.js (App Router) · TypeScript · **SCSS Modules** (sem Tailwind, sem lib de componentes) |
| Infra | Docker + Docker Compose |
| Testes | Vitest + Supertest (Gemini sempre mockado nos testes) |

O desafio exige **Express** — não usar Fastify, NestJS, Hono etc. As API Routes do Next **não** substituem a API Express: o Next é só front.

## Dependências pré-aprovadas

Podem ser instaladas sem perguntar (escolher versões atuais e compatíveis entre si). **Qualquer outra: pedir aprovação.**

- **API — produção:** `express`, `zod`, `@google/genai`, `@asteasolutions/zod-to-openapi` (ou gerador equivalente compatível com a versão do Zod), `swagger-ui-express`, `helmet`, `pino` + `pino-http`.
- **API — dev:** `typescript`, `tsx`, `@types/node`, `@types/express`, `@types/swagger-ui-express`, `vitest`, `supertest`, `@types/supertest`, `eslint` + `typescript-eslint`, `prettier`.
- **Web:** `next`, `react`, `react-dom`, `sass`, `clsx`, `lucide-react`, tipos correspondentes, `eslint-config-next`.

## Idiomas (inclui exceções ao global)

| O quê | Idioma |
|---|---|
| Código, nomes de arquivos, variáveis, rotas, comentários | Inglês |
| **Contrato da API** (campos JSON, valores de enum, códigos de erro) | Inglês (`snake_case`) |
| Prompts do Gemini | Instruções em inglês; campos de texto livre gerados pela IA (`summary`, `rationale`, `answer`...) **em português do Brasil** |
| README, docs, textos de interface | Português |
| Cabeçalhos da planilha Google Sheets | Português (mapeados no node do n8n) |
| **Mensagens de commit** | **Português** — ⚠️ exceção ao global: facilita a análise pelos avaliadores. Formato Conventional Commits com tipo/escopo em inglês: `feat(classify): adiciona schema de saída` |

## Como trabalhar neste repositório

1. **Uma fase por vez.** Antes de começar, leia o arquivo da fase em `docs/planejamento/` e siga o checklist. Não adiante tarefas de fases futuras.
2. **Fase 1 é prioridade absoluta.** Nenhuma fase opcional começa antes de a Fase 1 estar entregável.
3. **Trabalhe bloco a bloco.** Ao fim de cada bloco: rode lint, type-check e testes; confira os diagnósticos do editor (incluindo SonarQube) nos arquivos alterados; marque os checkboxes no arquivo da fase; **pare** e apresente o resumo + a mensagem de commit sugerida.
4. **Ao terminar uma fase**, liste: o que foi feito, como testar, e **quais prints o usuário precisa capturar**.
5. **Decisões em aberto:** se houver mais de uma abordagem razoável não definida nos docs, apresente opções com prós e contras antes de implementar.
6. **Contratos já entregues** (fases mergeadas) não mudam sem aprovação.

## Git

- **Nunca** execute `git commit`, `push`, `pull`, `merge`, `rebase`, `tag` nem abra PR. O usuário revisa e registra tudo manualmente.
- Pode criar a branch da fase (`git checkout -b ...`) quando o usuário pedir para iniciar a fase, e pode usar comandos de leitura (`status`, `diff`, `log`).
- Ao fim de cada bloco, **sugira** a mensagem de commit (português, Conventional Commits) e aguarde.

## Regras de código

- TypeScript `strict`. Sem `any` e sem type assertions desnecessárias (use `unknown` + Zod).
- Cada caso é um **módulo** independente em `api/src/modules/<case>/`. Código compartilhado em `api/src/lib/`.
- Toda resposta do Gemini é validada com Zod **antes** de sair da API. Inválida → 1 retry → 502.
- Prompts em arquivos próprios (`*.prompt.ts`), nunca embutidos na rota.
- Configuração só por variáveis de ambiente, validadas em `api/src/config/env.ts`.
- Front: Server Components por padrão; `"use client"` só com estado/interação. Nenhum valor visual solto — só tokens (`var(--...)`) e componentes de `components/ui/`. Cores de domínio via `lib/semantic.ts`.
- Categorias do caso 4.1 são exatamente: `question`, `complaint`, `request`, `compliment`, `other`.

## Qualidade — regras SonarQube (reforço)

O usuário usa SonarQube for IDE. Todo código deve passar nas regras comuns do Sonar:

- **Complexidade cognitiva baixa** (alvo ≤ 15 por função). Prefira early return / guard clauses a `if` aninhado.
- **Sem ternários aninhados** e sem template literals aninhados.
- **Funções pequenas e com propósito único**; mais de 3–4 parâmetros → objeto de opções.
- **Sem duplicação:** lógica repetida entre módulos vai para `lib/`; strings repetidas (≥ 3x) viram constantes.
- **Sem números/strings mágicos:** limites (ex.: 5000 caracteres, timeout, retries) em constantes nomeadas, compartilhadas entre schema e prompt.
- **Sem código morto:** nada de imports, variáveis, parâmetros ou funções não usados; nada de código comentado; nada de `TODO` sem tarefa correspondente no plano.
- **Promises tratadas:** sem promises flutuantes; `await` ou `void` explícito; erros nunca engolidos (`catch` vazio é proibido).
- **Sem `console.log`** — usar o logger (`lib/logger.ts`).
- `readonly`/`as const` onde couber; `switch` com `default` (ou exaustividade verificada pelo tipo).
- Middleware de erro do Express com 4 parâmetros mesmo que algum não seja usado: prefixar com `_`.
- Após alterar código, verificar os diagnósticos do VS Code (inclui Sonar) nos arquivos tocados e corrigir antes de encerrar o bloco.

## Segurança (obrigatório pelo desafio)

- **Nunca** commitar `.env`, chaves de API, tokens ou senhas. Só `.env.example` com nomes e valores fictícios.
- **Nunca** commitar dados do n8n (`n8n_data`, `.n8n/`, `*.sqlite`) — guardam credenciais do Google.
- JSON exportado do n8n: conferir que não contém segredos (só referência à credencial).
- Não logar a chave do Gemini nem o conteúdo completo das mensagens.

## Comandos

```bash
fnm use                          # Node 24 a partir do .nvmrc

# Tudo via Docker
docker compose up --build        # api (3000), n8n (5678) e, a partir da Fase 2, web (3001)
docker compose down

# API local
cd api && npm install
npm run dev                      # tsx watch
npm run build && npm start
npm test
npm run lint
npm run typecheck                # tsc --noEmit

# URLs
# API:     http://localhost:3000/health
# Swagger: http://localhost:3000/docs
# n8n:     http://localhost:5678
# Web:     http://localhost:3001  (Fase 2+)
```

## Armadilhas conhecidas

- Dentro do Docker Compose, o n8n chama a API por `http://api:3000`, **não** `localhost`. O servidor Next chama o n8n por `http://n8n:5678`.
- Webhook do n8n: URL de teste (`/webhook-test/...`) só funciona com o editor escutando; a de produção (`/webhook/...`) exige o workflow **ativo**.
- Google Sheets no n8n usa credencial OAuth2 própria — ver `docs/guias/google-sheets-n8n.md`. A chave do Gemini **não** dá acesso ao Sheets.
- Next e Express usam a porta 3000 por padrão: no host, o web fica em `3001`.
