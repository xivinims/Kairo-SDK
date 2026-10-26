# Kairo Localization Coverage

O objetivo deste relatório é impedir o clássico “99% traduzido” que na prática ainda esconde centenas de falas.

## Eixos de cobertura

Cada unidade pode ser agrupada por:

- personagem;
- cena;
- quest;
- capítulo;
- arquivo;
- DLC;
- localização/mapa;
- tipo de conteúdo (UI, diálogo, legenda, tutorial, item, codex).

Para cada grupo o Kairo acompanha:

- total de unidades;
- traduzidas;
- revisadas;
- dubladas;
- percentual de tradução;
- percentual de revisão;
- percentual de voz.

## Regra de release

Um pacote de produção não deve ser marcado como completo apenas porque a tradução textual atingiu 100%.

Para “completo”:

1. 100% das unidades previstas precisam estar presentes no manifesto.
2. 100% das strings publicadas precisam ter tradução válida.
3. 100% das falas marcadas como dubladas precisam apontar para áudio existente.
4. QA de placeholders e estrutura precisa estar sem erros bloqueantes.
5. Cobertura deve ser comparada contra o inventário extraído da versão do jogo usada na build.

## Atualizações do jogo

Cada extração deve salvar uma impressão do inventário. Em uma atualização futura, compare:

- IDs novos;
- IDs removidos;
- texto fonte alterado;
- cenas novas;
- duração de áudio alterada;
- arquivos renomeados.

Isso permite atualizar um mod PT-BR sem retraduzir tudo.
