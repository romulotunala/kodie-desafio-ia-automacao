# Fase 5 — Organização de tarefas (API + n8n) (opcional)

**Branch:** `fase-5-tarefas-api` · **Tag ao final:** `v1.4.0`
**Pré-requisito:** Fase 1 concluída. Seguir `docs/adicionar-novo-caso.md`.

## Objetivo

Caso 4.3: a equipe recebe várias solicitações de atividades e precisa saber o que fazer primeiro. A IA interpreta, prioriza e ordena.

## Contrato — `POST /api/v1/tasks`

Entrada (exatamente **um** dos dois formatos):

```json
{
  "requests": [
    { "description": "Atualizar preços da coleção de verão no site", "requester": "Comercial", "due_date": "2026-11-28" },
    { "description": "Clientes não conseguem finalizar compra com Pix", "requester": "Atendimento" }
  ],
  "context": "Black Friday nesta semana"
}
```

```json
{ "free_text": "Preciso que alguém veja o Pix que está falhando, também temos que atualizar os preços...", "context": "..." }
```

- `requests`: 1–30 itens; `description` obrigatória (5–1000); `requester` e `due_date` (ISO) opcionais.
- `free_text`: 10–10000 caracteres; a IA extrai as tarefas.
- `context`: opcional, influencia a priorização.
- Zod: exatamente um entre `requests` e `free_text`.

`result`:

```json
{
  "tasks": [
    {
      "order": 1,
      "title": "Corrigir falha no pagamento via Pix",
      "description": "Clientes não conseguem finalizar compras usando Pix.",
      "priority": "critical",
      "impact": "high",
      "effort": "medium",
      "department": "tech_support",
      "suggested_due_date": "2026-11-25",
      "rationale": "Bloqueia vendas durante a Black Friday."
    }
  ],
  "overview": "2 tarefas; 1 crítica bloqueando vendas.",
  "notes": ["Tarefa X está ambígua: confirmar escopo com o solicitante."]
}
```

- `priority`: `critical` · `high` · `medium` · `low` (PT: Crítica · Alta · Média · Baixa).
- `impact` / `effort`: `high` · `medium` · `low`.
- `department`: mesmos valores do caso 4.1.
- `suggested_due_date`: data ISO ou `null` (não inventar sem base).
- `order` única e sequencial a partir de 1 — a API valida e reordena se necessário.
- A data de hoje é enviada pela API no prompt.
- Textos livres em português do Brasil.

## Prompt — pontos de atenção

- Critério explícito de priorização (impacto × urgência; bloqueio de vendas/clientes primeiro; prazos próximos sobem).
- Sinalizar solicitações ambíguas em `notes`.

## Checklist

- [ ] Módulo `modules/tasks/` (constants, schema com refinamento "um ou outro", prompt, service com pós-validação de `order`, route, testes)
- [ ] Registro no Swagger (documentar os dois formatos)
- [ ] `api/samples/task-requests.json` com 2–3 lotes realistas (lista e texto livre)
- [ ] Aba `tarefas`: `processado_em | lote_id | ordem | titulo | prioridade | impacto | esforco | setor | prazo_sugerido | justificativa`
- [ ] Workflow `n8n/workflows/4.3-tasks.json`: Webhook `/webhook/tasks` → Edit Fields → HTTP Request → **Split Out** (uma linha por tarefa) → Edit Fields (rótulos PT) → Google Sheets → Respond to Webhook (lista completa)
- [ ] (Opcional) IF: `critical` → ramo de destaque
- [ ] README: seção do caso 4.3
- [ ] Resumo da fase + sugestão de PR; usuário faz commit/PR/merge/tag `v1.4.0`

## Prints (`docs/prints/fase-5/`)

Fluxo completo · cada node (incluindo Split Out) · execução com sucesso · dados antes/depois do Split Out · planilha · Swagger.
