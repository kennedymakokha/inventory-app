import { View } from "react-native";
import { FlatList } from "react-native-gesture-handler";


const SkeletonItem = () => (
    <View className="w-[48%] h-32 bg-secondary-800 rounded-xl m-1 animate-pulse" />
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
