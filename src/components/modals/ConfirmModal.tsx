'use client';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: () => void;
    confirming?: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
}

export default function Modal({
                                  show,
                                  onClose,
                                  onConfirm,
                                  confirming = false,
                                  title,
                                  description,
                                  confirmText = 'Confirm',
                                  cancelText = 'Cancel',
                              }: ModalProps) {
    if (!show) return null;

    return (
        <AnimatePresence>
                <div className="fixed inset-0 flex justify-center items-center z-50">
                    {/* subtle overlay so the current page stays visible but dimmed
                        Render overlay immediately (no fade) so the blur appears instantly.
                        The modal itself (below) will animate its scale/opacity. */}
                    <div
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        className="bg-white rounded-2xl p-8 shadow-lg w-[90%] max-w-md text-center relative z-10 flex flex-col justify-center min-h-[160px]"
                        initial={{ scale: 0.9, opacity: 0, y: '-5vh' }}
                        animate={{ scale: 1, opacity: 1, y: '-5vh' }}
                        exit={{ scale: 0.9, opacity: 0, y: '-5vh' }}
                        transition={{ duration: 0.2 }}
                    >
                    <h3 className="text-2xl font-bold mb-3">{title}</h3>
                    <p className="text-slate-600 mb-6">{description}</p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl bg-slate-200 font-semibold hover:bg-slate-300 transition"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={confirming}
                            className="px-6 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-50 transition"
                        >
                            {confirming ? `${confirmText}...` : confirmText}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
