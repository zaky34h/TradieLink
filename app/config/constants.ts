import type { BuilderDashboardStats, TradeOption } from '../types';

export const BRAND_BLUE = '#1DB5AE';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export const EMPTY_BUILDER_STATS: BuilderDashboardStats = {
  activeChats: 0,
  pendingOffers: 0,
  savedTradies: 0,
  pendingPay: 0,
};

export const TRADE_OPTIONS: TradeOption[] = [
  'Carpenter',
  'Plumber',
  'Scaffolder',
  'Electrician',
  'Waterproofer',
  'Renderer',
];
