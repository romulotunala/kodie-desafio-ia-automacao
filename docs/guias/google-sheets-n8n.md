# Guia — Conectar o Google Sheets ao n8n (self-hosted no Docker)

Este passo é **manual** (feito por você na interface do Google Cloud e do n8n). Leva uns 10–15 minutos.

> A chave do Gemini (AI Studio) e o acesso do app Gemini à sua conta **não** servem aqui. O n8n precisa de uma credencial OAuth2 própria.

As telas do Google Cloud mudam de tempos em tempos; se algum nome estiver diferente, procure a opção equivalente.

## 1. Criar a planilha

1. No Google Sheets, crie a planilha **"Loja Aurora — Atendimento"**.
2. Renomeie a primeira aba para `classificacoes` e coloque na linha 1 os cabeçalhos:
   `recebido_em | cliente | canal | mensagem | categoria | setor | urgencia | sentimento | resumo | confianca`
3. (Fases opcionais) Crie depois as abas `resumos`, `tarefas`, `faq`, `faq_pendentes`.

## 2. Projeto no Google Cloud

1. Acesse o Google Cloud Console e crie um projeto (ex.: `kodie-n8n`).
2. Em **APIs e serviços → Biblioteca**, ative:
   - **Google Sheets API**
   - **Google Drive API** (o n8n usa para listar as planilhas)

## 3. Tela de consentimento OAuth

1. **APIs e serviços → Tela de consentimento OAuth** (ou "Google Auth Platform").
2. Tipo de usuário: **Externo**.
3. Preencha nome do app (ex.: `n8n local`), e-mail de suporte e e-mail do desenvolvedor.
4. Em **Usuários de teste**, adicione **o seu próprio e-mail**.
5. Deixe o app em modo **Teste** (não precisa publicar).

> No modo Teste, o token pode expirar depois de alguns dias. Se o node do Sheets começar a dar erro de autenticação, é só reconectar a credencial no n8n.

## 4. Criar o cliente OAuth

1. Abra o n8n (`http://localhost:5678`) → **Credentials → Add credential → Google Sheets OAuth2 API**.
2. Copie a **OAuth Redirect URL** que o n8n mostra (algo como `http://localhost:5678/rest/oauth2-credential/callback`).
3. No Google Cloud: **APIs e serviços → Credenciais → Criar credenciais → ID do cliente OAuth**.
   - Tipo: **Aplicativo da Web**.
   - **URIs de redirecionamento autorizados:** cole a URL copiada do n8n.
4. Copie o **Client ID** e o **Client Secret**.

## 5. Finalizar no n8n

1. Cole Client ID e Client Secret na credencial do n8n.
2. Clique em **Sign in with Google**, escolha sua conta e autorize (o Google vai avisar que o app não foi verificado — é esperado, clique para continuar).
3. Salve a credencial. Nome sugerido: `Google Sheets - Loja Aurora`.

## 6. Usar no workflow

No node **Google Sheets**:
- Credential: `Google Sheets - Loja Aurora`
- Operation: **Append Row** (ou "Append or Update")
- Document: a planilha criada · Sheet: `classificacoes`
- Mapeie cada coluna com os campos do JSON da API (ex.: `{{ $json.result.category }}` — ou do campo já traduzido para PT no Edit Fields anterior)

## Segurança

- Client Secret e tokens ficam **dentro do volume do n8n** (`n8n_data`), criptografados com `N8N_ENCRYPTION_KEY`. Nunca commite esse volume.
- Não perca a `N8N_ENCRYPTION_KEY`: se ela mudar, o n8n não consegue mais ler as credenciais salvas.
- O JSON exportado do workflow só referencia a credencial pelo nome/ID — pode ir para o GitHub.

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| `redirect_uri_mismatch` | URL de redirecionamento no Google diferente da mostrada pelo n8n (atenção a `localhost` × `127.0.0.1` e à porta) |
| `access_denied` / "app bloqueado" | Seu e-mail não está em Usuários de teste |
| Planilha não aparece na lista | Google Drive API não ativada |
| Funcionava e parou de autenticar | Token expirado no modo Teste → reconectar a credencial |
