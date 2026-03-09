import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { globalSync } from ".";
import { syncTables } from "./tables";

export const SyncLoader = ({ onDone }: any) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Syncing data...");

  useEffect(() => {
    const startSync = async () => {
      const success = await globalSync(syncTables, setProgress);

      if (success) {
        setStatus("✅ Sync Successful");
      } else {
        setStatus("❌ Sync Failed");
      }

      setTimeout(() => {
        onDone();
      }, 1500);
    };

    startSync();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1e293b",
      }}
    >
      <ActivityIndicator size="large" color="#fff" />

      <Text style={{ color: "white", marginTop: 20 }}>
        {status}
      </Text>

      <Text style={{ color: "white", marginTop: 10, fontSize: 20 }}>
        {progress}%
      </Text>
    </View>
  );
};