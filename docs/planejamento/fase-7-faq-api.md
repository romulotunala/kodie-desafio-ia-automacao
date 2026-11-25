# Fase 7 — Assistente de Perguntas Frequentes (API + n8n) (opcional)

**Branch:** `fase-7-faq-api` · **Tag ao final:** `v1.6.0`
**Pré-requisito:** Fase 1 concluída. Seguir `docs/adicionar-novo-caso.md`.

## Objetivo

Caso 4.4: clientes repetem as mesmas dúvidas. A IA responde **somente** com base em um conjunto de informações fornecido. Quando não souber, diz que não sabe e sinaliza encaminhamento para um humano.

## Base de conhecimento

`api/data/faq.json` — 15 a 20 entradas da Loja Aurora (fictícias, coerentes entre si). Chaves em inglês, conteúdo em português:

```json
[
  {
    "id": "shipping-time",
    "category": "shipping",
    "question": "Qual o prazo de entrega?",
    "answer": "Capitais: 3 a 5 dias úteis. Demais cidades: 5 a 10 dias úteis, após a confirmação do pagamento.",
    "tags": ["prazo", "frete", "entrega"]
  }
]
```

Temas: prazos e frete, trocas e devoluções, formas de pagamento, Pix e boleto, rastreamento, cancelamento, garantia, tamanhos, cupons, horário de atendimento, canais de contato, nota fiscal, compra internacional, lojas físicas.

Base pequena → enviar a base inteira no prompt (sem embeddings/RAG). Carregar e validar com Zod na inicialização da API.

## Contrato — `POST /api/v1/faq`

Entrada:

```json
{ "question": "Posso trocar um produto que comprei em promoção?", "customer": "João" }
```

- `question`: 3–1000 caracteres, obrigatória. `customer`: opcional.

`result`:

```json
{
  "answer_found": true,
  "answer": "Sim! Produtos em promoção podem ser trocados em até 30 dias...",
  "sources": ["returns-window", "returns-sale-items"],
  "confidence": 0.9,
  "needs_human": false,
  "handoff_reason": null,
  "related_questions": ["Como faço uma devolução?"]
}
```

- `sources`: IDs da base usados. **A API valida que existem**; IDs inválidos são removidos e, se nenhum sobrar com `answer_found: true`, força `answer_found: false`.
- `answer_found: false` → `needs_human: true` e `answer` educada dizendo que um atendente vai ajudar.
- `related_questions`: até 3, vindas da base.
- `answer` e `handoff_reason` em português do Brasil.

Endpoint auxiliar: `GET /api/v1/faq/knowledge-base` → lista a base.

## Prompt — pontos de atenção

- **Nunca** responder com informação fora da base (anti-alucinação explícita).
- Tom cordial e curto.
- Perguntas fora do escopo da loja → `answer_found: false`.
- Combinar entradas quando a pergunta tocar vários temas.

## Checklist

- [ ] `api/data/faq.json` + schema Zod da base + carregamento na inicialização
- [ ] Módulo `modules/faq/` (constants, schema, prompt com a base, service com validação de `sources`, route, testes — incluindo pergunta fora da base)
- [ ] `GET /api/v1/faq/knowledge-base`
- [ ] Registro no Swagger
- [ ] `api/samples/questions.json` com ~10 perguntas (respondíveis, combinadas e fora da base)
- [ ] Aba `faq`: `recebido_em | cliente | pergunta | encontrou_resposta | resposta | fontes | confianca | encaminhar_humano`
- [ ] Workflow `n8n/workflows/4.4-faq.json`: Webhook `/webhook/faq` → Edit Fields → HTTP Request → Edit Fields (rótulos PT) → **IF `needs_human`** → (verdadeiro) Sheets aba `faq_pendentes` / (ambos) Sheets aba `faq` → Respond to Webhook
- [ ] README: seção do caso 4.4 (explicar a estratégia anti-alucinação)
- [ ] Resumo da fase + sugestão de PR; usuário faz commit/PR/merge/tag `v1.6.0`

## Prints (`docs/prints/fase-7/`)

Fluxo completo · cada node (incluindo IF) · execução com resposta encontrada · execução com encaminhamento humano · planilha (abas `faq` e `faq_pendentes`) · Swagger.
