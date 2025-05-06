import { View, Text, Dimensions } from 'react-native'
import React from 'react'
import { LineChart } from 'react-native-chart-kit';

const DashboardScreen = () => {
    const screenHight = Dimensions.get('window').height
    return (
        <View style={{ minHeight: screenHight }} className="flex  gap-4 p-4  bg-secondary-900">
            <View className="flex flex-row gap-4 h-40 p-4 ">
                <View className="bg-white shadow-md rounded-lg p-5">
                    <Text className="text-lg font-semibold text-gray-700">Total Stock</Text>
                    <Text className="text-2xl font-bold text-blue-500">1,245 Items</Text>
                </View>
                <View className="bg-white shadow-md rounded-lg p-5">
                    <Text className="text-lg font-semibold text-gray-700">Low Stock Alerts</Text>
                    <Text className="text-2xl font-bold text-red-500">15 Items</Text>
                </View>
            </View>
            <View className="bg-white p-4 rounded-lg shadow">
                <Text className="font-bold text-lg mb-3">Inventory List</Text>
                {/* <FlatList
                    data={inventoryData}
                    renderItem={({ item }) => (
                        <View className="flex-row justify-between py-2 border-b">
                            <Text>{item.name}</Text>
                            <Text className="font-bold">{item.stock} left</Text>
                        </View>
                    )}
                /> */}
            </View>
            {/* <LineChart
                data={{
                    labels: ["Jan", "Feb", "Mar", "Apr"],
                    datasets: [{ data: [500, 600, 750, 900] }],
                }}
                width={300}
                height={220}
                chartConfig={{ color: () => `blue` }}
            /> */}

        </View>
    )
}

export default DashboardScreen