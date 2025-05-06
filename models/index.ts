export type ToDoItem = {
    id: number;
    value: string;
};

export type ProductItem = {
    _id?: string;
    id?: string | any
    product_name: string;
    price: string;
    description: string,
    updatedAt?: string
    synced?: boolean
};

export type authStackParamList = {
    login: undefined
    Home: any
    dashboard: any
    products: undefined
    inventory: undefined
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