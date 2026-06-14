import { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { addPost, type AuthorRole } from '@/data/mockFeed';
import { getAvatarColor, getInitials } from '@/utils/avatar';
import settingApp from '@/settingApp';

const SCREEN_WIDTH = Dimensions.get('window').width;

const BG_COLORS: (string | null)[] = [
  null,
  '#1877F2',
  '#E91E63',
  '#FF5722',
  '#4CAF50',
  '#9C27B0',
  '#FF9800',
  '#00BCD4',
  '#795548',
];

export default function CreatePostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { userInfo, sessionInfo } = useAuth();

  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [bgColor, setBgColor] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const canPost = content.trim().length > 0;
  const isTextOnly = images.length === 0;
  const name = userInfo?.full_name || 'Bạn';

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Không có quyền', 'Vui lòng cho phép truy cập thư viện ảnh.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (!result.canceled) {
      setImages(prev => [...prev, ...result.assets.map(a => a.uri)]);
      setBgColor(null);
    }
  };

  const removeImage = (uri: string) => {
    setImages(prev => prev.filter(i => i !== uri));
  };

  const handlePost = () => {
    if (!canPost) return;
    const role = sessionInfo?.primary_role as AuthorRole | undefined;
    const storeName = (sessionInfo?.context as Record<string, any>)?.stores?.[0]?.store_name as string | undefined;
    addPost({
      id: Date.now().toString(),
      type: 'user',
      author: name,
      authorRole: role,
      authorStore: storeName,
      content: content.trim(),
      images: images.length > 0 ? images : undefined,
      bgColor: isTextOnly && bgColor ? bgColor : undefined,
      time: 'Vừa xong',
      likes: 0,
      comments: [],
    });
    router.back();
  };

  const imageColSize = (SCREEN_WIDTH - 32 - 4) / 2;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#1C1E21" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo bài viết</Text>
        <TouchableOpacity
          style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
          onPress={handlePost}
          disabled={!canPost}
        >
          <Text style={[styles.postBtnText, !canPost && styles.postBtnTextDisabled]}>Đăng</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Author */}
        <View style={styles.authorRow}>
          <View style={[styles.avatar, { backgroundColor: getAvatarColor(name) }]}>
            <Text style={styles.avatarText}>{getInitials(name)}</Text>
          </View>
          <Text style={styles.authorName}>{name}</Text>
        </View>

        {/* Text input area */}
        <View
          style={[
            styles.inputArea,
            isTextOnly && bgColor ? { backgroundColor: bgColor, borderRadius: 12, marginHorizontal: 14, marginBottom: 12, minHeight: 180, justifyContent: 'center' } : null,
          ]}
        >
          <TextInput
            style={[
              styles.input,
              isTextOnly && bgColor ? styles.inputOnBg : null,
            ]}
            placeholder={t('newsfeed.whatOnYourMind', { name: name.split(' ')[0] })}
            placeholderTextColor={isTextOnly && bgColor ? 'rgba(255,255,255,0.6)' : '#9CA3AF'}
            value={content}
            onChangeText={setContent}
            multiline
            autoFocus
            textAlignVertical="center"
          />
        </View>

        {/* Image grid */}
        {images.length > 0 && (
          <View style={styles.imagesGrid}>
            {images.map((uri) => (
              <View
                key={uri}
                style={[
                  styles.imageWrapper,
                  { width: images.length === 1 ? SCREEN_WIDTH - 32 : imageColSize, height: images.length === 1 ? (SCREEN_WIDTH - 32) * 0.75 : imageColSize },
                ]}
              >
                <TouchableOpacity onPress={() => setPreviewImage(uri)} activeOpacity={0.9}>
                  <Image source={{ uri }} style={{ width: '100%', height: '100%', borderRadius: 8 }} resizeMode="cover" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(uri)}>
                  <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Toolbar */}
      <View style={[styles.toolbar, { paddingBottom: insets.bottom + 8 }]}>
        <Text style={styles.toolbarLabel}>Thêm vào bài viết</Text>
        <View style={styles.toolbarRow}>
          <TouchableOpacity style={styles.toolBtn} onPress={pickImage}>
            <Ionicons name="images-outline" size={28} color="#43A047" />
          </TouchableOpacity>
          {isTextOnly && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorList}>
              {BG_COLORS.map(color => (
                <TouchableOpacity
                  key={color ?? 'none'}
                  style={[
                    styles.colorDot,
                    color ? { backgroundColor: color } : styles.colorDotNone,
                    bgColor === color && styles.colorDotActive,
                  ]}
                  onPress={() => setBgColor(color)}
                >
                  {!color && <Ionicons name="close" size={14} color="#9CA3AF" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>

      {/* Fullscreen image preview */}
      <Modal visible={!!previewImage} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewImage(null)}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1C1E21' },
  postBtn: {
    backgroundColor: settingApp.green_primery,
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8,
  },
  postBtnDisabled: { backgroundColor: '#E5E7EB' },
  postBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  postBtnTextDisabled: { color: '#9CA3AF' },
  scroll: { flex: 1 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  avatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  authorName: { fontSize: 15, fontWeight: '600', color: '#1C1E21' },
  inputArea: { paddingHorizontal: 14 },
  input: { fontSize: 18, color: '#1C1E21', lineHeight: 26, minHeight: 100, paddingVertical: 8 },
  inputOnBg: {
    fontSize: 22, fontWeight: '700', color: '#FFFFFF',
    textAlign: 'center', lineHeight: 32, padding: 16,
  },
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, paddingHorizontal: 14, marginBottom: 12 },
  imageWrapper: { position: 'relative', overflow: 'hidden', borderRadius: 8 },
  removeBtn: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12,
  },
  toolbar: {
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
    paddingTop: 10, paddingHorizontal: 14,
  },
  toolbarLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 8 },
  toolbarRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toolBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  colorList: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  colorDot: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  colorDotNone: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB' },
  colorDotActive: { borderWidth: 3, borderColor: '#FFFFFF', elevation: 4, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4 },
  previewOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center', alignItems: 'center',
  },
  previewClose: { position: 'absolute', top: 50, right: 16, zIndex: 1, padding: 8 },
});
