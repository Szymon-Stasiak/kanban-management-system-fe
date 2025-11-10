'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';
import { api } from '@/lib/api';
import SharedLayout from '@/components/layouts/SharedLayout';
import { CustomTable } from '@/components/CustomTable';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
    const [formData, setFormData] = useState({
        name: 'Project Name',
        description: 'Project Description',
        color: '#000000',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

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

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        console.log('Creating project with data:', formData);
        try {
            const response = await api.post('/projects/add', {
                name: formData.name,
                description: formData.description,
                color: formData.color,
                archived: false,
            });
            
            console.log('Project created successfully:', response.data);
            
            // Add the new project to the list
            const newProject: Project = {
                id: response.data.id,
                name: response.data.name,
                description: response.data.description,
                color: response.data.color,
                createdAt: response.data.createdAt || new Date().toISOString(),
            };
            setProjects([...projects, newProject]);
            
            // Reset form and close dialog
            setFormData({
                name: 'Project Name',
                description: 'Project Description',
                color: '#000000',
            });
            setIsSubmitting(false);
            setIsDialogOpen(false);
        } catch (err) {
            console.error('Failed to create project:', err);
            alert('Failed to create project');
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    return (
        <SharedLayout>
            <div className="max-w-3xl mx-auto mt-16">
                <div className="bg-white p-8 rounded-2xl shadow-md">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-2xl font-semibold">Projects</h2>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    className="flex items-center gap-2 bg-[#9333ea] text-white"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Project
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <form onSubmit={handleCreateProject}>
                                    <DialogHeader className='flex items-center'>
                                        <DialogTitle>Create new project</DialogTitle>
                                        <DialogDescription>
                                            Specify the project details below to create a new project.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4">
                                        <div className="grid gap-3">
                                            <Label htmlFor="name-1">Name</Label>
                                            <Input 
                                                id="name-1" 
                                                name="name" 
                                                value={formData.name}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="grid gap-3">
                                            <Label htmlFor="description-1">Description</Label>
                                            <textarea 
                                                id="description-1" 
                                                name="description" 
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                className="h-24 rounded-md border border-slate-300 px-3 py-2 text-sm" 
                                                rows={4} 
                                            />
                                        </div>
                                        <div className="grid gap-3">
                                            <Label htmlFor="color-1">Color</Label>
                                            <Input 
                                                id="color-1" 
                                                name="color" 
                                                type="color"
                                                value={formData.color}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter className="flex flex-col sm:flex-col justify-center gap-4">
                                        <Button 
                                            type="submit" 
                                            className="w-full"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? 'Creating...' : 'Create Project'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                                
                            
                        
                    </div>
                    <p className="text-slate-600 mb-6">Welcome to your projects overview</p>

                    {loading ? (
                        <p>Loading projects...</p>
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : projects.length === 0 ? (
                        <p className="text-slate-600 text-center py-8">You currently do not have any projects</p>
                    ) : (
                        <CustomTable
                            data={projects}
                            columnHeaders={['Name', 'Description', 'Color', 'Created At']}
                        />
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