import { SQLiteDatabase } from "react-native-sqlite-storage";
import { CartItem } from "../../models";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDBConnection } from "./db-service";
import { createTableIfNotExists } from "../utils/tableExists";

import { v4 as uuidv4 } from "uuid";

// -------------------------------
// CREATE SALES TABLE
// -------------------------------


// -------------------------------
// CREATE OR MIGRATE SALES TABLE
// -------------------------------




export const createSalesTable = async () => {
  try {
    const db = await getDBConnection();
    await createTableIfNotExists(
      db,
      'Sale',
      `CREATE TABLE Sale (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id TEXT UNIQUE,
          receipt_number TEXT,
          total REAL,
          phone TEXT,
          payment_method TEXT,
          updatedAt TEXT,
          created_at TEXT,
          createdBy TEXT,
          synced INTEGER DEFAULT 0
      );`
    );
  } catch (err) {
    console.error('❌ createSalesTable failed:', err);
    throw err;
  }
};

export const createSalesItemTable = async () => {
  try {
    const db = await getDBConnection();
    await createTableIfNotExists(
      db,
      'SaleItems',
      `CREATE TABLE IF NOT EXISTS SaleItems (
        sale_item_id TEXT PRIMARY KEY,
        sale_id TEXT,
        product_id TEXT,
        quantity INTEGER,
        price REAL,
        refunded_quantity INTEGER DEFAULT 0,
        total REAL,
        synced INTEGER DEFAULT 0,
        created_at TEXT
      );`
    );
  } catch (err) {
    console.error('❌ createSalesTable failed:', err);
    throw err;
  }
};



// -------------------------------
// GENERATE SALE ID
// -------------------------------
const generateSaleId = (userId: string, productId: number) => {
  return `${userId}-${Date.now()}-${productId}`;
};

export const createRefundsTable = async () => {
  try {
    const db = await getDBConnection();
    await createTableIfNotExists(
      db,
      'Refunds',
      `CREATE TABLE IF NOT EXISTS Refunds (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          refund_id TEXT UNIQUE,
          sale_id TEXT,
          receipt_number TEXT,
          total_refund REAL,
          cashier_id TEXT,
          reason TEXT,
          created_at TEXT,
          synced INTEGER DEFAULT 0
        );
      );`
    );
  } catch (err) {
    console.error('❌ createSalesTable failed:', err);
    throw err;
  }
};

export const createRefundItemsTable = async () => {
  try {
    const db = await getDBConnection();
    await createTableIfNotExists(
      db,
      'RefundItems',
      `CREATE TABLE IF NOT EXISTS RefundItems (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          refund_id TEXT,
          product_id TEXT,
          product_name TEXT,
          quantity INTEGER,
          price REAL,
          total REAL
        );
      );`
    );
  } catch (err) {
    console.error('❌ createSalesTable failed:', err);
    throw err;
  }
};
// -------------------------------
// FINALIZE SALE (OFFLINE FIRST)
// -------------------------------


export const finalizeSale = async (
  db: SQLiteDatabase,
  cartItems: CartItem[],
  data: {
    recieptNo: string;
    method: string;
    phone?: string;
    paidAmount?: string;
  }
): Promise<void> => {

  console.log("🛒 finalizeSale called");

  if (!cartItems || cartItems.length === 0) {
    console.log("❌ Cart is empty");
    return;
  }



  const createdBy = (await AsyncStorage.getItem("userId")) ?? "local-user";
  const now = new Date().toISOString();
  const saleId = uuidv4();

  console.log("Sale ID:", saleId);

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  console.log("Total:", total);

  return new Promise((resolve, reject) => {

    db.transaction(

      (tx) => {

        console.log("📦 Transaction started");

        // INSERT SALE
        tx.executeSql(
          `INSERT INTO Sale
          (sale_id,total,createdBy,receipt_number,payment_method,phone,synced,created_at,updatedAt)
          VALUES (?,?,?,?,?,?,?,?,?)`,
          [
            saleId,
            total,
            createdBy,
            data.recieptNo,
            data.method,
            data.phone ?? null,
            0,
            now,
            now
          ],
          (_, result) => {
            console.log("✅ Sale inserted", result.rowsAffected);
          },
          (_, error) => {
            console.log("❌ Sale insert error", error);
            return true;
          }
        );

        for (const item of cartItems) {

          console.log("Processing item:", item);

          const saleItemId = uuidv4();
          const itemTotal = item.price * item.quantity;

          // INSERT SALE ITEM
          tx.executeSql(
            `INSERT INTO SaleItems
            (sale_item_id,sale_id,product_id,quantity,price,total,synced,created_at)
            VALUES (?,?,?,?,?,?,?,?)`,
            [
              saleItemId,
              saleId,
              item.product_id,
              item.quantity,
              item.price,
              itemTotal,
              0,
              now
            ],
            () => console.log("✅ SaleItem inserted"),
            (_, error) => {
              console.log("❌ SaleItem error", error);
              return true;
            }
          );

          // UPDATE PRODUCT
          tx.executeSql(
            `UPDATE Product
             SET quantity = quantity - ?
             WHERE product_id = ? AND quantity >= ?`,
            [
              item.quantity,
              item.product_id,
              item.quantity
            ],
            (_, res) => {
              // console.log("📉 Stock updated", res.rowsAffected);
            },
            (_, error) => {
              console.log("❌ Stock update error", error);
              return true;
            }
          );

          // INVENTORY LOG
          tx.executeSql(
            `INSERT INTO Inventory_log
            (product_id,type,quantity,reference_id,reference_type,createdBy,synced,createdAt)
            VALUES (?,?,?,?,?,?,?,?)`,
            [
              item.product_id,
              "SALE",
              item.quantity,
              saleId,
              "SALE",
              createdBy,
              0,
              now
            ],
            // () => console.log("📒 Inventory log inserted"),
            (_, error) => {
              console.log("❌ Inventory log error", error);
              return true;
            }
          );
        }
        tx.executeSql(
          `INSERT INTO Payments
    (sale_id, method, amount, created_at)
    VALUES (?, ?, ?, datetime('now'))`,
          [
            saleId,
            data.method,
            total
          ]
        );


      },

      (error) => {
        console.log("❌ Transaction error:", error);
        reject(error);
      },

      () => {
        console.log("🎉 Transaction completed");
        resolve();
      }

    );

  });
};


export const createRefund = async (
  db: SQLiteDatabase,
  saleId: string,
  items: any[],
  cashierId: string,
  reason: string
) => {

  const refundId = uuidv4();

  let totalRefund = 0;

  items.forEach(i => {
    totalRefund += i.price * i.quantity;
  });

  // Insert refund
  await db.executeSql(
    `INSERT INTO Refunds
    (refund_id, sale_id, total_refund, cashier_id, reason, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [
      refundId,
      saleId,
      totalRefund,
      cashierId,
      reason
    ]
  );

  for (const item of items) {

    // Insert refund item
    await db.executeSql(
      `INSERT INTO RefundItems
      (refund_id, product_id, product_name, quantity, price, total)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        refundId,
        item.product_id,
        item.product_name,
        item.quantity,
        item.price,
        item.price * item.quantity
      ]
    );

    // Update product stock AND set sync_state = 0
    await db.executeSql(
      `UPDATE Product
       SET stock = stock + ?, sync_state = 0
       WHERE product_id = ?`,
      [item.quantity, item.product_id]
    );

    // Update refunded quantity in SaleItems AND set sync_state = 0
    await db.executeSql(
      `UPDATE SaleItems
       SET refunded_quantity = refunded_quantity + ?, sync_state = 0
       WHERE sale_id = ? AND product_id = ?`,
      [
        item.quantity,
        saleId,
        item.product_id
      ]
    );
  }

  return refundId;
};





// -------------------------------
// FETCH RECENT SALES
// -------------------------------
// export const fetchSales = async (
//   db: SQLiteDatabase
// ): Promise<any[]> => {

//   return new Promise((resolve, reject) => {

//     db.transaction(tx => {

//       tx.executeSql(
//         `
//         SELECT
//           Sale.id AS Sale_id,
//           Sale.product_id,
//           Sale.synced,
//           Product.product_name,
//           Product.quantity AS product_quantity,
//           Product.price AS product_price,
//           Sale.created_at,
//           Sale.updatedAt
//         FROM Sale
//         JOIN Product ON Sale.product_id = Product.id
//         ORDER BY Sale.updatedAt DESC
//         LIMIT 10
//         `,
//         [],
//         (_, { rows }) => resolve(rows.raw()),
//         (_, error) => {
//           reject(error);
//           return false;
//         }
//       );

//     });

//   });

// };
// -------------------------------
// GROUPED PROFIT ANALYTICS
// // -------------------------------
// export const fetchGroupedProfit = (
//   db: SQLiteDatabase,
//   groupType: string
// ): Promise<any[]> => {

//   return new Promise((resolve, reject) => {

//     let query = "";

//     switch (groupType) {

//       case "daily":
//         query = `
//         SELECT
//           strftime('%Y-%m-%d', Sale.created_at) AS day,
//           Product.product_name,
//           SUM(Sale.quantity) AS total_units_sold,
//           IFNULL(SUM(Sale.soldprice * Sale.quantity),0) AS total_sales_revenue,
//           IFNULL(SUM((Sale.soldprice - Product.Bprice) * Sale.quantity),0) AS total_profit
//         FROM Sale
//         JOIN Product ON Sale.product_id = Product.id
//         GROUP BY day, Sale.product_id
//         ORDER BY day DESC
//         LIMIT 10
//         `;
//         break;

//       case "weekly":
//         query = `
//         SELECT
//           strftime('%Y-W%W', Sale.created_at) AS week,
//           Product.product_name,
//           SUM(Sale.quantity) AS total_units_sold,
//           IFNULL(SUM(Sale.soldprice * Sale.quantity),0) AS total_sales_revenue,
//           IFNULL(SUM((Sale.soldprice - Product.Bprice) * Sale.quantity),0) AS total_profit
//         FROM Sale
//         JOIN Product ON Sale.product_id = Product.id
//         GROUP BY week, Sale.product_id
//         ORDER BY week DESC
//         LIMIT 10
//         `;
//         break;

//       case "monthly":
//         query = `
//         SELECT
//           strftime('%Y-%m', Sale.created_at) AS month,
//           Product.product_name,
//           SUM(Sale.quantity) AS total_units_sold,
//           IFNULL(SUM(Sale.soldprice * Sale.quantity),0) AS total_sales_revenue,
//           IFNULL(SUM((Sale.soldprice - Product.Bprice) * Sale.quantity),0) AS total_profit
//         FROM Sale
//         JOIN Product ON Sale.product_id = Product.id
//         GROUP BY month, Sale.product_id
//         ORDER BY month DESC
//         LIMIT 10
//         `;
//         break;

//       case "all":
//       default:
//         query = `
//         SELECT
//           Product.product_name,
//           SUM(Sale.quantity) AS total_units_sold,
//           IFNULL(SUM(Sale.soldprice * Sale.quantity),0) AS total_sales_revenue,
//           IFNULL(SUM((Sale.soldprice - Product.Bprice) * Sale.quantity),0) AS total_profit
//         FROM Sale
//         JOIN Product ON Sale.product_id = Product.id
//         GROUP BY Sale.product_id
//         ORDER BY total_profit DESC
//         `;
//     }

//     db.transaction(tx => {

//       tx.executeSql(
//         query,
//         [],
//         (_, { rows }) => resolve(rows.raw()),
//         (_, error) => {
//           reject(error);
//           return false;
//         }
//       );

//     });

//   });

// };


// -------------------------------
// CUMULATIVE PROFIT
// -------------------------------
// export const fetchCumulativeProfit = (
//   db: SQLiteDatabase,
//   timeframe: string
// ): Promise<any> => {

//   return new Promise((resolve, reject) => {

//     let whereClause = "";

//     switch (timeframe) {

//       case "today":
//         whereClause = "WHERE date(Sale.created_at) = date('now')";
//         break;

//       case "last-week":
//         whereClause = "WHERE date(Sale.created_at) >= date('now','-7 days')";
//         break;

//       case "last-month":
//         whereClause = "WHERE date(Sale.created_at) >= date('now','-1 month')";
//         break;

//       case "last-3months":
//         whereClause = "WHERE date(Sale.created_at) >= date('now','-3 months')";
//         break;

//       case "monthly":
//         whereClause = "WHERE strftime('%Y-%m', Sale.created_at) = strftime('%Y-%m','now')";
//         break;

//       case "yearly":
//         whereClause = "WHERE strftime('%Y', Sale.created_at) = strftime('%Y','now')";
//         break;

//       default:
//         whereClause = "";
//     }

//     const query = `
//       SELECT
//         IFNULL(SUM(Sale.soldprice * Sale.quantity),0) AS total_sales_revenue,
//         IFNULL(SUM((Sale.soldprice - Product.Bprice) * Sale.quantity),0) AS total_profit,
//         IFNULL(SUM((Product.price - Product.Bprice) * Sale.quantity),0) AS expected_profit
//       FROM Sale
//       JOIN Product ON Sale.product_id = Product.id
//       ${whereClause}
//     `;

//     db.transaction(tx => {

//       tx.executeSql(
//         query,
//         [],
//         (_, { rows }) => resolve(rows.item(0)),
//         (_, error) => {
//           reject(error);
//           return false;
//         }
//       );

//     });

//   });

// };