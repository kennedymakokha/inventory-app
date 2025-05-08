import { View, Text, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import SalesReportTable from '../components/salesTable';
import PageHeader from '../../../components/pageHeader';
import { getDBConnection } from '../../../services/db-service';
import { getProducts } from '../../../services/product.service';
import { fetchGroupedProfit, fetchSales } from '../../../services/sales.service';
import { FormatDate, getDurationFromNow } from '../../../../utils/formatDate';

const SalesReport = () => {

    const headers =

        [{ key: 'day', label: 'period' },
        { key: 'product_name', label: 'product' },
        { key: 'product_price', label: 'Selling Pricw' },
        { key: 'product_Bprice', label: 'Buying Price' },
        { key: 'current_stock', label: 'Current Stock' },
        { key: 'total_units_sold', label: 'sold' },
        { key: 'total_profit', label: 'Profit' },
        ]
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [state, setState] = useState<Record<string, boolean>>({});
    const [filter, setFilter] = useState("All");
    useEffect(() => {
        const fetchProfits = async () => {
            setLoading(true)
            const db = await getDBConnection();
            fetchGroupedProfit(db, filter.toLocaleLowerCase(), (data: any) => {
                console.log(`${filter} Profit Data:`, data);
                setSales(data);
                setLoading(false)
            });
        }
        fetchProfits()
    }, [filter]);


    return (
        <View className="flex-1 dark:bg-slate-900 ">
            <PageHeader component={() => {
                return (
                    <View className="flex-row justify-around  gap-x-1 py-3 ">
                        {[{ id: 1, title: "All" }, { id: 2, title: "Daily" }, { id: 3, title: "Weekly" }, { id: 4, title: "Monthly" }, { id: 5, title: "Yearly" }].map((tab) => (
                            <TouchableOpacity key={tab.id} onPress={
                                () => {
                                    setState((prev) => ({
                                        ...prev,
                                        [tab.id]: true,
                                    })); setFilter(tab.title)
                                }
                            } className={`flex h-full px-2 py-1 ${state[tab.id] && filter === tab.title ? "bg-transparent border-slate-100 border  text-white" : "bg-white"} shadow-2xl rounded-md`}>
                                <Text key={tab.id} className={`${state[tab.id] && filter === tab.title ? "text-white" : ""} font-semibold`}>{tab.title}</Text>
                            </TouchableOpacity>

                        ))}
                    </View>
                )
            }} />

            <Text className="text-lg font-bold text-green-700 text-center my-2">{filter} Sales Report</Text>
            <SalesReportTable headers={headers} data={sales.map(({ day, product_name, product_price, product_Bprice, current_stock, total_units_sold, total_profit }) => ({ day, product_name, product_price, product_Bprice, current_stock, total_units_sold, total_profit }))} />
        </View>
    )
}

export default SalesReport