'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, X, ShieldCheck, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SmartEscrowModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: any) => Promise<void>;
    amount: string;
    setAmount: (val: string) => void;
}

export function SmartEscrowModal({ isOpen, onClose, onConfirm, amount, setAmount }: SmartEscrowModalProps) {
    const [mode, setMode] = useState<'default' | 'custom'>('default');
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [customSteps, setCustomSteps] = useState<string[]>(['Seller ships item', 'Buyer confirms receipt', 'Buyer inspects item']);
    const [tosAccepted, setTosAccepted] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        const { data } = await supabase.from('escrow_templates').select('*');
        setTemplates(data || []);
    };

    const handleAddStep = () => {
        setCustomSteps([...customSteps, '']);
    };

    const handleRemoveStep = (index: number) => {
        const newSteps = [...customSteps];
        newSteps.splice(index, 1);
        setCustomSteps(newSteps);
    };

    const handleStepChange = (index: number, value: string) => {
        const newSteps = [...customSteps];
        newSteps[index] = value;
        setCustomSteps(newSteps);
    };

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        if (!tosAccepted) {
            alert('You must agree to the Terms of Service');
            return;
        }

        setLoading(true);
        try {
            let steps: string[] = [];
            let tosText = '';

            if (mode === 'default') {
                const template = templates.find(t => t.id === selectedTemplateId);
                if (!template) {
                    alert('Please select a template');
                    setLoading(false);
                    return;
                }
                steps = template.steps;
                tosText = template.tos_text;
            } else {
                steps = customSteps.filter(s => s.trim());
                if (steps.length === 0) {
                    alert('Please add at least one step');
                    setLoading(false);
                    return;
                }
                tosText = "Standard Custom Escrow Terms apply. Both parties agree to follow the defined steps.";
            }

            await onConfirm({
                amount: parseFloat(amount),
                type: mode,
                steps,
                tosText
            });
            onClose();
        } catch (error) {
            console.error('Error creating escrow:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        Initiate Smart Escrow
                    </DialogTitle>
                    <DialogDescription>
                        Create a secure, step-by-step payment agreement.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 px-1">
                    <div className="mb-6">
                        <Label htmlFor="amount" className="text-base font-semibold">Transaction Amount (₦)</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="mt-2 text-lg"
                        />
                    </div>

                    <Tabs value={mode} onValueChange={(v: any) => setMode(v)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="default">Default Templates</TabsTrigger>
                            <TabsTrigger value="custom">Custom Conditions</TabsTrigger>
                        </TabsList>

                        <TabsContent value="default" className="space-y-4">
                            <div className="space-y-2">
                                <Label>Select Category Template</Label>
                                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a template..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {templates.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.name} ({t.category})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedTemplate && (
                                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                                    <h4 className="font-semibold text-sm">Defined Steps:</h4>
                                    <ul className="space-y-2">
                                        {selectedTemplate.steps.map((step: string, i: number) => (
                                            <li key={i} className="flex items-center gap-2 text-sm">
                                                <span className="bg-primary/10 text-primary w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
                                                    {i + 1}
                                                </span>
                                                {step}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="custom" className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label>Define Your Steps</Label>
                                <Button variant="outline" size="sm" onClick={handleAddStep}>
                                    <Plus className="h-3 w-3 mr-1" /> Add Step
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {customSteps.map((step, index) => (
                                    <div key={index} className="flex gap-2">
                                        <div className="flex items-center justify-center bg-muted w-8 h-10 rounded text-sm font-medium shrink-0">
                                            {index + 1}
                                        </div>
                                        <Input
                                            placeholder={`Step ${index + 1}`}
                                            value={step}
                                            onChange={(e) => handleStepChange(index, e.target.value)}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive shrink-0"
                                            onClick={() => handleRemoveStep(index)}
                                            disabled={customSteps.length <= 1}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="mt-6 p-4 border rounded-lg bg-yellow-500/5 border-yellow-500/20">
                        <h4 className="font-semibold text-sm flex items-center gap-2 mb-2 text-yellow-700">
                            <AlertTriangle className="h-4 w-4" />
                            Terms of Service Agreement
                        </h4>
                        <ScrollArea className="h-24 rounded border bg-background p-2 text-xs text-muted-foreground mb-3">
                            {mode === 'default' && selectedTemplate ? selectedTemplate.tos_text :
                                "By proceeding with this custom escrow agreement, both parties agree to fulfill the steps as defined above. Funds will be released only upon mutual confirmation of each step. MarketBridge reserves the right to mediate disputes based on the evidence provided in this chat."}
                        </ScrollArea>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="tos" checked={tosAccepted} onCheckedChange={(c) => setTosAccepted(!!c)} />
                            <label
                                htmlFor="tos"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                I agree to the Terms of Service and Escrow Conditions
                            </label>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading || !tosAccepted}>
                        {loading ? 'Creating...' : 'Create Escrow Agreement'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
