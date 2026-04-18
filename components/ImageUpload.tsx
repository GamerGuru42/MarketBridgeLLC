'use client';

import React, { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Upload, X, Image as ImageIcon, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from '@/contexts/ToastContext';
import imageCompression from 'browser-image-compression';

interface ImageUploadProps {
    onImagesSelected: (urls: string[]) => void;
    defaultImages?: string[];
    maxImages?: number;
    bucketName?: string;
    isIDCard?: boolean;
}

interface UploadSlot {
    id: string;
    url?: string;
    status: 'idle' | 'uploading' | 'success' | 'error';
    errorMsg?: string;
    file?: File;
}

export function ImageUpload({
    onImagesSelected,
    defaultImages = [],
    maxImages = 5,
    bucketName = 'listings',
    isIDCard = false
}: ImageUploadProps) {
    const supabase = createClient();
    const { toast } = useToast();
    const [slots, setSlots] = useState<UploadSlot[]>(() =>
        defaultImages.map(url => ({ id: url, url, status: 'success' as const }))
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    const updateSlot = (id: string, patch: Partial<UploadSlot>) => {
        setSlots(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
    };

    const uploadFile = async (file: File, slotId: string) => {
        updateSlot(slotId, { status: 'uploading', errorMsg: undefined });

        try {
            // Validate type
            if (!file.type.startsWith('image/')) {
                throw new Error(`"${file.name}" is not a valid image file.`);
            }

            // Validate size (max 10MB raw, compress to target ~2MB)
            if (file.size > 10 * 1024 * 1024) {
                throw new Error(`"${file.name}" exceeds 10 MB. Please use a smaller image.`);
            }

            // ID card orientation check
            if (isIDCard) {
                const img = new globalThis.Image();
                const objectUrl = URL.createObjectURL(file);
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = () => reject(new Error('Could not read image'));
                    img.src = objectUrl;
                });
                if (img.height > img.width * 1.5) {
                    URL.revokeObjectURL(objectUrl);
                    throw new Error('Image does not appear to be a landscape student ID card. Upload a horizontal photo of your card.');
                }
                URL.revokeObjectURL(objectUrl);
            }

            // Convert to WebP with compression
            const options = {
                maxSizeMB: 0.8,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                fileType: 'image/webp',
            };
            const convertedBlob = await imageCompression(file, options);

            // PROACTIVE SESSION CHECK
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error("Authentication session expired. Please refresh the page and try again.");
            }

            // Upload with 3-attempt retry
            const user = session.user;
            const fileName = `${Math.random().toString(36).substring(2, 10)}_${Date.now()}.webp`;
            const filePath = `${user.id}/${fileName}`;

            let uploadError: any = null;
            for (let attempt = 1; attempt <= 3; attempt++) {
                const { error } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, convertedBlob, {
                        cacheControl: '3600',
                        upsert: true,
                        contentType: 'image/webp'
                    });
                uploadError = error;
                if (!error) break;
                if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt));
            }

            if (uploadError) {
                if (uploadError.message?.includes('bucket not found') || uploadError.message?.includes('404')) {
                    throw new Error(`Storage bucket "${bucketName}" not fully initialized on this instance. Please contact HQ support.`);
                }
                if (uploadError.message?.includes('new row violates row-level security')) {
                    throw new Error("Authorization check rejected the upload. Please re-sign into your Seller session.");
                }
                throw new Error(`Upload failed after 3 attempts: ${uploadError.message}`);
            }

            const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
            if (!data?.publicUrl) throw new Error('Failed to get public URL after upload.');

            updateSlot(slotId, { status: 'success', url: data.publicUrl, id: data.publicUrl });

            // Notify parent with all successful URLs
            setSlots(prev => {
                const updated = prev.map(s => s.id === slotId ? { ...s, status: 'success' as const, url: data.publicUrl, id: data.publicUrl } : s);
                const urls = updated.filter(s => s.status === 'success' && s.url).map(s => s.url!);
                onImagesSelected(urls);
                return updated;
            });

        } catch (err: any) {
            console.error('Upload error:', err);
            const message = err?.message || 'Upload failed';
            updateSlot(slotId, { status: 'error', errorMsg: message });
            // Show toast for immediate feedback
            try { toast(message, 'error'); } catch (e) { /* swallow if toast unavailable */ }
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const files = Array.from(e.target.files);

        const successCount = slots.filter(s => s.status === 'success').length;
        if (successCount + files.length > maxImages) {
            try { toast(`You can only upload a maximum of ${maxImages} images. You already have ${successCount}.`, 'error'); } catch (e) { }
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Create pending slots
        const newSlots: UploadSlot[] = files.map(file => ({
            id: `pending_${Math.random().toString(36).slice(2)}`,
            status: 'uploading' as const,
            file
        }));
        setSlots(prev => [...prev, ...newSlots]);
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Upload each file
        await Promise.all(newSlots.map((slot, i) => uploadFile(files[i], slot.id)));
        // After all attempts, show success toast summarizing state
        try { toast('Images uploaded (or queued) successfully.', 'success'); } catch (e) { }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files?.length) {
            const syntheticEvent = { target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleFileChange(syntheticEvent);
        }
    };

    const retrySlot = (slot: UploadSlot) => {
        if (slot.file) uploadFile(slot.file, slot.id);
    };

    const removeSlot = (slotId: string) => {
        setSlots(prev => {
            const updated = prev.filter(s => s.id !== slotId);
            const urls = updated.filter(s => s.status === 'success' && s.url).map(s => s.url!);
            onImagesSelected(urls);
            return updated;
        });
    };

    const successCount = slots.filter(s => s.status === 'success').length;
    const canAddMore = successCount < maxImages;

    return (
        <div className="space-y-4">
            <div className={cn(
                'grid gap-3',
                maxImages === 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'
            )}>
                {slots.map((slot) => (
                    <div
                        key={slot.id}
                        className={cn(
                            'relative rounded-2xl overflow-hidden border bg-zinc-900 group transition-all',
                            maxImages === 1 ? 'h-40 w-full' : 'aspect-square',
                            slot.status === 'error' ? 'border-[#FF6200]/40' : 'border-white/5'
                        )}
                    >
                        {slot.status === 'success' && slot.url && (
                            <>
                                <Image src={slot.url} alt="Upload" fill className="object-cover" />
                                <button
                                    type="button"
                                    title="Remove Image"
                                    aria-label="Remove Image"
                                    onClick={() => removeSlot(slot.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#FF6200]"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                                <div className="absolute bottom-2 right-2 h-5 w-5 bg-[#FF6200] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <CheckCircle className="h-3 w-3 text-black" />
                                </div>
                            </>
                        )}

                        {slot.status === 'uploading' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                                <Loader2 className="h-6 w-6 animate-spin text-[#FF6200]" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-2">
                                    {isIDCard ? 'Verifying...' : 'Uploading...'}
                                </span>
                            </div>
                        )}

                        {slot.status === 'error' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-3 text-center">
                                <AlertCircle className="h-5 w-5 text-[#FF6200] mb-1.5 shrink-0" />
                                <p className="text-[9px] text-zinc-400 leading-tight line-clamp-3 mb-2">{slot.errorMsg}</p>
                                <button
                                    type="button"
                                    onClick={() => retrySlot(slot)}
                                    className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[#FF6200] hover:text-white transition-colors"
                                >
                                    <RefreshCw className="h-3 w-3" /> Retry
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeSlot(slot.id)}
                                    className="mt-1 text-[8px] font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-400"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {/* Add More Button */}
                {canAddMore && (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={handleDrop}
                        className={cn(
                            'rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.02] hover:border-[#FF6200]/40 hover:text-[#FF6200] transition-all group',
                            maxImages === 1 ? 'h-40 w-full' : 'aspect-square'
                        )}
                    >
                        <div className="p-3 rounded-xl bg-white/[0.02] group-hover:bg-[#FF6200]/10 transition-colors mb-2">
                            <Upload className="h-5 w-5 text-zinc-600 group-hover:text-[#FF6200] transition-colors" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300 transition-colors text-center px-2">
                            {slots.length === 0 ? 'CLICK OR DROP' : 'ADD MORE'}
                        </span>
                        <span className="text-[8px] text-zinc-700 mt-1">{successCount}/{maxImages}</span>
                    </div>
                )}
            </div>

            <input
                type="file"
                title="Upload Images"
                aria-label="Upload Images"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple={maxImages > 1}
                className="hidden"
            />

            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                Max {maxImages} image{maxImages > 1 ? 's' : ''} · Auto-converted to WebP · Max 10 MB each
            </p>
        </div>
    );
}
