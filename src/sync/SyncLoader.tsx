import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { globalSync } from ".";
import { syncTables } from "./tables";

const { height } = Dimensions.get("window");

export const SyncLoader = ({ onDone }: any) => {
  const [status, setStatus] = useState("Syncing data...");
  const [failed, setFailed] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startSync = async () => {
      const success = await globalSync(syncTables, (progress: number) => {
        Animated.timing(progressAnim, {
          toValue: progress / 100,
          duration: 300,
          easing: Easing.linear,
          useNativeDriver: false,
        }).start();
      });

      if (success) {
        setStatus("Sync Successful");
      } else {
        setStatus("Sync Failed");
        setFailed(true);
      }

      setTimeout(() => {
        onDone();
      }, 1500);
    };

    startSync();
  }, []);

  // Height grows bottom → top
  const heightInterpolate = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height],
  });

  // Color deepens as progress increases
  const colorInterpolate = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      "#dcfce7", // very light green (start)
      "#16a34a", // strong success green (end)
    ],
  });

  return (
    <View style={styles.container}>
      {/* Animated Fill */}
      <Animated.View
        style={[
          styles.fill,
          {
            height: heightInterpolate,
            backgroundColor: failed ? "#ef4444" : colorInterpolate,
          },
        ]}
      />

      {/* Center Text */}
      <View style={styles.content}>
        <Text style={styles.status}>{status}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by mtando.app</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    justifyContent: "flex-end",
  },
  fill: {
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  content: {
    position: "absolute",
    top: "45%",
    alignSelf: "center",
  },
  status: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    alignItems: "center",
  },
  footerText: {
    color: "#94a3b8",
    fontSize: 12,
  },
});