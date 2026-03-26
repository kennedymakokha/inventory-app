import { View, Text, ActivityIndicator, StatusBar, StyleSheet } from 'react-native'
import React, { useEffect } from 'react'
import { useAuthContext } from './src/context/authContext';
import { useBusiness } from './src/context/BusinessContext';
import { useSelector } from 'react-redux';
import { useTheme } from './src/context/themeContext';
import { NativeModules, NativeEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clockIn, clockOut, createCLockTable, createUserTable } from './src/services/users.service';
import { Alert } from 'react-native';
import { getDBConnection } from './src/services/db-service';
import { createCashRegisterTable, createPaymentsTable } from './src/services/closeOpen.service';
import { createProductTable } from './src/services/product.service';
import { createCategoryTable } from './src/services/category.service';
import { createRefundItemsTable, createRefundsTable, createSalesItemTable, createSalesTable } from './src/services/sales.service';
import { createInventorylogTable } from './src/services/inventory.service';
import { AuthStack } from './src/navigations/auth/stack';
import AppWithAuth from './appWithAuth';
import "./global.css"
import LockScreen from './src/screens/LockScreen';
import { SafeAreaView } from 'react-native-safe-area-context';
// "RNCustomGeolocation" matches getName() in your Java file
const { RNCustomGeolocation } = NativeModules;
const geoEventEmitter = new NativeEventEmitter(RNCustomGeolocation);
/* -------------------------------- */
const AppWithProviders = () => {
    const { token } = useAuthContext();
    const { business } = useBusiness();
    const { user } = useSelector((state: any) => state.auth);
    const [shouldLock, setShouldLock] = React.useState(false);

    const { Kiosk } = NativeModules;
    const [dbReady, setDbReady] = React.useState(false);
    const [isWithinZones, setisWithinZones] = React.useState(true);

    const { colors } = useTheme();

    const { refreshTheme } = useTheme();
    const startProfessionalTracking = async () => {
        // 1. First, check if GPS is even on
        const settings = await RNCustomGeolocation.checkLocationSettings();
        if (!settings.isLocationReady) {
            RNCustomGeolocation.openLocationSettings();
            return;
        }

        // 2. Start the Foreground Service (This is your "Legal" shield)
        // This tells Android: "I am actively working, show the user a notification."
        RNCustomGeolocation.startBackgroundService();

        // 3. OPTIONAL: Instead of a popup, show a small UI hint to the user
        // "For better accuracy, please disable battery optimization for this app in settings."
        // Only trigger the system intent if the user explicitly clicks "Fix Accuracy"
    };
    useEffect(() => {

        if (user?.role === 'sales') {
            startProfessionalTracking();
        }

        return () => RNCustomGeolocation.stopBackgroundService();
    }, [user]);




    useEffect(() => {
        const handleTransition = async (data: any) => {
            console.log("Geofence Transition Received. isInside:", data.isInside);

            try {
                if (data.isInside) {
                    // --- ENTERING ZONE ---
                    setisWithinZones(true);

                    // Use business colors from the latest business object
                    const pColor = business?.primary_color || "#3c58a8";
                    const sColor = business?.secondary_color || "#fff";

                    await AsyncStorage.multiSet([
                        ["primary_color", pColor],
                        ["secondary_color", sColor]
                    ]);

                    await clockIn({ user_id: `${user?._id}`, business_id: `${user.business._id}` })
                    setShouldLock(false);
                    Alert.alert("Zone Check", "Welcome to the business zone!");
                } else {
                    // --- EXITING ZONE ---
                    setisWithinZones(false);
                    await clockOut(user?._id)
                    await AsyncStorage.multiSet([
                        ["primary_color", "#868688"],
                        ["secondary_color", "#fff"]
                    ]);
                    setShouldLock(true);
                    Alert.alert("Zone Check", "You have left the authorized zone!");
                }


                // 3. Trigger the theme refresh AFTER storage is set
                await refreshTheme();

            } catch (error) {
                console.error("Theme/State update failed:", error);
            }
        };

        // 1. Subscribe to events
        const subscription = geoEventEmitter.addListener('onGeofenceTransition', handleTransition);

        // 2. Register Geofence (Ensure radius is sufficient)
        if (business?.latitude && business?.longitude) {
            RNCustomGeolocation.addGeofence(
                `${business.business_name}`,
                parseFloat(business.latitude),
                parseFloat(business.longitude),
                1 // 20m is too small; 150m is safer for GPS drift
            );
        }

        return () => {
            subscription.remove();
        };
    }, [business?.latitude, business?.longitude, refreshTheme]); // Dependencies are vital here
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



    // Inside AppWithProviders in App.tsx
    useEffect(() => {
        const checkStatus = async () => {
            // 1. Get current time & parse business hours
            const currentHour = new Date().getHours();
            const workingHrs = business?.working_hrs || "0-0"; // Default to 24h if missing
            const [start, end] = workingHrs.split("-").map(Number);

            let isOutOfHours = false;
            if (start === end) {
                isOutOfHours = false;
            } else {
                if (start < end) {
                    isOutOfHours = currentHour < start || currentHour >= end;
                } else {
                    isOutOfHours = currentHour >= end && currentHour < start;
                }
            }

            // 3. Combine with Zone logic
            const isOutOfZone = !isWithinZones;
            const shouldBeInactive = user?.role?.toLowerCase() === "sales" && (isOutOfHours || isOutOfZone);

            // 4. Sync with Storage and Theme
            const currentState = await AsyncStorage.getItem('inactive');
            const newState = shouldBeInactive ? "true" : "false";

            if (currentState !== newState) {
                console.log(`Transitioning status to: ${newState} (Hours: ${isOutOfHours}, Zone: ${isOutOfZone})`);

                const pColor = shouldBeInactive ? "#868688" : (business?.primary_color || "#3c58a8");
                const sColor = shouldBeInactive ? "#f3f4f6" : (business?.secondary_color || "#ffffff");

                await AsyncStorage.multiSet([
                    ["inactive", newState],
                    ["primary_color", pColor],
                    ["secondary_color", sColor]
                ]);
                setShouldLock(shouldBeInactive);

                if (shouldBeInactive) {
                    await clockOut(user?._id);
                }

                // Force context update
                setTimeout(() => refreshTheme(), 200);
            }
        };

        checkStatus();
        const timer = setInterval(checkStatus, 15000); // 15s check is enough
        return () => clearInterval(timer);
    }, [isWithinZones, business, user, refreshTheme]);

    useEffect(() => {
        const applyLock = async () => {
            try {
                if (shouldLock) {
                    console.log("🔒 Locking device...");
                    Kiosk.lock();
                } else {
                    console.log("🔓 Unlocking device...");
                    Kiosk.unlock();
                }
            } catch (e) {
                console.error("Kiosk error:", e);
            }
        };

        // Small delay ensures UI is active
        const timeout = setTimeout(applyLock, 300);

        return () => clearTimeout(timeout);
    }, [shouldLock]);
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
                await createCLockTable()

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


    return (
        <View style={{ flex: 1 }}>
            <StatusBar animated backgroundColor={colors.primary}  />
            <SafeAreaView style={styles.container}>
                  <AppWithAuth />
                  {/* {shouldLock ? <LockScreen adminPin="2468" /> : <AppWithAuth />}  */}
            </SafeAreaView>
          
          
        </View>
    );
};


export default AppWithProviders

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