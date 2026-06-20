'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
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
    ChevronRight,
    Clock
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

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

export const NotificationBell = () => {
    const { user } = useAuth();
    const router = useRouter();
    
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            subscribeToNotifications();
        }
    }, [user]);

    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            const notifs = data || [];
            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToNotifications = () => {
        if (!user) return;

        const channel = supabase
            .channel(`user-notifs-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newNotif = payload.new as NotificationItem;
                        setNotifications(prev => [newNotif, ...prev]);
                        setUnreadCount(prev => prev + 1);
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedNotif = payload.new as NotificationItem;
                        setNotifications(prev =>
                            prev.map(n => (n.id === updatedNotif.id ? updatedNotif : n))
                        );
                        // Recalculate unread count
                        setNotifications(prev => {
                            setUnreadCount(prev.filter(n => !n.read).length);
                            return prev;
                        });
                    } else if (payload.eventType === 'DELETE') {
                        const deletedNotif = payload.old as { id: string };
                        setNotifications(prev => prev.filter(n => n.id !== deletedNotif.id));
                        setNotifications(prev => {
                            setUnreadCount(prev.filter(n => !n.read).length);
                            return prev;
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    };

    const markAsRead = async (id: string, linkUrl?: string) => {
        // Optimistically update local state
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', id);
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }

        if (linkUrl) {
            setDropdownOpen(false);
            router.push(linkUrl);
        }
    };

    const markAllAsRead = async () => {
        if (unreadCount === 0) return;
        setMarkingAll(true);

        // Optimistically mark all as read locally
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user!.id)
                .eq('read', false);

            if (error) throw error;
        } catch (err) {
            console.error('Failed to mark all as read:', err);
            // Re-fetch in case of failure to align state
            fetchNotifications();
        } finally {
            setMarkingAll(false);
        }
    };

    const getIcon = (type: string) => {
        const iconClass = "h-4 w-4 shrink-0";
        switch (type) {
            case 'order_update':
                return <Package className={`${iconClass} text-blue-500`} />;
            case 'new_message':
                return <MessageSquare className={`${iconClass} text-green-500`} />;
            case 'mc_earned':
                return <Zap className={`${iconClass} text-yellow-500 fill-yellow-500/20`} />;
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
        return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
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

    const { today, yesterday, older } = groupNotificationsByDate(notifications);

    const renderGroupList = (group: NotificationItem[], title: string) => {
        if (group.length === 0) return null;
        return (
            <div className="space-y-1">
                <div className="px-4 py-1.5 bg-zinc-50 dark:bg-zinc-900/50 text-[10px] font-black uppercase tracking-wider text-zinc-400 border-y border-zinc-100 dark:border-zinc-800/50">
                    {title}
                </div>
                {group.map((n) => (
                    <div
                        key={n.id}
                        onClick={() => markAsRead(n.id, n.link)}
                        className={`flex gap-3.5 px-4 py-3.5 transition-colors cursor-pointer border-b border-zinc-100 dark:border-zinc-800/30 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 ${
                            !n.read ? 'bg-[#FF6200]/[0.02] dark:bg-[#FF6200]/[0.01]' : ''
                        }`}
                    >
                        <div className="mt-0.5">{getIcon(n.type)}</div>
                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start gap-4">
                                <h4 className={`text-xs font-black uppercase tracking-wide leading-none ${!n.read ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                    {n.title}
                                </h4>
                                <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap">{formatRelativeTime(n.created_at)}</span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 font-medium line-clamp-2">
                                {n.message}
                            </p>
                        </div>
                        {!n.read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[#FF6200] shrink-0 mt-2 animate-pulse" />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
                <button className="relative p-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white focus:outline-none select-none">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950 shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={12}
                className="w-[380px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white shadow-2xl rounded-2xl overflow-hidden z-[999] p-0"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#FF6200]" />
                        <h3 className="text-xs font-black uppercase tracking-widest font-heading">System Notifications</h3>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            onClick={markAllAsRead}
                            disabled={markingAll}
                            className="h-8 px-2.5 text-[9px] font-black uppercase tracking-wider text-zinc-400 hover:text-[#FF6200] hover:bg-transparent"
                        >
                            {markingAll ? (
                                <Loader2 className="h-3 w-3 animate-spin text-[#FF6200]" />
                            ) : (
                                <>
                                    <CheckCheck className="h-3 w-3 mr-1" />
                                    Mark all as read
                                </>
                            )}
                        </Button>
                    )}
                </div>

                {/* Notification List Scroll Area */}
                <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {loading && notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                            <Loader2 className="h-6 w-6 animate-spin text-[#FF6200]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Syncing System Logs...</span>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                            <div className="h-12 w-12 rounded-full bg-[#FF6200]/5 flex items-center justify-center border border-[#FF6200]/10">
                                <Bell className="h-5 w-5 text-zinc-300 dark:text-zinc-600" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-tight">System Idle</h4>
                                <p className="text-[10px] text-zinc-400 font-medium italic mt-1">No warnings or payloads registered.</p>
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

                {/* Footer link to view all */}
                <Link
                    href="/notifications"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-3 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors border-t border-zinc-100 dark:border-zinc-800/80 font-heading"
                >
                    View All Notifications <ChevronRight className="h-3 w-3" />
                </Link>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
