// navigationOptions.ts
import { TextStyle } from "react-native";
import { Theme } from "../utils/theme";

export const defaultHeaderOptions = (isDarkMode: boolean) => ({
  headerShown: true,
  headerStyle: { backgroundColor: isDarkMode ? "#1e293b" : "#f8fafc" },
  headerTintColor: isDarkMode ? "#d4af37" : "#0f172a",
  headerTitleStyle: {  fontWeight: 'bold' as TextStyle['fontWeight'], },
});

