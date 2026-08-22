import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export const Register = ({ onSwitchToLogin }: { onSwitchToLogin?: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="card-surface w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Account Banao</h1>
          <p className="text-xs text-muted-foreground">Apni details daal kar register karo</p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-4 text-center">
            <div className="rounded-md bg-emerald-500/15 p-3 text-xs text-emerald-600 dark:text-emerald-400">
              Registration successful! Apni email check karo confirmation link ke liye.
            </div>
            {onSwitchToLogin && (
              <button onClick={onSwitchToLogin} className="button-primary w-full justify-center">
                Login Page Par Jao
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium">Full Name</label>
              <input
                type="text"
                placeholder="Don"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium">Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="button-primary w-full justify-center"
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>
        )}

        {onSwitchToLogin && !success && (
          <div className="text-center text-xs text-muted-foreground">
            Pehle se account hai?{' '}
            <button onClick={onSwitchToLogin} className="font-semibold text-primary hover:underline">
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
                
