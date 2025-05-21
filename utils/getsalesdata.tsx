import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6'
interface Sale {
    day: string;
    product_name: string;
    product_Bprice: number;
    product_price: number;
    current_stock: number;
    total_units_sold: number;
    total_profit: number | null | any;
    expected_profit: number;
}
export const Adminheaders =

    [{ key: 'day', label: 'period' },
    { key: 'product_name', label: 'product' },
    { key: 'product_Bprice', label: 'Buying Price' },
    { key: 'product_price', label: 'Selling Price' },
    { key: 'current_stock', label: 'Current Stock' },
    { key: 'total_units_sold', label: 'sold' },
    { key: 'total_profit', label: 'Profit' },
    ]
export const getadminSalesReportData = (sales: Sale[]) => {
    return sales.map(
        ({
            day,
            product_name,
            product_Bprice,
            product_price,
            current_stock,
            total_units_sold,
            total_profit,
            expected_profit
        }) => {
            const isLoss: any = total_profit < expected_profit || total_profit === null;

            return {
                day,
                product_name,
                product_price,
                product_Bprice,
                current_stock,
                total_units_sold,
                total_profit: (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }
                    }>
                        <Text>{total_profit} </Text>
                        < Icon
                            name={isLoss ? 'arrow-down-long' : 'arrow-up-long'}
                            color={isLoss ? 'red' : 'green'}
                            style={{ marginLeft: 4 }}
                        />
                    </View>
                )
            };
        }
    );
};


export const salesheaders =

    [{ key: 'day', label: 'period' },
    { key: 'product_name', label: 'product' },
    { key: 'product_price', label: 'Selling Price' },
    { key: 'current_stock', label: 'Current Stock' },
    { key: 'total_units_sold', label: 'sold' },

    ]
export const getSalesReportData = (sales: Sale[]) => {
    return sales.map(
        ({
            day,
            product_name,
            product_price,
            current_stock,
            total_units_sold,
        }) => {


            return {
                day,
                product_name,
                product_price,
                current_stock,
                total_units_sold,

            };
        }
    );
};

export const salesFilter = [
    { id: 1, title: "today" },
    { id: 2, title: "last-week" },
    { id: 3, title: "last-month" },
    { id: 4, title: "last-3months" }
]

export const adminFilter = [{ id: 1, title: "All" },
{ id: 2, title: "Daily" },
{ id: 3, title: "Weekly" },
{ id: 4, title: "Monthly" },
{ id: 5, title: "Yearly" }
]

