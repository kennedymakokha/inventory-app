// pullService.ts - Pull server updates and sync to local SQLite

import { getNow } from './../../utils';
import { authorizedFetch } from '../middleware/auth.middleware';
import { SQLiteDatabase } from 'react-native-sqlite-storage';

const API_URL = 'https://6d41-41-139-236-221.ngrok-free.app/api'; // Replace with actual backend URL

// Helper to get last sync timestamp (could also use AsyncStorage)
let lastSync = '2020-01-01T00:00:00.000Z'; // default fallback

const updateLocalProduct = (product: any, db: SQLiteDatabase) => {

    db.transaction((tx: any) => {
        tx.executeSql(
            'SELECT * FROM products WHERE name = ?',
            [product.name],
            (_: any, { rows }: any) => {
                if (rows.length > 0) {
                    tx.executeSql(
                        'UPDATE products SET price = ?, updatedAt = ?, synced = 1 WHERE name = ?',
                        [product.price, product.updatedAt, product.name]
                    );
                } else {
                    tx.executeSql(
                        'INSERT INTO products (name, price, updatedAt, synced) VALUES (?, ?, ?, 1)',
                        [product.name, product.price, product.updatedAt]
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
