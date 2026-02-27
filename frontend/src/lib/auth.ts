import { api } from './api';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

class AuthService {
  private tokenKey = 'auth_token';
  private userKey = 'user_data';

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  setAuth(token: string, user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    api.defaults.headers.common['Authorization'] = `Token ${token}`;
  }

  clearAuth(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    delete api.defaults.headers.common['Authorization'];
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }): Promise<AuthResponse> {
    const response = await api.post('/auth/register/', userData);
    const authData = response.data;
    this.setAuth(authData.token, authData.user);
    return authData;
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login/', {
      username,
      password,
    });
    const authData = response.data;
    this.setAuth(authData.token, authData.user);
    return authData;
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  async me(): Promise<User> {
    const response = await api.get('/auth/me/');
    return response.data.user;
  }

  initializeAuth(): void {
    const token = this.getToken();
    if (token) {
      api.defaults.headers.common['Authorization'] = `Token ${token}`;
    }
  }
}

export const authService = new AuthService();
