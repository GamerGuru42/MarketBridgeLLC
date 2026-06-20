'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Bell,
    Package,
    MessageSquare,
    Zap,
    ShieldAlert,
    DollarSign,
    AlertCircle,
    ShieldCheck,
    Sparkles,
    UserPlus,
    CheckCheck,
    Loader2,
    ArrowLeft,
    Trash2
} from 'lucide-react';

interface NotificationItem {
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    created_at: string;
}

export default function NotificationsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string>('all');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            fetchNotifications();
            subscribeToNotifications();
        }
    }, [user, authLoading]);

    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
            toast('Failed to load notifications.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const subscribeToNotifications = () => {
        if (!user) return;

        const channel = supabase
            .channel(`page-user-notifs-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    };

    const markAsRead = async (id: string, linkUrl?: string) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );

        try {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', id);
        } catch (err) {
            console.error('Failed to mark read:', err);
        }

        if (linkUrl) {
            router.push(linkUrl);
        }
    };

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length === 0) return;
        setMarkingAll(true);

        setNotifications(prev => prev.map(n => ({ ...n, read: true })));

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user!.id)
                .eq('read', false);

            if (error) throw error;
            toast('All notifications marked as read.', 'success');
        } catch (err) {
            console.error('Failed to mark all read:', err);
            fetchNotifications();
        } finally {
            setMarkingAll(false);
        }
    };

    const clearAllNotifications = async () => {
        if (notifications.length === 0) return;
        if (!confirm('Are you sure you want to permanently delete all notifications?')) return;

        setNotifications([]);

        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('user_id', user!.id);

            if (error) throw error;
            toast('Notification log cleared.', 'success');
        } catch (err) {
            console.error('Failed to clear notifications:', err);
            fetchNotifications();
        }
    };

    const getIcon = (type: string) => {
        const iconClass = "h-5 w-5 shrink-0";
        switch (type) {
            case 'order_update':
                return <Package className={`${iconClass} text-blue-500`} />;
            case 'new_message':
                return <MessageSquare className={`${iconClass} text-green-500`} />;
            case 'mc_earned':
                return <Zap className={`${iconClass} text-yellow-500 fill-yellow-500/10`} />;
            case 'dispute_update':
            case 'dispute':
                return <ShieldAlert className={`${iconClass} text-red-500`} />;
            case 'payout':
                return <DollarSign className={`${iconClass} text-emerald-500`} />;
            case 'subscription_expiring':
                return <AlertCircle className={`${iconClass} text-amber-500`} />;
            case 'verification':
                return <ShieldCheck className={`${iconClass} text-purple-500`} />;
            case 'promotion':
                return <Sparkles className={`${iconClass} text-[#FF6200]`} />;
            case 'referral_completed':
                return <UserPlus className={`${iconClass} text-cyan-500`} />;
            default:
                return <Bell className={`${iconClass} text-zinc-400`} />;
        }
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const groupNotificationsByDate = (notifs: NotificationItem[]) => {
        const today: NotificationItem[] = [];
        const yesterday: NotificationItem[] = [];
        const older: NotificationItem[] = [];

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

        notifs.forEach(n => {
            const time = new Date(n.created_at).getTime();
            if (time >= startOfToday) {
                today.push(n);
            } else if (time >= startOfYesterday) {
                yesterday.push(n);
            } else {
                older.push(n);
            }
        });

        return { today, yesterday, older };
    };

    const filteredNotifications = notifications.filter(n => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'unread') return !n.read;
        return n.type === activeFilter;
    });

    const { today, yesterday, older } = groupNotificationsByDate(filteredNotifications);

    const filterOptions = [
        { key: 'all', label: 'All Log' },
        { key: 'unread', label: 'Unread' },
        { key: 'order_update', label: 'Orders' },
        { key: 'new_message', label: 'Messages' },
        { key: 'mc_earned', label: 'MarketCoins' },
        { key: 'dispute_update', label: 'Disputes' }
    ];

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA]">
                <Loader2 className="h-8 w-8 animate-spin text-[#FF6200]" />
                <span className="mt-4 text-xs font-black uppercase tracking-widest text-zinc-400">Loading System Log...</span>
            </div>
        );
    }

    const renderGroupList = (group: NotificationItem[], title: string) => {
        if (group.length === 0) return null;
        return (
            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 pl-4">{title}</h3>
                <div className="space-y-3">
                    {group.map((n) => (
                        <div
                            key={n.id}
                            onClick={() => markAsRead(n.id, n.link)}
                            className={`flex gap-4 p-6 rounded-[2rem] border transition-all duration-300 cursor-pointer bg-white ${
                                !n.read 
                                    ? 'border-[#FF6200]/25 shadow-sm hover:border-[#FF6200]/40' 
                                    : 'border-zinc-200/60 shadow-sm hover:border-zinc-300'
                            }`}
                        >
                            <div className="h-10 w-10 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
                                {getIcon(n.type)}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-start gap-4">
                                    <h4 className={`text-sm font-black uppercase tracking-wide leading-tight ${!n.read ? 'text-zinc-900' : 'text-zinc-500'}`}>
                                        {n.title}
                                    </h4>
                                    <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap">{formatRelativeTime(n.created_at)}</span>
                                </div>
                                <p className="text-xs leading-relaxed text-zinc-500 font-medium">
                                    {n.message}
                                </p>
                            </div>
                            {!n.read && (
                                <span className="h-2.5 w-2.5 rounded-full bg-[#FF6200] shrink-0 mt-1.5 animate-pulse" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 relative selection:bg-[#FF6200] selection:text-black pt-28 pb-32">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="container mx-auto px-6 max-w-4xl relative z-10">
                
                {/* Header */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-[#FF6200] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 font-heading">System Broadcast Log</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic font-heading">
                            Notifications
                        </h1>
                        <p className="text-zinc-500 font-medium italic">
                            Review transaction cycles, disputes, and system broadcasts.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        {notifications.filter(n => !n.read).length > 0 && (
                            <Button
                                onClick={markAllAsRead}
                                disabled={markingAll}
                                variant="outline"
                                className="h-12 border-zinc-200 text-zinc-600 hover:text-zinc-900 rounded-2xl font-black uppercase tracking-widest text-[10px] font-heading"
                            >
                                {markingAll ? <Loader2 className="h-4 w-4 animate-spin text-[#FF6200]" /> : <CheckCheck className="h-4 w-4 mr-2" />}
                                Mark All Read
                            </Button>
                        )}
                        {notifications.length > 0 && (
                            <Button
                                onClick={clearAllNotifications}
                                variant="ghost"
                                className="h-12 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-2xl font-black uppercase tracking-widest text-[10px] font-heading"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Clear Log
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-10">
                    {filterOptions.map((opt) => (
                        <button
                            key={opt.key}
                            onClick={() => setActiveFilter(opt.key)}
                            className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                                activeFilter === opt.key
                                    ? 'bg-[#FF6200] text-black shadow-md border-none'
                                    : 'bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-800'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Notification List Groups */}
                <div className="space-y-12">
                    {filteredNotifications.length === 0 ? (
                        <div className="text-center py-32 space-y-6 bg-white border border-zinc-200 rounded-[3rem]">
                            <div className="h-20 w-20 rounded-full bg-[#FF6200]/10 flex items-center justify-center mx-auto border border-[#FF6200]/20">
                                <Bell className="h-8 w-8 text-[#FF6200]" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter italic font-heading">Notification log empty</h3>
                                <p className="text-zinc-500 font-medium mt-2">There are no matching items registered in the log.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {renderGroupList(today, 'Today')}
                            {renderGroupList(yesterday, 'Yesterday')}
                            {renderGroupList(older, 'Older Notifications')}
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}
