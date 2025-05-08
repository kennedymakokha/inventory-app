export type ToDoItem = {
    id: number;
    value: string;
};

export type ProductItem = {
    _id?: string;
    id?: string | any
    product_name: string;
    price: string;
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