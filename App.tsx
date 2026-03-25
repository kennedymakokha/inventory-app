import 'react-native-get-random-values';
import React, {  } from 'react';
import {
  View,
  StyleSheet
} from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css"
import { NativeModules, NativeEventEmitter } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { MenuProvider } from 'react-native-popup-menu';
import { SearchProvider } from './src/context/searchContext';
import AppWithProviders from './appWithProviders';

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


/* -------------------------------- */
/* Root App */
/* -------------------------------- */
function App(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <SafeAreaProvider>
        <MenuProvider>
          <NavigationContainer>
            <SearchProvider>
              <AppWithProviders />
            </SearchProvider>
          </NavigationContainer>
        </MenuProvider>
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