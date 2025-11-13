'use client';
import React, {useEffect, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {authRequest} from '@/lib/auth';
import SharedLayout from '@/components/layouts/SharedLayout';
import ConfirmModal from "@/components/modals/ConfirmModal";

interface Project {
    public_project_id: string;
    owner_id: string;
    name: string;
    description: string;
    color: string;
    status: string;
    created_at: string;
    updated_at: string;
    archived_at: string | null;
}

export default function ProjectPage() {
    const router = useRouter();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<'active' | 'archived'>('active');
    const [saving, setSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const params = useParams();
    const projectId = params.id;

    useEffect(() => {
        if (!projectId) return;

        const fetchProject = async () => {
            try {
                const data = await authRequest<Project>({
                    method: 'get',
                    url: `projects/${projectId}`,
                });
                setProject(data);
                setDescription(data.description);
                setStatus(data.status as 'active' | 'archived');
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Failed to load project');
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [projectId]);

    const handleSave = async () => {
        if (!project) return;
        setSaving(true);
        try {
            const updatedProject = await authRequest<Project>({
                method: 'put',
                url: `projects/update/${project.public_project_id}`,
                data: {
                    name: project.name,
                    color: project.color,
                    description,
                    status,
                },
            });
            setProject(updatedProject);
            setDescription(updatedProject.description);
            setStatus(updatedProject.status as 'active' | 'archived');
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Failed to update project');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!project) return;
        setDeleting(true);
        try {
            await authRequest<Project>({
                method: 'delete',
                url: `/projects/delete/${project.public_project_id}`,
            });
            router.push('/dashboard');
        } catch (err) {
            console.error('Failed to delete project:', err);
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    if (loading) return <SharedLayout>Loading...</SharedLayout>;
    if (error) return <SharedLayout>Error: {error}</SharedLayout>;
    if (!project) return <SharedLayout>No project found</SharedLayout>;

    return (
        <SharedLayout>
            <div className="flex justify-center w-full mt-10 px-4">
                <div
                    className="w-full max-w-4xl rounded-2xl shadow-lg overflow-hidden bg-white hover:shadow-2xl transition-shadow"
                >
                    {/* Header z nazwą i kolorem */}
                    <div
                        className="px-8 py-6"
                        style={{
                            background: `linear-gradient(to right, #ffffff, ${project.color})`,
                            color: '#000',
                        }}
                    >
                        <input
                            type="text"
                            value={project.name}
                            onChange={(e) => setProject({...project, name: e.target.value})}
                            className="w-full text-3xl font-extrabold border-b border-gray-300 focus:outline-none focus:border-blue-400 transition bg-transparent"
                        />
                    </div>

                    <div className="px-8 py-6 grid grid-cols-2 gap-6">
                        {/* Data */}
                        <div className="flex flex-col space-y-4 text-gray-600 text-lg">
                            <p>
                                <span className="font-semibold text-gray-800 mr-2">Created:</span>
                                {new Date(project.created_at).toLocaleString()}
                            </p>
                            <p>
                                <span className="font-semibold text-gray-800 mr-2">Updated:</span>
                                {new Date(project.updated_at).toLocaleString()}
                            </p>
                            {project.archived_at && (
                                <p>
                                    <span className="font-semibold text-gray-800 mr-2">Archived:</span>
                                    {new Date(project.archived_at).toLocaleString()}
                                </p>
                            )}
                        </div>

                        {/* Status i kolor */}
                        <div className="flex flex-col justify-start items-start md:items-start space-y-6">
                            <div className="w-full">
                                <label className="font-semibold text-gray-800 mb-2 block text-lg">Status:</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as 'active' | 'archived')}
                                    className="w-full px-5 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm hover:shadow-md transition"
                                >
                                    <option value="active">Active</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>

                            <div className="w-full">
                                <label className="font-semibold text-gray-800 mb-2 block text-lg">Color:</label>
                                <input
                                    type="color"
                                    value={project.color}
                                    onChange={(e) => setProject({...project, color: e.target.value})}
                                    className="w-full h-14 border border-gray-300 rounded-xl p-1 cursor-pointer shadow-sm hover:shadow-md transition"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="col-span-2 mt-4">
                            <label className="font-semibold text-gray-800 mb-2 block text-lg">Description:</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-4 resize-none h-32 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition shadow-sm hover:shadow-md"
                                placeholder="Enter project description..."
                            />
                        </div>

                        {/* Action buttons */}
                        <div className="col-span-2 flex justify-end items-end w-full h-full gap-3">
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 text-lg font-semibold hover:bg-gray-300 transition shadow-md"
                            >
                                Delete Project
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-lg transition"
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteProject}
                confirming={deleting}
                title="Are you sure?"
                description="This action will permanently delete your project and all associated data."
                confirmText="Delete"
                cancelText="Cancel"
            />
        </SharedLayout>
    );
}
