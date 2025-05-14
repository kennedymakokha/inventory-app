import { getDBConnection } from "../src/services/db-service";
import { getUnsyncedInventory } from "../src/services/inventory.service";
import { createProductTable, createSyncTable, getUnsyncedProducts, markProductAsSynced, setLastSyncTime } from "../src/services/product.service";
import { pullServerUpdates, updateLocalInventory, updateLocalProduct, updateLocalSale } from "../src/services/pull.service";
import { createSalesTable, getUnsyncedSales, markSaleAsSynced } from "../src/services/sales.service";
import { getNow } from "../utils";


const handleProductSync = async (syncProduct: any, setMessage: any, products: any, setLoading: any) => {
    try {
        setLoading(true);
        const db = await getDBConnection();
        await createProductTable(db);
        const unsyncedProducts = await getUnsyncedProducts(db, 1000);
        for (const product of unsyncedProducts) {
            const response = await syncProduct(product).unwrap()
            if (response.success === true) {
                await markProductAsSynced(product.id, db);
            }
        }
        if (products && products.length > 0) {
            for (let index = 0; index < products.length; index++) {
                const p = products[index];
                await updateLocalProduct(p, db);
            }
        }
        setLoading(false);
        await pullServerUpdates(products)
        await setLastSyncTime(db, getNow())
        setMessage('✅product Sync successful!');
    } catch (err) {
        console.log(err)
        // setMessage('❌ Sync failed.');
    } finally {
        setLoading(false);
    }
}

const handleInventorySync = async (syncInventory: any, setMessage: any, inventories: any, setLoading: any) => {
    try {
        setLoading(true);
        const db = await getDBConnection();
        await createSyncTable(db)
        await createProductTable(db);
        const unsyncedProducts = await getUnsyncedInventory(db, 1000);
        for (const product of unsyncedProducts) {
            const response = await syncInventory(product).unwrap()
            if (response.success === true) {
                await markProductAsSynced(product.id, db);
            }
        }

        if (inventories && inventories.length > 0) {
            for (let index = 0; index < inventories.length; index++) {
                const p = inventories[index];
                await updateLocalInventory(p, db);
            }
        }
        setLoading(false);
        await updateLocalInventory(inventories, db)
        setLoading(false);
        setMessage('✅ Sync successful!');
    } catch (err) {
        console.log(err)
        setLoading(false);
        setMessage('❌  inventory Sync failed.');
    } finally {
        setLoading(false);
    }
}
const handleSalesSync = async (syncSales: any, setMessage: any, sales: any, setLoading: any) => {
    try {
        const db = await getDBConnection();
        await createSalesTable(db);
        const unsyncedSales = await getUnsyncedSales(db, 1000);

        for (const product of unsyncedSales) {
            const response = await syncSales(product).unwrap()
            if (response.success === true) {
                await markSaleAsSynced(product.id, db);
            }
        }
        if (sales && sales.length > 0) {
            for (let index = 0; index < sales.length; index++) {
                const p = sales[index];
                await updateLocalSale(p, db);
            }
        }
        setLoading(false);
        await pullServerUpdates(sales)
        setMessage('✅ Sync successful!');
    } catch (err) {
        console.log(err)
        // setMessage('❌ Sync failed.');
    } finally {
        // setLoading(false);
    }

}
export const handleSync = async ({ syncProduct, syncSales, sales, syncInventory, setMessage, products, inventories, setLoading }: any) => {
    await handleProductSync(syncProduct, setMessage, products, setLoading)
    await handleInventorySync(syncInventory, setMessage, inventories, setLoading)
    await handleSalesSync(syncSales, setMessage, sales, setLoading)

}
