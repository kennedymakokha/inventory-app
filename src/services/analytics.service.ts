import { SQLiteDatabase } from "react-native-sqlite-storage";
import { getDBConnection } from "./db-service";
import { createSalesItemTable } from "./sales.service";
import { createProductTable } from "./product.service";

export const getTodaySales = async (userRole: string, userId?: string) => {
    const db = await getDBConnection();

    // Role-based condition
    let roleCondition = '';
    if (userRole === 'sales' && userId) {
        roleCondition = `AND createdBy = '${userId}'`; // only this sales user's sales
    }
    // Admin sees all → no additional filter

    const [result] = await db.executeSql(
        `SELECT SUM(total) as total
     FROM Sale
     WHERE date(created_at) = date('now') ${roleCondition}`
    );

    // Return 0 if null
    return Number(result.rows.item(0).total) || 0;
};
export const getTodayTransactions = async (userRole: string, userId?: string) => {
    const db = await getDBConnection();

    // Role-based filter
    let roleCondition = '';
    if (userRole === 'sales' && userId) {
        roleCondition = `AND createdBy = '${userId}'`; // only count this user's transactions
    }
    // Admin sees all → no extra filter

    const [result] = await db.executeSql(
        `SELECT COUNT(*) as count
     FROM Sale
     WHERE date(created_at) = date('now') ${roleCondition}`
    );

    return Number(result.rows.item(0).count) || 0;
};
export const getTopProducts = async (userRole: string, userId?: string) => {
    const db = await getDBConnection();

    console.log(userId)

    let query = `
        SELECT 
            p.product_name AS key,
            SUM(si.quantity) AS value
        FROM SaleItems si
        JOIN Product p ON si.product_id = p.product_id
        JOIN Sale s ON si.sale_id = s.sale_id
    `;

    const params: any[] = [];

    // Role filter
    if (userRole === "sales" && userId) {
        query += ` WHERE s.createdBy = ? `;
        params.push(userId);
    }

    query += `
        GROUP BY si.product_id
        ORDER BY value DESC
        LIMIT 10
    `;

    const [result] = await db.executeSql(query, params);

    const products: { key: string; value: number }[] = [];

    for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        products.push({
            key: row.key,
            value: Number(row.value),
        });
    }

    return products;
};

export const getHourlySales = async (
    db: SQLiteDatabase,
    userRole: string,
    userId?: string
) => {

    // Role condition
    let roleCondition = '';
    if (userRole === 'sales' && userId) {
        roleCondition = `AND createdBy = '${userId}'`;
    }

    const [result] = await db.executeSql(
        `SELECT 
        strftime('%H', created_at) as hour,
        SUM(total) as sales
     FROM Sale
     WHERE date(created_at) = date('now') ${roleCondition}
     GROUP BY hour
     ORDER BY hour`
    );

    const hours: { hour: string; sales: number }[] = [];

    for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        hours.push({
            hour: row.hour,
            sales: Number(row.sales),
        });
    }

    return hours;
};

export const getLowStockProducts = async (

) => {
    const db = await getDBConnection();
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

export const getMonthlySales = async (userRole: string, userId?: string) => {
    const db = await getDBConnection();

    // Role-based filter
    let roleCondition = '';
    if (userRole === 'sales' && userId) {
        roleCondition = `WHERE createdBy = '${userId}'`;
    }
    // Admin sees all → roleCondition remains empty

    const [result] = await db.executeSql(
        `SELECT 
        strftime('%Y-%m', created_at) as key,
        SUM(total) as value
     FROM Sale
     ${roleCondition}
     GROUP BY key
     ORDER BY key DESC`
    );

    const months: { key: string; value: number }[] = [];
    for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        months.push({
            key: row.key,
            value: Number(row.value),
        });
    }

    return months;
};

interface ProductSalesReportParams {
    userRole?: 'admin' | 'sales';
    userId?: string | null;
    filterId?: number;
    page?: number;
    pageSize?: number;
}

export const getProductSalesReport = async ({
    userRole = 'sales', // 'admin' | 'sales'
    userId = null,
    filterId = 1,
    page = 1,
    pageSize = 20,
}: ProductSalesReportParams) => {

    const db = await getDBConnection();

    // --- Date filter ---
    let dateCondition = '';
    switch (filterId) {
        case 1: // Today
            dateCondition = "DATE(s.created_at, 'localtime') = DATE('now', 'localtime')";
            break;
        case 2: // Last 7 days
            dateCondition = "s.created_at >= datetime('now', '-7 days', 'localtime')";
            break;
        case 3: // Last month
            dateCondition = "s.created_at >= datetime('now', '-1 month', 'localtime')";
            break;
        case 4: // Last 3 months
            dateCondition = "s.created_at >= datetime('now', '-3 months', 'localtime')";
            break;
        default:
            dateCondition = "1=1";
    }

    // --- Role filter ---
    let roleCondition = '';
    if (userRole === 'sales' && userId) {
        roleCondition = `AND s.createdBy = ?`;
    }

    const offset = (page - 1) * pageSize;

    // --- Execute SQL ---
    const params: any[] = [pageSize, offset];
    if (roleCondition) {
        params.unshift(userId); // bind userId first if used
    }

    const [result] = await db.executeSql(
        `
    SELECT 
      p.product_id,
      p.product_name,
      SUM(si.quantity) AS quantity_sold,
      SUM(si.quantity * si.price) AS total_sales
    FROM SaleItems si
    JOIN Product p ON si.product_id = p.product_id
    JOIN Sale s ON si.sale_id = s.sale_id
    WHERE ${dateCondition} ${roleCondition}
    GROUP BY si.product_id
    ORDER BY quantity_sold DESC
    LIMIT ? OFFSET ?
    `,
        params
    );

    const report = [];
    for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        report.push({
            product_id: row.product_id,
            product_name: row.product_name,
            quantity_sold: Number(row.quantity_sold ?? 0),
            total_sales: Number(row.total_sales ?? 0),
        });
    }

    return report;
};

export const getSalesByDateRange = async (
    db: SQLiteDatabase,
    startDate: string,
    endDate: string,
    userRole: string,
    userId?: string
) => {

    // Role condition
    let roleCondition = '';
    let params: any[] = [startDate, endDate];

    if (userRole === 'sales' && userId) {
        roleCondition = `AND createdBy = ?`;
        params.push(userId);
    }

    const [result] = await db.executeSql(
        `SELECT 
        date(created_at) as date,
        SUM(total) as total_sales,
        COUNT(*) as transactions
     FROM Sale
     WHERE date(created_at) BETWEEN ? AND ?
     ${roleCondition}
     GROUP BY date
     ORDER BY date`,
        params
    );

    const sales: {
        date: string;
        total_sales: number;
        transactions: number;
    }[] = [];

    for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        sales.push({
            date: row.date,
            total_sales: Number(row.total_sales),
            transactions: Number(row.transactions),
        });
    }

    return sales;
};

// const report = await getSalesByDateRange(
//   db,
//   "2026-03-01",
//   "2026-03-09",
//   user.role,
//   user.id
// );