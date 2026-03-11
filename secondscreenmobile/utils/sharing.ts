// import { Router } from "expo-router";
// import React, { RefObject } from "react";
// import { Alert } from "react-native";
// import {
//   MediaStream,
//   RTCIceCandidate,
//   RTCPeerConnection,
//   RTCSessionDescription,
// } from "react-native-webrtc";
// import { supabase } from "./supabase";

// const rtcConfig: RTCConfiguration = {
//   iceServers: [
//     {
//       urls: "stun:stun.l.google.com:19302",
//     },
//   ],
// };
// export async function acceptOffer({
//   peerConnectionRef,
//   session_code,
//   setRemoteStream,
//   userId,
//   router,
// }: {
//   peerConnectionRef: React.RefObject<RTCPeerConnection | null>;
//   session_code: string;
//   setRemoteStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;
//   userId: string;
//   router: Router;
// }) {
//   if (!session_code) {
//     console.log(session_code);
//     Alert.alert("Offer Code Empty", "Can not find the session_code");
//     return () => {};
//   }
//   console.log(session_code);

//   try {
//     // -- 1) Create RTCPeerConnection
//     peerConnectionRef.current = new RTCPeerConnection(rtcConfig);
//     const pc = peerConnectionRef.current;
//     let answerInsert = false;
//     let pendingCandidates: RTCIceCandidate[] = [];

//     // -- 2) Send local ICE candidates to supabase (mobile->desktop)
//     (pc as any).onicecandidate = async (event: any) => {
//       if (event.candidate) {
//         if (answerInsert) {
//           console.log("Mobile local ICE candidate:", event.candidate);
//           const { error } = await supabase.from("candidates").insert([
//             {
//               session_code: session_code,
//               candidate: event.candidate.toJSON(),
//               direction: "mobileToDesktop",
//             },
//           ]);
//           if (error) {
//             Alert.alert(error.name, error.message);
//           }
//         } else {
//           pendingCandidates.push(event.candidate);
//         }
//       }
//     };

//     // -- 3) When we get a remote track, set the remoteStream for RTCView
//     (pc as any).ontrack = (event: any) => {
//       if (event.streams && event.streams[0]) {
//         console.log("Stream: ", event.streams[0]);
//         setRemoteStream(event.streams[0]);
//       }
//     };

//     // -- 4) Listen for *remote* ICE candidates with supabase (desktop->mobile)
//     try {
//       const { data, error } = await supabase
//         .from("candidates")
//         .select("candidate")
//         .eq("session_code", session_code)
//         .eq("direction", "desktopToMobile");

//       if (error) Alert.alert(error.name, error.message);
//       if (data) {
//         data.map((candidate) => {
//           const newCandidate = new RTCIceCandidate(candidate.candidate);
//           pc.addIceCandidate(newCandidate);
//         });
//       }
//     } catch (e) {
//       alert(e);
//     }

//     supabase
//       .channel("desktop-candidates")
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "candidates",
//           filter: `session_code=eq.${session_code}`,
//         },
//         (payload) => {
//           console.log("Payload: ", payload.new);
//           if (payload.new.direction === "desktopToMobile") {
//             const candidate = new RTCIceCandidate(
//               payload.new.candidate.candidate,
//             );
//             pc.addIceCandidate(candidate);
//           }
//         },
//       )
//       .subscribe();

//     const { data, error } = await supabase
//       .from("sessions")
//       .select("offer")
//       .eq("session_code", session_code);
//     if (error) {
//       console.log("error while fetching offer", error);
//       Alert.alert("Error while fetching offer", error.message);
//       if (router.canGoBack()) {
//         router.back();
//       }
//       return; // Ensure we exit early if there's an error
//     }

//     // -- 5) Listen for Offer with supabase (offer from desktop)
//     const offerData = data && data.length > 0 ? data[0].offer : null;

//     if (!offerData || !offerData.type || !offerData.sdp) {
//       Alert.alert("Invalid Offer", "Received offer data is incomplete.");
//       return;
//     }
//     await pc.setRemoteDescription(
//       new RTCSessionDescription({
//         type: offerData.type,
//         sdp: offerData.sdp,
//       }),
//     );

//     // await pc.setRemoteDescription(
//     //   new RTCSessionDescription({
//     //     type: offerData.type,
//     //     sdp: offerData.sdp,
//     //   })
//     // );

//     // -- 6) Create and set local answer
//     const answer = await pc.createAnswer();
//     await pc.setLocalDescription(answer);
//     try {
//       const { error } = await supabase
//         .from("sessions")
//         .update({ answer: answer })
//         .eq("session_code", session_code);

//       if (error) {
//         Alert.alert(error.name, error.message);
//       } else {
//         answerInsert = true;
//         // const``
//         pendingCandidates.map(async (candidate) => {
//           const { error } = await supabase.from("candidates").insert([
//             {
//               session_code: session_code,
//               candidate: candidate.toJSON(),
//               direction: "mobileToDesktop",
//             },
//           ]);
//           if (error) {
//             Alert.alert(error.name, error.message);
//           }
//         });
//       }
//     } catch (e) {
//       alert(e);
//     }

//     // --10) Monitor connection state
//     (pc as any).onconnectionstatechange = () => {
//       console.log("Mobile: PC connectionState =>", pc.connectionState);
//       if (
//         pc.connectionState === "disconnected" ||
//         pc.connectionState === "closed"
//       ) {
//         Alert.alert("Connection Closed", "Connection was closed");
//         pc.close();
//         router.canGoBack() && router.back();
//       }
//     };
//   } catch (err) {
//     console.error("Error accepting offer:", err);
//   }
// }

// export async function stopConnection(
//   peerConnectionRef: RefObject<RTCPeerConnection | null>,
//   setRemoteStream: React.Dispatch<React.SetStateAction<MediaStream | null>>,
//   router: Router,
// ) {
//   peerConnectionRef.current?.close();
//   setRemoteStream(null);
//   router.canGoBack() && router.back();
// }

import { Router } from "expo-router";
import React, { RefObject } from "react";
import { Alert } from "react-native";
import {
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from "react-native-webrtc";
import { supabase } from "./supabase";

const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

let candidatesChannel: ReturnType<typeof supabase.channel> | null = null;

type CandidateDirection = "desktopToMobile" | "mobileToDesktop";

export async function acceptOffer({
  peerConnectionRef,
  session_code,
  setRemoteStream,
  router,
}: {
  peerConnectionRef: RefObject<RTCPeerConnection | null>;
  session_code: string;
  setRemoteStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;
  userId: string;
  router: Router;
}) {
  if (!session_code) {
    Alert.alert("Invalid Session", "Session code missing");
    return;
  }

  try {
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = pc;

    const pendingCandidates: RTCIceCandidate[] = [];
    let answerInserted = false;

    /* -------------------------------- */
    /* Remote Track */
    /* -------------------------------- */

    (pc as any).ontrack = (event: any) => {
      const stream = event.streams?.[0];
      if (stream) setRemoteStream(stream);
    };

    /* -------------------------------- */
    /* Local ICE (mobile -> desktop) */
    /* -------------------------------- */

    (pc as any).onicecandidate = async (event: any) => {
      if (!event.candidate) return;

      if (!answerInserted) {
        pendingCandidates.push(event.candidate);
        return;
      }

      await insertCandidate(event.candidate, session_code, "mobileToDesktop");
    };

    /* -------------------------------- */
    /* Fetch Offer */
    /* -------------------------------- */

    const { data, error } = await supabase
      .from("sessions")
      .select("offer")
      .eq("session_code", session_code)
      .single();

    if (error || !data?.offer) {
      Alert.alert("Session Not Found");
      router.canGoBack() && router.back();
      return;
    }
    // console.log("Offer from desktop: ", data.offer);
    const offer = new RTCSessionDescription(data.offer);
    await pc.setRemoteDescription(offer);

    /* -------------------------------- */
    /* Create Answer */
    /* -------------------------------- */

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    const { error: answerError } = await supabase
      .from("sessions")
      .update({ answer })
      .eq("session_code", session_code);

    if (answerError) {
      console.error(answerError);
      Alert.alert("Failed to send answer");
      return;
    }

    answerInserted = true;

    /* Flush pending ICE */

    if (pendingCandidates.length) {
      await Promise.all(
        pendingCandidates.map((c) =>
          insertCandidate(c, session_code, "mobileToDesktop"),
        ),
      );
    }

    /* -------------------------------- */
    /* Existing ICE Candidates */
    /* -------------------------------- */

    const { data: existingCandidates } = await supabase
      .from("candidates")
      .select("candidate")
      .eq("session_code", session_code)
      .eq("direction", "desktopToMobile");

    existingCandidates?.forEach((row) => {
      const candidate = new RTCIceCandidate(row.candidate);
      pc.addIceCandidate(candidate).catch(console.error);
    });

    /* -------------------------------- */
    /* Listen for Desktop ICE */
    /* -------------------------------- */

    candidatesChannel = supabase
      .channel(`desktop-candidates-${session_code}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "candidates",
          filter: `session_code=eq.${session_code}, direction=eq.desktopToMobile`,
        },
        (payload) => {
          const row = payload.new as {
            candidate: RTCIceCandidateInit;
            direction: CandidateDirection;
          };
          console.log("candidates: ", row.candidate);

          if (row.direction !== "desktopToMobile") return;

          const candidate = new RTCIceCandidate(row.candidate);
          pc.addIceCandidate(candidate).catch(console.error);
        },
      )
      .subscribe();

    /* -------------------------------- */
    /* Connection State */
    /* -------------------------------- */

    (pc as any).onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log("Mobile connection state:", state);

      if (
        state === "failed" ||
        state === "closed" ||
        state === "disconnected"
      ) {
        stopConnection(peerConnectionRef, setRemoteStream, router);
      }
    };
  } catch (error) {
    console.error("acceptOffer error:", error);
  }
}

/* -------------------------------- */
/* Insert ICE */
/* -------------------------------- */

async function insertCandidate(
  candidate: RTCIceCandidate,
  sessionCode: string,
  direction: CandidateDirection,
) {
  const { error } = await supabase.from("candidates").insert({
    session_code: sessionCode,
    candidate: candidate.toJSON(),
    direction,
  });

  if (error) console.error("ICE insert error:", error);
}

/* -------------------------------- */
/* Stop Connection */
/* -------------------------------- */

export async function stopConnection(
  peerConnectionRef: RefObject<RTCPeerConnection | null>,
  setRemoteStream: React.Dispatch<React.SetStateAction<MediaStream | null>>,
  router: Router,
) {
  try {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    setRemoteStream(null);

    if (candidatesChannel) {
      await supabase.removeChannel(candidatesChannel);
      candidatesChannel = null;
    }

    router.canGoBack() && router.back();
  } catch (error) {
    console.error("stopConnection error:", error);
  }
}
