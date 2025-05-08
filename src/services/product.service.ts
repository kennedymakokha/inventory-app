import { SQLiteDatabase } from "react-native-sqlite-storage";
import { ProductItem } from "../../models";
import { getNow } from "../../utils";
import { syncData } from "./sync.service";
import { pullServerUpdates } from "./pull.service";
import Papa from 'papaparse';
import RNFS from 'react-native-fs'; // Already included in many RN setups
import { pick, types, keepLocalCopy } from '@react-native-documents/picker';
import AsyncStorage from "@react-native-async-storage/async-storage";

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
      quantity REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
    try {
        const trimmedName = item.product_name.trim();
        item.synced = false;
        item.quantity = 0;
        item.createdBy = await AsyncStorage.getItem('userId')

        // 1. Check if product already exists (case-insensitive)
        const checkQuery = `SELECT COUNT(*) as count FROM products WHERE LOWER(product_name) = LOWER(?)`;
        const checkResult = await db.executeSql(checkQuery, [trimmedName]);
        const count = checkResult[0].rows.item(0).count;

        if (count > 0) {
            throw new Error(`❗ Product "${trimmedName}" already exists.`);
        }

        // 2. Insert product
        const insertQuery = `
        INSERT INTO products 
        (product_name, price,Bprice,createdBy, description, quantity, synced, created_at, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

        await db.executeSql(insertQuery, [
            trimmedName,
            parseFloat(item.price),
            item.Bprice,
            item.createdBy,
            item.description,
            item.quantity,
            item.synced ? 1 : 0,
            new Date().toISOString(),
            new Date().toISOString()
        ]);

        // 3. Return updated product list
        return await getProducts(db);

    } catch (error) {
        console.error('❌ Error saving product:', error);
        throw error;
    }
};

// export const saveProductItems = async (
//     db: SQLiteDatabase,
//     item: ProductItem
// ): Promise<ProductItem[]> => {
//     try {

//         const trimmedName = item.product_name.trim();
//         item.synced = false;
//         item.quantity = 0
//         // 1. Check for existing product
//         const checkQuery = `SELECT COUNT(*) as count FROM products WHERE LOWER(product_name) = LOWER(?)`;
//         const checkResult = await db.executeSql(checkQuery, [trimmedName]);
//         const count = checkResult[0].rows.item(0).count;

//         if (count > 0) {
//             throw new Error(`❗ Product "${trimmedName}" already exists.`);
//         }

//         // 2. Insert product
//         const insertQuery = `
//         INSERT OR REPLACE INTO products 
//         (product_name, price, description,quantity, synced, created_at, updatedAt)
//         VALUES (?, ?, ?, ?, ?, ?, ?)
//       `;

//         await db.executeSql(insertQuery, [
//             trimmedName,
//             parseFloat(item.price),
//             item.description,
//             item.quantity,
//             item.synced ? 1 : 0,
//             new Date().toISOString(),
//             new Date().toISOString()
//         ]);

//         // 3. Return updated list
//         return await getProducts(db);
//     } catch (error) {
//         console.error('❌ Error saving product:', error);
//         throw error;
//     }
// };
export const softDeleteProduct = async (db: SQLiteDatabase, id: number) => {
    await db.executeSql(
        `UPDATE products SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
        [id]
    );
};


export const markProductAsSynced = (id: number, db: SQLiteDatabase) => {
    console.log(id)
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
export const fullSync = async () => {
    try {
        console.log('🔄 Starting full sync...');
        await syncData();           // Push unsynced local changes
        await pullServerUpdates();  // Pull latest server changes
        console.log('✅ Full sync complete.');
    } catch (err) {
        console.error('❌ Full sync failed:', err);
    }
};


export const handleCSVUpload = async (db: SQLiteDatabase) => {
    try {
        const [res] = await pick({
            type: [types.plainText, types.csv], // Accept plain text and CSV files
        });

        const filePath = res.uri;

        // iOS may prefix with "file://", Android might use content://
        const fileContent = await RNFS.readFile(decodeURIComponent(filePath.replace('file://', '')), 'utf8');

        const results = Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
        });

        const rows = results.data as Array<Record<string, any>>;

        for (const row of rows) {
            const product = {
                product_name: row.product_name,
                price: row.price?.toString() || '0',
                quantity: row.quantity?.toString() || '0',
                Bprice: row.Bprice?.toString() || '0',
                createdBy: row.createdBy?.toString() || '0',
                description: row.description || '',
                synced: false
            };
            await saveProductItems(db, product);
        }

        console.log("✅ CSV imported successfully.");
    } catch (err: any) {
        if (err.code === 'USER_CANCELLED') {
            console.log("⚠️ User cancelled the picker");
        } else {
            console.log(err)
            console.error("❌ Failed to import CSV:", err);
        }
    }
};


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

export const getUnsyncedInventory = (db: SQLiteDatabase,): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {
            tx.executeSql(
                'SELECT * FROM inventory WHERE synced = 0',
                [],
                (_: any, { rows }: any) => resolve(rows._array),
                (_: any, error: any) => reject(error)
            );
        });
    });
};

export const markInventoryAsSynced = (id: number, db: SQLiteDatabase,) => {
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {
            tx.executeSql(
                'UPDATE inventory SET synced = 1 WHERE id = ?',
                [id],
                (_: any, result: any) => resolve(result),
                (_: any, error: any) => reject(error)
            );
        });
    });
};



