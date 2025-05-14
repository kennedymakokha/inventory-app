import { SQLiteDatabase } from "react-native-sqlite-storage";
import { ProductItem } from "../../models";
import { getNow } from "../../utils";
import { syncData } from "./sync.service";
import { pullServerUpdates } from "./pull.service";
import Papa from 'papaparse';
import RNFS from 'react-native-fs'; // Already included in many RN setups
import { pick, types, keepLocalCopy } from '@react-native-documents/picker';
import AsyncStorage from "@react-native-async-storage/async-storage";



export const createSyncTable = async (db: SQLiteDatabase) => {
    // create table if not exists
    const query = `CREATE TABLE IF NOT EXISTS sync_meta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    last_sync TEXT
  );`;
    await db.executeSql(query);
};

export const setLastSyncTime = (db: SQLiteDatabase, timestamp: string) => {
    db.transaction(tx => {
        tx.executeSql(
            `INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)`,
            ['last_sync', timestamp],
        );
    });
};

export const getLastSyncTime = (db: SQLiteDatabase): Promise<string | null> => {
    return new Promise((resolve, reject) => {
        db.transaction(tx => {
            tx.executeSql(
                `SELECT value FROM sync_meta WHERE key = ?`,
                ['last_sync'],
                (_, results) => {
                    if (results.rows.length > 0) {
                        resolve(results.rows.item(0).value);
                    } else {
                        resolve(null);
                    }
                },
                (_, error) => {
                    reject(error);
                    return false;
                }
            );
        });
    });
};


export const sync = async (db: SQLiteDatabase) => {
    await db.executeSql(`INSERT INTO sync_status (last_sync) VALUES (datetime('now'))`);
};
export const Unsyncsync = async (db: SQLiteDatabase) => {
    await db.executeSql(`DELETE FROM sync_status`);
};
export const createProductTable = async (db: SQLiteDatabase) => {
    // create table if not exists
    const query = `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_name TEXT NOT NULL UNIQUE,
      price REAL NOT NULL,
      Bprice REAL NOT NULL,
      createdBy TEXT NOT NULL ,
      synced INTEGER NOT NULL,
      description TEXT,
      product_id TEXT,
      quantity REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiryDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`;

    await db.executeSql(query);
};
export const getProducts = async (db: SQLiteDatabase): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {

            tx.executeSql(
                `SELECT * FROM products `,
                [],
                (_: any, { rows }: any) => {
                    const allProducts = rows.raw();
                    resolve(allProducts);
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
export const getSychedProducts = async (db: SQLiteDatabase, offset: any): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {

            tx.executeSql(
                `SELECT * FROM products WHERE synced = 1 `,
                [],
                (_: any, { rows }: any) => {
                    const allProducts = rows.raw(); // Already a usable array
                    // console.log("📦 Unsynced products:", allProducts);
                    resolve(allProducts);            // ✅ send to frontend or caller
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
export const getUnsyncedProducts = async (db: SQLiteDatabase, offset: any): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {

            tx.executeSql(
                `SELECT * FROM products WHERE synced = 0 `,
                [],
                (_: any, { rows }: any) => {
                    const allProducts = rows.raw(); // Already a usable array
                    // console.log("📦 Unsynced products:", allProducts);
                    resolve(allProducts);            // ✅ send to frontend or caller
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
export const saveProductItems = async (
    db: SQLiteDatabase,
    item: ProductItem
): Promise<ProductItem[]> => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1000);

    try {

        const trimmedName = item.product_name.trim();
        const createdBy = await AsyncStorage.getItem('userId');
        const now = new Date().toISOString();
        const initial_stock = item.initial_stock
        const synced = 0;
        const expiryDate = item.expiryDate === '' ? futureDate.toISOString() : item.expiryDate
        item = {
            ...item,
            product_name: trimmedName,
            quantity: 0,
            synced: false,
            createdBy: createdBy || '',
        };

        // 1. Check if product exists
        const checkQuery = `SELECT COUNT(*) as count FROM products WHERE LOWER(product_name) = LOWER(?)`;
        const checkResult = await db.executeSql(checkQuery, [trimmedName]);
        const count = checkResult[0].rows.item(0).count;

        if (count > 0) {
            throw new Error(`❗ Product "${trimmedName}" already exists.`);
        }

        // 2. Insert into products
        const insertProductQuery = `
        INSERT INTO products 
        (product_name, price, Bprice,product_id, createdBy, description, quantity, synced,expiryDate, created_at, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
        await db.executeSql(insertProductQuery, [
            trimmedName,
            parseFloat(item.price),
            parseFloat(String(item.Bprice || '0')),
            "",
            item.createdBy,
            item.description || '',
            initial_stock,
            synced,
            expiryDate,
            now,
            now,
        ]);

        // 3. Get product ID
        const productIdResult = await db.executeSql(`SELECT id FROM products WHERE LOWER(product_name) = LOWER(?)`, [trimmedName]);
        const productId = productIdResult[0].rows.item(0).id;

        // 4. Insert into inventory with initial stock
        const insertInventoryQuery = `
        INSERT INTO inventory 
        (product_id, quantity, synced,expiryDate, createdBy, created_at, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
        await db.executeSql(insertInventoryQuery, [productId, initial_stock, 0, expiryDate, item.createdBy, now, now]);

        // 5. Return updated products
        return await getProducts(db);

    } catch (error: any) {
        console.error('❌ Error saving product:', error.message || error);
        throw error;
    }
};

export const softDeleteProduct = async (db: SQLiteDatabase, id: number) => {
    await db.executeSql(
        `UPDATE products SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
        [id]
    );
};


export const markProductAsSynced = (id: number, db: SQLiteDatabase) => {
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {
            tx.executeSql(
                'UPDATE products SET synced = 1 WHERE id = ?',
                [id],
                (_: any, result: any) => resolve(result),
                (_: any, error: any) => reject(error)
            );
        });
    });
};



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
//                 quantity: row.quantity?.toString() || '0',
//                 Bprice: row.Bprice?.toString() || '0',
//                 createdBy: row.createdBy?.toString() || '0',
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


export const insertInventory = (product: string, quantity: number, db: SQLiteDatabase,) => {
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {
            tx.executeSql(
                'INSERT INTO inventory (product, quantity, synced, updatedAt) VALUES (?, ?, 0, ?)',
                [product, quantity, getNow()],
                (_: any, result: any) => resolve(result),
                (_: any, error: any) => reject(error)
            );
        });
    });
};

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



