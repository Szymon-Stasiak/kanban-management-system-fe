'use client';
import React, {useEffect, useState, useMemo, Suspense} from 'react';
import {useRouter, useSearchParams, usePathname} from 'next/navigation';
import {authRequest} from '@/lib/auth';
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

function DashboardClient() {
    'use client';
    // Router and URL state
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const showArchived = searchParams.get('archived') === 'true';
    const query = (searchParams.get('q') ?? '').trim();
    const sort = searchParams.get('sort') ?? 'date';
    
    // Component state
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


    // Set default URL parameters on mount
    useEffect(() => {
        // Ensure we set default params in a single update to avoid race conditions
        const needsArchived = !searchParams.has('archived');
        const needsSort = !searchParams.has('sort');

        if (needsArchived || needsSort) {
            const params = new URLSearchParams(searchParams.toString());
            if (!params.has('archived')) params.set('archived', 'false');
            if (!params.has('sort')) params.set('sort', 'date');
            router.replace(`${pathname}?${params.toString()}`);
        }

    }, [searchParams, pathname, router]);

    // Fetch all projects on mount
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


    // Filter and sort projects based on URL params
    const filteredProjects = useMemo(() => {
        // Filter by archived status
        let base = showArchived ? projects : projects.filter(p => !p.archived);

        // text search filter
        if (query) {
            const lower = query.toLowerCase();
            base = base.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                (p.description || '').toLowerCase().includes(lower)
            );
        }

        // Apply sorting
        const sorted = [...base];
        if (query && (sort === 'search' || !sort || sort === 'date')) {
            // Relevance sorting: prioritize matches at start of name, then name matches, then description matches
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
            <div className="max-w-4xl mx-auto mt-16">
                <div className="bg-white p-8 rounded-2xl shadow-md">
                    <div className="relative flex items-center mb-6">
                        <div className="w-full flex flex-col items-center">
                            <h2 className="text-2xl text-center font-semibold">Projects Dashboard</h2>
                            <p className="text-slate-600">Welcome to your projects overview</p>
                        </div>
                        <div className='absolute right-1 top-0'>
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="items-center gap-2 bg-[#9333ea] text-white">
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
                    </div>
                    <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex-1 max-w-md">
                            {/* Search input with automatic sort to 'search' mode */}
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
                                router.replace(`${pathname}?${params.toString()}`);
                            }} />
                        </div>
                        <div className="flex items-center gap-5 border-l border-slate-300 pl-4 pt-2">
                            <div className="relative">
                                <Label className="absolute -top-4 left-2 text-xs font-medium text-slate-600">Sort by</Label>
                                {/* Sort selector for date/name ordering */}
                                <Select value={sort} onValueChange={(value) => {
                                    const params = new URLSearchParams(searchParams.toString());
                                    params.set('sort', value);
                                    // keep archived exactly as selected (so it defaults to false if not set)
                                    if (!params.has('archived')) params.set('archived', 'false');
                                    router.replace(`${pathname}?${params.toString()}`);
                                }}>
                                <SelectTrigger className="w-[180px] bg-white">
                                    <SelectValue placeholder="Order by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                    <SelectItem value="date">Creation date</SelectItem>
                                    <SelectItem value="name">Name</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2 pl-4 border-l border-slate-300">
                                <Checkbox 
                                    id="terms" 
                                    checked={showArchived}
                                    onCheckedChange={(checked) => {
                                        const params = new URLSearchParams(searchParams.toString());
                                        params.set('archived', checked ? 'true' : 'false');
                                        if (!params.has('sort')) params.set('sort', 'date');
                                        router.replace(`${pathname}?${params.toString()}`);
                                    }}
                                />
                                <Label htmlFor="terms" className="cursor-pointer text-sm whitespace-nowrap leading-none">Show archived</Label>
                            </div>
                        </div>
                    </div>

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
                            {/* Format project data for table display */}
                            <CustomTable
                                data={filteredProjects.map(p => {
                                    let formattedDate = '';
                                    if (p.createdAt) {
                                        const date = new Date(p.createdAt);
                                        // Format the creation date as YYYY-MM-DD HH:MM
                                        formattedDate = date.toLocaleString('sv-SE', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        });
                                    }
                                    return {
                                        id: p.id,
                                        name: p.name,
                                        description: p.description,
                                        color: p.color,
                                        createdAt: formattedDate
                                    };
                                })}
                                columnHeaders={["Id", 'Name', 'Description', 'Color', 'Created at']}
                                path="/project"
                            />
                        </div>
                    )}
                </div>
            </div>
        </SharedLayout>
    );
}


export default function DashboardPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DashboardClient />
        </Suspense>
    );
}
