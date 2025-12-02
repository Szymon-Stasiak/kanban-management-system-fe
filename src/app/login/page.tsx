'use client';
import React from 'react';
import Logo from '@/components/Logo';
import AuthForm from '@/components/AuthForm';


export default function Page() {
    return (
        <main className="min-h-screen flex items-center justify-center px-6">


            <div className="w-full max-w-2xl">
                <div className="mx-auto max-w-lg">
                    <header className="flex items-center gap-4 mb-6">
                        <Logo />
                        <h1 className="text-2xl sm:text-3xl font-semibold">Kanban Table</h1>
                    </header>


                    <section className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-10">
                        <AuthForm />
                    </section>


                    <p className="text-sm text-slate-500 mt-6">
                        Easy implementation of  <code>Kanban Table</code> — Academic Sapienza Project.
                    </p>
                </div>
            </div>
        </main>
    );
}