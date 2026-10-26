# Localização AAA no Kairo

O Kairo não redistribui arquivos dos jogos. Ele trabalha com uma instalação local legalmente obtida e exporta apenas o mod/localização criada pelo usuário.

## The Witcher 3 / REDkit

Fluxo suportado:

1. No REDkit, use o **Localized Strings Editor**.
2. Exporte as strings modificadas para CSV.
3. Importe o CSV no Kairo.
4. Traduza em lotes e rode o QA.
5. Exporte o CSV localizado.
6. Reimporte no REDkit.
7. Para voz, use o Scene Editor + fluxo oficial de VO/lipsync do REDkit.

O Kairo preserva colunas e só substitui a coluna de texto detectada.

## Projetos grandes

Use lotes de 100 a 200 strings. O Kairo mantém id/contexto por linha para permitir revisão posterior.

O CLI também consegue dividir um pacote de localização do Kairo:

```bash
npm run localize:inspect -- caminho/arquivo.csv
npm run localize:batch -- caminho/projeto.kairo-loc.json 120
```

## QA mínimo

Antes de importar de volta ao jogo:

- nenhuma string pendente na parte que será publicada;
- placeholders preservados;
- tags e códigos preservados;
- aspas e quebras de linha válidas;
- revisão de nomes próprios e termos de lore;
- voz final produzida por vozes próprias/licenciadas ou TTS permitido pelo detentor dos direitos.

## Dublagem

O Kairo usa um manifesto de fala por cena/personagem. Áudio original do jogo não é enviado para o GitHub. Para The Witcher 3, a integração final deve ser feita dentro do REDkit/Wwise usando a instalação local.
