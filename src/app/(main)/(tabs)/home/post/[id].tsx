import { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import {
  addComment,
  getPostById,
  toggleLike,
  type AuthorRole,
  type Post,
  type PostComment,
} from '@/data/mockFeed';
import { getAvatarColor, getInitials } from '@/utils/avatar';
import settingApp from '@/settingApp';

const SCREEN_WIDTH = Dimensions.get('window').width;

function UserAvatar({ name, uri, size = 40 }: { name: string; uri?: string; size?: number }) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: getAvatarColor(name),
        justifyContent: 'center', alignItems: 'center',
      }}
    >
      <Text style={{ color: '#FFF', fontWeight: '700', fontSize: size * 0.38 }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

function RoleMeta({ role, store }: { role?: AuthorRole; store?: string }) {
  if (role === 'ESF Store Manager') {
    return (
      <View style={styles.roleMeta}>
        <Ionicons name="star" size={12} color="#FF9800" />
        <Text style={styles.roleText}>Nhân viên cửa hàng {store || ''}</Text>
      </View>
    );
  }
  return null;
}

function AuthorLine({ author, role }: { author: string; role?: AuthorRole }) {
  return (
    <View style={styles.authorLine}>
      <Text style={styles.authorName}>{author}</Text>
      {role === 'ESF Investor' && (
        <Ionicons name="ribbon" size={15} color="#FFD700" style={{ marginLeft: 4 }} />
      )}
    </View>
  );
}

function PostImages({ images, onImagePress }: { images: string[]; onImagePress: (uri: string) => void }) {
  if (!images.length) return null;

  if (images.length === 1) {
    return (
      <TouchableOpacity activeOpacity={0.92} onPress={() => onImagePress(images[0])}>
        <Image
          source={{ uri: images[0] }}
          style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.75 }}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.imageGrid}>
      {images.slice(0, 4).map((uri, idx) => (
        <TouchableOpacity
          key={uri}
          activeOpacity={0.92}
          onPress={() => onImagePress(uri)}
          style={[styles.gridImage, { width: (SCREEN_WIDTH - 2) / 2, height: (SCREEN_WIDTH - 2) / 2 }]}
        >
          <Image source={{ uri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          {idx === 3 && images.length > 4 && (
            <View style={styles.moreOverlay}>
              <Text style={styles.moreText}>+{images.length - 4}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userInfo, sessionInfo } = useAuth();

  const [post, setPost] = useState<Post | undefined>(() => getPostById(id));
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useFocusEffect(useCallback(() => {
    setPost(getPostById(id));
  }, [id]));

  if (!post) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#9CA3AF' }}>Không tìm thấy bài viết.</Text>
      </View>
    );
  }

  const handleLike = () => {
    const next = !liked;
    setLiked(next);
    toggleLike(post.id, next);
    setPost(getPostById(post.id));
  };

  const handleComment = () => {
    const text = commentText.trim();
    if (!text) return;
    const name = userInfo?.full_name || 'Bạn';
    const role = sessionInfo?.primary_role as AuthorRole | undefined;
    const store = (sessionInfo?.context as Record<string, any>)?.stores?.[0]?.store_name as string | undefined;
    const comment: PostComment = {
      id: Date.now().toString(),
      author: name,
      authorRole: role,
      authorStore: store,
      content: text,
      time: 'Vừa xong',
    };
    addComment(post.id, comment);
    setPost(getPostById(post.id));
    setCommentText('');
  };

  const isTextBg = !post.images?.length && !!post.bgColor;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.bottom}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bài viết</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Post card */}
        <View style={styles.postCard}>
          {/* Author */}
          <View style={styles.postHeader}>
            <UserAvatar name={post.author} uri={post.avatar} size={44} />
            <View style={styles.postMeta}>
              <AuthorLine author={post.author} role={post.authorRole} />
              <RoleMeta role={post.authorRole} store={post.authorStore} />
              <Text style={styles.postTime}>{post.time}</Text>
            </View>
          </View>

          {/* Content */}
          {isTextBg ? (
            <View style={[styles.bgContent, { backgroundColor: post.bgColor }]}>
              <Text style={styles.bgText}>{post.content}</Text>
            </View>
          ) : (
            <Text style={styles.postContent}>{post.content}</Text>
          )}

          {/* Images */}
          {!!post.images?.length && (
            <PostImages images={post.images} onImagePress={setFullscreenImage} />
          )}

          {/* Likes count */}
          {post.likes > 0 && (
            <View style={styles.likesRow}>
              <View style={styles.likeIcon}>
                <Ionicons name="thumbs-up" size={12} color="#FFFFFF" />
              </View>
              <Text style={styles.likesCount}>{post.likes}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
              <Ionicons
                name={liked ? 'thumbs-up' : 'thumbs-up-outline'}
                size={20}
                color={liked ? settingApp.green_primery : '#6B7280'}
              />
              <Text style={[styles.actionText, liked && { color: settingApp.green_primery }]}>Thích</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => inputRef.current?.focus()}>
              <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
              <Text style={styles.actionText}>Bình luận</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments */}
        {post.comments.length > 0 && (
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>Bình luận ({post.comments.length})</Text>
            {post.comments.map(c => (
              <View key={c.id} style={styles.commentRow}>
                <UserAvatar name={c.author} uri={c.avatar} size={34} />
                <View style={styles.commentBubble}>
                  <View style={styles.commentAuthorRow}>
                    <AuthorLine author={c.author} role={c.authorRole} />
                    {c.authorRole === 'ESF Store Manager' && c.authorStore && (
                      <View style={styles.roleMeta}>
                        <Ionicons name="star" size={11} color="#FF9800" />
                        <Text style={[styles.roleText, { fontSize: 10 }]}>{c.authorStore}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.commentContent}>{c.content}</Text>
                  <Text style={styles.commentTime}>{c.time}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Comment input */}
      <View style={[styles.commentInputRow, { paddingBottom: insets.bottom + 8 }]}>
        <UserAvatar name={userInfo?.full_name || 'Bạn'} size={36} />
        <TextInput
          ref={inputRef}
          style={styles.commentInput}
          placeholder="Viết bình luận..."
          placeholderTextColor="#9CA3AF"
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <TouchableOpacity
          onPress={handleComment}
          disabled={!commentText.trim()}
          style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
        >
          <Ionicons name="send" size={20} color={commentText.trim() ? settingApp.green_primery : '#D1D5DB'} />
        </TouchableOpacity>
      </View>

      {/* Fullscreen image */}
      <Modal visible={!!fullscreenImage} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.fullscreenOverlay}>
          <TouchableOpacity style={styles.fullscreenClose} onPress={() => setFullscreenImage(null)}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {fullscreenImage && (
            <Image
              source={{ uri: fullscreenImage }}
              style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.2 }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  header: {
    backgroundColor: settingApp.green_primery,
    paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  scroll: { flex: 1 },
  postCard: { backgroundColor: '#FFFFFF', marginBottom: 8 },
  postHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, gap: 10 },
  postMeta: { flex: 1 },
  authorLine: { flexDirection: 'row', alignItems: 'center' },
  authorName: { fontSize: 15, fontWeight: '700', color: '#1C1E21' },
  roleMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  roleText: { fontSize: 11, color: '#6B7280' },
  postTime: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  bgContent: {
    marginHorizontal: 12, marginBottom: 12, borderRadius: 12,
    paddingVertical: 32, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center',
  },
  bgText: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', lineHeight: 30 },
  postContent: { fontSize: 15, color: '#1C1E21', lineHeight: 22, paddingHorizontal: 12, paddingBottom: 12 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  gridImage: { overflow: 'hidden' },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  moreText: { color: '#FFFFFF', fontSize: 24, fontWeight: '700' },
  likesRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6 },
  likeIcon: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: settingApp.green_primery,
    justifyContent: 'center', alignItems: 'center', marginRight: 4,
  },
  likesCount: { fontSize: 13, color: '#6B7280' },
  actionsRow: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#E5E7EB',
    paddingVertical: 4, paddingHorizontal: 12,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8,
  },
  actionText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  commentsSection: { backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingTop: 12 },
  commentsTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },
  commentRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  commentBubble: { flex: 1, backgroundColor: '#F0F2F5', borderRadius: 12, padding: 10 },
  commentAuthorRow: { marginBottom: 3 },
  commentContent: { fontSize: 14, color: '#1C1E21', lineHeight: 20 },
  commentTime: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  commentInputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  commentInput: {
    flex: 1, backgroundColor: '#F0F2F5', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#1C1E21', maxHeight: 100,
  },
  sendBtn: { paddingBottom: 10 },
  sendBtnDisabled: { opacity: 0.4 },
  fullscreenOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.94)',
    justifyContent: 'center', alignItems: 'center',
  },
  fullscreenClose: { position: 'absolute', top: 50, right: 16, zIndex: 10, padding: 8 },
});
