import React from 'react';
import { Conversation } from '../types';
import { MessageSquareIcon, XIcon, TrashIcon } from 'lucide-react';
import { InteractiveHoverButton } from './ui/interactive-hover-button';

interface ChatHistoryProps {
    conversations: Conversation[];
    activeConversationId: string | null;
    onSelectConversation: (id: string) => void;
    onNewConversation: () => void;
    onDeleteConversation: (id: string) => void;
    onClose: () => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
    conversations,
    activeConversationId,
    onSelectConversation,
    onNewConversation,
    onDeleteConversation,
    onClose
}) => {
    
    const sortedConversations = [...conversations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="flex flex-col h-full glassmorphism text-zinc-300">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between gap-2">
                <div className="flex-grow">
                    <InteractiveHoverButton text="+ New Chat" onClick={onNewConversation} />
                </div>
                <button 
                    onClick={onClose} 
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-md transition-colors flex-shrink-0"
                    aria-label="Close menu"
                >
                    <XIcon className="w-5 h-5" />
                </button>
            </div>
            <nav className="flex-grow overflow-y-auto p-2 space-y-1">
                {sortedConversations.map((convo) => (
                    <div key={convo.id} className="relative group">
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                onSelectConversation(convo.id);
                            }}
                            className={`w-full flex items-center gap-3 pl-3 pr-8 py-2 text-sm rounded-md transition-colors ${
                                activeConversationId === convo.id
                                    ? 'bg-zinc-800 text-white'
                                    : 'text-zinc-400 hover:bg-zinc-800/50'
                            }`}
                        >
                            <MessageSquareIcon className="w-4 h-4" />
                            <span className="truncate flex-grow">{convo.title}</span>
                        </a>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Are you sure you want to delete this chat?')) {
                                    onDeleteConversation(convo.id);
                                }
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-red-400 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Delete chat"
                        >
                            <TrashIcon />
                        </button>
                    </div>
                ))}
            </nav>
        </div>
    );
};

export default ChatHistory;