import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { getDBConnection } from '../services/db-service';
import { fetchGroupedProfit } from '../services/sales.service';
import { createSyncTable } from '../services/product.service';
import { pullServerUpdates } from '../services/pull.service';

const screenWidth = Dimensions.get('window').width;

const Dashboard = () => {
    const [weeklySales, setWeeklySales] = useState<number[]>([]);
    const [weeklyProfit, setWeeklyProfit] = useState<number[]>([]);
    const [labels, setLabels] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    const [best, setBest] = useState({ product: "", value: "" })
    const [worst, setWorst] = useState({ product: "", value: "" })
    const [msg, setMsg] = useState({ msg: "", state: "" });
    const [profit, setProfit] = useState("")
    const [low, setLow] = useState({ product: "", value: "" })
    const [loading, setLoading] = useState(false);
    const [syncing, seSyncing] = useState(false);
    const [data, setData] = useState([]);
    const [lastSync, setLastSync] = useState<string>('Never');

    const getLastSync = async () => {
        const db = await getDBConnection();
        await createSyncTable(db);
        const [results] = await db.executeSql(`SELECT last_sync FROM sync_status ORDER BY id DESC LIMIT 1`);
        const row = results.rows.item(0);
        if (row) {
            setLastSync(new Date(row.last_sync).toLocaleString());
        }
    }
    const updateLastSync = async () => {
        const db = await getDBConnection();
        await db.executeSql(`DELETE FROM sync_status`);
        await db.executeSql(`INSERT INTO sync_status (last_sync) VALUES (datetime('now'))`);
    };
    const fetchProfits = async () => {
        setLoading(true)
        const db = await getDBConnection();
        fetchGroupedProfit(db, "non-profit", (data: any) => {
            setData(data);
            setLoading(false)
        });

        const weekdayMap: Record<string, number> = {
            '0': 6, // Sunday → index 6
            '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5
        };

        const salesArray = Array(7).fill(0);
        const profitArray = Array(7).fill(0);

        data.forEach((row: any) => {
            const i = weekdayMap[row.weekday];
            const sales = parseFloat(row.total_sales);
            const profit = parseFloat(row.total_profit);
            salesArray[i] = isNaN(sales) ? 0 : sales;
            profitArray[i] = isNaN(profit) ? 0 : profit;
        });

        setWeeklySales(salesArray);
        setWeeklyProfit(profitArray);

    }
    useEffect(() => {
        getLastSync();
        fetchProfits(); // your chart query function
    }, []);

    useEffect(() => {
        const fetchProfits = async () => {
            setLoading(true)
            const db = await getDBConnection();
            fetchGroupedProfit(db, "best", (data: any) => {
                setBest({ product: data[0].product_name, value: data[0].profit })
                setLoading(false)
            });
        }
        fetchProfits()
    }, [])
    useEffect(() => {
        const fetchProfits = async () => {
            setLoading(true)
            const db = await getDBConnection();
            fetchGroupedProfit(db, "worst", (data: any) => {
                setWorst({ product: data[0].product_name, value: data[0].profit })
                setLoading(false)
            });
        }
        fetchProfits()
    }, [])
    useEffect(() => {
        const fetchProfits = async () => {
            setLoading(true)
            const db = await getDBConnection();
            fetchGroupedProfit(db, "profit", (data: any) => {
                setProfit(data[0].total_profit)
                setLoading(false)
            });
        }
        fetchProfits()
    }, [])
    useEffect(() => {
        const fetchProfits = async () => {
            setLoading(true)
            const db = await getDBConnection();
            fetchGroupedProfit(db, "low-stock", (data: any) => {
                console.log(data)
                setLow({ product: data[0].product_name, value: data[0].quantity })
                setLoading(false)
            });
        }
        fetchProfits()
    }, [])
    const handleManualSync = async () => {
        try {
            seSyncing(true)
            await fullSync();
            // await pullServerUpdates()
            // await updateLastSync(); // insert timestamp in SQLite
            // await getLastSync();    // refresh UI
            setMsg({ msg: "Sync Complete", state: "success" })
            seSyncing(false)
        } catch (err: any) {
            seSyncing(false)
            setMsg({ msg: `Sync Failed', ${err.message}`, state: "errpe" })
        }
    };
    return (
        <ScrollView className="bg-slate-900 flex-1 p-4">
            <View className={`${syncing ? "bg-slate-600" : "bg-slate-800"} rounded-2xl p-4 mb-4`}>
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-white text-base font-semibold">Last Sync</Text>
                    <Text className="text-white text-sm">{lastSync}</Text>
                </View>
                <TouchableOpacity
                    onPress={handleManualSync}
                    className={`${syncing ? "bg-slate-800 animate-pulse" : "bg-green-500"} p-2 rounded-xl items-center`}
                >
                    <Text className="text-white font-semibold">Manual Sync</Text>
                </TouchableOpacity>
            </View>

            <View className="flex-row justify-between mb-4">
                <View className="bg-yellow-500 rounded-2xl p-4 w-[48%]">
                    <Text className="text-white text-sm">Total Sales</Text>
                    <Text className="text-white text-xl font-bold">Ksh 12,450</Text>
                </View>
                <View className="bg-green-600 rounded-2xl p-4 w-[48%]">
                    <Text className="text-white text-sm">Profit</Text>
                    <Text className="text-white text-xl font-bold">Ksh {profit}</Text>
                </View>
            </View>
            <View className="flex-row justify-between mb-4">
                {best.value !== "" && <View className="bg-green-500 rounded-md p-4 w-[48%]">
                    <Text className="text-white font-bold tracking-widest uppercase text-sm">Best performing</Text>
                    <Text className="text-white text-xl font-bold">Ksh {best.value}</Text>
                    <Text className="text-slate-900 text-right font-bold text-sm">{best.product}</Text>
                </View>}
                {worst.value !== "" && <View className="bg-purple-500 border border-white rounded-md p-4 w-[48%]">
                    <Text className="text-white font-bold tracking-widest uppercase text-sm">Worst performing</Text>
                    <Text className="text-white text-xl font-bold">Ksh {worst.value}</Text>
                    <Text className="text-slate-900 text-right font-bold text-sm">{worst.product}</Text>
                </View>}
            </View>
            {low.value !== "" && <View className="bg-red-500  animate-pulse rounded-md p-4 w-[96%] mb-4">
                <Text className="text-white font-bold tracking-widest uppercase text-sm">Running law stack</Text>
                <Text className="text-white text-xl font-bold">Ksh {low.value}</Text>
                <Text className="text-slate-900 text-right font-bold text-sm">{low.product}</Text>
            </View>}
            <View className="bg-slate-800 p-4 rounded-2xl mb-4">
                <Text className="text-white mb-2">Weekly Profit</Text>
                {weeklyProfit.length > 0 && weeklySales.length > 0 && <LineChart
                    data={{
                        labels,
                        datasets: [
                            {
                                data: weeklySales,
                                color: () => '#facc15', // gold for sales
                                strokeWidth: 2,
                            },
                            {
                                data: weeklyProfit,
                                color: () => '#38bdf8', // sky-blue for profit
                                strokeWidth: 2,
                            },
                        ],
                        legend: ['Sales', 'Profit'],
                    }}
                    width={screenWidth - 32}
                    height={220}
                    chartConfig={{
                        backgroundColor: '#1e293b',
                        backgroundGradientFrom: '#1e293b',
                        backgroundGradientTo: '#1e293b',
                        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                        labelColor: () => '#fff',
                        propsForDots: { r: '3', strokeWidth: '1', stroke: '#fff' },
                    }}
                    bezier
                />}
            </View>

        </ScrollView>
    );
};

export default Dashboard;
