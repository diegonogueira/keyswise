// A família *wise, para a página "Outros apps": apps de estudo que funcionam do mesmo jeito.
// Igual em todos os apps (fonte: wisekit, `templates/identicos/src/lib/family.ts`, gerado do
// `apps.json`) — app novo entra aqui e aparece sozinho na página dos irmãos.
//
// Ainda **não há link**: nenhum deles está publicado. Quando houver, entra um campo `url` aqui e
// o cartão vira um `<a>`.

import fretwise from '../assets/family/fretwise.svg'
import keyswise from '../assets/family/keyswise.svg'
import mathwise from '../assets/family/mathwise.svg'
import sheetwise from '../assets/family/sheetwise.svg'

export interface FamilyApp {
  id: string
  name: string
  /** uma linha: o que o app treina. Fica aqui, e não na i18n, porque é igual em todos os apps. */
  tagline: { pt: string; en: string }
  logo: string
}

export const FAMILY: FamilyApp[] = [
  {
    id: 'fretwise',
    name: 'Fretwise',
    tagline: {
      pt: 'As notas no braço do violão e da guitarra: ler, achar, intervalos e acordes.',
      en: 'Notes on the guitar neck: reading, finding them, intervals and chords.',
    },
    logo: fretwise,
  },
  {
    id: 'sheetwise',
    name: 'Sheetwise',
    tagline: {
      pt: 'Leitura de partitura: notas, intervalos, armaduras e leitura à primeira vista.',
      en: 'Staff reading: notes, intervals, key signatures and sight-reading.',
    },
    logo: sheetwise,
  },
  {
    id: 'keyswise',
    name: 'Keyswise',
    tagline: {
      pt: 'Voicings de acorde no piano: da tríade ao cifrado de jazz, com dicionário.',
      en: 'Piano chord voicings: from triads to jazz symbols, with a dictionary.',
    },
    logo: keyswise,
  },
  {
    id: 'mathwise',
    name: 'Mathwise',
    tagline: {
      pt: 'Cálculo mental com uma lâmpada que mostra como decompor cada conta.',
      en: 'Mental math with a lightbulb that shows how to break each calculation down.',
    },
    logo: mathwise,
  },
]

/** Os irmãos do app atual, na ordem do catálogo. */
export function otherApps(current: string): FamilyApp[] {
  return FAMILY.filter((a) => a.id !== current)
}
