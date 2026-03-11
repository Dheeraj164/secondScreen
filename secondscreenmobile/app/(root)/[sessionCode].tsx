import { ActivityIndicator, Dimensions, StyleSheet, View } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { acceptOffer } from "@/utils/sharing";
import { MediaStream, RTCPeerConnection, RTCView } from "react-native-webrtc";
const { width, height } = Dimensions.get("screen");
export default function Session() {
  const localParam = useLocalSearchParams();
  const session_code = localParam.sessionCode as string;
  const [stream, setStream] = useState<MediaStream | null>(null);
  const peerContectionRef = useRef<RTCPeerConnection | null>(null);
  const router = useRouter();

  useEffect(() => {
    acceptOffer({
      router: router,
      peerConnectionRef: peerContectionRef,
      session_code: session_code!,
      setRemoteStream: setStream,
      userId: "",
    });
  }, [router, session_code]);

  return (
    <View style={styles.mainContainer}>
      {stream ? (
        <RTCView
          style={[styles.video, styles.video2]}
          streamURL={stream.toURL()}
        />
      ) : (
        <View style={styles.loader}>
          <ActivityIndicator color={"green"} size={"large"} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  video: {
    flex: 1,
    backgroundColor: "black",
    height: "100%",
    width: "100%",
  },
  video2: { width, height },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
