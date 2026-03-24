import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import {
  StatusBar,
  View,
  Text,
  ActivityIndicator,
  StyleSheet
} from 'react-native';

import { SafeAreaProvider } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
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
import {
  createRefundItemsTable,
  createRefundsTable,
  createSalesItemTable,
  createSalesTable
} from './src/services/sales.service';

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

import { ThemeProvider, useTheme } from './src/context/themeContext';
import { NativeModules, NativeEventEmitter } from 'react-native';

// "RNCustomGeolocation" matches getName() in your Java file
const { RNCustomGeolocation } = NativeModules;
const geoEventEmitter = new NativeEventEmitter(RNCustomGeolocation);
/* -------------------------------- */
/* Global Sync Guard */
/* -------------------------------- */

const getCurrentPosition = () => {
  return RNCustomGeolocation.getCurrentPosition();
};

const watchPosition = (callback: any) => {
  RNCustomGeolocation.startWatching();

  // This listens to the "onLocationUpdate" event sent from your Java code
  const subscription = geoEventEmitter.addListener('onLocationUpdate', (location) => {
    callback(location);
  });

  // Return a function to stop watching (clean up)
  return () => {
    subscription.remove();
    RNCustomGeolocation.stopWatching();
  };
};
let syncing = false;

const safeSync = async (token: any) => {
  if (!token || syncing) return;

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
/* Auth Flow */
/* -------------------------------- */
const AppWithAuth = () => {
  const { token, logout } = useAuthContext();
  const [syncDone, setSyncDone] = React.useState(false);

  useTokenExpiryWatcher(token, logout);

  // Sync setup
  useEffect(() => {
    if (!token) return;

    let unsubscribe;
    let interval;

    unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        console.log("🌐 Internet detected → syncing");
        safeSync(token);
      }
    });

    // ✅ Sync every 30 seconds
    interval = setInterval(() => {
      safeSync(token);
    }, 30000);

    return () => {
      unsubscribe?.();
      if (interval) clearInterval(interval);
    };
  }, [token]);

  if (!token) return <AuthStack />;
  if (!syncDone) return <SyncLoader onDone={() => setSyncDone(true)} />;
  return <RootDrawer />;
};

/* -------------------------------- */
/* Providers Wrapper */
/* -------------------------------- */
const AppWithProviders = () => {
  const { token } = useAuthContext();
  const { business } = useBusiness();
  const { user } = useSelector((state: any) => state.auth);

  const [dbReady, setDbReady] = React.useState(false);
  const [isWithinZones, setisWithinZones] = React.useState(true);

  const { colors } = useTheme();
  // Get once
  useEffect(() => {
    let stopWatcher: () => void;

    const run = async () => {
      try {
        console.log("Checking Location...");
        const loc = await getCurrentPosition().catch((e: any) => {
          console.log("Native Geo Error:", e);
          return null;
        });

        if (loc) {
          console.log("Initial Position:", loc);
          stopWatcher = watchPosition((location: any) => {
            console.log("Live Update:", location);
          });
        }
      } catch (err) {
        console.error("Non-blocking Geo error:", err);
      }
    };

    run();

    return () => {
      if (stopWatcher) stopWatcher();
    };
  }, []);
  // Working hours
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
    return [8, 17];
  })();

  const currentHour = new Date().getHours();
  const isWithinHours = currentHour >= startHour && currentHour < endHour;

  /* ---------- Geofence Setup ---------- */
  // useEffect(() => {
  //   if (!business?.latitude || !business?.longitude) return;

  //   const setup = async () => {
  //     await initGeofence();

  //     await registerBusinessGeofence(
  //       Number(business.latitude),
  //       Number(business.longitude)
  //     );

  //     listenForGeofence((isInside) => {
  //       setisWithinZones(isInside);
  //     });

  //     await startGeofenceMonitoring();
  //   };

  //   setup();
  // }, [business]);

  /* ---------- DB Setup ---------- */
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

  // Working hours restriction
  if (!isWithinHours && user?.role === "sales") {
    return (
      <View style={styles.center}>
        <Ionicons name="time-outline" size={48} color="#fff" />
        <Text style={styles.loadingText}>
          Access disabled. Working hours are {startHour}:00 – {endHour}:00
        </Text>
      </View>
    );
  }

  // Geofence restriction
  if (!isWithinZones && user?.role === "sales") {
    return (
      <View style={styles.center}>
        <Ionicons name="location-outline" size={48} color="#fff" />
        <Text style={styles.loadingText}>
          Access disabled. You are outside the allowed zone
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar animated backgroundColor={colors.primary} />
      <AppWithAuth />
    </View>
  );
};

/* -------------------------------- */
/* Root App */
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