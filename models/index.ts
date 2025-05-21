export type ToDoItem = {
    id: number;
    value: string;
};

export type ProductItem = {
    _id?: string;
    id?: string | any
    product_name: string;
    expiryDate?: any
    price: string;
    soldprice?:number;
    initial_stock: string,
    quantity: number
    createdBy?: string | any,
    Bprice?: number
    description: string,
    updatedAt?: string
    synced?: boolean
};
export type InventoryItem = {
    _id?: string;
    id?: string | any
    product_id: string;
    soldprice?:number;
    expiryDate?: any
    quantity: string
    updatedAt?: string
    synced?: boolean
    createdBy?: string | any
};

export type authStackParamList = {
    login: undefined
    Home: any
    dashboard: any
    products: undefined
    inventory: undefined
    sales: undefined
    salesreport: undefined
    inventory_Dashboard: undefined
    inventory_Details: {
        product: any;
    } | undefined | any;
}
export type ReportParamList = {
    salesReport: undefined
}

export type User = {
    phone_number?: string,
    password?: string,
    username?: string,
}
export type InputProps = {
    latlng?: string;
    keyboardType?: string | any;
    editable?: boolean;
    multiline?: boolean;
    value: string | any;
    onChangeText: (text: string) => void;
    placeholder: string;
    hide?: boolean,
    setHide?: any,
    label?: string
};

export type CartItem = {
    id: string;
    product_name: string;
    price: number;
    quantity: number;
};

 export interface DataSales {
        total_sales_revenue: number;
        // Add other properties if needed
    }
    