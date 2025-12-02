'use client';
import { motion, AnimatePresence } from 'framer-motion';

interface ResetPasswordModalProps {
    show: boolean;
    onClose: () => void;
    password: string;
    confirmPassword: string;
    onPasswordChange: (value: string) => void;
    onConfirmPasswordChange: (value: string) => void;
    onConfirm: () => void;
    resetting: boolean;
    error?: string | null;
}

export default function ResetPasswordModal({
                                               show,
                                               onClose,
                                               password,
                                               confirmPassword,
                                               onPasswordChange,
                                               onConfirmPasswordChange,
                                               onConfirm,
                                               resetting,
                                               error
                                           }: ResetPasswordModalProps) {
    if (!show) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="bg-white rounded-2xl p-8 shadow-lg w-[90%] max-w-md text-center"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <h3 className="text-2xl font-bold mb-3">Reset Password</h3>
                    <div className="flex flex-col gap-4 mb-4 text-left">
                        <div>
                            <label className="text-sm text-slate-500 mb-1">New password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => onPasswordChange(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-slate-500 mb-1">Confirm password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => onConfirmPasswordChange(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </div>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl bg-slate-200 font-semibold hover:bg-slate-300 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={resetting}
                            className="px-6 py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50 transition"
                        >
                            {resetting ? 'Saving...' : 'Confirm'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
