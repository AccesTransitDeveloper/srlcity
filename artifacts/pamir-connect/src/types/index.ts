export interface UserProfile {
  id: string;
  name: string;
  avatarUrl?: string | null;
  avatar?: string;
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
  image?: string | null;
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
  cover?: string;
  memberCount: number;
  joined: boolean;
  createdBy?: string | null;
  createdAt?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  location?: string | null;
  coverUrl?: string | null;
  cover?: string;
  participantCount: number;
  participating: boolean;
  createdBy?: string | null;
  createdAt?: string;
}

export interface ChatThread {
  id: string;
  user: UserProfile;
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
  read: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: "like" | "comment" | "message" | "invite";
  fromUser: UserProfile;
  text: string;
  read: boolean;
  createdAt: string;
}
