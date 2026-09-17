# Keyswise

App de treino de **voicings de acorde no piano**: o voicing acende no teclado e você diz a cifra,
ou a cifra aparece e você escolhe o teclado certo — com tríades, sétimas, estendidos e alterados,
em shells, rootless e quartais. Web (React + Vite) e Android (Capacitor), com o som do piano
embutido — **funciona offline**.

Irmão do [fretwise](../fretwise), [sheetwise](../sheetwise), [sightwise](../sightwise) e
[mathwise](../mathwise): mesmo chassi, mesmas convenções
([wisekit](https://github.com/diegonogueira/wisekit)).

## O que ele faz

- **Teclas → Cifra** — um voicing (só a mão direita, podendo ser rootless ou invertido) acende no
  teclado. A fundamental é dita ("acorde de C") e você escolhe a cifra entre alternativas de mesma
  fundamental (C, Cm7, Cmaj9, C7(♭9)…).
- **Cifra → Teclas** — aparece a cifra; você escolhe, entre 4 teclados, o voicing correto.
- **Dicionário** — todas as qualidades por categoria, com as variações (estado fundamental,
  inversões, shell, rootless, quartal) em qualquer um dos 12 tons. Toque num cartão para ouvir.
- Nas configurações escolhe-se quais **acordes** (tríades, suspensos, sextas, sétimas, estendidos,
  alterados) e **estilos de voicing** praticar, a **fundamental** (C fixo ou aleatória anunciada),
  o nome das notas sobre as teclas e o som.
- Português e inglês.

## Rodando

```bash
npm install
npm run samples      # baixa o piano (~4,5 MB) para public/samples — já versionado
npm run dev          # http://localhost:5173
npm run build        # tsc --noEmit && vite build
npm test             # vitest: voicings, cifras, teclado, exercício, dicionário
node scripts/shot.mjs  # confere a UI num Chromium de verdade (precisa do dev rodando)
```

Android (precisa do **JDK 21** — o Gradle 8.14 não aceita o JDK 26 padrão daqui):

```bash
JAVA_HOME=/usr/lib/jvm/java-21-openjdk npm run android:apk
npm run android:install
```

## Estrutura

```
src/core/            tudo o que é puro e testado (sem React)
  voicings.ts        qualidades, categorias, estilos e o catálogo de voicings
  symbol.ts          a grafia das cifras
  piano.ts           geometria do teclado (keyCenterX) e a janela de cada voicing
  exercise.ts        geração e checagem das questões dos dois modos
  dictionary.ts      as entradas do dicionário num tom
src/components/      a casca (TopBar, Sidebar, Settings), Piano/, o painel do exercício e o Dicionário
src/audio/           o piano (smplr), dos samples locais
android/             o app Android (Capacitor), que empacota o dist/
```

O chassi comum (casca, modal, i18n, Android, deploy) segue o wisekit.

## O que ainda não tem

- Montar o voicing clicando nas teclas (Cifra → Teclas é múltipla escolha).
- Mão esquerda e voicings a duas mãos.
- Escalas (issue #1).
