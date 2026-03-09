import { SQLiteDatabase } from "react-native-sqlite-storage";
import { InventoryItem } from "../../models";
import { getDBConnection } from "./db-service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createTableIfNotExists } from "../utils/tableExists";

export const createInventorylogTable = async () => {
    try {
        const db = await getDBConnection();

        await createTableIfNotExists(
            db,
            'Inventory_log',
            `CREATE TABLE Inventory_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inventory_log_id TEXT UNIQUE,
        product_id TEXT,
        type TEXT,
        business TEXT,
        reference_id TEXT,
        reference_type TEXT,
        quantity INTEGER DEFAULT 0,
        synced INTEGER DEFAULT 0,
        note TEXT,
        createdAt TEXT,
        createdBy TEXT,
        updatedAt TEXT
      );`
        );

        // Create unique index to prevent duplicate INITIAL_STOCK entries
        await db.executeSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_initial_stock
      ON Inventory_log(product_id, reference_type)
      WHERE reference_type = 'INITIAL_STOCK';
    `);

    } catch (err) {
        console.error('❌ createInventorylogTable failed:', err);
        throw err;
    }
};

export const getInventory = async (
    db: SQLiteDatabase,
    productId: number,
    page: number = 1,
    limit: number = 20
): Promise<any[]> => {

    const offset = (page - 1) * limit;

    const result = await db.executeSql(
        `SELECT product_id, COUNT(*) 
FROM Inventory_log
GROUP BY product_id;`
    );

    return result[0].rows.raw();
};
export const getInventoryLogs = async (
    db: SQLiteDatabase,
    productId: string,
    page: number = 1,
    limit: number = 20
): Promise<any[]> => {
    const offset = (page - 1) * limit;

    const result = await db.executeSql(
        `SELECT * FROM Inventory_log
     WHERE TRIM(product_id) = ?
     ORDER BY createdAt DESC
     LIMIT ? OFFSET ?`,
        [productId, limit, offset]
    );

    return result[0].rows.raw();
};


export const getGroupedInventoryLogs = async (
    db: SQLiteDatabase,
    page: number = 1,
    limit: number = 20
): Promise<any[]> => {

    const offset = (page - 1) * limit;

    const result = await db.executeSql(
        `SELECT 
            l.product_id,
            p.product_name,
            p.expiryDate,
            SUM(
              CASE 
                WHEN l.type = 'SALE' THEN -l.quantity
                ELSE l.quantity
              END
            ) as qty
        FROM Inventory_log l
        LEFT JOIN Product p 
            ON l.product_id = p.product_id
        GROUP BY l.product_id
        ORDER BY p.product_name ASC
        LIMIT ? OFFSET ?`,
        [limit, offset]
    );

    return result[0].rows.raw();
};










