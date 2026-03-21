import { SQLiteDatabase } from "react-native-sqlite-storage";
import { CategoryItem } from "../../models";
import { getNow } from "../../utils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@env";
import { authorizedFetch } from "../middleware/auth.middleware";
import NetInfo from "@react-native-community/netinfo";
import { getDBConnection } from "./db-service";
import { createTableIfNotExists } from "../utils/tableExists";

import { v4 as uuidv4 } from "uuid";



/* -------------------------- */
/* CREATE TABLES */
/* -------------------------- */



export const createCategoryTable = async () => {
  try {
    const db = await getDBConnection();
    await createTableIfNotExists(
      db,
      'Category',
      `CREATE TABLE Category (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_name TEXT COLLATE NOCASE,
          category_id TEXT UNIQUE,
          business TEXT,
          createdBy TEXT,
          description TEXT,
          synced INTEGER DEFAULT 0,
          expiryDate TEXT,
          createdAt TEXT,
          updatedAt TEXT,
          deleted_at TEXT,
          UNIQUE (category_name, business)
      );`
    );
  } catch (err) {
    console.error(' createCategoryTable failed:', err);
    throw err;
  }
};

export const updateCategory = async (
  data: CategoryItem
) => {
  const { category_id,
    category_name,
    description,
    expiryDate } = data
  try {
    const db = await getDBConnection();

    await db.executeSql(
      `UPDATE Category
       SET category_name = ?,
           description = ?,
           expiryDate = ?,
           updatedAt = datetime('now'),
           synced = 0
       WHERE category_id = ?`,
      [category_name, description, expiryDate ?? null, category_id]
    );

    console.log(" Category updated locally");
  } catch (error) {
    console.log(" updateCategory failed:", error);
    throw error;
  }
};

/* -------------------------- */
/* SYNC META */
/* -------------------------- */

export const setLastSyncTime = async (db: SQLiteDatabase, timestamp: string) => {
  await db.executeSql(
    `INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)`,
    ["last_sync", timestamp]
  );
};

export const getLastSyncTime = async (): Promise<string> => {
  return (
    (await AsyncStorage.getItem("lastSync")) || "1970-01-01T00:00:00Z"
  );
};

export const saveLastSyncTime = async (timestamp: string) => {
  await AsyncStorage.setItem("lastSync", timestamp);
};

/* -------------------------- */
/* UTILITIES */
/* -------------------------- */


/* -------------------------- */
/* PUSH LOCAL → SERVER */
/* -------------------------- */

export const syncUnsyncedCategories = async (db: SQLiteDatabase) => {
  const results = await db.executeSql(
    `SELECT * FROM Category WHERE synced = 0`
  );

  const rows = results[0].rows;
  const unsynced: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    unsynced.push(rows.item(i));
  }

  if (unsynced.length === 0) return;

  try {
    const response = await authorizedFetch(`${API_URL}/api/categories/bulk`, {
      method: "POST",
      body: JSON.stringify({ categories: unsynced }),
    });

    if (response?.success) {
      await db.executeSql(
        `UPDATE Category SET synced = 1 WHERE synced = 0`
      );
    }
  } catch (err) {
    console.error(" Sync push error:", err);
  }
};

/* -------------------------- */
/* PULL SERVER → LOCAL */
/* -------------------------- */

export const pullUpdatedCategories = async (
  db: SQLiteDatabase,
  lastSyncTime: string
) => {
  try {
    const categories = await authorizedFetch(
      `${API_URL}/api/categories/updated-since?since=${lastSyncTime}`
    );

    const createdBy = await AsyncStorage.getItem("userId");

    const query = `
      INSERT INTO Category (
        category_id,
        category_name,
        description,
        business,
        synced,
        expiryDate,
        createdAt,
        updatedAt,
        createdBy
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(category_id) DO UPDATE SET
        category_name = excluded.category_name,
        description = excluded.description,
        synced = 1,
        expiryDate = excluded.expiryDate,
        updatedAt = excluded.updatedAt,
        createdBy = excluded.createdBy
    `;

    for (const item of categories) {
      await db.executeSql(query, [
        item.category_id,
        item.category_name,
        item.description,
        item.business_id,
        1,
        item.expiryDate,
        item.createdAt,
        item.updatedAt,
        createdBy,
      ]);
    }

    console.log(" Categories pulled successfully");
  } catch (error) {
    console.error(" Pull error:", error);
  }
};

/* -------------------------- */
/* FULL SYNC */
/* -------------------------- */

export const syncAllCategories = async (db: SQLiteDatabase) => {
  const lastSync = await getLastSyncTime();

  await syncUnsyncedCategories(db);
  await pullUpdatedCategories(db, lastSync);

  const newSync = new Date().toISOString();
  await saveLastSyncTime(newSync);

  console.log(" Sync completed");
};

/* -------------------------- */
/* READ DATA */
/* -------------------------- */

export const getCategories = async (
  db: SQLiteDatabase
): Promise<any[]> => {
  const result = await db.executeSql(`SELECT * FROM Category WHERE deleted_at IS NULL`);
  return result[0].rows.raw();
};

export const getSyncedCategories = async (
  db: SQLiteDatabase
): Promise<any[]> => {
  const result = await db.executeSql(
    `SELECT * FROM Category WHERE synced = 1 AND deleted_at IS NULL`
  );
  return result[0].rows.raw();
};

export const getUnsyncedCategories = async (
  db: SQLiteDatabase
): Promise<any[]> => {
  const result = await db.executeSql(
    `SELECT * FROM Category WHERE synced = 0 AND deleted_at IS NULL`
  );
  return result[0].rows.raw();
};

/* -------------------------- */
/* CREATE CATEGORY */
/* -------------------------- */

export const saveCategoryItems = async (
  db: SQLiteDatabase,
  item: CategoryItem,

): Promise<CategoryItem[]> => {

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1000);

  const trimmedName = item.category_name.trim();
  const createdBy = await AsyncStorage.getItem("userId");
  const now = new Date().toISOString();

  const category_id = uuidv4();
  const expiryDate =
    item.expiryDate === "" ? futureDate.toISOString() : item.expiryDate;

  const checkQuery =
    `SELECT COUNT(*) as count FROM Category WHERE LOWER(category_name) = LOWER(?)`;

  const checkResult = await db.executeSql(checkQuery, [trimmedName]);
  const count = checkResult[0].rows.item(0).count;

  if (count > 0) {
    throw new Error(`Category "${trimmedName}" already exists`);
  }

  const state = await NetInfo.fetch();
  let synced = 0;

  const insertQuery = `
    INSERT INTO Category
    (
      category_name,
      category_id,
      business,
      createdBy,
      description,
      synced,
      expiryDate,
      createdAt,
      updatedAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await db.executeSql(insertQuery, [
    trimmedName,
    category_id,
    item.business_id || "",
    createdBy,
    item.description || "",
    synced,
    expiryDate,
    now,
    now,
  ]);

  return await getCategories(db);
};

/* -------------------------- */
/* DELETE */
/* -------------------------- */


export const softDeleteCategory = async (
  id: any
) => {
  const db = await getDBConnection();
  await db.executeSql(
    `UPDATE Category 
     SET deleted_at = datetime('now'),  synced = 0, updatedAt = datetime('now') 
     WHERE category_id = ?`,
    [id]
  );
};

/* -------------------------- */
/* MARK SYNCED */
/* -------------------------- */


/* -------------------------- */
/* INVENTORY */
/* -------------------------- */

export const insertInventory = async (
  product: string,
  quantity: number,
  db: SQLiteDatabase
) => {
  await db.executeSql(
    `INSERT INTO inventory (product, quantity, synced, updatedAt)
     VALUES (?, ?, 0, ?)`,
    [product, quantity, getNow()]
  );
};