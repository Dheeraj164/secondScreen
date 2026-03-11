/* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { statusType } from '@/components/Home'
// import { supabase } from '@/lib/supabase'
// import { Dispatch, RefObject, SetStateAction } from 'react'

// let peerConnection: RTCPeerConnection | null = null

// interface StartSharingProps {
//   setSessionCode: Dispatch<SetStateAction<string | null>>
//   setStatus: Dispatch<SetStateAction<statusType>>
//   source: string
//   videoRef: RefObject<HTMLVideoElement | null>
//   userId: string
// }

// interface StopSharingProps {
//   session_code: string
//   setSessionCode: Dispatch<SetStateAction<string | null>>
//   setStatus: Dispatch<SetStateAction<statusType>>
//   videoRef: RefObject<HTMLVideoElement | null>
// }

// type CandidateQueue = RTCIceCandidate[]

// /* ---------------------------------------------------- */
// /* START SHARING */
// /* ---------------------------------------------------- */

// export async function startSharing({
//   setSessionCode,
//   setStatus,
//   source,
//   videoRef,
//   userId
// }: StartSharingProps): Promise<void> {
//   try {
//     const code = generateSessionCode()

//     setSessionCode(code)
//     setStatus('Waiting')

//     const stream = await getScreenStream(source)
//     if (videoRef.current) videoRef.current.srcObject = stream

//     await startWebRTCSharing(stream, code, userId)
//   } catch (err) {
//     console.error('startSharing error:', err)
//   }
// }

// /* ---------------------------------------------------- */
// /* WEBRTC SHARING */
// /* ---------------------------------------------------- */

// export async function startWebRTCSharing(
//   stream: MediaStream,
//   offerCode: string,
//   userId: string
// ): Promise<void> {
//   try {
//     peerConnection = new RTCPeerConnection()

//     const pendingCandidates: CandidateQueue = []
//     let offerInserted = false

//     /* Add tracks */
//     stream.getTracks().forEach((track) => {
//       peerConnection!.addTrack(track, stream)
//     })

//     /* ICE Candidates */
//     peerConnection.onicecandidate = async (event) => {
//       if (!event.candidate) return

//       if (!offerInserted) {
//         pendingCandidates.push(event.candidate)
//         return
//       }

//       await insertCandidate(event.candidate, offerCode, 'desktop')
//     }

//     /* Create Offer */
//     const offer = await peerConnection.createOffer()
//     await peerConnection.setLocalDescription(offer)

//     /* Insert Offer */
//     const { error } = await supabase.from('sessions').insert({
//       session_code: offerCode,
//       host_id: userId,
//       offer: offer
//     })

//     if (error) console.error('Error while inserting session', error)

//     offerInserted = true

//     /* Flush queued ICE candidates */
//     if (pendingCandidates.length) {
//       await Promise.all(pendingCandidates.map((c) => insertCandidate(c, offerCode, 'desktop')))
//     }

//     listenForMobileCandidates(offerCode)
//     listenForAnswer(offerCode)
//   } catch (error) {
//     console.error('startWebRTCSharing error:', error)
//   }
// }

// /* ---------------------------------------------------- */
// /* LISTEN FOR MOBILE ICE */
// /* ---------------------------------------------------- */
// async function listenForMobileCandidates(offerCode: string): Promise<void> {
//   supabase
//     .channel('mobile-candidates-' + offerCode)
//     .on(
//       'postgres_changes',
//       {
//         event: 'INSERT',
//         schema: 'public',
//         table: 'candidates',
//         filter: `offerCode=eq.${offerCode}`
//       },
//       (payload) => {
//         const row = payload.new as any

//         if (row.direction !== 'mobileToDesktop') return

//         const ice = new RTCIceCandidate(row.candidate)

//         console.log('New mobile ICE candidate received')

//         peerConnection?.addIceCandidate(ice)
//       }
//     )
//     .subscribe()
// }

// async function listenForAnswer(offerCode: string): Promise<void> {
//   supabase
//     .channel('answer-' + offerCode)
//     .on(
//       'postgres_changes',
//       {
//         event: 'UPDATE',
//         schema: 'public',
//         table: 'signallings',
//         filter: `offerCode=eq.${offerCode}`
//       },
//       async (payload) => {
//         const row = payload.new as any

//         if (!row.answer) return

//         console.log('Answer received')

//         const answer = new RTCSessionDescription(row.answer)

//         await peerConnection?.setRemoteDescription(answer)
//       }
//     )
//     .subscribe()
// }

// /* ---------------------------------------------------- */
// /* INSERT ICE */
// /* ---------------------------------------------------- */

// async function insertCandidate(
//   candidate: RTCIceCandidate,
//   offerCode: string,
//   direction: string
// ): Promise<void> {
//   const { error } = await supabase.from('candidates').insert({
//     session_code: offerCode,
//     candidate: candidate.toJSON(),
//     direction
//   })

//   if (error) console.error('ICE insert error:', error)
// }

// /* ---------------------------------------------------- */
// /* STOP SHARING */
// /* ---------------------------------------------------- */

// export async function stopSharing({
//   session_code,
//   setSessionCode,
//   setStatus,
//   videoRef
// }: StopSharingProps): Promise<void> {
//   setSessionCode(null)
//   setStatus('Idle')

//   if (videoRef.current?.srcObject) {
//     const stream = videoRef.current.srcObject as MediaStream
//     stream.getTracks().forEach((track) => track.stop())
//     videoRef.current.srcObject = null
//   }

//   peerConnection?.close()
//   peerConnection = null

//   const { error: candidatesDeleteError } = await supabase
//     .from('candidates')
//     .delete()
//     .eq('session_code', session_code)

//   if (candidatesDeleteError) console.error(candidatesDeleteError.message)

//   const { error: sessionDeleteError } = await supabase
//     .from('sessions')
//     .delete()
//     .eq('session_code', session_code)

//   if (sessionDeleteError) console.error(sessionDeleteError.message)

//   console.log('Session stopped')
// }

// /* ---------------------------------------------------- */
// /* SCREEN CAPTURE */
// /* ---------------------------------------------------- */

// export async function getScreenStream(source: string): Promise<MediaStream> {
//   try {
//     const stream = await (navigator.mediaDevices as any).getUserMedia({
//       audio: false,
//       video: {
//         mandatory: {
//           chromeMediaSource: 'desktop',
//           chromeMediaSourceId: source,
//           maxWidth: 1920,
//           maxHeight: 1080,
//           maxFrameRate: 60
//         }
//       }
//     })

//     return stream
//   } catch (error) {
//     console.error('Screen capture error:', error)
//     throw new Error('Selected source unavailable')
//   }
// }

// /* ---------------------------------------------------- */
// /* UTIL */
// /* ---------------------------------------------------- */

// function generateSessionCode(): string {
//   return Math.floor(100000 + Math.random() * 900000).toString()
// }

// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { statusType } from '@/components/Home'
// import { supabase } from '@/lib/supabase'
// import { Dispatch, RefObject, SetStateAction } from 'react'

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface StartSharingProps {
//   setSessionCode: Dispatch<SetStateAction<string | null>>
//   setStatus: Dispatch<SetStateAction<statusType>>
//   source: string
//   videoRef: RefObject<HTMLVideoElement | null>
//   userId: string
// }

// interface StopSharingProps {
//   session_code: string
//   setSessionCode: Dispatch<SetStateAction<string | null>>
//   setStatus: Dispatch<SetStateAction<statusType>>
//   videoRef: RefObject<HTMLVideoElement | null>
// }

// // ─── Module State ─────────────────────────────────────────────────────────────

// /**
//  * Encapsulate all mutable module-level state in one object so it's easier
//  * to reset atomically and reason about lifecycle.
//  */
// interface SharingState {
//   peerConnection: RTCPeerConnection | null
//   /** Supabase realtime channel refs so we can remove them on teardown */
//   channels: ReturnType<typeof supabase.channel>[]
// }

// const state: SharingState = {
//   peerConnection: null,
//   channels: []
// }

// function resetState(): void {
//   state.peerConnection = null
//   state.channels = []
// }

// // ─── RTC Config ───────────────────────────────────────────────────────────────

// const RTC_CONFIG: RTCConfiguration = {
//   // Add STUN servers so ICE works outside a LAN.
//   // Replace with your own TURN servers for production reliability.
//   iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
// }

// // ─── Public API ───────────────────────────────────────────────────────────────

// export async function startSharing({
//   setSessionCode,
//   setStatus,
//   source,
//   videoRef,
//   userId
// }: StartSharingProps): Promise<void> {
//   const code = generateSessionCode()
//   setSessionCode(code)
//   setStatus('Waiting')

//   let stream: MediaStream
//   try {
//     stream = await getScreenStream(source)
//   } catch (err) {
//     console.error('startSharing – screen capture failed:', err)
//     setStatus('Idle')
//     setSessionCode(null)
//     return
//   }

//   if (videoRef.current) videoRef.current.srcObject = stream

//   try {
//     await startWebRTCSharing(stream, code, userId)
//   } catch (err) {
//     console.error('startSharing – WebRTC setup failed:', err)
//     setStatus('Idle')
//     setSessionCode(null)
//   }
// }

// export async function stopSharing({
//   session_code,
//   setSessionCode,
//   setStatus,
//   videoRef
// }: StopSharingProps): Promise<void> {
//   // 1. Update UI immediately
//   setSessionCode(null)
//   setStatus('Idle')

//   // 2. Stop local media
//   if (videoRef.current?.srcObject) {
//     const stream = videoRef.current.srcObject as MediaStream
//     stream.getTracks().forEach((t) => t.stop())
//     videoRef.current.srcObject = null
//   }

//   // 3. Close peer connection
//   state.peerConnection?.close()

//   // 4. Unsubscribe realtime channels
//   await Promise.all(state.channels.map((ch) => supabase.removeChannel(ch)))

//   resetState()

//   // 5. Delete Supabase rows in parallel
//   const [candidatesResult, sessionResult] = await Promise.all([
//     supabase.from('candidates').delete().eq('session_code', session_code),
//     supabase.from('sessions').delete().eq('session_code', session_code)
//   ])

//   if (candidatesResult.error)
//     console.error('stopSharing – candidates delete:', candidatesResult.error.message)
//   if (sessionResult.error)
//     console.error('stopSharing – session delete:', sessionResult.error.message)

//   console.log('Session stopped:', session_code)
// }

// // ─── WebRTC Core ──────────────────────────────────────────────────────────────

// async function startWebRTCSharing(
//   stream: MediaStream,
//   offerCode: string,
//   userId: string
// ): Promise<void> {
//   const pc = new RTCPeerConnection(RTC_CONFIG)
//   state.peerConnection = pc

//   // Buffer ICE candidates generated before the offer row exists in Supabase.
//   const pendingCandidates: RTCIceCandidate[] = []
//   let offerInserted = false

//   stream.getTracks().forEach((track) => pc.addTrack(track, stream))

//   pc.onicecandidate = async ({ candidate }) => {
//     if (!candidate) return // null = gathering complete
//     if (!offerInserted) {
//       pendingCandidates.push(candidate)
//       return
//     }
//     await insertCandidate(candidate, offerCode, 'desktop')
//   }

//   // Log connection state changes to help with debugging
//   pc.onconnectionstatechange = () => {
//     console.log('PeerConnection state:', pc.connectionState)
//   }

//   const offer = await pc.createOffer()
//   await pc.setLocalDescription(offer)

//   console.log('inserting offer')
//   const { error: insertError } = await supabase.from('sessions').insert({
//     session_code: offerCode,
//     host_id: userId,
//     offer
//   })
//   console.log('inserted offer')

//   if (insertError) {
//     console.error('startWebRTCSharing – session insert failed:', insertError)
//     throw insertError
//   }
//   offerInserted = true

//   // Flush buffered candidates in a single batch
//   if (pendingCandidates.length) {
//     await insertCandidates(pendingCandidates, offerCode, 'desktop')
//   }

//   // Start listeners *after* the offer is committed so we don't miss updates
//   listenForMobileCandidates(offerCode)
//   listenForAnswer(offerCode)
// }

// // ─── Supabase Realtime Listeners ──────────────────────────────────────────────

// function listenForMobileCandidates(offerCode: string): void {
//   const channel = supabase
//     .channel(`mobile-candidates-${offerCode}`)
//     .on(
//       'postgres_changes',
//       {
//         event: 'INSERT',
//         schema: 'public',
//         table: 'candidates',
//         filter: `session_code=eq.${offerCode}`
//       },
//       (payload) => {
//         const row = payload.new as any
//         if (row.direction !== 'mobileToDesktop') return

//         const ice = new RTCIceCandidate(row.candidate)
//         console.log('Mobile ICE candidate received')
//         state.peerConnection
//           ?.addIceCandidate(ice)
//           .catch((err) => console.error('addIceCandidate error:', err))
//       }
//     )
//     .subscribe()

//   state.channels.push(channel)
// }

// function listenForAnswer(offerCode: string): void {
//   const channel = supabase
//     .channel(`answer-${offerCode}`)
//     .on(
//       'postgres_changes',
//       {
//         event: 'UPDATE',
//         schema: 'public',
//         table: 'sessions', // ← was 'signallings' – align with your schema
//         filter: `session_code=eq.${offerCode}`
//       },
//       async (payload) => {
//         const row = payload.new as any
//         if (!row.answer) return

//         console.log('Answer received')
//         const answer = new RTCSessionDescription(row.answer)
//         await state.peerConnection
//           ?.setRemoteDescription(answer)
//           .catch((err) => console.error('setRemoteDescription error:', err))
//       }
//     )
//     .subscribe()

//   state.channels.push(channel)
// }

// // ─── ICE Helpers ─────────────────────────────────────────────────────────────

// /** Insert a single ICE candidate row */
// async function insertCandidate(
//   candidate: RTCIceCandidate,
//   offerCode: string,
//   direction: string
// ): Promise<void> {
//   const { error } = await supabase.from('candidates').insert({
//     session_code: offerCode,
//     candidate: candidate.toJSON(),
//     direction
//   })
//   if (error) console.error('insertCandidate error:', error)
// }

// /**
//  * Batch-insert multiple ICE candidates in a single Supabase round-trip.
//  * Much cheaper than N individual inserts when the offer is slow to commit.
//  */
// async function insertCandidates(
//   candidates: RTCIceCandidate[],
//   offerCode: string,
//   direction: string
// ): Promise<void> {
//   const rows = candidates.map((c) => ({
//     session_code: offerCode,
//     candidate: c.toJSON(),
//     direction
//   }))

//   const { error } = await supabase.from('candidates').insert(rows)
//   if (error) console.error('insertCandidates batch error:', error)
// }

// // ─── Screen Capture ───────────────────────────────────────────────────────────

// export async function getScreenStream(source: string): Promise<MediaStream> {
//   const stream = await (navigator.mediaDevices as any).getUserMedia({
//     audio: false,
//     video: {
//       mandatory: {
//         chromeMediaSource: 'desktop',
//         chromeMediaSourceId: source,
//         maxWidth: 1920,
//         maxHeight: 1080,
//         maxFrameRate: 60
//       }
//     }
//   })
//   return stream
// }

// // ─── Utilities ────────────────────────────────────────────────────────────────

// function generateSessionCode(): string {
//   return Math.floor(100000 + Math.random() * 900000).toString()
// }
import { statusType } from '@/components/Home'
import { supabase } from '@/lib/supabase'
import { Dispatch, RefObject, SetStateAction } from 'react'

let peerConnection: RTCPeerConnection | null = null

type CandidateDirection = 'desktopToMobile' | 'mobileToDesktop'

interface StartSharingProps {
  setSessionCode: Dispatch<SetStateAction<string | null>>
  setStatus: Dispatch<SetStateAction<statusType>>
  source: string
  videoRef: RefObject<HTMLVideoElement | null>
  userId: string
}

interface StopSharingProps {
  session_code: string
  setSessionCode: Dispatch<SetStateAction<string | null>>
  setStatus: Dispatch<SetStateAction<statusType>>
  videoRef: RefObject<HTMLVideoElement | null>
}

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

    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }

    await startWebRTCSharing(stream, code, userId)
  } catch (err) {
    console.error('startSharing error:', err)
  }
}

/* ---------------------------------------------------- */
/* WEBRTC SHARING */
/* ---------------------------------------------------- */
const pendingCandidates: RTCIceCandidate[] = []
let offerInserted = false

async function startWebRTCSharing(
  stream: MediaStream,
  sessionCode: string,
  userId: string
): Promise<void> {
  peerConnection = createPeerConnection()

  const pc = peerConnection

  /* Add tracks */
  stream.getTracks().forEach((track) => pc.addTrack(track, stream))

  /* ICE Candidates */
  pc.onicecandidate = async (event) => {
    if (!event.candidate) return

    if (!offerInserted) {
      pendingCandidates.push(event.candidate)
      return
    }

    insertCandidate(event.candidate, sessionCode, 'desktopToMobile')
  }

  /* Create offer */
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)

  /* Insert offer */
  console.log('inserting session')

  try {
    const { data, error } = await supabase.from('sessions').insert({
      session_code: sessionCode,
      host_id: userId,
      offer
    })

    if (error) {
      console.error('Supabase error:', error)
    }

    console.log('inserted session', data)
  } catch (err) {
    console.error('Insert crashed:', err)
  }

  offerInserted = true

  /* Flush queued ICE */
  if (pendingCandidates.length) {
    await Promise.all(
      pendingCandidates.map((c) => insertCandidate(c, sessionCode, 'desktopToMobile'))
    )
  }

  listenForAnswer(sessionCode)
  listenForMobileCandidates(sessionCode)
}

/* ---------------------------------------------------- */
/* PEER CONNECTION */
/* ---------------------------------------------------- */

function createPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  })
}

/* ---------------------------------------------------- */
/* LISTEN MOBILE ICE */
/* ---------------------------------------------------- */

function listenForMobileCandidates(sessionCode: string): void {
  supabase
    .channel(`mobile-candidates-${sessionCode}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'candidates',
        filter: `session_code=eq.${sessionCode},direction=eq.mobileToDesktop`
      },
      (payload) => {
        const row = payload.new as {
          candidate: RTCIceCandidateInit
          direction: CandidateDirection
        }
        console.log('candidates: ', row.candidate)

        if (row.direction !== 'mobileToDesktop') return

        const candidate = new RTCIceCandidate(row.candidate)
        if (!offerInserted) {
          pendingCandidates.push(candidate)
          return
        }
        peerConnection?.addIceCandidate(candidate)
      }
    )
    .subscribe()
}

/* ---------------------------------------------------- */
/* LISTEN ANSWER */
/* ---------------------------------------------------- */

function listenForAnswer(sessionCode: string): void {
  supabase
    .channel(`answer-${sessionCode}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `session_code=eq.${sessionCode}`
      },
      async (payload) => {
        const row = payload.new as { answer: RTCSessionDescriptionInit | null }

        if (!row.answer) return

        const answer = new RTCSessionDescription(row.answer)

        await peerConnection?.setRemoteDescription(answer)
        for (const candidate of pendingCandidates) {
          await peerConnection?.addIceCandidate(candidate)
        }

        pendingCandidates.length = 0
      }
    )
    .subscribe()
}

/* ---------------------------------------------------- */
/* INSERT ICE */
/* ---------------------------------------------------- */

async function insertCandidate(
  candidate: RTCIceCandidate,
  sessionCode: string,
  direction: CandidateDirection
): Promise<void> {
  const { error } = await supabase.from('candidates').insert({
    session_code: sessionCode,
    candidate: candidate.toJSON(),
    direction
  })

  if (error) console.error('ICE insert error:', error)
}

/* ---------------------------------------------------- */
/* STOP SHARING */
/* ---------------------------------------------------- */

export async function stopSharing({
  session_code,
  setSessionCode,
  setStatus,
  videoRef
}: StopSharingProps): Promise<void> {
  setSessionCode(null)
  setStatus('Idle')

  /* Stop video */
  if (videoRef.current?.srcObject) {
    const stream = videoRef.current.srcObject as MediaStream

    stream.getTracks().forEach((track) => track.stop())

    videoRef.current.srcObject = null
  }

  /* Close WebRTC */
  peerConnection?.close()
  peerConnection = null

  /* Cleanup DB */
  await Promise.all([
    supabase.from('candidates').delete().eq('session_code', session_code),
    supabase.from('sessions').delete().eq('session_code', session_code)
  ])

  console.log('Session stopped')
}

/* ---------------------------------------------------- */
/* SCREEN CAPTURE */
/* ---------------------------------------------------- */

export async function getScreenStream(source: string): Promise<MediaStream> {
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
}

/* ---------------------------------------------------- */
/* UTIL */
/* ---------------------------------------------------- */

function generateSessionCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
