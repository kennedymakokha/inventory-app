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
    console.error('❌ createUserTable failed:', err);
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

    console.log("✅ User updated locally");
  } catch (error) {
    console.log("❌ updateUser failed:", error);
    throw error;
  }
};





export const getUsers = async (
  db: SQLiteDatabase
): Promise<any[]> => {
  const result = await db.executeSql(`SELECT * FROM User WHERE deleted_at IS NULL`);
  return result[0].rows.raw();
};





export const saveUserItems = async (

  item: UserItem,

): Promise<UserItem[]> => {
  
    const db = await getDBConnection();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1000);

    const trimmedName = item.name.trim();
    const createdBy = await AsyncStorage.getItem("userId");
    const now = new Date().toISOString();

    const user_id = uuidv4();

    const checkQuery =
      `SELECT COUNT(*) as count FROM User WHERE LOWER(name) = LOWER(?)`;

    const checkResult = await db.executeSql(checkQuery, [trimmedName]);
    const count = checkResult[0].rows.item(0).count;

    if (count > 0) {
      throw new Error(`User "${trimmedName}" already exists`);
    }

  
    let synced = 0;

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
      createdBy,
      synced,
      createdAt,
      updatedAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)
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
      now,
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

