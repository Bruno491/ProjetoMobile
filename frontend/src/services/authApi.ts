import { apiRequest } from './apiClient';

export type UserProfile = {
  id: number;
  family_id: number;
  family_name: string;
  name: string;
  email: string;
  role: 'owner' | 'member';
};

export type AuthSession = {
  access_token: string;
  token_type: 'bearer';
  user: UserProfile;
};

export type FamilyMember = {
  id: number;
  name: string;
  email: string;
  role: 'owner' | 'member';
};

function isUserProfile(value: unknown): value is UserProfile {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const user = value as Record<string, unknown>;
  return (
    typeof user.id === 'number' &&
    typeof user.family_id === 'number' &&
    typeof user.family_name === 'string' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    (user.role === 'owner' || user.role === 'member')
  );
}

function isSession(value: unknown): value is AuthSession {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const session = value as Record<string, unknown>;
  return (
    typeof session.access_token === 'string' &&
    session.token_type === 'bearer' &&
    isUserProfile(session.user)
  );
}

function parseSession(value: unknown): AuthSession {
  if (!isSession(value)) {
    throw new Error('O serviço retornou dados de acesso inválidos.');
  }
  return value;
}

export async function login(email: string, password: string) {
  return parseSession(
    await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  );
}

export async function registerFamily(data: {
  family_name: string;
  name: string;
  email: string;
  password: string;
}) {
  return parseSession(
    await apiRequest('/api/auth/register-family', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  );
}

export async function joinFamily(data: {
  name: string;
  email: string;
  password: string;
  invite_code: string;
}) {
  return parseSession(
    await apiRequest('/api/auth/join-family', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  );
}

export async function fetchCurrentUser(): Promise<UserProfile> {
  const user: unknown = await apiRequest('/api/auth/me');
  if (!isUserProfile(user)) {
    throw new Error('O serviço retornou dados de perfil inválidos.');
  }
  return user;
}

export async function fetchFamilyMembers(): Promise<FamilyMember[]> {
  const members: unknown = await apiRequest('/api/family/members');
  if (
    !Array.isArray(members) ||
    !members.every(
      (member) =>
        typeof member === 'object' &&
        member !== null &&
        typeof member.id === 'number' &&
        typeof member.name === 'string' &&
        typeof member.email === 'string' &&
        (member.role === 'owner' || member.role === 'member'),
    )
  ) {
    throw new Error('O serviço retornou uma lista de membros inválida.');
  }
  return members;
}

export async function createFamilyInvitation(): Promise<string> {
  const result: unknown = await apiRequest('/api/family/invitations', {
    method: 'POST',
  });
  if (
    typeof result !== 'object' ||
    result === null ||
    !('code' in result) ||
    typeof result.code !== 'string'
  ) {
    throw new Error('O serviço retornou um convite inválido.');
  }
  return result.code;
}
