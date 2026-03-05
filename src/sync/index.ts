import { SQLiteDatabase } from "react-native-sqlite-storage";
import { SyncTableConfig } from "./sync.config";
import { pushUnsynced } from "./pushFunction";
import { pullUpdates } from "./pullFunc";
import { getDBConnection } from "../services/db-service";


export const globalSync = async (
 
  tables: SyncTableConfig[]
) => {
  try {
    const db = await getDBConnection();
    for (const table of tables) {
      console.log(`🔄 Syncing ${table.tableName}`);

      await pushUnsynced(db, table);
      await pullUpdates(db, table);

      console.log(`✅ ${table.tableName} synced`);
    }

    console.log("🎉 GLOBAL SYNC COMPLETE");
  } catch (error) {
    console.log("❌ Global sync failed:", error);
  }
};