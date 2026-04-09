// pullService.ts - Pull server updates and sync to local SQLite

import { getNow } from '../../utils';
import { authorizedFetch } from '../middleware/auth.middleware';
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { getDBConnection } from './db-service';
import { API_URL } from '@env';
import { createTableIfNotExists } from '../utils/tableExists';

import { v4 as uuidv4 } from "uuid";
export const createCashRegisterTable = async () => {
    try {
        const db = await getDBConnection();
        await createTableIfNotExists(
            db,
            'CashRegister',
            `CREATE TABLE IF NOT EXISTS CashRegister (
               id INTEGER PRIMARY KEY AUTOINCREMENT,
               register_id TEXT UNIQUE,
               cashier_id TEXT,
               opening_float REAL,
               closing_cash REAL,
               expected_cash REAL,
               difference REAL,
               opened_at TEXT,
               closed_at TEXT,
               status TEXT DEFAULT 'OPEN',
               synced INTEGER DEFAULT 0
          ) `
        );
    } catch (err) {
        console.error(' createProductTable failed:', err);
        throw err;
    }
};

export const createPaymentsTable = async () => {
    try {
        const db = await getDBConnection();
        await createTableIfNotExists(
            db,
            'Payments',
            `CREATE TABLE IF NOT EXISTS Payments (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              payment_id TEXT UNIQUE,
              customer_phone TEXT,      
              customer_name TEXT,       
              mpesa_receipt TEXT, 
              receipt_no TEXT,       
              sale_id TEXT,
              method TEXT,
              amount REAL,
              createdBy TEXT,
              created_at TEXT,
              synced INTEGER DEFAULT 0,
              updatedAt TEXT
             ) `
        );
    } catch (err) {
        console.error(' createProductTable failed:', err);
        throw err;
    }
};





export const calculateExpectedCash = async (userRole: string, userId?: string) => {
    const db = await getDBConnection();
    await createPaymentsTable();

    let roleCondition = '';
    if (userRole === 'sales' && userId) {
        roleCondition = ` AND createdBy = '${userId}'`;
    }

    const [cashSales] = await db.executeSql(
        `SELECT SUM(amount) as total
     FROM Payments
     WHERE method = 'CASH'
     AND date(created_at,'localtime') = date('now','localtime')
     ${roleCondition}`
    );

    return cashSales.rows.item(0).total || 0;
};
export const closeRegister = async (
    role: string,
    registerId: string,
    actualCash: number
) => {
    try {
        console.log("Closing register:", registerId, "for role:", role);
        console.log("Actual cash reported:", actualCash);

        const db = await getDBConnection();

        const expectedCash = await calculateExpectedCash(role, registerId);
        console.log("Expected cash calculated:", expectedCash);

        const difference = actualCash - expectedCash;
        console.log("Difference (actual - expected):", difference);

        const result = await db.executeSql(
            `UPDATE CashRegister
             SET closing_cash=?,
                 expected_cash=?,
                 difference=?,
                 status='CLOSED',
                 closed_at=datetime('now')
             WHERE register_id=?`,
            [actualCash, expectedCash, difference, registerId]
        );

        console.log("Database update result:", result);
        console.log("Register successfully closed.");
    } catch (err) {
        console.error("Error closing register:", err);
    }
};


export const createDeliveryTable = async () => {
    try {
        const db = await getDBConnection();
        await createTableIfNotExists(
            db,
            'Delivery',
            `CREATE TABLE IF NOT EXISTS Delivery (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              delivery_id TEXT UNIQUE,
              customerName TEXT,      
              phoneNumber TEXT,       
              address TEXT, 
              dispachedAt TEXT,
              dispachedBy TEXT,
              distatus INTEGER DEFAULT 0,
              notes TEXT,
              receipt_no TEXT, 
              business_id TEXT,
              sale_id TEXT, 
              rider_description TEXT, 
              rider_phoneNumber TEXT,
              rider_name TEXT,    
              deliveryFee TEXT,
              isExpress INTEGER,
              createdBy TEXT,
              created_at TEXT,
              synced INTEGER DEFAULT 0,
              updatedAt TEXT
             ) `
        );
    } catch (err) {
        // Fixed the log name to match the table
        console.error('createDeliveryTable failed:', err);
        throw err;
    }
};



export const getPendingDeliveries = async (): Promise<any[]> => {
    try {
        const db = await getDBConnection();

        /**
         * Logic Breakdown:
         * 1. distatus ASC: 0 (Pending) comes before 1 (Dispatched/Completed).
         * 2. created_at ASC: Oldest dates come first within their status group.
         */
        const query = `
      SELECT * FROM Delivery 
      WHERE distatus=0
      ORDER BY 
        distatus ASC, 
        created_at ASC
    `;

        const results = await db.executeSql(query);
        const deliveries = [];

        for (let i = 0; i < results[0].rows.length; i++) {
            deliveries.push(results[0].rows.item(i));
        }

        return deliveries;
    } catch (error) {
        console.error("Failed to fetch deliveries:", error);
        return [];
    }
};


export const dispatchDelivery = async (data: any) => {
    const { 
        delivery_id,
        rider_description,
        rider_phoneNumber,
        rider_name,
        dispachedBy
    } = data;

    try {
        const db = await getDBConnection();

        await db.executeSql(
            `UPDATE Delivery
             SET rider_description = ?,
                 rider_phoneNumber = ?,
                 rider_name = ?,
                 dispachedAt = datetime('now'),
                 dispachedBy = ?,
                 distatus = 1,
                 synced = 0
             WHERE delivery_id = ?`,
            // Added delivery_id here to match the 5th '?'
            [rider_description, rider_phoneNumber, rider_name, dispachedBy, delivery_id] 
        );

        await getPendingDeliveries();
        console.log("Dispatch updated locally");
    } catch (error) {
        console.error("dispatchDelivery failed:", error);
        throw error;
    }
};

export const getRiderDeliveryStats = async () => {
    try {
        const db = await getDBConnection();

        const query = `
            SELECT 
                rider_name AS name, 
                rider_phoneNumber AS phone, 
                rider_description AS vehicleNo, 
                COUNT(*) AS totalDeliveries
            FROM Delivery
            WHERE rider_phoneNumber IS NOT NULL
            GROUP BY rider_phoneNumber
          
        `;

        // In many SQLite plugins, results is returned as an array [resultSet]
        const response: any = await db.executeSql(query);

        // Use index 0 if your library returns an array of results
        const results = Array.isArray(response) ? response[0] : response;

        let stats = [];

        // Check if rows and item method exist to avoid the TypeError
        if (results && results.rows) {
            for (let i = 0; i < results.rows.length; i++) {
                stats.push(results.rows.item(i));
            }
        }

        return stats;
    } catch (err) {
        console.error('Fetching rider stats failed:', err);
        throw err;
    }
};