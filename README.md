# Kairo Desktop

O Kairo agora possui uma base de aplicativo desktop multiplataforma usando Tauri 2, mantendo a interface React/TypeScript e o visual workspace escuro/liquid glass.

## Rodar como aplicativo desktop

Pré-requisitos:

- Node.js 20+
- Rust toolchain
- dependências de desenvolvimento do Tauri para seu sistema

```bash
npm install
npm run desktop:dev
```

Gerar instaladores:

```bash
npm run desktop:build
```

O build do Tauri gera os formatos suportados pelo sistema de compilação, incluindo instalador Windows quando executado no Windows e pacotes Linux quando executado no Linux.

## Segurança do agente

O Kairo Desktop não deve receber acesso total silencioso. A versão desktop deve evoluir com:

- pastas autorizadas pelo usuário;
- confirmação antes de executar comandos;
- allowlist de executáveis;
- auditoria de operações;
- revogação de permissões;
- confirmação antes de enviar arquivos à API Gemini.

A ponte nativa inicial oferece leitura/escrita e execução allowlisted como base de desenvolvimento. Antes de distribuir publicamente, conecte todas as chamadas a uma tela de permissão e registre cada operação.

## Visual

A interface foi ajustada para um workspace escuro inspirado nas referências:

- barra de título compacta;
- rail lateral de workspaces;
- área central de chat e artefatos;
- painel direito de tarefas;
- cards translúcidos e bordas sutis;
- preview de sites em sandbox.
