'use client';


import React from 'react';
import AuthForm from './AuthForm';
import Logo from './Logo';
import { motion } from 'framer-motion';


export default function AuthCard() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="bg-white/95 backdrop-blur-sm border border-slate-100 rounded-3xl shadow-lg p-8"
        >
            <header className="flex items-center gap-4 mb-6">
                <Logo />
                <div>
                    <h1 className="text-2xl font-semibold">Demo Panel — Login</h1>
                    <p className="text-sm text-slate-500">Przetestuj konto demo — dane przechowywane lokalnie</p>
                </div>
            </header>


            <AuthForm />


            <footer className="mt-6 text-center text-sm text-slate-400">By continuing you accept the demo policy (local only).</footer>
        </motion.div>
    );
}