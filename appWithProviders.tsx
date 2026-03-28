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

// ✅ NEW
import { useAppStatus } from './src/hooks/useAppStatus';

const { RNCustomGeolocation } = NativeModules;
const geoEventEmitter = new NativeEventEmitter(RNCustomGeolocation);

const AppWithProviders = () => {
    const { token } = useAuthContext();
    const { business } = useBusiness();
    const { user } = useSelector((state: any) => state.auth);
    const { colors, refreshTheme } = useTheme();

    const { Kiosk } = NativeModules;

    const [dbReady, setDbReady] = React.useState(false);

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
        }

        return () => RNCustomGeolocation.stopBackgroundService();
    }, [user]);

    /* ---------------- GEOFENCE ---------------- */
    useEffect(() => {
        const handleTransition = async (data: any) => {
            const inside = data.isInside;

            setIsWithinZones(inside);

            await AsyncStorage.setItem("lastZoneState", inside ? "true" : "false");

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
                150
            );
        }

        return () => subscription.remove();
    }, [business]);

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
    useEffect(() => {
        const timeout = setTimeout(() => {
            try {
                if (shouldLock) {
                    Kiosk.lock();
                } else {
                    Kiosk.unlock();
                }
            } catch (e) {
                console.error("Kiosk error:", e);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [shouldLock]);

    /* ---------------- DB ---------------- */
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