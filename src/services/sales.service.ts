import { SQLiteDatabase } from "react-native-sqlite-storage";
import { CartItem, InventoryItem, ProductItem } from "../../models";
import { getNow } from "../../utils";
import { syncData } from "./sync.service";
import { pullServerUpdates } from "./pull.service";
import Papa from 'papaparse';
import RNFS from 'react-native-fs'; // Already included in many RN setups
import { pick, types, keepLocalCopy } from '@react-native-documents/picker';
import { getDBConnection } from "./db-service";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const createSalesTable = async (db: SQLiteDatabase) => {
    // create table if not exists
    const query = `CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        createdBy TEXT NOT NULL ,
      synced INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`;

    await db.executeSql(query);
};

export const fetchSales = async (db: SQLiteDatabase): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                `SELECT 
              sales.id AS sales_id,
              sales.product_id,
              sales.synced,
              products.product_name,
              products.quantity AS product_quantity,
              products.price AS product_price,
              sales.created_at,
              sales.updatedAt
           FROM sales
           JOIN products ON sales.product_id = products.id
           ORDER BY sales.updatedAt DESC
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
// function fetchSalesData(db, groupType, callback) {
//     let query = '';
//     switch (groupType) {
//         case 'weekly':
//             query = `
//           SELECT product_name, strftime('%Y-W%W', timestamp) as period, SUM(value) as total
//           FROM sales
//           GROUP BY product_name, period
//           ORDER BY period DESC
//         `;
//             break;
//         case 'monthly':
//             query = `
//           SELECT product_name, strftime('%Y-%m-%d', timestamp) as period, SUM(value) as total
//           FROM sales
//           GROUP BY product_name, period
//           ORDER BY period DESC
//         `;
//             break;
//         case 'yearly':
//             query = `
//           SELECT product_name, strftime('%Y-%m', timestamp) as period, SUM(value) as total
//           FROM sales
//           GROUP BY product_name, period
//           ORDER BY period DESC
//         `;
//             break;
//         default:
//             return;
//     }

//     db.transaction(tx => {
//         tx.executeSql(query, [], (_, { rows }) => {
//             callback(rows._array);
//         });
//     });
// }
// }
export function fetchGroupedProfit(db: SQLiteDatabase, groupType: any, callback: any) {
    console.log("transaction-begins")
    let query = '';

    // Construct query based on groupType (weekly, monthly, yearly)
    switch (groupType) {
        case 'all':
            query = `
         SELECT 
              sales.id AS sales_id,
              sales.product_id,
              sales.synced,
              products.product_name,
              products.quantity AS product_quantity,
              products.price AS product_price,
              sales.created_at,
              sales.updatedAt
           FROM sales
           JOIN products ON sales.product_id = products.id
           ORDER BY sales.updatedAt DESC
           LIMIT 10`;
            break;
        case 'weekly':
            query = `
          SELECT 
            p.product_name,
            strftime('%Y-W%W', s.created_at) AS week,
            SUM((p.price - p.Bprice) * p.quantity) AS total_profit,
          FROM sales s
          JOIN products p ON s.product_id = p.id
          GROUP BY p.product_name, week
          ORDER BY week DESC;
        `;
            break;
        case 'monthly':
            query = `
             SELECT 
              sales.id AS sales_id,
              sales.product_id,
              sales.synced,
              strftime('%Y-%m-%d', sales.created_at) AS day,
              products.product_name,
              products.quantity AS product_quantity,
              products.price AS product_price,
              SUM((products.price - products.Bprice) * sales.quantity) AS total_profit,
              sales.created_at,
              sales.updatedAt
           FROM sales
           JOIN products ON sales.product_id = products.id
           ORDER BY day DESC
        
           LIMIT 10;
        `
                ;
            break;
        case 'yearly':
            query = `
          SELECT 
            p.product_name,
            strftime('%Y-%m', s.timestamp) AS month,
            SUM((p.selling_price - p.buying_price) * s.quantity) AS total_profit
          FROM sales s
          JOIN products p ON s.product_id = p.id
          GROUP BY p.product_name, month
          ORDER BY month DESC;
        `;
            break;
        default:
            return;
    }

    // Execute the SQL query
    db.transaction(tx => {
        tx.executeSql(query, [], (_, { rows }) => {
            callback(rows.raw()); // Return the result
        });
    });
}


export const updateItemSale = (db: SQLiteDatabase, id: number, incomingQuantity: number) => {
    console.log('transaction started')
    db.transaction(tx => {
        // Update quantity by adding incoming value to current quantity
        tx.executeSql(
            "UPDATE products SET quantity = quantity - ? WHERE id = ?",
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

export const saveSalesItem = async (
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
                `INSERT OR REPLACE INTO inventory 
           (product_id, quantity, synced,createdBy, created_at, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    item.product_id,
                    parseFloat(item.quantity),
                    item.synced ? 1 : 0,
                    item.createdBy,
                    now,
                    now
                ]
            );
            const db = await getDBConnection();
            await updateItemSale(db, parseInt(item.product_id), parseFloat(item.quantity))

        });

        // 3. Return updated inventory list
        return await fetchSales(db);

    } catch (error) {
        console.error('❌ Error saving inventory item:', error);
        throw error;
    }
};


export const finalizeSale = async (
    db: SQLiteDatabase,
    cartItems: CartItem[]
): Promise<void> => {
    const now = new Date().toISOString();
    const synced = 0;
    const createdBy = await AsyncStorage.getItem('userId');

    db.transaction(
        (tx) => {
            cartItems.forEach((item) => {
                // Insert into sales
                tx.executeSql(
                    `INSERT INTO sales (product_id, quantity, synced, createdBy, created_at, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?)`,
                    [item.id, item.quantity, synced, createdBy, now, now],
                    (_, res) => {
                        console.log(`✅ Inserted sale for item ID: ${item.id}`);
                    },
                    (_, error) => {
                        console.error(`❌ Failed to insert sale for item ID: ${item.id}`, error);
                        return false;
                    }
                );

                // Update product quantity
                tx.executeSql(
                    `UPDATE products SET quantity = quantity - ? WHERE id = ?`,
                    [item.quantity, item.id],
                    (_, res) => {
                        console.log(`✅ Updated stock for item ID: ${item.id}`);
                    },
                    (_, error) => {
                        console.error(`❌ Failed to update stock for item ID: ${item.id}`, error);
                        return false;
                    }
                );
            });
        },
        (error) => {
            console.error('❌ Transaction failed:', error);
        },
        () => {
            console.log('✅ Transaction completed successfully');
        }
    );
};
// export const finalizeSale = async (
//     db: SQLiteDatabase,
//     cartItems: CartItem[],

// ): Promise<void> => {
//     try {
//         const now = new Date().toISOString();
//         const synced = false;
//         const createdBy = await AsyncStorage.getItem('userId')
//         await db.transaction(async (tx) => {
//             for (const item of cartItems) {
//                 await tx.executeSql(
//                     `INSERT INTO sales (product_id, quantity,synced, createdBy, created_at,updatedAt)
//              VALUES (?, ?, ?, ?, ?, ?)`,
//                     [item.id, item.quantity, synced, createdBy, now, now]
//                 );

//                 // 2. Update product stock (subtract sold quantity)
//                  updateItemQuantity(db, parseInt(item.id), item.quantity)
//             }
//         });

//         console.log('✅ Sale finalized and stock updated.');
//     } catch (error) {
//         console.error('❌ Failed to finalize sale:', error);
//         throw error;
//     }
// };

export const updateItemQuantity = (db: SQLiteDatabase, id: number, incomingQuantity: number) => {
    db.transaction(tx => {
        // Update quantity by adding incoming value to current quantity
        tx.executeSql(
            "UPDATE products SET quantity = quantity - ? WHERE id = ?",
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
