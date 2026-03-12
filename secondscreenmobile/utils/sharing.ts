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
  deviceInfo,
  peerConnectionRef,
  session_code,
  setRemoteStream,
  router,
}: {
  deviceInfo: {
    deviceName: string | null;
    deviceType: string | null;
    deviceOS: string | null;
  };
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
    /* Data Channel */
    /* -------------------------------- */

    (pc as any).ondatachannel = (event: any) => {
      const channel = event.channel;

      channel.onopen = () => {
        console.log("DataChannel opened");
        channel.send(JSON.stringify(deviceInfo));
      };

      channel.onmessage = (event: any) => {
        console.log("Message from desktop:", event.data);
      };
    };

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
      Alert.alert(error?.name ?? "", error?.message);
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
