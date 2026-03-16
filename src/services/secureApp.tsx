// SecureApp.tsx
import React, { useEffect, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

import * as RNScreenshotPrevent from 'react-native-screenshot-prevent';
interface SecureAppProps {
  children: ReactNode;
}

const SecureApp: React.FC<SecureAppProps> = ({ children }) => {
useEffect(() => {
  RNScreenshotPrevent.enableSecureView();

  return () => {
    RNScreenshotPrevent.disableSecureView();
  };
}, []);

  return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SecureApp;