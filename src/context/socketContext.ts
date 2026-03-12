// SocketContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { AppState } from 'react-native';

const SOCKET_URL = `${process.env.SOCKET_SERVER_URL}`; // your backend URL

type SocketContextType = {
  socket: Socket | null;
};

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      path: '/my-custom-socket', // <-- your custom path
      transports: ['websocket'],
      reconnection: true,
    });
    console.log(newSocket)
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected', newSocket.id);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected', reason);
    });

    // Handle app coming back from background
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && !newSocket.connected) {
        newSocket.connect();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      newSocket.disconnect();
      subscription.remove();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};