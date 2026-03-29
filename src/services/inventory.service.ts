import { SQLiteDatabase } from "react-native-sqlite-storage";
import { getDBConnection } from "./db-service";
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
                batchNumber TEXT,
                expiryDate TEXT,
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
        console.error(' createInventorylogTable failed:', err);
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
        `SELECT *
     FROM Inventory_log
     WHERE product_id = ?
     ORDER BY createdAt DESC
     LIMIT ? OFFSET ?`,
        [productId, limit, offset]
    );

    return result[0].rows.raw();
};
export const getInventoryTotals = async (
    db: SQLiteDatabase,
    productId: string
) => {
    const result = await db.executeSql(
        `SELECT 
        COALESCE(SUM(CASE WHEN reference_type = 'RESTOCK' THEN quantity END), 0) as total_restock,
        COALESCE(SUM(CASE WHEN reference_type = 'SALE' THEN quantity END), 0) as total_sales,
        COALESCE(SUM(CASE WHEN reference_type = 'ADJUSTMENT_IN' THEN quantity END), 0) as total_adjust_in,
        COALESCE(SUM(CASE WHEN reference_type = 'ADJUSTMENT_OUT' THEN quantity END), 0) as total_adjust_out
     FROM Inventory_log
     WHERE product_id = ?`,
        [productId]
    );

    const row = result[0].rows.item(0);

    const computedStock =
        row.total_restock +
        row.total_adjust_in -
        row.total_sales -
        row.total_adjust_out;

    return {
        restock: row.total_restock,
        sales: row.total_sales,
        adjustIn: row.total_adjust_in,
        adjustOut: row.total_adjust_out,
        stock: computedStock
    };
};
// export const getInventoryLogs = async (
//     db: SQLiteDatabase,
//     productId: string,
//     page: number = 1,
//     limit: number = 20
// ): Promise<any[]> => {
//     const offset = (page - 1) * limit;

//     const result = await db.executeSql(
//         `SELECT * FROM Inventory_log
//      WHERE product_id = ?
//      ORDER BY createdAt DESC
//      LIMIT ? OFFSET ?`,
//         [productId, limit, offset]
//     );

//     return result[0].rows.raw();
// };
// export const getFullInventoryLogs = async (

//     page: number = 1,
//     limit: number = 20
// ): Promise<any[]> => {
//      const db = await getDBConnection();
//     const offset = (page - 1) * limit;

//     const result = await db.executeSql(
//         `SELECT * FROM Inventory_log
//      ORDER BY createdAt DESC
//      LIMIT ? OFFSET ?`,
//         [ limit, offset]
//     );

//     return result[0].rows.raw();
// };
export const getFullInventoryLogs = async (
    page: number = 1,
    limit: number = 20
): Promise<any[]> => {
    const db = await getDBConnection();
    const offset = (page - 1) * limit;

    const result = await db.executeSql(
        `SELECT * 
     FROM Inventory_log 
     WHERE reference_type = 'RESTOCK'
        GROUP BY product_id
     LIMIT ? OFFSET ? `,
        [limit, offset]
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
                WHEN l.reference_type = 'SALE' THEN -l.quantity
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










