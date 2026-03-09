import { SQLiteDatabase } from "react-native-sqlite-storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { API_URL } from "@env";
import { authorizedFetch } from "../middleware/auth.middleware";
import { getDBConnection } from "./db-service";
import { createTableIfNotExists } from "../utils/tableExists";
import { ProductItem } from "../../models";
import { v4 as uuidv4 } from "uuid";
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
      deleted_at TEXT, 
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



/* =========================================================
   PRODUCT CREATION
========================================================= */
export const createProduct = async (product: any) => {
  const db = await getDBConnection();
  const now = new Date().toISOString();
  const createdBy = await AsyncStorage.getItem("userId");
  const productId = uuidv4();

  db.transaction((tx) => {

    tx.executeSql(
      `INSERT INTO Product
      (product_id, product_name, barcode, business,
       price, Bprice, soldprice, category_id,
       description, quantity, synced,
       expiryDate, createdAt, createdBy, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
        0,
        product.expiryDate || "",
        now,
        createdBy,
        now
      ]
    );

    tx.executeSql(
      `INSERT INTO Inventory_log
      (product_id, quantity, business, reference_type, note, createdBy, synced, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productId,
        product.initial_stock || 0,
        product.business_id || "",
        "INITIAL_STOCK",
        "Initial product stock",
        createdBy,
        0,
        now
      ]
    );

  });
};

export const softDeleteProduct = async (
  id: any
) => {
  console.log(id)
  const db = await getDBConnection();
  await db.executeSql(
    `UPDATE Product 
     SET deleted_at = datetime('now'),  synced = 0, updatedAt = datetime('now') 
     WHERE product_id = ?`,
    [id]
  );
};

export const updateProduct = async (product: any) => {
  const db = await getDBConnection();
  const now = new Date().toISOString();

  await db.executeSql(
    `
    UPDATE Product
    SET 
      product_name = ?,
      barcode = ?,
      business = ?,
      price = ?,
      Bprice = ?,
      soldprice = ?,
      category_id = ?,
      description = ?,
      expiryDate = ?,
      updatedAt = ?,
      synced = 0
    WHERE product_id = ?
    `,
    [
      product.product_name,
      product.barcode || "",
      product.business_id || "",
      product.price,
      product.Bprice,
      product.soldprice || 0,
      product.category_id || "",
      product.description || "",
      product.expiryDate || "",
      now,
      product.product_id
    ]
  );
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

      const saleId = uuidv4()

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
   FETCH PRODUCTS
========================================================= */



export const getProducts = async (
  db: SQLiteDatabase,
  limit: number = 20,
  offset: number = 0
): Promise<ProductItem[]> => {
  try {
    const [results] = await db.executeSql(
      `SELECT * FROM Product
      WHERE deleted_at IS NULL
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


export const SearchProduct = async (
  db: SQLiteDatabase,
  limit: number = 20,
  offset: number = 0
): Promise<ProductItem[]> => {
  try {
    const [results] = await db.executeSql(
      `SELECT * FROM Product
WHERE product_name LIKE '%milk%'`,
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