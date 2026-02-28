import React, { useEffect, useCallback } from 'react';
import { StatusBar, View, PermissionsAndroid, Platform } from 'react-native';
import "./global.css";

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { store, persistor } from './store';
import { SettingsProvider } from './src/context/SettingsContext';
import { useAuthContext } from './src/context/authContext';
import { useTokenExpiryWatcher } from './src/hooks/useTokenExpiryWatcher';
import { AuthStack } from './src/navigations/rootStack';
import { RootDrawer } from './src/navigations/rootDrawer';

import {
  Printer,
  PrinterConstants,
} from 'react-native-esc-pos-printer';
import { printReceipt } from './src/services/printerService';

/* 🔥 CHANGE THIS TO YOUR PRINTER MAC */


function App(): React.JSX.Element {

  /* ---------------- AUTH ---------------- */

  const AppWithAuth = () => {
    const { token, logout } = useAuthContext();
    useTokenExpiryWatcher(token, logout);
    return token ? <RootDrawer /> : <AuthStack />;
  };

  /* ---------------- PERMISSIONS ---------------- */

  const requestBluetoothPermissions = async () => {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      return (
        granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.log('Permission error:', err);
      return false;
    }
  };

  /* ---------------- TEST PRINT ---------------- */



  /* ---------------- INIT ---------------- */

  useEffect(() => {
    const setup = async () => {
      const granted = await requestBluetoothPermissions();
      if (!granted) {
        console.log('Bluetooth permission denied');
        return;
      }

      // 🔥 Make sure printer is already paired in Android settings
      await printReceipt('Test Print from Inventory App\n');
    };

    setup();
  }, [printReceipt]);

  /* ---------------- UI ---------------- */

  return (
    <View className="flex-1 bg-[#1e293b]">
      <StatusBar animated backgroundColor="#000000" />

      <Provider store={store}>
        <SettingsProvider>
          <PersistGate loading={null} persistor={persistor}>
            <AppWithAuth />
          </PersistGate>
        </SettingsProvider>
      </Provider>
    </View>
  );
}

export default App;