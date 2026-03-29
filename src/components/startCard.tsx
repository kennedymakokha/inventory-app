import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { formatNumber } from '../../utils/formatNumbers';
import { useTheme } from '../context/themeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface StatCardProps {
  totalTransactions: number;
  totalSales: number;
  cashTotal: number;
  mpesaTotal: number;
  cashCount: number;
  mpesaCount: number;
}

const { width } = Dimensions.get('window');

const StatCard = (data: StatCardProps) => {
  const { colors, isDarkMode } = useTheme();

  const Card = ({ title, icon, value, subA, subB, subALabel, subBLabel, color }: any) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.title, { color: colors.subText }]}>{title}</Text>
      </View>

      <Text style={[styles.mainValue, { color: colors.text }]}>{value}</Text>

      <View style={[styles.footer, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
        <View style={styles.subItem}>
          <Text style={styles.subLabel}>{subALabel}</Text>
          <Text style={[styles.subValue, { color: colors.text }]}>{subA}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.subItem}>
          <Text style={styles.subLabel}>{subBLabel}</Text>
          <Text style={[styles.subValue, { color: colors.text }]}>{subB}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Card
        title="Total Revenue"
        icon="trending-up-outline"
        value={formatNumber(data.totalSales)}
        subALabel="MPESA"
        subA={formatNumber(data.mpesaTotal)}
        subBLabel="CASH"
        subB={formatNumber(data.cashTotal)}
        color="#22C55E" // Success Green
      />
      
      <Card
        title="Transactions"
        icon="receipt-outline"
        value={String(data.totalTransactions)}
        subALabel="M-PESA"
        subA={data.mpesaCount}
        subBLabel="CASH"
        subB={data.cashCount}
        color={colors.primary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 }
    }),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 4,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainValue: {
    fontSize: 20,
    fontWeight: "900",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  subItem: {
    flex: 1,
    alignItems: 'center',
  },
  subLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: '#888',
    marginBottom: 2,
  },
  subValue: {
    fontSize: 10,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: '60%',
    opacity: 0.5,
  }
});

export default StatCard;