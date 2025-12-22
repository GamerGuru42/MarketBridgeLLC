import { Star } from 'lucide-react';

interface ReviewBadgeProps {
    rating?: number;
    reviewCount?: number;
    size?: 'sm' | 'md' | 'lg';
}

export function ReviewBadge({ rating = 0, reviewCount = 0, size = 'md' }: ReviewBadgeProps) {
    if (reviewCount === 0) {
        return (
            <span className="text-sm text-muted-foreground">No reviews yet</span>
        );
    }

    const sizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
    };

    const starSize = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
    };

    return (
        <div className={`flex items-center gap-1 ${sizeClasses[size]}`}>
            <Star className={`${starSize[size]} fill-yellow-400 text-yellow-400`} />
            <span className="font-semibold">{rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({reviewCount})</span>
        </div>
    );
}
