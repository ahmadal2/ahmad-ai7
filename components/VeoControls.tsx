import React from 'react';

interface VeoControlsProps {
  isApiKeySelected: boolean;
  onSelectApiKey: () => void;
  aspectRatio: '16:9' | '9:16';
  onAspectRatioChange: (ratio: '16:9' | '9:16') => void;
}

export const VeoControls: React.FC<VeoControlsProps> = ({ isApiKeySelected, onSelectApiKey, aspectRatio, onAspectRatioChange }) => {
  if (!isApiKeySelected) {
    return (
      <div className="text-center p-4 mb-4 bg-yellow-900/20 border border-yellow-400/30 rounded-lg">
        <h4 className="font-bold text-yellow-300">Action Required</h4>
        <p className="text-sm text-zinc-300 my-2">
          Veo video generation requires an API key associated with a project that has billing enabled.
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline ml-1">
            Learn more
          </a>.
        </p>
        <button
          onClick={onSelectApiKey}
          className="px-4 py-2 mt-2 bg-gradient-to-r from-orange-500 to-blue-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          Select API Key
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4 flex flex-col items-center gap-3">
        <div className="text-sm text-zinc-400">Aspect Ratio:</div>
        <div className="flex items-center gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
            <button 
                onClick={() => onAspectRatioChange('16:9')}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors ${aspectRatio === '16:9' ? 'bg-gradient-to-r from-orange-500 to-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}
            >
                16:9 Landscape
            </button>
            <button 
                onClick={() => onAspectRatioChange('9:16')}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors ${aspectRatio === '9:16' ? 'bg-gradient-to-r from-orange-500 to-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}
            >
                9:16 Portrait
            </button>
        </div>
    </div>
  );
};