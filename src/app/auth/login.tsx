/**
 * Login Screen
 * Handles user authentication
 */

import { LanguageSelector } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import * as TokenStorage from '@/services/auth/tokenStorage';
import settingApp from '@/settingApp';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function LoginScreen() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load saved credentials on mount
  useEffect(() => {
    const loadSavedCredentials = async () => {
      const creds = await TokenStorage.getCredentials();
      if (creds) {
        setEmail(creds.username);
        setPassword(creds.password);
        setRememberMe(true);
      }
    };
    loadSavedCredentials();
  }, []);

  const handleLogin = async () => {
    // Validate inputs
    if (!email.trim()) {
      setError(t('login.errorEmptyEmail'));
      return;
    }
    if (!password.trim()) {
      setError(t('login.errorEmptyPassword'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await login(email.trim(), password, rememberMe);
      // Navigation is handled by AuthContext
    } catch (err) {
      console.error('[Login] Error:', err);
      const message = err instanceof Error ? err.message : t('login.errorGeneric');

      // Check for common errors
      if (message.includes('401') || message.includes('Invalid')) {
        setError(t('login.errorInvalidCredentials'));
      } else if (message.includes('Network') || message.includes('timeout')) {
        setError(t('login.errorNetwork'));
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ width: 40 }} />
          <View style={{ flex: 1 }} />
          <LanguageSelector variant="icon" />
        </View>
        <Text style={styles.welcomeText}>{t('login.welcome')}</Text>
        <Text style={styles.welcomeText}>{t('login.welcomeSub')}</Text>
      </View>

      {/* Form card */}
      <KeyboardAvoidingView
        style={styles.formWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <Text style={styles.label}>{t('login.emailLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('login.emailPlaceholder')}
              placeholderTextColor="#A0A0A0"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            {/* Password */}
            <Text style={styles.label}>{t('login.passwordLabel')}</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="#A0A0A0"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                secureTextEntry={secureText}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setSecureText(!secureText)}
                disabled={isLoading}
              >
                <Ionicons
                  name={secureText ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#A0A0A0"
                />
              </TouchableOpacity>
            </View>

            {/* Remember me */}
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
              disabled={isLoading}
            >
              <Ionicons
                name={rememberMe ? 'checkbox' : 'square-outline'}
                size={22}
                color={rememberMe ? settingApp.green_primery : '#A0A0A0'}
              />
              <Text style={styles.rememberText}>{t('login.rememberMe')}</Text>
            </TouchableOpacity>

            {/* Login button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>{t('login.loginButton')}</Text>
              )}
            </TouchableOpacity>

            {/* Forgot password */}
            <TouchableOpacity style={styles.forgotButton} disabled={isLoading}>
              <Text style={styles.forgotText}>{t('login.forgotPassword')}</Text>
            </TouchableOpacity>

            {/* Contact store */}
            <TouchableOpacity style={styles.contactButton} disabled={isLoading}>
              <Text style={styles.contactText}>{t('login.contactStore')}</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: settingApp.green_primery,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  formWrapper: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#EF4444',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333333',
    backgroundColor: '#F9F9F9',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333333',
  },
  eyeIcon: {
    paddingHorizontal: 14,
  },
  rememberRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 16,
    gap: 8,
  },
  rememberText: {
    fontSize: 14,
    color: '#333333',
  },
  loginButton: {
    backgroundColor: settingApp.green_primery,
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 28,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  forgotButton: {
    alignItems: 'center',
    marginTop: 14,
  },
  forgotText: {
    fontSize: 13,
    color: '#888888',
  },
  contactButton: {
    alignItems: 'center',
    marginTop: 24,
  },
  contactText: {
    fontSize: 14,
    fontWeight: '600',
    color: settingApp.green_primery,
    textDecorationLine: 'underline',
  },
});
