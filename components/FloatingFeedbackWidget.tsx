'use client';

import React, { useState } from 'react';
import { MessageSquarePlus, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { submitFeedback } from '@/app/actions/feedback';
import { useToast } from '@/contexts/ToastContext';

export function FloatingFeedbackWidget() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [type, setType] = useState('Bug Report');
    const [description, setDescription] = useState('');
    const [name, setName] = useState(user?.displayName || '');
    const [email, setEmail] = useState(user?.email || '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) {
            addToast('error', 'Description is required.');
            return;
        }
        
        setSubmitting(true);
        const res = await submitFeedback({
            type,
            description,
            name,
            email,
            userId: user?.id
        });
        setSubmitting(false);

        if (res.success) {
            addToast('success', 'Feedback sent successfully! Thank you.');
            setOpen(false);
            setDescription('');
        } else {
            addToast('error', res.error || 'Failed to submit the feedback.');
        }
    };

    return (
        <div className="fixed bottom-24 md:bottom-8 left-4 md:left-8 z-[9999] flex flex-col items-start group">
            {open && (
                <div className="mb-4 w-[320px] md:w-[380px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
                        <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <MessageSquarePlus className="h-4 w-4 text-[#FF6200]" />
                            Beta Feedback
                        </h3>
                        <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                        <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">Feedback Type *</label>
                            <select 
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm font-medium focus:ring-2 focus:ring-[#FF6200] outline-none"
                            >
                                <option value="Bug Report" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Bug Report</option>
                                <option value="Feature Suggestion" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Feature Suggestion</option>
                                <option value="Transaction Issue" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Transaction Issue</option>
                                <option value="General Feedback" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">General Feedback</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">Description *</label>
                            <textarea 
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What did you experience?"
                                rows={4}
                                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm resize-none focus:ring-2 focus:ring-[#FF6200] outline-none placeholder:text-zinc-400"
                            />
                        </div>

                        {!user && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 block mb-1">Name (Optional)</label>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 block mb-1">Email (Optional)</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs outline-none" />
                                </div>
                            </div>
                        )}

                        <Button 
                            disabled={submitting} 
                            type="submit" 
                            className="w-full bg-[#FF6200] hover:bg-[#FF7A29] text-white font-bold rounded-xl h-11"
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                <>
                                    <Send className="h-4 w-4 mr-2" /> Send Feedback
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            )}

            <button 
                onClick={() => setOpen(!open)}
                className={`h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${open ? 'bg-zinc-900 text-white' : 'bg-[#FF6200] text-white'}`}
            >
                {open ? <X className="h-6 w-6" /> : <MessageSquarePlus className="h-6 w-6" />}
            </button>
        </div>
    );
}
