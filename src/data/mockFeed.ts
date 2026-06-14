export type AuthorRole = 'ESF Store Manager' | 'ESF Investor' | 'ESF Farm Owner';

export interface PostComment {
  id: string;
  author: string;
  avatar?: string;
  authorRole?: AuthorRole;
  authorStore?: string;
  content: string;
  time: string;
}

export interface Post {
  id: string;
  type: 'user' | 'ad';
  author: string;
  avatar?: string;
  authorRole?: AuthorRole;
  authorStore?: string;
  content: string;
  images?: string[];
  bgColor?: string;
  time: string;
  likes: number;
  comments: PostComment[];
  adTitle?: string;
  adCta?: string;
}

const INITIAL_FEED: Post[] = [
  {
    id: '1',
    type: 'user',
    author: 'Nguyễn Văn An',
    authorRole: 'ESF Store Manager',
    authorStore: 'Cửa hàng Quận 1',
    content: 'Vườn cà chua của tôi hôm nay trông rất tốt! Mùa vụ này hứa hẹn bội thu.',
    bgColor: '#1877F2',
    time: '2 giờ trước',
    likes: 12,
    comments: [
      {
        id: 'c1', author: 'Trần Thị Bình', authorRole: 'ESF Investor',
        content: 'Chúc mừng bạn! Hy vọng mùa vụ thành công.', time: '1 giờ trước',
      },
      {
        id: 'c2', author: 'Lê Văn Cường', authorRole: 'ESF Farm Owner',
        content: 'Tuyệt vời, chia sẻ kinh nghiệm với mọi người nhé!', time: '30 phút trước',
      },
    ],
  },
  {
    id: '2',
    type: 'ad',
    author: 'Cửa hàng Phân Bón Xanh',
    adTitle: 'Phân bón NPK cao cấp - Giảm 20%',
    content: 'Ưu đãi đặc biệt cho nông dân SmartFarm! Phân bón NPK 20-20-15 chất lượng cao, giao tận nơi.',
    time: 'Quảng cáo',
    likes: 0,
    comments: [],
    adCta: 'Xem ngay',
  },
  {
    id: '3',
    type: 'user',
    author: 'Trần Thị Bình',
    authorRole: 'ESF Investor',
    content: 'Vừa hoàn thành nhật ký chăm sóc tuần này. Vườn dưa leo phát triển rất khỏe sau khi bón phân hữu cơ.',
    time: '5 giờ trước',
    likes: 8,
    comments: [
      {
        id: 'c3', author: 'Nguyễn Văn An', authorRole: 'ESF Store Manager', authorStore: 'Cửa hàng Quận 1',
        content: 'Phân hữu cơ của bên mình rất phù hợp cho dưa leo đó!', time: '4 giờ trước',
      },
    ],
  },
  {
    id: '4',
    type: 'ad',
    author: 'Công ty Hạt Giống Việt',
    adTitle: 'Hạt giống F1 nhập khẩu',
    content: 'Đa dạng chủng loại hạt giống rau củ quả chất lượng cao. Tỷ lệ nảy mầm trên 95%.',
    time: 'Quảng cáo',
    likes: 0,
    comments: [],
    adCta: 'Mua ngay',
  },
  {
    id: '5',
    type: 'user',
    author: 'Lê Văn Cường',
    authorRole: 'ESF Farm Owner',
    content: 'Mùa mưa đến rồi, bà con nhớ che chắn cho vườn và kiểm tra hệ thống thoát nước nhé!',
    bgColor: '#4CAF50',
    time: '1 ngày trước',
    likes: 24,
    comments: [
      {
        id: 'c4', author: 'Nguyễn Văn An', authorRole: 'ESF Store Manager', authorStore: 'Cửa hàng Quận 7',
        content: 'Cảm ơn bạn đã nhắc nhở!', time: '20 giờ trước',
      },
      {
        id: 'c5', author: 'Trần Thị Bình', authorRole: 'ESF Investor',
        content: 'Hữu ích lắm, mình sẽ làm ngay.', time: '18 giờ trước',
      },
    ],
  },
];

let _feed: Post[] = [...INITIAL_FEED];

export function getFeed(): Post[] {
  return _feed;
}

export function getPostById(id: string): Post | undefined {
  return _feed.find(p => p.id === id);
}

export function addPost(post: Post): void {
  _feed = [post, ..._feed];
}

export function addComment(postId: string, comment: PostComment): void {
  _feed = _feed.map(p =>
    p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
  );
}

export function toggleLike(postId: string, liked: boolean): void {
  _feed = _feed.map(p =>
    p.id === postId ? { ...p, likes: liked ? p.likes + 1 : Math.max(0, p.likes - 1) } : p
  );
}
