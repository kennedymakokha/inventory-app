import NetInfo from "@react-native-community/netinfo";
import { getDBConnection } from "../services/db-service";
import { globalSync } from ".";
import { SyncTableConfig } from "./sync.config";

let isSyncing = false;
let wasOffline = false;

export const startGlobalAutoSync = (tables: SyncTableConfig[]) => {

  const unsubscribe = NetInfo.addEventListener(async (state) => {

    const isOnline = state.isConnected && state.isInternetReachable;

    if (!isOnline) {
      wasOffline = true;
      return;
    }

    // only run when connection returns
    if (isOnline && wasOffline && !isSyncing) {

      try {
        isSyncing = true;
        wasOffline = false;

        console.log("🌐 Network restored → starting global sync");

        const db = await getDBConnection();

        await globalSync(tables);

        console.log(" Global sync finished");

      } catch (err) {
        console.error(" Global sync error:", err);
      } finally {
        isSyncing = false;
      }
    }

  });

  return unsubscribe;
};