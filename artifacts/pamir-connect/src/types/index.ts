export interface UserProfile {
  id: string;
  email?: string | null;
  name: string;
  avatarUrl?: string | null;
  institution?: string | null;
  city?: string | null;
  bio?: string | null;
  badge?: "active" | "leader" | null;
  rating: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  author: UserProfile;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  author: UserProfile;
  content: string;
  imageUrl?: string | null;
  groupId?: string | null;
  likes: number;
  liked: boolean;
  comments: Comment[];
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string | null;
  coverUrl?: string | null;
  memberCount: number;
  joined: boolean;
  pendingRequest?: boolean;
  isCreator?: boolean;
  createdBy?: string | null;
  chatThreadId?: string | null;
  createdAt?: string;
}

export interface GroupJoinRequest {
  id: string;
  groupId: string;
  userId: string;
  status: string;
  user: UserProfile;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  location?: string | null;
  coverUrl?: string | null;
  participantCount: number;
  participating: boolean;
  createdBy?: string | null;
  createdAt?: string;
}

export interface ChatThread {
  id: string;
  isGroup: boolean;
  group?: Group | null;
  user?: UserProfile | null;
  lastMessage?: string | null;
  lastMessageTime?: string | null;
  unread: number;
  createdAt?: string;
}

export interface Message {
  id: string;
  threadId: string;
  sender: UserProfile;
  text: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  read: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: "like" | "comment" | "message" | "invite" | "join_request";
  fromUser: UserProfile;
  relatedId?: string | null;
  text: string;
  read: boolean;
  createdAt: string;
}
