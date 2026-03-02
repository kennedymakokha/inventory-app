import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../../models/navigationTypes";
import LoginScreen from "../../screens/Logincreen";

export function AuthStack() {
    const AuthStack = createNativeStackNavigator<AuthStackParamList>();
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}