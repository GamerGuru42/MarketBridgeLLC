'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, X, Star, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const FeedbackModal = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        university: '',
        role: '',
        rating: 0,
        likes: '',
        frustrations: '',
        feature_requests: '',
        bugs: '',
        nps: 0,
        contact: ''
    });

    // Only show to logged-in users per requirements
    // (if not strict "only logged in", just verify role later, but requirement says "Only show to logged-in beta users")
    if (!user) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSelectChange = (name: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.university || !formData.role || !formData.rating || !formData.likes || !formData.frustrations) {
            toast({ title: 'Validation Error', description: 'Please fill in required fields (University, Role, Rating, Likes, Frustrations).', variant: 'destructive' });
            return;
        }

        // Rate limiting check via localStorage
        const lastSubmit = localStorage.getItem('marketbridge_feedback_last');
        if (lastSubmit) {
            const timePassed = Date.now() - parseInt(lastSubmit);
            // 1 week = 7 * 24 * 60 * 60 * 1000 = 604800000 ms
            if (timePassed < 604800000) {
                toast({ title: 'Slow down', description: 'You can only submit feedback once per week. Thanks for your input!', variant: 'destructive' });
                setIsOpen(false);
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to submit feedback');

            localStorage.setItem('marketbridge_feedback_last', Date.now().toString());
            toast({
                title: 'Feedback Sent 🚀',
                description: 'Thanks! Your input helps shape MarketBridge.',
                className: 'bg-[#FF6200] text-white font-bold border-none'
            });
            setIsOpen(false);

            // Reset form
            setFormData({
                university: '',
                role: '',
                rating: 0,
                likes: '',
                frustrations: '',
                feature_requests: '',
                bugs: '',
                nps: 0,
                contact: ''
            });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Something went wrong.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="fixed bottom-6 right-6 z-[100] h-14 w-14 rounded-full bg-[#FF6200] text-white shadow-[0_0_20px_rgba(255,98,0,0.5)] flex items-center justify-center hover:bg-[#ff7a2b] transition-colors"
                    aria-label="Provide Beta Feedback"
                >
                    <MessageSquarePlus className="h-6 w-6" />
                </motion.button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border border-white/10 text-white scrollbar-hide">
                <div className="flex justify-between items-center mb-4 sticky top-0 bg-[#0a0a0a] pt-4 z-10">
                    <div>
                        <h2 className="text-2xl font-black italic tracking-widest text-[#FF6200] uppercase">Beta Feedback</h2>
                        <p className="text-zinc-400 text-sm">Help us shape MarketBridge Campus 🚀</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-300">University *</Label>
                            <Select onValueChange={(val) => handleSelectChange('university', val)}>
                                <SelectTrigger className="bg-black border-white/20 text-white">
                                    <SelectValue placeholder="Select University" />
                                </SelectTrigger>
                                <SelectContent className="bg-black border-white/20 text-white">
                                    <SelectItem value="University of Abuja">University of Abuja</SelectItem>
                                    <SelectItem value="Baze University">Baze University</SelectItem>
                                    <SelectItem value="Nile University">Nile University</SelectItem>
                                    <SelectItem value="Veritas University">Veritas University</SelectItem>
                                    <SelectItem value="Cosmopolitan University">Cosmopolitan University</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-zinc-300">Your Role *</Label>
                            <Select onValueChange={(val) => handleSelectChange('role', val)}>
                                <SelectTrigger className="bg-black border-white/20 text-white">
                                    <SelectValue placeholder="Select Role" />
                                </SelectTrigger>
                                <SelectContent className="bg-black border-white/20 text-white">
                                    <SelectItem value="Buyer">Buyer</SelectItem>
                                    <SelectItem value="Seller">Seller</SelectItem>
                                    <SelectItem value="Both">Both</SelectItem>
                                    <SelectItem value="Browser-only">Browser-only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-300 flex justify-between">
                            <span>Overall Rating (1-10) *</span>
                            <span className="text-[#FF6200] font-bold">{formData.rating > 0 ? formData.rating : ''}</span>
                        </Label>
                        <input
                            type="range"
                            min="1" max="10"
                            value={formData.rating}
                            onChange={(e) => handleSelectChange('rating', parseInt(e.target.value))}
                            className="w-full accent-[#FF6200]"
                        />
                        <div className="flex justify-between text-xs text-zinc-500">
                            <span>Poor</span>
                            <span>Amazing</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-300">What do you like most? *</Label>
                        <Textarea
                            name="likes" value={formData.likes} onChange={handleChange}
                            placeholder="Tell us what rocks..."
                            className="bg-black border-white/20 text-white focus-visible:ring-[#FF6200]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-300">What frustrated you or needs fixing? *</Label>
                        <Textarea
                            name="frustrations" value={formData.frustrations} onChange={handleChange}
                            placeholder="Don't hold back..."
                            className="bg-black border-white/20 text-white focus-visible:ring-[#FF6200]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-300">Feature requests / missing items?</Label>
                        <Textarea
                            name="feature_requests" value={formData.feature_requests} onChange={handleChange}
                            placeholder="e.g. better search, chat, wigs category..."
                            className="bg-black border-white/20 text-white focus-visible:ring-[#FF6200]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-300">Bugs encountered?</Label>
                        <Textarea
                            name="bugs" value={formData.bugs} onChange={handleChange}
                            placeholder="Describe any glitches..."
                            className="bg-black border-white/20 text-white focus-visible:ring-[#FF6200]"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-300">NPS: How likely to recommend? (0-10)</Label>
                            <input
                                type="number"
                                min="0" max="10"
                                name="nps"
                                value={formData.nps || ''}
                                onChange={(e) => handleSelectChange('nps', parseInt(e.target.value) || 0)}
                                className="w-full flex h-10 rounded-md border border-white/20 bg-black px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6200]"
                                placeholder="10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Contact (Optional WhatsApp/Email)</Label>
                            <Input
                                name="contact" value={formData.contact} onChange={handleChange}
                                placeholder="For follow-ups"
                                className="bg-black border-white/20 text-white focus-visible:ring-[#FF6200]"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#FF6200] hover:bg-[#ff7a2b] text-white font-black uppercase tracking-widest h-12 rounded-xl flex items-center gap-2"
                    >
                        {isSubmitting ? 'Submitting...' : <><Send className="w-4 h-4" /> Submit Feedback</>}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
