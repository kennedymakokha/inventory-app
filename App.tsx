import React, { useEffect, useState } from 'react';
import { StatusBar, View } from 'react-native';
import "./global.css"
// import './gesture-handler';
import { Provider } from 'react-redux';
import { persistor, store } from './store';
import { useTokenExpiryWatcher } from './src/hooks/useTokenExpiryWatcher';
import { AuthStack, RootStack } from './src/navigations/rootStack';
import { RootDrawer } from './src/navigations/rootDrawer';
import { PersistGate } from 'redux-persist/integration/react';
import { useAuthContext } from './src/context/authContext';
function App(): React.JSX.Element {
  const [loading, setLoading] = useState(true)
  // const AppWithAuth = () => {
  //   const { token, logout } = useAuthContext();
  //   useTokenExpiryWatcher(token, logout);
  //   useTokenExpiryWatcher(token, logout); // 👈 auto-logout watcher
  //   return token ? <RootDrawer /> : <AuthStack />;
  // };
  const AppWithAuth = () => {
    const { token, logout } = useAuthContext();
    console.log(token)
    useTokenExpiryWatcher(token, logout);
    useTokenExpiryWatcher(token, logout); // 👈 auto-logout watcher
    return token ? <RootDrawer /> : <AuthStack />;

  };

  return (
    <View className="flex-1 dark bg-black-50">
      <StatusBar animated={true} backgroundColor="#000000" />
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <AppWithAuth />
        </PersistGate>
      </Provider>
    </View>
  );
}
export default App;
