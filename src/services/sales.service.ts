import { SQLiteDatabase } from "react-native-sqlite-storage";
import { CartItem } from "../../models";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDBConnection } from "./db-service";
import { createTableIfNotExists } from "../utils/tableExists";

import { v4 as uuidv4 } from "uuid";




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
    console.error(' createSalesTable failed:', err);
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
        created_at TEXT,
        updatedAt TEXT

      );`
    );
  } catch (err) {
    console.error(' createSalesTable failed:', err);
    throw err;
  }
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
          updatedAt TEXT,
          synced INTEGER DEFAULT 0
        );
      );`
    );
  } catch (err) {
    console.error(' createSalesTable failed:', err);
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
          refund_item_id TEXT,
          product_id TEXT,
          product_name TEXT,
          quantity INTEGER,
          price REAL,
          updatedAt TEXT,
          synced INTEGER DEFAULT 0,
          total REAL
        );
      );`
    );
  } catch (err) {
    console.error(' createSalesTable failed:', err);
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
    receiptNo: any;
    method: string;
    phone?: string;
    paidAmount?: string;
    business_id?: string,
    createdBy: string,
    mpesaData?: any
  }
): Promise<void> => {


  if (!cartItems || cartItems.length === 0) {
    console.log(" Cart is empty");
    return;
  }
  const now = new Date().toISOString();
  const saleId = uuidv4();

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );


  return new Promise((resolve, reject) => {

    db.transaction(

      (tx) => {
        // INSERT SALE
        tx.executeSql(
          `INSERT INTO Sale
          (sale_id,total,createdBy,receipt_number,payment_method,phone,synced,created_at,updatedAt)
          VALUES (?,?,?,?,?,?,?,?,?)`,
          [
            saleId,
            total,
            data.createdBy,
            data.receiptNo,
            data.method,
            data.phone ?? null,
            0,
            now,
            now
          ],
          (_, result) => {
            if (result.rowsAffected === 0) {
              throw new Error("Sale insert failed");
            }
            console.log(" Sale inserted");
          },
          (_, error) => {
            console.log(" Sale insert error", error);
            throw error;
          }
        );

        for (const item of cartItems) {
          const saleItemId = uuidv4();
          const itemTotal = item.price * item.quantity;

          // INSERT SALE ITEM
          tx.executeSql(
            `INSERT INTO SaleItems
            (sale_item_id,sale_id,product_id,quantity,price,total,synced,created_at,updatedAt)
            VALUES (?,?,?,?,?,?,?,?,?)`,
            [
              saleItemId,
              saleId,
              item.product_id,
              item.quantity,
              item.price,
              itemTotal,
              0,
              now,
              now
            ],
            () => console.log(" SaleItem inserted"),
            (_, error) => {
              console.log(" SaleItem error", error);
              throw error;
            }
          );

          // UPDATE PRODUCT STOCK
          tx.executeSql(
            `UPDATE Product
             SET quantity = quantity - ?, synced = 0, updatedAt = ?
             WHERE product_id = ? AND quantity >= ?`,
            [
              item.quantity,
              now,
              item.product_id,
              item.quantity
            ],
            (_, res) => {

              if (res.rowsAffected === 0) {
                console.log(" Not enough stock for", item.product_id);
                throw new Error("Insufficient stock");
              }

              console.log("📉 Stock updated");

            },
            (_, error) => {
              console.log(" Stock update error", error);
              throw error;
            }
          );

          // INVENTORY LOG
          const inventoryId = uuidv4();

          tx.executeSql(
            `INSERT INTO Inventory_log
            (inventory_log_id,
            business,
            product_id,
            quantity,
            reference_id,
            reference_type,
            createdBy,
            synced,
            createdAt,
            updatedAt)
            VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [
              inventoryId,
              data.business_id,
              item.product_id,
              item.quantity,
              saleId,
              "SALE",
              data.createdBy,
              0,
              now,
              now
            ],
            
            (_, error) => {
              console.log(" Inventory log error", error);
              throw error;
            }
          );

        }

        // INSERT PAYMENT
        const paymentId = uuidv4();

        tx.executeSql(
          `INSERT INTO Payments
          (payment_id,sale_id,method,amount,synced,created_at,updatedAt,createdBy,customer_phone,      
              customer_name,       
              mpesa_receipt, 
              receipt_no)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            paymentId,
            saleId,
            data.method,
            total,
            0,
            now,
            now,
            data.createdBy ?? "",
            data?.mpesaData?.phone ?? "",
            data?.mpesaData?.customer_name ?? "Unknown Customer",
            data?.mpesaData?.receiptNumber ?? "",
            data?.receiptNo ?? "",

          ],
        
          (_, error) => {
            console.log(" Payment insert error", error);
            throw error;
          }
        );

      },

      (error) => {
        console.log(" Transaction error:", error);
        reject(error);
      },

      () => {
       
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
// export const fetchSales = async (): Promise<any[]> => {
//   const db = await getDBConnection();

//   return new Promise((resolve, reject) => {
//     db.transaction(tx => {
//       tx.executeSql(
//         `SELECT * FROM Inventory_log`,
//         [],
//         (_, { rows }) => {
//           const sales = rows.raw();

//           console.log("Sales from DB:", sales); // 👈 log here

//           resolve(sales);
//         },
//         (_, error) => {
//           reject(error);
//           return false;
//         }
//       );
//     });
//   });
// };
