import { SQLiteDatabase } from "react-native-sqlite-storage";
import { CartItem } from "../../models";
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@env";
import { useCreateSaleMutation } from "./salesApi";

export const createSalesTable = async (db: SQLiteDatabase) => {
    // create table if not exists
    const query = `CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        soldprice REAL,
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
export const getUnsyncedSales = async (db: SQLiteDatabase, offset: any): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {

            tx.executeSql(
                `SELECT * FROM sales WHERE synced = 0 `,
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
export function fetchGroupedProfit(db: SQLiteDatabase, groupType: any, callback: any) {

    let query = '';
    // Construct query based on groupType (weekly, monthly, yearly)
    switch (groupType) {
        case 'all':
            query = `
        SELECT 
            products.product_name,
            SUM(sales.quantity) AS total_units_sold,
            SUM(sales.soldprice * sales.quantity) AS total_sales_revenue,
            SUM((sales.soldprice - products.Bprice) * sales.quantity) AS total_profit,
            SUM((products.price - products.Bprice) * sales.quantity) AS expected_profit,
            sales.soldprice AS product_price,
            sales.created_at AS day,
            products.Bprice AS product_Bprice,
            products.quantity AS current_stock
        FROM sales
        JOIN products ON sales.product_id = products.id
        GROUP BY products.product_name
        ORDER BY total_profit DESC;`;
            break;
        case 'daily':
            query = `
        SELECT 
            sales.product_id,
            sales.synced,
            strftime('%Y-%m-%d', sales.created_at) AS day,
            products.product_name,
            products.price AS product_price,
            products.Bprice AS product_Bprice,
            products.quantity AS current_stock,
            SUM(sales.soldprice * sales.quantity) AS total_sales_revenue,
            SUM((sales.soldprice - products.Bprice) * sales.quantity) AS total_profit,
            SUM((products.price - products.Bprice) * sales.quantity) AS expected_profit,
            SUM(sales.quantity) AS total_units_sold
        FROM sales
        JOIN products ON sales.product_id = products.id
        WHERE strftime('%Y-%m', sales.created_at) = strftime('%Y-%m', 'now')
        GROUP BY sales.product_id, day
        ORDER BY day DESC, total_profit DESC
        LIMIT 10;`;
            break;
        case 'weekly':
            query = `
       SELECT 
            sales.product_id,
            products.product_name,
            products.price AS product_price,
            products.Bprice AS product_Bprice,
            products.quantity AS current_stock,
            strftime('%Y-W%W', sales.created_at) AS day,  -- e.g., "2025-W18"
            SUM(sales.soldprice * sales.quantity) AS total_sales_revenue,
            SUM((sales.soldprice - products.Bprice) * sales.quantity) AS total_profit,
            SUM((products.price - products.Bprice) * sales.quantity) AS expected_profit,
            SUM(sales.quantity) AS total_units_sold
        FROM sales
        JOIN products ON sales.product_id = products.id
        GROUP BY sales.product_id, day
        ORDER BY day DESC, total_profit DESC
        LIMIT 10;
        `;
            break;
        case 'monthly':
            query = `
        SELECT 
            sales.product_id,
            products.product_name,
            products.price AS product_price,
            products.Bprice AS product_Bprice,
            products.quantity AS current_stock,
            strftime('%m', sales.created_at) AS month_number,
            strftime('%Y', sales.created_at) AS year,
            CASE strftime('%m', sales.created_at)
                WHEN '01' THEN 'Jan'
                WHEN '02' THEN 'Feb'
                WHEN '03' THEN 'Mar'
                WHEN '04' THEN 'Apr'
                WHEN '05' THEN 'May'
                WHEN '06' THEN 'Jun'
                WHEN '07' THEN 'Jul'
                WHEN '08' THEN 'Aug'
                WHEN '09' THEN 'Sep'
                WHEN '10' THEN 'Oct'
                WHEN '11' THEN 'Nov'
                WHEN '12' THEN 'Dec'
                END AS day,
            SUM(sales.soldprice * sales.quantity) AS total_sales_revenue,
                SUM((sales.soldprice - products.Bprice) * sales.quantity) AS total_profit,
            SUM((products.price - products.Bprice) * sales.quantity) AS expected_profit,
            SUM(sales.quantity) AS total_units_sold
        FROM sales
        JOIN products ON sales.product_id = products.id
        GROUP BY sales.product_id, month_number, year
        ORDER BY year DESC, month_number DESC, total_profit DESC
        LIMIT 10;`;
            break;
        case 'yearly':
            query = `
        SELECT 
            sales.product_id,
            products.product_name,
            products.price AS product_price,
            products.Bprice AS product_Bprice,
            products.quantity AS current_stock,
            strftime('%Y', sales.created_at) AS day,  -- Year shown in "day" column
            SUM(sales.soldprice * sales.quantity) AS total_sales_revenue,
            SUM((sales.soldprice - products.Bprice) * sales.quantity) AS total_profit,
            SUM((products.price - products.Bprice) * sales.quantity) AS expected_profit,
            SUM(sales.quantity) AS total_units_sold
        FROM sales
        JOIN products ON sales.product_id = products.id
        GROUP BY sales.product_id, day
        ORDER BY day DESC, total_profit DESC
        LIMIT 10;`;
            break;
        case 'non-profit':
            query = `
        SELECT 
            strftime('%w', sales.created_at) AS weekday,
            SUM(sales.quantity * products.price) AS total_sales,
            SUM((products.price - products.Bprice) * sales.quantity) AS total_profit
        FROM sales
        JOIN products ON sales.product_id = products.id
        WHERE strftime('%Y-%W', sales.created_at) = strftime('%Y-%W', 'now')
        GROUP BY weekday
        ORDER BY weekday ASC;
          `;
            break;
        case 'best':
            query = `
        SELECT 
            products.product_name,
            SUM((products.price - products.Bprice) * sales.quantity) AS profit
        FROM sales
        JOIN products ON sales.product_id = products.id
        WHERE date(sales.created_at) = date('now')
        GROUP BY sales.product_id
        ORDER BY profit DESC
        LIMIT 1;
          `;
            break;
        case 'worst':
            query = `
        SELECT 
              products.product_name,
              SUM((products.price - products.Bprice) * sales.quantity) AS profit
          FROM sales
          JOIN products ON sales.product_id = products.id
          WHERE date(sales.created_at) = date('now')
          GROUP BY sales.product_id
          ORDER BY profit ASC
          LIMIT 1;
            `;
            break;
        case 'profit':
            query = `
           SELECT 
      SUM((products.price - products.Bprice) * sales.quantity) AS total_profit
    FROM sales
    JOIN products ON sales.product_id = products.id
    WHERE date(sales.created_at) = date('now');
                `;
            break;
        case 'low-stock':
            query = `
           SELECT 
  product_name,
  quantity
FROM products
WHERE quantity < 10
ORDER BY quantity ASC;
                `;
            break;
        case 'today':
            query = `
            SELECT 
                products.product_name,
                SUM(sales.quantity) AS total_units_sold,
                SUM(sales.soldprice * sales.quantity) AS total_sales_revenue,
                SUM((sales.soldprice - products.Bprice) * sales.quantity) AS total_profit,
                SUM((products.price - products.Bprice) * sales.quantity) AS expected_profit,
                sales.soldprice AS product_price,
                sales.created_at AS day,
                products.Bprice AS product_Bprice,
                products.quantity AS current_stock
            FROM sales
            JOIN products ON sales.product_id = products.id
            WHERE date(sales.created_at) = date('now')
            GROUP BY products.product_name
            ORDER BY total_profit DESC;`;
            break;

        case 'last-week':
            query = `
            SELECT 
                products.product_name,
                SUM(sales.quantity) AS total_units_sold,
                SUM(sales.soldprice * sales.quantity) AS total_sales_revenue,
                SUM((sales.soldprice - products.Bprice) * sales.quantity) AS total_profit,
                SUM((products.price - products.Bprice) * sales.quantity) AS expected_profit,
                sales.soldprice AS product_price,
                sales.created_at AS day,
                products.Bprice AS product_Bprice,
                products.quantity AS current_stock
            FROM sales
            JOIN products ON sales.product_id = products.id
            WHERE date(sales.created_at) >= date('now', '-7 days') AND date(sales.created_at) < date('now')
            GROUP BY products.product_name
            ORDER BY total_profit DESC;`;
            break;

        case 'last-month':
            query = `
            SELECT 
                products.product_name,
                SUM(sales.quantity) AS total_units_sold,
                SUM(sales.soldprice * sales.quantity) AS total_sales_revenue,
                SUM((sales.soldprice - products.Bprice) * sales.quantity) AS total_profit,
                SUM((products.price - products.Bprice) * sales.quantity) AS expected_profit,
                sales.soldprice AS product_price,
                sales.created_at AS day,
                products.Bprice AS product_Bprice,
                products.quantity AS current_stock
            FROM sales
            JOIN products ON sales.product_id = products.id
            WHERE date(sales.created_at) >= date('now', '-1 month') AND date(sales.created_at) < date('now')
            GROUP BY products.product_name
            ORDER BY total_profit DESC;`;
            break;

        case 'last-3months':
            query = `
            SELECT 
                products.product_name,
                SUM(sales.quantity) AS total_units_sold,
                SUM(sales.soldprice * sales.quantity) AS total_sales_revenue,
                SUM((sales.soldprice - products.Bprice) * sales.quantity) AS total_profit,
                SUM((products.price - products.Bprice) * sales.quantity) AS expected_profit,
                sales.soldprice AS product_price,
                sales.created_at AS day,
                products.Bprice AS product_Bprice,
                products.quantity AS current_stock
            FROM sales
            JOIN products ON sales.product_id = products.id
            WHERE date(sales.created_at) >= date('now', '-3 months') AND date(sales.created_at) < date('now')
            GROUP BY products.product_name
            ORDER BY total_profit DESC;`;
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
export function fetchCumulativeProfit(db: SQLiteDatabase, timeframe: string, callback: any) {
    let query = '';

    switch (timeframe) {
        case 'today':
            query = `
                SELECT 
                    SUM(sales.soldprice * sales.quantity) AS total_sales_revenue,
                    SUM((sales.soldprice - products.Bprice) * sales.quantity) AS total_profit,
                    SUM((products.price - products.Bprice) * sales.quantity) AS expected_profit
                FROM sales
                JOIN products ON sales.product_id = products.id
                WHERE date(sales.created_at) = date('now');
            `;
            break;

        case 'last-week':
            query = `
                SELECT 
                    SUM(sales.soldprice * sales.quantity) AS total_sales_revenue,
                    SUM((sales.soldprice - products.Bprice) * sales.quantity) AS total_profit,
                    SUM((products.price - products.Bprice) * sales.quantity) AS expected_profit
                FROM sales
                JOIN products ON sales.product_id = products.id
                WHERE date(sales.created_at) >= date('now', '-7 days') AND date(sales.created_at) < date('now');
            `;
            break;

        case 'last-month':
            query = `
                SELECT 
                    SUM(sales.soldprice * sales.quantity) AS total_sales_revenue,
                    SUM((sales.soldprice - products.Bprice) * sales.quantity) AS total_profit,
                    SUM((products.price - products.Bprice) * sales.quantity) AS expected_profit
                FROM sales
                JOIN products ON sales.product_id = products.id
                WHERE date(sales.created_at) >= date('now', '-1 month') AND date(sales.created_at) < date('now');
            `;
            break;

        case 'last-3months':
            query = `
                SELECT 
                    SUM(sales.soldprice * sales.quantity) AS total_sales_revenue,
                    SUM((sales.soldprice - products.Bprice) * sales.quantity) AS total_profit,
                    SUM((products.price - products.Bprice) * sales.quantity) AS expected_profit
                FROM sales
                JOIN products ON sales.product_id = products.id
                WHERE date(sales.created_at) >= date('now', '-3 months') AND date(sales.created_at) < date('now');
            `;
            break;

        case 'monthly':
            query = `
                SELECT 
                    SUM(sales.soldprice * sales.quantity) AS total_sales_revenue,
                    SUM((sales.soldprice - products.Bprice) * sales.quantity) AS total_profit,
                    SUM((products.price - products.Bprice) * sales.quantity) AS expected_profit
                FROM sales
                JOIN products ON sales.product_id = products.id
                WHERE strftime('%Y-%m', sales.created_at) = strftime('%Y-%m', 'now');
            `;
            break;

        case 'yearly':
            query = `
                SELECT 
                    SUM(sales.soldprice * sales.quantity) AS total_sales_revenue,
                    SUM((sales.soldprice - products.Bprice) * sales.quantity) AS total_profit,
                    SUM((products.price - products.Bprice) * sales.quantity) AS expected_profit
                FROM sales
                JOIN products ON sales.product_id = products.id
                WHERE strftime('%Y', sales.created_at) = strftime('%Y', 'now');
            `;
            break;

        case 'all':
            query = `
                SELECT 
                    SUM(sales.soldprice * sales.quantity) AS total_sales_revenue,
                    SUM((sales.soldprice - products.Bprice) * sales.quantity) AS total_profit,
                    SUM((products.price - products.Bprice) * sales.quantity) AS expected_profit
                FROM sales
                JOIN products ON sales.product_id = products.id;
            `;
            break;

        default:
            return;
    }

    db.transaction(tx => {
        tx.executeSql(query, [], (_, { rows }) => {
            callback(rows.item(0)); // Return a single object
        });
    });
}

export const markSaleAsSynced = (id: number, db: SQLiteDatabase) => {
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {
            tx.executeSql(
                'UPDATE sales SET synced = 1 WHERE id = ?',
                [id],
                (_: any, result: any) => resolve(result),
                (_: any, error: any) => reject(error)
            );
        });
    });
};


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


export const finalizeSale = async (
  db: SQLiteDatabase,
  cartItems: CartItem[],
  postSale: any
): Promise<void> => {
  const now = new Date().toISOString();
  const createdBy = (await AsyncStorage.getItem('userId')) ?? "dgdfgdd";
  const isConnected = await NetInfo.fetch().then(state => state.isConnected);

  // First, attempt to sync sales to server if online
  const syncResults: Record<number, boolean> = {}; // track which items synced
  if (isConnected) {
    for (const item of cartItems) {
      try {
        await postSale({
          product_id: item.id,
          quantity: item.quantity,
          soldprice: item.price,
        });
        syncResults[item.id] = true;
        console.log(`🌐 Synced sale for item ID: ${item.id}`);
      } catch (err) {
        syncResults[item.id] = false;
        console.warn(`⚠️ Sync failed for item ID: ${item.id}. Will save locally.`, err);
      }
    }
  } else {
    // mark all as unsynced
    cartItems.forEach(item => (syncResults[item.id] = false));
  }

  // Now, insert sales locally and update stock in a single transaction
  db.transaction(
    (tx) => {
      for (const item of cartItems) {
        const synced = syncResults[item.id] ? 1 : 0;

        // Insert into sales table
        tx.executeSql(
          `INSERT INTO sales (product_id, quantity, soldprice, synced, createdBy, created_at, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [item.id, item.quantity, item.price, synced, createdBy, now, now],
          (_, res) => console.log(`✅ Inserted sale for item ID: ${item.id}`),
          (_, error) => {
            console.error(`❌ Failed to insert sale for item ID: ${item.id}`, error);
            return false;
          }
        );

        // Update product stock
        tx.executeSql(
          `UPDATE products SET quantity = quantity - ? WHERE id = ?`,
          [item.quantity, item.id],
          (_, res) => console.log(`✅ Updated stock for item ID: ${item.id}`),
          (_, error) => {
            console.error(`❌ Failed to update stock for item ID: ${item.id}`, error);
            return false;
          }
        );
      }
    },
    (error) => console.error('❌ Transaction failed:', error),
    () => console.log('✅ Transaction completed successfully')
  );
};

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
