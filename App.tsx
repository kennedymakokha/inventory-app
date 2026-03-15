import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import {
  StatusBar,
  View,
  Text,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  StyleSheet
} from 'react-native';

import { SafeAreaProvider } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';

import { SettingsProvider } from './src/context/SettingsContext';
import { useAuthContext } from './src/context/authContext';
import { useTokenExpiryWatcher } from './src/hooks/useTokenExpiryWatcher';

import { RootDrawer } from './src/navigations/rootDrawer';
import { AuthStack } from './src/navigations/auth/stack';

import { globalSync } from './src/sync';
import { syncTables } from './src/sync/tables';

import { getDBConnection } from './src/services/db-service';
import { createRefundItemsTable, createRefundsTable, createSalesItemTable, createSalesTable } from './src/services/sales.service';
import { createCategoryTable } from './src/services/category.service';
import { createProductTable } from './src/services/product.service';
import { createInventorylogTable } from './src/services/inventory.service';
import { createCashRegisterTable, createPaymentsTable } from './src/services/closeOpen.service';

import { SyncLoader } from './src/sync/SyncLoader';

import "./global.css";
import { createUserTable } from './src/services/users.service';
import { CartProvider } from './src/context/CartContext';
import { BusinessProvider } from './src/context/BusinessContext';
import { UserProvider } from './src/context/UserContext';
import { SocketProvider } from './src/context/socketContext';


/* -------------------------------- */
/* Global Guards */
/* -------------------------------- */

let tablesInitialized = false;
let syncing = false;

/* -------------------------------- */
/* Sync Wrapper */
/* -------------------------------- */

const safeSync = async () => {

  const token = await AsyncStorage.getItem("accessToken");

  if (!token) {
    console.log("⛔ No token → skipping sync");
    return;
  }

  if (syncing) return;

  syncing = true;

  try {
    await globalSync(syncTables);
  } catch (e) {
    console.log("Sync error:", e);
  } finally {
    syncing = false;
  }

};

/* -------------------------------- */
/* Main App */
/* -------------------------------- */

function App(): React.JSX.Element {

  /* -------------------------------- */
  /* AUTH FLOW */
  /* -------------------------------- */

  const AppWithAuth = () => {


    const { token, logout } = useAuthContext();
    const [syncDone, setSyncDone] = React.useState(false);

    useTokenExpiryWatcher(token, logout);

    /* ------------------------------- */
    /* START SYNC ONLY WHEN LOGGED IN */
    /* ------------------------------- */

    useEffect(() => {

      if (!token) return;

      let netUnsubscribe: any;
      let interval: any;

      const startSync = () => {

        netUnsubscribe = NetInfo.addEventListener(state => {

          if (state.isConnected && state.isInternetReachable) {

            console.log("🌐 Internet detected → running sync");

            safeSync();

          }

        });

        interval = setInterval(() => {

          safeSync();

        }, 120000);

      };

      startSync();

      return () => {

        if (netUnsubscribe) netUnsubscribe();
        if (interval) clearInterval(interval);

      };

    }, [token]);

    if (!token) {
      return <AuthStack />;
    }

    if (!syncDone) {
      return <SyncLoader onDone={() => setSyncDone(true)} />;
    }

    return <RootDrawer />;


  };

  /* -------------------------------- */
  /* BLUETOOTH PERMISSIONS */
  /* -------------------------------- */

  const requestBluetoothPermissions = async () => {


    if (Platform.OS !== 'android' || Platform.Version < 31) {
      return true;
    }

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

      if (!granted) {
        console.log('Bluetooth permission denied');
      }

    };

    setupPermissions();


  }, []);

  /* -------------------------------- */
  /* DATABASE SETUP */
  /* -------------------------------- */

  useEffect(() => {


    const setupDB = async () => {

      try {

        if (tablesInitialized) return;

        let db = await getDBConnection();
        // await db.executeSql(`DROP TABLE IF EXISTS Payments;`);

        await createUserTable();
        await createPaymentsTable();
        await createProductTable();
        await createCategoryTable();
        await createSalesTable();
        await createSalesItemTable();
        await createRefundsTable();
        await createRefundItemsTable();
        await createInventorylogTable();
        await createCashRegisterTable();


        tablesInitialized = true;

        console.log("Database ready");

      } catch (err) {

        console.error("DB setup failed", err);

      }

    };

    setupDB();


  }, []);

  /* -------------------------------- */
  /* UI */
  /* -------------------------------- */
  // socket.on("connection", (socket) => {
  //     console.log(socket.id); // x8WIv7-mJelg7on_ALbx
  //   });

  //   // client-side
  //   socket.on("connect", () => {
  //     console.log(socket.id); // x8WIv7-mJelg7on_ALbx
  //   });

  //   socket.on("disconnect", () => {
  //     console.log(socket.id); // undefined
  //   });
  return (


    <View style={styles.container}>

      <StatusBar animated backgroundColor="#000000" />

      <SafeAreaProvider>
        <CartProvider>

          <Provider store={store}>
            <BusinessProvider>
              <SocketProvider>
                <UserProvider>
                  <SettingsProvider>
                    <PersistGate
                      persistor={persistor}
                      loading={
                        <View style={styles.center}>
                          <ActivityIndicator size="large" color="#ffffff" />
                          <Text style={styles.loadingText}>Loading app...</Text>
                        </View>
                      }
                    >

                      <AppWithAuth />

                    </PersistGate>

                  </SettingsProvider>
                </UserProvider>
              </SocketProvider>
            </BusinessProvider>
          </Provider>

        </CartProvider>
      </SafeAreaProvider>

    </View>


  );

}

export default App;

/* -------------------------------- */
/* Styles */
/* -------------------------------- */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#1e293b'
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b'
  },

  loadingText: {
    color: 'white',
    marginTop: 10
  }

});
