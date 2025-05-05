import { SQLiteDatabase } from "react-native-sqlite-storage";
import { ProductItem } from "../../models";
import { getNow } from "../../utils";

export const createProductTable = async (db: SQLiteDatabase) => {
    // create table if not exists
    const query = `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_name TEXT NOT NULL,
  price REAL NOT NULL,
  synced INTEGER NOT NULL,
  updatedAt TEXT NOT NULL
    )`;

    await db.executeSql(query);
};

export const getProducts = async (db: SQLiteDatabase): Promise<ProductItem[]> => {
    try {
        const productsItems: ProductItem[] = [];
        const results = await db.executeSql(`SELECT * FROM products WHERE synced = 1`);
        results.forEach(result => {
            for (let index = 0; index < result.rows.length; index++) {
                productsItems.push(result.rows.item(index))
            }
        });
        return productsItems;
    } catch (error) {
        console.error(error);
        throw Error('Failed to get productItem !!!');
    }
};
export const getUnsyncedProducts = async (db: SQLiteDatabase): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {
            // tx.executeSql(
            //     'SELECT * FROM products WHERE synced = 0',
            //     [],
            //     (_: any, { rows }: any) => resolve(rows._array),
            //     (_: any, error: any) => reject(error)
            // );
            tx.executeSql(
                `SELECT * FROM products WHERE synced = 0`,
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
// product_name, price, getNow()
// export const saveProductItems = async (db: SQLiteDatabase, productItem: ProductItem) => {
//     console.log(productItem)
//     const insertQuery =
//         `INSERT OR REPLACE INTO products(product_name, price, synced, updatedAt) values ('${productItem.product_name}', '${productItem.price}','0' ,'${productItem.description}${getNow()}') `
//     // productItem.map(i => `(${i.product_name}, '${i.price},${getNow()}')`).join(',');

//     return db.executeSql(insertQuery);
// };

// export const saveProductItemn = (db: SQLiteDatabase, product: ProductItem) => {
//     //
//     product.synced = false
//     const { product_name, price, synced } = product;
//     console.log(product)
//     db.transaction((tx) => {
//         tx.executeSql(
//             `INSERT OR REPLACE INTO products 
//          (product_name, price, synced, updatedAt) 
//          VALUES (?, ?, ?, ?)`,
//             [
//                 product_name,                      // string
//                 parseFloat(price),                // number
//                 synced ? 1 : 0,                   // boolean → integer
//                 new Date().toISOString()
//             ],
//             (_, result) => {
//                 console.log()
//                 console.log('✅ Insert success:', result);
//             },
//             (_, error) => {
//                 console.error('❌ Insert failed:', error);
//                 return true; // stops further execution in transaction
//             }
//         );
//         tx.executeSql(
//             `SELECT * FROM products WHERE synced = 0`,
//             [],
//             (_, { rows }) => {
//                 const allProducts = rows.raw(); // raw() returns a plain JS array
//                 resolve(allProducts);
//                 console.log("📦 Current products table:", allProducts);
//             },
//             (_, error) => {
//                 console.error("❌ SELECT failed:", error);
//                 return true;
//             }
//         );
//     });

// };


export const saveProductItems = async (db: SQLiteDatabase, product: ProductItem): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        product.synced = false
        const { product_name, price, synced } = product;
        if (
            !product.product_name?.trim() ||
            isNaN(parseFloat(product.price))
          ) {
            console.warn("⚠️ Skipping invalid product:", product);
            return;
          }
          
        db.transaction((tx) => {
            tx.executeSql(
                `INSERT OR REPLACE INTO products 
             (product_name, price, synced, updatedAt) 
             VALUES (?, ?, ?, ?)`,
                [
                    product_name,                      // string
                    parseFloat(price),                // number
                    synced ? 1 : 0,                   // boolean → integer
                    new Date().toISOString()
                ],
                (_, result) => {
                    console.log()
                    console.log('✅ Insert success:', result);
                },
                (_, error) => {
                    console.error('❌ Insert failed:', error);
                    return true; // stops further execution in transaction
                }
            );
            tx.executeSql(
                `SELECT * FROM products WHERE synced = 0`,
                [],
                (_, { rows }: any) => {
                    const allProducts = rows.raw(); // raw() returns a plain JS array
                    resolve(allProducts);
                    console.log("📦 Current products table:", allProducts);
                },
                (_, error) => {
                    console.error("❌ SELECT failed:", error);
                    return true;
                }
            );
        });
    });
};



