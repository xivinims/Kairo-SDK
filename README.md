# Kairo SDK
+
+Kairo SDK é um app de chat com IA, inspirado em interfaces premium, com suporte a perfis, instruções, RPG, histórias e múltiplos provedores de API.
+
+Este repositório agora também inclui a base do Kairo Agent Core: agente com habilidades, planejamento, verificação e política de conteúdo.
+
+## O que já existe
+
+- interface de chat inspirada em Claude
+- perfis de usuário e personagens
+- instruções globais + modo história
+- suporte a vários providers: Grok, OpenAI, Gemini, Groq, Claude, OpenRouter
+- modo RPG com acompanhamento de enredo
+
+## Nova base do Kairo Agent
+
+- `src/lib/kairo-agent.ts`
+- pensamento em duas etapas: execução + verificação
+- escolher skills automaticamente por contexto
+- controlo de conteúdo por nível: `safe`, `mature`, `adult`
+- bloqueio de conteúdo ilegal e exploração
+- integração com Gemini via API
+
+## Como usar
+
+```ts
+import { askKairoAgent } from "@/lib/kairo-agent";
+
+const result = await askKairoAgent({
+  message: "Crie uma história de fantasia sombria para um RPG com personagens fortes.",
+  ageVerified: true,
+  contentLevel: "mature",
+  allowAdultThemes: true,
+  allowExplicitSexualContent: false,
+  apiKey: process.env.GEMINI_API_KEY,
+});
+
+console.log(result.answer);
+console.log(result.skills);
+console.log(result.verification);
+```
+
+## Variáveis de ambiente
+
+```bash
+cp .env.example .env
+```
+
+Adicione sua chave Gemini:
+
+```env
+GEMINI_API_KEY=seu_token_aqui
+XAI_API_KEY=
+```
+
+## Executar localmente
+
+```bash
+npm install
+npm run dev
+```
+
+## Foco do projeto
+
+O objetivo do Kairo SDK agora é evoluir para um agente completo com:
+
+- memória por usuário e sessão
+- múltiplas skills especializadas
+- módulo de RPG e histórias
+- painel de agentes e automações
+- API do Kairo Agent para web, apps e integrações
+
+## Segurança
+
+O projeto respeita políticas de idade e conteúdo sensível. Conteúdo adulto só é permitido com maioridade confirmada e sem violar regras de exploração, abuso, menores ou coerção.
