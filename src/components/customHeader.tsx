import { DrawerActions, NavigationProp, useNavigation } from "@react-navigation/native";
import { Text, View, TouchableOpacity } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { authStackParamList } from "../../models";
import SearchBar from "./searchBar";
import { useSettings } from "../context/SettingsContext";


function CustomHeader({ title, add }: { title: string; add?: boolean }) {
  const navigation = useNavigation<NavigationProp<authStackParamList>>();
  const { isDarkMode } = useSettings();

  const bgColor = isDarkMode ? "#1e293b" : "#f8fafc";
  const primaryColor = isDarkMode ? "#d4af37" : "#0f172a";
  const textColor = isDarkMode ? "#ffffff" : "#0f172a";

  return (
    <View
      style={{ backgroundColor: bgColor }}
      className="flex-row items-center justify-between p-4 shadow-md"
    >
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          className="mr-4"
        >
          <Ionicons name="menu" size={24} color={primaryColor} />
        </TouchableOpacity>
        <View className="flex-row items-center justify-between">
          <Text
            style={{ color: textColor }}
            className="text-lg uppercase font-semibold tracking-widest"
          >
            {title}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        className="mr-4"
      >
        <Ionicons name="cart-sharp" size={24} color={primaryColor} />
      </TouchableOpacity>
    </View>
  );
}

export function CustomHeaderWithSearch({
  title,
  noSearch,
}: {
  title: string;
  noSearch?: boolean;
}) {
  const navigation = useNavigation<NavigationProp<authStackParamList>>();
  const { isDarkMode } = useSettings();

  const bgColor = isDarkMode ? "#1e293b" : "#f8fafc";
  const primaryColor = isDarkMode ? "#d4af37" : "#0f172a";
  const textColor = isDarkMode ? "#ffffff" : "#0f172a";

  return (
    <View
      style={{ backgroundColor: bgColor }}
      className="flex-row justify-between items-center gap-x-2 p-4 w-full shadow-2xl"
    >
      <View className="flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back-sharp" size={24} color={primaryColor} />
        </TouchableOpacity>
        <View className="flex-row items-center justify-between">
          <Text
            style={{ color: textColor }}
            className="text-lg uppercase font-bold tracking-widest"
          >
            {title}
          </Text>
        </View>
        {!noSearch && (
          <View className="flex-row items-center justify-between w-1/2">
            <SearchBar placeholder="search" />
          </View>
        )}
      </View>
      <TouchableOpacity onPress={() => navigation.navigate("sales")} className="mr-4">
        <Ionicons name="cart-sharp" size={24} color={primaryColor} />
      </TouchableOpacity>
    </View>
  );
}

export default CustomHeader;