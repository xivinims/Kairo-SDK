# Kairo GameHub / SDK

O Kairo-SDK agora também funciona como uma base para **jogos originais em português brasileiro** e para **localização de jogos autorizados para PT-BR**.

## O que entrou

- Catálogo de jogos com categorias e classe de tamanho (leve, médio, pesado).
- Jogos originais jogáveis no navegador:
  - **Corações em Órbita** — visual novel de romance e escolhas.
  - **Neon Runner BR** — arcade.
  - **A Cidade Sem Nome** — narrativa/puzzle.
- Laboratório de localização para JSON:
  - extrai strings profundamente;
  - trabalha por blocos para projetos grandes;
  - detecta tokens/variáveis que não podem sumir;
  - exporta pacotes `.kairo-loc.json`;
  - inclui glossário e status de revisão.
- Interface PT-BR first.
- Mantém a base Vite + React + TypeScript + Tauri para versão desktop.

## Regra de conteúdo

A ferramenta pode localizar material **próprio, open source ou autorizado pelo detentor dos direitos**. Ela não inclui jogos comerciais, textos de jogos de terceiros nem mecanismos para redistribuir conteúdo protegido.

## Desenvolvimento

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

Desktop:

```bash
npm run desktop:dev
npm run desktop:build
```

## Backup

Antes da transformação foi criada a branch:

`backup/kairo-agent-before-gamehub-2026-10-25`
