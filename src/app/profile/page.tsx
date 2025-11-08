'use client';
import React, { useEffect, useState } from 'react';
import SharedLayout from '@/components/layouts/SharedLayout';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
import { lightBlue } from '@/lib/colors';
import { logout } from '@/lib/auth';

import DeleteAccountModal from '@/components/modals/DeleteAccountModal';
import ResetPasswordModal from '@/components/modals/ResetPasswordModal';

interface User {
    email: string;
    username: string;
    name: string | null;
    surname: string | null;
    bio: string | null;
    avatar_url: string | null;
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState<Partial<User>>({});
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [avatarDeleted, setAvatarDeleted] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [showResetModal, setShowResetModal] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetting, setResetting] = useState(false);
    const [resetError, setResetError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = Cookies.get('token');
                if (!token) throw new Error('No token');

                const res = await api.get<User>('/users/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(res.data);
                setForm(res.data);
            } catch (err) {
                console.error(err);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [router]);

    const handleChange = (field: keyof User, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleAvatarSelect = (file: File | null) => {
        setAvatarFile(file);
        setAvatarDeleted(false);
    };

    const handleEnterEdit = () => setIsEditing(true);

    const handleCancel = () => {
        setForm(user || {});
        setAvatarFile(null);
        setAvatarDeleted(false);
        setIsEditing(false);
    };

    const handleDeleteAvatar = async () => {
        setAvatarFile(null);
        setAvatarDeleted(true);

        try {
            const token = Cookies.get('token');
            if (!token) throw new Error('No token');

            try {
                await api.delete('/users/avatar', {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } catch {
                const fd = new FormData();
                fd.append('delete_avatar', 'true');
                await api.put<User>('/users/edit', fd, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            const res = await api.get<User>('/users/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUser(res.data);
            setForm(res.data);
        } catch (err) {
            console.error('Failed to delete avatar:', err);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = Cookies.get('token');
            if (!token) throw new Error('No token');

            const formData = new FormData();

            if (form.name) formData.append('name', form.name);
            if (form.surname) formData.append('surname', form.surname);
            if (form.bio) formData.append('bio', form.bio);

            if (avatarFile) {
                formData.append('avatar', avatarFile);
            } else if (avatarDeleted) {
                formData.append('delete_avatar', 'true');
            }

            const res = await api.put<User>('/users/edit', formData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setUser(res.data);
            setForm(res.data);
            setAvatarFile(null);
            setAvatarDeleted(false);
            setIsEditing(false);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleting(true);
        try {
            const token = Cookies.get('token');
            if (!token) throw new Error('No token');

            await api.delete<User>('/users/deleteme', {
                headers: { Authorization: `Bearer ${token}` },
            });

            logout();
            router.push('/login');
        } catch (err) {
            console.error('Failed to delete account:', err);
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const handleResetPassword = async () => {
        setResetError(null);

        if (password !== confirmPassword) {
            setResetError('Passwords do not match.');
            return;
        }

        try {
            setResetting(true);
            const token = Cookies.get('token');
            if (!token) throw new Error('No token');

            await api.post(
                '/users/reset-password',
                { password },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setShowResetModal(false);
            setPassword('');
            setConfirmPassword('');
            alert('Password successfully changed.');
        } catch (err) {
            console.error(err);
            setResetError('Failed to reset password.');
        } finally {
            setResetting(false);
        }
    };

    if (loading) {
        return (
            <SharedLayout>
                <div className="flex justify-center items-center h-screen">
                    <motion.div
                        className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                    />
                </div>
            </SharedLayout>
        );
    }

    const avatarPreviewUrl = avatarFile ? URL.createObjectURL(avatarFile) : (avatarDeleted ? null : user?.avatar_url);

    return (
        <SharedLayout>
            <div className="w-full h-full flex justify-center">
                <div className="flex flex-col w-full max-w-6xl bg-white rounded-2xl shadow-lg p-18 gap-15">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 border-b border-gray-300 pb-4">
                        <div className="flex flex-col">
                            <h2 className="text-3xl font-bold">Profile</h2>
                            <p className="text-slate-600 mt-1">
                                This is your profile. You can view and edit your information below.
                            </p>
                        </div>
                        {!isEditing && (
                            <button
                                onClick={handleEnterEdit}
                                className="px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-50 transition text-lg"
                                style={{ backgroundColor: lightBlue }}
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isEditing ? 'edit' : 'view'}
                            initial={{ opacity: 0, scaleY: 0.95 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            exit={{ opacity: 0, scaleY: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col md:flex-row gap-8 w-full"
                        >
                            {/* Avatar & form */}
                            <div className="flex flex-col items-center gap-4 flex-shrink-0">
                                {avatarPreviewUrl ? (
                                    <img
                                        src={avatarPreviewUrl}
                                        alt="avatar"
                                        className="w-32 h-32 rounded-full object-cover border-2 border-slate-300"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full border-2 border-slate-300 bg-gray-100" />
                                )}
                                {isEditing && (
                                    <div className="flex flex-col items-center gap-2">
                                        <label
                                            className="cursor-pointer px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition text-sm text-center w-full max-w-[150px]"
                                        >
                                            Upload
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        handleAvatarSelect(e.target.files[0]);
                                                    }
                                                }}
                                            />
                                        </label>
                                        {(user?.avatar_url || avatarFile) && (
                                            <button
                                                onClick={handleDeleteAvatar}
                                                className="px-5 py-2 rounded-xl font-semibold transition text-white text-center w-full max-w-[150px]"
                                                style={{ backgroundColor: '#ff4d4f' }}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col gap-6 min-w-0">
                                <div className="flex flex-col md:flex-row gap-6 w-full">
                                    <div className="flex-1 flex flex-col min-w-0">
                                        <label className="text-sm text-slate-500 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={form.email || ''}
                                            readOnly
                                            disabled
                                            className="px-4 py-3 rounded-xl border border-gray-300 bg-gray-100 h-[3.5rem] w-full min-w-0"
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col min-w-0">
                                        <label className="text-sm text-slate-500 mb-1">Username</label>
                                        <input
                                            type="text"
                                            value={form.username || ''}
                                            readOnly
                                            disabled
                                            className="px-4 py-3 rounded-xl border border-gray-300 bg-gray-100 h-[3.5rem] w-full min-w-0"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-6 w-full">
                                    <div className="flex-1 flex flex-col min-w-0">
                                        <label className="text-sm text-slate-500 mb-1">Name</label>
                                        <input
                                            type="text"
                                            value={form.name || ''}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            readOnly={!isEditing}
                                            className={`px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 h-[3.5rem] w-full min-w-0 ${
                                                !isEditing ? 'cursor-default select-none' : ''
                                            }`}
                                        />
                                    </div>

                                    <div className="flex-1 flex flex-col min-w-0">
                                        <label className="text-sm text-slate-500 mb-1">Surname</label>
                                        <input
                                            type="text"
                                            value={form.surname || ''}
                                            onChange={(e) => handleChange('surname', e.target.value)}
                                            readOnly={!isEditing}
                                            className={`px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 h-[3.5rem] w-full min-w-0 ${
                                                !isEditing ? 'cursor-default select-none' : ''
                                            }`}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col w-full min-w-0">
                                    <label className="text-sm text-slate-500 mb-1">Bio</label>
                                    <textarea
                                        value={form.bio || ''}
                                        onChange={(e) => handleChange('bio', e.target.value)}
                                        readOnly={!isEditing}
                                        className={`px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none w-full min-w-0 overflow-y-auto break-words whitespace-pre-wrap ${
                                            !isEditing ? 'cursor-default select-none' : ''
                                        }`}
                                        rows={4}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {isEditing && (
                        <div className="flex flex-wrap gap-4 mt-4">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-50 transition text-lg"
                                style={{ backgroundColor: lightBlue }}
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={handleCancel}
                                className="px-6 py-3 rounded-xl bg-slate-200 font-semibold hover:bg-slate-300 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                    {!isEditing && (
                        <div className="flex justify-end items-end w-full h-full gap-3">
                            <button
                                onClick={() => setShowResetModal(true)}
                                className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition shadow-md"
                            >
                                Reset Password
                            </button>

                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 text-sm font-semibold hover:bg-gray-300 transition shadow-md"
                            >
                                Delete Account
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modale */}
            <DeleteAccountModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteAccount}
                deleting={deleting}
            />

            <ResetPasswordModal
                show={showResetModal}
                onClose={() => setShowResetModal(false)}
                password={password}
                confirmPassword={confirmPassword}
                onPasswordChange={setPassword}
                onConfirmPasswordChange={setConfirmPassword}
                onConfirm={handleResetPassword}
                resetting={resetting}
                error={resetError}
            />
        </SharedLayout>
    );
}
