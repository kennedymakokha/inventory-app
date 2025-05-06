import { View } from "react-native";
import { FlatList } from "react-native-gesture-handler";


export const SkeletonItem = () => (

    <View className="flex-row w-full h-24 justify-between bg-secondary-800  px-4 py-2 rounded-lg animate-pulse mt-2">
        <View className="gap-y-1">
            <View className="font-bold  bg-secondary-700 h-5 w-14 rounded-sm text-lg" />
            <View className="bg-secondary-700  rounded-sm w-20 h-4" />
            <View className="bg-secondary-700 rounded-sm w-32 h-4" />
        </View>
        {/* Restock Button */}
        <View className="bg-secondary-700 w-20 h-[80%] self-center  p-2 rounded">
            {/* <View className="text-white" /> */}
        </View>
    </View>
    // <View className="w-[48%] h-32 bg-secondary-800 rounded-xl m-1 animate-pulse" />
);

export const SkeletonList = () => (
    <FlatList
        data={Array.from({ length: 6 })}
        keyExtractor={(_, i) => i.toString()}
        renderItem={SkeletonItem}
        numColumns={2}
        contentContainerStyle={{ paddingBottom: 100 }}
    />
);
