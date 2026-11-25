# Design System — Front (Next.js + SCSS Modules)

Regras visuais e de componentes do `/web`. Vale para **todas** as fases de front (2, 4, 6, 8). Toda tela nova usa estes tokens e componentes. Se faltar algo, crie o componente aqui e documente, em vez de estilizar algo pontual na página.

> Valores de cor e fonte abaixo são um ponto de partida. O usuário pode ajustar a paleta; o que não muda é a **estrutura** (tokens → componentes → telas).

## Princípios

1. **Tokens primeiro:** nenhuma cor, espaçamento, raio, sombra ou tamanho de fonte "solto" nos `.module.scss`. Sempre `var(--token)`.
2. **Significado consistente:** "reclamação", "urgência alta" e "prioridade crítica" têm a mesma aparência em qualquer tela.
3. **Cor nunca é o único sinal:** badges sempre têm texto (e ícone quando fizer sentido).
4. **Acessível por padrão:** contraste WCAG AA, foco visível, navegação por teclado, `prefers-reduced-motion` respeitado.
5. **Claro e escuro:** tema claro como padrão, escuro via preferência do sistema ou alternância manual.

## Stack de estilo

- **SCSS Modules** (`*.module.scss`) por componente. Sem Tailwind, sem CSS-in-JS, sem biblioteca de componentes.
- Dependências permitidas: `sass`, `clsx` (composição de classes), `lucide-react` (ícones). Qualquer outra: perguntar antes.
- Fonte: **Inter** via `next/font/google` (exposta como `--font-sans`). Código/JSON: `--font-mono` (fonte mono do sistema).
- Tokens em **CSS custom properties** (permitem tema em runtime). SCSS é usado para mixins, funções e organização — não para guardar valores de tema.

## Estrutura

```
web/src/
├── styles/
│   ├── _tokens.scss       # :root e [data-theme="dark"] com todas as CSS vars
│   ├── _mixins.scss       # breakpoints, focus-ring, visually-hidden, truncate, reduced-motion
│   ├── _functions.scss    # rem() etc.
│   ├── _reset.scss        # reset moderno
│   └── globals.scss       # @use dos parciais acima + estilos base de html/body/tipografia
├── components/
│   ├── ui/                # componentes genéricos do design system
│   │   └── Button/
│   │       ├── Button.tsx
│   │       ├── Button.module.scss
│   │       └── index.ts
│   ├── layout/            # Header, Footer, PageHeader, Container, ThemeToggle
│   └── <caso>/            # componentes específicos (ex.: classify/ClassificationResult)
└── lib/semantic.ts        # mapa valor da API → tom/rótulo/ícone (ver "Cores semânticas")
```

- Configurar `sassOptions` no `next.config` para os módulos importarem com `@use "mixins" as *;` sem caminhos relativos longos.
- `globals.scss` importado uma única vez no `app/layout.tsx`.

## Tokens

### Cores base

Nomes semânticos (o que é), não descritivos (que cor é).

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--color-bg` | `#F7F8FA` | `#0F1115` | Fundo da página |
| `--color-surface` | `#FFFFFF` | `#171A21` | Cards, inputs |
| `--color-surface-muted` | `#F0F2F5` | `#1F232C` | Áreas secundárias, hover |
| `--color-border` | `#E2E5EA` | `#2A2F3A` | Bordas |
| `--color-text` | `#14171F` | `#E8EAF0` | Texto principal |
| `--color-text-muted` | `#5B6272` | `#9AA1B2` | Texto secundário |
| `--color-primary` | `#5B4BDB` | `#8B7CF6` | Ações principais, links, foco |
| `--color-primary-hover` | `#4A3BC4` | `#A193F8` | Hover |
| `--color-on-primary` | `#FFFFFF` | `#0F1115` | Texto sobre primária |
| `--color-focus` | `#5B4BDB` | `#A193F8` | Anel de foco |

(Primária violeta como referência à "aurora"; trocar se o usuário preferir.)

### Tons de status

Cada tom tem 3 tokens: `--tone-<nome>-bg` (fundo suave), `--tone-<nome>-fg` (texto/ícone, contraste AA sobre o bg) e `--tone-<nome>-solid` (barras, bordas, indicadores).

| Tom | Sentido |
|---|---|
| `info` | azul — informação, dúvida |
| `success` | verde — positivo, concluído |
| `warning` | âmbar — atenção, média urgência |
| `danger` | vermelho — problema, urgência alta |
| `critical` | vermelho intenso/magenta — só para prioridade crítica |
| `neutral` | cinza — neutro, "outro" |
| `accent` | violeta — destaque da marca |

Definir valores para claro e escuro, validando contraste AA (4.5:1) de `fg` sobre `bg`.

### Espaçamento (base 4px)

`--space-1: 4px` · `--space-2: 8px` · `--space-3: 12px` · `--space-4: 16px` · `--space-5: 20px` · `--space-6: 24px` · `--space-8: 32px` · `--space-10: 40px` · `--space-12: 48px` · `--space-16: 64px`

### Tipografia

| Token | Tamanho / altura de linha | Uso |
|---|---|---|
| `--text-xs` | 12px / 16px | Legendas, contadores |
| `--text-sm` | 14px / 20px | Labels, badges, texto secundário |
| `--text-md` | 16px / 24px | Corpo |
| `--text-lg` | 18px / 28px | Destaques |
| `--text-xl` | 20px / 28px | Títulos de card |
| `--text-2xl` | 24px / 32px | Títulos de seção |
| `--text-3xl` | 30px / 38px | Título de página |

Pesos: `--weight-regular: 400` · `--weight-medium: 500` · `--weight-semibold: 600` · `--weight-bold: 700`.

### Forma, sombra e movimento

- Raios: `--radius-sm: 6px` · `--radius-md: 10px` · `--radius-lg: 16px` · `--radius-full: 9999px`
- Sombras: `--shadow-sm`, `--shadow-md`, `--shadow-lg` (mais sutis no escuro)
- Movimento: `--duration-fast: 120ms` · `--duration-base: 200ms` · `--ease-standard: cubic-bezier(.2,0,0,1)`. Com `prefers-reduced-motion: reduce`, animações viram 0ms.

### Breakpoints (mixins, não CSS vars)

`sm 640px` · `md 768px` · `lg 1024px` · `xl 1280px` — mobile first: `@include up(md) { ... }`.

## Cores semânticas do domínio

Centralizar em `web/src/lib/semantic.ts`: para cada valor que vem da API, o **rótulo em português**, o **tom** e o **ícone** (lucide). Componentes nunca decidem cor por conta própria — consultam esse mapa.

### Caso 4.1 — Classificação

| Campo | Valor | Rótulo | Tom |
|---|---|---|---|
| `category` | `question` | Dúvida | info |
| | `complaint` | Reclamação | danger |
| | `request` | Solicitação | warning |
| | `compliment` | Elogio | success |
| | `other` | Outro | neutral |
| `urgency` | `low` / `medium` / `high` | Baixa / Média / Alta | neutral / warning / danger |
| `sentiment` | `positive` / `neutral` / `negative` | Positivo / Neutro / Negativo | success / neutral / danger |
| `department` | `customer_service` · `finance` · `logistics` · `tech_support` · `sales` | Atendimento · Financeiro · Logística · Suporte técnico · Comercial | accent (variante outline) + ícone próprio |

Tipar o mapa a partir dos tipos do contrato (ex.: `Record<Category, SemanticEntry>`), para o TypeScript acusar se um valor novo da API ficar sem rótulo.

### Casos opcionais (preencher na fase correspondente)

- 4.2 `tone`: `informative` → info · `urgent` → danger · `negative` → danger · `positive` → success · `neutral` → neutral
- 4.3 `priority`: `critical` → critical · `high` → danger · `medium` → warning · `low` → neutral
- 4.4 `needs_human: true` → warning ("Encaminhado para atendente"); `answer_found: true` → success

### Erros da API

A API devolve mensagens de erro em inglês. O front mapeia `error.code` para mensagens amigáveis em português, também em `lib/semantic.ts` (ou `lib/errors.ts`): `VALIDATION_ERROR`, `AI_INVALID_RESPONSE`, `AI_UNAVAILABLE`, `INTERNAL_ERROR`, e um genérico para falhas de rede/timeout.

## Componentes (`components/ui/`)

Todos tipados, com variantes por props, `forwardRef` quando envolverem elementos de formulário, e sem margens externas (quem posiciona é o pai).

| Componente | Variantes / props principais | Notas |
|---|---|---|
| `Button` | `variant`: primary · secondary · ghost · danger; `size`: sm · md; `loading`; `iconLeft` | `loading` desabilita e mostra spinner mantendo a largura |
| `TextField` | `label`, `hint`, `error` | Label sempre visível; `aria-describedby` para hint/erro |
| `Textarea` | + `maxLength`, `showCounter`, `autoResize` | Contador muda de tom perto do limite |
| `Select` | `options`, `label`, `error` | Nativo estilizado |
| `SegmentedControl` | `options`, `value`, `onChange` | Canal, tamanho do resumo, modo de entrada; `role="radiogroup"` |
| `Badge` | `tone`, `variant`: soft · outline · solid; `icon` | Usado com `semantic.ts` |
| `Chip` | clicável, `icon` | Exemplos prontos, perguntas relacionadas, fontes do FAQ |
| `Card` | `Card`, `Card.Header`, `Card.Body`, `Card.Footer` | Superfície padrão |
| `ConfidenceMeter` | `value` (0–1), `label` | Barra + porcentagem; tom por faixa (<0.5 warning, ≥0.8 success) |
| `Alert` | `tone`: info · success · warning · danger; `title` | Erros da API em linguagem amigável |
| `Spinner` / `Skeleton` | `size` / formas | Skeleton no lugar do card de resultado durante o loading |
| `EmptyState` | `icon`, `title`, `description`, `action` | Antes do primeiro envio |
| `Tabs` | acessíveis (setas do teclado) | Alternar visões (ex.: lista × kanban na Fase 6) |
| `CopyButton` | `text` | Feedback "Copiado!" |

Layout (`components/layout/`): `Header` (marca + navegação entre casos + `ThemeToggle`), `Container` (largura máx. 1120px), `PageHeader` (título, descrição do caso, link para o Swagger), `Footer`.

## Padrões de tela

Todas as telas de caso seguem o mesmo esqueleto:

```
PageHeader (título do caso + 1 linha explicando o problema)
├── Coluna "Entrada"    → formulário + chips de exemplos
└── Coluna "Resultado"  → EmptyState | Skeleton | Alert de erro | card de resultado
```

- Desktop (`lg+`): duas colunas lado a lado. Mobile: empilhado, resultado abaixo; rolar até o resultado ao receber a resposta.
- A região de resultado tem `aria-live="polite"`.
- Erros sempre em `Alert` com mensagem amigável + ação ("Tentar novamente"); nunca mostrar stack ou JSON cru.
- (Opcional) Detalhe "Ver JSON da resposta" recolhível, em `--font-mono` — bom para os prints e para o avaliador ver a integração.

## Tema claro/escuro

- `data-theme="light" | "dark"` no `<html>`. Sem escolha salva, segue `prefers-color-scheme`.
- Escolha persistida em `localStorage` (com `try/catch`).
- Script inline mínimo no `<head>` do layout para aplicar o tema antes da pintura (evita "flash").

## Acessibilidade (checklist por componente)

- [ ] Foco visível com `@include focus-ring` (usa `--color-focus`), só em `:focus-visible`
- [ ] Contraste AA em texto e badges, nos dois temas
- [ ] Todo campo com `<label>` associado; erros ligados por `aria-describedby`
- [ ] Ícones decorativos com `aria-hidden`; botões só com ícone têm `aria-label`
- [ ] Alvos de toque ≥ 40px no mobile
- [ ] Nada depende só de cor

## Convenções de código

- Um componente por pasta: `Nome.tsx`, `Nome.module.scss`, `index.ts`.
- Classes do módulo em camelCase (`.root`, `.header`, `.isActive`); variantes via `data-*` (`[data-variant="primary"]`) ou classes compostas com `clsx`.
- Sem estilos inline, exceto CSS vars dinâmicas (ex.: `style={{ "--value": "72%" }}` no `ConfidenceMeter`).
- Componentes do `ui/` não sabem nada do domínio; o domínio entra via `semantic.ts` e componentes em `components/<caso>/`.
- `"use client"` só onde há estado/interação.

## Página de referência (opcional, recomendada)

Rota `/ui` listando todos os componentes e variantes nos dois temas. Ajuda a revisar o design system e rende um bom print para o README.
