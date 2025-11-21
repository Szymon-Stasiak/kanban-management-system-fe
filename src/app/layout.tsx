'use client';
import React from 'react';
import './globals.css';
import BackgroundGradient from "@/components/background/BackgroundGradient";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pl">
        <body className="min-h-screen bg-surface-50 text-slate-900">
        <BackgroundGradient />
        <div className="container mx-auto">{children}</div>
        </body>
        </html>
    );
}