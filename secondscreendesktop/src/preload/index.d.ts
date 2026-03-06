import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getSources: () => void
      onSources: (callback: (sources: Electron.DesktopCapturerSource[]) => void) => void
    }
  }
}
