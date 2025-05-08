import { View } from "react-native";
import { FlatList } from "react-native-gesture-handler";


const SkeletonItem = () => (
    <View className="flex-row bg-slate-200 h-24 mx-4 my-2 rounded-xl animate-pulse p-3 items-center">
        <View className="w-20 bg-slate-300 h-full mr-4 resize-contain" />
        <View className="flex-1 gap-y-1">
            <View className="font-bold h-5 w-10 bg-slate-300 text-base"></View>
            <View className="text-gray-500  h-4 w-1 bg-slate-300 text-xs"></View>
            <View className="flex-row justify-between items-center mt-2">
                <View className="bg-gray-300 px-2 py-1 rounded">
                    <View className="text-xs"></View>
                </View>
                <View className=" h-4 w-10 bg-red-300"></View>
            </View>
        </View>
    </View>
);
export const SkeletonList = () => (
    <FlatList
        data={Array.from({ length: 6 })}
        keyExtractor={(_, i) => i.toString()}
        renderItem={SkeletonItem}
        contentContainerStyle={{ paddingBottom: 100 }}
    />
);
