import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface ConnectivityContextType {
  isOnline: boolean;
  connectionType: string | null;
  isExpensive: boolean; // Tells you if they are on cellular/metered data
}

const ConnectivityContext = createContext<ConnectivityContextType>({
  isOnline: true,
  connectionType: null,
  isExpensive: false,
});

export const ConnectivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<ConnectivityContextType>({
    isOnline: true,
    connectionType: null,
    isExpensive: false,
  });

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isOnline: !!state.isConnected && !!state.isInternetReachable,
        connectionType: state.type,
        isExpensive: state.details && 'isConnectionExpensive' in state.details 
                      ? (state.details as any).isConnectionExpensive 
                      : false,
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <ConnectivityContext.Provider value={status}>
      {children}
    </ConnectivityContext.Provider>
  );
};

// Custom Hook for easy access
export const useConnectivity = () => useContext(ConnectivityContext);