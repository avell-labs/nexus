export interface AuthUser {
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  department: string | null;
  position: string | null;
  manager: string | null;
}

export interface AuthStatus {
  isConfigured: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  user: AuthUser | null;
  error: string | null;
}
