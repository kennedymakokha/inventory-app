import { SQLiteDatabase } from "react-native-sqlite-storage";
import { CartItem } from "../../models";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDBConnection } from "./db-service";
import { createTableIfNotExists } from "../utils/tableExists";
import { generateId } from "./product.service";


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
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            updatedAt TEXT,
            created_at TEXT,
            soldprice REAL,
            createdBy TEXT,
            synced INTEGER DEFAULT 0
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
  cartItems: CartItem[]
): Promise<void> => {

  const createdBy = (await AsyncStorage.getItem("userId")) ?? "local-user";
  const now = new Date().toISOString();

  return new Promise((resolve, reject) => {

    db.transaction(
      (tx) => {

        for (const item of cartItems) {

          const saleId = generateId("SLE");

          // Insert sale locally
          tx.executeSql(
            `INSERT INTO Sale
             (sale_id, product_id, quantity, soldprice, createdBy, synced, created_at, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              saleId,
              item.product_id,
              item.quantity,
              item.price,
              createdBy,
              0,
              now,
              now
            ]
          );

          // Update product stock safely
          tx.executeSql(
            `UPDATE Product
             SET quantity = quantity - ?
             WHERE id = ? AND quantity >= ?`,
            [
              item.quantity,
              item.id,
              item.quantity
            ]
          );

        }

      },

      (error) => {
        console.error("❌ Transaction failed:", error);
        reject(error);
      },

      () => {
        console.log("✅ Sale stored locally");
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

  const refundId = `refund_${Date.now()}`;

  let totalRefund = 0;

  items.forEach(i => {
    totalRefund += i.price * i.quantity;
  });

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

  }

  return refundId;

};
// -------------------------------
// GET UNSYNCED SALES
// -------------------------------
export const getUnsyncedSales = async (db: SQLiteDatabase): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM Sale WHERE synced = 0`,
        [],
        (_, { rows }) => resolve(rows.raw() || []), // <-- fallback to []
        (_, error) => {
          console.error("❌ Failed to fetch unsynced sales", error);
          resolve([]); // <-- prevent iterator error
          return false;
        }
      );
    });
  });
};


// -------------------------------
// MARK SALE AS SYNCED
// -------------------------------
export const markSaleAsSynced = (
  db: SQLiteDatabase,
  saleId: string
) => {

  return new Promise((resolve, reject) => {

    db.transaction(tx => {

      tx.executeSql(
        `UPDATE Sale SET synced = 1 WHERE sale_id = ?`,
        [saleId],
        (_, result) => resolve(result),
        (_, error) => {
          reject(error);
          return false;
        }
      );

    });

  });

};


// -------------------------------
// SYNC SALES WITH SERVER
// -------------------------------
export const syncSales = async (db: SQLiteDatabase, postSale: any) => {
  const unsyncedSales = await getUnsyncedSales(db).catch(() => []);
  if (!Array.isArray(unsyncedSales)) return []; // always return an array
  for (const sale of unsyncedSales) {
    try {
      await postSale(sale);
      await markSaleAsSynced(db, sale.sale_id);
    } catch (err) {
      console.warn("⚠️ Failed to sync sale:", sale.sale_id);
    }
  }
  return unsyncedSales; // <-- return the array
};


// -------------------------------
// FETCH RECENT SALES
// -------------------------------
export const fetchSales = async (
  db: SQLiteDatabase
): Promise<any[]> => {

  return new Promise((resolve, reject) => {

    db.transaction(tx => {

      tx.executeSql(
        `
        SELECT
          Sale.id AS Sale_id,
          Sale.product_id,
          Sale.synced,
          Product.product_name,
          Product.quantity AS product_quantity,
          Product.price AS product_price,
          Sale.created_at,
          Sale.updatedAt
        FROM Sale
        JOIN Product ON Sale.product_id = Product.id
        ORDER BY Sale.updatedAt DESC
        LIMIT 10
        `,
        [],
        (_, { rows }) => resolve(rows.raw()),
        (_, error) => {
          reject(error);
          return false;
        }
      );

    });

  });

};
// -------------------------------
// GROUPED PROFIT ANALYTICS
// -------------------------------
export const fetchGroupedProfit = (
  db: SQLiteDatabase,
  groupType: string
): Promise<any[]> => {

  return new Promise((resolve, reject) => {

    let query = "";

    switch (groupType) {

      case "daily":
        query = `
        SELECT
          strftime('%Y-%m-%d', Sale.created_at) AS day,
          Product.product_name,
          SUM(Sale.quantity) AS total_units_sold,
          IFNULL(SUM(Sale.soldprice * Sale.quantity),0) AS total_sales_revenue,
          IFNULL(SUM((Sale.soldprice - Product.Bprice) * Sale.quantity),0) AS total_profit
        FROM Sale
        JOIN Product ON Sale.product_id = Product.id
        GROUP BY day, Sale.product_id
        ORDER BY day DESC
        LIMIT 10
        `;
        break;

      case "weekly":
        query = `
        SELECT
          strftime('%Y-W%W', Sale.created_at) AS week,
          Product.product_name,
          SUM(Sale.quantity) AS total_units_sold,
          IFNULL(SUM(Sale.soldprice * Sale.quantity),0) AS total_sales_revenue,
          IFNULL(SUM((Sale.soldprice - Product.Bprice) * Sale.quantity),0) AS total_profit
        FROM Sale
        JOIN Product ON Sale.product_id = Product.id
        GROUP BY week, Sale.product_id
        ORDER BY week DESC
        LIMIT 10
        `;
        break;

      case "monthly":
        query = `
        SELECT
          strftime('%Y-%m', Sale.created_at) AS month,
          Product.product_name,
          SUM(Sale.quantity) AS total_units_sold,
          IFNULL(SUM(Sale.soldprice * Sale.quantity),0) AS total_sales_revenue,
          IFNULL(SUM((Sale.soldprice - Product.Bprice) * Sale.quantity),0) AS total_profit
        FROM Sale
        JOIN Product ON Sale.product_id = Product.id
        GROUP BY month, Sale.product_id
        ORDER BY month DESC
        LIMIT 10
        `;
        break;

      case "all":
      default:
        query = `
        SELECT
          Product.product_name,
          SUM(Sale.quantity) AS total_units_sold,
          IFNULL(SUM(Sale.soldprice * Sale.quantity),0) AS total_sales_revenue,
          IFNULL(SUM((Sale.soldprice - Product.Bprice) * Sale.quantity),0) AS total_profit
        FROM Sale
        JOIN Product ON Sale.product_id = Product.id
        GROUP BY Sale.product_id
        ORDER BY total_profit DESC
        `;
    }

    db.transaction(tx => {

      tx.executeSql(
        query,
        [],
        (_, { rows }) => resolve(rows.raw()),
        (_, error) => {
          reject(error);
          return false;
        }
      );

    });

  });

};


// -------------------------------
// CUMULATIVE PROFIT
// -------------------------------
export const fetchCumulativeProfit = (
  db: SQLiteDatabase,
  timeframe: string
): Promise<any> => {

  return new Promise((resolve, reject) => {

    let whereClause = "";

    switch (timeframe) {

      case "today":
        whereClause = "WHERE date(Sale.created_at) = date('now')";
        break;

      case "last-week":
        whereClause = "WHERE date(Sale.created_at) >= date('now','-7 days')";
        break;

      case "last-month":
        whereClause = "WHERE date(Sale.created_at) >= date('now','-1 month')";
        break;

      case "last-3months":
        whereClause = "WHERE date(Sale.created_at) >= date('now','-3 months')";
        break;

      case "monthly":
        whereClause = "WHERE strftime('%Y-%m', Sale.created_at) = strftime('%Y-%m','now')";
        break;

      case "yearly":
        whereClause = "WHERE strftime('%Y', Sale.created_at) = strftime('%Y','now')";
        break;

      default:
        whereClause = "";
    }

    const query = `
      SELECT
        IFNULL(SUM(Sale.soldprice * Sale.quantity),0) AS total_sales_revenue,
        IFNULL(SUM((Sale.soldprice - Product.Bprice) * Sale.quantity),0) AS total_profit,
        IFNULL(SUM((Product.price - Product.Bprice) * Sale.quantity),0) AS expected_profit
      FROM Sale
      JOIN Product ON Sale.product_id = Product.id
      ${whereClause}
    `;

    db.transaction(tx => {

      tx.executeSql(
        query,
        [],
        (_, { rows }) => resolve(rows.item(0)),
        (_, error) => {
          reject(error);
          return false;
        }
      );

    });

  });

};