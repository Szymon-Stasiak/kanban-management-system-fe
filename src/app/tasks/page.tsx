'use client';
import React, { useEffect, useState } from 'react';
import SharedLayout from '@/components/layouts/SharedLayout';
import { CustomTable } from '@/components/CustomTable';
import { authRequest } from '@/lib/auth';

interface Task {
    id: string;
    name: string;
    priority: string;
    completed: boolean;
    createdAt?: string;
}

export default function DashboardPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch all tasks on mount
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const data = await authRequest<any[]>({ method: 'get', url: '/tasks/getall' });
                const items = Array.isArray(data) ? data.map((t: any) => ({
                    id: t.public_task_id || t.id,
                    name: t.name || t.title,
                    priority: t.priority || 'N/A',
                    completed: !!t.completed || !!t.is_completed,
                    createdAt: t.created_at ?? t.createdAt ?? t.created,
                })) : [];
                setTasks(items);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch tasks');
                setLoading(false);
            }
        };

        fetchTasks();
    }, []);

    return (
        <SharedLayout>
            <div className="max-w-3xl mx-auto mt-16">
                <div className="bg-white p-8 rounded-2xl shadow-md">
                    <h2 className="text-2xl font-semibold mb-2">Tasks</h2>
                    <p className="text-slate-600 mb-6">View all your tasks</p>

                    {loading ? (
                        <p>Loading tasks...</p>
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : tasks.length === 0 ? (
                        <p className="text-slate-600 text-center py-8">You currently do not have any tasks</p>
                    ) : (
                        <div className="max-h-[60vh] overflow-y-auto">
                            <CustomTable
                                data={tasks.map(t => {
                                    let formattedDate = '';
                                    if (t.createdAt) {
                                        const date = new Date(t.createdAt);
                                        formattedDate = date.toLocaleString('sv-SE', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        });
                                    }
                                    return {
                                        name: t.name,
                                        priority: t.priority,
                                        completed: t.completed ? 'Yes' : 'No',
                                        createdAt: formattedDate
                                    };
                                })}
                                columnHeaders={['Name', 'Priority', 'Completed', 'Created at']}
                                path="/tasks"
                            />
                        </div>
                    )}
                </div>
            </div>
        </SharedLayout>
    );
}
