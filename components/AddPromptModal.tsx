import React, { useState, useEffect } from 'react';
import { PromptTemplate } from '../types';
import { XIcon } from './icons';

interface AddPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: PromptTemplate) => void;
}

export const AddPromptModal: React.FC<AddPromptModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setPrompt('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (title.trim() && prompt.trim()) {
      onSave({ title, prompt });
      onClose();
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-[#1C1C1E] border border-zinc-800 rounded-lg shadow-2xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
            <XIcon />
        </button>

        <h2 className="text-xl font-semibold text-zinc-100 mb-6">Add Custom Prompt</h2>
        
        <div className="space-y-6">
            <div>
                <label htmlFor="prompt-title" className="block text-sm font-medium text-zinc-400 mb-2">
                    Template Name
                </label>
                <input
                    id="prompt-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., 'Weekly Report Summary'"
                    className="w-full p-2.5 text-zinc-200 bg-zinc-900 border border-zinc-700 rounded-md focus:ring-2 focus:ring-violet-500 focus:outline-none placeholder-zinc-500"
                />
            </div>
            <div>
                <label htmlFor="prompt-content" className="block text-sm font-medium text-zinc-400 mb-2">
                    Prompt Content
                </label>
                <textarea
                    id="prompt-content"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your prompt template. Use [placeholder] for variables."
                    className="w-full p-2.5 text-zinc-200 bg-zinc-900 border border-zinc-700 rounded-md resize-y focus:ring-2 focus:ring-violet-500 focus:outline-none placeholder-zinc-500"
                    rows={5}
                />
            </div>
        </div>
        
        <div className="mt-8 flex justify-end gap-4">
            <button
                onClick={onClose}
                className="px-5 py-2 text-sm font-medium bg-zinc-800 text-zinc-300 rounded-md hover:bg-zinc-700 transition-colors"
            >
                Cancel
            </button>
            <button
                onClick={handleSave}
                disabled={!title.trim() || !prompt.trim()}
                className="px-5 py-2 text-sm font-medium bg-white text-black rounded-md hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Save Template
            </button>
        </div>
      </div>
    </div>
  );
};