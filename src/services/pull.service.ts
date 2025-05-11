// pullService.ts - Pull server updates and sync to local SQLite

import { getNow } from './../../utils';
import { authorizedFetch } from '../middleware/auth.middleware';
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { getDBConnection } from './db-service';
import { API_URL } from '@env';

// Helper to get last sync timestamp (could also use AsyncStorage)
let lastSync = '2020-01-01T00:00:00.000Z'; // default fallback
const formatSQLiteDate = (isoString: string) => {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return null;

    // Format: YYYY-MM-DD HH:MM:SS
    return d.toISOString().replace('T', ' ').substring(0, 19);
};
export const updateLocalProduct = (product: any, db: SQLiteDatabase) => {
    const created_at = formatSQLiteDate(product.createdAt);
    const updated_at = formatSQLiteDate(product.updatedAt);
    db.transaction((tx: any) => {
        tx.executeSql(
            'SELECT * FROM products WHERE product_name = ?',
            [product.product_name],
            (_: any, { rows }: any) => {
                if (rows.length > 0) {
                    console.log("first", product.product_name)
                    tx.executeSql(
                        'UPDATE products SET price = ?, updatedAt = ?, synced = 1 WHERE product_name = ?',
                        [product.price, updated_at, product.product_name,]
                    );
                } else {
                    console.log("second", product)
                    tx.executeSql(
                        `INSERT OR REPLACE INTO products 
    (product_name, price,Bprice, description, synced, created_at, updatedAt, createdBy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [product.product_name, product.price,200, product.description, 1, created_at, updated_at, product.createdBy],
                        (_: any, result: any) => console.log("Insert success:", result),
                        (_: any, error: any) => {
                            console.error("Insert error:", error);
                            return true; // stop the transaction on error
                        });
                }
            }
        );
    });
};

export const updateLocalInventory = (item: any, db: SQLiteDatabase) => {
    db.transaction((tx: any) => {
        tx.executeSql(
            'SELECT * FROM inventory WHERE product = ?',
            [item.product],
            (_: any, { rows }: any) => {
                if (rows.length > 0) {
                    tx.executeSql(
                        'UPDATE inventory SET quantity = ?, updatedAt = ?, synced = 1 WHERE product = ?',
                        [item.quantity, item.updatedAt, item.product]
                    );
                } else {
                    tx.executeSql(
                        'INSERT INTO inventory (product, quantity, updatedAt, synced) VALUES (?, ?, ?, 1)',
                        [item.product, item.quantity, item.updatedAt]
                    );
                }
            }
        );
    });
};
export const pullServerUpdates = async (productRes: any) => {
    try {
        // Pull Products
        const db = await getDBConnection();

        for (let index = 0; index < productRes.length; index++) {

            const p = productRes[index];

            updateLocalProduct(p, db);
        }

        // // Pull Inventory
        // const inventoryRes = await authorizedFetch(`${API_URL}/inventory/updates?since=${lastSync}`);
        // for (const i of inventoryRes.data) {
        //     updateLocalInventory(i);
        // }

        lastSync = getNow(); // Update lastSync timestamp
        console.log('✅ Pulled server updates');
    } catch (err) {
        console.error('❌ Pull failed:', err);
    }
};
// export const pullServerUpdates = async () => {
//     try {
//         // Pull Products
//         const productRes = await authorizedFetch(`${API_URL}/products/updates?since=${lastSync}`);
//         for (const p of productRes.data) {
//             updateLocalProduct(p);
//         }

//         // Pull Inventory
//         const inventoryRes = await authorizedFetch(`${API_URL}/inventory/updates?since=${lastSync}`);
//         for (const i of inventoryRes.data) {
//             updateLocalInventory(i);
//         }

//         lastSync = getNow(); // Update lastSync timestamp
//         console.log('✅ Pulled server updates');
//     } catch (err) {
//         console.error('❌ Pull failed:', err);
//     }
// };

// Usage:
// import { pullServerUpdates } from './pullService';
// <Button title="Pull Server Updates" onPress={pullServerUpdates} />
