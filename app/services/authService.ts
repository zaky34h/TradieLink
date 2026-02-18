import { postJson, putJsonAuthed } from '../api/client';
import type { AuthUser } from '../types';

export type AuthPayload = {
  ok: true;
  token: string;
  user: AuthUser;
};

export function login(email: string, password: string) {
  return postJson<AuthPayload>('/auth/login', { email: email.trim(), password });
}

export function signup(body: {
  role: string;
  firstName: string;
  lastName: string;
  about: string;
  companyName: string;
  address: string;
  occupation: string;
  pricePerHour: string;
  experienceYears: string;
  certifications: string;
  photoUrl: string;
  email: string;
  password: string;
}) {
  return postJson<AuthPayload>('/auth/register', body);
}

export function updateProfile(token: string, body: Record<string, unknown>) {
  return putJsonAuthed<AuthPayload>('/me', body, token);
}
