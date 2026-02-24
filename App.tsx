import React, { useEffect, useState } from 'react';
import { StatusBar, View } from 'react-native';
import "./global.css"
// import './gesture-handler';
import { Provider } from 'react-redux';
import { persistor, store } from './store';
import { useTokenExpiryWatcher } from './src/hooks/useTokenExpiryWatcher';
import { AuthStack, RootStack } from './src/navigations/rootStack';
import { RootDrawer } from './src/navigations/rootDrawer';
import { PersistGate } from 'redux-persist/integration/react';
import { useAuthContext } from './src/context/authContext';
import PrintTest from './src/screens/printTest';
import { requestBluetoothPermissions } from './src/utils/permsions';
import { initPrinter } from './src/services/printerService';
function App(): React.JSX.Element {
  const [loading, setLoading] = useState(true)
  const AppWithAuth = () => {
    const { token, logout } = useAuthContext();
    useTokenExpiryWatcher(token, logout);
    useTokenExpiryWatcher(token, logout); // 👈 auto-logout watcher
    return token ? <RootDrawer /> : <AuthStack />;

  };
 useEffect(() => {
  const setupPrinter = async () => {
    const granted = await requestBluetoothPermissions();
    if (!granted) return;

    await initPrinter();
  };

  setupPrinter();
}, []);
  return (
    <View className="flex-1 dark bg-[#1e293b]">
      <StatusBar animated={true} backgroundColor="#000000" />
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <AppWithAuth />
        </PersistGate>
      </Provider>
    </View>
  );
}
export default App;
