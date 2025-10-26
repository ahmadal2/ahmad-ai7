import React, { useState } from 'react';
import { CopyIcon } from './icons';
import { EyeIcon } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  onReopenPreview?: (htmlContent: string) => void; // Add this prop
}

const CodeBlock: React.FC<{ code: string; language: string; onReopenPreview?: (htmlContent: string) => void }> = ({ code, language, onReopenPreview }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if this is an HTML or React code block that can be previewed
  const canPreview = (language === 'html' || language === 'jsx' || language === 'javascript') && onReopenPreview;
  const handlePreview = () => {
    if (onReopenPreview) {
      onReopenPreview(code);
    }
  };

  return (
    <div className="relative my-4 rounded-lg bg-[#1C1C1E] border border-zinc-800 text-zinc-200">
      <div className="flex justify-between items-center px-4 py-2 bg-zinc-900/50 rounded-t-lg">
        <span className="text-xs font-sans text-zinc-400">{language || 'code'}</span>
        <div className="flex items-center gap-2">
          {canPreview && (
            <button
              onClick={handlePreview}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
              title="Reopen Preview"
            >
              <EyeIcon size={14} />
              Preview
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <CopyIcon />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <pre className="p-4 overflow-auto text-sm max-h-[500px]">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
};

// ✅ Use named export
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onReopenPreview }) => {
  const parts = content.split(/(\`\`\`[\s\S]*?\`\`\`)/g);

  const renderPart = (part: string, key: number) => {
    if (/^(\s*(\*|\-|\d+\.)\s)/m.test(part)) {
      const listItems = part.trim().split('\n').map((line, i) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
          return <li key={i} className="ml-5 list-disc">{line.substring(line.indexOf(' ') + 1)}</li>;
        }
        if (/^\d+\./.test(trimmedLine)) {
          return <li key={i} className="ml-5 list-decimal">{line.substring(line.indexOf('.') + 2)}</li>;
        }
        return <p key={i}>{line}</p>;
      });

      const isOrdered = /^\d+\./.test(part.trim());
      if (isOrdered) return <ol key={key} className="space-y-1">{listItems}</ol>;
      return <ul key={key} className="space-y-1">{listItems}</ul>;
    }

    const paragraphs = part.split('\n\n').map((paragraph, pIndex) => {
      if (paragraph.trim() === '') return null;
      const boldProcessed = paragraph.split(/(\*\*[^\*]+\*\*)/g).map((subPart, i) => {
        if (subPart.startsWith('**') && subPart.endsWith('**')) {
          return <strong key={i}>{subPart.slice(2, -2)}</strong>;
        }
        return subPart;
      });
      return <p key={pIndex}>{boldProcessed}</p>;
    });

    return <div key={key}>{paragraphs}</div>;
  };

  return (
    <div className="prose prose-sm max-w-none text-zinc-300 prose-strong:text-zinc-100 prose-p:my-2 first:prose-p:mt-0 last:prose-p:mb-0">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const codeBlock = part.replace(/^```(\w+)?\n|```$/g, '');
          const language = (part.match(/^```(\w+)/) || [])[1] || '';
          return <CodeBlock key={index} code={codeBlock} language={language} onReopenPreview={onReopenPreview} />;
        }
        if (part.trim() === '') return null;
        return renderPart(part, index);
      })}
    </div>
  );
};