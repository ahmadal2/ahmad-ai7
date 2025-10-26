import React, { useState, useEffect, useRef } from 'react';
import { DownloadIcon, XIcon, CodeIcon, EyeIcon } from './icons';
import { cn } from '../lib/utils';

interface CodePreviewPanelProps {
  projectFiles: Record<string, string> | null;
  previewHtmlContent: string;
  onDownload: () => void;
  onClose: () => void;
  onFullscreen: () => void;
  isFullscreen: boolean;
}

const CodeBlockDisplay: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  return (
    <div className="relative h-full rounded-lg bg-black/50 text-white/90 border border-white/10">
      <div className="flex justify-between items-center px-4 py-2 bg-black/20 rounded-t-lg">
        <span className="text-xs font-sans text-gray-400">{language}</span>
      </div>
      <pre className="p-4 overflow-auto h-[calc(100%-40px)] max-h-[500px]">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
};

export const CodePreviewPanel: React.FC<CodePreviewPanelProps> = ({ 
  projectFiles, 
  previewHtmlContent, 
  onDownload, 
  onClose,
  onFullscreen,
  isFullscreen
}) => {
  // Default to 'code' tab on mobile devices, 'preview' on desktop
  const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>(isMobile ? 'code' : 'preview');
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  
  const fileList = projectFiles ? Object.keys(projectFiles) : [];

  useEffect(() => {
    if (fileList.length > 0 && (!activeFile || !fileList.includes(activeFile))) {
      setActiveFile(fileList[0]);
    } else if (fileList.length === 0) {
      setActiveFile(null);
    }
  }, [fileList, activeFile]);

  const getFileLanguage = (fileName: string) => {
    const extension = fileName.split('.').pop() || '';
    const map: Record<string, string> = {
      js: 'javascript',
      jsx: 'jsx',
      ts: 'typescript',
      tsx: 'tsx',
      html: 'html',
      css: 'css',
      json: 'json',
      md: 'markdown',
    };
    return map[extension] || 'plaintext';
  };

  return (
    <div 
      ref={panelRef}
      className="flex flex-col h-full bg-zinc-900/50 backdrop-blur-md"
    >
      {/* Header */}
      <div className="p-2 border-b border-white/10 flex-shrink-0 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-zinc-800 rounded-lg">
            <button 
              onClick={() => setActiveTab('preview')} 
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-colors',
                activeTab === 'preview' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'
              )}
            >
              <EyeIcon /> Preview
            </button>
            <button 
              onClick={() => setActiveTab('code')} 
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-colors',
                activeTab === 'code' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'
              )}
            >
              <CodeIcon /> Code
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onDownload} 
            disabled={!projectFiles} 
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-700/50 border border-zinc-600 rounded-md hover:bg-zinc-700 transition-colors text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DownloadIcon /> Download
          </button>
          <button 
            onClick={onFullscreen}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors"
            aria-label={isFullscreen ? "Minimize" : "Maximize"}
          >
            {isFullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="19 13 13 19 19 19" />
                <polyline points="5 11 11 5 5 5" />
                <polyline points="19 5 19 11 13 5" />
                <polyline points="5 19 11 13 5 13" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            )}
          </button>
          <button 
            onClick={onClose} 
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors"
          >
            <XIcon />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-hidden">
        {activeTab === 'preview' && (
          <div className="w-full h-full bg-white">
            {previewHtmlContent ? (
              <iframe 
                srcDoc={previewHtmlContent} 
                title="Live Preview" 
                className="w-full h-full border-0" 
                sandbox="allow-scripts allow-same-origin" 
              />
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500 bg-zinc-800/50 p-8 text-center">
                <p>No preview available. Generate a project with an index.html file to see it here.</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'code' && (
          <div className="flex h-full">
            {fileList.length > 0 && activeFile ? (
              <>
                <div className="w-1/3 max-w-xs h-full overflow-y-auto border-r border-white/10 p-2">
                  <ul className="space-y-1">
                    {fileList.map(file => (
                      <li key={file}>
                        <button 
                          onClick={() => setActiveFile(file)} 
                          className={cn(
                            'w-full text-left px-3 py-1.5 text-xs rounded-md truncate transition-colors',
                            activeFile === file ? 'bg-indigo-600/50 text-white' : 'text-zinc-300 hover:bg-zinc-700/50'
                          )}
                        >
                          {file}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-grow h-full overflow-hidden p-2">
                  <CodeBlockDisplay code={projectFiles?.[activeFile] || ''} language={getFileLanguage(activeFile)} />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full w-full text-zinc-500 p-8 text-center">
                <p>No code files were generated. Ask the AI to create a project.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};