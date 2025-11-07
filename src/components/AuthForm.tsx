'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAccount, login as loginFn } from '@/lib/auth';
import { motion } from 'framer-motion';

export default function AuthForm() {
    const router = useRouter();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (mode === 'signup') {
                if (!email || !username || !password) {
                    setError('Please fill in all fields.');
                    return;
                }

                const res = await createAccount({ email, username, password });
                if (!res.ok) {
                    setError(res.message ?? 'An unknown error occurred.');
                    return;
                }

                setUsername('');
                setPassword('');
                setEmail('');
                setMode('login');
                setError('Account created successfully. Please log in.');
            } else {
                if (!username || !password) {
                    setError('Please provide a username and password.');
                    return;
                }

                const res = await loginFn({ username, password });
                if (!res.ok) {
                    setError(res.message || 'Invalid username or password.');
                    return;
                }

                // On success, redirect to dashboard
                router.push('/dashboard');
            }
        } catch (err) {
            console.error(err);
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Mode switch */}
            <div className="flex gap-2 mb-6">
                <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`px-4 py-2 rounded-lg transition-all ${
                        mode === 'login'
                            ? 'bg-slate-800 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                >
                    Log In
                </button>
                <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className={`px-4 py-2 rounded-lg transition-all ${
                        mode === 'signup'
                            ? 'bg-slate-800 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                >
                    Sign Up
                </button>
            </div>

            {/* Form */}
            <motion.form
                onSubmit={submit}
                className="space-y-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {mode === 'signup' && (
                    <div>
                        <label className="block text-sm text-slate-700 mb-1">Email</label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                            placeholder="email@example.com"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm text-slate-700 mb-1">Username</label>
                    <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        type="text"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        placeholder="your username"
                    />
                </div>

                <div>
                    <label className="block text-sm text-slate-700 mb-1">Password</label>
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        placeholder="password"
                    />
                </div>

                {error && (
                    <div role="alert" className="text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 rounded-md bg-slate-800 text-white disabled:opacity-60"
                    >
                        {mode === 'signup'
                            ? loading
                                ? 'Creating...'
                                : 'Create Account'
                            : loading
                                ? 'Logging in...'
                                : 'Log In'}
                    </button>
                </div>
            </motion.form>
        </div>
    );
}
