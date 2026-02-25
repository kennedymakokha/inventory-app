import { View, Text, ScrollView, Pressable } from "react-native";

export default function Dashboard() {
  return (
    <ScrollView className="flex-1 bg-gray-100 p-4">
      {/* Top Stats Section */}
      <View className="flex-row flex-wrap justify-between mb-4">
        <View className="w-[48%] bg-white rounded-lg p-4 shadow">
          <Text className="text-gray-500">Total Sales</Text>
          <Text className="text-xl font-bold text-gray-900">$23,896</Text>
          <Text className="text-green-600">↑ 10%</Text>
        </View>

        <View className="w-[48%] bg-white rounded-lg p-4 shadow">
          <Text className="text-gray-500">Total Orders</Text>
          <Text className="text-xl font-bold text-gray-900">456</Text>
          <Text className="text-green-600">↑ 10%</Text>
        </View>

        <View className="w-[48%] bg-white rounded-lg p-4 shadow mt-4">
          <Text className="text-gray-500">Store Products</Text>
          <Text className="text-xl font-bold text-gray-900">77</Text>
          <Text className="text-red-600">↓ 32%</Text>
        </View>

        <View className="w-[48%] bg-white rounded-lg p-4 shadow mt-4">
          <Text className="text-gray-500">Store Availability</Text>
          <Text className="text-xl font-bold text-gray-900">Open</Text>
          <View className="flex-row mt-2">
            <Pressable className="bg-red-500 px-3 py-1 rounded mr-2">
              <Text className="text-white">Close</Text>
            </Pressable>
            <Pressable className="bg-green-500 px-3 py-1 rounded">
              <Text className="text-white">Open</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Statistics Section */}
      <View className="bg-white rounded-lg p-4 shadow">
        <Text className="text-lg font-semibold mb-2">Statistics: Total Sales</Text>

        {/* Bar Chart Mockup */}
        <View className="flex-row items-end justify-between mt-4">
          {/* 2021 */}
          <View className="items-center">
            <View className="w-6 h-32 bg-blue-800 rounded" />
            <View className="w-6 h-24 bg-blue-400 rounded mt-1" />
            <Text className="mt-2 text-xs">2021</Text>
          </View>

          {/* 2022 */}
          <View className="items-center">
            <View className="w-6 h-28 bg-blue-800 rounded" />
            <View className="w-6 h-20 bg-blue-400 rounded mt-1" />
            <Text className="mt-2 text-xs">2022</Text>
          </View>

          {/* 2023 */}
          <View className="items-center">
            <View className="w-6 h-36 bg-blue-800 rounded" />
            <View className="w-6 h-24 bg-blue-400 rounded mt-1" />
            <Text className="mt-2 text-xs">2023</Text>
          </View>

          {/* 2024 */}
          <View className="items-center">
            <View className="w-6 h-24 bg-blue-800 rounded" />
            <View className="w-6 h-12 bg-blue-400 rounded mt-1" />
            <Text className="mt-2 text-xs">2024</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
