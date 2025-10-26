"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { cn } from "../../lib/utils";
import {
    ImageIcon,
    ArrowUpIcon,
    Paperclip,
    XIcon,
    LoaderIcon,
    Mic,
    TerminalIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "./textarea";
import { MODELS } from '../../constants';

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const adjustHeight = useCallback((reset?: boolean) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        if (reset) {
            textarea.style.height = `${minHeight}px`;
            return;
        }
        textarea.style.height = `${minHeight}px`;
        const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY));
        textarea.style.height = `${newHeight}px`;
    }, [minHeight, maxHeight]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) textarea.style.height = `${minHeight}px`;
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

interface AnimatedAIChatProps {
    onSendMessage: (message: string, image?: { data: string; mimeType: string } | null) => void;
    onTranscribeAudio: (audioBase64: string, mimeType: string) => void;
    isLoading: boolean;
    showHero: boolean;
    model: string;
    onModelChange: (model: string) => void;
    onError: (message: string) => void;
    onOpenTerminal?: () => void;
}

export default function AnimatedAIChat({ onSendMessage, onTranscribeAudio, isLoading, showHero, model, onModelChange, onError, onOpenTerminal }: AnimatedAIChatProps) {
    const [value, setValue] = useState("");
    const [image, setImage] = useState<{ data: string, mimeType: string, name: string } | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 48, maxHeight: 200 });

    const handleSend = () => {
        if ((value.trim() || image) && !isLoading) {
            const imagePayload = image ? { data: image.data, mimeType: image.mimeType } : null;
            onSendMessage(value, imagePayload);
            setValue("");
            setImage(null);
            adjustHeight(true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImage({
                    data: e.target?.result as string,
                    mimeType: file.type,
                    name: file.name,
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleMicClick = async () => {
        if (isLoading) return;

        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) audioChunksRef.current.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        if (reader.result) {
                            const base64String = (reader.result as string).split(',')[1];
                            onTranscribeAudio(base64String, audioBlob.type);
                        }
                    };
                    reader.readAsDataURL(audioBlob);
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Error accessing microphone:", err);
                let message = "Could not access the microphone.";
                if (err instanceof Error && err.name === "NotAllowedError") {
                    message = "Microphone access was denied. Please check your browser's permissions for this site.";
                }
                onError(message);
            }
        }
    };

    const promptSuggestions = [
        { label: "Explain a topic", value: "Explain " },
        { label: "Create a plan", value: "Create a plan to " },
        { label: "Write code", value: "Write code for " },
        { label: "Improve text", value: "Improve this text: " },
        { label: "Summarize text", value: "Summarize: " },
    ];

    return (
        <div className="w-full max-w-4xl mx-auto relative">
            <motion.div 
                className="relative z-10 space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <AnimatePresence>
                    {showHero && (
                        <motion.div 
                            className="text-center space-y-3"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                        >
                            <h1 className="text-3xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-200 to-zinc-500 pb-1">
                                How can I help today?
                            </h1>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div 
                    className="relative glassmorphism rounded-xl shadow-2xl shadow-black/50"
                    initial={{ scale: 0.98 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <AnimatePresence>
                        {image && (
                            <motion.div 
                                className="p-3 border-b border-zinc-800"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <div className="flex items-center gap-2 text-xs bg-zinc-900/80 py-1.5 px-3 rounded-lg text-zinc-300">
                                    <ImageIcon className="w-4 h-4 text-zinc-500" />
                                    <span className="truncate">{image.name}</span>
                                    <button onClick={() => setImage(null)} className="ml-auto text-zinc-500 hover:text-white transition-colors">
                                        <XIcon className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="p-2">
                        <Textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => { setValue(e.target.value); adjustHeight(); }}
                            onKeyDown={handleKeyDown}
                            placeholder={isRecording ? "Recording... Click mic to stop." : "e.g. Create a simple portfolio website for a photographer..."}
                            containerClassName="w-full"
                            className="w-full p-2 resize-none bg-transparent border-none text-zinc-200 text-sm focus:outline-none placeholder:text-zinc-500 min-h-[48px]"
                            style={{ overflow: "hidden" }}
                            showRing={false}
                            disabled={isLoading || isRecording}
                        />
                    </div>

                    <div className="p-3 border-t border-zinc-800 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                            <motion.button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                whileTap={{ scale: 0.94 }}
                                className="p-2 text-zinc-400 hover:text-white rounded-md transition-colors"
                                disabled={isLoading || isRecording}
                            >
                                <Paperclip className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                                type="button"
                                onClick={handleMicClick}
                                whileTap={{ scale: 0.94 }}
                                className={cn("p-2 text-zinc-400 hover:text-white rounded-md transition-colors", isRecording && "bg-red-900/50 text-red-300")}
                                disabled={isLoading}
                            >
                                <Mic className={cn("w-4 h-4", isRecording && "animate-pulse")} />
                            </motion.button>
                            {onOpenTerminal && (
                                <motion.button
                                    type="button"
                                    onClick={onOpenTerminal}
                                    whileTap={{ scale: 0.94 }}
                                    className="p-2 text-zinc-400 hover:text-white rounded-md transition-colors"
                                    title="Open Terminal"
                                >
                                    <TerminalIcon className="w-4 h-4" />
                                </motion.button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={model}
                                onChange={(e) => onModelChange(e.target.value)}
                                className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-md focus:ring-violet-500 focus:border-violet-500 block w-full p-1.5 appearance-none"
                            >
                                {MODELS.map((m) => (<option key={m.model} value={m.model}>{m.name}</option>))}
                            </select>

                            <motion.button
                                type="button"
                                onClick={handleSend}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={isLoading || isRecording || (!value.trim() && !image)}
                                className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", "flex items-center gap-2",
                                    (value.trim() || image) ? "bg-gradient-to-r from-orange-500 to-blue-600 text-white" : "bg-zinc-800 text-zinc-500"
                                )}
                            >
                                {isLoading ? (<LoaderIcon className="w-4 h-4 animate-spin" />) : (<ArrowUpIcon className="w-4 h-4" />)}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                <AnimatePresence>
                    {showHero && (
                        <motion.div
                            className="flex flex-wrap items-center justify-center gap-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            {promptSuggestions.map((suggestion) => (
                                <motion.button
                                    key={suggestion.label}
                                    onClick={() => setValue(suggestion.value)}
                                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-md text-xs text-zinc-400 hover:text-zinc-200 transition-all"
                                    whileHover={{ y: -2 }}
                                >
                                    {suggestion.label}
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}