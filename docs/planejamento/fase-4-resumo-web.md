# Fase 4 — Tela de Resumo (opcional)

**Branch:** `fase-4-resumo-web` · **Tag ao final:** `v1.3.0`
**Pré-requisitos:** Fase 2 (front base) e Fase 3 (API do resumo).

## Objetivo

Tela `/summarize` usando os componentes e padrões criados na Fase 2.

## Checklist

- [ ] Ativar "Resumo" na navegação
- [ ] Route Handler `POST /api/summarize` → `${N8N_WEBHOOK_BASE_URL}/summarize`
- [ ] Formulário: título (opcional), textarea grande com contador de palavras, seletor de tamanho (curto/médio/longo)
- [ ] Exemplos prontos (de `api/samples/texts.json`)
- [ ] Resultado: título, resumo, lista de pontos principais, ações sugeridas (destacadas), palavras-chave, badge de tom, indicador de redução ("1450 → 120 palavras, −92%")
- [ ] Botão "copiar resumo"
- [ ] Estados de loading/erro/sucesso (reaproveitar componentes)
- [ ] README: atualizar seção "Interface Web" com a nova tela
- [ ] Resumo da fase + sugestão de PR; usuário faz commit/PR/merge/tag `v1.3.0`

## Prints (`docs/prints/fase-4/`)

Tela com texto preenchido · resultado · execução no n8n disparada pela tela · linha na planilha.
