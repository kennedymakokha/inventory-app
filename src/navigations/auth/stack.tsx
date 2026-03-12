import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../../models/navigationTypes";
import LoginScreen from "../../screens/Logincreen";
import ForgotPasswordScreen from "../../screens/forgotPssword";
import OTPActivationScreen from "../../screens/activationScreen";
import ResetPasswordScreen from "../../screens/restPassword";

export function AuthStack() {
  const AuthStack = createNativeStackNavigator<AuthStackParamList>();
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="login" component={LoginScreen} />
      <AuthStack.Screen name="forgetPass" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="activation" component={OTPActivationScreen} />
      <AuthStack.Screen name="resetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
}