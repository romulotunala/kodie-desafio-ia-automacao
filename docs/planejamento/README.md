# Planejamento do projeto

Índice das fases e de como usar estes arquivos com o Claude Code.

## Arquivos

| Arquivo | Para quê |
|---|---|
| `00-desafio.md` | Requisitos oficiais do desafio e checklist de entrega |
| `01-arquitetura.md` | Estrutura de pastas, contratos da API, fluxo n8n, Docker |
| `02-design-system.md` | Tokens, cores semânticas, componentes e padrões do front (SCSS Modules) |
| `fase-1-classificacao-api.md` | **MVP obrigatório** — caso 4.1 completo |
| `fase-2-classificacao-web.md` | Front base (Next) + tela do 4.1 |
| `fase-3-resumo-api.md` | Caso 4.2 — API + n8n |
| `fase-4-resumo-web.md` | Tela do 4.2 |
| `fase-5-tarefas-api.md` | Caso 4.3 — API + n8n |
| `fase-6-tarefas-web.md` | Tela do 4.3 |
| `fase-7-faq-api.md` | Caso 4.4 — API + base de conhecimento + n8n |
| `fase-8-faq-web.md` | Tela do 4.4 |
| `../guias/google-sheets-n8n.md` | Passo a passo da credencial Google Sheets no n8n |

## Fases e branches

| Fase | Conteúdo | Branch | Tag ao final | Obrigatória? |
|---|---|---|---|---|
| 1 | 4.1 API + Gemini + Swagger + n8n/Sheets + Docker + README + prints | `fase-1-classificacao-api` | `v1.0.0` | **Sim** |
| 2 | Front base + tela do 4.1 | `fase-2-classificacao-web` | `v1.1.0` | Não |
| 3 | 4.2 Resumo — API + n8n | `fase-3-resumo-api` | `v1.2.0` | Não |
| 4 | Tela do 4.2 | `fase-4-resumo-web` | `v1.3.0` | Não |
| 5 | 4.3 Tarefas — API + n8n | `fase-5-tarefas-api` | `v1.4.0` | Não |
| 6 | Tela do 4.3 | `fase-6-tarefas-web` | `v1.5.0` | Não |
| 7 | 4.4 FAQ — API + n8n | `fase-7-faq-api` | `v1.6.0` | Não |
| 8 | Tela do 4.4 | `fase-8-faq-web` | `v1.7.0` | Não |

### Regras de dependência

- A **Fase 1** é pré-requisito de todas.
- A **Fase 2** cria a base do front. Fases "web" (4, 6, 8) dependem da Fase 2 **e** da fase "api" do mesmo caso.
- Fases "api" (3, 5, 7) dependem só da Fase 1. Se pular o front, elas continuam possíveis.
- **Toda fase termina entregável.** Dá para parar depois de qualquer uma.

### Fluxo Git de cada fase (executado pelo **usuário**)

O Claude Code não commita, não faz push/pull/merge/tag nem abre PR. Ele só cria a branch quando pedido e, ao fim de cada bloco, sugere a mensagem de commit (português, Conventional Commits). O usuário revisa, ajusta e registra.

```bash
git checkout main && git pull
git checkout -b fase-N-nome          # ou peça ao Claude Code
# por bloco: revisar diff → git add → git commit -m "<mensagem sugerida>"
git push -u origin fase-N-nome
# abrir PR no GitHub → merge na main
git checkout main && git pull
git tag vX.Y.Z && git push --tags
```

## Como usar com o Claude Code

O `CLAUDE.md` na raiz é lido automaticamente. Para cada fase, um prompt como:

> Leia `docs/planejamento/fase-1-classificacao-api.md` e `docs/planejamento/01-arquitetura.md`. Crie a branch da fase e execute o checklist em ordem. Pare ao fim de cada bloco para eu revisar.

Dicas:

- Peça para ele **marcar os checkboxes** do arquivo da fase conforme avança — o próprio arquivo vira o registro de progresso.
- Antes de começar: `fnm use` (Node 24 pelo `.nvmrc`, criado no Bloco A da Fase 1).
- Revise e teste ao fim de cada bloco antes de seguir.
- No fim da fase, peça: *"Liste os prints que preciso capturar e onde salvá-los."*
- Os prints do n8n são com você: o Claude Code não vê a interface do n8n.
