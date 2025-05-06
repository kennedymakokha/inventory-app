import { SQLiteDatabase } from "react-native-sqlite-storage";
import { InventoryItem, ProductItem } from "../../models";
import { getNow } from "../../utils";
import { syncData } from "./sync.service";
import { pullServerUpdates } from "./pull.service";
import Papa from 'papaparse';
import RNFS from 'react-native-fs'; // Already included in many RN setups
import { pick, types, keepLocalCopy } from '@react-native-documents/picker';
import { getDBConnection } from "./db-service";

export const createInventoryTable = async (db: SQLiteDatabase) => {
    // create table if not exists
    const query = `CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
      synced INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`;

    await db.executeSql(query);
};

export const getinventories = async (db: SQLiteDatabase): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                `SELECT 
              inventory.id AS inventory_id,
              inventory.product_id,
              products.product_name,
              products.quantity AS product_quantity,
              products.price AS product_price,
              inventory.created_at,
              inventory.updatedAt
           FROM inventory
           JOIN products ON inventory.product_id = products.id
           ORDER BY inventory.updatedAt DESC
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
                `SELECT * FROM inventory WHERE synced = 1 `,
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
export const getUnsynced = async (db: SQLiteDatabase, offset: any): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {

            tx.executeSql(
                `SELECT * FROM inventory WHERE synced = 0 `,
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

        await db.transaction(async tx => {
            // 1. Insert into inventory
            await tx.executeSql(
                `INSERT OR REPLACE INTO inventory 
           (product_id, quantity, synced, created_at, updatedAt)
           VALUES (?, ?, ?, ?, ?)`,
                [
                    item.product_id,
                    parseFloat(item.quantity),
                    item.synced ? 1 : 0,
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

// export const saveInventoryItem = async (
//     db: SQLiteDatabase,
//     item: InventoryItem
// ): Promise<InventoryItem[]> => {
//     try {
//         const now = new Date().toISOString();
//         item.synced = false;

//         await db.transaction(async tx => {
//             // 1. Insert into inventory
//             await tx.executeSql(
//                 `INSERT OR REPLACE INTO inventory 
//            (product_id, quantity, synced, created_at, updatedAt)
//            VALUES (?, ?, ?, ?, ?)`,
//                 [
//                     item.product_id,
//                     parseFloat(item.quantity),
//                     item.synced ? 1 : 0,
//                     now,
//                     now
//                 ]
//             );


//         });

//         // 3. Return updated inventory list
//         return await getinventories(db);

//     } catch (error) {
//         console.error('❌ Error saving inventory item:', error);
//         throw error;
//     }
// };


// export const saveInventoryItem = async (
//     db: SQLiteDatabase,
//     item: InventoryItem
// ): Promise<InventoryItem[]> => {
//     try {
//         const now = new Date().toISOString();
//         item.synced = false;
//         const insertQuery = `
//         INSERT OR REPLACE INTO inventory 
//         (product_id, quantity, synced, created_at, updatedAt)
//         VALUES (?, ?, ?, ?, ?)`;
//         await db.executeSql(insertQuery, [
//             item.product_id,
//             parseFloat(item.quantity),
//             item.synced ? 1 : 0,
//             now,
//             now
//         ]);
//         console.log(await getinventories(db))
//         return await getinventories(db);
//     } catch (error) {
//         console.error('❌ Error saving inventory item:', error);
//         throw error;
//     }
// };

export const softDeleteProduct = async (db: SQLiteDatabase, id: number) => {
    await db.executeSql(
        `UPDATE products SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
        [id]
    );
};


// export const markProductAsSynced = (id: number, db: SQLiteDatabase) => {
//     console.log(id)
//     return new Promise((resolve, reject) => {
//         db.transaction((tx: any) => {
//             tx.executeSql(
//                 'UPDATE products SET synced = 1 WHERE id = ?',
//                 [id],
//                 (_: any, result: any) => resolve(result),
//                 (_: any, error: any) => reject(error)
//             );
//         });
//     });
// };
// export const fullSync = async () => {
//     try {
//         console.log('🔄 Starting full sync...');
//         await syncData();           // Push unsynced local changes
//         await pullServerUpdates();  // Pull latest server changes
//         console.log('✅ Full sync complete.');
//     } catch (err) {
//         console.error('❌ Full sync failed:', err);
//     }
// };


// export const handleCSVUpload = async (db: SQLiteDatabase) => {
//     try {
//         const [res] = await pick({
//             type: [types.plainText, types.csv], // Accept plain text and CSV files
//         });

//         const filePath = res.uri;

//         // iOS may prefix with "file://", Android might use content://
//         const fileContent = await RNFS.readFile(decodeURIComponent(filePath.replace('file://', '')), 'utf8');

//         const results = Papa.parse(fileContent, {
//             header: true,
//             skipEmptyLines: true,
//         });

//         const rows = results.data as Array<Record<string, any>>;

//         for (const row of rows) {
//             const product = {
//                 product_name: row.product_name,
//                 price: row.price?.toString() || '0',
//                 description: row.description || '',
//                 synced: false
//             };
//             await saveProductItems(db, product);
//         }

//         console.log("✅ CSV imported successfully.");
//     } catch (err: any) {
//         if (err.code === 'USER_CANCELLED') {
//             console.log("⚠️ User cancelled the picker");
//         } else {
//             console.log(err)
//             console.error("❌ Failed to import CSV:", err);
//         }
//     }
// };


// export const insertInventory = (product: string, quantity: number, db: SQLiteDatabase,) => {
//     return new Promise((resolve, reject) => {
//         db.transaction((tx: any) => {
//             tx.executeSql(
//                 'INSERT INTO inventory (product, quantity, synced, updatedAt) VALUES (?, ?, 0, ?)',
//                 [product, quantity, getNow()],
//                 (_: any, result: any) => resolve(result),
//                 (_: any, error: any) => reject(error)
//             );
//         });
//     });
// };

// export const getUnsyncedInventory = (db: SQLiteDatabase,): Promise<any[]> => {
//     return new Promise((resolve, reject) => {
//         db.transaction((tx: any) => {
//             tx.executeSql(
//                 'SELECT * FROM inventory WHERE synced = 0',
//                 [],
//                 (_: any, { rows }: any) => resolve(rows._array),
//                 (_: any, error: any) => reject(error)
//             );
//         });
//     });
// };

// export const markInventoryAsSynced = (id: number, db: SQLiteDatabase,) => {
//     return new Promise((resolve, reject) => {
//         db.transaction((tx: any) => {
//             tx.executeSql(
//                 'UPDATE inventory SET synced = 1 WHERE id = ?',
//                 [id],
//                 (_: any, result: any) => resolve(result),
//                 (_: any, error: any) => reject(error)
//             );
//         });
//     });
// };



