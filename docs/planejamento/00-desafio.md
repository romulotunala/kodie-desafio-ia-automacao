# O desafio — requisitos e checklist de entrega

Resumo fiel do PDF "Desafio Técnico — IA e Automação" (KODIE). Use como critério de aceite final.

## Objetivo

Desenvolver uma solução simples que use IA para resolver um problema do cotidiano, **integrando uma API de IA a um fluxo de automação**. O foco é a integração IA + API + automação; interface visual não é exigida.

## Cenário

Pequena empresa recebe diariamente mensagens de clientes (dúvidas, solicitações, reclamações). Hoje uma pessoa lê cada uma, identifica o assunto e encaminha manualmente ao setor responsável. A IA deve interpretar/classificar; a automação deve encaminhar.

## Perguntas que o projeto deve responder (usar no README)

- Como a IA pode ajudar a organizar as mensagens?
- Quais informações precisam ser identificadas?
- Como classificar as mensagens de acordo com o conteúdo?
- Como automatizar o encaminhamento?
- **Como garantir que a resposta da IA esteja em um formato adequado?** → saída JSON estruturada do Gemini + validação Zod + retry.

## Casos (escolher um — aqui: 4.1 obrigatório, demais opcionais)

- **4.1 Classificação de mensagens** — categorias como dúvida, reclamação, solicitação.
- 4.2 Resumo automático de textos — destacar pontos principais.
- 4.3 Organização de tarefas — interpretar solicitações e priorizar.
- 4.4 Assistente de FAQ — responder com base em um conjunto simples de informações.

## Tecnologias obrigatórias

- IA: API ou modelo à escolha → **Gemini**.
- Back-end: Python ou Node.js; FastAPI ou Express → **Node.js + Express**.
- Automação: n8n ou Make → **n8n**.

## Checklist de entrega (obrigatório)

- [ ] API funcional com Express
- [ ] Integração com modelo de IA
- [ ] Prompt estruturado para a tarefa
- [ ] Resposta da IA em formato organizado (JSON)
- [ ] Fluxo de automação funcional no n8n
- [ ] Integração entre a API e o fluxo
- [ ] `README.md` explicando o projeto (estrutura abaixo)
- [ ] Documentação visual do fluxo com prints (detalhes abaixo)
- [ ] JSON exportado do workflow n8n no repositório
- [ ] Código-fonte completo no GitHub
- [ ] `.env.example` — **nenhuma chave/senha/credencial no repositório**

## Estrutura obrigatória do README

1. **Apresentação da Ideia** — de onde surgiu a ideia.
2. **Problema Escolhido** — qual cenário foi resolvido.
3. **Solução Proposta** — como funciona e como a IA participa.
4. **Tecnologias Utilizadas**.
5. **Funcionamento do Sistema** — como a API recebe os dados, como a IA processa, como a automação executa.
6. **Como Executar** — instalação e execução.

(Seções extras permitidas: Docker, Swagger, endpoints, documentação do fluxo, estrutura de pastas, próximos passos.)

## Prints exigidos do fluxo de automação

Cada print com uma **descrição curta** da função da etapa. Podem ficar no README ou em PDF complementar.

1. **Fluxo completo** — todos os nodes conectados.
2. **Execução bem-sucedida** — execução concluída com sucesso.
3. **Configuração de cada node** — print individual de cada node (Webhook, Edit Fields, HTTP Request, Google Sheets, Respond to Webhook...). ⚠️ O PDF reforça: não basta o fluxo geral; é preciso mostrar a configuração interna dos nodes.
4. **Resultados** — dados recebidos e processados em cada etapa importante.

## Opcional (diferencial): Docker

- [ ] `Dockerfile` da aplicação
- [ ] `docker-compose.yml` com API **e n8n** (recomendado incluir o n8n)
- [ ] JSON do workflow
- [ ] Arquivos de configuração (`.env.example`)
- [ ] Instruções no README para rodar com Docker Compose

## O que é valorizado

Pensamento crítico, construção de prompts, integração com APIs de IA, **organização e validação de dados**, construção de fluxos de automação. "Mais do que fazer uma IA responder, mostrar como ela pode ser integrada a uma aplicação para resolver um problema."
