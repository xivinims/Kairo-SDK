# Zeno

Zeno é um agente de IA construído sobre Gemini com BYOK, skills e ferramentas reais. A interface foi refeita para ficar limpa e discreta, com navegação lateral simples e uma barra de escrita grande no estilo de apps de IA modernos.

## O que já existe

- Gemini BYOK: cada pessoa pode adicionar sua própria API key.
- Seletor de modelo Gemini.
- Pesquisa web nativa do Gemini.
- Loop de ferramentas com até 6 etapas.
- Skills detectadas automaticamente pelo pedido.
- Google Auth via Firebase.
- Conector Google Drive com leitura somente.
- Conector GitHub com leitura/pesquisa de código.
- Terminal local restrito no aplicativo Tauri.
- Tokens de conectores mantidos somente durante a sessão do navegador.
- Layout responsivo e input com 16px para evitar zoom automático no iPhone.

## Configuração

Copie `.env.example` para `.env`.

```env
GEMINI_API_KEY=

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

`GEMINI_API_KEY` é opcional: se ela não existir no servidor, o usuário pode adicionar a própria chave nas configurações do Zeno.

### Firebase

No projeto Firebase:

1. Ative **Authentication > Google**.
2. Para o conector GitHub, ative também o provedor **GitHub** e configure o Client ID/Secret do OAuth App.
3. Adicione o domínio do deploy em **Authorized domains**.
4. Use as variáveis `VITE_FIREBASE_*` acima.

O login Google usa somente a identidade. O acesso ao Drive é solicitado separadamente com escopo `drive.readonly`.

## Desenvolvimento

```bash
npm install
npm run dev
```

Validação:

```bash
npm run typecheck
npm run build
```

## Desktop

```bash
npm run desktop:dev
npm run desktop:build
```

No desktop, a ferramenta de terminal é propositalmente limitada a pastas autorizadas (`Documents` e `Projects`) e a comandos seguros de leitura, como `pwd`, `ls`, `git status`, `git diff`, `git log`, `git show`, `git branch` e `git ls-files`.

## Arquitetura

- `src/components/zeno-agent-app.tsx`: interface principal.
- `src/components/zeno-home.tsx`: sidebar.
- `src/lib/zeno-agent.ts`: runtime do agente e loop do Gemini.
- `src/lib/zeno-skills.ts`: skills e detecção.
- `src/lib/zeno-tools.ts`: ferramentas GitHub/Google.
- `src/lib/zeno-auth.ts`: Google Auth e OAuth dos conectores.
- `src/lib/zeno-connectors.ts`: sessão dos conectores.
- `src-tauri/src/main.rs`: runtime desktop e terminal restrito.
