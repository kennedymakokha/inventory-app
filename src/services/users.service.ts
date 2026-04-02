import { SQLiteDatabase } from "react-native-sqlite-storage";
import { UserItem } from "../../models";
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


export const createUserTable = async () => {
  try {
    const db = await getDBConnection();
    await createTableIfNotExists(
      db,
      'User',
      `CREATE TABLE User (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT COLLATE NOCASE,
          user_id TEXT UNIQUE,
          business_id TEXT,
          createdBy TEXT,
          phone_number TEXT,
          FcmToken TEXT,
          role TEXT,
          synced INTEGER DEFAULT 0,
          email TEXT,
          createdAt TEXT,
          updatedAt TEXT,
          deleted_at TEXT,
          UNIQUE (phone_number, business_id)
      );`
    );
  } catch (err) {
    console.error(' createUserTable failed:', err);
    throw err;
  }
};

export const createCLockTable = async () => {
  try {
    const db = await getDBConnection();
    await createTableIfNotExists(
      db,
      'Clock', // Changed to plural to match your Insert
      `CREATE TABLE Clock (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          clock_id TEXT UNIQUE,
          user_id TEXT ,
          check_in_time TEXT,
          check_out_time TEXT,
          business TEXT,
          synced INTEGER DEFAULT 0,
          createdAt TEXT,
          updatedAt TEXT,
          deleted_at TEXT
      );` // Removed the trailing comma after deleted_at
    );
  } catch (err) {
    console.error(' createClocksTable failed:', err);
    throw err;
  }
};


export const updateUser = async (
  data: UserItem
) => {
  const { user_id,
    name,
    business_id,
    createdBy,
    phone_number,
    role,
    email,
  } = data
  try {
    const db = await getDBConnection();

    await db.executeSql(
      `UPDATE User
       SET name= ? ,
        business_id= ? ,
        createdBy= ? ,
        phone_number= ? ,
        role= ? ,
        email= ? ,
           updatedAt = datetime('now'),
           synced = 0
       WHERE user_id = ?`,
      [name, business_id,
        createdBy,
        phone_number,
        role,
        email, user_id]
    );

    console.log(" User updated locally");
  } catch (error) {
    console.log(" updateUser failed:", error);
    throw error;
  }
};





export const getUsers = async (
  db: SQLiteDatabase
): Promise<any[]> => {
  const result = await db.executeSql(`SELECT * FROM User WHERE deleted_at IS NULL`);
  return result[0].rows.raw();
};



export const clockIn = async (item: {
  user_id: string;
  business_id: string;
}) => {
  const db = await getDBConnection();

  // 🔍 Check if there's already an open session
  const checkQuery = `
    SELECT * FROM Clock
    WHERE user_id = ?
    AND check_out_time IS NULL
    LIMIT 1
  `;

  const existing = await db.executeSql(checkQuery, [item.user_id]);

  if (existing[0].rows.length > 0) {
    return
    throw new Error("User already clocked in");
  }

  const now = new Date().toISOString();
  let clockId = uuidv4()
  const insertQuery = `
    INSERT INTO Clock (
      clock_id,
      user_id,
      business,
      check_in_time,
      check_out_time,
      synced,
      createdAt,
      updatedAt
    )
    VALUES (?,?, ?, ?, NULL, ?, ?, ?)
  `;

  await db.executeSql(insertQuery, [
    clockId,
    item.user_id,
    item.business_id,
    now,
    0,
    now,
    now,
  ]);
};
export const clockOut = async (user_id: string) => {
  const db = await getDBConnection();
  const now = new Date().toISOString();

  // 1. Find the latest open clock record
  const selectQuery = `
    SELECT id FROM Clock
    WHERE user_id = ?
    AND check_out_time IS NULL
    ORDER BY createdAt DESC
    LIMIT 1
  `;
  const result = await db.executeSql(selectQuery, [user_id]);

  if (result[0].rows.length > 0) {
    const clockId = result[0].rows.item(0).id;

    // 2. Update that record
    const updateQuery = `
      UPDATE Clock
      SET check_out_time = ?, updatedAt = ?
      WHERE id = ?
    `;
    await db.executeSql(updateQuery, [now, now, clockId]);
  }
};


export const saveUserItems = async (
  item: UserItem
): Promise<UserItem[]> => {

  const db = await getDBConnection();

  const trimmedName = item.name.trim();
  const createdBy = await AsyncStorage.getItem("userId");
  const now = new Date().toISOString();

  const user_id = uuidv4();

  // check if user exists
  const checkQuery = `
    SELECT COUNT(*) as count 
    FROM User 
    WHERE LOWER(name) = LOWER(?) 
    AND business_id = ?
  `;

  const checkResult = await db.executeSql(checkQuery, [
    trimmedName,
    item.business_id
  ]);

  const count = checkResult[0].rows.item(0).count;

  if (count > 0) {
    throw new Error(`User "${trimmedName}" already exists`);
  }

  const synced = 0;

  const insertQuery = `
    INSERT INTO User
    (
      name,
      user_id,
      business_id,
      createdBy,
      phone_number,
      role,
      email,
      synced,
      createdAt,
      updatedAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await db.executeSql(insertQuery, [
    trimmedName,
    user_id,
    item.business_id || "",
    createdBy,
    item.phone_number || "",
    item.role || "",
    item.email || "",
    synced,
    now,
    now
  ]);

  return await getUsers(db);
};

export const softDeleteUser = async (
  id: any
) => {
  const db = await getDBConnection();
  await db.executeSql(
    `UPDATE User 
     SET deleted_at = datetime('now'),  synced = 0, updatedAt = datetime('now') 
     WHERE user_id = ?`,
    [id]
  );
};

