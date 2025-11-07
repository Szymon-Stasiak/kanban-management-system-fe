'use client';
import React from 'react';
import './globals.css';




export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pl">
        <body className="min-h-screen bg-surface-50 text-slate-900">
        <div className="container mx-auto p-6">{children}</div>
        </body>
        </html>
    );
}