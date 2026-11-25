# Fase 6 — Tela de Organização de tarefas (opcional)

**Branch:** `fase-6-tarefas-web` · **Tag ao final:** `v1.5.0`
**Pré-requisitos:** Fase 2 (front base) e Fase 5 (API de tarefas).

## Objetivo

Tela `/tasks` para enviar solicitações e visualizar a lista priorizada.

## Checklist

- [ ] Ativar "Tarefas" na navegação
- [ ] Route Handler `POST /api/tasks` → `${N8N_WEBHOOK_BASE_URL}/tasks`
- [ ] Alternância entre dois modos de entrada: **lista** (adicionar/remover linhas com descrição, solicitante, prazo) e **texto livre**
- [ ] Campo de contexto opcional
- [ ] Exemplos prontos (de `api/samples/task-requests.json`)
- [ ] Resultado: lista ordenada de cards com número de ordem, prioridade (cor), impacto/esforço, setor, prazo, justificativa
- [ ] Visão alternativa em **colunas por prioridade** (estilo kanban, só visualização) ou **matriz impacto × esforço** — escolher uma
- [ ] Bloco com `resumo_geral` e `observacoes`
- [ ] (Opcional) Exportar a lista como texto/Markdown para copiar
- [ ] README: atualizar seção "Interface Web"
- [ ] Resumo da fase + sugestão de PR; usuário faz commit/PR/merge/tag `v1.5.0`

## Prints (`docs/prints/fase-6/`)

Modo lista preenchido · modo texto livre · resultado (lista e visão alternativa) · execução no n8n · planilha.
