import { SQLiteDatabase } from "react-native-sqlite-storage";
import { CategoryItem, NotificationItem } from "../../models";
import { getNow } from "../../utils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@env";
import { authorizedFetch } from "../middleware/auth.middleware";
import NetInfo from "@react-native-community/netinfo";
import { getDBConnection } from "./db-service";
import { createTableIfNotExists } from "../utils/tableExists";

import { v4 as uuidv4 } from "uuid";
import { SalesFilter } from "./analytics.service";



/* -------------------------- */
/* CREATE TABLES */
/* -------------------------- */



export const createNotificationTable = async () => {
  try {
    const db = await getDBConnection();
    await createTableIfNotExists(
      db,
      'Notification',
      `CREATE TABLE Notification (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT COLLATE NOCASE,
          notification_id TEXT UNIQUE,
          user_id TEXT, 
          business TEXT,
          type TEXT,
          unread INTEGER DEFAULT 1,
          createdBy TEXT,
          description TEXT,
          synced INTEGER DEFAULT 0,
          createdAt TEXT,
          updatedAt TEXT,
          deleted_at TEXT,
          UNIQUE (notification_id, business)
      );`
    );
  } catch (err) {
    console.error(' create Notification Table failed:', err);
    throw err;
  }
};



export const getNotifications = async (

): Promise<any[]> => {
  const db = await getDBConnection();
  const result = await db.executeSql(`SELECT * FROM Notification WHERE deleted_at IS NULL`);
  return result[0].rows.raw();
};

export const getNotificationsById = async (
  userId?: string,
  type?: string, // used ONLY for filtering the list
  filter: SalesFilter = "today",
  customDate?: string,
  startDate?: string,
  endDate?: string
): Promise<{
  notifications: any[];
  counts: Record<string, number>;
}> => {
  const db = await getDBConnection();

  let baseConditions: string[] = ["deleted_at IS NULL"];
  const baseParams: any[] = [];

  // 👤 User filter (applies to BOTH)
  if (userId) {
    baseConditions.push("user_id = ?");
    baseParams.push(userId);
  }

  // 📅 Date filter (applies to BOTH)
  switch (filter) {
    case "today":
      baseConditions.push(`date(createdAt,'localtime') = date('now','localtime')`);
      break;

    case "week":
      baseConditions.push(`strftime('%Y-%W', createdAt) = strftime('%Y-%W', 'now')`);
      break;

    case "month":
      baseConditions.push(`strftime('%Y-%m', createdAt) = strftime('%Y-%m', 'now')`);
      break;

    case "year":
      baseConditions.push(`strftime('%Y', createdAt) = strftime('%Y', 'now')`);
      break;

    case "custom":
      baseConditions.push(`date(createdAt) = date(?)`);
      baseParams.push(customDate);
      break;

    case "range":
      baseConditions.push(`date(createdAt) BETWEEN date(?) AND date(?)`);
      baseParams.push(startDate, endDate);
      break;
  }

  const baseWhere = `WHERE ${baseConditions.join(" AND ")}`;

  // =========================
  // 1️⃣ COUNTS (NO TYPE FILTER)
  // =========================
  const countQuery = `
    SELECT type, COUNT(*) as count
    FROM Notification
    ${baseWhere}
    GROUP BY type
 `;

  const [countResult] = await db.executeSql(countQuery, baseParams);

  const counts: Record<string, number> = {};
  countResult.rows.raw().forEach((row: any) => {
    counts[row.type] = row.count;
  });

  // =========================
  // 2️⃣ NOTIFICATIONS LIST (WITH TYPE FILTER)
  // =========================
  let listConditions = [...baseConditions];
  const listParams = [...baseParams];

  if (type) {
    listConditions.push("type = ?");
    listParams.push(type);
  }

  const listWhere = `WHERE ${listConditions.join(" AND ")}`;

  const listQuery = `
    SELECT *
    FROM Notification
    ${listWhere}
    ORDER BY createdAt DESC
  `;

  const [listResult] = await db.executeSql(listQuery, listParams);

  return {
    notifications: listResult.rows.raw(),
    counts,
  };
};

/* -------------------------- */
/* CREATE NOTIFICATION */
/* -------------------------- */

export const saveNotification = async (

  item: NotificationItem,

): Promise<NotificationItem[]> => {
  const db = await getDBConnection();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1000);

  const trimmedName = item.title.trim();
  const createdBy = await AsyncStorage.getItem("userId");
  const now = new Date().toISOString();

  const notification_id = uuidv4();


  let synced = 0;

  const insertQuery = `
    INSERT INTO Notification
    (
      title,
      notification_id,
      business,
      createdBy,
      description,
      synced,
      type,
      user_id,
      createdAt,
      updatedAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?)
  `;

  await db.executeSql(insertQuery, [
    trimmedName,
    notification_id,
    item.business_id || "",
    createdBy,
    item.description || "",
    synced,
    item.type,
    item.user_id || "",
    now,
    now,
  ]);

  return await getNotifications();
};

/* -------------------------- */
/* DELETE */
/* -------------------------- */


// export const softDeleteCategory = async (
//   id: any
// ) => {
//   const db = await getDBConnection();
//   await db.executeSql(
//     `UPDATE Category 
//      SET deleted_at = datetime('now'),  synced = 0, updatedAt = datetime('now') 
//      WHERE category_id = ?`,
//     [id]
//   );
// };


export const ReadNotification = async (
  id: any
) => {
  const db = await getDBConnection();
  await db.executeSql(
    `UPDATE Notification 
     SET unread = 0,  synced = 0, updatedAt = datetime('now') 
     WHERE notification_id = ?`,
    [id]
  );
};

