# Kairo Clone

Clone da interface do Claude (iOS) com chat real, perfil, instruções de sistema, RPG de história, fundo de foto e chaves de API.

## O que tem

- Tela inicial, menu lateral (☰) e configurações (MS)
- Barra escura de resposta com o chip do personagem
- **Perfil:** como a IA te chama, idade, gênero e descrição/força
- **Instruções:** prompt de sistema + botão **História** para RPG
- **História:** a IA segue o enredo; se o perfil for fraco, o personagem forte ganha
- **API:** Grok, ChatGPT, Gemini, Groq, Claude e OpenRouter
- Groq tem **Usar modelos free** (free tier)
- **Fundo do chat:** foto da galeria no lugar do tema liso

## Como usar

1. Menu (três tracinhos) abre a barra do canto.
2. **MS** abre as Configurações.
3. Configurações → **Perfil:** nome, idade, gênero e descrição/força.
4. Configurações → **Instruções:** prompt de sistema da IA. No final tem o botão **História**.
5. Configurações → **API:** cole a chave (Grok, ChatGPT, Gemini, Groq…). Em Groq existe “Usar modelos free”. Toque em **Carregar modelos**.
6. Configurações → **Fundo do chat:** escolha uma foto da galeria.

A IA trata a descrição do perfil como verdade. Se você for fraco e tentar derrubar o personagem mais forte da história, ele luta e ganha.

## Rodar localmente

```bash
npm install
npm run dev
```

A chave de API fica só neste dispositivo (localStorage). Não commite chaves no Git.

Opcional: `XAI_API_KEY` no ambiente para o provedor Grok funcionar sem colar a chave.
