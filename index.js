/** @format */
import './gesture-handler';
import 'react-native-get-random-values';
import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import { Provider } from 'react-redux';
import { persistor, store, } from './store';
import { AuthProvider } from './src/context/authContext';
import { CartProvider } from './src/context/CartContext';
import { ThemeProvider } from './src/context/themeContext';
import { UserProvider } from './src/context/UserContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BusinessProvider } from './src/context/BusinessContext';
import { MenuProvider } from 'react-native-popup-menu';
import { SettingsProvider } from './src/context/SettingsContext';
import { SearchProvider } from './src/context/searchContext';
import { PersistGate } from 'redux-persist/integration/react';
import { SocketProvider } from './src/context/socketContext';
import AppWithProviders from './appWithProviders';
import { NavigationContainer } from '@react-navigation/native';
import './geofenceTask';
const Root = () => (
    <Provider store={store}>
        <PersistGate
            persistor={persistor}
            loading={null} // or your loading spinner
        >
            <SafeAreaProvider>
                <AuthProvider>
                    <ThemeProvider>
                            <BusinessProvider>
                                <SocketProvider>
                                    <UserProvider>
                                        <SettingsProvider>
                                            <MenuProvider>
                                                <NavigationContainer>
                                                    <SearchProvider>
                                                        <AppWithProviders />
                                                    </SearchProvider>
                                                </NavigationContainer>
                                            </MenuProvider>
                                        </SettingsProvider>
                                    </UserProvider>
                                </SocketProvider>
                            </BusinessProvider>
                    </ThemeProvider>
                </AuthProvider>
            </SafeAreaProvider>
        </PersistGate>
    </Provider>
);

AppRegistry.registerComponent(appName, () => Root);