import { SQLiteDatabase } from "react-native-sqlite-storage";
import { CategoryItem, ProductItem } from "../../models";
import { getNow } from "../../utils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@env";
import { authorizedFetch } from "../middleware/auth.middleware";
import NetInfo from '@react-native-community/netinfo';

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


function createUniqueId() {
    var date = new Date().getTime();
    var uniqueId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
            var r = (date + Math.random() * 16) % 16 | 0;
            date = Math.floor(date / 16);
            return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
        }
    );
    return uniqueId;
}
export const sync = async (db: SQLiteDatabase) => {
    await db.executeSql(`INSERT INTO sync_status (last_sync) VALUES (datetime('now'))`);
};
export const Unsyncsync = async (db: SQLiteDatabase) => {
    await db.executeSql(`DELETE FROM sync_status`);
};
export const createCategoryTable = async (db: SQLiteDatabase) => {
    const query = `
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_name TEXT COLLATE NOCASE,
        category_id TEXT,
        business_id TEXT,
        createdBy TEXT,
        description TEXT,
        synced INTEGER,
        expiryDate TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        UNIQUE (category_name, business_id)
      );
    `;

    await db.executeSql(query);
};

export const syncUnsyncedCategories = async (db: SQLiteDatabase, sync: any) => {
    const results = await db.executeSql(`SELECT * FROM categories WHERE synced = 0`);
    const rows = results[0].rows;

    const unsyncedCategories = [];
    for (let i = 0; i < rows.length; i++) {
        unsyncedCategories.push(rows.item(i));
    }

    if (unsyncedCategories.length === 0) return;

    try {
        const response = await authorizedFetch(`${API_URL}/api/categories/bulk`, {
            method: 'POST',
            body: JSON.stringify({ categories: unsyncedCategories }),
        });

        if (response.success === true) {
            // mark all as synced
            await db.executeSql(`UPDATE categories SET synced = 1 WHERE synced = 0`);
        }
    } catch (err) {
        console.error("❌ Sync error:", err);
    }
};


export const pullUpdatedCategories = async (db: SQLiteDatabase, lastSyncTime: string,) => {
    try {
        const categories = await authorizedFetch(`${API_URL}/api/categories/updated-since?since=${lastSyncTime}`);
        console.log(categories)
        const createdBy = await AsyncStorage.getItem('userId');
        const insertOrUpdate = `
      INSERT INTO categories (
        category_id, category_name, description,business_id,
        quantity, synced, expiryDate, createdAt, updatedAt,createdBy
      )
      VALUES (?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?,?,?)
      ON CONFLICT(category_id) DO UPDATE SET
        category_name=excluded.category_name,
        description=excluded.description,
        quantity=excluded.quantity,
        synced=1,
        expiryDate=excluded.expiryDate,
        updatedAt=excluded.updatedAt,
        createdBy=excluded.createdBy
    `;

        for (const item of categories) {
            await db.executeSql(insertOrUpdate, [
                item.category_id,
                item.category_name,
                item.description,
                item.business_id,
                item.quantity,
                1,
                item.expiryDate,
                item.createdAt,
                item.updatedAt,
                createdBy
            ]);
        }
        console.log("DONE PULLING")
    } catch (error) {
        console.log(error)
    }
};


export const saveLastSyncTime = async (timestamp: string) => {
    await AsyncStorage.setItem("lastSync", timestamp);
};

export const getLastSyncTime = async (): Promise<string> => {
    return (await AsyncStorage.getItem("lastSync")) || "1970-01-01T00:00:00Z";
};

export const syncAllCategories = async (db: SQLiteDatabase, categories: any, sync: any) => {
    const lastSyncTime = await getLastSyncTime();

    await syncUnsyncedCategories(db, sync);
    await pullUpdatedCategories(db, lastSyncTime);
    const newSyncTime = new Date().toISOString();
    await saveLastSyncTime(newSyncTime);
    console.log("DONE")
};



export const getCategories = async (db: SQLiteDatabase): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {

            tx.executeSql(
                `SELECT * FROM categories `,
                [],
                (_: any, { rows }: any) => {
                    const allCategories = rows.raw();
                    resolve(allCategories);
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
export const getSyncedCategories = async (db: SQLiteDatabase, offset: any): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {

            tx.executeSql(
                `SELECT * FROM categories WHERE synced = 1 `,
                [],
                (_: any, { rows }: any) => {
                    const allCategories = rows.raw(); // Already a usable array
                    // console.log("📦 Unsynced products:", allCategories);
                    resolve(allCategories);            // ✅ send to frontend or caller
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
export const getUnsyncedCategories = async (db: SQLiteDatabase, offset: any): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {

            tx.executeSql(
                `SELECT * FROM categories WHERE synced = 0 `,
                [],
                (_: any, { rows }: any) => {
                    const allCategories = rows.raw(); // Already a usable array
                    // console.log("📦 Unsynced categories:", allCategories);
                    resolve(allCategories);            // ✅ send to frontend or caller
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


export const saveCategoryItems = async (
    db: SQLiteDatabase,
    item: CategoryItem,
    postCategoryToMongoDB: any
): Promise<CategoryItem[]> => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1000);

    try {
        const trimmedName = item.category_name.trim();
        const createdBy = await AsyncStorage.getItem('userId');
        const now = new Date().toISOString();
        const category_id = `B4-${createUniqueId()}`;
       
        const expiryDate = item.expiryDate === '' ? futureDate.toISOString() : item.expiryDate;

        item = {
            ...item,
            category_name: trimmedName,
            category_id,
            synced: false,
            createdBy: createdBy || '',
        };

        // 1. Check if product exists locally
        const checkQuery = `SELECT COUNT(*) as count FROM categories WHERE LOWER(category_name) = LOWER(?)`;
        const checkResult = await db.executeSql(checkQuery, [trimmedName]);
        const count = checkResult[0].rows.item(0).count;

        if (count > 0) {
            throw new Error(`❗ Category "${trimmedName}" already exists.`);
        }

        // 2. Check network status
        const state = await NetInfo.fetch();
        let synced = 0;

        if (state.isConnected) {
            // 3. Attempt to sync with MongoDB
            try {
                await postCategoryToMongoDB({
                    ...item,
                    category_id,
                    business_id:item.business_id,
                    expiryDate,
                    createdBy,
                    createdAt: now,
                    updatedAt: now,
                    
                });
                synced = 1;
            } catch (mongoError) {
                console.warn('⚠️ MongoDB sync failed, saving locally only:', mongoError);
            }
        }

        // 4. Insert into categories
        const insertCategoryQuery = `
        INSERT INTO categories 
        (category_name, category_id, business_id, createdBy, description,  synced, expiryDate, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
        await db.executeSql(insertCategoryQuery, [
            trimmedName,
            category_id,
            item.business_id || '',
            createdBy,
            item.description || '',
            synced,
            expiryDate,
            now,
            now,
        ]);

        // 5. Get local DB category ID
        const categoryIdResult = await db.executeSql(`SELECT id FROM categories WHERE LOWER(category_name) = LOWER(?)`, [trimmedName]);
        const categoryId = categoryIdResult[0].rows.item(0).id;

      

        // 7. Return updated products
        return await getCategories(db);

    } catch (error: any) {
        console.error('❌ Error saving category:', error.message || error);
        throw error;
    }
};
export const softDeleteCategory = async (db: SQLiteDatabase, id: number) => {
    await db.executeSql(
        `UPDATE categories SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
        [id]
    );
};


export const markCategoryAsSynced = (id: number, db: SQLiteDatabase) => {
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {
            tx.executeSql(
                'UPDATE categories SET synced = 1 WHERE id = ?',
                [id],
                (_: any, result: any) => resolve(result),
                (_: any, error: any) => reject(error)
            );
        });
    });
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


