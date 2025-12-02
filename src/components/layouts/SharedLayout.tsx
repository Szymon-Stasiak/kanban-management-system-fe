'use client';
import React from 'react';
import Navbar from "@/components/layouts/Navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex p-6 h-screen" >
            <Navbar />
            <main className="flex-1 p-6">
                {children}
            </main>
        </div>
    );
}
