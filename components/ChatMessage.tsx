import React, { useState } from 'react';
import { Message, MessageRole } from '../types';
import { UserIcon, AgentIcon, ThumbsUpIcon, ThumbsDownIcon } from './icons';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Sparkles } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  modelName?: string;
  onReopenPreview?: (htmlContent: string) => void;
}

const ImageDisplay: React.FC<{ src: string; alt: string }> = ({ src, alt }) => (
  <div className="mt-2">
    <img src={src} alt={alt} className="max-w-xs md:max-w-sm rounded-lg border border-zinc-700" />
  </div>
);

const ChatMessage: React.FC<ChatMessageProps> = ({ message, modelName, onReopenPreview }) => {
  const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null);
  const isAssistant = message.role === MessageRole.ASSISTANT;

  const handleFeedback = (newFeedback: 'good' | 'bad') => {
    setFeedback(current => current === newFeedback ? null : newFeedback);
  };

  return (
    <div className={`flex items-start gap-4 my-8`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isAssistant ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-800 text-zinc-300'}`}>
        {isAssistant ? <Sparkles size={18} /> : <UserIcon />}
      </div>
      <div className={`w-full max-w-full`}>
        {isAssistant && (
          <div className='flex items-center gap-2 mb-2'>
            <span className='font-semibold text-zinc-200'>Code assistant</span>
            <span className='text-xs text-zinc-500'>{modelName}</span>
          </div>
        )}
        <div className={isAssistant ? 'text-zinc-300 glassmorphism p-4 rounded-lg' : 'text-zinc-100 pt-1'}>
          <MarkdownRenderer content={message.content} onReopenPreview={onReopenPreview} />
        </div>

        {message.originalImageUrl && <ImageDisplay src={message.originalImageUrl} alt="User uploaded image" />}
        {message.isEditingImage && (
          <div className="flex items-center gap-4 p-4 bg-zinc-800/80 rounded-lg mt-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Editing image...</span>
          </div>
        )}
        {message.imageUrl && <ImageDisplay src={`data:image/png;base64,${message.imageUrl}`} alt="Generated image" />}
        {message.isGeneratingVideo && (
          <div className="flex items-center gap-4 p-4 bg-zinc-800/80 rounded-lg">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>{message.content || 'Generating video... This can take a few minutes.'}</span>
          </div>
        )}
        {message.videoUrl && (
          <div>
            <p className="mb-4 text-zinc-300">{message.content}</p>
            <video src={message.videoUrl} controls className="w-full rounded-lg bg-black" />
          </div>
        )}
        {isAssistant && message.content && !message.isGeneratingVideo && !message.isEditingImage && !message.imageUrl && (
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => handleFeedback('good')}
              className={`p-1.5 rounded-md transition-colors ${feedback === 'good' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:bg-zinc-800'}`}
            >
              <ThumbsUpIcon />
            </button>
            <button
              onClick={() => handleFeedback('bad')}
              className={`p-1.5 rounded-md transition-colors ${feedback === 'bad' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:bg-zinc-800'}`}
            >
              <ThumbsDownIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;