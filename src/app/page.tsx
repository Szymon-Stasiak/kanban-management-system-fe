'use client';
import React, {useState} from 'react';
import AuthForm from '@/components/AuthForm';
import Logo from '@/components/Logo';

export default function Page() {
    return (
        <main className="max-w-lg mx-auto mt-16">
            <div className="flex items-center gap-4 mb-8">
                <Logo/>
                <h1 className="text-2xl font-semibold">Demo Panel — Login</h1>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md">
                <AuthForm/>
            </div>

            <p className="text-sm text-slate-500 mt-6">Demo: accounts are saved in <code>localStorage</code>.</p>
        </main>
    );
}