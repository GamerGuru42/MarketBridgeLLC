'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Upload, X, Video as VideoIcon } from 'lucide-react';

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
    const supabase = createClient();
    const [videos, setVideos] = useState<string[]>(defaultVideos);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const files = Array.from(e.target.files);

        if (videos.length + files.length > maxVideos) {
            setErrorMsg(`Maximum ${maxVideos} videos allowed.`);
            return;
        }

        setErrorMsg(null);

        setUploading(true);
        const newUrls: string[] = [];

        try {
            for (const file of files) {
                if (!file.type.startsWith('video/')) {
                    setErrorMsg(`"${file.name}" is not a valid video file.`);
                    continue;
                }

                if (file.size > 50 * 1024 * 1024) {
                    setErrorMsg(`"${file.name}" is too large. Max 50 MB per video.`);
                    continue;
                }

                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error("Authentication session expired. Please log in again.");
                const user = session.user;

                const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
                const fileName = `${Math.random().toString(36).substring(2, 10)}_${Date.now()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                setUploadProgress(0);
                const { error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false
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

            const updatedVideos = [...videos, ...newUrls];
            setVideos(updatedVideos);
            onVideosSelected(updatedVideos);
        } catch (error: any) {
            console.error('Error uploading video:', error);
            setErrorMsg(error.message || 'Upload failed. Please try again.');
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
                            aria-label="Remove video"
                            title="Remove video"
                            onClick={() => removeVideo(index)}
                            className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}

                {videos.length < maxVideos && (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="relative aspect-video rounded-lg border-2 border-dashed border-zinc-200 hover:border-[#FF6200]/50 hover:bg-[#FF6200]/5 transition-all flex flex-col items-center justify-center gap-3 group overflow-hidden bg-[#FAFAFA]/50"
                    >
                        {uploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-[#FF6200]" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6200] animate-pulse">Syncing Video...</span>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 rounded-2xl bg-white group-hover:bg-[#FF6200]/10 transition-colors shadow-sm">
                                    <VideoIcon className="h-6 w-6 text-zinc-400 group-hover:text-[#FF6200] transition-colors" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-black transition-colors">Add Video Feed</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                title="Upload video files"
                aria-label="Upload video files"
                onChange={handleFileChange}
                accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                multiple
                className="hidden"
                disabled={uploading}
            />

            {errorMsg && (
                <p className="text-xs text-red-400 font-bold flex items-center gap-1.5">
                    <span>⚠️</span> {errorMsg}
                </p>
            )}

            <p className="text-xs text-muted-foreground italic">
                Supported formats: MP4, MOV, AVI, WEBM. Max size: 50MB per video.
            </p>
        </div>
    );
}