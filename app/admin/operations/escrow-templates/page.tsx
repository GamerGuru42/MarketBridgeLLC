'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Trash, Edit, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EscrowTemplate {
    id: string;
    category: string;
    name: string;
    steps: string[];
    tos_text: string;
    created_at: string;
}

export default function EscrowTemplatesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [templates, setTemplates] = useState<EscrowTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EscrowTemplate | null>(null);

    // Form State
    const [category, setCategory] = useState('');
    const [name, setName] = useState('');
    const [steps, setSteps] = useState<string[]>(['']);
    const [tosText, setTosText] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user && !['operations_admin', 'admin', 'ceo', 'cofounder'].includes(user.role)) {
            router.push('/admin');
            return;
        }

        if (user) {
            fetchTemplates();
        }
    }, [user, authLoading]);

    const fetchTemplates = async () => {
        try {
            const { data, error } = await supabase
                .from('escrow_templates')
                .select('*')
                .order('category', { ascending: true });

            if (error) throw error;
            setTemplates(data || []);
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStep = () => {
        setSteps([...steps, '']);
    };

    const handleRemoveStep = (index: number) => {
        const newSteps = [...steps];
        newSteps.splice(index, 1);
        setSteps(newSteps);
    };

    const handleStepChange = (index: number, value: string) => {
        const newSteps = [...steps];
        newSteps[index] = value;
        setSteps(newSteps);
    };

    const resetForm = () => {
        setCategory('');
        setName('');
        setSteps(['']);
        setTosText('');
        setEditingTemplate(null);
    };

    const handleEdit = (template: EscrowTemplate) => {
        setEditingTemplate(template);
        setCategory(template.category);
        setName(template.name);
        setSteps(template.steps);
        setTosText(template.tos_text);
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!category || !name || steps.some(s => !s.trim()) || !tosText) {
            alert('Please fill in all fields before saving.');
            return;
        }

        try {
            const templateData = {
                category,
                name,
                steps: steps.filter(s => s.trim()),
                tos_text: tosText,
                created_by: user?.id,
            };

            let error;
            if (editingTemplate) {
                const { error: updateError } = await supabase
                    .from('escrow_templates')
                    .update(templateData)
                    .eq('id', editingTemplate.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('escrow_templates')
                    .insert(templateData);
                error = insertError;
            }

            if (error) throw error;

            setIsDialogOpen(false);
            resetForm();
            fetchTemplates();
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Failed to save template. Please try again.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            const { error } = await supabase
                .from('escrow_templates')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
        }
    };

    if (loading) return <div className="p-8">Loading templates...</div>;

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Escrow Templates</h1>
                    <p className="text-muted-foreground">Manage default conditions and TOS for Smart Escrow</p>
                </div>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Category</TableHead>
                                <TableHead>Template Name</TableHead>
                                <TableHead>Steps</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {templates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No templates found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                templates.map((template) => (
                                    <TableRow key={template.id}>
                                        <TableCell className="font-medium capitalize">{template.category}</TableCell>
                                        <TableCell>{template.name}</TableCell>
                                        <TableCell>{template.steps.length} Steps</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(template.id)}>
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
            }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
                        <DialogDescription>
                            Define the default steps and terms for this category.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <Input
                                    placeholder="e.g. Electronics"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Template Name</label>
                                <Input
                                    placeholder="e.g. Standard Electronics Sale"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium">Escrow Steps</label>
                                <Button variant="outline" size="sm" onClick={handleAddStep}>
                                    <Plus className="h-3 w-3 mr-1" /> Add Step
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {steps.map((step, index) => (
                                    <div key={index} className="flex gap-2">
                                        <div className="flex items-center justify-center bg-muted w-8 h-10 rounded text-sm font-medium">
                                            {index + 1}
                                        </div>
                                        <Input
                                            placeholder={`Step ${index + 1} description`}
                                            value={step}
                                            onChange={(e) => handleStepChange(index, e.target.value)}
                                        />
                                        {steps.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-destructive"
                                                onClick={() => handleRemoveStep(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Terms of Service (TOS)</label>
                            <Textarea
                                placeholder="Enter the specific terms for this category..."
                                value={tosText}
                                onChange={(e) => setTosText(e.target.value)}
                                rows={6}
                            />
                            <p className="text-xs text-muted-foreground">
                                Both buyer and seller must agree to these terms before the escrow begins.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Template
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
