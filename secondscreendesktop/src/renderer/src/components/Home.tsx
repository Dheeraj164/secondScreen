import { startSharing, stopSharing } from '@/functions/sharing'
import { ReactNode, useContext, useEffect, useRef, useState } from 'react'
import NavBar from './ui/NavBar'
import { AppContext } from '@/lib/contextTypes'

export type statusType = 'Idle' | 'Connected' | 'Waiting'
export default function Home(): ReactNode {
  const [sessionCode, setSessionCode] = useState<string | null>(null)
  const { session } = useContext(AppContext)
  const [status, setStatus] = useState<statusType>('Idle')
  const [sources, setSources] = useState<Electron.DesktopCapturerSource[]>([])
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    window.api.getSources()
    window.api.onSources((src) => setSources(src))
  }, [])

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <NavBar status={status} />
      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center">
        <div className="w-105 bg-gray-900 border border-gray-800 rounded-xl p-8 flex flex-col items-center gap-6">
          <h2 className="text-lg font-semibold">Share Your Screen</h2>

          <p className="text-sm text-gray-400 text-center">
            Start a session to share your screen with another device.
          </p>

          {!sessionCode && (
            <button
              onClick={() => {
                startSharing({
                  setSessionCode: setSessionCode,
                  setStatus: setStatus,
                  source: sources[0].id,
                  videoRef: videoRef,
                  userId: session!.user.id
                })
              }}
              className="bg-blue-600 hover:bg-blue-500 transition px-6 py-2 rounded-lg"
            >
              Start Sharing
            </button>
          )}

          {sessionCode && (
            <>
              <div className="bg-gray-800 px-6 py-4 rounded-lg text-center w-full">
                <p className="text-sm text-gray-400">Session Code</p>
                <p className="text-2xl font-bold tracking-widest mt-1">{sessionCode}</p>
              </div>

              <button
                onClick={() =>
                  stopSharing({
                    session_code: sessionCode,
                    setSessionCode: setSessionCode,
                    setStatus: setStatus,
                    videoRef: videoRef
                  })
                }
                className="bg-red-600 hover:bg-red-500 transition px-6 py-2 rounded-lg"
              >
                Stop Sharing
              </button>
            </>
          )}
        </div>
      </div>
      {/* <video ref={videoRef} /> */}
      {/* Devices Section */}
      <div className="border-t border-gray-800 px-8 py-4">
        <h3 className="text-sm text-gray-400 mb-2">Connected Devices</h3>

        <div className="flex gap-4 text-sm">
          <div className="bg-gray-900 px-4 py-2 rounded border border-gray-800">
            No devices connected
          </div>
        </div>
      </div>
    </div>
  )
}
