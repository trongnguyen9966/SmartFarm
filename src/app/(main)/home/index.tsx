/**
 * Home - NewsFeed Screen
 * Facebook-style newsfeed: user posts + ads from sellers
 */

import { useAuth } from '@/hooks/useAuth';
import settingApp from '@/settingApp';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PostType = 'user' | 'ad';

interface Post {
  id: string;
  type: PostType;
  author: string;
  avatar?: string;
  content: string;
  image?: string;
  time: string;
  likes: number;
  comments: number;
  adTitle?: string;
  adCta?: string;
}

const MOCK_FEED: Post[] = [
  {
    id: '1',
    type: 'user',
    author: 'Nguyễn Văn An',
    content: 'Vườn cà chua của tôi hôm nay trông rất tốt! Mùa vụ này hứa hẹn bội thu.',
    time: '2 giờ trước',
    likes: 12,
    comments: 3,
  },
  {
    id: '2',
    type: 'ad',
    author: 'Cửa hàng Phân Bón Xanh',
    adTitle: 'Phân bón NPK cao cấp - Giảm 20%',
    content: 'Ưu đãi đặc biệt cho nông dân SmartFarm! Phân bón NPK 20-20-15 chất lượng cao, giao tận nơi.',
    time: 'Quảng cáo',
    likes: 0,
    comments: 0,
    adCta: 'Xem ngay',
  },
  {
    id: '3',
    type: 'user',
    author: 'Trần Thị Bình',
    content: 'Vừa hoàn thành nhật ký chăm sóc tuần này. Vườn dưa leo phát triển rất khỏe sau khi bón phân hữu cơ.',
    time: '5 giờ trước',
    likes: 8,
    comments: 1,
  },
  {
    id: '4',
    type: 'ad',
    author: 'Công ty Hạt Giống Việt',
    adTitle: 'Hạt giống F1 nhập khẩu',
    content: 'Đa dạng chủng loại hạt giống rau củ quả chất lượng cao. Tỷ lệ nảy mầm trên 95%.',
    time: 'Quảng cáo',
    likes: 0,
    comments: 0,
    adCta: 'Mua ngay',
  },
  {
    id: '5',
    type: 'user',
    author: 'Lê Văn Cường',
    content: 'Mùa mưa đến rồi, bà con nhớ che chắn cho vườn và kiểm tra hệ thống thoát nước nhé!',
    time: '1 ngày trước',
    likes: 24,
    comments: 7,
  },
];

export default function HomeScreen() {
  const { userInfo } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [postText, setPostText] = useState('');
  const [feed, setFeed] = useState<Post[]>(MOCK_FEED);

  const handlePost = () => {
    if (!postText.trim()) return;
    const newPost: Post = {
      id: Date.now().toString(),
      type: 'user',
      author: userInfo?.full_name || t('profile.defaultUser'),
      content: postText.trim(),
      time: t('newsfeed.justNow'),
      likes: 0,
      comments: 0,
    };
    setFeed([newPost, ...feed]);
    setPostText('');
  };

  const renderPost = ({ item }: { item: Post }) => {
    if (item.type === 'ad') {
      return (
        <View style={styles.adCard}>
          <View style={styles.adBadge}>
            <Text style={styles.adBadgeText}>{t('newsfeed.sponsored')}</Text>
          </View>
          <View style={styles.postHeader}>
            <View style={[styles.avatar, styles.adAvatar]}>
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
            <TouchableOpacity style={styles.ctaButton}>
              <Text style={styles.ctaText}>{item.adCta}</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.postMeta}>
            <Text style={styles.authorName}>{item.author}</Text>
            <Text style={styles.postTime}>{item.time}</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.postContent}>{item.content}</Text>

        <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="thumbs-up-outline" size={18} color="#6B7280" />
            <Text style={styles.actionText}>{item.likes > 0 ? item.likes : t('newsfeed.like')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={18} color="#6B7280" />
            <Text style={styles.actionText}>{item.comments > 0 ? item.comments : t('newsfeed.comment')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="share-outline" size={18} color="#6B7280" />
            <Text style={styles.actionText}>{t('newsfeed.share')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>SmartFarm</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="search-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          /* Post composer */
          <View style={styles.composer}>
            <View style={styles.composerAvatar}>
              <Ionicons name="person" size={22} color="#FFFFFF" />
            </View>
            <TouchableOpacity
              style={styles.composerInput}
              activeOpacity={1}
            >
              <TextInput
                style={styles.composerText}
                placeholder={t('newsfeed.whatOnYourMind', { name: userInfo?.full_name?.split(' ')[0] || '' })}
                placeholderTextColor="#9CA3AF"
                value={postText}
                onChangeText={setPostText}
                multiline
              />
            </TouchableOpacity>
            {postText.trim().length > 0 && (
              <TouchableOpacity style={styles.postBtn} onPress={handlePost}>
                <Ionicons name="send" size={20} color={settingApp.green_primery} />
              </TouchableOpacity>
            )}
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  header: {
    backgroundColor: settingApp.green_primery,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  composer: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  composerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: settingApp.green_primery,
    justifyContent: 'center',
    alignItems: 'center',
  },
  composerInput: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  composerText: {
    fontSize: 15,
    color: '#333',
    maxHeight: 80,
  },
  postBtn: {
    padding: 4,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    paddingVertical: 12,
  },
  adCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    paddingVertical: 12,
    borderLeftWidth: 3,
    borderLeftColor: settingApp.green_primery,
  },
  adBadge: {
    marginHorizontal: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  adBadgeText: {
    fontSize: 11,
    color: settingApp.green_primery,
    fontWeight: '500',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: settingApp.green_primery,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adAvatar: {
    backgroundColor: '#2196F3',
  },
  postMeta: {
    flex: 1,
    marginLeft: 10,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1E21',
  },
  postTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  adTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1E21',
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  postContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  ctaButton: {
    marginHorizontal: 12,
    marginTop: 4,
    backgroundColor: settingApp.green_primery,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
