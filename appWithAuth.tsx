import { View, Text, NativeModules } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useAuthContext } from './src/context/authContext';
import { useTokenExpiryWatcher } from './src/hooks/useTokenExpiryWatcher';
import NetInfo from "@react-native-community/netinfo";
import { globalSync } from './src/sync';
import { syncTables } from './src/sync/tables';
import { AuthStack } from './src/navigations/auth/stack';
import { SyncLoader } from './src/sync/SyncLoader';
import { RootDrawer } from './src/navigations/rootDrawer';
import "./global.css"
import { useTheme } from './src/context/themeContext';
import { useAppStatus } from './src/hooks/useAppStatus';
import { useSelector } from 'react-redux';
import { useSocket } from './src/context/socketContext';
import { useBusiness } from './src/context/BusinessContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
const AppWithAuth = () => {
    const { token, logout } = useAuthContext();
    const [syncDone, setSyncDone] = React.useState(false);
    const { user } = useSelector((state: any) => state.auth);
    const { socket } = useSocket();
    const { business, updateBusiness } = useBusiness();
    const [isForceLocked, setIsForceLocked] = useState(false);
    useTokenExpiryWatcher(token, logout);
    const { colors, isDarkMode, applyThemeDirectly, refreshTheme } = useTheme();
    const applyThemeRef = useRef(applyThemeDirectly);
    const { evaluateStatus } = useAppStatus({ user, business, refreshTheme });
    const evaluateStatusRef = useRef(evaluateStatus);
    let syncing = false;
    const { Kiosk } = NativeModules;
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
    useEffect(() => {

        evaluateStatusRef.current = evaluateStatus;
        applyThemeRef.current = applyThemeDirectly;
    });
    useEffect(() => {
        if (!socket) return;

        const onConnect = () => {
            console.log("✅ Socket connected:", socket.id);
            socket.emit("registerDevice", user._id);
        };

        const onBusinessUpdate = async (data: any) => {
            updateBusiness(data);

            if (data.primary_color || data.secondary_color) {
                applyThemeRef.current(
                    data.primary_color || "#3c58a8",
                    data.secondary_color || "#ffffff"
                );
            }

            await evaluateStatusRef.current();
        };

        const onForceLock = async (data: any) => {
            console.log("🔒 Force lock received:", data.user.company_gadget);
            if (data.user.company_gadget === true) {
                Kiosk.lock();
            }


            await AsyncStorage.setItem("inactive", "true");
            await AsyncStorage.setItem("forceLocked", "true");
            await evaluateStatusRef.current(undefined, true); // <-- pass override

        };

        const onForceUnLock = async (data: any) => {
            console.log("🔓 Force unlock received:", data);
            if (data.user.company_gadget === true) {
                Kiosk.unlock();
            }

            await AsyncStorage.setItem("inactive", "false");
            await AsyncStorage.setItem("forceLocked", "false");

            await evaluateStatusRef.current(undefined, true);

        };


        socket.on("connect", onConnect);
        socket.on("business:update", onBusinessUpdate);
        socket.on("force:lock", onForceLock);
        socket.on("force:unlock", onForceUnLock);


        return () => {
            socket.off("connect", onConnect);
            socket.off("business:update", onBusinessUpdate);
            socket.off("force:lock", onForceLock);

        };
    }, [socket, user._id, updateBusiness]);
    if (!token) return <AuthStack />;
    if (!syncDone) return <SyncLoader onDone={() => setSyncDone(true)} />;
    return <RootDrawer />;
};

export default AppWithAuth