'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { escrowAPI } from '@/lib/api';
import { AlertTriangle } from 'lucide-react';

interface DisputeModalProps {
    escrowId: string;
    onDisputeFiled: () => void;
}

export function DisputeModal({ escrowId, onDisputeFiled }: DisputeModalProps) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!reason || !description) return;

        setLoading(true);
        try {
            await escrowAPI.disputeEscrow(escrowId, reason, description);
            setOpen(false);
            onDisputeFiled();
        } catch (error) {
            console.error('Failed to file dispute', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Report Issue / Dispute
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>File a Dispute</DialogTitle>
                    <DialogDescription>
                        Funds will be held by MarketBridge until the issue is resolved.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label htmlFor="reason" className="text-sm font-medium">
                            Reason
                        </label>
                        <select
                            id="reason"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        >
                            <option value="">Select a reason</option>
                            <option value="item_not_received">Item not received</option>
                            <option value="item_not_as_described">Item not as described</option>
                            <option value="damaged_item">Item damaged</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="description" className="text-sm font-medium">
                            Description
                        </label>
                        <Textarea
                            id="description"
                            placeholder="Describe the issue in detail..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !reason || !description} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {loading ? 'Filing...' : 'File Dispute'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
