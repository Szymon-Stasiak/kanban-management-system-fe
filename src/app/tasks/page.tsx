'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';
import { api } from '@/lib/api';
import SharedLayout from '@/components/layouts/SharedLayout';
import { ProjectItem } from '@/components/ProjectItem';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
}

export default function TaskPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await api.get('/projects/getall');
                // Map backend fields to the frontend Project shape. Backend may return
                // created_at or createdAt depending on serialization. Be defensive.
                const items = Array.isArray(response.data) ? response.data.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    color: p.color || p.hex || '#000000',
                    createdAt: p.createdAt || p.created_at || new Date().toISOString(),
                })) : [];
                setProjects(items);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch projects');
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <SharedLayout>
            <div className="max-w-3xl mx-auto mt-16">
                <div className="bg-white p-8 rounded-2xl shadow-md">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-2xl font-semibold">Projects</h2>
                        <Button
                            className="flex items-center gap-2 bg-[#9333ea] text-white"
                        >
                            <Plus className="w-4 h-4" />
                            Add Project
                        </Button>
                    </div>
                    <p className="text-slate-600 mb-6">Welcome to your projects overview</p>

                    {loading ? (
                        <p>Loading projects...</p>
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : projects.length === 0 ? (
                        <p className="text-slate-600 text-center py-8">You currently do not have any projects</p>
                    ) : (
                        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                            <div className="grid gap-4">
                                {projects.map((project) => (
                                    <ProjectItem
                                        key={project.id}
                                        name={project.name}
                                        description={project.description}
                                        color={project.color}
                                        createdAt={project.createdAt}
                                    />
                                ))}
                            </div>
                        </ScrollArea>
                    )}

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