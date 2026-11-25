# Fase 2 — Front base + tela de Classificação (opcional)

**Branch:** `fase-2-classificacao-web` · **Tag ao final:** `v1.1.0`
**Pré-requisito:** Fase 1 concluída e mergeada.

## Objetivo

Criar a base do front em Next.js + TypeScript e a tela do caso 4.1. A tela envia a mensagem ao **webhook do n8n** (via servidor Next), então o envio pela interface percorre o fluxo inteiro e cai na planilha.

## Decisões

- Next.js (App Router) + TypeScript strict, em `/web`.
- Estilização: **SCSS Modules**, seguindo `02-design-system.md` (sem Tailwind, sem biblioteca de componentes).
- O navegador **nunca** chama o n8n nem a API diretamente: chama uma Route Handler do Next (`/api/classify`), que faz `fetch` server-side para `${N8N_WEBHOOK_BASE_URL}/classify`. Sem CORS, sem expor URLs internas.
- A Route Handler é só um proxy fino: sem lógica de IA (isso é papel da API Express).
- Tipos do resultado espelham o contrato da API (copiar os tipos ou criar `web/src/types/` — não criar pacote compartilhado por enquanto).
- Arquitetura pensada para crescer: cada caso = uma rota em `app/<caso>/` + uma Route Handler + componentes em `components/<caso>/`.

## Fora do escopo

Autenticação, listagem histórica vinda do Sheets, telas dos casos 4.2–4.4.

## Checklist

### Bloco A — Base e design system
- [ ] Projeto Next em `/web` (TS, App Router, ESLint), `output: "standalone"`, `sass` instalado, `sassOptions` configurado
- [ ] `styles/`: tokens (claro e escuro), mixins, functions, reset, globals — conforme `02-design-system.md`
- [ ] Fonte Inter via `next/font`; tema claro/escuro com `ThemeToggle` e script anti-flash
- [ ] `lib/semantic.ts` com o mapa do caso 4.1 (`category`, `urgency`, `sentiment`, `department` → rótulo PT, tom e ícone)
- [ ] Componentes `ui/` necessários para a Fase 2: Button, TextField, Textarea, Select, SegmentedControl, Badge, Chip, Card, ConfidenceMeter, Alert, Spinner/Skeleton, EmptyState, CopyButton
- [ ] Layout: Header (navegação entre casos — só "Classificação" ativa, demais ocultas ou "em breve"), Container, PageHeader, Footer
- [ ] (Recomendado) Página `/ui` com todos os componentes nos dois temas
- [ ] Variável `N8N_WEBHOOK_BASE_URL` lida só no servidor; adicionar ao `.env.example`

### Bloco B — Tela de Classificação (`/classify`)
- [ ] Formulário: mensagem (obrigatória, contador de caracteres), cliente, canal
- [ ] Botões de "exemplos prontos" que preenchem o formulário (reaproveitar mensagens de `api/samples/messages.json`)
- [ ] Route Handler `POST /api/classify` → webhook do n8n, com timeout e tratamento de erro
- [ ] Card de resultado: badges coloridos para categoria, setor, urgência e sentimento; resumo; palavras-chave; barra de confiança; justificativa
- [ ] Estados: carregando, erro (mensagem amigável), sucesso
- [ ] Validação no cliente (mesmas regras da API: 5–5000 caracteres)
- [ ] Responsivo e acessível (labels, foco, contraste)
- [ ] (Opcional) Histórico da sessão: lista das últimas classificações em memória

### Bloco C — Docker e integração
- [ ] `web/Dockerfile` multi-stage (standalone)
- [ ] Serviço `web` no `docker-compose.yml` (porta host 3001, `depends_on: n8n`)
- [ ] Teste ponta a ponta: enviar pela tela → aparece na planilha → resultado exibido

### Bloco D — Documentação e fechamento
- [ ] README: seção "Interface Web" (como rodar, fluxo tela → n8n → API → Sheets, prints)
- [ ] Atualizar diagrama de arquitetura do README
- [ ] Resumo da fase + sugestão de PR; usuário faz commit/PR/merge/tag `v1.1.0`

## Prints a capturar (`docs/prints/fase-2/`)

| Arquivo | Conteúdo |
|---|---|
| `01-tela-formulario.png` | Tela com formulário preenchido |
| `02-tela-resultado.png` | Resultado exibido |
| `03-execucao-n8n-via-web.png` | Execução no n8n disparada pela tela |
| `04-planilha-via-web.png` | Linha correspondente na planilha |
| `05-mobile.png` | (opcional) Versão mobile |
| `06-tema-escuro.png` | (opcional) Tela no tema escuro |
| `07-design-system.png` | (opcional) Página `/ui` |

## Critérios de aceite

- `docker compose up --build` sobe api, n8n e web.
- Envio pela tela passa pelo n8n, grava no Sheets e mostra o resultado.
- Nenhuma URL interna ou segredo exposto no bundle do navegador.
