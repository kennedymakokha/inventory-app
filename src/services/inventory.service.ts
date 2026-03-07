import { SQLiteDatabase } from "react-native-sqlite-storage";
import { InventoryItem } from "../../models";
import { getDBConnection } from "./db-service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createTableIfNotExists } from "../utils/tableExists";


export const createInventoryTable = async () => {
  try {
    const db = await getDBConnection();
    await createTableIfNotExists(
      db,
      'Inventory',
      `CREATE TABLE Inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inventory_id TEXT UNIQUE,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        createdBy TEXT NOT NULL ,
      synced INTEGER NOT NULL,
      expiryDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`
    );
  } catch (err) {
    console.error('❌ createInventoryTable failed:', err);
    throw err;
  }
};

export const getinventories = async (db: SQLiteDatabase): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                `SELECT 
              Inventory.id AS inventory_id,
              Inventory.product_id,
              products.product_name,
              products.quantity AS product_quantity,
              products.price AS product_price,
              Inventory.created_at,
              Inventory.updatedAt
           FROM Inventory
           JOIN products ON Inventory.product_id = products.id
           ORDER BY Inventory.updatedAt DESC
           LIMIT 10;`,
                [],
                (_: any, { rows }: any) => {
                    const allItems = rows.raw();
                    resolve(allItems);
                },
                (_: any, error: any) => {
                    console.error("❌ SELECT failed:", error);
                    reject(error);
                    return true;
                }
            );
        });
    });
};

export const getSychedinventories = async (db: SQLiteDatabase, offset: any): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {

            tx.executeSql(
                `SELECT * FROM Inventory WHERE synced = 1 `,
                [],
                (_: any, { rows }: any) => {
                    const allinventory = rows.raw(); // Already a usable array
                    // console.log("📦 Unsynced inventory:", allinventory);
                    resolve(allinventory);            // ✅ send to frontend or caller
                },
                (_: any, error: any) => {
                    console.error("❌ SELECT failed:", error);
                    reject(error);
                    return true;
                }
            );
        });
    });
};
export const getUnsyncedInventory = async (db: SQLiteDatabase, offset: any): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {

            tx.executeSql(
                `SELECT * FROM Inventory WHERE synced = 0 `,
                [],
                (_: any, { rows }: any) => {
                    const allinventory = rows.raw(); // Already a usable array
                    // console.log("📦 Unsynced inventory:", allinventory);
                    resolve(allinventory);            // ✅ send to frontend or caller
                },
                (_: any, error: any) => {
                    console.error("❌ SELECT failed:", error);
                    reject(error);
                    return true;
                }
            );
        });
    });
};





export const updateItemQuantity = (db: SQLiteDatabase, id: number, incomingQuantity: number) => {
    db.transaction(tx => {
        // Update quantity by adding incoming value to current quantity
        tx.executeSql(
            "UPDATE products SET quantity = quantity + ? WHERE id = ?",
            [incomingQuantity, id],
            (_, result) => {
                if (result.rowsAffected > 0) {
                    console.log("Quantity updated successfully");
                } else {
                    console.log("Item not found");
                }
            },
            (_, error) => console.log("Error updating quantity: ", error)
        );
    });
};

export const saveInventoryItem = async (
    db: SQLiteDatabase,
    item: InventoryItem
): Promise<InventoryItem[]> => {
    try {
        const now = new Date().toISOString();

        item.synced = false;
        item.createdBy = await AsyncStorage.getItem('userId')
        await db.transaction(async tx => {
            // 1. Insert into inventory
            await tx.executeSql(
                `INSERT OR REPLACE INTO Inventory 
           (product_id, quantity, synced,expiryDate,createdBy, created_at, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    item.product_id,
                    parseFloat(item.quantity),
                    item.synced ? 1 : 0,
                    item.expiryDate,
                    item.createdBy,
                    now,
                    now
                ]
            );
            const db = await getDBConnection();
            await updateItemQuantity(db, parseInt(item.product_id), parseFloat(item.quantity))

        });

        // 3. Return updated inventory list
        return await getinventories(db);

    } catch (error) {
        console.error('❌ Error saving inventory item:', error);
        throw error;
    }
};

export const getInventoriesByProductId = (
    product_id: number | string,
    db: SQLiteDatabase
): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                'SELECT * FROM Inventory WHERE product_id = ?  ORDER BY Inventory.updatedAt DESC'
                ,
                [product_id],
                (_, results) => {
                    const inventories = results.rows.raw(); // get raw array
                    resolve(inventories);
                },
                (_, error) => {
                    console.error("Error fetching inventories:", error);
                    reject(error);
                    return true;
                }
            );
        });
    });
};
export const softDeleteProduct = async (db: SQLiteDatabase, id: number) => {
    await db.executeSql(
        `UPDATE products SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
        [id]
    );
};

