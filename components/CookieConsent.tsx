'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Cookie, Shield, Settings } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface CookiePreferences {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
}

export function CookieConsent() {
    const { user } = useAuth();
    const [showBanner, setShowBanner] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [preferences, setPreferences] = useState<CookiePreferences>({
        necessary: true, // Always true
        analytics: false,
        marketing: false,
    });

    useEffect(() => {
        // Check if user has already consented via document.cookie
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
            return null;
        };

        const consent = getCookie('mb_cookie_consent');
        if (!consent) {
            setTimeout(() => setShowBanner(true), 1000);
        } else {
            try {
                if (consent === 'all') {
                    setPreferences({ necessary: true, analytics: true, marketing: true });
                } else if (consent === 'necessary') {
                    setPreferences({ necessary: true, analytics: false, marketing: false });
                } else {
                    const saved = JSON.parse(decodeURIComponent(consent));
                    setPreferences(saved);
                }
            } catch (e) {
                console.error('Failed to parse cookie preferences');
            }
        }
    }, []);

    const savePreferences = (prefs: CookiePreferences | 'all' | 'necessary') => {
        let cookieValue = '';
        if (prefs === 'all') {
            cookieValue = 'all';
            setPreferences({ necessary: true, analytics: true, marketing: true });
        } else if (prefs === 'necessary') {
            cookieValue = 'necessary';
            setPreferences({ necessary: true, analytics: false, marketing: false });
        } else {
            cookieValue = encodeURIComponent(JSON.stringify(prefs));
            setPreferences(prefs);
        }
        
        // maxAge=31536000 (365 days)
        document.cookie = `mb_cookie_consent=${cookieValue}; path=/; max-age=31536000; SameSite=Lax`;
        setShowBanner(false);
        setShowSettings(false);
    };

    const acceptAll = () => {
        savePreferences('all');
    };

    const acceptNecessary = () => {
        savePreferences('necessary');
    };

    const saveCustom = () => {
        savePreferences(preferences);
    };

    if (user || !showBanner) return null;

    return (
        <>
            {/* Cookie Banner */}
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-8 flex justify-center pointer-events-none">
                <Card className="w-full max-w-[650px] pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-orange-500/20 bg-[#1a1a1a]/95 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                    <div className="p-8">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            <div className="h-16 w-16 rounded-2xl bg-orange-500/10 flex items-center justify-center flex-shrink-0 border border-orange-500/20">
                                <Cookie className="h-8 w-8 text-orange-500" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-3 leading-none">
                                    Cookie <span className="text-orange-500">Notice</span>
                                </h3>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed mb-6">
                                    We use cookies to optimize your campus marketplace experience. 
                                    By accepting, you help us improve MarketBridge for all students.
                                </p>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                    <Button onClick={acceptAll} className="h-12 px-8 bg-orange-500 text-black hover:bg-orange-600 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-[0_6px_20px_rgba(255,98,0,0.25)]">
                                        Accept All
                                    </Button>
                                    <Button onClick={acceptNecessary} variant="outline" className="h-12 px-8 border-[#2a2a2a] bg-[#2a2a2a] text-white hover:bg-[#3a3a3a] font-black uppercase tracking-widest text-[10px] rounded-xl">
                                        Necessary
                                    </Button>
                                    <Button
                                        onClick={() => setShowSettings(true)}
                                        variant="ghost"
                                        className="text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-orange-500 transition-colors"
                                    >
                                        <Settings className="h-4 w-4 mr-2" />
                                        Custom
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="h-1 w-full bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
                </Card>
            </div>

            {/* Settings Dialog */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Cookie Preferences
                        </DialogTitle>
                        <DialogDescription>
                            Manage your cookie preferences. You can enable or disable different types of cookies below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        {/* Necessary Cookies */}
                        <div className="flex items-start justify-between space-x-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Label className="text-base font-semibold">
                                        Necessary Cookies
                                    </Label>
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                        Always Active
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Essential for the website to function properly. These cookies enable core
                                    functionality such as security, authentication, and accessibility features.
                                </p>
                            </div>
                            <Switch checked={true} disabled />
                        </div>

                        {/* Analytics Cookies */}
                        <div className="flex items-start justify-between space-x-4">
                            <div className="flex-1">
                                <Label className="text-base font-semibold mb-1 block">
                                    Analytics Cookies
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Help us understand how visitors interact with our website by collecting and
                                    reporting information anonymously. This helps us improve our services.
                                </p>
                            </div>
                            <Switch
                                checked={preferences.analytics}
                                onCheckedChange={(checked) =>
                                    setPreferences({ ...preferences, analytics: checked })
                                }
                            />
                        </div>

                        {/* Marketing Cookies */}
                        <div className="flex items-start justify-between space-x-4">
                            <div className="flex-1">
                                <Label className="text-base font-semibold mb-1 block">
                                    Marketing Cookies
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Used to track visitors across websites to display relevant advertisements
                                    and measure campaign effectiveness.
                                </p>
                            </div>
                            <Switch
                                checked={preferences.marketing}
                                onCheckedChange={(checked) =>
                                    setPreferences({ ...preferences, marketing: checked })
                                }
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setShowSettings(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveCustom}>
                            Save Preferences
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
