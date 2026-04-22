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
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-center pointer-events-none">
                <Card className="w-full max-w-[600px] pointer-events-auto shadow-2xl border border-border bg-card/95 backdrop-blur">
                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            <Cookie className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold mb-2">
                                    We Value Your Privacy
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    We use cookies to enhance your browsing experience, provide personalized content,
                                    and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                                    You can customize your preferences or learn more in our{' '}
                                    <Link href="/privacy" className="text-primary hover:underline">
                                        Privacy Policy
                                    </Link>.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <Button onClick={acceptAll} size="sm">
                                        Accept All
                                    </Button>
                                    <Button onClick={acceptNecessary} variant="outline" size="sm">
                                        Necessary Only
                                    </Button>
                                    <Button
                                        onClick={() => setShowSettings(true)}
                                        variant="ghost"
                                        size="sm"
                                        className="gap-2"
                                    >
                                        <Settings className="h-4 w-4" />
                                        Customize Preferences
                                    </Button>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={acceptNecessary}
                                className="flex-shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
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
