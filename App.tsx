import 'react-native-get-random-values';
import React, { useEffect } from 'react';
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
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';

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



export const requestNotificationPermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Notification permission granted');
      } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
        console.log('Notification permission denied');
      } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in system settings to receive sales alerts.',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      console.warn(err);
    }
  }
};




/* Root App */
/* -------------------------------- */
function App(): React.JSX.Element {
  useEffect(() => {
    const checkPermission = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );

        if (!hasPermission) {
          Alert.alert(
            "Stay Updated",
            "Would you like to receive notifications for new sales and stock alerts?",
            [
              { text: "No thanks", style: "cancel" },
              { text: "OK", onPress: () => requestNotificationPermission() }
            ]
          );
        }
      }
    };

    checkPermission();
  }, []);


  useEffect(() => {
    const checkPermission = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );

        if (!hasPermission) {
          Alert.alert(
            "Stay Updated",
            "Would you like to receive notifications for new sales and stock alerts?",
            [
              { text: "No thanks", style: "cancel" },
              { text: "OK", onPress: () => requestNotificationPermission() }
            ]
          );
        }
      }
    };

    checkPermission();
  }, []);


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