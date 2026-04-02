import { View, Text, ActivityIndicator, StatusBar, StyleSheet, Alert, NativeModules, NativeEventEmitter } from 'react-native';
import React, { useEffect } from 'react';
import { useAuthContext } from './src/context/authContext';
import { useBusiness } from './src/context/BusinessContext';
import { useSelector } from 'react-redux';
import { useTheme } from './src/context/themeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStack } from './src/navigations/auth/stack';
import AppWithAuth from './appWithAuth';
import "./global.css"
import { SafeAreaView } from 'react-native-safe-area-context';

// DB
import { getDBConnection } from './src/services/db-service';
import { createUserTable, createCLockTable } from './src/services/users.service';
import { createCashRegisterTable, createPaymentsTable } from './src/services/closeOpen.service';
import { createProductTable } from './src/services/product.service';
import { createCategoryTable } from './src/services/category.service';
import { createRefundItemsTable, createRefundsTable, createSalesItemTable, createSalesTable } from './src/services/sales.service';
import { createInventorylogTable } from './src/services/inventory.service';

import { useAppStatus } from './src/hooks/useAppStatus';
import DatabaseLoader from './dbeady';
import messaging from '@react-native-firebase/messaging';
import { createNotificationTable, saveNotification } from './src/services/Notification.service';
import { useSocket } from './src/context/socketContext';



const { RNCustomGeolocation } = NativeModules;
const geoEventEmitter = new NativeEventEmitter(RNCustomGeolocation);

const AppWithProviders = () => {
    const { token } = useAuthContext();
    const { user } = useSelector((state: any) => state.auth);
    const { Kiosk } = NativeModules;
    const [dbReady, setDbReady] = React.useState(false);
    const { colors, isDarkMode, applyThemeDirectly, refreshTheme } = useTheme();
    const { socket } = useSocket();
    const { business, updateBusiness } = useBusiness();
    // ✅ GLOBAL STATUS ENGINE
    const {
        isWithinZones,
        setIsWithinZones,
        shouldLock,
        evaluateStatus
    } = useAppStatus({ user, business });

    /* ---------------- GEO TRACKING ---------------- */
    const startProfessionalTracking = async () => {
        const settings = await RNCustomGeolocation.checkLocationSettings();
        if (!settings.isLocationReady) {
            RNCustomGeolocation.openLocationSettings();
            return;
        }
        RNCustomGeolocation.startBackgroundService();
    };

    useEffect(() => {
        if (user?.role === 'sales') {
            startProfessionalTracking();
            console.log("tracking")
        }

        return () => RNCustomGeolocation.stopBackgroundService();
    }, [user]);

    /* ---------------- GEOFENCE ---------------- */
    useEffect(() => {
        const handleTransition = async (data: any) => {
            const inside = data.isInside;
            setIsWithinZones(inside);
            await AsyncStorage.setItem("lastZoneState", inside ? "true" : "false");
            if (user.company_gadget === false && !inside) {
                Kiosk.lock();
            } else {
                Kiosk.unlock();
            }

            await evaluateStatus(inside); // 🔥 REQUIRED
        };

        const subscription = geoEventEmitter.addListener(
            'onGeofenceTransition',
            handleTransition
        );

        if (business?.latitude && business?.longitude) {
            RNCustomGeolocation.addGeofence(
                `${business.business_name}`,
                parseFloat(business.latitude),
                parseFloat(business.longitude),
                15
            );
        }

        return () => subscription.remove();
    }, [business]);

    useEffect(() => {
        const restore = async () => {
            const savedZone = await AsyncStorage.getItem("lastZoneState");
            const zoneState = savedZone === "true";

            setIsWithinZones(zoneState);
            evaluateStatus(zoneState);
        };

        restore();
    }, []);
    /* ---------------- INITIAL CHECK (LOGIN FIX) ---------------- */
    useEffect(() => {
        const init = async () => {
            if (user && business) {
                const savedZone = await AsyncStorage.getItem("lastZoneState");
                const zoneState = savedZone === "true";

                setIsWithinZones(zoneState);
                await evaluateStatus(zoneState); // 🔥 RUN IMMEDIATELY
            }
        };

        init();
    }, [user, business]);

    /* ---------------- TIMER ---------------- */
    useEffect(() => {
        const timer = setInterval(() => {
            evaluateStatus();
        }, 15000);

        return () => clearInterval(timer);
    }, [isWithinZones, user, business]);

    /* ---------------- KIOSK LOCK ---------------- */
    // useEffect(() => {
    //     const timeout = setTimeout(() => {
    //         try {
    //             if (shouldLock) {
    //                 Kiosk.lock();
    //             } else {
    //                 Kiosk.unlock();
    //             }
    //         } catch (e) {
    //             console.error("Kiosk error:", e);
    //         }
    //     }, 300);

    //     return () => clearTimeout(timeout);
    // }, [shouldLock]);


    useEffect(() => {
        if (!dbReady) return; // don't subscribe until DB is ready

        const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
            try {
                const t = await saveNotification({
                    title: remoteMessage.notification?.title || "New Notification",
                    description: remoteMessage.notification?.body || "",
                    business_id: remoteMessage.data?.businessId || "",
                    type: remoteMessage.data?.type || "general",
                    unread: true,
                    user_id: remoteMessage.data?.userId || "",
                });

                return unsubscribe;
            } catch (error) {
                console.log(error)
            }
        });


    }, [dbReady, business, user]);


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
                await createCLockTable();
                await createNotificationTable()
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
        { <DatabaseLoader /> }
    }


    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar animated backgroundColor={colors.primary} />
            <SafeAreaView style={styles.container}>
                <AppWithAuth />
            </SafeAreaView>
        </View>
    );
};

export default AppWithProviders;

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