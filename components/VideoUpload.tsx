'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Loader2, Upload, X, Video as VideoIcon, Play } from 'lucide-react';

interface VideoUploadProps {
    onVideosSelected: (urls: string[]) => void;
    defaultVideos?: string[];
    maxVideos?: number;
    bucketName?: string;
}

export function VideoUpload({
    onVideosSelected,
    defaultVideos = [],
    maxVideos = 3,
    bucketName = 'listings-videos'
}: VideoUploadProps) {
    const [videos, setVideos] = useState<string[]>(defaultVideos);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const files = Array.from(e.target.files);

        if (videos.length + files.length > maxVideos) {
            alert(`You can only upload a maximum of ${maxVideos} videos.`);
            return;
        }

        setUploading(true);
        const newUrls: string[] = [];

        try {
            for (const file of files) {
                // Validate file type
                if (!file.type.startsWith('video/')) {
                    alert(`File ${file.name} is not a video.`);
                    continue;
                }

                // Validate file size (e.g., 50MB for videos)
                if (file.size > 50 * 1024 * 1024) {
                    alert(`File ${file.name} is too large (max 50MB).`);
                    continue;
                }

                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                setUploadProgress(0);

                const { error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    throw uploadError;
                }

                const { data } = supabase.storage
                    .from(bucketName)
                    .getPublicUrl(filePath);

                newUrls.push(data.publicUrl);
            }

            const updatedVideos = [...videos, ...newUrls];
            setVideos(updatedVideos);
            onVideosSelected(updatedVideos);
        } catch (error: unknown) {
            console.error('Error uploading video:', error);
            alert('Error uploading video. Please try again.');
        } finally {
            setUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeVideo = (index: number) => {
        const newVideos = videos.filter((_, i) => i !== index);
        setVideos(newVideos);
        onVideosSelected(newVideos);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {videos.map((url, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden border bg-muted group">
                        <video
                            src={url}
                            controls
                            className="w-full h-full object-cover"
                            preload="metadata"
                        >
                            Your browser does not support the video tag.
                        </video>
                        <button
                            type="button"
                            onClick={() => removeVideo(index)}
                            className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}

                {videos.length < maxVideos && (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                        {uploading ? (
                            <div className="flex flex-col items-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                                {uploadProgress > 0 && (
                                    <span className="text-xs text-muted-foreground">{uploadProgress}%</span>
                                )}
                            </div>
                        ) : (
                            <>
                                <VideoIcon className="h-8 w-8 text-muted-foreground mb-2" />
                                <span className="text-xs text-muted-foreground font-medium">Upload Video</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                multiple
                className="hidden"
                disabled={uploading}
            />

            <p className="text-xs text-muted-foreground">
                Supported formats: MP4, MOV, AVI, WEBM. Max size: 50MB per video. Max {maxVideos} videos.
            </p>
        </div>
    );
}
