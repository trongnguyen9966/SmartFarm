import { changeLanguage, SUPPORTED_LANGUAGES } from '@/i18n';
import settingApp from '@/settingApp';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface LanguageSelectorProps {
  /** Render as icon button (for login header) or list item (for settings) */
  variant?: 'icon' | 'listItem';
}

export function LanguageSelector({ variant = 'icon' }: LanguageSelectorProps) {
  const { i18n, t } = useTranslation();
  const [visible, setVisible] = useState(false);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language)
    ?? SUPPORTED_LANGUAGES[0];

  const handleSelect = async (code: string) => {
    await changeLanguage(code as any);
    setVisible(false);
  };

  const trigger =
    variant === 'listItem' ? (
      <TouchableOpacity style={styles.listItem} onPress={() => setVisible(true)}>
        <View style={styles.listItemLeft}>
          <Ionicons name="language" size={22} color={settingApp.green_primery} />
          <Text style={styles.listItemText}>{t('profile.language')}</Text>
        </View>
        <View style={styles.listItemRight}>
          <Text style={styles.listItemValue}>
            {currentLang.flag} {currentLang.label}
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    ) : (
      <TouchableOpacity style={styles.iconButton} onPress={() => setVisible(true)}>
        <Text style={styles.flagText}>{currentLang.flag}</Text>
      </TouchableOpacity>
    );

  return (
    <>
      {trigger}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('language.title')}</Text>
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isActive = lang.code === i18n.language;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langOption, isActive && styles.langOptionActive]}
                  onPress={() => handleSelect(lang.code)}
                >
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <Text
                    style={[styles.langLabel, isActive && styles.langLabelActive]}
                  >
                    {lang.label}
                  </Text>
                  {isActive && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={settingApp.green_primery}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagText: {
    fontSize: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listItemText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listItemValue: {
    fontSize: 14,
    color: '#666',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  langOptionActive: {
    backgroundColor: '#E8F5E9',
  },
  langFlag: {
    fontSize: 24,
  },
  langLabel: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  langLabelActive: {
    fontWeight: '600',
    color: settingApp.green_primery,
  },
});
