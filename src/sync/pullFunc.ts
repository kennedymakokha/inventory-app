import AsyncStorage from "@react-native-async-storage/async-storage";
import { authorizedFetch } from "../middleware/auth.middleware";
import { SyncTableConfig } from "./sync.config";
import { SQLiteDatabase } from "react-native-sqlite-storage";
import { API_URL } from "@env";

export const pullUpdates = async (
  db: SQLiteDatabase,
  config: SyncTableConfig
) => {
  const lastSync =
    (await AsyncStorage.getItem(config.lastSyncKey)) ||
    "1970-01-01T00:00:00Z";

  const rawData = await authorizedFetch(
    `${API_URL}${config.updatedSinceEndpoint}?since=${lastSync}`
  );

  const data = rawData[config.payloadKey] || [];

  if (!Array.isArray(data) || data.length === 0) {
    console.log(`No updates for ${config.tableName}`);
    return;
  }

  /* 🔹 Get SQLite table columns */
  const result = await db.executeSql(
    `PRAGMA table_info(${config.tableName})`
  );

  const tableColumns = result[0].rows.raw().map((row: any) => row.name);

  for (const item of data) {
    if (!item[config.primaryKey]) continue;

    /* 🔹 Only keep columns that exist in SQLite */
    const filtered = Object.fromEntries(
      Object.entries(item).filter(([key]) =>
        tableColumns.includes(key)
      )
    );

    filtered["synced"] = 1;

    const columns = Object.keys(filtered);
    const placeholders = columns.map(() => "?").join(", ");

    const updates = columns
      .filter((col) => col !== config.primaryKey)
      .map((col) => `${col}=excluded.${col}`)
      .join(", ");

    const values = columns.map((col) => filtered[col]);

    const query = `
      INSERT INTO ${config.tableName} (${columns.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT(${config.primaryKey}) DO UPDATE SET
      ${updates}
    `;

    await db.executeSql(query, values);
  }

  await AsyncStorage.setItem(
    config.lastSyncKey,
    new Date().toISOString()
  );

  console.log(`⬇️ Pulled updates for ${config.tableName}`);
};