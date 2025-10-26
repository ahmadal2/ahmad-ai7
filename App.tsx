import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chat } from '@google/genai';
import { Message, MessageRole, Conversation } from './types';
import { createChatSession, generateVideo, editImage, transcribeAudio } from './services/geminiService';
import { createClaudeChatSession } from './services/claudeService';
import AnimatedAIChat from './components/ui/animated-ai-chat';
import ChatMessage from './components/ChatMessage';
import ChatHistory from './components/ChatHistory';
import { VeoControls } from './components/VeoControls';
import { DownloadIcon, MenuIcon, Code, Eye, Maximize, XIcon, Minimize2 } from 'lucide-react';
import { MODELS, CHAT_HISTORY_STORAGE_KEY } from './constants';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import Terminal from './components/Terminal';
import { TerminalService } from './services/terminalService';
import { ReactWebsiteService } from './services/reactWebsiteService';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { CodePreviewPanel } from './components/CodePreviewPanel';
import { cn, isMobileDevice } from './lib/utils';

interface ImagePayload {
  data: string; // data URL
  mimeType: string;
}

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [showPreviewPanel, setShowPreviewPanel] = useState<boolean>(false);
  const [previewTab, setPreviewTab] = useState<'preview' | 'code'>('preview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(MODELS[0].model);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isApiKeySelected, setIsApiKeySelected] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState<boolean>(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);
  const [projectFiles, setProjectFiles] = useState<Record<string, string> | null>(null);

  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          setConversations(parsedHistory);
          setActiveConversationId(parsedHistory[0].id);
        } else {
          handleNewChat();
        }
      } else {
        handleNewChat();
      }
    } catch (e) {
      console.error("Failed to load data from local storage:", e);
      handleNewChat();
    }
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(conversations));
    } else {
      localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
    }
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, showPreviewPanel]);

  useEffect(() => {
    const checkApiKey = async () => {
      if (selectedModel === 'veo-3.1-fast-generate-preview') {
        try {
          const hasKey = await (window as any).aistudio.hasSelectedApiKey();
          setIsApiKeySelected(hasKey);
        } catch (e) {
          console.error("Error checking for API key:", e);
          setIsApiKeySelected(false);
        }
      }
    };
    checkApiKey();
  }, [selectedModel]);

  const handleNewChat = useCallback(() => {
    const newConversation: Conversation = {
      id: `convo-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      model: selectedModel,
    };
    setConversations(prev => [newConversation, ...prev.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())]);
    setActiveConversationId(newConversation.id);
    setPreviewHtml('');
    setShowPreviewPanel(false);
    setError(null);
    chatSessionRef.current = null;
    setIsSidebarOpen(false);
    return newConversation.id;
  }, [selectedModel]);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    const conversation = conversations.find(c => c.id === id);
    const lastMessage = conversation?.messages[conversation.messages.length - 1]?.content || '';
    if (lastMessage.includes('``html')) {
      const htmlBlockStart = lastMessage.indexOf('``html\n');
      const codeAfterStart = lastMessage.substring(htmlBlockStart + '```html\n'.length);
      const htmlBlockEnd = codeAfterStart.indexOf('``');
      const currentHtml = htmlBlockEnd !== -1 ? codeAfterStart.substring(0, htmlBlockEnd) : codeAfterStart;
      setPreviewHtml(currentHtml);
      setShowPreviewPanel(true);
    } else {
      setPreviewHtml('');
      setShowPreviewPanel(false);
    }
    setError(null);
    chatSessionRef.current = null;
    setIsSidebarOpen(false);
  };

  const handleDeleteConversation = (id: string) => {
    const remainingConversations = conversations.filter(c => c.id !== id);
    setConversations(remainingConversations);

    if (activeConversationId === id) {
      if (remainingConversations.length > 0) {
        const sorted = [...remainingConversations].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        handleSelectConversation(sorted[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  const handleSelectApiKey = async () => {
    try {
      await (window as any).aistudio.openSelectKey();
      setIsApiKeySelected(true);
    } catch (e) {
      console.error("Could not open API key dialog", e);
      setError("Failed to open API key selection. Please ensure you are in a supported environment.");
    }
  };

  const updateConversationMessages = useCallback((convoId: string, updateFn: (messages: Message[]) => Message[]) => {
    setConversations(prev =>
      prev.map(c =>
        c.id === convoId ? { ...c, messages: updateFn(c.messages) } : c
      )
    );
  }, []);

  const getAIResponse = async (prompt: string, convoId: string, currentModel: string) => {
    const currentConvo = conversations.find(c => c.id === convoId);
    if (!currentConvo) return;

    // Handle Claude models
    if (currentModel === 'claude-3-5-sonnet-20241022' || currentModel === 'claude-3-opus-20240229') {
        try {
            const claudeResponse = await createClaudeChatSession(currentModel, currentConvo.messages, prompt);
            updateConversationMessages(convoId, (msgs) => [...msgs, { role: MessageRole.ASSISTANT, content: claudeResponse }]);
            
            // Check if the response contains HTML code
            if (claudeResponse.includes('```html')) {
                const htmlBlockStart = claudeResponse.indexOf('```html\n');
                const codeAfterStart = claudeResponse.substring(htmlBlockStart + '```html\n'.length);
                const htmlBlockEnd = codeAfterStart.indexOf('```');
                const htmlContent = htmlBlockEnd !== -1 ? codeAfterStart.substring(0, htmlBlockEnd) : codeAfterStart;
                setPreviewHtml(htmlContent);
                if (!showPreviewPanel) setShowPreviewPanel(true);
            }
            
            // Check if the response mentions creating a React website
            if (ReactWebsiteService.isReactWebsiteRequest(claudeResponse)) {
              handleReactWebsiteGeneration(prompt, claudeResponse);
            }
            
            return;
        } catch (e) {
            let errorMsg = 'An unknown error occurred during the Claude API request.';
            if (e instanceof Error) {
                errorMsg = e.message;
                // Handle rate limit errors specifically
                if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
                    errorMsg = 'Rate limit exceeded. You have exceeded your current quota for the Claude API. Please wait a moment before trying again, or consider upgrading to a paid plan for higher quotas.';
                }
            }
            setError(errorMsg);
            updateConversationMessages(convoId, (msgs) => [...msgs, { role: MessageRole.ASSISTANT, content: `Error: ${errorMsg}` }]);
            return;
        }
    }

    // Handle Gemini models
    try {
      chatSessionRef.current = createChatSession(currentModel, currentConvo.messages);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'An unknown error occurred while initializing the chat session.';
      setError(errorMsg);
      updateConversationMessages(convoId, (msgs) => [...msgs, { role: MessageRole.ASSISTANT, content: `Error: ${errorMsg}` }]);
      setIsLoading(false);
      return;
    }

    try {
      const stream = await chatSessionRef.current.sendMessageStream({ message: prompt });

      let fullResponse = '';
      let htmlContent = '';
      updateConversationMessages(convoId, (msgs) => [...msgs, { role: MessageRole.ASSISTANT, content: '...' }]);

      for await (const chunk of stream) {
        fullResponse += chunk.text;
        updateConversationMessages(convoId, (msgs) => msgs.slice(0, -1).concat({ role: MessageRole.ASSISTANT, content: fullResponse }));

        if (fullResponse.includes('```html')) {
          const htmlBlockStart = fullResponse.indexOf('```html\n');
          const codeAfterStart = fullResponse.substring(htmlBlockStart + '```html\n'.length);
          const htmlBlockEnd = codeAfterStart.indexOf('```');
          htmlContent = htmlBlockEnd !== -1 ? codeAfterStart.substring(0, htmlBlockEnd) : codeAfterStart;
          setPreviewHtml(htmlContent);
          
          // On mobile devices, only show code by default, not the preview
          const isMobile = isMobileDevice();
          if (!showPreviewPanel) setShowPreviewPanel(true);
        }
        
        // Check if the response mentions creating a React website
        if (ReactWebsiteService.isReactWebsiteRequest(fullResponse)) {
          handleReactWebsiteGeneration(prompt, fullResponse);
        }
      }
    } catch (e) {
      let errorMsg = 'An unknown error occurred during the API request.';
      if (e instanceof Error) {
        errorMsg = e.message;
        // Handle rate limit errors specifically
        if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
          errorMsg = 'Rate limit exceeded. You have exceeded your current quota for the Gemini API. Please wait a moment before trying again, or consider upgrading to a paid plan for higher quotas. For more information, visit: https://ai.google.dev/gemini-api/docs/rate-limits';
        }
      }
      setError(errorMsg);
      updateConversationMessages(convoId, msgs => msgs.slice(0, -1).concat({ role: MessageRole.ASSISTANT, content: `Error: ${errorMsg}` }));
    }
  };
  
  const handleVideoGeneration = async (prompt: string, convoId: string) => {
    updateConversationMessages(convoId, msgs => [...msgs, { role: MessageRole.ASSISTANT, content: 'Starting video generation...', isGeneratingVideo: true }]);
    
    try {
      for await (const statusOrUrl of generateVideo(prompt, aspectRatio)) {
        if (statusOrUrl === 'processing') {
          updateConversationMessages(convoId, msgs => msgs.slice(0, -1).concat({ role: MessageRole.ASSISTANT, content: 'Generating video... This can take a few minutes.', isGeneratingVideo: true }));
        } else {
          updateConversationMessages(convoId, msgs => msgs.slice(0, -1).concat({ role: MessageRole.ASSISTANT, content: 'Your video is ready!', videoUrl: statusOrUrl, isGeneratingVideo: false }));
        }
      }
    } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'An unknown error occurred during video generation.';
        setError(errorMsg);
        updateConversationMessages(convoId, msgs => msgs.slice(0, -1).concat({ role: MessageRole.ASSISTANT, content: `Error: ${errorMsg}` }));
    }
  };
  
  const handleImageEditing = async (prompt: string, image: ImagePayload, convoId: string) => {
    updateConversationMessages(convoId, msgs => [...msgs, { role: MessageRole.ASSISTANT, content: 'Editing image...', originalImageUrl: image.data, isEditingImage: true }]);

    try {
      const newImageData = await editImage(prompt, image.data.split(',')[1], image.mimeType);
      updateConversationMessages(convoId, msgs => msgs.slice(0, -1).concat({ role: MessageRole.ASSISTANT, content: prompt, imageUrl: newImageData, originalImageUrl: image.data, isEditingImage: false }));
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'An unknown error occurred during image editing.';
      setError(errorMsg);
      updateConversationMessages(convoId, msgs => msgs.slice(0, -1).concat({ role: MessageRole.ASSISTANT, content: `Error: ${errorMsg}` }));
    }
  };

  const handleSendMessage = async (message: string, image: ImagePayload | null = null) => {
    if (isLoading) return;

    const convoId = activeConversationId || handleNewChat();
    // Use the currently selected model instead of the conversation's model
    const currentModel = selectedModel;

    setIsLoading(true);
    setError(null);

    const userMessage: Message = { role: MessageRole.USER, content: message };
    if (image) userMessage.originalImageUrl = image.data;
    updateConversationMessages(convoId, (msgs) => [...msgs, userMessage]);

    try {
      if (image) {
        await handleImageEditing(message, image, convoId);
      } else if (currentModel === 'veo-3.1-fast-generate-preview') {
        await handleVideoGeneration(message, convoId);
      } else {
        await getAIResponse(message, convoId, currentModel);
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMsg);
      updateConversationMessages(convoId, msgs => [...msgs, { role: MessageRole.ASSISTANT, content: `Error: ${errorMsg}` }]);
    } finally {
      setIsLoading(false);
      chatSessionRef.current = null;
    }
  };

  const handleTranscribeAudio = async (audioBase64: string, mimeType: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const transcribedText = await transcribeAudio(audioBase64, mimeType);
      await handleSendMessage(transcribedText);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'An unknown error occurred during transcription.';
      setError(errorMsg);
      if (activeConversationId) {
        updateConversationMessages(activeConversationId, msgs => [...msgs, { role: MessageRole.ASSISTANT, content: `Error: ${errorMsg}` }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!previewHtml) return;
    
    // Check if we have project files to download
    if (projectFiles) {
      // Create a zip file
      const zip = new JSZip();
      
      // Add all files to the zip with proper folder structure
      Object.keys(projectFiles).forEach(filename => {
        if (filename.includes('/')) {
          // Create nested folder structure
          const pathParts = filename.split('/');
          const fileName = pathParts.pop();
          let currentFolder = zip;
          
          pathParts.forEach(folder => {
            if (!currentFolder.folder(folder)) {
              currentFolder = currentFolder.folder(folder);
            } else {
              currentFolder = currentFolder.folder(folder);
            }
          });
          
          currentFolder.file(fileName, projectFiles[filename]);
        } else {
          // Add file to root
          zip.file(filename, projectFiles[filename]);
        }
      });
      
      // Generate and download the zip file
      const content = await zip.generateAsync({ type: 'blob' });
      const lastMessage = activeConversation?.messages[activeConversation.messages.length - 1];
      const projectName = lastMessage ? ReactWebsiteService.extractProjectName(lastMessage.content) || 'my-react-app' : 'my-react-app';
      saveAs(content, `${projectName}-project.zip`);
    } else {
      // Regular HTML download
      const blob = new Blob([previewHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'index.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Add this function for handling fullscreen toggle
  const toggleFullscreen = async () => {
    if (!previewPanelRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await previewPanelRef.current.requestFullscreen();
        setIsPreviewFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsPreviewFullscreen(false);
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
      // Fallback to CSS-based fullscreen
      setIsPreviewFullscreen(!isPreviewFullscreen);
    }
  };

  // Add fullscreen change event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsPreviewFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Update the React website generation to store project files
  const handleReactWebsiteGeneration = (prompt: string, aiResponse: string) => {
    // Extract HTML content from AI response if available
    let htmlContent = '';
    if (aiResponse.includes('```html')) {
      const htmlBlockStart = aiResponse.indexOf('```html\n');
      const codeAfterStart = aiResponse.substring(htmlBlockStart + '```html\n'.length);
      const htmlBlockEnd = codeAfterStart.indexOf('```');
      htmlContent = htmlBlockEnd !== -1 ? codeAfterStart.substring(0, htmlBlockEnd) : codeAfterStart;
    }
    
    // Use AI-generated HTML content or fallback to minimal template
    const previewHtmlContent = htmlContent || ReactWebsiteService.generatePreviewHtml(prompt);
    setPreviewHtml(previewHtmlContent);
    
    // On mobile devices, only show code by default, not the preview
    const isMobile = isMobileDevice();
    if (!showPreviewPanel) setShowPreviewPanel(true);
    
    // Store project files for download - use AI-generated content if available
    const files = ReactWebsiteService.generateReactWebsiteFiles(prompt, htmlContent);
    setProjectFiles(files);
  };

  return (
    <div className="flex h-dvh text-zinc-300 font-sans">
      <div
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity md:hidden ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <ChatHistory
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <header className="py-3 px-6 flex-shrink-0 flex justify-between items-center glassmorphism">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-zinc-400 hover:text-white">
              {isSidebarOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon />}
            </button>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium text-zinc-200">Ahmad AI Agent</h2>
            </div>
          </div>
          {/* Creator button in header with glass effect only */}
          <a 
            href="https://ahmadportfolio7.netlify.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
          >
            Creator
          </a>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-col flex-1 h-full max-w-4xl mx-auto w-full">
            <main className="flex-grow overflow-y-auto px-6">
              <div>
                {activeConversation?.messages.map((msg, index) => (
                  <ChatMessage
                    key={`${activeConversation.id}-${index}`}
                    message={msg}
                    modelName={MODELS.find(m => m.model === activeConversation.model)?.name}
                    onReopenPreview={(htmlContent) => {
                      setPreviewHtml(htmlContent);
                      setShowPreviewPanel(true);
                    }}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {error && (
                <div className="my-4 p-4 bg-red-900/50 text-red-300 border border-red-800 rounded-lg">
                  <strong>Error:</strong> {error}
                </div>
              )}
            </main>

            <div className="flex-shrink-0 px-6 pb-6 pt-4">
              {selectedModel === 'veo-3.1-fast-generate-preview' && (
                <VeoControls
                  isApiKeySelected={isApiKeySelected}
                  onSelectApiKey={handleSelectApiKey}
                  aspectRatio={aspectRatio}
                  onAspectRatioChange={setAspectRatio}
                />
              )}
              <AnimatedAIChat
                onSendMessage={handleSendMessage}
                onTranscribeAudio={handleTranscribeAudio}
                isLoading={isLoading}
                model={selectedModel}
                onModelChange={setSelectedModel}
                showHero={!activeConversation || activeConversation.messages.length === 0}
                onError={setError}
                onOpenTerminal={() => setIsTerminalOpen(true)}
              />
            </div>
          </div>

          {/* Terminal Panel */}
          <div
            className={`transition-all duration-300 ease-in-out flex-col ${
              isTerminalOpen ? 'flex w-96' : 'hidden w-0'
            }`}
          >
            <div className="p-2 glassmorphism flex-shrink-0 flex justify-between items-center">
              <h3 className="text-sm font-medium text-zinc-200">Terminal</h3>
              <button 
                onClick={() => setIsTerminalOpen(false)}
                className="p-1.5 text-zinc-400 hover:bg-zinc-800 rounded-md"
                aria-label="Close terminal"
              >
                <XIcon size={16} />
              </button>
            </div>
            <div className="flex-grow bg-black">
              <Terminal />
            </div>
          </div>

          {/* Preview Panel */}
          <div
            ref={previewPanelRef}
            className={`transition-all duration-300 ease-in-out flex-col ${
              showPreviewPanel ? isPreviewFullscreen ? 'fixed inset-0 z-50' : 'flex w-full flex-1' : 'hidden w-0'
            }`}
          >
            <CodePreviewPanel
              projectFiles={projectFiles}
              previewHtmlContent={previewHtml}
              onDownload={handleDownload}
              onClose={() => setShowPreviewPanel(false)}
              onFullscreen={toggleFullscreen}
              isFullscreen={isPreviewFullscreen}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;