import { getJson, postJsonAuthed } from '../api/client';
import type { TradieJobBoardItem } from '../types';

export function getPostedJobsForTradie(token: string) {
  return getJson<{ ok: true; jobs: TradieJobBoardItem[] }>('/jobs', token);
}

export function enquireOnJob(token: string, jobId: number) {
  return postJsonAuthed<{ ok: true }>(`/jobs/${jobId}/enquire`, {}, token);
}
