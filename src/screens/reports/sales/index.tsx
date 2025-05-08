import { View, Text, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import SalesReportTable from '../components/salesTable';
import PageHeader from '../../../components/pageHeader';
import { getDBConnection } from '../../../services/db-service';
import { getProducts } from '../../../services/product.service';
import { fetchGroupedProfit, fetchSales } from '../../../services/sales.service';
import { FormatDate } from '../../../../utils/formatDate';

const SalesReport = () => {

    const headers = ['created_at', 'product_name', 'product_quantity', 'product_price'];
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [state, setState] = useState<Record<string, boolean>>({});
    const [filter, setFilter] = useState("All");
    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true)
            const db = await getDBConnection();
            const fetchedSales: any = await fetchSales(db);
            setSales(fetchedSales);
            setLoading(false)

            // Example of how to use this function

        };
        loadProducts();
    }, []);

    const fetchProfits = async () => {
        const db = await getDBConnection();
        fetchGroupedProfit(db, filter.toLocaleLowerCase(), (data: any) => {
            console.log(`${filter} Profit Data:`, data);
        });
    }
    return (
        <View className="flex-1 dark:bg-slate-900 ">
            <PageHeader component={<><Text>Ken</Text></>} />
            <View className="flex-row justify-around  gap-x-1 py-3 ">
                {[{ id: 1, title: "All" }, { id: 2, title: "Daily" }, { id: 3, title: "Weekly" }, { id: 4, title: "Monthly" }, { id: 5, title: "Yearly" }].map((tab) => (
                    <TouchableOpacity key={tab.id} onPress={
                        () => {
                            fetchProfits();
                            setState((prev) => ({
                                ...prev,
                                [tab.id]: true,
                            })); setFilter(tab.title)
                        }
                    } className={`flex h-full px-2 py-1 ${state[tab.id] && filter === tab.title ? "bg-slate-700 text-white" : "bg-white"} shadow-2xl rounded-md`}>
                        <Text key={tab.id} className="text-slate-700 font-semibold">{tab.title}</Text>
                    </TouchableOpacity>

                ))}
            </View>
            <Text className="text-lg font-bold text-green-700 mb-2">{filter} Sales Report</Text>
            <SalesReportTable headers={headers} data={sales.map(({ created_at, product_name, product_quantity, product_price, synced }) => ({ created_at: FormatDate(created_at), product_name, product_quantity, product_price: product_quantity * product_price, synced }))} />
        </View>
    )
}

export default SalesReport