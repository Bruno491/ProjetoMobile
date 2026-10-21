import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  fetchCurrentUser,
  joinFamily as joinFamilyRequest,
  login as loginRequest,
  registerFamily as registerFamilyRequest,
  type UserProfile,
} from '../services/authApi';
import { ApiError, setAccessToken } from '../services/apiClient';

const SESSION_KEY = 'projetomobile.session';

type StoredSession = {
  accessToken: string;
  user: UserProfile;
};

type AuthContextValue = {
  user: UserProfile | null;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerFamily: (data: {
    family_name: string;
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  joinFamily: (data: {
    name: string;
    email: string;
    password: string;
    invite_code: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isStoredSession(value: unknown): value is StoredSession {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const session = value as Record<string, unknown>;
  const user = session.user;
  return (
    typeof session.accessToken === 'string' &&
    typeof user === 'object' &&
    user !== null &&
    'id' in user &&
    typeof user.id === 'number' &&
    'family_id' in user &&
    typeof user.family_id === 'number' &&
    'family_name' in user &&
    typeof user.family_name === 'string' &&
    'name' in user &&
    typeof user.name === 'string' &&
    'email' in user &&
    typeof user.email === 'string' &&
    'role' in user &&
    (user.role === 'owner' || user.role === 'member')
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      try {
        const storedValue = await SecureStore.getItemAsync(SESSION_KEY);
        if (!storedValue) {
          return;
        }

        const parsed: unknown = JSON.parse(storedValue);
        if (!isStoredSession(parsed)) {
          await SecureStore.deleteItemAsync(SESSION_KEY);
          return;
        }

        setAccessToken(parsed.accessToken);
        if (active) {
          setUser(parsed.user);
        }

        try {
          const currentUser = await fetchCurrentUser();
          if (active) {
            setUser(currentUser);
            await SecureStore.setItemAsync(
              SESSION_KEY,
              JSON.stringify({ accessToken: parsed.accessToken, user: currentUser }),
            );
          }
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            setAccessToken(null);
            setUser(null);
            await SecureStore.deleteItemAsync(SESSION_KEY);
          }
        }
      } catch (error) {
        if (error instanceof SyntaxError) {
          await SecureStore.deleteItemAsync(SESSION_KEY);
        } else {
          setAccessToken(null);
        }
      } finally {
        if (active) {
          setIsInitializing(false);
        }
      }
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const saveSession = useCallback(async (session: {
    access_token: string;
    user: UserProfile;
  }) => {
    await SecureStore.setItemAsync(
      SESSION_KEY,
      JSON.stringify({ accessToken: session.access_token, user: session.user }),
    );
    setAccessToken(session.access_token);
    setUser(session.user);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      await saveSession(await loginRequest(email, password));
    },
    [saveSession],
  );

  const registerFamily = useCallback(
    async (data: {
      family_name: string;
      name: string;
      email: string;
      password: string;
    }) => {
      await saveSession(await registerFamilyRequest(data));
    },
    [saveSession],
  );

  const joinFamily = useCallback(
    async (data: {
      name: string;
      email: string;
      password: string;
      invite_code: string;
    }) => {
      await saveSession(await joinFamilyRequest(data));
    },
    [saveSession],
  );

  const logout = useCallback(async () => {
    setAccessToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(SESSION_KEY);
  }, []);

  const value = useMemo(
    () => ({ user, isInitializing, login, registerFamily, joinFamily, logout }),
    [user, isInitializing, login, registerFamily, joinFamily, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }
  return context;
}
