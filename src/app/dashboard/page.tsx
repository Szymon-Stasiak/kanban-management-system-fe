'use client';
import React, {useEffect, useState, useMemo} from 'react';
import {useRouter, useSearchParams, usePathname} from 'next/navigation';
import {logout, authRequest} from '@/lib/auth';
import SharedLayout from '@/components/layouts/SharedLayout';
import {CustomTable} from '@/components/CustomTable';
import {Button} from "@/components/ui/button";
import {Plus} from 'lucide-react';
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Checkbox} from "@/components/ui/checkbox"
import SearchBar from '@/components/layouts/SearchBar'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"


interface Project {
    id: string;
    name: string;
    description: string;
    color: string;
    archived: boolean;
    createdAt?: string;
}

export default function TaskPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const showArchived = searchParams.get('archived') === 'true';
    const query = (searchParams.get('q') ?? '').trim();
    
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
        // Ensure we set default params in a single update to avoid race conditions
        const needsArchived = !searchParams.has('archived');
        const needsSort = !searchParams.has('sort');

        if (needsArchived || needsSort) {
            const params = new URLSearchParams(searchParams.toString());
            if (!params.has('archived')) params.set('archived', 'false');
            if (!params.has('sort')) params.set('sort', 'date');
            // Use replace so the history isn't polluted when setting defaults
            router.replace(`${pathname}?${params.toString()}`);
        }

    }, [searchParams, pathname, router]);

    useEffect(() => {
        console.log('URL params:', searchParams.toString());
    }, [searchParams]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await authRequest<Project[]>({method: 'get', url: '/projects/getall'});
                const items = Array.isArray(data) ? data.map((p: any) => ({
                    id: p.public_project_id,
                    name: p.name,
                    description: p.description,
                    color: p.color || p.hex || '#000000',
                    archived: !!p.archived_at,
                    createdAt: p.created_at ?? p.createdAt ?? p.created,
                })) : [];
                setProjects(items);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch projects');
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);


    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await authRequest<any>({
                method: 'post',
                url: '/projects/add',
                data: {
                    name: formData.name,
                    description: formData.description,
                    color: formData.color,
                    archived: false,
                },
            });

            const newProject: Project = {
                id: response.public_project_id ?? response.id,
                name: response.name,
                description: response.description,
                color: response.color || response.hex || '#000000',
                archived: false
            };

            setProjects(prev => [...prev, newProject]);

            setFormData({
                name: 'Project Name',
                description: 'Project Description',
                color: '#000000',
            });
            setIsDialogOpen(false);
        } catch (err) {
            console.error('Failed to create project:', err);
            alert('Failed to create project');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const sort = searchParams.get('sort') ?? 'date';

    const filteredProjects = useMemo(() => {
        console.log('Filtering projects. showArchived:', showArchived, 'Total:', projects.length, 'Sort:', sort, 'searchParams:', searchParams.toString(), 'Query:', query);
        let base = showArchived ? projects : projects.filter(p => !p.archived);

        // text search filter
        if (query) {
            const lower = query.toLowerCase();
            base = base.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                (p.description || '').toLowerCase().includes(lower)
            );
        }

        // sort by selected criterion
        const sorted = [...base];
        if (query && (sort === 'search' || !sort || sort === 'date')) {
            // When searching, prioritize: 1) starts with query, 2) name contains query, 3) description contains query
            const lower = query.toLowerCase();
            sorted.sort((a, b) => {
                const aNameLower = a.name.toLowerCase();
                const bNameLower = b.name.toLowerCase();
                
                const aStartsWith = aNameLower.startsWith(lower);
                const bStartsWith = bNameLower.startsWith(lower);
                const aNameMatch = aNameLower.includes(lower);
                const bNameMatch = bNameLower.includes(lower);
                
                // 1. Projects starting with query come first
                if (aStartsWith && !bStartsWith) return -1;
                if (!aStartsWith && bStartsWith) return 1;
                
                // 2. Name matches come before description matches
                if (aNameMatch && !bNameMatch) return -1;
                if (!aNameMatch && bNameMatch) return 1;
                
                // 3. If same priority, sort alphabetically by name
                return a.name.localeCompare(b.name);
            });
        } else if (sort === 'name') {
            sorted.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sort === 'date') {
            // newest first
            sorted.sort((a, b) => {
                const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return db - da;
            });
        }

        return sorted;
    }, [projects, showArchived, searchParams, sort, query]);

    return (
        <SharedLayout>
            <div className="max-w-3xl mx-auto mt-16">
                <div className="bg-white p-8 rounded-2xl shadow-md">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold">Projects Dashboard</h2>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="flex items-center gap-2 bg-[#9333ea] text-white">
                                    <Plus className="w-4 h-4"/>
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
                                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                                            {isSubmitting ? 'Creating...' : 'Create Project'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <div className="w-[260px]">
                            <SearchBar value={query} onChange={(val) => {
                                const params = new URLSearchParams(searchParams.toString());
                                if (val) {
                                    params.set('q', val);
                                    params.set('sort', 'search');
                                } else {
                                    params.delete('q');
                                    if (!params.has('sort') || params.get('sort') === 'search') {
                                        params.set('sort', 'date');
                                    }
                                }
                                if (!params.has('archived')) params.set('archived', 'false');
                                router.push(`${pathname}?${params.toString()}`);
                            }} />
                        </div>
                        <Select value={sort} onValueChange={(value) => {
                            const params = new URLSearchParams(searchParams.toString());
                            params.set('sort', value);
                            // keep archived exactly as selected (so it defaults to false if not set)
                            if (!params.has('archived')) params.set('archived', 'false');
                            router.push(`${pathname}?${params.toString()}`);
                        }}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Order by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                            <SelectItem value="date">Creation date</SelectItem>
                            <SelectItem value="name">Name</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                        </Select>
                        <div className="flex items-center gap-3">
                            <Checkbox 
                                id="terms" 
                                checked={showArchived}
                                onCheckedChange={(checked) => {
                                    const params = new URLSearchParams(searchParams.toString());
                                    params.set('archived', checked ? 'true' : 'false');
                                    if (!params.has('sort')) params.set('sort', 'date');
                                    router.push(`${pathname}?${params.toString()}`);
                                }}
                            />
                            <Label htmlFor="terms" className="cursor-pointer">Show archived projects</Label>
                        </div>
                    </div>
                    <p className="text-slate-600 mb-6">Welcome to your projects overview</p>

                    {loading ? (
                        <p>Loading projects...</p>
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : projects.length === 0 ? (
                        <p className="text-slate-600 text-center py-8">You currently do not have any projects</p>
                    ) : filteredProjects.length === 0 ? (
                        <p className="text-slate-600 text-center py-8">No projects to display</p>
                    ) : (
                        <div className="max-h-[60vh] overflow-y-auto">
                            <CustomTable
                                data={filteredProjects}
                                columnHeaders={["Id", 'Name', 'Description', 'Color']}
                                path="/project"
                            />
                        </div>
                    )}
                </div>
            </div>
        </SharedLayout>
    );
}
