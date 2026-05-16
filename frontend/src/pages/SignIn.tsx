import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export function SignIn() {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const completeLogin = async (session: Session) => {
    const user = session.user;
    if (!user) {
      return;
    }
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user_id', user.id);
    if (user.email) {
      localStorage.setItem('user_email', user.email);
    }
    const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Vendor';
    const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
    localStorage.setItem('user_name', displayName);
    if (googleAvatarUrl) {
      localStorage.setItem('avatar_url', googleAvatarUrl);
    } else {
      localStorage.removeItem('avatar_url');
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}`);
      if (response.ok) {
        const profile = await response.json();
        if (profile?.name) {
          localStorage.setItem('user_name', profile.name);
        }
        if (profile?.vendor_name) {
          localStorage.setItem('vendor_name', profile.vendor_name);
        }
        if (profile?.location) {
          localStorage.setItem('vendor_location', profile.location);
        }
        if (!googleAvatarUrl && profile?.avatar_url) {
          localStorage.setItem('avatar_url', profile.avatar_url);
        }
        navigate('/dashboard');
        return;
      }
      if (response.status === 404) {
        navigate('/signup');
        return;
      }
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || 'Unable to load profile.');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to load profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session && isMounted) {
        await completeLogin(data.session);
      }
    };

    syncSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }
      if (session) {
        void completeLogin(session);
        return;
      }
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_name');
      localStorage.removeItem('vendor_name');
      localStorage.removeItem('vendor_location');
      localStorage.removeItem('avatar_url');
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthNotice('');
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/signin`,
      },
    });

    if (error) {
      setAuthError(error.message);
      setIsLoading(false);
    }
  };

  const handlePasswordSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');
    setAuthNotice('');
    if (!email.trim() || !password.trim()) {
      setAuthError('Enter your email and password.');
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      setAuthError(error.message);
      setIsLoading(false);
      return;
    }

    if (data.session) {
      await completeLogin(data.session);
    }
  };

  const handleMagicLink = async () => {
    setAuthError('');
    setAuthNotice('');
    if (!email.trim()) {
      setAuthError('Enter your email first.');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/signin`,
      },
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setAuthNotice('Magic link sent. Check your email to continue.');
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto my-auto flex flex-col justify-center">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-16">
        <div className="w-6 h-6 bg-[#A04A25] rounded-[4px] rotate-12 flex items-center justify-center text-white">
          <BookOpen className="w-3.5 h-3.5 -rotate-12" />
        </div>
        <span className="text-[#8B3A1C] font-semibold text-xl tracking-tight">Artisan Ledger</span>
        <div className="ml-auto text-xs font-semibold tracking-widest text-stone-400 uppercase flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          SECURE LOGIN
        </div>
      </div>

      <h1 className="text-4xl font-medium text-stone-900 mb-4 tracking-tight">Welcome back</h1>
      <p className="text-stone-600 mb-10 leading-relaxed">
        Enter your details to access your vendor workspace and manage your ledger.
      </p>

      <form className="space-y-4" onSubmit={handlePasswordSignIn}>
        <div className="space-y-2">
          <label className="text-xs font-bold tracking-widest uppercase text-stone-500">EMAIL</label>
          <input
            type="email"
            placeholder="vendor@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full border border-stone-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold tracking-widest uppercase text-stone-500">PASSWORD</label>
          <input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full border border-stone-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#A04A25] focus:border-[#A04A25] bg-stone-50/50"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#A04A25] hover:bg-[#8B3A1C] text-white py-3.5 rounded-sm font-semibold tracking-wider text-sm transition-colors shadow-sm flex justify-center items-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
        </button>
      </form>

      <button
        onClick={handleMagicLink}
        disabled={isLoading}
        className="w-full border border-stone-200 text-stone-700 hover:text-stone-900 hover:border-stone-300 py-3 rounded-sm font-semibold tracking-wider text-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        SEND MAGIC LINK
      </button>

      <div className="space-y-4">
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full bg-[#A04A25] hover:bg-[#8B3A1C] text-white py-3.5 rounded-sm font-semibold tracking-wider text-sm transition-colors shadow-sm flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? 'CONNECTING...' : 'CONTINUE WITH GOOGLE'}
        </button>
      </div>

      {authError && (
        <p className="text-xs font-medium text-red-600" role="alert">
          {authError}
        </p>
      )}
      {authNotice && (
        <p className="text-xs font-medium text-green-700" role="status">
          {authNotice}
        </p>
      )}

      <div className="mt-auto pt-16 pb-8 text-center text-sm text-stone-500">
        Don't have a workspace yet? <Link to="/signup" className="text-[#A04A25] font-semibold hover:text-[#8B3A1C] uppercase tracking-wider ml-1">SIGN UP</Link>
      </div>
    </div>
  );
}
