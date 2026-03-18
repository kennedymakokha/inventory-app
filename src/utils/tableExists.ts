import SQLite from 'react-native-sqlite-storage';

// 1. Check if table exists (Promise version)
export const tableExists = async (db: SQLite.SQLiteDatabase, tableName: string): Promise<boolean> => {
  try {
    // In promise mode, executeSql returns [ResultSet]
    const [results] = await db.executeSql(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?;`,
      [tableName]
    );
    return results.rows.length > 0;
  } catch (err) {
    console.error(`Error checking table ${tableName}:`, err);
    return false;
  }
};

// 2. Create table (Simplified Promise version)
export const createTableIfNotExists = async (db: SQLite.SQLiteDatabase, tableName: string, createSQL: string) => {
  try {
    const exists = await tableExists(db, tableName);
    
    if (!exists) {
      // Execute the creation SQL directly
      await db.executeSql(createSQL);
      console.log(` Table ${tableName} created successfully.`);
    }
    return true;
  } catch (err) {
    console.error(`❌ Failed to create table ${tableName}:`, err);
    // CRITICAL: Rethrow so App.tsx knows setup failed
    throw err; 
  }
};