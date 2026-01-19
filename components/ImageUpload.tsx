'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
    onImagesSelected: (urls: string[]) => void;
    defaultImages?: string[];
    maxImages?: number;
    bucketName?: string;
}

export function ImageUpload({
    onImagesSelected,
    defaultImages = [],
    maxImages = 5,
    bucketName = 'listings'
}: ImageUploadProps) {
    const [images, setImages] = useState<string[]>(defaultImages);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const files = Array.from(e.target.files);

        if (images.length + files.length > maxImages) {
            alert(`You can only upload a maximum of ${maxImages} images.`);
            return;
        }

        setUploading(true);
        const newUrls: string[] = [];

        try {
            for (const file of files) {
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    alert(`File ${file.name} is not an image.`);
                    continue;
                }

                // Validate file size (e.g., 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert(`File ${file.name} is too large (max 5MB).`);
                    continue;
                }

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Authentication required for upload.");

                const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
                // Remove special chars from filename to prevent path issues
                const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const fileName = `${Math.random().toString(36).substring(2, 10)}_${Date.now()}.${fileExt}`;

                // Upload to user-specific folder for RLS compliance
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (uploadError) {
                    throw new Error(`Upload failed: ${uploadError.message}`);
                }

                const { data } = supabase.storage
                    .from(bucketName)
                    .getPublicUrl(filePath);

                if (!data || !data.publicUrl) {
                    throw new Error("Failed to retrieve public URL.");
                }

                newUrls.push(data.publicUrl);
            }

            const updatedImages = [...images, ...newUrls];
            setImages(updatedImages);
            onImagesSelected(updatedImages);
        } catch (error: any) {
            console.error('Error uploading image:', error);
            alert(error.message || 'Error uploading image. Please check your internet connection or permissions.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        setImages(newImages);
        onImagesSelected(newImages);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-muted group">
                        <Image
                            src={url}
                            alt={`Uploaded image ${index + 1}`}
                            fill
                            className="object-cover"
                        />
                        <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}

                {images.length < maxImages && (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onDrop={(e: React.DragEvent<HTMLDivElement>) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                // Create a synthetic event to reuse handleFileChange logic
                                const syntheticEvent = {
                                    target: { files: e.dataTransfer.files }
                                } as unknown as React.ChangeEvent<HTMLInputElement>;

                                handleFileChange(syntheticEvent);
                            }
                        }}
                        className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 hover:border-[#FFB800]/50 hover:text-[#FFB800] transition-all"
                    >
                        {uploading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        ) : (
                            <>
                                <Upload className="h-8 w-8 text-muted-foreground mb-2 group-hover:text-[#FFB800] transition-colors" />
                                <span className="text-xs text-muted-foreground font-medium group-hover:text-[#FFB800] transition-colors">
                                    Click or Drag Images
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading}
            />

            <p className="text-xs text-muted-foreground">
                Supported formats: JPG, PNG, WEBP. Max size: 5MB.
            </p>
        </div>
    );
}
