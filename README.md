# Kairo Agent

Kairo Agent é o aplicativo de agente de IA deste repositório. A aplicação usa Gemini 2.5 Flash no servidor, com pesquisa web nativa e um registro único de skills.

## Configuração

Crie um arquivo `.env` ou configure a variável no ambiente de deploy:

```env
GEMINI_API_KEY=sua_chave
```

A chave é usada somente no servidor; o navegador não recebe a credencial.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Desktop

O projeto também mantém o shell Tauri 2 para distribuição desktop:

```bash
npm run desktop:dev
npm run desktop:build
```

## Arquitetura

- `src/components/kairo-agent-app.tsx`: interface principal do Agent.
- `src/lib/kairo-agent.ts`: execução server-side do agente e integração Gemini.
- `src/lib/kairo-skills.ts`: registro único e detecção de skills.
- `src/routes/`: única rota da aplicação.
- `src-tauri/`: runtime desktop com acesso local restrito.

O Agent não expõe chaves de API no cliente e não mantém os antigos provedores, bots, autenticação e fluxos de aplicativo como parte da execução principal.
