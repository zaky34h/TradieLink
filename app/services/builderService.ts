import { getJson, postJsonAuthed } from '../api/client';
import type { BuilderDashboardStats, BuilderJob, TradieDirectoryItem } from '../types';

export function getBuilderStats(token: string) {
  return getJson<{ ok: true; stats: BuilderDashboardStats }>('/me/stats', token);
}

export function getBuilderJobs(token: string) {
  return getJson<{ ok: true; jobs: BuilderJob[] }>('/builder/jobs', token);
}

export function createBuilderJob(
  token: string,
  body: {
    title: string;
    location: string;
    tradesNeeded: string[];
    details: string;
    status: 'posted' | 'inProgress' | 'done';
  },
) {
  return postJsonAuthed<{ ok: true; job: BuilderJob }>('/builder/jobs', body, token);
}

export function getTradies(token: string) {
  return getJson<{ ok: true; tradies: TradieDirectoryItem[] }>('/tradies', token);
}
