# CLAUDE.md

Keyswise é um app web-first (React + Vite) de treino de **voicings de acorde no piano**: dois
exercícios (Teclas → Cifra e Cifra → Teclas) e um dicionário de referência. Veja o `README.md`
para o produto. As regras da família *wise (identidade, casca, modal de ajustes, estado, i18n,
stack, Android, infra e fluxo de tickets) vêm do plugin `wise` (repo **wisekit**) e **não se
repetem aqui** — este arquivo guarda só o que é do keyswise.

## Comandos

```bash
npm run samples      # baixa os samples do piano para public/samples (já versionados)

npx vitest run src/core/voicings.test.ts   # um arquivo
npx vitest run -t "rootless"                # um teste pelo nome

JAVA_HOME=/usr/lib/jvm/java-21-openjdk npm run android:apk
node scripts/shot.mjs [url]   # fotos + erros de console num Chromium de verdade (dev rodando)
```

`npm test` cobre o núcleo: voicings, cifras, teclado, geração das questões e o dicionário.

## Invariantes

- **Desenhe a partir dos `degrees`; valide contra o pitch-class set da QUALIDADE.** O conjunto que
  o usuário casa vem dos `intervals` da `ChordQuality`, nunca dos `degrees` do shape (que podem
  omitir a fundamental: um rootless responde pelo cifrado completo). `voicings.test.ts` cobra que
  os pitch classes de todo shape ⊆ os da sua qualidade — quebrou, o shape está na qualidade errada.
- **MIDI é a língua franca.** Uma nota é um inteiro MIDI (C4 = 60), `pitchClass = midi % 12`, e a
  validação é por conjunto de pitch classes (`pcSetKey`), agnóstica a oitava e inversão.
- **`keyCenterX` é a fonte única da matemática de x** do teclado: o render do SVG e o auto-scroll
  a chamam, então nunca discordam.
- **Exercício e dicionário realizam o voicing do mesmo jeito** (`realizeVoicing` + `alignLowest` na
  `VOICING_ANCHOR`): um shape no dicionário e o mesmo shape numa questão caem no mesmo registro.
- **A geração nunca fica sem voicing**: `voicingsFor` cai em todos os voicings da qualidade se o
  estilo marcado não existir para ela.

## Arquitetura

`src/core/` é puro e é a fonte única da verdade: teclado, exercício, dicionário e áudio derivam a
identidade das notas dele.

### O modelo de voicings (`src/core/voicings.ts`)

Uma **qualidade** (`ChordQuality`) carrega a identidade do cifrado e os `intervals` = o
pitch-class set **completo** do acorde (base da validação). Um **voicing** (`Voicing`) é um shape
concreto no teclado: `degrees` = semitons a partir da fundamental, em ordem de execução;
**rootless omite o 0**; inversões sobem notas graves uma oitava. Consequência do invariante: um
voicing rootless com a 9ª pertence à qualidade de 9ª (ex.: `maj9`), não à de 7ª.

Categorias (`CHORD_CATEGORIES`) particionam as qualidades (escolhidas no modal). Estilos
(`VOICING_STYLES`: basic/shell/rootless/quartal) são preferência.

A cifra é construída em `src/core/symbol.ts`, no estilo jazz internacional (`Cmaj7`, `C7(9,13)`,
`C7(♭9)`, `Cm7♭5`, `C°7`, `C6/9`, `C7alt`). Toda a grafia da casa mora lá.

### O teclado (`src/core/piano.ts` + `src/components/Piano/`)

Uma "posição" é só um número MIDI (sem corda nem casa). As pretas sentam na fronteira entre as
brancas vizinhas. `Piano.tsx` é o teclado principal: tamanho natural, `overflow-x-auto`,
auto-scroll por `focusMidis` para centralizar o destaque, variantes de pino
accent/selected/correct/wrong/ghost. `KeyboardChoice.tsx` é o teclado pequeno das alternativas e
do dicionário (escala para caber no cartão, `width=100%`). `windowFor` enquadra um voicing em ~2
oitavas começando em C.

### Exercício (`src/core/exercise.ts` + `src/hooks/useExercise.ts`)

Dois modos (`EXERCISE_MODES`):
- **keysToSymbol** (Teclas → Cifra): mostra o voicing; as alternativas são cifras de **mesma
  fundamental**, com pitch sets distintos. `checkSymbolAnswer` compara o pc-set completo da
  qualidade.
- **symbolToKeys** (Cifra → Teclas): mostra a cifra; 4 teclados (voicings de outras qualidades na
  mesma fundamental, conjuntos distintos). `checkKeysChoiceAnswer` compara o pc-set do teclado
  escolhido com o do voicing correto (`question.voicing`), que pode ser rootless.

`VoicingConfig.fixedRootPc`: 0 (C fixo) ou `null` (aleatória, anunciada na questão). A geração
recebe `rng` (produção usa `Math.random`; os testes, `mulberry32` semeado — `src/core/rng.ts`).
`ExerciseView` é o conteúdo dos modos de exercício (teclado principal + painel): mora num
componente próprio para o `useExercise` só montar nos exercícios, nunca no dicionário.

**Gotcha da troca de modo (tela branca):** na navegação o `mode` muda um render antes de o
`question` regenerar, então por um quadro o painel do novo modo veria a questão do anterior (sem
`keyChoices`/`symbolChoices`). Hoje há duas defesas: a regeneração roda em `useLayoutEffect` e cada
corpo do `ExercisePanel` tem um guard (`if (!question.keyChoices) return null`).

### Dicionário (`src/core/dictionary.ts` + `src/components/Dictionary.tsx`)

Página de referência (`/dictionary`): todas as qualidades, agrupadas por categoria, com **todas**
as variações catalogadas (sem filtro de estilo), realizadas num dos 12 tons. `describeVoicing`
classifica cada shape pelo id — `-inv{n}` é fundamental (n = 0) ou n-ésima inversão, `-close` é
estado fundamental, o resto é o estilo com a letra da variante (A/B…). Todas as variações de uma
qualidade dividem a mesma janela do teclado, para os registros serem comparáveis. Tocar num cartão
toca o shape. No dicionário o modal mostra só o áudio: as outras opções configuram o treino.

### Áudio (`src/audio/player.ts`)

O piano é o soundfont MusyngKite (via smplr), carregado de **arquivos locais** em
`public/samples/` — versionados, ~4,5 MB, baixados por `npm run samples` —, nunca de CDN: o
Android toca sem internet e o build do Docker/Gradle não depende de rede. O formato sai do
navegador (ogg; mp3 no Safari). O `AudioContext` só soa depois de um gesto, então o som parte dos
cliques (responder, tocar um cartão do dicionário); se o carregamento falhar, o app segue mudo e
tenta de novo no próximo toque.

### Decisões de produto (v1)

- Cifra → Teclas é múltipla escolha de teclados (não montar clicando).
- A fundamental é configurável, com padrão C fixo.
- Sem pauta nem VexFlow: o alvo é a cifra impressa e o teclado.

## Desvios do guia

Nenhum.

## Verificando UI

Não há teste de componente: `node scripts/shot.mjs [url]` (padrão
`http://localhost:5173/keys-to-chord`) fotografa retrato, paisagem e desktop no Chromium do
sistema, responde a primeira alternativa e falha com erro no console. Serve também para
`/chord-to-keys` e `/dictionary`. Seletores estáveis: `svg[aria-label="Teclado de piano"]` (o
teclado), `.key-cell` (as teclas clicáveis) e `[data-choice]` (as alternativas).
