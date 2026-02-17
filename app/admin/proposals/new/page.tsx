'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Send,
    ShieldAlert,
    Zap,
    ArrowLeft,
    CheckCircle2,
    FileText,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { createProposal, fetchProposals, Proposal } from '@/lib/analytics';

export default function SubmitProposalPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [myProposals, setMyProposals] = useState<Proposal[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        category: 'Infrastructure Upgrade',
        priority: 'Medium - Routine Growth',
        description: '',
        impact: ''
    });

    useEffect(() => {
        if (user) {
            fetchProposals().then(all => {
                setMyProposals(all.filter(p => p.author_id === user.id).slice(0, 5));
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);

        try {
            await createProposal({
                title: formData.title,
                category: formData.category,
                priority: formData.priority,
                description: formData.description,
                impact: formData.impact,
                author_id: user.id,
                admin_name: user.displayName || 'Admin'
            });

            setSubmitted(true);
            setTimeout(() => router.push('/admin'), 3000);
        } catch (error) {
            console.error("Error submitting proposal:", error);
            alert("Failed to submit proposal. Database connection might be offline.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="container max-w-2xl mx-auto py-20 px-4 text-center">
                <div className="mb-6 flex justify-center">
                    <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <CheckCircle2 className="h-12 w-12" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold mb-2">Proposal Submitted!</h1>
                <p className="text-muted-foreground mb-8">
                    Your strategic memo has been sent to the CEO's command queue for review and approval.
                </p>
                <Button asChild variant="outline">
                    <Link href="/admin">Return to Hub</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl mx-auto py-10 px-4 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Strategic Upgrade Proposal</h1>
                    <p className="text-muted-foreground">Formal memo for CEO review and operational approval.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card className="shadow-xl border-primary/10">
                        <form onSubmit={handleSubmit}>
                            <CardHeader>
                                <CardTitle>Proposal Details</CardTitle>
                                <CardDescription>Be specific about technical requirements and projected impact.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Proposal Title</Label>
                                    <Input id="title" value={formData.title} onChange={handleChange} placeholder="e.g. Abuja Node Infrastructure Expansion" required />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Strategic Category</Label>
                                        <select id="category" value={formData.category} onChange={handleChange} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary">
                                            <option>Infrastructure Upgrade</option>
                                            <option>Policy/Operations Shift</option>
                                            <option>Marketing Initiative</option>
                                            <option>Financial/Escrow Change</option>
                                            <option>Dealer Growth Strategy</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="priority">Initial Priority</Label>
                                        <select id="priority" value={formData.priority} onChange={handleChange} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary">
                                            <option>Low - Optimization</option>
                                            <option>Medium - Routine Growth</option>
                                            <option>High - Critical Scaling</option>
                                            <option>Immediate - Urgent Fix</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Executive Summary & Technical Breakdown</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Describe the upgrade, required resources, and the expected outcome in the Abuja market..."
                                        className="min-h-[200px]"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="impact">Projected Impact (Abuja Region)</Label>
                                    <Input id="impact" value={formData.impact} onChange={handleChange} placeholder="e.g. +15% conversion lift, -30% latency" />
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/30 border-t flex justify-between p-6">
                                <Button type="button" variant="ghost">Save Draft</Button>
                                <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {user?.role === 'ceo' ? 'Logging Directive...' : 'Submitting Memo...'}
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            {user?.role === 'ceo' ? 'Log Strategic Directive' : 'Submit to CEO'}
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-slate-900 text-white border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 text-orange-400" />
                                {user?.role === 'ceo' ? 'Directive Integrity' : 'Submission Integrity'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-4 text-slate-300 leading-relaxed">
                            {user?.role === 'ceo' ? (
                                <>
                                    <p>Directives logged here are immediately broadcast to the relevant department queues for execution.</p>
                                    <p>Your command will be tracked in the <span className="text-primary font-bold">Executive Registry</span>.</p>
                                </>
                            ) : (
                                <>
                                    <p>Proposals submitted through this terminal are logged with high-integrity audit trails.</p>
                                    <p>The CEO will receive an immediate notification in their <span className="text-primary font-bold">Vision Command Queue</span>.</p>
                                </>
                            )}
                            <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                                <p className="font-bold text-white mb-1">Status Tracking:</p>
                                <ul className="space-y-1 list-disc pl-4">
                                    <li>Pending Review</li>
                                    <li>Requesting Intel</li>
                                    <li>Approved & Provisioning</li>
                                    <li>Archived/Deferred</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Your Recent Proposals</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {myProposals.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">No proposals found.</p>
                            ) : (
                                myProposals.map(prop => (
                                    <div key={prop.id} className="flex items-center justify-between p-2 border rounded-md">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <FileText className="h-3 w-3 text-primary shrink-0" />
                                            <span className="text-[10px] font-medium truncate max-w-[120px]">{prop.title}</span>
                                        </div>
                                        <Badge variant="outline" className={`text-[8px] h-4 ${prop.status === 'approved' ? 'bg-green-100 text-green-800' : 'text-zinc-500'}`}>{prop.status.toUpperCase()}</Badge>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
