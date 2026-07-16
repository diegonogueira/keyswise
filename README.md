# Keyswise

App de treino de **voicings de acorde no piano** — irmão do [Fretwise](../fretwise) (que treina
notas no braço do violão). Começa com o módulo **Voicings**, com dois exercícios.

## Exercícios

1. **Teclas → Cifra** — um voicing (só a mão direita, podendo ser rootless/invertido) acende no
   teclado. Diz-se a fundamental (ex.: "acorde de C") e o usuário escolhe a cifra entre
   alternativas de mesma fundamental (C, Cm7, Cmaj9, C7(♭9)…).
2. **Cifra → Teclas** — mostra-se a cifra; o usuário escolhe, entre 4 teclados, o voicing
   correto (só 1 certo).

Nas configurações escolhe-se quais **acordes** (tríades, sétimas, estendidos, alterados…) e
**estilos de voicing** (básico/inversões, shell, rootless Bill Evans, quartal) praticar, além da
**fundamental** (C fixo ou aleatória anunciada).

## Stack

React 18 + TypeScript (strict) · Vite 8 · Tailwind v4 (`@theme`) · Zustand (persistido) ·
react-i18next (PT/EN) · smplr (áudio de piano) · Capacitor (Android — empacotamento futuro).

## Comandos

```bash
npm run dev      # servidor de desenvolvimento em http://localhost:5173
npm run build    # tsc --noEmit && vite build
npm test         # vitest (só a lógica pura do core)
```

O núcleo musical vive em `src/core/` e é puro (sem React) — MIDI é a língua franca; a validação
é sempre por **conjunto de pitch classes** (agnóstica a oitava/inversão). Ver `CLAUDE.md`.
