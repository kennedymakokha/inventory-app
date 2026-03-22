import { SQLiteDatabase } from "react-native-sqlite-storage";
import { CategoryItem, CustomerItem } from "../../models";
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

export const createCustomerTable = async () => {
  try {
    const db = await getDBConnection();
    await createTableIfNotExists(
      db,
      'Customers', // Changed to plural to match your Insert
      `CREATE TABLE Customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_name TEXT COLLATE NOCASE,
          customer_id TEXT UNIQUE,
          sale_id TEXT,
          business TEXT,
          createdBy TEXT,
          transaction_id TEXT,
          phone_number TEXT,
          amount REAL,
          synced INTEGER DEFAULT 0,
          createdAt TEXT,
          updatedAt TEXT,
          deleted_at TEXT
      );` // Removed the trailing comma after deleted_at
    );
  } catch (err) {
    console.error(' createCustomerTable failed:', err);
    throw err;
  }
};

export const getCustomers = async (
 
): Promise<any[]> => {
  // Updated table name to Customers
   const db = await getDBConnection();
  const result = await db.executeSql(`SELECT * FROM Customers WHERE deleted_at IS NULL`);
  return result[0].rows.raw();
};

export const saveCustomer = async (
 
  item: CustomerItem,
): Promise<string> => {
   const db = await getDBConnection();
  const trimmedName = item.customer_name;
  const now = new Date().toISOString();
  const customer_id = uuidv4();

  const insertQuery = `
    INSERT INTO Customers 
    (
      customer_name, 
      customer_id, 
      business, 
      createdBy, 
      transaction_id,
      amount,
      sale_id,
      phone_number, 
      synced, 
      createdAt, 
      updatedAt
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    await db.executeSql(insertQuery, [
      trimmedName,
      customer_id,
      item.business_id || "",
      item.createdBy || "",
      item.transaction_id || "",
      item.amount || 0,
      item.sale_id || "",
      item.phone_number || "",
      0, // synced
      now,
      now,
    ]);

    return customer_id;
  } catch (error) {
    console.error("Failed to save customer to SQLite:", error);
    throw error;
  }
};