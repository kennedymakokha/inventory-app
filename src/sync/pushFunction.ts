import { SQLiteDatabase } from "react-native-sqlite-storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authorizedFetch } from "../middleware/auth.middleware";
import { API_URL } from "@env";

import { SyncTableConfig } from "./sync.config";

export const pushUnsynced = async (db: any, config: SyncTableConfig) => {
  const result = await db.executeSql(
    `SELECT * FROM ${config.tableName} WHERE synced = 0`
  );

  const rows = result[0].rows;
  if (rows.length === 0) return;

  const unsynced = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows.item(i);

    const { _id, ...cleanRow } = row; // remove _id
    unsynced.push(cleanRow);
  }

  const response = await authorizedFetch(
    `${API_URL}${config.bulkEndpoint}`,
    {
      method: "POST",
      body: JSON.stringify({
        [config.payloadKey]: unsynced,
      }),
    }
  );

  if (response.success) {
    await db.executeSql(
      `UPDATE ${config.tableName} SET synced = 1 WHERE synced = 0`
    );
  }
};