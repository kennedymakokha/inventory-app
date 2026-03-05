export type SyncTableConfig = {
  tableName: string;
  primaryKey: string;        // e.g. category_id
  bulkEndpoint: string;      // POST bulk
  updatedSinceEndpoint: string; // GET updated-since
  lastSyncKey: string;       // AsyncStorage key
   payloadKey: string;     // e.g. "categories" - the key to wrap the array in the bulk POST body
};