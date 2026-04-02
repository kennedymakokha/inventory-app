import { SQLiteDatabase } from "react-native-sqlite-storage";
import { SyncTableConfig } from "./sync.config";
import { pushUnsynced } from "./pushFunction";
import { pullUpdates } from "./pullFunc";
import { getDBConnection } from "../services/db-service";


let syncing = false;

export const globalSync = async (
  tables: SyncTableConfig[],
  onProgress?: (progress: number) => void
) => {

  if (syncing) {
    console.log("⏳ Sync already running...");
    return false;
  }

  syncing = true;

  try {

    console.log("🔄 GLOBAL SYNC START");

    const db = await getDBConnection();

    const totalSteps = tables.length * 2;
    let completed = 0;

    for (const table of tables) {

      // console.log(`⬆️ PUSH START: ${table.tableName}`);

      await pushUnsynced(db, table);

      // console.log(` PUSH DONE: ${table.tableName}`);

      completed++;
      onProgress?.(Math.floor((completed / totalSteps) * 100));

      // console.log(`⬇️ PULL START: ${table.tableName}`);

      await pullUpdates(db, table);

      // console.log(` PULL DONE: ${table.tableName}`);

      completed++;
      onProgress?.(Math.floor((completed / totalSteps) * 100));

    }

    console.log("🎉 GLOBAL SYNC COMPLETE");

    return true;

  } catch (error) {

    console.error(" Global sync failed:", error);
    return false;

  } finally {

    syncing = false;

  }

};

//   tables: SyncTableConfig[],
//   onProgress?: (progress: number) => void
// ) => {
//   try {
//     const db = await getDBConnection();

//     const totalSteps = tables.length * 2; // push + pull
//     let completed = 0;

//     for (const table of tables) {
//       console.log(`🔄 Syncing ${table.tableName}`);

//       await pushUnsynced(db, table);
//       completed++;
//       onProgress?.(Math.floor((completed / totalSteps) * 100));

//       await pullUpdates(db, table);
//       completed++;
//       onProgress?.(Math.floor((completed / totalSteps) * 100));

//       console.log(` ${table.tableName} synced`);
//     }

//     console.log("🎉 GLOBAL SYNC COMPLETE");
//     return true;
//   } catch (error) {
//     console.log(error)
//     console.log(" Global sync failed:", error);
//     return false;
//   }
// };