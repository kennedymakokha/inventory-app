import { DrawerActions, NavigationProp, useNavigation } from "@react-navigation/native";
import { Text } from "react-native";
import { TouchableOpacity, View } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { authStackParamList } from "../../models";
import SearchBar from "./searchBar";

function CustomHeader({ title, add }: { title: string, add?: boolean }) {
    const navigation = useNavigation<NavigationProp<authStackParamList>>();


    return (
        <View className="flex-row items-center justify-between p-4 bg-secondary-900 shadow-md">
            <View className="flex-row items-center">
                <TouchableOpacity
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    className="mr-4"
                >
                    <Ionicons name="menu" size={24} color="#d4af37" />
                </TouchableOpacity>
                <View className="flex-row items-center  justify-between  ">
                    <Text className="text-lg uppercase text-primary-500 font-semibold  tracking-widest">{title}</Text>
                </View>
            </View>

            <TouchableOpacity
                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                className="mr-4"
            >
                <Ionicons name="cart-sharp" size={24} color="#d4af37" />
            </TouchableOpacity>


        </View>
    );
}


export function CustomHeaderWithSearch({ title, noSearch }: { title: string, noSearch?: boolean }) {
    const navigation = useNavigation<NavigationProp<authStackParamList>>();


    return (
        <View className="flex-row justify-between items-center gap-x-2 p-4 w-full shadow-2xl bg-secondary-900 shadow-md">

            <View className="flex-row  items-center">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className=" "
                >
                    <Ionicons name="chevron-back-sharp" size={24} color="#d4af37" />
                </TouchableOpacity>
                <View className="flex-row items-center  justify-between  ">
                    <Text className="text-lg uppercase text-white font-bold  tracking-widest">{title}</Text>
                </View>
                {!noSearch && <View className="flex-row items-center   justify-between w-1/2  ">
                    <SearchBar placeholder="search" />
                </View>}
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("sales")}
                className="mr-4"
            >
                <Ionicons name="cart-sharp" size={24} color="#d4af37" />
            </TouchableOpacity>
        </View>
    );
}

export default CustomHeader
