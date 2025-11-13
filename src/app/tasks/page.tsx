'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';
import SharedLayout from '@/components/layouts/SharedLayout';

export default function DashboardPage() {
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <SharedLayout>
            <div className="max-w-3xl mx-auto mt-16">
                <div className="bg-white p-8 rounded-2xl shadow-md">
                    <h2 className="text-2xl font-semibold mb-2">Tasks</h2>
                    <p className="text-slate-600 mb-6">Welcome</p>

                    <p className="text-sm text-slate-500">
                        This is a placeholder for the Tasks page. More features coming soon!
                    </p>

                    <div className="mt-6">
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 rounded bg-slate-100"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </div>
        </SharedLayout>
    );
}
