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
                if (!file.type.startsWith('video/')) {
                    alert(`File ${file.name} is not a video.`);
                    continue;
                }

                if (file.size > 50 * 1024 * 1024) {
                    alert(`File ${file.name} is too large (max 50MB).`);
                    continue;
                }

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Authentication required for upload.");

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
            alert(error.message || 'Error uploading video. Please check your internet connection or permissions.');
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
                        className="aspect-video rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.03] hover:border-[#FF6200]/40 group transition-all"
                    >
                        {uploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-[#FF6200]" />
                                <span className="text-[10px] uppercase font-black tracking-widest text-[#FF6200]">Streaming Data...</span>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 rounded-xl bg-white/[0.02] group-hover:bg-[#FF6200]/10 transition-colors mb-3">
                                    <VideoIcon className="h-6 w-6 text-zinc-600 group-hover:text-[#FF6200] transition-colors" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group-hover:text-white transition-colors">Initialize Feed</span>
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