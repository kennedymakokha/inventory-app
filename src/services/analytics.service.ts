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

export type SalesFilter =
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

  const params: any[] = [];

  // Apply filter ONLY if userId is provided
  let userCondition = "";
  if (userId) {
    userCondition = " AND createdBy = ?";
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
  const query = `
    SELECT SUM(total) as total 
    FROM Sale 
    WHERE ${dateCondition} ${userCondition}
  `;
  // const [result] = await db.executeSql(
  //   `SELECT SUM(total) as total
  //    FROM Sale
  //    WHERE ${dateCondition}
  //    ${userCondition}`,
  //   params
  // );
  console.log("Executing Query:", query, params); // Debug log

  const [result] = await db.executeSql(query, params);
  return Number(result.rows.item(0)?.total ?? 0);
};


export const getDetailedUserStats = async (
  userId?: string,
  filter: SalesFilter = "today",
  customDate?: string,
  startDate?: string,
  endDate?: string
) => {
  const db = await getDBConnection();
  const params: any[] = [];
  let dateCondition = "";

  // 1. Date filter logic
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

  // 2. User Filter (If no userId, userCondition stays empty -> fetches all)
  let userCondition = "";
  if (userId) {
    userCondition = " AND createdBy = ?";
    params.push(userId);
  }

  // 3. The "Power Query"
  // We use UPPER() to ensure 'cash' or 'mpesa' strings match regardless of case
  const query = `
    SELECT 
      COUNT(*) as totalTransactions,
      SUM(total) as totalSales,
      SUM(CASE WHEN UPPER(payment_method) = 'CASH' THEN total ELSE 0 END) as cashTotal,
      SUM(CASE WHEN UPPER(payment_method) = 'MPESA' THEN total ELSE 0 END) as mpesaTotal,
      COUNT(CASE WHEN UPPER(payment_method) = 'CASH' THEN 1 END) as cashCount,
      COUNT(CASE WHEN UPPER(payment_method) = 'MPESA' THEN 1 END) as mpesaCount
    FROM Sale 
    WHERE ${dateCondition} ${userCondition}
  `;

  const [result] = await db.executeSql(query, params);
  const data = result.rows.item(0);

  return {
    totalTransactions: Number(data.totalTransactions ?? 0),
    totalSales: Number(data.totalSales ?? 0),
    cashTotal: Number(data.cashTotal ?? 0),
    mpesaTotal: Number(data.mpesaTotal ?? 0),
    cashCount: Number(data.cashCount ?? 0),
    mpesaCount: Number(data.mpesaCount ?? 0),
  };
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
export const getTopProducts = async (
  userId?: string,
  filter: SalesFilter = "today",
  customDate?: string,
  startDate?: string,
  endDate?: string
) => {
  const db = await getDBConnection();
  const params: any[] = [];
  let dateCondition = "";

  // 1. Date filter logic (Consistent with getDetailedUserStats)
  switch (filter) {
    case "today":
      dateCondition = `date(s.created_at,'localtime') = date('now','localtime')`;
      break;
    case "week":
      dateCondition = `strftime('%Y-%W', s.created_at) = strftime('%Y-%W', 'now')`;
      break;
    case "month":
      dateCondition = `strftime('%Y-%m', s.created_at) = strftime('%Y-%m', 'now')`;
      break;
    case "year":
      dateCondition = `strftime('%Y', s.created_at) = strftime('%Y', 'now')`;
      break;
    case "custom":
      dateCondition = `date(s.created_at) = date(?)`;
      params.push(customDate);
      break;
    case "range":
      dateCondition = `date(s.created_at) BETWEEN date(?) AND date(?)`;
      params.push(startDate, endDate);
      break;
    default:
      dateCondition = `date(s.created_at,'localtime') = date('now','localtime')`;
  }

  // 2. User Filter (Fetches all if userId is null/undefined)
  let userCondition = "";
  if (userId) {
    userCondition = " AND s.createdBy = ?";
    params.push(userId);
  }

  // 3. The Top Products Query
  const query = `
    SELECT 
      p.product_name AS key,
      SUM(si.quantity) AS value
    FROM SaleItems si
    JOIN Product p ON si.product_id = p.product_id
    JOIN Sale s ON si.sale_id = s.sale_id
    WHERE ${dateCondition} ${userCondition}
    GROUP BY si.product_id
    ORDER BY value DESC
    LIMIT 10
  `;

  // console.log("Executing Top Products Query:", query, params);

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
export const getSalesByCategory = async (
  userId?: string,
  filter: SalesFilter = "today",
  customDate?: string,
  startDate?: string,
  endDate?: string
) => {
  const db = await getDBConnection();
  const params: any[] = [];
  let dateCondition = "";

  // 1. Date filter logic (Consistent with your other services)
  switch (filter) {
    case "today":
      dateCondition = `date(s.created_at,'localtime') = date('now','localtime')`;
      break;
    case "week":
      dateCondition = `strftime('%Y-%W', s.created_at) = strftime('%Y-%W', 'now')`;
      break;
    case "month":
      dateCondition = `strftime('%Y-%m', s.created_at) = strftime('%Y-%m', 'now')`;
      break;
    case "year":
      dateCondition = `strftime('%Y', s.created_at) = strftime('%Y', 'now')`;
      break;
    case "custom":
      dateCondition = `date(s.created_at) = date(?)`;
      params.push(customDate);
      break;
    case "range":
      dateCondition = `date(s.created_at) BETWEEN date(?) AND date(?)`;
      params.push(startDate, endDate);
      break;
    default:
      dateCondition = `date(s.created_at,'localtime') = date('now','localtime')`;
  }

  // 2. User Filter (Fetches all if userId is null/undefined)
  let userCondition = "";
  if (userId) {
    userCondition = " AND s.createdBy = ?";
    params.push(userId);
  }

  // 3. The Category Query
  // Note: We JOIN SaleItems -> Product -> Category
  const query = `
    SELECT 
      c.category_name AS key,
      SUM(si.total) AS value
    FROM SaleItems si
    JOIN Sale s ON si.sale_id = s.sale_id
    JOIN Product p ON si.product_id = p.product_id
    JOIN Category c ON p.category_id = c.category_id
    WHERE ${dateCondition} ${userCondition}
    GROUP BY c.category_id
    ORDER BY value DESC
  `;

  const [result] = await db.executeSql(query, params);
  const categories: { key: string; value: number }[] = [];

  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows.item(i);
    categories.push({
      key: row.key,
      value: Number(row.value ?? 0),
    });
  }

  return categories;
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
export const getProductSalesReport = async (
  userId?: string,
  filter: SalesFilter = "today",
  customDate?: string,
  startDate?: string,
  endDate?: string,
  page: number = 1,
  pageSize: number = 20
) => {
  const db = await getDBConnection();
  const params: any[] = [];
  let dateCondition = "";

  // 1. Date filter logic (Consistent with getDetailedUserStats)
  switch (filter) {
    case "today":
      dateCondition = `date(s.created_at,'localtime') = date('now','localtime')`;
      break;
    case "week":
      dateCondition = `strftime('%Y-%W', s.created_at) = strftime('%Y-%W', 'now')`;
      break;
    case "month":
      dateCondition = `strftime('%Y-%m', s.created_at) = strftime('%Y-%m', 'now')`;
      break;
    case "year":
      dateCondition = `strftime('%Y', s.created_at) = strftime('%Y', 'now')`;
      break;
    case "custom":
      dateCondition = `date(s.created_at) = date(?)`;
      params.push(customDate);
      break;
    case "range":
      dateCondition = `date(s.created_at) BETWEEN date(?) AND date(?)`;
      params.push(startDate, endDate);
      break;
    default:
      dateCondition = `date(s.created_at,'localtime') = date('now','localtime')`;
  }

  // 2. User Filter (Fetches all if userId is null/undefined)
  let userCondition = "";
  if (userId) {
    userCondition = " AND s.createdBy = ?";
    params.push(userId);
  }

  // 3. Pagination Logic
  const offset = (page - 1) * pageSize;

  const query = `
    SELECT 
      p.product_id,
      p.product_name,
      SUM(si.quantity) AS quantity_sold,
      SUM(si.total) AS total_sales
    FROM SaleItems si
    JOIN Product p ON si.product_id = p.product_id
    JOIN Sale s ON si.sale_id = s.sale_id
    WHERE ${dateCondition} ${userCondition}
    GROUP BY p.product_id
    ORDER BY quantity_sold DESC
    LIMIT ? OFFSET ?
  `;

  // Add pagination params at the end of the array
  params.push(pageSize, offset);



  const [result] = await db.executeSql(query, params);
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

export const getSalesNOW = async (

): Promise<any[]> => {

  const db = await getDBConnection();
  const result = await db.executeSql(
    `SELECT * FROM Sale`
  );
  return result[0].rows.raw();
};

export const fetchPayments = async (
  filter: string,
  customDate?: string,
  startDate?: string,
  endDate?: string
): Promise<any[]> => {
  const db = await getDBConnection();

  let dateCondition = "";
  const params: any[] = [];

  // 👇 Build date condition dynamically
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

  const query = `
    SELECT 
        customer_phone,
        SUM(amount) as total_amount,
        SUM(SUM(amount)) OVER () as cumulative_total
    FROM Payments
    WHERE method = 'MPESA'
    AND ${dateCondition}
    GROUP BY customer_phone
    ORDER BY total_amount DESC
`;

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        query,
        params,
        (_, { rows }) => {
          const results = rows.raw();
          console.log("Filtered Payments:", results);
          resolve(results);
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const getClockSummaryByDay = async (date?: string) => {
  const db = await getDBConnection();

  // Default to today if no date is passed
  const selectedDate = date || new Date().toISOString().split("T")[0];

  const query = `
        SELECT 
        u.user_id,
        u.name,
        c.check_in_time,
        c.check_out_time
      FROM Clock c
      JOIN Users u ON u.user_id = c.user_id
      WHERE DATE(c.check_in_time) = DATE(?)
      ORDER BY u.name, c.check_in_time;
  `;

  const results = await db.executeSql(query, [selectedDate]);

  const rows = results[0].rows;
  let data = [];

  for (let i = 0; i < rows.length; i++) {
    data.push(rows.item(i));
  }

  return data;
};

export const getUserClockByDay = async (
  user_id: string,
  date?: string
) => {
  const db = await getDBConnection();

  const selectedDate =
    date || new Date().toISOString().split("T")[0];

  const query = `
    SELECT 
      u.user_id,
      u.name,
      c.check_in_time,
      c.check_out_time
    FROM Clock c
    JOIN User u ON u.user_id = c.user_id
    WHERE c.user_id = ?
    AND DATE(c.check_in_time) = DATE(?)
    ORDER BY c.check_in_time
  `;

  const results = await db.executeSql(query, [
    user_id,
    selectedDate,
  ]);

  const rows = results[0].rows;

  // Structure it like your accordion expects
  const sessions = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows.item(i);

    sessions.push({
      check_in_time: row.check_in_time,
      check_out_time: row.check_out_time,
    });
  }

  return {
    user_id,
    name: rows.length > 0 ? rows.item(0).name : "",
    sessions,
  };
};

export const fetchClocks = async (): Promise<any[]> => {
  const db = await getDBConnection();

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM Clock`,
        [],
        (_, { rows }) => {
          const sales = rows.raw();

          console.log("Sales from DB:", sales); // 👈 log here

          resolve(sales);
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};
