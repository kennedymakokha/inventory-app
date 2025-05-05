import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { authStackParamList } from "../../models";
import LoginScreen from "../screens/Logincreen";
import { useAuthContext } from "../context/authContext";
import ProductScreen from "../screens/product.screen";


const Stack = createNativeStackNavigator<authStackParamList>();

export function RootStack() {

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      <Stack.Screen name="Home" options={{}} component={ProductScreen} />

    </Stack.Navigator>
  );
}
export function AuthStack() {

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      <Stack.Screen name="login" component={LoginScreen} />

    </Stack.Navigator>
  );
}



