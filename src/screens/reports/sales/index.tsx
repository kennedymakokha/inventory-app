import { View, Text, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import SalesReportTable from '../components/salesTable';
import PageHeader from '../../../components/pageHeader';
import { getDBConnection } from '../../../services/db-service';
import { fetchCumulativeProfit, fetchGroupedProfit } from '../../../services/sales.service';
import { adminFilter, Adminheaders, getadminSalesReportData, getSalesReportData, salesFilter, salesheaders } from '../../../../utils/getsalesdata';
import { useSelector } from 'react-redux';
import { DataSales } from '../../../../models';
const SalesReport = () => {

    const { user } = useSelector((state: any) => state.auth)
   
    const [datasales, setdataSales] = useState<DataSales | null>(null);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [state, setState] = useState<Record<string, boolean>>({});
    const [filter, setFilter] = useState("All");
    useEffect(() => {
        const fetchProfits = async () => {
            setLoading(true)
            const db = await getDBConnection();
            fetchCumulativeProfit(db, filter.toLocaleLowerCase(), (data: any) => {
                setdataSales(data);
                setLoading(false)
            });
            fetchGroupedProfit(db, filter.toLocaleLowerCase(), (data: any) => {
                setSales(data);
                setLoading(false)
            });
        }
        fetchProfits()
    }, [filter]);
  
    let filterData: any = user?.role === "superAdmin" ? adminFilter : salesFilter
    return (
        <View className="flex-1 bg-slate-900 ">
            <PageHeader component={() => {
                return (
                    <View className="flex-row flex-wrap w-full  justify-around  gap-x-1 py-3 ">
                        {filterData.map((tab: any) => (
                            <TouchableOpacity key={tab.id} onPress={
                                () => {
                                    setState((prev) => ({
                                        ...prev,
                                        [tab.id]: true,
                                    })); setFilter(tab.title)
                                }
                            } className={`flex h-full px-2 py-1 ${state[tab.id] && filter === tab.title ? "bg-transparent border-slate-100 border  text-white" : "bg-white"} shadow-2xl rounded-md`}>
                                <Text key={tab.id} className={`${state[tab.id] && filter === tab.title ? "text-white" : "capitalize text-center"} font-semibold`}>{tab.title}</Text>
                            </TouchableOpacity>

                        ))}
                    </View>
                )
            }} />
            <View className="flex items-center justify-between flex-row px-10">
                <Text className="text-lg font-bold uppercase text-green-700 text-center my-2">{filter} Sales Report</Text>
                <Text className="text-blue-500 font-bold tracking-widest">{datasales?.total_sales_revenue}/-</Text>
            </View>


            <SalesReportTable headers={user?.role === "superAdmin" ? Adminheaders : salesheaders} data={user?.role === "superAdmin" ? getadminSalesReportData(sales) : getSalesReportData(sales)} />
        </View>
    )
}

export default SalesReport