import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText, Sparkles, Download, Printer, CheckCircle, Copy, Check } from 'lucide-react';

interface DocumentStreamViewerProps {
  isOpen: boolean;
  isStreaming: boolean;
  content: string;
  onClose: () => void;
  onDownload: () => void;
  onPrint: () => void;
  caseNumber: string;
  buyerName: string;
  sellerName: string;
}

const DocumentStreamViewer: React.FC<DocumentStreamViewerProps> = ({
  isOpen,
  isStreaming,
  content,
  onClose,
  onDownload,
  onPrint,
  caseNumber,
  buyerName,
  sellerName,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming && scrollRef.current) {
      const el = scrollRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [content, isStreaming]);

  // Word count
  useEffect(() => {
    setWordCount(content.split(/\s+/).filter(Boolean).length);
  }, [content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/10 bg-[#0f0f18]/95 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-serif text-lg font-semibold tracking-tight">
                Deed of Sale & Transfer Agreement
              </h1>
              <p className="text-white/40 text-xs mt-0.5">
                {caseNumber} &middot; {buyerName} &harr; {sellerName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isStreaming && (
              <div className="flex items-center space-x-2 mr-4">
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500" />
                </div>
                <span className="text-purple-300 text-xs font-medium tracking-wide uppercase">
                  Generating
                </span>
              </div>
            )}

            {!isStreaming && content && (
              <div className="flex items-center space-x-2 mr-4">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300 text-xs font-medium">
                  {wordCount.toLocaleString()} words
                </span>
              </div>
            )}

            <button
              onClick={handleCopy}
              disabled={!content}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
              title="Copy to clipboard"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
            <button
              onClick={onDownload}
              disabled={isStreaming || !content}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
              title="Download PDF"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={onPrint}
              disabled={isStreaming || !content}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
              title="Print"
            >
              <Printer className="h-4 w-4" />
            </button>

            <div className="w-px h-6 bg-white/10 mx-1" />

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Document Body */}
      <div className="flex-1 overflow-hidden flex justify-center">
        <div
          ref={scrollRef}
          className="w-full max-w-4xl overflow-y-auto px-4 py-8"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Paper */}
          <div className="bg-white rounded-lg shadow-2xl shadow-black/50 mx-auto" style={{ minHeight: '60vh' }}>
            {/* Document watermark header */}
            <div className="border-b-2 border-gray-800 mx-12 pt-12 pb-6">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-3">
                  Republic of Botswana &middot; Property Conveyancing
                </p>
                <div className="w-16 h-0.5 bg-gray-800 mx-auto mb-4" />
              </div>
            </div>

            {/* Markdown content */}
            <div className="px-12 py-8 pb-16">
              {!content && isStreaming && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin" />
                    <Sparkles className="h-6 w-6 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-gray-500 mt-6 text-sm font-medium">
                    Preparing your legal document...
                  </p>
                  <p className="text-gray-400 mt-1 text-xs">
                    AI is drafting a comprehensive conveyancing agreement
                  </p>
                </div>
              )}

              <article className="prose prose-gray max-w-none
                prose-headings:font-serif prose-headings:tracking-tight
                prose-h1:text-2xl prose-h1:text-center prose-h1:font-bold prose-h1:text-gray-900 prose-h1:mb-8 prose-h1:uppercase prose-h1:tracking-widest prose-h1:text-[1.1rem]
                prose-h2:text-lg prose-h2:font-bold prose-h2:text-gray-800 prose-h2:border-b prose-h2:border-gray-300 prose-h2:pb-2 prose-h2:mt-10 prose-h2:uppercase prose-h2:tracking-wide prose-h2:text-[0.95rem]
                prose-h3:text-base prose-h3:font-semibold prose-h3:text-gray-800 prose-h3:mt-6
                prose-p:text-[13px] prose-p:leading-[1.8] prose-p:text-gray-700 prose-p:text-justify
                prose-li:text-[13px] prose-li:leading-[1.8] prose-li:text-gray-700
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-ol:pl-6 prose-ul:pl-6
              ">
                <ReactMarkdown>{content}</ReactMarkdown>
              </article>

              {/* Streaming cursor */}
              {isStreaming && content && (
                <span className="inline-block w-0.5 h-5 bg-purple-600 animate-pulse ml-0.5 -mb-1" />
              )}
            </div>

            {/* Document footer */}
            {!isStreaming && content && (
              <div className="border-t border-gray-200 mx-12 py-6 mb-8">
                <div className="flex justify-between text-[9px] text-gray-400 uppercase tracking-wider">
                  <span>Generated by EasyConvey AI</span>
                  <span>Ref: {caseNumber}</span>
                  <span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom padding for scroll */}
          <div className="h-16" />
        </div>
      </div>

      {/* Bottom bar with progress */}
      {isStreaming && (
        <div className="flex-shrink-0 border-t border-white/10 bg-[#0f0f18]/95 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
              <span className="text-white/60 text-xs">
                {wordCount.toLocaleString()} words generated...
              </span>
            </div>
            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (wordCount / 3000) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentStreamViewer;
