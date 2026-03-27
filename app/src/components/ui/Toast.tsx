import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastData {
    msg: string;
    type: 'success' | 'error';
}

interface ToastProps {
    toast: ToastData | null;
    onDismiss: () => void;
    duration?: number;
}


export function Toast({ toast, onDismiss, duration = 3500 }: ToastProps) {
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(onDismiss, duration);
        return () => clearTimeout(t);
    }, [toast, onDismiss, duration]);

    return (
        <AnimatePresence>
            {toast && (
                <motion.div
                    initial={{ opacity: 0, x: 80, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 80, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                    className="fixed top-6 right-6 z-[100] w-[340px] max-w-[90vw]"
                >
                    <div className={`relative overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl ${
                        toast.type === 'success'
                            ? 'bg-card/95 border-emerald-300/40 dark:border-emerald-500/30'
                            : 'bg-card/95 border-red-300/40 dark:border-red-500/30'
                    }`}>
                        {/* accent bar */}
                        <div className={`absolute top-0 left-0 right-0 h-[3px] ${
                            toast.type === 'success'
                                ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                                : 'bg-gradient-to-r from-red-400 to-rose-400'
                        }`} />

                        <div className="flex items-start gap-3 p-4 pt-5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                toast.type === 'success'
                                    ? 'bg-emerald-100 dark:bg-emerald-500/20'
                                    : 'bg-red-100 dark:bg-red-500/20'
                            }`}>
                                {toast.type === 'success'
                                    ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    : <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold ${
                                    toast.type === 'success' ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'
                                }`}>
                                    {toast.type === 'success' ? 'Success' : 'Error'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{toast.msg}</p>
                            </div>
                            <button onClick={onDismiss}
                                className="p-1 rounded-lg hover:bg-muted transition-colors flex-shrink-0">
                                <X className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                        </div>

                        {/* progress bar */}
                        <motion.div
                            initial={{ scaleX: 1 }}
                            animate={{ scaleX: 0 }}
                            transition={{ duration: duration / 1000, ease: 'linear' }}
                            style={{ transformOrigin: 'left' }}
                            className={`h-[2px] ${
                                toast.type === 'success'
                                    ? 'bg-emerald-400/40 dark:bg-emerald-400/30'
                                    : 'bg-red-400/40 dark:bg-red-400/30'
                            }`}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/* Convenience hook for any page */

export function useToast(duration = 3500) {
    const [toast, setToast] = useState<ToastData | null>(null);

    const flash = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), duration);
    }, [duration]);

    const dismiss = useCallback(() => setToast(null), []);

    return { toast, flash, dismiss } as const;
}
