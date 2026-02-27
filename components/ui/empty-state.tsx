import React from 'react';
import { Button } from '@/components/ui/button';
import { PackageOpen, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
    title?: string;
    description?: string;
    icon?: React.ReactNode;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
}

export function EmptyState({
    title = "Nothing Here Yet",
    description = "There are currently no items to display in this section.",
    icon,
    actionLabel,
    actionHref,
    onAction
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-[2.5rem] border border-white/5 bg-zinc-950/50 backdrop-blur-sm shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none">
                {icon || <PackageOpen className="w-32 h-32 text-white" />}
            </div>

            <div className="relative z-10 flex flex-col items-center">
                <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 border border-white/10 mb-6 group-hover:scale-110 transition-transform duration-500">
                    {icon || <PackageOpen className="w-10 h-10 text-[#FF6200]" />}
                </div>

                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-2">
                    {title}
                </h3>

                <p className="text-xs font-medium text-zinc-500 max-w-[280px] mb-8 leading-relaxed">
                    {description}
                </p>

                {(actionLabel && (actionHref || onAction)) && (
                    actionHref ? (
                        <Button asChild className="h-12 px-6 bg-[#FF6200] hover:bg-white text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_10px_30px_rgba(255,98,0,0.15)] group/btn">
                            <Link href={actionHref}>
                                {actionLabel}
                                <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                    ) : (
                        <Button onClick={onAction} className="h-12 px-6 bg-[#FF6200] hover:bg-[#FF7A29] text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_10px_30px_rgba(255,98,0,0.15)] group/btn">
                            {actionLabel}
                            <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                    )
                )}
            </div>
        </div>
    );
}
