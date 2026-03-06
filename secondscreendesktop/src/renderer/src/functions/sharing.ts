import { statusType } from '@/components/Home'
import { Dispatch, RefObject, SetStateAction } from 'react'

interface startSharingProps {
  setSessionCode: Dispatch<SetStateAction<string | null>>
  setStatus: Dispatch<SetStateAction<statusType>>
  videoRef: RefObject<HTMLVideoElement | null>
  source: string
}
interface stopSharingProps {
  setSessionCode: Dispatch<SetStateAction<string | null>>
  setStatus: Dispatch<SetStateAction<statusType>>
  videoRef: RefObject<HTMLVideoElement | null>
}

export async function startSharing({
  setSessionCode,
  setStatus,
  videoRef,
  source
}: startSharingProps): Promise<void> {
  console.log('calling start share')
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  setSessionCode(code)
  setStatus('Waiting')
  const stream = await getScreenStream(source)
  if (stream && videoRef.current) {
    videoRef.current.srcObject = stream
    videoRef.current?.play()
  }
}

export function stopSharing({ setSessionCode, setStatus, videoRef }: stopSharingProps): void {
  setSessionCode(null)
  setStatus('Idle')
  if (videoRef.current) {
    videoRef.current.srcObject = null
  }

  console.log('Session stopped')
}

export async function getScreenStream(source: string): Promise<MediaStream> {
  try {
    const stream = await (navigator.mediaDevices as any).getUserMedia({
      audio: false,
      video: {
        // Cast to any to include non-standard properties.
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: source,
          maxWidth: 1920,
          maxHeight: 1080,
          maxFrameRate: 60
        }
      }
    })
    console.log('stream ', stream)
    return stream
  } catch (error) {
    alert('Selected source is not available')
    console.error('Error capturing screen:', error)
    throw error
  }
}
