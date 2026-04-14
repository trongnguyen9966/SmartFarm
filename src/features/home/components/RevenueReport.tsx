import settingApp from '@/settingApp';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

const revenueData = [
  { label: 'T2', value: 1.2 },
  { label: 'T3', value: 2.5 },
  { label: 'T4', value: 1.8 },
  { label: 'T5', value: 3.2 },
  { label: 'T6', value: 2.9 },
  { label: 'T7', value: 4.1 },
  { label: 'CN', value: 3.5 },
];

const maxValue = Math.max(...revenueData.map((d) => d.value));

export default function RevenueReport() {
  const total = revenueData.reduce((sum, d) => sum + d.value, 0);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Báo cáo doanh thu</Text>
          <Text style={styles.period}>Tuần này</Text>
        </View>
        <View style={styles.totalBadge}>
          <Ionicons name="trending-up" size={16} color={settingApp.green_primery} />
          <Text style={styles.totalText}>{total.toFixed(1)}M</Text>
        </View>
      </View>

      {/* Bar chart */}
      <View style={styles.chart}>
        {revenueData.map((item) => (
          <View key={item.label} style={styles.barGroup}>
            <Text style={styles.barValue}>{item.value}M</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  { height: `${(item.value / maxValue) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.barLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Summary row */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Ionicons name="cart-outline" size={18} color={settingApp.green_primery} />
          <View style={styles.summaryText}>
            <Text style={styles.summaryValue}>156</Text>
            <Text style={styles.summaryLabel}>Đơn hàng</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Ionicons name="leaf-outline" size={18} color={settingApp.green_primery} />
          <View style={styles.summaryText}>
            <Text style={styles.summaryValue}>2.4 tấn</Text>
            <Text style={styles.summaryLabel}>Sản lượng</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Ionicons name="people-outline" size={18} color={settingApp.green_primery} />
          <View style={styles.summaryText}>
            <Text style={styles.summaryValue}>89</Text>
            <Text style={styles.summaryLabel}>Khách hàng</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  period: {
    fontSize: 13,
    color: '#999999',
    marginTop: 2,
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FFF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  totalText: {
    fontSize: 15,
    fontWeight: '700',
    color: settingApp.green_primery,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    marginBottom: 20,
  },
  barGroup: {
    alignItems: 'center',
    flex: 1,
  },
  barValue: {
    fontSize: 10,
    color: '#999999',
    marginBottom: 4,
  },
  barTrack: {
    width: 24,
    height: 100,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    backgroundColor: settingApp.green_primery,
    borderRadius: 12,
  },
  barLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  summaryText: {
    alignItems: 'flex-start',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#999999',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },
});
