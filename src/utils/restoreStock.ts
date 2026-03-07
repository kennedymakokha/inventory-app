import { SQLiteDatabase } from "react-native-sqlite-storage";

export const restoreStock = async (
  db: SQLiteDatabase,
  productId: string,
  quantity: number
) => {

  await db.executeSql(
    `UPDATE Product
     SET stock = stock + ?
     WHERE product_id = ?`,
    [quantity, productId]
  );

};