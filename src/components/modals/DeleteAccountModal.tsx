'use client';
import { motion, AnimatePresence } from 'framer-motion';

interface DeleteAccountModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: () => void;
    deleting: boolean;
}

export default function DeleteAccountModal({ show, onClose, onConfirm, deleting }: DeleteAccountModalProps) {
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
                    <h3 className="text-2xl font-bold mb-3">Are you sure?</h3>
                    <p className="text-slate-600 mb-6">
                        This action will permanently delete your account and all associated data.
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl bg-slate-200 font-semibold hover:bg-slate-300 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={deleting}
                            className="px-6 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-50 transition"
                        >
                            {deleting ? 'Deleting...' : 'Confirm'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
