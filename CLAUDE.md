# Keyswise — guia para o Claude

App de treino de **voicings de acorde no piano**, irmão do Fretwise (`../fretwise`). Mesma
arquitetura; a diferença é o domínio (voicings, teclado) e dois exercícios.

## Stack e comandos

React 18 + TypeScript (strict) · Vite 8 · Tailwind v4 (`@tailwindcss/vite`, sem config) ·
Zustand (persist/localStorage) · react-i18next (PT padrão + EN) · smplr (soundfont de piano) ·
Capacitor (Android planejado).

```bash
npm run dev            # http://localhost:5173
npm run build          # tsc --noEmit && vite build  (type-check faz parte do build)
npm test               # vitest run  (só o core puro)
npx vitest run src/core/voicings.test.ts   # um arquivo
```

Sem ESLint e sem testes de UI: só `src/core/*.test.ts` (Vitest, `environment: 'node'`).

## Máxima da arquitetura

`src/core/` é a fonte única da verdade e é **puro** (sem React). Teclado, exercício e áudio
derivam a identidade das notas dele — é o que os mantém em acordo.

- **MIDI é a língua franca.** Uma nota é um inteiro MIDI (C4 = 60). `pitchClass = midi % 12`.
- **Validação por conjunto de pitch classes** (`pcSetKey`), agnóstica a oitava/inversão.

## O modelo de voicings (`src/core/voicings.ts`)

O ponto mais delicado. Uma **qualidade** (`ChordQuality`) carrega a identidade do cifrado e os
`intervals` = o pitch-class set **completo** do acorde (base da validação). Um **voicing**
(`Voicing`) é um shape concreto no teclado (`degrees` = semitons a partir da fundamental, em
ordem de execução; **rootless omite o 0**; inversões sobem notas graves uma oitava).

⚠️ **INVARIANTE central:** o conjunto que o usuário casa vem dos `intervals` da QUALIDADE, nunca
dos `degrees` do shape (que podem omitir a fundamental — um voicing rootless ainda responde pelo
cifrado completo). Ou seja: **desenhe o teclado a partir de `degrees`; valide contra o pitch-class
set da qualidade.** Consequência prática: um voicing rootless com a 9ª pertence à qualidade de
9ª (ex.: `maj9`), não à de 7ª. O teste `voicings.test.ts` garante que os pitch classes de todo
shape ⊆ os da sua qualidade — se você adicionar um voicing e ele quebrar isso, o shape está
atribuído à qualidade errada.

Categorias (`CHORD_CATEGORIES`) particionam as qualidades (toggle na config). Estilos
(`VOICING_STYLES`: basic/shell/rootless/quartal) são preferência: `voicingsFor` cai em todos os
voicings da qualidade se o estilo marcado não existir — a geração nunca fica sem voicing.

A cifra é construída em `src/core/symbol.ts` (estilo jazz internacional: `Cmaj7`, `C7(9,13)`,
`C7(♭9)`, `Cm7♭5`, `C°7`, `C6/9`, `C7alt`). Toda a grafia da casa mora lá.

## O teclado (`src/core/piano.ts` + `src/components/Piano/`)

Uma "posição" é só um número MIDI (sem corda/casa). `keyCenterX` é a fonte **única** da
matemática de x: tanto o render do SVG quanto o auto-scroll a chamam, então nunca discordam
(lição do `fretCenterX` do fretwise). As pretas sentam na fronteira entre as brancas vizinhas.

`Piano.tsx` é o teclado principal (tamanho natural, `overflow-x-auto`, auto-scroll via
`focusMidis` p/ centralizar o destaque; variantes de pino accent/selected/correct/wrong/ghost —
mesmos tokens do fretwise). `KeyboardChoice.tsx` é o teclado pequeno das alternativas do modo 2
(escala p/ caber no tile, `width=100%`). `windowFor` enquadra um voicing em ~2 oitavas em C.

## Exercício (`src/core/exercise.ts` + `src/hooks/useExercise.ts`)

Dois modos (`EXERCISE_MODES`):
- **keysToSymbol** (Teclas → Cifra): mostra o voicing; alternativas são cifras de **mesma
  fundamental**, pitch sets distintos. `checkSymbolAnswer` compara o pc-set completo da qualidade.
- **symbolToKeys** (Cifra → Teclas): mostra a cifra; 4 teclados (voicings de outras qualidades na
  mesma fundamental, conjuntos distintos). `checkKeysChoiceAnswer` compara o pc-set do teclado
  escolhido com o do voicing correto (`question.voicing`), que pode ser rootless.

`VoicingConfig.fixedRootPc`: 0 (C fixo) ou `null` (aleatória anunciada). Geração recebe `rng`
(produção usa `Math.random`; testes usam `mulberry32` semeado — `src/core/rng.ts`).

O `useExercise` espelha o fretwise: estado de sessão + regeneração ao trocar modo/config (guardada
por um ref de primeira montagem).

⚠️ **Gotcha da troca de modo (tela branca):** na navegação, o `mode` muda um render antes de o
`question` regenerar — então, por um frame, o painel do novo modo veria a questão do modo anterior
(sem `keyChoices`/`symbolChoices`) e quebraria. Duas defesas, ambas necessárias: (1) a regeneração
roda em **`useLayoutEffect`** (antes do paint, sem frame em branco); (2) cada corpo do
`ExercisePanel` tem um **guard** (`if (!question.keyChoices) return null`) que cobre o render
anterior ao efeito. Não troque o `useLayoutEffect` por `useEffect` (voltaria a piscar) nem remova
os guards.

## Verificação de UI

Sem testes de componente. Suba `npm run dev` e dirija o Chromium do sistema com `playwright-core`
(`import pw from '.../playwright-core'; const { chromium } = pw`; `executablePath: '/usr/bin/chromium'`).
Ganchos: o teclado tem `aria-label="Teclado de piano"` e as teclas a classe `.key-cell`.

## Decisões de produto (v1)

- Modo 2: múltipla escolha de teclados (não montar-clicando).
- Fundamental: configurável, padrão C fixo.
- Entrega web-first + áudio de piano; `android/` (`cap add android`) fica para depois.
- Sem pauta/VexFlow: o alvo é a cifra impressa + o teclado.
