// Áudio via smplr (soundfont de piano). Carregamento sob demanda e tolerante a falhas:
// se a rede falhar (offline), o app segue funcionando sem som.

import { Soundfont } from 'smplr'

const INSTRUMENT_NAME = 'acoustic_grand_piano'

let ctx: AudioContext | null = null
let loaded: Soundfont | null = null
let loadingPromise: Promise<void> | null = null

function getContext(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Deve ser chamado a partir de um gesto do usuário (clique) para destravar o áudio. */
export function unlockAudio(): void {
  try {
    getContext()
  } catch {
    /* navegador sem Web Audio: ignora */
  }
}

export function loadInstrument(): Promise<void> {
  if (loaded) return Promise.resolve()
  if (loadingPromise) return loadingPromise

  const context = getContext()
  const inst = new Soundfont(context, { instrument: INSTRUMENT_NAME })
  loadingPromise = inst.load
    .then(() => {
      loaded = inst
    })
    .catch(() => {
      /* falha de rede: segue sem áudio */
    })
  return loadingPromise
}

/** Toca uma ou mais notas (MIDI) juntas — um voicing soa como acorde. */
export async function playMidi(midi: number | number[]): Promise<void> {
  try {
    getContext()
    if (!loaded) await loadInstrument()
    for (const m of Array.isArray(midi) ? midi : [midi]) {
      loaded?.start({ note: m, duration: 2 })
    }
  } catch {
    /* silencioso */
  }
}
