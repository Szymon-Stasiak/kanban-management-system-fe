'use client';
import { useRouter } from 'next/navigation';
import { createAccount, login as loginFn } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { lightBlue } from '@/lib/colors';

export default function AuthForm() {
    const router = useRouter();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);


    const isFormValid = () => {
        if (mode === 'signup') {
            return email && username && password;
        } else {
            return username && password;
        }
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            if (mode === 'signup') {
                const res = await createAccount({ email, username, password });
                if (!res.ok) {
                    setError(res.message ?? 'An unknown error occurred.');
                    setLoading(false);
                    return;
                }
                setUsername('');
                setPassword('');
                setEmail('');
                setMode('login');
                setError('Account created successfully. Please log in.');
            } else {
                const res = await loginFn({ username, password });
                if (!res.ok) {
                    setError(res.message || 'Invalid username or password.');
                    setLoading(false);
                    return;
                }
                router.replace('/dashboard');
            }
        } catch (err) {
            console.error(err);
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const buttons = [
        { label: 'Log In', value: 'login' },
        { label: 'Sign Up', value: 'signup' },
    ];

    return (
            <div className="flex flex-col items-center w-full">
               <div className="flex gap-4 mb-8">
                    {buttons.map((btn) => (
                        <motion.button
                            key={btn.value}
                            type="button"
                            onClick={() => setMode(btn.value as 'login' | 'signup')}
                            className="px-8 py-3 text-lg font-semibold rounded-full border transition-colors"
                            animate={{
                                backgroundColor: mode === btn.value ? lightBlue : '#ffffff',
                            }}
                            whileHover={{
                                backgroundColor: mode === btn.value ? '#f0f0f0' : '#a0d8ff',
                            }}
                        >
                            {btn.label}
                        </motion.button>
                    ))}
                </div>

            <form onSubmit={submit} className="flex flex-col w-full max-w-md gap-6">
                <AnimatePresence mode="wait">
                    {mode === 'signup' && (
                        <motion.div
                            key="email"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex flex-col"
                        >
                            <label className="text-base text-slate-700 mb-2">Email</label>
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                type="email"
                                className="w-full rounded-2xl border border-gray-300 px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
                                placeholder="email@example.com"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex flex-col">
                    <label className="text-base text-slate-700 mb-2">Username</label>
                    <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        type="text"
                        className="w-full rounded-2xl border border-gray-300 px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
                        placeholder="your username"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-base text-slate-700 mb-2">Password</label>
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        className="w-full rounded-2xl border border-gray-300 px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
                        placeholder="password"
                    />
                </div>

                {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-base text-red-600">
                        {error}
                    </motion.div>
                )}

                <motion.button
                    type="submit"
                    disabled={!isFormValid() || loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full rounded-2xl border px-8 py-4 font-semibold text-lg transition-colors ${
                       isFormValid()
                            ? `bg-[${lightBlue}] border-[${lightBlue}] text-black cursor-pointer`
                            : 'bg-white border-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {mode === 'signup' ? (loading ? 'Creating...' : 'Create Account') : loading ? 'Logging in...' : 'Log In'}
                </motion.button>
            </form>
        </div>
    );
}
