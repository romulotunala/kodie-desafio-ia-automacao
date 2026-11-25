# Fase 8 — Tela do Assistente de FAQ (opcional)

**Branch:** `fase-8-faq-web` · **Tag ao final:** `v1.7.0`
**Pré-requisitos:** Fase 2 (front base) e Fase 7 (API do FAQ).

## Objetivo

Tela `/faq` em formato de chat simples, mostrando as respostas da IA e quando a dúvida foi encaminhada para um humano.

## Checklist

- [ ] Ativar "FAQ" na navegação
- [ ] Route Handler `POST /api/faq` → `${N8N_WEBHOOK_BASE_URL}/faq`
- [ ] Route Handler `GET /api/faq/knowledge-base` → API Express (`/api/v1/faq/knowledge-base`) via URL interna server-side (adicionar `API_BASE_URL=http://api:3000` ao `.env.example`)
- [ ] Interface de chat: histórico da sessão em memória, mensagem do cliente × resposta do assistente, indicador "digitando"
- [ ] Em cada resposta: chips com as fontes usadas (ao clicar, mostra a entrada da base), barra de confiança
- [ ] Resposta não encontrada: aviso visual "Encaminhado para um atendente"
- [ ] Perguntas relacionadas como botões clicáveis (enviam nova pergunta)
- [ ] Painel lateral/aba "Base de conhecimento" listando as entradas por categoria
- [ ] Sugestões iniciais de perguntas (de `api/samples/questions.json`)
- [ ] README: atualizar seção "Interface Web"
- [ ] Resumo da fase + sugestão de PR; usuário faz commit/PR/merge/tag `v1.7.0`

## Prints (`docs/prints/fase-8/`)

Chat com respostas encontradas · resposta encaminhada para humano · painel da base de conhecimento · execução no n8n · planilha.
