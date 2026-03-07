import 'react-native-get-random-values';
import React, { useEffect, useRef } from 'react';
import { StatusBar, View, Text, PermissionsAndroid, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';

import { SettingsProvider } from './src/context/SettingsContext';
import { useAuthContext } from './src/context/authContext';
import { useTokenExpiryWatcher } from './src/hooks/useTokenExpiryWatcher';

import { RootDrawer } from './src/navigations/rootDrawer';
import { AuthStack } from './src/navigations/auth/stack';

import { startGlobalAutoSync } from './src/sync/netinfo';
import { syncTables } from './src/sync/tables';
import { getDBConnection } from './src/services/db-service';
import { createRefundItemsTable, createRefundsTable, createSalesTable } from './src/services/sales.service';
import { createCategoryTable } from './src/services/category.service';
import { createInventorylogTable, createProductTable } from './src/services/product.service';
import { createTableIfNotExists } from './src/utils/tableExists';
import "./global.css";
import { globalSync } from './src/sync';
import { createInventoryTable } from './src/services/inventory.service';
/* 🔹 Global flag to ensure tables are created only once */
let tablesInitialized = false;

function App(): React.JSX.Element {

  /* ---------------- AUTH ---------------- */
  const AppWithAuth = () => {
    const { token, logout } = useAuthContext();
    const [checkingToken, setCheckingToken] = React.useState(true);

    useTokenExpiryWatcher(token, logout);

    // Simulate token check/loading
    useEffect(() => {
      setCheckingToken(false);
    }, [token]);

    if (checkingToken) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' }}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={{ color: 'white', marginTop: 10 }}>Checking authentication...</Text>
        </View>
      );
    }

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

  useEffect(() => {
    const setupPermissions = async () => {
      const granted = await requestBluetoothPermissions();
      if (!granted) console.log('Bluetooth permission denied');
    };
    setupPermissions();
  }, []);

  /* ---------------- DATABASE & SYNC ---------------- */
  useEffect(() => {
    let unsubscribe: any;
    let netUnsubscribe: any;

    const setupDB = async () => {
      try {
        const db = await getDBConnection();
        //  await db.executeSql(`DROP TABLE IF EXISTS Product;`);
        //  await db.executeSql(`ALTER TABLE Product ADD COLUMN stock INTEGER DEFAULT 0;`);
        //  await db.executeSql(`CREATE INDEX idx_product_id ON Product(product_id);`);
        await createProductTable();
        await createCategoryTable();
        await createSalesTable();
        await createInventoryTable();
        await createInventorylogTable();
        await createRefundsTable();
        await createRefundItemsTable();

        // Listen for internet changes
        netUnsubscribe = NetInfo.addEventListener(async state => {
          if (state.isConnected && state.isInternetReachable) {
            console.log("🌐 Internet detected → running sync");
            await globalSync(syncTables);
          }
        });

        // Start periodic autosync
        unsubscribe = startGlobalAutoSync(syncTables);

        console.log("All tables ready, sync started");
      } catch (err) {
        console.error("DB setup failed", err);
      }
    };

    setupDB();

    return () => {
      if (unsubscribe) unsubscribe();
      if (netUnsubscribe) netUnsubscribe();
    };
  }, []);

  // useEffect(() => {

  //   const interval = setInterval(() => {
  //     globalSync(syncTables);
  //   }, 150000);

  //   return () => clearInterval(interval);

  // }, []);
  /* ---------------- UI ---------------- */
  return (
    <View style={{ flex: 1, backgroundColor: '#1e293b' }}>
      <StatusBar animated backgroundColor="#000000" />
      <SafeAreaProvider>
        <Provider store={store}>
          <SettingsProvider>
            <PersistGate
              loading={
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' }}>
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text style={{ color: 'white', marginTop: 10 }}>Loading app...</Text>
                </View>
              }
              persistor={persistor}
            >
              <AppWithAuth />
            </PersistGate>
          </SettingsProvider>
        </Provider>
      </SafeAreaProvider>
    </View>
  );
}

export default App;