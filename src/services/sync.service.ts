// syncService.ts - Sync unsynced SQLite data to MongoDB backend

// import { getUnsyncedProducts, markProductAsSynced, getUnsyncedInventory, markInventoryAsSynced } from './../../localStorage';
import { authorizedFetch } from '../middleware/auth.middleware';
import { getDBConnection } from './db-service';
import { getUnsyncedProducts, markProductAsSynced } from './product.service';
import { API_URL } from '@env';

export const syncData = async () => {
    try {
        console.log("sycing data")
        const db = await getDBConnection();
        const unsyncedProducts = await getUnsyncedProducts(db, 1000);
        
        for (const product of unsyncedProducts) {
            const response = await authorizedFetch(`${API_URL}api/products/sync`, {
                method: 'POST',
                body: JSON.stringify(product),
            });
            if (response.success === true) {
                await markProductAsSynced(product.id, db);
            }
        }

        // Sync Inventory
        // const unsyncedInventory = await getUnsyncedInventory(db);
        // for (const item of unsyncedInventory) {
        //     // const response = await axios.post(`${API_URL}/inventory/sync`, item);

        //     const response = await authorizedFetch(`${API_URL}/products/sync`, {
        //         method: 'POST',
        //         body: JSON.stringify(item),
        //     });
        //     if (response.status === 200) {
        //         await markInventoryAsSynced(item.id);
        //     }
        // }

        console.log('✅ Sync completed.');
    } catch (err) {
        console.error('❌ Sync failed:', err);
    }
};

// Call syncData() on demand (e.g., button press or app start if online)

// In your component (e.g., SyncScreen.tsx or InventoryScreen.tsx)
// import { syncData } from './syncService';
// <Button title="Sync Now" onPress={syncData} />
