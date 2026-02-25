import { SQLiteDatabase } from "react-native-sqlite-storage";
import { ProductItem } from "../../models";
import { getNow } from "../../utils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@env";
import { authorizedFetch } from "../middleware/auth.middleware";
import NetInfo from '@react-native-community/netinfo';

// --- TABLE CREATION ---
export const createSyncTable = async (db: SQLiteDatabase) => {
    const query = `CREATE TABLE IF NOT EXISTS sync_meta (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE,
        value TEXT
    );`;
    await db.executeSql(query);
};

export const createProductTable = async (db: SQLiteDatabase) => {
    const query = `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT UNIQUE, 
        product_name TEXT,
        barcode TEXT, -- Added Barcode Column
        price REAL,
        Bprice REAL,
        soldprice REAL,
        category_id TEXT,
        description TEXT,
        quantity INTEGER,
        synced INTEGER, 
        expiryDate TEXT,
        createdAt TEXT,
        createdBy TEXT,
        updatedAt TEXT
    )`;
    await db.executeSql(query);
};

// --- ID GENERATION ---
function createUniqueId() {
    var date = new Date().getTime();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (date + Math.random() * 16) % 16 | 0;
        date = Math.floor(date / 16);
        return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
}

// --- SYNC LOGIC (PUSH) ---
export const syncUnsyncedProducts = async (db: SQLiteDatabase) => {
    const results = await db.executeSql(`SELECT * FROM products WHERE synced = 0`);
    const rows = results[0].rows;
    const unsyncedProducts = [];

    for (let i = 0; i < rows.length; i++) {
        unsyncedProducts.push(rows.item(i));
    }

    if (unsyncedProducts.length === 0) return;

    try {
        const response = await authorizedFetch(`${API_URL}/api/products/bulk`, {
            method: 'POST',
            body: JSON.stringify({ products: unsyncedProducts }),
        });

        if (response.success === true) {
            await db.executeSql(`UPDATE products SET synced = 1 WHERE synced = 0`);
        }
    } catch (err) {
        console.error("❌ Sync error:", err);
    }
};

// --- SYNC LOGIC (PULL) ---
export const pullUpdatedProducts = async (db: SQLiteDatabase, lastSyncTime: string) => {
    try {
        const products = await authorizedFetch(`${API_URL}/api/products/updated-since?since=${lastSyncTime}`);
        const createdBy = await AsyncStorage.getItem('userId');

        const insertOrUpdate = `
            INSERT INTO products (
                product_id, barcode, product_name, category_id, price, Bprice, soldprice, description,
                quantity, synced, expiryDate, createdAt, updatedAt, createdBy
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(product_id) DO UPDATE SET
                product_name=excluded.product_name,
                barcode=excluded.barcode,
                price=excluded.price,
                Bprice=excluded.Bprice,
                soldprice=excluded.soldprice,
                category_id=excluded.category_id,
                description=excluded.description,
                quantity=excluded.quantity,
                synced=1,
                expiryDate=excluded.expiryDate,
                updatedAt=excluded.updatedAt,
                createdBy=excluded.createdBy
        `;

        for (const item of products) {
            await db.executeSql(insertOrUpdate, [
                item.product_id,
                item.barcode || '', // Handle barcode
                item.product_name,
                item.category_id,
                item.price,
                item.Bprice,
                item.soldprice || 0,
                item.description,
                item.quantity,
                1,
                item.expiryDate,
                item.createdAt,
                item.updatedAt,
                createdBy
            ]);
        }
    } catch (error) {
        console.error("❌ Pull error:", error);
    }
};

// --- SAVE PRODUCT (LOCAL + REMOTE) ---
export const saveProductItems = async (
    db: SQLiteDatabase,
    item: ProductItem,
    postProductToMongoDB: any
): Promise<ProductItem[]> => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1000);

    try {
        const trimmedName = item.product_name.trim();
        const barcode = item.barcode?.trim() || ''; // Extract Barcode
        const createdBy = await AsyncStorage.getItem('userId');
        const now = new Date().toISOString();
        const product_id = `B4-${createUniqueId()}`;
        const initial_stock = item.initial_stock;
        const expiryDate = item.expiryDate === '' ? futureDate.toISOString() : item.expiryDate;

        // Check if barcode or name already exists locally
        const checkQuery = `SELECT COUNT(*) as count FROM products WHERE LOWER(product_name) = LOWER(?) OR (barcode = ? AND barcode != '')`;
        const checkResult = await db.executeSql(checkQuery, [trimmedName, barcode]);
        if (checkResult[0].rows.item(0).count > 0) {
            throw new Error(`❗ Product or Barcode already exists.`);
        }

        const state = await NetInfo.fetch();
        let synced = 0;

        if (state.isConnected) {
            try {
                await postProductToMongoDB({
                    ...item,
                    product_id,
                    barcode, // Send to Mongo
                    product_name: trimmedName,
                    createdBy,
                    createdAt: now,
                    updatedAt: now,
                });
                synced = 1;
            } catch (mongoError) {
                console.warn('⚠️ MongoDB sync failed, saving locally:', mongoError);
            }
        }

        // Insert into SQLite products table
        const insertProductQuery = `
            INSERT INTO products 
            (product_id, product_name, barcode, price, Bprice, soldprice, category_id, createdBy, description, quantity, synced, expiryDate, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.executeSql(insertProductQuery, [
            product_id,
            trimmedName,
            barcode,
            parseFloat(item.price),
            parseFloat(String(item.Bprice || '0')),
            parseFloat(String(item.soldprice || '0')),
            item.category_id || '',
            createdBy,
            item.description || '',
            initial_stock,
            synced,
            expiryDate,
            now,
            now,
        ]);

        // Insert into inventory table
        const productIdResult = await db.executeSql(`SELECT id FROM products WHERE product_id = ?`, [product_id]);
        const localId = productIdResult[0].rows.item(0).id;

        await db.executeSql(`
            INSERT INTO inventory (product_id, quantity, synced, expiryDate, createdBy, created_at, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)`, 
            [localId, initial_stock, synced, expiryDate, createdBy, now, now]
        );

        return await getProducts(db);
    } catch (error: any) {
        console.error('❌ Error saving product:', error.message);
        throw error;
    }
};

// --- GETTERS ---
export const getProducts = async (db: SQLiteDatabase, offset: number = 0, limit: number = 20): Promise<any[]> => {
    const results = await db.executeSql(`SELECT * FROM products ORDER BY id DESC LIMIT ? OFFSET ?`, [limit, offset]);
    return results[0].rows.raw();
};

export const getLastSyncTime = async (): Promise<string> => {
    return (await AsyncStorage.getItem("lastSync")) || "1970-01-01T00:00:00Z";
};

export const saveLastSyncTime = async (timestamp: string) => {
    await AsyncStorage.setItem("lastSync", timestamp);
};