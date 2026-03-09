export const syncTables = [
    {
        tableName: "Category",
        primaryKey: "category_id",
        bulkEndpoint: "/api/categories/bulk",
        updatedSinceEndpoint: "/api/categories/updated-since",
        lastSyncKey: "categories_last_sync",
        payloadKey: "categories",
    },
    {
        tableName: "Product",
        primaryKey: "product_id",
        bulkEndpoint: "/api/products/bulk",
        updatedSinceEndpoint: "/api/products/updated-since",
        lastSyncKey: "products_last_sync",
        payloadKey: "products",
    },
    {
        tableName: "Sale",
        primaryKey: "sale_id",
        bulkEndpoint: "/api/sales/bulk",
        updatedSinceEndpoint: "/api/sales/updated-since",
        lastSyncKey: "sales_last_sync",
        payloadKey: "sales",
    },
    {
        tableName: "Inventory_log",
        primaryKey: "inventory_log_id",
        bulkEndpoint: "/api/inventory-logs/bulk",
        updatedSinceEndpoint: "/api/inventory-logs/updated-since",
        lastSyncKey: "inventory_log_last_sync",
        payloadKey: "inventories",
    },
];