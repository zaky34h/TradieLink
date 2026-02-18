import { getJson, postJsonAuthed } from '../api/client';
import type { BuilderDirectoryItem, ChatTypingStatus, MessageThread, ThreadMessage } from '../types';

export function getThreads(token: string, view: 'active' | 'history') {
  return getJson<{ ok: true; threads: MessageThread[] }>(`/messages/threads?view=${view}`, token);
}

export function getThreadMessages(token: string, threadId: number) {
  return getJson<{ ok: true; messages: ThreadMessage[] }>(`/messages/threads/${threadId}`, token);
}

export function sendThreadMessage(token: string, threadId: number, body: string) {
  return postJsonAuthed(`/messages/threads/${threadId}/messages`, { body }, token);
}

export function markThreadRead(token: string, threadId: number) {
  return postJsonAuthed<{ ok: true }>('/messages/read', { threadId }, token);
}

export function closeThread(token: string, threadId: number) {
  return postJsonAuthed<{ ok: true }>(`/messages/threads/${threadId}/close`, {}, token);
}

export function setTypingStatus(token: string, threadId: number, isTyping: boolean) {
  return postJsonAuthed<{ ok: true }>('/messages/typing', { threadId, isTyping }, token);
}

export function getTypingStatus(token: string, threadId: number) {
  return getJson<{ ok: true } & ChatTypingStatus>(`/messages/typing/${threadId}`, token);
}

export function startThreadAsTradie(token: string, builderId: number) {
  return postJsonAuthed<{ ok: true; thread: { id: number } }>('/messages/threads', { builderId }, token);
}

export function startThreadAsBuilder(token: string, tradieId: number) {
  return postJsonAuthed<{ ok: true; thread: { id: number } }>('/messages/threads', { tradieId }, token);
}

export function getBuilders(token: string) {
  return getJson<{ ok: true; builders: BuilderDirectoryItem[] }>('/builders', token);
}
