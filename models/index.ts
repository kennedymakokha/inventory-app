export type ToDoItem = {
    id: number;
    value: string;
};

export type ProductItem = {
    _id?: string;
    id?: string | any
    barcode?: string;
    business_id: string
    product_name: string;
    category_id: string;
    product_id: string;
    expiryDate: any
    price: number;
    soldprice: number;
    initial_stock: string,
    quantity: number
    createdBy?: string | any,
    Bprice: number
    description: string,
    updatedAt: string
    synced: boolean
};
export type CategoryItem = {
    _id?: string;
    id?: string | any
    category_name: string;
    business_id: string

    category_id: string;
    createdBy?: string | any,
    description: string,
    updatedAt?: string
    synced?: boolean
};
export type UserItem = {
    name: string;
    business_id: string;
    phone_number: string;
    role: string;
    user_id: string;
    id?: string
    email?: string;
    createdBy?: string | any,

    updatedAt?: string
    synced?: boolean
};
export type InventoryItem = {
    _id?: string;
    id?: string | any
    product_id: string;
    soldprice?: number;
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
    categories: undefined
    settings: undefined
    inventory: undefined
    sales: undefined
    salesreport: undefined
    inventory_Dashboard: undefined
    categories_Dashboard: undefined


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
    isDarkMode?: boolean;
    disabled?:boolean
    value: string | any;
    onChangeText: (text: string) => void;
    placeholder: string;
    hide?: boolean,
    setHide?: any,
    label?: string
};

export type CartItem = {
    id: string | any;
    product_name: string;
    receipt_number?: string
    payment_method?: string
    product_id: string;
    price: number;
    quantity: number;
};

export interface DataSales {
    total_sales_revenue: number;
    pending_orders: number;
    total_profit: number;
    // Add other properties if needed
}


export interface DataPoint {
    key: string;
    value: number;
}

export interface Dataset {
    label: string;
    data: DataPoint[];
}
