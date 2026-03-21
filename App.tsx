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
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import Ionicons from 'react-native-vector-icons/Ionicons'
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
import { BusinessProvider, useBusiness } from './src/context/BusinessContext';
import { UserProvider } from './src/context/UserContext';
import { SocketProvider } from './src/context/socketContext';
import { registerBusinessGeofence, initGeofence, listenForGeofence, startGeofenceMonitoring } from './src/services/geofenceService';
import handleLogout from './src/navigations/custormDrawer';
import { ThemeProvider, useTheme } from './src/context/themeContext';

/* -------------------------------- */
/* Global Guards */
/* -------------------------------- */
let syncing = false;

/* -------------------------------- */
/* Sync Wrapper */
/* -------------------------------- */
const safeSync = async () => {
  const token = await AsyncStorage.getItem("accessToken");
  if (!token) {
    console.log(" No token → skipping sync");
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
/* Auth Flow Component */
/* -------------------------------- */
const AppWithAuth = () => {
  const { token, logout } = useAuthContext();
  const [syncDone, setSyncDone] = React.useState(false);
  const { business } = useBusiness();


  useTokenExpiryWatcher(token, logout);

  // Geofence setup
  useEffect(() => {
    if (!business?.latitude || !business?.longitude) {
      return;
    }

    const setup = async () => {
      await initGeofence();
      await registerBusinessGeofence(
        Number(business?.latitude),
        Number(business?.longitude)
      );
      listenForGeofence(() => logout());
      await startGeofenceMonitoring();
    };

    setup();
  }, [business]);

  // Sync setup
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
      }, 6000);
    };

    startSync();

    return () => {
      if (netUnsubscribe) netUnsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [token]);

  if (!token) return <AuthStack />;
  if (!syncDone) return <SyncLoader onDone={() => setSyncDone(true)} />;
  return <RootDrawer />;
};

/* -------------------------------- */
/* Component that uses Auth Context safely */
/* -------------------------------- */

const AppWithProviders = () => {
  const { token } = useAuthContext();
  const { business } = useBusiness();
  const [dbReady, setDbReady] = React.useState(false);
  const { user } = useSelector((state: any) => state.auth);
  // Parse working hours from business context, default to 8–17
  const [startHour, endHour] = (() => {
    if (business?.working_hrs) {
      const parts = business.working_hrs.split("-");
      if (parts.length === 2) {
        const start = parseInt(parts[0], 10);
        const end = parseInt(parts[1], 10);
        if (!isNaN(start) && !isNaN(end)) {
          return [start, end];
        }
      }
    }
    return [8, 17]; // default
  })();

  const currentHour = new Date().getHours();
  const isWithinHours = currentHour >= startHour && currentHour < endHour;

  // Database setup logic remains the same...
  useEffect(() => {
    const setupDB = async () => {
      if (!token) {
        setDbReady(false);
        return;
      }
      try {
        await getDBConnection();
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
        setDbReady(true);
      } catch (err) {
        console.error("CRITICAL DB INIT FAILURE:", err);
        setDbReady(false);
      }
    };
    setupDB();
  }, [token]);

  if (!token) return <AuthStack />;
  if (!dbReady) {
    return (
      <View style={styles.center}>

        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Initializing Database...</Text>
      </View>
    );
  }

  //Disabled screen when outside working hours
  if (!isWithinHours && user.role === "sales") {
    return (
      <View style={styles.center}>
        <Ionicons name="time-outline" size={48} color="#fff" />
        <Text style={styles.loadingText}>
          Access disabled. Working hours are {startHour}:00 – {endHour}:00
        </Text>
      </View>
    );
  }
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <StatusBar animated backgroundColor={colors.primary} />
      <AppWithAuth />
    </View>
  );
};


/* -------------------------------- */
/* Root App Component */
/* -------------------------------- */
function App(): React.JSX.Element {
  return (
    <View style={styles.container}>

      <SafeAreaProvider>
        <CartProvider>
          <ThemeProvider>

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
                        <AppWithProviders />
                      </PersistGate>
                    </SettingsProvider>
                  </UserProvider>
                </SocketProvider>
              </BusinessProvider>

            </Provider>
          </ThemeProvider>
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
