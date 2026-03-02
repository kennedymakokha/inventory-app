import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import Icon from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";

import { useAuthContext } from "../context/authContext";


import { getDBConnection } from "../services/db-service";

import { getUnsyncedInventory } from "../services/inventory.service";
import { getNow } from "../../utils";

import {
  useBulksyncMutation,
  usePullupdatedsinceQuery,
} from "../services/productApi";

import {
  usePullinventoryQuery,
  useSyncInventoryMutation,
} from "../services/inventoryApi";

import {
  usePullSalesQuery,
  useSyncSalesMutation,
} from "../services/salesApi";
import { useSettings } from "../context/SettingsContext";
import { Theme } from "../utils/theme";

const CustomDrawer: React.FC<DrawerContentComponentProps> = ({
  navigation,
}) => {
  const { logout } = useAuthContext();
  const { user } = useSelector((state: any) => state.auth);

  const { isDarkMode } = useSettings();
  const theme = isDarkMode ? Theme.dark : Theme.light;

  const [lastSync, setLastSync] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [syncProduct] = useBulksyncMutation();
  const [syncInventory] = useSyncInventoryMutation();
  const [syncSales] = useSyncSalesMutation();

  const { refetch: refetchProducts } = usePullupdatedsinceQuery(lastSync, {
    skip: !lastSync,
  });

  const { refetch: refetchInventory } = usePullinventoryQuery(lastSync, {
    skip: !lastSync,
  });

  const { refetch: refetchSales } = usePullSalesQuery(lastSync, {
    skip: !lastSync,
  });

  useEffect(() => {
    const loadLastSync = async () => {
      const stored = await AsyncStorage.getItem("lastSync");
      if (stored) {
        setLastSync(stored);
      } else {
        const initial = new Date(0).toISOString();
        setLastSync(initial);
      }
    };
    loadLastSync();
  }, []);

  const logoutUser = async () => {
    await logout();
    await AsyncStorage.clear();
  };

  const handleFullSync = async () => {
    try {
      setLoading(true);
      setMessage("Starting sync...");

      const db = await getDBConnection();

      const productRes = await refetchProducts();
      const inventoryRes = await refetchInventory();
      const salesRes = await refetchSales();

      const productsFromServer = productRes?.data || [];
      const inventoryFromServer = inventoryRes?.data || [];
      const salesFromServer = salesRes?.data || [];

    //   await syncAllProducts(db, productsFromServer, syncProduct);

      const unsyncedInventory = await getUnsyncedInventory(db,0);
      if (unsyncedInventory?.length) {
        await syncInventory(unsyncedInventory).unwrap();
      }

      if (salesFromServer?.length) {
        await syncSales(salesFromServer).unwrap();
      }

      const now = getNow();
      await AsyncStorage.setItem("lastSync", now);
      setLastSync(now);

      setMessage("Sync completed successfully ✅");
    } catch (error) {
      console.log("SYNC ERROR:", error);
      setMessage("Sync failed ❌");
    } finally {
      setLoading(false);
    }
  };

  const menuItem = (
    label: string,
    icon: string,
    screen: string
  ) => (
    <TouchableOpacity
      className="flex-row items-center my-4"
      onPress={() => navigation.navigate("Home", { screen })}
    >
      <Icon name={icon} size={20} color={theme.text} />
      <Text
        style={{ color: theme.text }}
        className="tracking-widest uppercase text-base ml-3"
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View
      style={{ backgroundColor: theme.background }}
      className="flex-1 pt-16 px-5"
    >
      {/* Header */}
      <View
        style={{ borderBottomColor: theme.border }}
        className="items-center mb-10 border-b"
      >
        <Image
          source={require("../assets/logo.png")}
          className="size-40 rounded-full mb-2"
        />
        <Text style={{ color: theme.text }} className="text-lg">
          Welcome! {user?.name}
        </Text>
      </View>

      {!!message && (
        <Text
          style={{ color: theme.text }}
          className="text-center mt-2"
        >
          {message}
        </Text>
      )}

      {/* Navigation */}
      {menuItem("Home", "home-outline", "dashboard")}
      {menuItem("Products", "swap-horizontal-outline", "products")}
      {menuItem("Categories", "grid-outline", "categories")}
      {menuItem("Inventory", "cube-outline", "inventory")}
      {menuItem("Sales", "cart-outline", "sales")}
      {menuItem("Sales Report", "book-outline", "salesreport")}
      {menuItem("Settings", "settings-outline", "settings")}

      {/* Sync Button */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.subText} />
      ) : (
        <TouchableOpacity
          disabled={loading}
          style={{ backgroundColor: theme.background }}
          className="flex-row py-4 rounded-md justify-center items-center my-4"
          onPress={handleFullSync}
        >
          <MaterialCommunityIcons
            name="cloud-sync"
            size={26}
            color="#fff"
          />
          <Text className="text-white text-lg ml-3 font-bold">
            Sync
          </Text>
        </TouchableOpacity>
      )}

      {/* Footer */}
      <View
        style={{ borderTopColor: theme.border }}
        className="mt-auto mb-20 border-t pt-5"
      >
        <TouchableOpacity onPress={logoutUser}>
          <Text
            style={{ color: theme.text }}
            className="text-center text-2xl font-bold"
          >
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CustomDrawer;