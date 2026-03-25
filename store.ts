// store.ts
import { configureStore } from "@reduxjs/toolkit";
import { api } from "./src/services/index";
import authReducer from "./src/features/auth/authSlice";
import cartReducer from "./src/features/cartSlice";
import { persistReducer, persistStore } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";

const authPersistConfig = {
  key: "auth",
  storage: AsyncStorage,
  whitelist: ["token", "user"],
};

const cartPersistConfig = {
  key: "cart",
  storage: AsyncStorage,
  whitelist: ["items"], // only persist cart items
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedCartReducer = persistReducer(cartPersistConfig, cartReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    cart: persistedCartReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(api.middleware),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
