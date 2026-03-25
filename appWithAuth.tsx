import { View, Text } from 'react-native'
import React, { useEffect } from 'react'
import { useAuthContext } from './src/context/authContext';
import { useTokenExpiryWatcher } from './src/hooks/useTokenExpiryWatcher';
import NetInfo from "@react-native-community/netinfo";
import { globalSync } from './src/sync';
import { syncTables } from './src/sync/tables';
import { AuthStack } from './src/navigations/auth/stack';
import { SyncLoader } from './src/sync/SyncLoader';
import { RootDrawer } from './src/navigations/rootDrawer';
import "./global.css"
const AppWithAuth = () => {
    const { token, logout } = useAuthContext();
    const [syncDone, setSyncDone] = React.useState(false);

    useTokenExpiryWatcher(token, logout);
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

export default AppWithAuth