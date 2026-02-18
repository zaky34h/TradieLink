export type Role = 'Builder' | 'Tradie';
export type Screen = 'login' | 'signup' | 'builderHome' | 'tradieHome';
export type BuilderTab = 'home' | 'jobs' | 'messages' | 'quotes' | 'pay' | 'profile';
export type TradieTab = 'home' | 'jobs' | 'messages' | 'quotes' | 'pay' | 'profile';
export type JobStatus = 'posted' | 'inProgress' | 'done';
export type QuoteStatus = 'pending' | 'declined' | 'approved';

export type TradeOption =
  | 'Carpenter'
  | 'Plumber'
  | 'Scaffolder'
  | 'Electrician'
  | 'Waterproofer'
  | 'Renderer';

export type JobEnquiry = {
  id: number;
  name: string;
  occupation?: string | null;
};

export type BuilderJob = {
  id: number;
  title: string;
  location: string;
  tradesNeeded: TradeOption[];
  details: string;
  status: JobStatus;
  interestedTradies: string[];
  enquiries: JobEnquiry[];
};

export type AuthUser = {
  id: number;
  role: 'builder' | 'tradie';
  firstName: string;
  lastName: string;
  about?: string | null;
  companyName?: string | null;
  address?: string | null;
  occupation?: string | null;
  pricePerHour?: number | null;
  experienceYears?: number | null;
  certifications?: string[];
  photoUrl?: string | null;
  email: string;
};

export type BuilderDashboardStats = {
  activeChats: number;
  pendingOffers: number;
  savedTradies: number;
  pendingPay: number;
};

export type MessageThread = {
  id: number;
  participant: {
    id: number;
    role: 'builder' | 'tradie';
    name: string;
    subtitle?: string;
  };
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount?: number;
};

export type ThreadMessage = {
  id: number;
  threadId: number;
  senderId: number;
  senderRole?: 'builder' | 'tradie';
  senderName?: string;
  body: string;
  createdAt: string;
};

export type ChatTypingStatus = {
  meTyping: boolean;
  peerTyping: boolean;
  eitherTyping: boolean;
};

export type BuilderDirectoryItem = {
  id: number;
  firstName: string;
  lastName: string;
  companyName?: string | null;
  displayName: string;
};

export type TradieDirectoryItem = {
  id: number;
  firstName: string;
  lastName: string;
  occupation?: string | null;
  displayName: string;
};

export type TradieJobBoardItem = {
  id: number;
  builderId: number;
  builderDisplayName: string;
  title: string;
  location: string;
  tradesNeeded: TradeOption[];
  details: string;
  status: 'posted';
  hasEnquired: boolean;
  enquiriesCount: number;
  createdAt: string;
};
