import type { Role } from '../types';

export function validateLoginInput(email: string, password: string): string | null {
  if (!email.trim() || !password) return 'Email and password are required.';
  return null;
}

export function validateSignupInput(input: {
  email: string;
  password: string;
  selectedRole: Role;
  companyName: string;
  firstName: string;
  lastName: string;
  about: string;
}): string | null {
  if (!input.email.trim() || !input.password) return 'Email and password are required.';
  if (input.password.length < 6) return 'Password must be at least 6 characters.';
  if (!input.firstName.trim() || !input.lastName.trim() || !input.about.trim()) {
    return 'First name, last name, and about are required.';
  }
  if (input.selectedRole === 'Builder' && !input.companyName.trim()) {
    return 'Company name is required for builders.';
  }
  return null;
}

export function validateProfileInput(input: {
  firstName: string;
  lastName: string;
  about: string;
  email: string;
}): string | null {
  if (!input.firstName.trim() || !input.lastName.trim() || !input.about.trim() || !input.email.trim()) {
    return 'First name, last name, about, and email are required.';
  }
  return null;
}
