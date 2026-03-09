import { View, Text, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import SalesReportTable from '../components/salesTable';
import PageHeader from '../../../components/pageHeader';
import { getDBConnection } from '../../../services/db-service';

import {
  adminFilter,
  Adminheaders,
  getadminSalesReportData,
  getSalesReportData,
  salesFilter,
  salesheaders
} from '../../../../utils/getsalesdata';

import { DataSales } from '../../../../models';
import { useSettings } from '../../../context/SettingsContext';
import { Theme } from '../../../utils/theme';

const SalesReport = () => {
  const { user, themeMode } = useSelector((state: any) => state.auth); // themeMode: "light" | "dark"
    const { isDarkMode } = useSettings();
    const theme = isDarkMode ? Theme.dark : Theme.light;

  const [datasales, setdataSales] = useState<DataSales | null>(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchProfits = async () => {
      setLoading(true);
      const db = await getDBConnection();
      // fetchCumulativeProfit(db, filter.toLowerCase(), (data: any) => {
      //   setdataSales(data);
      //   setLoading(false);
      // });
      // fetchGroupedProfit(db, filter.toLowerCase(), (data: any) => {
      //   setSales(data);
      //   setLoading(false);
      // });
    };
    fetchProfits();
  }, [filter]);

  const filterData: any = user?.role === 'superAdmin' ? adminFilter : salesFilter;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <PageHeader
        component={() => (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 4, paddingVertical: 12 }}>
            {filterData.map((tab: any) => {
              const isActive = state[tab.id] && filter === tab.title;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => {
                    setState((prev) => ({ ...prev, [tab.id]: true }));
                    setFilter(tab.title);
                  }}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                    borderWidth: isActive ? 1 : 0,
                    borderColor: theme.border,
                    backgroundColor: isActive ? theme.elevated : theme.card,
                  }}
                >
                  <Text style={{
                    textAlign: 'center',
                    fontWeight: '600',
                    color: isActive ? theme.text : theme.subText,
                    textTransform: 'capitalize',
                  }}>
                    {tab.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginVertical: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase', color: Theme.success }}>
          {filter} Sales Report
        </Text>
        <Text style={{ fontWeight: 'bold', color: Theme.primary, letterSpacing: 1 }}>
          {datasales?.total_sales_revenue}/-
        </Text>
      </View>

      <SalesReportTable
        headers={user?.role === 'superAdmin' ? Adminheaders : salesheaders}
        data={user?.role === 'superAdmin' ? getadminSalesReportData(sales) : getSalesReportData(sales)}
      />
    </View>
  );
};

export default SalesReport;