/**
 * Home - NewsFeed Screen
 */

import { useCallback, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useQuickMenu } from '@/hooks/useQuickMenu';
import { getMenuItemConfig } from '@/constants/quickMenu';
import { getFeed, toggleLike, type AuthorRole, type Post } from '@/data/mockFeed';
import { getAvatarColor, getInitials } from '@/utils/avatar';
import settingApp from '@/settingApp';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ─── Shared sub-components ───────────────────────────────────────────────────

function UserAvatar({ name, uri, size = 40 }: { name: string; uri?: string; size?: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: getAvatarColor(name), justifyContent: 'center', alignItems: 'center',
    }}>
      <Text style={{ color: '#FFF', fontWeight: '700', fontSize: Math.round(size * 0.38) }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

function RoleMeta({ role, store }: { role?: AuthorRole; store?: string }) {
  if (role !== 'ESF Store Manager') return null;
  return (
    <View style={styles.roleMeta}>
      <Ionicons name="star" size={11} color="#FF9800" />
      <Text style={styles.roleText}>Nhân viên cửa hàng {store || ''}</Text>
    </View>
  );
}

function PostImages({ images, onPress }: { images: string[]; onPress: () => void }) {
  if (!images.length) return null;
  if (images.length === 1) {
    return (
      <TouchableOpacity activeOpacity={0.92} onPress={onPress}>
        <Image
          source={{ uri: images[0] }}
          style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.75 }}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  }
  const half = (SCREEN_WIDTH - 2) / 2;
  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onPress}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
        {images.slice(0, 4).map((uri, idx) => (
          <View key={uri} style={{ width: half, height: half, overflow: 'hidden' }}>
            <Image
              source={{ uri }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              resizeMode="cover"
            />
            {idx === 3 && images.length > 4 && (
              <View style={styles.moreOverlay}>
                <Text style={styles.moreText}>+{images.length - 4}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { userInfo } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { quickKeys, reload: reloadQuickMenu } = useQuickMenu();

  const [feed, setFeed] = useState<Post[]>(() => getFeed());
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => {
    setFeed(getFeed());
    reloadQuickMenu();
  }, [reloadQuickMenu]));

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setFeed(getFeed());
      setRefreshing(false);
    }, 800);
  }, []);

  const handleLike = (postId: string) => {
    const isLiked = likedIds.has(postId);
    const next = new Set(likedIds);
    if (isLiked) { next.delete(postId); } else { next.add(postId); }
    setLikedIds(next);
    toggleLike(postId, !isLiked);
    setFeed(getFeed());
  };

  const goToDetail = (id: string) => {
    router.push(`/(main)/home/post/${id}` as never);
  };

  const name = userInfo?.full_name || '';

  // ─── Render post ───────────────────────────────────────────────────────────

  const renderPost = ({ item }: { item: Post }) => {
    if (item.type === 'ad') {
      return (
        <View style={styles.adCard}>
          <View style={styles.adBadge}>
            <Text style={styles.adBadgeText}>{t('newsfeed.sponsored')}</Text>
          </View>
          <View style={styles.postHeader}>
            <View style={styles.adAvatarBox}>
              <Ionicons name="storefront" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.postMeta}>
              <Text style={styles.authorName}>{item.author}</Text>
              <Text style={styles.postTime}>{item.time}</Text>
            </View>
          </View>
          {item.adTitle && <Text style={styles.adTitle}>{item.adTitle}</Text>}
          <Text style={styles.postContent}>{item.content}</Text>
          {item.adCta && (
            <TouchableOpacity style={styles.ctaBtn}>
              <Text style={styles.ctaText}>{item.adCta}</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    const isLiked = likedIds.has(item.id);
    const isTextBg = !item.images?.length && !!item.bgColor;

    return (
      <View style={styles.postCard}>
        {/* Header */}
        <View style={styles.postHeader}>
          <UserAvatar name={item.author} uri={item.avatar} size={42} />
          <View style={styles.postMeta}>
            <View style={styles.authorLine}>
              <Text style={styles.authorName}>{item.author}</Text>
              {item.authorRole === 'ESF Investor' && (
                <Ionicons name="ribbon" size={14} color="#FFD700" style={{ marginLeft: 4 }} />
              )}
            </View>
            <RoleMeta role={item.authorRole} store={item.authorStore} />
            <Text style={styles.postTime}>{item.time}</Text>
          </View>
          <TouchableOpacity style={styles.moreBtn}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {isTextBg ? (
          <View style={[styles.bgContent, { backgroundColor: item.bgColor }]}>
            <Text style={styles.bgText}>{item.content}</Text>
          </View>
        ) : (
          <Text style={styles.postContent}>{item.content}</Text>
        )}

        {/* Images */}
        {!!item.images?.length && (
          <PostImages images={item.images} onPress={() => goToDetail(item.id)} />
        )}

        {/* Likes + comment count summary */}
        {(item.likes > 0 || item.comments.length > 0) && (
          <View style={styles.summaryRow}>
            {item.likes > 0 && (
              <View style={styles.summaryLeft}>
                <View style={styles.likeIconBadge}>
                  <Ionicons name="thumbs-up" size={10} color="#FFFFFF" />
                </View>
                <Text style={styles.summaryText}>{item.likes}</Text>
              </View>
            )}
            {item.comments.length > 0 && (
              <TouchableOpacity onPress={() => goToDetail(item.id)} style={styles.summaryRight}>
                <Text style={styles.summaryText}>{item.comments.length} bình luận</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Action bar */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item.id)}>
            <Ionicons
              name={isLiked ? 'thumbs-up' : 'thumbs-up-outline'}
              size={18}
              color={isLiked ? settingApp.green_primery : '#6B7280'}
            />
            <Text style={[styles.actionText, isLiked && { color: settingApp.green_primery }]}>
              {t('newsfeed.like')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => goToDetail(item.id)}>
            <Ionicons name="chatbubble-outline" size={18} color="#6B7280" />
            <Text style={styles.actionText}>{t('newsfeed.comment')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="share-outline" size={18} color="#6B7280" />
            <Text style={styles.actionText}>{t('newsfeed.share')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── List header: quick access + composer ──────────────────────────────────

  const ListHeader = (
    <View>
      {/* Quick Access — horizontal scroll to handle 1-5 items */}
      {quickKeys.length > 0 && (
        <View style={styles.quickSection}>
          <View style={styles.quickHeader}>
            <Text style={styles.quickTitle}>{t('quickMenu.quickAccess')}</Text>
            <TouchableOpacity
              onPress={() => router.push('/(main)/quick-menu-settings' as never)}
              style={styles.quickSettingsBtn}
            >
              <Ionicons name="settings-outline" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickScroll}
          >
            {quickKeys.map(key => {
              const config = getMenuItemConfig(key);
              if (!config) return null;
              return (
                <TouchableOpacity
                  key={key}
                  style={styles.quickTile}
                  onPress={() => { if (config.route) router.push(config.route as never); }}
                >
                  <View style={[styles.quickIcon, { backgroundColor: config.bg }]}>
                    <Ionicons name={config.icon} size={22} color={config.color} />
                  </View>
                  <Text style={styles.quickLabel} numberOfLines={2}>{t(`menu.${key}`)}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Composer */}
      <View style={styles.composerCard}>
        {/* Top row */}
        <View style={styles.composerRow}>
          <UserAvatar name={name} size={40} />
          <TouchableOpacity
            style={styles.composerInput}
            activeOpacity={0.7}
            onPress={() => router.push('/(main)/home/create-post' as never)}
          >
            <Text style={styles.composerPlaceholder}>
              {t('newsfeed.whatOnYourMind', { name: name.split(' ')[0] || '' })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.composerDivider} />

        {/* Bottom shortcuts */}
        <View style={styles.composerActions}>
          <TouchableOpacity
            style={styles.composerAction}
            onPress={() => router.push('/(main)/home/create-post' as never)}
          >
            <Ionicons name="images-outline" size={20} color="#43A047" />
            <Text style={styles.composerActionText}>Ảnh / Video</Text>
          </TouchableOpacity>
          <View style={styles.composerDividerV} />
          <TouchableOpacity
            style={styles.composerAction}
            onPress={() => router.push('/(main)/home/create-post' as never)}
          >
            <Ionicons name="happy-outline" size={20} color="#FF9800" />
            <Text style={styles.composerActionText}>Cảm xúc</Text>
          </TouchableOpacity>
          <View style={styles.composerDividerV} />
          <TouchableOpacity
            style={styles.composerAction}
            onPress={() => router.push('/(main)/home/create-post' as never)}
          >
            <Ionicons name="location-outline" size={20} color="#E53935" />
            <Text style={styles.composerActionText}>Địa điểm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>SmartFarm</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="search-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={feed}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={ListHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={settingApp.green_primery}
            colors={[settingApp.green_primery]}
          />
        }
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },

  // Header
  header: {
    backgroundColor: settingApp.green_primery,
    paddingHorizontal: 16, paddingBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Quick access
  quickSection: {
    backgroundColor: '#FFFFFF', paddingTop: 12, paddingBottom: 2,
    marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  quickHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, marginBottom: 10,
  },
  quickTitle: { fontSize: 13, fontWeight: '700', color: '#374151', letterSpacing: 0.3 },
  quickSettingsBtn: { padding: 4 },
  quickScroll: { paddingHorizontal: 14, paddingBottom: 14, gap: 16 },
  quickTile: { alignItems: 'center', width: 62 },
  quickIcon: {
    width: 52, height: 52, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  quickLabel: { fontSize: 11, color: '#374151', fontWeight: '500', textAlign: 'center', lineHeight: 14 },

  // Composer
  composerCard: {
    backgroundColor: '#FFFFFF', marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  composerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingTop: 12, paddingBottom: 10,
  },
  composerInput: {
    flex: 1, backgroundColor: '#F0F2F5', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  composerPlaceholder: { fontSize: 15, color: '#9CA3AF' },
  composerDivider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 12 },
  composerActions: { flexDirection: 'row', paddingVertical: 4 },
  composerAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10,
  },
  composerActionText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  composerDividerV: { width: 1, backgroundColor: '#F3F4F6', marginVertical: 8 },

  // Post card
  postCard: {
    backgroundColor: '#FFFFFF', marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  postHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, gap: 10 },
  postMeta: { flex: 1 },
  authorLine: { flexDirection: 'row', alignItems: 'center' },
  authorName: { fontSize: 15, fontWeight: '700', color: '#1C1E21' },
  roleMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  roleText: { fontSize: 11, color: '#6B7280' },
  postTime: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  moreBtn: { padding: 4 },
  postContent: { fontSize: 15, color: '#1C1E21', lineHeight: 22, paddingHorizontal: 12, paddingBottom: 10 },
  bgContent: {
    marginHorizontal: 12, marginBottom: 10, borderRadius: 14,
    paddingVertical: 32, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center',
    minHeight: 140,
  },
  bgText: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', lineHeight: 28 },
  moreOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  moreText: { color: '#FFFFFF', fontSize: 24, fontWeight: '700' },

  // Summary row (likes + comment count)
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  summaryLeft: { flexDirection: 'row', alignItems: 'center' },
  summaryRight: {},
  likeIconBadge: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: settingApp.green_primery,
    justifyContent: 'center', alignItems: 'center', marginRight: 4,
  },
  summaryText: { fontSize: 13, color: '#6B7280' },

  // Action row
  actionsRow: {
    flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 2,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 8,
  },
  actionText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },

  // Ad card
  adCard: {
    backgroundColor: '#FFFFFF', marginBottom: 8,
    borderLeftWidth: 3, borderLeftColor: settingApp.green_primery,
  },
  adBadge: {
    marginHorizontal: 12, marginTop: 12, marginBottom: 4, alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2,
  },
  adBadgeText: { fontSize: 11, color: settingApp.green_primery, fontWeight: '600' },
  adAvatarBox: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#2196F3', justifyContent: 'center', alignItems: 'center',
  },
  adTitle: { fontSize: 16, fontWeight: '700', color: '#1C1E21', paddingHorizontal: 12, marginBottom: 4 },
  ctaBtn: {
    marginHorizontal: 12, marginBottom: 12, marginTop: 4,
    backgroundColor: settingApp.green_primery, borderRadius: 8, paddingVertical: 10, alignItems: 'center',
  },
  ctaText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
