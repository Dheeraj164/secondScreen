import { desktopCapturer } from 'electron'
export async function getSource(event: Electron.IpcMainEvent): Promise<void> {
  const sources = await desktopCapturer.getSources({ types: ['screen'] })
  if (sources.length > 0) {
    event.reply('sendWindowSources', sources)
  }
}
