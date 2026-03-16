import SQLite from 'react-native-sqlite-storage';

// 1. Correctly enable promises on the base object
SQLite.enablePromise(true);

// Use the library's types via the SQLite namespace
let dbInstance: SQLite.SQLiteDatabase | null = null;
let connectionPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getDBConnection = async (): Promise<SQLite.SQLiteDatabase> => {
  if (dbInstance) return dbInstance;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    try {
      // 2. Access openDatabase through the SQLite object
      const db = await SQLite.openDatabase({ 
        name: 'todo-data.db', 
        location: 'default' 
      });
      dbInstance = db;
      return db;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
};

export const closeAndDeleteDatabase = async (): Promise<void> => {
  if (dbInstance) {
    try {
      await dbInstance.close();
      dbInstance = null;
    } catch (e) {
      console.error("Close failed, but proceeding to delete...", e);
    }
  }

  await new Promise(resolve => setTimeout(resolve, 100));

  // 3. Ensure this is also called from the SQLite object
  await SQLite.deleteDatabase({ name: 'todo-data.db', location: 'default' });
};