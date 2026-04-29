import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // ── Check session on mount ─────────────────────────────────────────────────
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // sends the httpOnly cookie automatically
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ── Register ───────────────────────────────────────────────────────────────
  const register = async ({ name, email, password }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    setUser(data.user);
    // Redirect to onboarding after successful registration
    router.push('/onboarding');
    return data;
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async ({ email, password }) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    setUser(data.user);

    // If onboarding not done, route there first
    if (!data.user.onboardingComplete) {
      router.push('/onboarding');
    } else {
      router.push('/dashboard');
    }

    return data;
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      // Clear ALL cookies via our API (auth_token + next-auth session cookies)
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setUser(null);
      // Hard redirect — bypasses Next.js router so middleware can't intercept
      window.location.href = '/auth/login';
    }
  };

  // ── Complete Onboarding ────────────────────────────────────────────────────
  const completeOnboarding = async (onboardingData) => {
    const res = await fetch('/api/auth/onboarding', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(onboardingData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to save onboarding data');
    }

    setUser(data.user);
    router.push('/dashboard');
    return data;
  };

  const value = {
    user,
    isLoading,
    isLoggedIn: !!user,
    register,
    login,
    logout,
    completeOnboarding,
    refreshUser: checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
