// pullService.ts - Pull server updates and sync to local SQLite

import { getNow } from './../../utils';
import { authorizedFetch } from '../middleware/auth.middleware';
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { getDBConnection } from './db-service';
import { API_URL } from '@env';

// Helper to get last sync timestamp (could also use AsyncStorage)
let lastSync = '2020-01-01T00:00:00.000Z'; // default fallback

export const updateLocalProduct = (product: any, db: SQLiteDatabase) => {
    console.log("PRODUCT", product)
    db.transaction((tx: any) => {
        tx.executeSql(
            'SELECT * FROM products WHERE product_name = ?',
            [product.product_name],
            (_: any, { rows }: any) => {
                if (rows.length > 0) {
                    tx.executeSql(
                        'UPDATE products SET price = ?, updatedAt = ?, synced = 1 WHERE product_name = ?',
                        [product.price, product.updatedAt, product.product_name]
                    );
                } else {
                    tx.executeSql(
                        `INSERT OR REPLACE INTO products 
                        (product_name, price, description, synced, created_at, updatedAt)
                        VALUES (?, ?, ?, ?, ?, ?)`,
                        // 'INSERT INTO products (product_name, price, updatedAt, synced) VALUES (?, ?, ?, 1)',
                        [product.product_name, product.price, product.description, 1, product.createdAt, product.updatedAt]
                    );
                }
            }
        );
    });
};

const updateLocalInventory = (item: any, db: SQLiteDatabase) => {
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
export const pullServerUpdates = async () => {
    try {
        // Pull Products
        const db = await getDBConnection();
        const productRes = await authorizedFetch(`${API_URL}api/products/updates?since=${lastSync}`);


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
