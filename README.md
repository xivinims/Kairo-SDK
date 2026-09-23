# Kairo App

Kairo App é o aplicativo do agente de IA **Kairo**: chat com histórico, 23 skills ativadas automaticamente, pesquisa web nativa (Gemini 2.5 Flash no servidor) e tarefas agendadas.

## Configuração

```env
GEMINI_API_KEY=sua_chave
```

A chave fica só no servidor; o navegador nunca a recebe.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Recursos

- **Chat**: conversas salvas no navegador (localStorage).
- **Skills**: ligue/desligue na aba Skills.
- **Tarefas**: agende um pedido (uma vez, todo dia ou toda semana). As execuções rodam enquanto o app estiver aberto; para rodar com o app fechado é preciso um cron no servidor (ex.: Vercel Cron).
- **Fontes**: títulos usam a fonte padrão; código e HTML usam Google Sans Code.

## Desktop (Tauri 2)

```bash
npm run desktop:dev
npm run desktop:build
```

O `desktop:dev` abre o app apontando para `http://localhost:8080`.

## Estrutura

- `src/components/kairo-agent-app.tsx`: interface (chat, tarefas, skills).
- `src/lib/kairo-agent.ts`: agente server-side e integração Gemini.
- `src/lib/kairo-skills.ts`: registro de skills.
- `src-tauri/`: shell desktop com acesso local restrito.
