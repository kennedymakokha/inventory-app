import { openDatabase } from 'react-native-sqlite-storage';

// Utility to check if a table exists
export const tableExists = async (db: any, tableName: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?;`,
        [tableName],
        (_tx: any, results: any) => {
          resolve(results.rows.length > 0);
        },
        (_tx: any, err: any) => {
          console.log(`Error checking table ${tableName}:`, err);
          resolve(false); // Treat error as table missing
          return true;
        }
      );
    });
  });
};

// Safe table creation
export const createTableIfNotExists = async (db: any, tableName: string, createSQL: string) => {
  const exists = await tableExists(db, tableName);
  if (!exists) {
    return new Promise((resolve, reject) => {
      db.transaction((tx: any) => {
        tx.executeSql(
          createSQL,
          [],
          () => {
            console.log(`✅ Table ${tableName} created`);
            resolve(true);
          },
          (_tx: any, err: any) => {
            console.log(`❌ Failed to create table ${tableName}:`, err);
            reject(err);
            return true;
          }
        );
      });
    });
  } else {
    console.log(`Table ${tableName} already exists`);
    return true;
  }
};