import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { jwtDecode } from 'jwt-decode';
import { useNavigation } from '@react-navigation/native';
import LoginScreen from '../screens/Logincreen';

interface JWTPayload {
    exp: number;
}

const getTokenExpiry = (token: string): number => {
    const decoded = jwtDecode<JWTPayload>(token);
    return decoded.exp * 1000; // Convert to ms
};

export const useTokenExpiryWatcher = (
    token: string | null,
    logout: () => void,
    loginScreen: string = 'Login' // customizable route name
) => {
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const navigation = useNavigation();

    // Clear timer on unmount
    const clearTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    const handleLogout = () => {
        logout();
        navigation.reset({
            index: 0,
            routes: [{ name: loginScreen }],
        });
    };

    const setupTokenWatcher = () => {
        if (!token) return;

        const expiryTime = getTokenExpiry(token);
        const now = Date.now();
        const timeLeft = expiryTime - now;

        if (timeLeft <= 0) {
            handleLogout();
        } else {
            clearTimer();
            timerRef.current = setTimeout(handleLogout, timeLeft);
        }
    };

    useEffect(() => {
        setupTokenWatcher();

        return () => {
            clearTimer();
        };
    }, [token]);

    // Re-check on app resume
    useEffect(() => {
        const checkOnForeground = (state: AppStateStatus) => {
            if (state === 'active' && token) {
                const now = Date.now();
                const expiry = getTokenExpiry(token);
                if (now >= expiry) handleLogout();
            }
        };

        const sub = AppState.addEventListener('change', checkOnForeground);
        return () => sub.remove();
    }, [token]);
};
