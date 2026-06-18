import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuickMenu } from '@/hooks/useQuickMenu';
import { getMenuItemConfig, MAX_QUICK_MENU } from '@/constants/quickMenu';
import settingApp from '@/settingApp';

export default function QuickMenuSettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { quickKeys, toggle, allFeatures } = useQuickMenu();

  const handleToggle = async (key: string) => {
    const result = await toggle(key);
    if (result === 'max') {
      Alert.alert(
        t('quickMenu.maxTitle'),
        t('quickMenu.maxAlert'),
        [{ text: t('common.confirm'), style: 'cancel' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('quickMenu.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          {t('quickMenu.subtitle', { max: MAX_QUICK_MENU, current: quickKeys.length })}
        </Text>

        <View style={styles.card}>
          {allFeatures.map((key, index) => {
            const config = getMenuItemConfig(key);
            if (!config) return null;
            const isEnabled = quickKeys.includes(key);

            return (
              <View
                key={key}
                style={[styles.row, index < allFeatures.length - 1 && styles.rowBorder]}
              >
                <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
                  <Ionicons name={config.icon} size={20} color={config.color} />
                </View>
                <Text style={styles.label}>{t(`menu.${key}`)}</Text>
                <Switch
                  value={isEnabled}
                  onValueChange={() => handleToggle(key)}
                  trackColor={{ false: '#E5E7EB', true: settingApp.green_primery }}
                  thumbColor="#FFFFFF"
                />
              </View>
            );
          })}
        </View>

        <Text style={styles.hint}>{t('quickMenu.hint')}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: settingApp.green_primery,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  content: { padding: 16, paddingBottom: 32 },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { flex: 1, fontSize: 15, color: '#1C1E21', fontWeight: '500' },
  hint: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
});
