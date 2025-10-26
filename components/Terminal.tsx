import React, { useState, useEffect, useRef } from 'react';
import { TerminalService, TerminalCommand } from '../services/terminalService';
import { CopyIcon } from './icons';

interface TerminalProps {
  initialCommands?: TerminalCommand[];
  autoReactSetup?: boolean; // New prop to indicate auto React setup
}

const Terminal: React.FC<TerminalProps> = ({ initialCommands = [], autoReactSetup = false }) => {
  const [commands, setCommands] = useState<TerminalCommand[]>(initialCommands);
  const [input, setInput] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If autoReactSetup is true, use the auto setup instructions
    if (autoReactSetup) {
      setCommands(TerminalService.getAutoReactSetupInstructions());
    }
  }, [autoReactSetup]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commands]);

  const handleExecute = async () => {
    if (!input.trim()) return;

    try {
      const results = await TerminalService.executeCommand(input);
      setCommands(prev => [...prev, ...results]);
      setInput('');
    } catch (error) {
      setCommands(prev => [
        ...prev,
        {
          command: input,
          output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error'
        }
      ]);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleExecute();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col h-full bg-black text-green-400 font-mono text-sm rounded-lg overflow-hidden border border-zinc-700">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <span className="text-zinc-300">Terminal</span>
        <div className="w-12"></div>
      </div>
      
      <div 
        ref={terminalRef}
        className="flex-grow p-4 overflow-y-auto max-h-60"
      >
        {commands.map((cmd, index) => (
          <div key={index} className="mb-2">
            {cmd.type === 'command' && (
              <div className="flex items-start">
                <span className="text-green-400 mr-2">$</span>
                <span className="flex-grow">{cmd.command}</span>
                <button 
                  onClick={() => handleCopy(cmd.command)}
                  className="ml-2 text-zinc-500 hover:text-white"
                  aria-label="Copy command"
                >
                  <CopyIcon />
                </button>
              </div>
            )}
            {cmd.type === 'output' && (
              <div className="text-zinc-300 whitespace-pre-wrap">{cmd.output}</div>
            )}
            {cmd.type === 'error' && (
              <div className="text-red-400 whitespace-pre-wrap">{cmd.output}</div>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex items-center px-4 py-2 border-t border-zinc-700 bg-zinc-900">
        <span className="text-green-400 mr-2">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-grow bg-transparent text-zinc-300 outline-none"
          placeholder="Type a command..."
        />
      </div>
    </div>
  );
};

export default Terminal;