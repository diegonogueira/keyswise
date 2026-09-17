// Áudio via smplr (soundfont de piano), carregado dos arquivos que vão dentro do app
// (`public/samples/`, baixados por `npm run samples`), nunca de um CDN: o Android precisa tocar
// sem internet. Carregamento sob demanda e tolerante a falhas: sem os samples, o app segue
// funcionando em silêncio.

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

/** O arquivo local do piano: ogg em todo lugar, mp3 no Safari. */
function sampleUrl(): string {
  const ogg = typeof Audio !== 'undefined' && !!new Audio().canPlayType('audio/ogg; codecs="vorbis"')
  return `${import.meta.env.BASE_URL}samples/sf/MusyngKite/${INSTRUMENT_NAME}-${ogg ? 'ogg' : 'mp3'}.js`
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
  const inst = new Soundfont(context, { instrumentUrl: sampleUrl() })
  loadingPromise = inst.load
    .then(() => {
      loaded = inst
    })
    .catch(() => {
      // sem os samples: segue sem áudio, e a próxima tentativa carrega de novo
      loadingPromise = null
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
