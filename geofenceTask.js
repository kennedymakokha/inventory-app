import { AppRegistry } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GeofenceTask = async (data) => {
  try {
    const { isInside, fenceId } = data;

    console.log("🔥 Headless Geofence Trigger:", isInside, fenceId);

    // Save state
    await AsyncStorage.setItem("lastZoneState", isInside ? "true" : "false");

    // 👉 You CANNOT use hooks here
    // So just store state or trigger logic indirectly

  } catch (e) {
    console.error("Headless task error:", e);
  }
};

AppRegistry.registerHeadlessTask("GeofenceTask", () => GeofenceTask);