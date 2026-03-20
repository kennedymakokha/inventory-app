import { SQLiteDatabase } from "react-native-sqlite-storage";
import { getDBConnection } from "./db-service";


/**
 * Today's total sales
 */
export const getTodaySales = async (userRole: string, userId?: string) => {

  const db = await getDBConnection();

  let roleCondition = "";
  const params: any[] = [];

  if (userRole === "sales" && userId) {
    roleCondition = `AND createdBy = ?`;
    params.push(userId);
  }

  const [result] = await db.executeSql(
    `SELECT SUM(total) as total
     FROM Sale
     WHERE date(created_at,'localtime') = date('now','localtime')
     ${roleCondition}`,
    params
  );

  return Number(result.rows.item(0)?.total ?? 0);
};

type SalesFilter =
  | "today"
  | "week"
  | "month"
  | "year"
  | "custom"
  | "range";

export const getSales = async (
  
  userId?: string,
  filter: SalesFilter = "today",
  customDate?: string,
  startDate?: string,
  endDate?: string
) => {
  const db = await getDBConnection();


  let dateCondition = "";


  // Role-based filter
  let condition = "";
  const params: any[] = [];

  // Apply filter ONLY if userId is provided
  if (userId) {
    condition = "AND createdBy = ?";
    params.push(userId);
  }


  // Date filter
  switch (filter) {
    case "today":
      dateCondition = `date(created_at,'localtime') = date('now','localtime')`;
      break;

    case "week":
      dateCondition = `strftime('%Y-%W', created_at) = strftime('%Y-%W', 'now')`;
      break;

    case "month":
      dateCondition = `strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`;
      break;

    case "year":
      dateCondition = `strftime('%Y', created_at) = strftime('%Y', 'now')`;
      break;

    case "custom":
      dateCondition = `date(created_at) = date(?)`;
      params.push(customDate);
      break;

    case "range":
      dateCondition = `date(created_at) BETWEEN date(?) AND date(?)`;
      params.push(startDate, endDate);
      break;

    default:
      dateCondition = `date(created_at,'localtime') = date('now','localtime')`;
  }

  const [result] = await db.executeSql(
    `SELECT SUM(total) as total
     FROM Sale
     WHERE ${dateCondition}
     ${condition}`,
    params
  );

  return Number(result.rows.item(0)?.total ?? 0);
};

/**
 * Today's transactions count
 */
export const getTodayTransactions = async (userRole: string, userId?: string) => {

  const db = await getDBConnection();

  let roleCondition = "";
  const params: any[] = [];

  if (userRole === "sales" && userId) {
    roleCondition = `AND createdBy = ?`;
    params.push(userId);
  }

  const [result] = await db.executeSql(
    `SELECT COUNT(*) as count
     FROM Sale
     WHERE date(created_at,'localtime') = date('now','localtime')
     ${roleCondition}`,
    params
  );

  return Number(result.rows.item(0)?.count ?? 0);
};



/**
 * Top selling products
 */
export const getTopProducts = async (userRole: string, userId?: string) => {

  const db = await getDBConnection();

  let query = `
    SELECT 
      p.product_name AS key,
      SUM(si.quantity) AS value
    FROM SaleItems si
    JOIN Product p ON si.product_id = p.product_id
    JOIN Sale s ON si.sale_id = s.sale_id
  `;

  const params: any[] = [];

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



/**
 * Hourly sales by product
 */
export const getHourlySalesByProduct = async (
  userRole: string,
  userId?: string
) => {

  const db = await getDBConnection();

  let roleCondition = "";
  const params: any[] = [];

  if (userRole === "sales" && userId) {
    roleCondition = `AND s.createdBy = ?`;
    params.push(userId);
  }

  const [result] = await db.executeSql(
    `SELECT 
        p.product_name as productName,
        strftime('%H', s.created_at,'localtime') as hour,
        SUM(si.quantity) as salesCount
     FROM Sale s
     JOIN SaleItems si ON si.sale_id = s.sale_id
     JOIN Product p ON p.product_id = si.product_id
     WHERE date(s.created_at,'localtime') = date('now','localtime')
     ${roleCondition}
     GROUP BY productName, hour
     ORDER BY productName, hour`,
    params
  );

  const productMap: Record<string, { key: string; value: number }[]> = {};

  for (let i = 0; i < result.rows.length; i++) {

    const row = result.rows.item(i);
    const productName = row.productName;

    if (!productMap[productName]) {
      productMap[productName] = [];
    }

    productMap[productName].push({
      key: row.hour,
      value: Number(row.salesCount),
    });

  }

  const allHours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  const datasets = Object.entries(productMap).map(([productName, data]) => {

    const map = Object.fromEntries(data.map(d => [d.key, d.value]));

    const filledData = allHours.map(hour => ({
      key: hour,
      value: map[hour] ?? 0
    }));

    return {
      label: productName,
      data: filledData,
    };

  });

  return datasets;
};



/**
 * Low stock products
 */
export const getLowStockProducts = async () => {

  const db = await getDBConnection();

  const [result] = await db.executeSql(
    `SELECT product_name, quantity
     FROM Product
     WHERE quantity <= 5
     ORDER BY quantity ASC`
  );

  const products: any[] = [];

  for (let i = 0; i < result.rows.length; i++) {
    products.push(result.rows.item(i));
  }

  return products;
};



/**
 * Monthly sales
 */
export const getMonthlySales = async (userRole: string, userId?: string) => {

  const db = await getDBConnection();

  let roleCondition = "";
  const params: any[] = [];

  if (userRole === "sales" && userId) {
    roleCondition = `WHERE createdBy = ?`;
    params.push(userId);
  }

  const [result] = await db.executeSql(
    `SELECT 
        strftime('%Y-%m', created_at,'localtime') as key,
        SUM(total) as value
     FROM Sale
     ${roleCondition}
     GROUP BY key
     ORDER BY key DESC`,
    params
  );

  const months: { key: string; value: number }[] = [];

  for (let i = 0; i < result.rows.length; i++) {

    const row = result.rows.item(i);

    months.push({
      key: row.key,
      value: Number(row.value ?? 0),
    });

  }

  return months;
};



interface ProductSalesReportParams {
  userRole?: "admin" | "sales";
  userId?: string | null;
  filterId?: number;
  page?: number;
  pageSize?: number;
}



/**
 * Product sales report with pagination
 */
export const getProductSalesReport = async ({
  userRole = "sales",
  userId = null,
  filterId = 1,
  page = 1,
  pageSize = 20,
}: ProductSalesReportParams) => {

  const db = await getDBConnection();

  let dateCondition = "";

  switch (filterId) {

    case 1:
      dateCondition = "DATE(s.created_at,'localtime') = DATE('now','localtime')";
      break;

    case 2:
      dateCondition = "s.created_at >= datetime('now','-7 days','localtime')";
      break;

    case 3:
      dateCondition = "s.created_at >= datetime('now','-1 month','localtime')";
      break;

    case 4:
      dateCondition = "s.created_at >= datetime('now','-3 months','localtime')";
      break;

    default:
      dateCondition = "1=1";

  }

  let roleCondition = "";
  const params: any[] = [];

  if (userRole === "sales" && userId) {
    roleCondition = `AND s.createdBy = ?`;
    params.push(userId);
  }

  const offset = (page - 1) * pageSize;

  params.push(pageSize, offset);

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

  const report: any[] = [];

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



/**
 * Sales report by date range
 */
export const getSalesByDateRange = async (
  db: SQLiteDatabase,
  startDate: string,
  endDate: string,
  userRole: string,
  userId?: string
) => {

  let roleCondition = "";
  const params: any[] = [startDate, endDate];

  if (userRole === "sales" && userId) {
    roleCondition = `AND createdBy = ?`;
    params.push(userId);
  }

  const [result] = await db.executeSql(
    `SELECT 
        date(created_at,'localtime') as date,
        SUM(total) as total_sales,
        COUNT(*) as transactions
     FROM Sale
     WHERE date(created_at,'localtime') BETWEEN ? AND ?
     ${roleCondition}
     GROUP BY date
     ORDER BY date`,
    params
  );

  const sales: any[] = [];

  for (let i = 0; i < result.rows.length; i++) {

    const row = result.rows.item(i);

    sales.push({
      date: row.date,
      total_sales: Number(row.total_sales ?? 0),
      transactions: Number(row.transactions ?? 0),
    });

  }

  return sales;
};