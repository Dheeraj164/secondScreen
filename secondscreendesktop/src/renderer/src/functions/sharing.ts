/* eslint-disable @typescript-eslint/no-explicit-any */
import { statusType } from '@/components/Home'
import { supabase } from '@/lib/supabase'
import { Dispatch, RefObject, SetStateAction } from 'react'

let peerConnection: RTCPeerConnection | null = null

interface StartSharingProps {
  setSessionCode: Dispatch<SetStateAction<string | null>>
  setStatus: Dispatch<SetStateAction<statusType>>
  source: string
  videoRef: RefObject<HTMLVideoElement | null>
  userId: string
}

interface StopSharingProps {
  setSessionCode: Dispatch<SetStateAction<string | null>>
  setStatus: Dispatch<SetStateAction<statusType>>
  videoRef: RefObject<HTMLVideoElement | null>
}

type CandidateQueue = RTCIceCandidate[]

/* ---------------------------------------------------- */
/* START SHARING */
/* ---------------------------------------------------- */

export async function startSharing({
  setSessionCode,
  setStatus,
  source,
  videoRef,
  userId
}: StartSharingProps): Promise<void> {
  try {
    const code = generateSessionCode()

    setSessionCode(code)
    setStatus('Waiting')

    const stream = await getScreenStream(source)
    if (videoRef.current) videoRef.current.srcObject = stream

    await startWebRTCSharing(stream, code, userId)
  } catch (err) {
    console.error('startSharing error:', err)
  }
}

/* ---------------------------------------------------- */
/* WEBRTC SHARING */
/* ---------------------------------------------------- */

export async function startWebRTCSharing(
  stream: MediaStream,
  offerCode: string,
  userId: string
): Promise<void> {
  try {
    peerConnection = new RTCPeerConnection()

    const pendingCandidates: CandidateQueue = []
    let offerInserted = false

    /* Add tracks */
    stream.getTracks().forEach((track) => {
      peerConnection!.addTrack(track, stream)
    })

    /* ICE Candidates */
    peerConnection.onicecandidate = async (event) => {
      if (!event.candidate) return

      if (!offerInserted) {
        pendingCandidates.push(event.candidate)
        return
      }

      await insertCandidate(event.candidate, offerCode, 'desktop')
    }

    /* Create Offer */
    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    /* Insert Offer */
    const { error } = await supabase.from('sessions').insert({
      session_code: offerCode,
      host_id: userId,
      offer: offer
    })

    if (error) console.log(error)

    offerInserted = true

    /* Flush queued ICE candidates */
    if (pendingCandidates.length) {
      await Promise.all(pendingCandidates.map((c) => insertCandidate(c, offerCode, 'desktop')))
    }

    listenForMobileCandidates(offerCode)
    listenForAnswer(offerCode)
  } catch (error) {
    console.error('startWebRTCSharing error:', error)
  }
}

/* ---------------------------------------------------- */
/* LISTEN FOR MOBILE ICE */
/* ---------------------------------------------------- */
async function listenForMobileCandidates(offerCode: string): Promise<void> {
  supabase
    .channel('mobile-candidates-' + offerCode)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'candidates',
        filter: `offerCode=eq.${offerCode}`
      },
      (payload) => {
        const row = payload.new as any

        if (row.direction !== 'mobileToDesktop') return

        const ice = new RTCIceCandidate(row.candidate)

        console.log('New mobile ICE candidate received')

        peerConnection?.addIceCandidate(ice)
      }
    )
    .subscribe()
}

async function listenForAnswer(offerCode: string): Promise<void> {
  supabase
    .channel('answer-' + offerCode)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'signallings',
        filter: `offerCode=eq.${offerCode}`
      },
      async (payload) => {
        const row = payload.new as any

        if (!row.answer) return

        console.log('Answer received')

        const answer = new RTCSessionDescription(row.answer)

        await peerConnection?.setRemoteDescription(answer)
      }
    )
    .subscribe()
}

/* ---------------------------------------------------- */
/* INSERT ICE */
/* ---------------------------------------------------- */

async function insertCandidate(
  candidate: RTCIceCandidate,
  offerCode: string,
  direction: string
): Promise<void> {
  const { error } = await supabase.from('candidates').insert([
    {
      offerCode,
      candidate: candidate.toJSON(),
      direction
    }
  ])

  if (error) console.error('ICE insert error:', error)
}

/* ---------------------------------------------------- */
/* STOP SHARING */
/* ---------------------------------------------------- */

export function stopSharing({ setSessionCode, setStatus, videoRef }: StopSharingProps): void {
  setSessionCode(null)
  setStatus('Idle')

  if (videoRef.current?.srcObject) {
    const stream = videoRef.current.srcObject as MediaStream
    stream.getTracks().forEach((track) => track.stop())
    videoRef.current.srcObject = null
  }

  peerConnection?.close()
  peerConnection = null

  console.log('Session stopped')
}

/* ---------------------------------------------------- */
/* SCREEN CAPTURE */
/* ---------------------------------------------------- */

export async function getScreenStream(source: string): Promise<MediaStream> {
  try {
    const stream = await (navigator.mediaDevices as any).getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: source,
          maxWidth: 1920,
          maxHeight: 1080,
          maxFrameRate: 60
        }
      }
    })

    return stream
  } catch (error) {
    console.error('Screen capture error:', error)
    throw new Error('Selected source unavailable')
  }
}

/* ---------------------------------------------------- */
/* UTIL */
/* ---------------------------------------------------- */

function generateSessionCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
