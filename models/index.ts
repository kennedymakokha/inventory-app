export type ToDoItem = {
    id: number;
    value: string;
};

export type ProductItem = {
    _id?: string;
    product_name: string;
    price: string;
    description: string,
    updatedAt?: string
    synced?: boolean
};