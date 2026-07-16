import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

// Fullscreen imersivo só na PAISAGEM (celular deitado — a orientação-alvo): esconde a status
// bar nativa (bateria/relógio) p/ o app usar a tela toda. No RETRATO mostra a barra e empurra
// o conteúdo p/ baixo dela (overlay: false), sem sobrepor — assim o retrato nunca fica "full
// screen". No-op na web/preview (não é plataforma nativa).
export async function syncStatusBar(landscape: boolean): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    if (landscape) {
      await StatusBar.hide()
    } else {
      await StatusBar.show()
      await StatusBar.setOverlaysWebView({ overlay: false })
      await StatusBar.setStyle({ style: Style.Light }) // ícones escuros p/ o tema claro
      await StatusBar.setBackgroundColor({ color: '#fafaf9' }) // --color-bg
    }
  } catch {
    // plugin ausente/sem suporte na plataforma: ignora
  }
}
