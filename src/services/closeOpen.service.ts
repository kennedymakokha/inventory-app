// pullService.ts - Pull server updates and sync to local SQLite

import { getNow } from '../../utils';
import { authorizedFetch } from '../middleware/auth.middleware';
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { getDBConnection } from './db-service';
import { API_URL } from '@env';
import { createTableIfNotExists } from '../utils/tableExists';

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
        console.error('❌ createProductTable failed:', err);
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
              sale_id TEXT,
              method TEXT,
              amount REAL,
              created_at TEXT,
              synced INTEGER DEFAULT 0
             ) `
        );
    } catch (err) {
        console.error('❌ createProductTable failed:', err);
        throw err;
    }
};


export const calculateExpectedCash = async () => {
    const db = await getDBConnection()
    const [cashSales] = await db.executeSql(
        `SELECT SUM(amount) as total
     FROM Payments
     WHERE method='CASH'`
    );

    return cashSales.rows.item(0).total || 0;

};

export const closeRegister = async (
    db: SQLiteDatabase,
    registerId: string,
    actualCash: number
) => {

    const expectedCash = await calculateExpectedCash();

    const difference = actualCash - expectedCash;

    await db.executeSql(
        `UPDATE CashRegister
     SET closing_cash=?,
         expected_cash=?,
         difference=?,
         status='CLOSED',
         closed_at=datetime('now')
     WHERE register_id=?`,
        [
            actualCash,
            expectedCash,
            difference,
            registerId
        ]
    );

};