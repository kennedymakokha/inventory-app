import React, { useEffect, useState } from 'react';
import { StatusBar, View } from 'react-native';
import "./global.css"
// import './gesture-handler';

import { useAuthContext } from './src/context/authContext';
import { useTokenExpiryWatcher } from './src/hooks/useTokenExpiryWatcher';
import { AuthStack, RootStack } from './src/navigations/rootStack';

function App(): React.JSX.Element {
  const [loading, setLoading] = useState(true)
  const AppWithAuth = () => {
    const { token, logout } = useAuthContext();
    useTokenExpiryWatcher(token, logout);
    useTokenExpiryWatcher(token, logout); // 👈 auto-logout watcher
    return token ? <RootStack /> : <AuthStack />;

  };

  return (
    <View className="flex-1 dark bg-black-50">
      <StatusBar animated={true} backgroundColor="#000000" />
      <AppWithAuth />
    </View>
  );
}
export default App;
