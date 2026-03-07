import { SQLiteDatabase } from "react-native-sqlite-storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { API_URL } from "@env";
import { authorizedFetch } from "../middleware/auth.middleware";
import { getDBConnection } from "./db-service";
import { createTableIfNotExists } from "../utils/tableExists";
import { ProductItem } from "../../models";

/* =========================================================
   TABLE CREATION
========================================================= */

export const createProductTable = async () => {
  try {
    const db = await getDBConnection();
    await createTableIfNotExists(
      db,
      'Product',
      `CREATE TABLE Product (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT UNIQUE,
      business TEXT,
      product_name TEXT,
      stock INTEGER DEFAULT 0,
      barcode TEXT,
      price REAL,
      Bprice REAL,
      soldprice REAL,
      category_id TEXT,
      description TEXT,
      quantity INTEGER DEFAULT 0,
      synced INTEGER DEFAULT 0,
      expiryDate TEXT,
      createdAt TEXT,
      createdBy TEXT,
      updatedAt TEXT
      );`
    );
  } catch (err) {
    console.error('❌ createProductTable failed:', err);
    throw err;
  }
};

export const createInventorylogTable = async () => {
  try {
    const db = await getDBConnection();
    await createTableIfNotExists(
      db,
      'Inventory_log',
      `CREATE TABLE Inventory_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT UNIQUE,
        type TEXT,
        business TEXT,
        quantity INTEGER DEFAULT 0,
        synced INTEGER DEFAULT 0,
        note TEXT,
        createdAt TEXT,
        createdBy TEXT,
        updatedAt TEXT
      );`
    );
  } catch (err) {
    console.error('❌ createProductTable failed:', err);
    throw err;
  }
};
/* =========================================================
   UTILITY
========================================================= */

export function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}


/* =========================================================
   PRODUCT CREATION
========================================================= */

export const createProduct = async (
  db: SQLiteDatabase,
  product: any,
  postProduct: any
) => {
  console.log(product)
  const now = new Date().toISOString();
  const createdBy = await AsyncStorage.getItem("userId");

  const productId = generateId("PRD");

  const state = await NetInfo.fetch();
  let synced = 0;

  // if (state.isConnected) {

  //   try {

  //     await postProduct({
  //       ...product,
  //       product_id: productId,
  //       createdAt: now,
  //       updatedAt: now,
  //       createdBy
  //     });

  //     synced = 1;

  //   } catch (error) {

  //     console.warn("⚠️ Server sync failed. Saved locally.");

  //   }

  // }

  await db.executeSql(`
    INSERT INTO Product
    (product_id, product_name, barcode, business,
     price, Bprice, soldprice, category_id,
     description, quantity, synced,
     expiryDate, createdAt, createdBy, updatedAt)

    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    productId,
    product.product_name,
    product.barcode || "",
    product.business_id || "",
    product.price,
    product.Bprice,
    product.soldprice || 0,
    product.category_id || "",
    product.description || "",
    product.initial_stock || 0,
    synced,
    product.expiryDate || "",
    now,
    createdBy,
    now
  ]);


  /* INVENTORY LEDGER ENTRY */

  await db.executeSql(`
    INSERT INTO Inventory_log
    (product_id, type, quantity, note, createdBy, synced, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    productId,
    "INITIAL_STOCK",
    product.initial_stock || 0,
    "Initial product stock",
    createdBy,
    synced,
    now
  ]);

};


/* =========================================================
   SALE CREATION
========================================================= */

export const createSale = async (
  db: SQLiteDatabase,
  cartItems: any[],
  postSale: any
) => {

  const createdBy = await AsyncStorage.getItem("userId");
  const now = new Date().toISOString();

  const state = await NetInfo.fetch();
  const isOnline = state.isConnected;

  await db.transaction(async tx => {

    for (const item of cartItems) {

      const saleId = generateId("SALE");

      let synced = 0;

      if (isOnline) {

        try {

          await postSale({
            sale_id: saleId,
            product_id: item.product_id,
            quantity: item.quantity,
            soldprice: item.price
          });

          synced = 1;

        } catch (error) {

          console.warn("⚠️ Sale sync failed.");

        }

      }

      /* INSERT SALE */

      tx.executeSql(`
        INSERT INTO Sale
        (sale_id, product_id, quantity, soldprice, createdBy, synced, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        saleId,
        item.product_id,
        item.quantity,
        item.price,
        createdBy,
        synced,
        now,
        now
      ]);


      /* UPDATE STOCK SAFELY */

      tx.executeSql(`
        UPDATE Product
        SET quantity = quantity - ?
        WHERE product_id = ? AND quantity >= ?
      `, [
        item.quantity,
        item.product_id,
        item.quantity
      ]);


      /* INVENTORY LEDGER ENTRY */

      tx.executeSql(`
        INSERT INTO Inventory_log
        (product_id, type, quantity, note, createdBy, synced, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        item.product_id,
        "SALE",
        -item.quantity,
        "Product sold",
        createdBy,
        synced,
        now
      ]);

    }

  });

};


/* =========================================================
   SYNC UNSYNCED PRODUCTS
========================================================= */

export const syncUnsyncedProducts = async (db: SQLiteDatabase) => {

  const result = await db.executeSql(
    `SELECT * FROM Product WHERE synced = 0`
  );

  const rows = result[0].rows;

  const products: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    products.push(rows.item(i));
  }

  if (!products.length) return;

  try {

    const response = await authorizedFetch(
      `${API_URL}/api/products/bulk`,
      {
        method: "POST",
        body: JSON.stringify({ products })
      }
    );

    if (response.success) {

      for (const product of products) {

        await db.executeSql(
          `UPDATE Product SET synced = 1 WHERE product_id = ?`,
          [product.product_id]
        );

      }

    }

  } catch (error) {

    console.error("❌ Product sync failed", error);

  }

};


/* =========================================================
   SYNC UNSYNCED SALES
========================================================= */

export const syncUnsyncedSales = async (
  db: SQLiteDatabase,
  postSale: any
) => {

  const result = await db.executeSql(
    `SELECT * FROM Sale WHERE synced = 0`
  );

  const rows = result[0].rows;

  const sales: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    sales.push(rows.item(i));
  }

  if (!sales.length) return;

  for (const sale of sales) {

    try {

      await postSale({
        sale_id: sale.sale_id,
        product_id: sale.product_id,
        quantity: sale.quantity,
        soldprice: sale.soldprice
      });

      await db.executeSql(
        `UPDATE sales SET synced = 1 WHERE sale_id = ?`,
        [sale.sale_id]
      );

    } catch (error) {

      console.warn("⚠️ Sale sync failed", sale.sale_id);

    }

  }

};


/* =========================================================
   FETCH PRODUCTS
========================================================= */

// export const getProducts = async (
//   db: SQLiteDatabase,
//   limit:number = 20,
//   offset:number = 0
// ) => {

//   const result = await db.executeSql(
//     `SELECT * FROM Product ORDER BY id DESC LIMIT ? OFFSET ?`,
//     [limit,offset]
//   );

//   return result[0].rows.raw();

// };



export const getProducts = async (
  db: SQLiteDatabase,
  limit: number = 20,
  offset: number = 0
): Promise<ProductItem[]> => {
  try {
    const [results] = await db.executeSql(
      `SELECT * FROM Product
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const products: ProductItem[] = [];

    for (let i = 0; i < results.rows.length; i++) {
      products.push(results.rows.item(i));
    }

    return products;
  } catch (error) {
    console.log("❌ getProducts error:", error);
    return [];
  }
};
/* =========================================================
   FETCH SALES
========================================================= */

export const getSales = async (db: SQLiteDatabase) => {

  const result = await db.executeSql(`
    SELECT Sale.*, Product.product_name
    FROM Sale
    JOIN Product ON Sale.product_id = Product.product_id
    ORDER BY Sale.createdAt DESC
    LIMIT 50
  `);

  return result[0].rows.raw();

};



export const reduceStock = async (
  db: SQLiteDatabase,
  productId: string,
  quantity: number
): Promise<boolean> => {
  try {

    const [result] = await db.executeSql(
      `UPDATE Product
       SET stock = stock - ?
       WHERE product_id = ?
       AND stock >= ?`,
      [quantity, productId, quantity]
    );

    if (result.rowsAffected === 0) {
      console.log("❌ Not enough stock");
      return false;
    }

    return true;

  } catch (error) {
    console.log("Stock update error:", error);
    return false;
  }
};