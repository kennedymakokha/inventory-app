import { getDBConnection } from "../src/services/db-service";
import { getUnsyncedInventory } from "../src/services/inventory.service";
import { createProductTable, getUnsyncedProducts, markProductAsSynced } from "../src/services/product.service";
import { pullServerUpdates, updateLocalInventory, updateLocalProduct } from "../src/services/pull.service";


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
        setMessage('✅ Sync successful!');
    } catch (err) {
        console.log(err)
        // setMessage('❌ Sync failed.');
    } finally {
        // setLoading(false);
    }
}

const handleInventorySync = async (syncProduct: any, setMessage: any, inventories: any, setLoading: any) => {
    try {
        setLoading(true);
        const db = await getDBConnection();
        await createProductTable(db);
        const unsyncedProducts = await getUnsyncedInventory(db, 1000);

        for (const product of unsyncedProducts) {
            const response = await syncProduct(product).unwrap()
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
        await pullServerUpdates(inventories)
        setMessage('✅ Sync successful!');
    } catch (err) {
        console.log(err)
        // setMessage('❌ Sync failed.');
    } finally {
        // setLoading(false);
    }
}
const handleSalesSync = async () => {
    try {
        const db = await getDBConnection();
        await createProductTable(db);
        const unsyncedProducts = await getUnsyncedProducts(db, 1000);
        const unsyncedInventories = await getUnsyncedInventory(db, 1000);
        console.log(unsyncedInventories)
        // for (const product of unsyncedProducts) {
        //     const response = await syncProduct(product).unwrap()
        //     if (response.success === true) {
        //         await markProductAsSynced(product.id, db);
        //     }
        // }
        // if (Products && Products.length > 0) {
        //     for (let index = 0; index < Products.length; index++) {
        //         const p = Products[index];
        //         await updateLocalProduct(p, db);
        //     }
        // }
        // setLoading(false);
        // await pullServerUpdates( Products)
        // setMessage('✅ Sync successful!');
    } catch (err) {
        console.log(err)
        // setMessage('❌ Sync failed.');
    } finally {
        // setLoading(false);
    }

}
export const handleSync = async ({ syncProduct, setMessage, products,inventories ,setLoading }: any) => {
    await handleProductSync(syncProduct, setMessage, products, setLoading)
    // await handleInventorySync(syncProduct, setMessage, inventories, setLoading)
}
