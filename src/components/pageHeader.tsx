import { View, Text } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import SearchBar from './searchBar';

const POSHeader = ({ component }: { component?: () => React.ReactNode }) => {
  const { user } = useSelector((state: any) => state.auth);
  const [dateTime, setDateTime] = useState('');
  const { business } = user
  useEffect(() => {
    const updateTime = () => setDateTime(new Date().toLocaleString());
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View className="bg-slate-900 px-5 pt-6 pb-4 shadow-lg">
      {/* Business Name */}
      <Text className="text-white text-2xl text-center font-extrabold tracking-wide">
       {business.business_name}
      </Text>

      {/* User + Terminal Info */}
      <View className="flex-row justify-between items-center mt-3">
        {/* Cashier Info */}
        <View>
          <Text className="text-white text-lg font-semibold">{user?.username}</Text>
          <View className="bg-white/20 px-3 py-1 rounded-full mt-1 self-start">
            <Text className="text-xs font-bold text-white uppercase tracking-wide">
              {user?.role}
            </Text>
          </View>
        </View>

        {/* Terminal & Online Status */}
        <View className="items-end">
          <Text className="text-white text-sm font-medium">{dateTime}</Text>
          <Text className="text-[#22C55E] text-xs font-semibold mt-1">
            ● Online | Terminal: POS-01
          </Text>
        </View>
      </View>

      {/* Search / Custom Component */}
      <View className="mt-4">
        {component ? component() : <SearchBar white placeholder="Search products..." />}
      </View>
    </View>
  );
};

export default POSHeader;