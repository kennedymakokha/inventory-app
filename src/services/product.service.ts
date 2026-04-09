import { SQLiteDatabase } from "react-native-sqlite-storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { API_URL } from "@env";
import { authorizedFetch } from "../middleware/auth.middleware";
import { getDBConnection } from "./db-service";
import { createTableIfNotExists } from "../utils/tableExists";
import { CategoryItem, ProductItem } from "../../models";
import { v4 as uuidv4 } from "uuid";
import getInitials from "../utils/initials";
import { AnyActionArg } from "react";
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
      sub_category_id TEXT,
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
    console.error(' createProductTable failed:', err);
    throw err;
  }
};

export const createProduct = async (product: any) => {
  const db = await getDBConnection();
  const now = new Date().toISOString();
  const createdBy = await AsyncStorage.getItem("userId");
  const productId = uuidv4();

  db.transaction((tx) => {

    // INSERT PRODUCT
    tx.executeSql(
      `INSERT INTO Product
      (product_id, product_name, barcode, business,
       price, Bprice, soldprice, category_id,sub_category_id,
       description, quantity, synced,
       expiryDate, createdAt, createdBy, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
      [
        productId,
        product.product_name,
        product.barcode || "",
        product.business_id || "",
        product.price,
        product.Bprice,
        product.soldprice || 0,
        product.category_id || "",
        product.sub_category_id || "",
        product.description || "",
        product.initial_stock || 0,
        0, // synced
        product.expiryDate || "",
        now,
        createdBy,
        now
      ]
    );

    // INVENTORY LOG (INITIAL STOCK)
    const inve_id = uuidv4();

    tx.executeSql(
      `INSERT INTO Inventory_log
      (inventory_log_id, product_id, quantity, business,
       reference_type, note, createdBy, synced, createdAt, updatedAt,batchNumber,expiryDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        inve_id,
        productId,
        product.initial_stock || 0,
        product.business_id || "",
        "INITIAL_STOCK",
        "Initial product stock",
        createdBy,
        0, // synced
        now,
        now,
        product ? (product.product_name ? getInitials(product.product_name) + '-' + Date.now() : "GENERAL-" + Date.now()) : "",
        product.expiryDate ? product.expiryDate.toISOString() : null
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

  const result = await db.executeSql(
    `UPDATE Product
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
     WHERE product_id = ?`,
    [
      product.product_name,
      product.barcode || "",
      product.business_id || "",
      product.price,
      product.Bprice,
      product.soldprice || 0,
      product.category_id || "",
      product.description || "",
      product.expiryDate || null,
      now,
      product.product_id
    ]
  );

  console.log("Updated rows:", result[0].rowsAffected);
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
      const inve_id = uuidv4();
      tx.executeSql(`
        INSERT INTO Inventory_log
        (inventory_log_id,product_id, type, quantity, note, createdBy, synced, createdAt)
        VALUES (?,?, ?, ?, ?, ?, ?, ?)
      `, [
        inve_id,
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
    console.log(" getProducts error:", error);
    return [];
  }
};



interface CategoryDetailsResponse {
  // category?: CategoryItem | null;
  subCategories: any[];
  products: ProductItem[];
}

export const getCategoryFullDetails = async (
  db: SQLiteDatabase,
  categoryId: string
): Promise<CategoryDetailsResponse> => {
  try {
    // 1. Fetch the Parent Category details
    // const [catResult] = await db.executeSql(
    //   `SELECT * FROM Category WHERE category_id = ? AND deleted_at IS NULL LIMIT 1`,
    //   [categoryId]
    // );
    // const category = catResult.rows.length > 0 ? catResult.rows.item(0) : null;

    // 2. Fetch Sub-categories (Categories where parent_id matches this ID)
    // Ensure your Category table has a parent_id column
    const [subCatResult] = await db.executeSql(
      `SELECT * FROM SubCategory WHERE category_id = ? AND deleted_at IS NULL ORDER BY sub_category_name ASC`,
      [categoryId]
    );
    const subCategories: AnyActionArg[] = [];
    const products: ProductItem[] = [];
    for (let i = 0; i < subCatResult.rows.length; i++) {
      console.log(subCatResult.rows.item(i).sub_category_id)
      subCategories.push(subCatResult.rows.item(i));
    }

    // 3. Fetch Products under this specific Category
    const [prodResult] = await db.executeSql(
      `SELECT * FROM Product WHERE category_id = ? AND deleted_at IS NULL ORDER BY product_name ASC`,
      [categoryId]
    );

    for (let i = 0; i < prodResult.rows.length; i++) {
      products.push(prodResult.rows.item(i));
    }

    return {
      // category,
      subCategories,
      products
    };

  } catch (error) {
    console.error("getCategoryFullDetails error:", error);
    return { subCategories: [], products: [] };
  }
};
export const getProductsByCategoryName = async (
  db: SQLiteDatabase,
  categoryName: string,
  limit: number = 20,
  offset: number = 0
): Promise<ProductItem[]> => {
  try {
    const [results] = await db.executeSql(
      `
      SELECT p.*
      FROM Product p
      LEFT JOIN Category c 
        ON p.category_id = c.category_id
      WHERE p.deleted_at IS NULL
      AND c.category_name = ?
      ORDER BY p.product_name ASC
      LIMIT ? OFFSET ?
      `,
      [categoryName, limit, offset]
    );

    const products: ProductItem[] = [];

    for (let i = 0; i < results.rows.length; i++) {
      products.push(results.rows.item(i));
    }

    return products;
  } catch (error) {
    console.log(" getProductsByCategoryName error:", error);
    return [];
  }
};
export const getProductsGroupedByCategory = async (
  db: SQLiteDatabase,
  limit: number = 20,
  offset: number = 0
): Promise<Record<string, any[]>> => {
  try {
    const [results] = await db.executeSql(
      `
      SELECT 
        p.*,
        c.category_name
      FROM Product p
      LEFT JOIN Category c 
        ON p.category_id = c.category_id
      WHERE p.deleted_at IS NULL
      ORDER BY c.category_name ASC, p.product_name ASC
      LIMIT ? OFFSET ?
      `,
      [limit, offset]
    );

    const grouped: Record<string, any[]> = {};

    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);

      const category = row.category_name || "Uncategorized";

      if (!grouped[category]) {
        grouped[category] = [];
      }

      grouped[category].push(row);
    }

    return grouped;
  } catch (error) {
    console.log(" getProductsGroupedByCategory error:", error);
    return {};
  }
};
export const getProductsGroupedByHierarchy = async (
  db: SQLiteDatabase,
  limit: number = 20,
  offset: number = 0
): Promise<any[]> => {
  try {
    // 1. Remove the brackets [results]. 
    // Most RN SQLite wrappers return the result object directly in the promise.
    const results = await db.executeSql(
      `
      SELECT 
        p.*,
        c.category_name,
        s.sub_category_name
      FROM Product p
      LEFT JOIN Category c ON p.category_id = c.category_id
      LEFT JOIN SubCategory s ON p.sub_category_id = s.sub_category_id
      WHERE p.deleted_at IS NULL
      ORDER BY c.category_name ASC, s.sub_category_name ASC, p.product_name ASC
      LIMIT ? OFFSET ?
      `,
      [limit, offset]
    );

    const rows = [];
    
    // 2. Check if results and results[0].rows exist 
    // (In some versions, executeSql returns an array of results for batching)
    const resultSet = Array.isArray(results) ? results[0] : results;

    if (resultSet && resultSet.rows) {
      for (let i = 0; i < resultSet.rows.length; i++) {
        rows.push(resultSet.rows.item(i));
      }
    }
    
    return rows;
  } catch (error) {
    console.error("Error fetching hierarchy:", error);
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
    console.log(" getProducts error:", error);
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
      console.log(" Not enough stock");
      return false;
    }

    return true;

  } catch (error) {
    console.log("Stock update error:", error);
    return false;
  }
};