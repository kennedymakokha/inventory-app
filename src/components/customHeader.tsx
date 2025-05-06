import { DrawerActions, NavigationProp, useNavigation } from "@react-navigation/native";
import { Text } from "react-native";
import { TouchableOpacity, View } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { authStackParamList } from "../../models";

function CustomHeader({ title, add }: { title: string, add?: boolean }) {
    const navigation = useNavigation<NavigationProp<authStackParamList>>();


    return (
        <View className="flex-row items-center p-4 bg-secondary-900 shadow-md">
            <TouchableOpacity
                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                className="mr-4"
            >
                <Ionicons name="menu" size={24} color="#d4af37" />
            </TouchableOpacity>
            <View className="flex-row items-center  justify-between w-full ">
                <Text className="text-lg uppercase text-primary-500 font-semibold  tracking-widest">{title}</Text>
            </View>

        </View>
    );
}

export default CustomHeader
