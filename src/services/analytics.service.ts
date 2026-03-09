import { SQLiteDatabase } from "react-native-sqlite-storage";

export const getTodaySales = async (db: SQLiteDatabase) => {

    const [result] = await db.executeSql(
        `SELECT SUM(total) as total
     FROM Sale
     WHERE date(created_at) = date('now')`
    );

    return result.rows.item(0).total || 0;

};
export const getTodayTransactions = async (
    db: SQLiteDatabase
) => {

    const [result] = await db.executeSql(
        `SELECT COUNT(*) as count
     FROM Sale
     WHERE date(created_at) = date('now')`
    );

    return result.rows.item(0).count;

};

export const getTopProducts = async (db: SQLiteDatabase) => {

    const [result] = await db.executeSql(
        `SELECT 
            p.product_name AS key,
            SUM(si.quantity) AS value
        FROM SaleItems si
        JOIN Product p ON si.product_id = p.product_id
        GROUP BY si.product_id
        ORDER BY value DESC
        LIMIT 10`
    );

    const products = [];

    for (let i = 0; i < result.rows.length; i++) {
        products.push(result.rows.item(i));
    }

    return products;
};


export const getHourlySales = async (
    db: SQLiteDatabase
) => {

    const [result] = await db.executeSql(
        `SELECT strftime('%H', created_at) as hour,
            SUM(total) as sales
     FROM Sale
     WHERE date(created_at) = date('now')
     GROUP BY hour
     ORDER BY hour`
    );

    const hours = [];

    for (let i = 0; i < result.rows.length; i++) {
        hours.push(result.rows.item(i));
    }

    return hours;

};

export const getLowStockProducts = async (
    db: SQLiteDatabase
) => {

    const [result] = await db.executeSql(
        `SELECT product_name, quantity
     FROM Product
     WHERE quantity <= 5
     ORDER BY quantity ASC`
    );

    const products = [];

    for (let i = 0; i < result.rows.length; i++) {
        products.push(result.rows.item(i));
    }

    return products;

};

export const getMonthlySales = async (db: SQLiteDatabase) => {

    const [result] = await db.executeSql(
        `SELECT 
            strftime('%Y-%m', created_at) as key,
            SUM(total) as value
        FROM Sale
        GROUP BY key
        ORDER BY key DESC`
    );

    const months = [];

    for (let i = 0; i < result.rows.length; i++) {
        months.push(result.rows.item(i));
    }

    return months;
};