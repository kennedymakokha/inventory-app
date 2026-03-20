import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import { formatNumber } from '../../utils/formatNumbers';
import { useTheme } from '../context/themeContext';
import Icon from 'react-native-vector-icons/FontAwesome';

interface StatCardProps {
  totalTransactions: number;
  totalSales: number;
  cashTotal: number;
  mpesaTotal: number;
  cashCount: number;
  mpesaCount: number;
}

const StartCard = (data: StatCardProps) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* SALES CARD */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Icon name="dollar" size={24} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Total Sales</Text>
        <Text style={[styles.mainValue, { color: colors.text }]}>
          {formatNumber(data.totalSales)}
        </Text>
        
        <View style={styles.breakdownRow}>
          <Text style={[styles.subText, { color: colors.success }]}>
            M: {formatNumber(data.mpesaTotal)}
          </Text>
          <Text style={styles.separator}>|</Text>
          <Text style={[styles.subText, { color: colors.subText }]}>
            C: {formatNumber(data.cashTotal)}
          </Text>
        </View>
      </View>

      {/* TRANSACTIONS CARD */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Icon name="exchange" size={24} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Transactions</Text>
        <Text style={[styles.mainValue, { color: colors.text }]}>
          {String(data.totalTransactions)}
        </Text>
        
        <View style={styles.breakdownRow}>
          <Text style={[styles.subText, { color: colors.success }]}>
            M: {String(data.mpesaCount)}
          </Text>
          <Text style={styles.separator}>|</Text>
          <Text style={[styles.subText, { color: colors.subText }]}>
            C: {String(data.cashCount)}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default StartCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    
    paddingVertical: 10,
  },
  card: {
    flex: 1,
    padding: 12,
    minWidth:180,
    borderRadius: 10,
    alignItems: "center",
    elevation: 3, // Add subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontWeight: "600",
    fontSize: 14,
    marginTop: 4,
  },
  mainValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 4,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    width: '100%',
  },
  subText: {
    fontSize: 10,
    fontWeight: "500",
  },
  separator: {
    marginHorizontal: 4,
    color: '#ccc',
    fontSize: 10
  }
});