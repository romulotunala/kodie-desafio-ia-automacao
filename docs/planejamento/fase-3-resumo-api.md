# Fase 3 — Resumo automático de textos (API + n8n) (opcional)

**Branch:** `fase-3-resumo-api` · **Tag ao final:** `v1.2.0`
**Pré-requisito:** Fase 1 concluída. Seguir `docs/adicionar-novo-caso.md`.

## Objetivo

Caso 4.2: a equipe recebe textos longos (relatórios, e-mails, solicitações) e precisa de resumos com os pontos principais.

## Contrato — `POST /api/v1/summarize`

Entrada:

```json
{
  "text": "Relatório mensal de atendimento... (texto longo)",
  "length": "medium",
  "title": "Relatório de outubro"
}
```

- `text`: string, 50–20000 caracteres, obrigatória.
- `length`: `short` (1–2 frases) · `medium` (1 parágrafo) · `long` (2–3 parágrafos). Padrão `medium`.
- `title`: string opcional.

`result`:

```json
{
  "title": "Relatório de atendimento — outubro",
  "summary": "texto do resumo no tamanho pedido",
  "key_points": ["...", "..."],
  "suggested_actions": ["..."],
  "keywords": ["..."],
  "tone": "informative",
  "word_count": { "original": 1450, "summary": 120 }
}
```

- `key_points`: 3–7 itens. `suggested_actions`: 0–5 (vazio se o texto não pedir ação).
- `tone`: `informative` · `urgent` · `negative` · `positive` · `neutral` (PT: Informativo · Urgente · Negativo · Positivo · Neutro).
- `word_count` é calculado **pela API**, não pela IA.
- Textos livres gerados em português do Brasil.

## Prompt — pontos de atenção

- Não acrescentar informação que não está no texto.
- Respeitar o tamanho pedido.
- Pontos principais em frases curtas e autossuficientes.
- Gerar título se não for enviado.

## Checklist

- [ ] Módulo `modules/summarize/` (constants, schema, prompt, service, route, testes com Gemini mockado)
- [ ] Registro no Swagger
- [ ] `api/samples/texts.json` com 4–5 textos longos realistas da Loja Aurora (relatório de vendas, ata de reunião, e-mail longo de fornecedor, relatório de reclamações)
- [ ] Aba `resumos` na planilha: `recebido_em | titulo | tamanho | resumo | pontos_principais | acoes_sugeridas | palavras_original | palavras_resumo`
- [ ] Workflow `n8n/workflows/4.2-summarize.json`: Webhook `/webhook/summarize` → Edit Fields → HTTP Request → Edit Fields (arrays → texto com `•`, enums → rótulos PT) → Google Sheets → Respond to Webhook
- [ ] README: seção do caso 4.2 (problema, solução, endpoint, fluxo, prints)
- [ ] Resumo da fase + sugestão de PR; usuário faz commit/PR/merge/tag `v1.2.0`

## Prints (`docs/prints/fase-3/`)

Fluxo completo · cada node · execução com sucesso · dados no HTTP Request · planilha · Swagger.
