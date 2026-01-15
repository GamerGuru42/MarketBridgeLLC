import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

interface VerificationBadgeProps {
    isVerified?: boolean;
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
}

export function VerificationBadge({ isVerified = false, size = 'md', showText = true }: VerificationBadgeProps) {
    if (!isVerified) return null;

    const sizeClasses = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
    };

    return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 gap-1">
            <CheckCircle2 className={sizeClasses[size]} />
            {showText && 'Verified Dealer'}
        </Badge>
    );
}
