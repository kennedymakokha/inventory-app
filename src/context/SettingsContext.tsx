import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsContextType {
    isScanToCartEnabled: boolean;
    setScanToCart: (value: boolean) => void;
    isDarkMode: boolean;
    setDarkMode: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isScanToCartEnabled, setIsScanToCartEnabled] = useState(false);
    const [isDarkMode, setDarkMode] = useState(true);

    useEffect(() => {
        const loadSettings = async () => {
            const scanMode = await AsyncStorage.getItem('scanToCart');
            const themeMode = await AsyncStorage.getItem('darkMode');
            if (scanMode !== null) setIsScanToCartEnabled(JSON.parse(scanMode));
            if (themeMode !== null) setDarkMode(JSON.parse(themeMode));
        };
        loadSettings();
    }, []);

    const setScanToCart = async (value: boolean) => {
        setIsScanToCartEnabled(value);
        await AsyncStorage.setItem('scanToCart', JSON.stringify(value));
    };

    const setDarkModeToggle = async (value: boolean) => {
        setDarkMode(value);
        await AsyncStorage.setItem('darkMode', JSON.stringify(value));
    };

    return (
        <SettingsContext.Provider value={{ 
            isScanToCartEnabled, 
            setScanToCart, 
            isDarkMode, 
            setDarkMode: setDarkModeToggle 
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error('useSettings must be used within SettingsProvider');
    return context;
};