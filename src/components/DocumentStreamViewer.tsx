import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Sparkles, Download, Printer, CheckCircle, Copy, Check, StopCircle, FileDown } from 'lucide-react';

interface DocumentStreamViewerProps {
  isOpen: boolean;
  isStreaming: boolean;
  content: string;
  onClose: () => void;
  onDownload: () => void;
  onDownloadWord?: () => void;
  onPrint: () => void;
  onStop?: () => void;
  caseNumber: string;
  buyerName: string;
  sellerName: string;
  documentTitle?: string;
  firmName?: string;
  lawyerName?: string;
  queueProgress?: { current: number; total: number } | null;
}

// Indentation depth of a numbered/lettered clause line — null if it is plain
// prose. e.g. "1.1" → 1, "2.3.1" → 2, "(a)"/"a." → 1.
const clauseDepth = (text: string): number | null => {
  const numeric = text.match(/^(\d+(?:\.\d+)+)[.)]?\s/);
  if (numeric) return (numeric[1].match(/\./g) || []).length;
  if (/^(\([a-zA-Z0-9]{1,4}\)|[a-zA-Z][.)])\s/.test(text)) return 1;
  return null;
};

const leadingText = (children: any): string => {
  const arr = Array.isArray(children) ? children : [children];
  let s = '';
  for (const n of arr) { if (typeof n === 'string') s += n; else break; }
  return s;
};

const DocumentStreamViewer: React.FC<DocumentStreamViewerProps> = ({
  isOpen,
  isStreaming,
  content,
  onClose,
  onDownload,
  onDownloadWord,
  onPrint,
  onStop,
  caseNumber,
  buyerName,
  sellerName,
  documentTitle = 'Deed of Sale & Transfer Agreement',
  firmName = 'Minchin & Kelly',
  lawyerName = 'Conveyancer',
  queueProgress,
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4a3f8a] to-[#1a1a2e] flex items-center justify-center shadow-lg shadow-purple-500/20 border border-[#c9a84c]/30">
              <FileText className="h-5 w-5 text-[#c9a84c]" />
            </div>
            <div>
              <h1 className="text-white font-serif text-lg font-semibold tracking-tight">
                {documentTitle}
              </h1>
              <p className="text-white/40 text-xs mt-0.5">
                {firmName} &middot; {caseNumber} &middot; {buyerName} &harr; {sellerName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isStreaming && (
              <div className="flex items-center space-x-2 mr-4">
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c9a84c] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#c9a84c]" />
                </div>
                <span className="text-[#e6d59e] text-xs font-medium tracking-wide uppercase">
                  Generating{queueProgress ? ` (${queueProgress.current}/${queueProgress.total})` : ''}
                </span>
                {onStop && (
                  <button
                    onClick={onStop}
                    className="ml-2 px-3 py-1 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-red-200 border border-red-500/30 transition-all text-xs font-medium inline-flex items-center"
                  >
                    <StopCircle className="h-3.5 w-3.5 mr-1" />
                    Stop
                  </button>
                )}
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
            {onDownloadWord && (
              <button
                onClick={onDownloadWord}
                disabled={isStreaming || !content}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
                title="Download Word (.docx)"
              >
                <FileDown className="h-4 w-4" />
              </button>
            )}
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
            {/* Document header — matches PDF cover styling */}
            <div className="mx-12 pt-12 pb-6 relative" style={{ borderBottom: '2px solid #1a1a2e' }}>
              <p className="absolute top-3 right-0 text-[8px] uppercase tracking-wider text-gray-400">
                Prepared by {firmName}{lawyerName ? ` | ${lawyerName}` : ''}
              </p>
              <div className="text-center">
                <p className="text-[7px] uppercase tracking-[0.4em] text-[#4a3f8a] font-bold mb-1">
                  {firmName}
                </p>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-3">
                  Republic of Botswana &middot; Property Conveyancing
                </p>
                <div className="w-16 h-0.5 bg-[#1a1a2e] mx-auto mb-2" />
                <p className="text-[8px] text-gray-400 tracking-wider">
                  Ref: {caseNumber} &middot; {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Markdown content */}
            <div className="px-12 py-8 pb-16">
              {!content && isStreaming && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-[#e6d59e] border-t-[#c9a84c] animate-spin" />
                    <Sparkles className="h-6 w-6 text-[#c9a84c] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-gray-500 mt-6 text-sm font-medium">
                    Preparing your legal document...
                  </p>
                  <p className="text-gray-400 mt-1 text-xs">
                    AI is drafting a comprehensive conveyancing document
                  </p>
                </div>
              )}

              <article className="prose prose-gray max-w-none
                prose-headings:font-serif prose-headings:tracking-tight prose-headings:text-center
                prose-h1:text-[1.1rem] prose-h1:font-bold prose-h1:text-[#1a1a2e] prose-h1:mb-8 prose-h1:uppercase prose-h1:tracking-[0.15em]
                prose-h2:text-[0.95rem] prose-h2:font-bold prose-h2:text-[#1a1a2e] prose-h2:border-b prose-h2:border-gray-300 prose-h2:pb-2 prose-h2:mt-10 prose-h2:uppercase prose-h2:tracking-wide
                prose-h3:text-base prose-h3:font-semibold prose-h3:text-gray-800 prose-h3:mt-6
                prose-h4:text-sm prose-h4:font-semibold prose-h4:text-gray-700 prose-h4:mt-4
                prose-p:text-[13px] prose-p:leading-[1.8] prose-p:text-gray-700 prose-p:text-justify
                prose-li:text-[13px] prose-li:leading-[1.8] prose-li:text-gray-700 prose-li:text-left
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-ol:pl-8 prose-ul:pl-8
                [&_ol]:text-left [&_ol_li]:text-left [&_ul]:text-left [&_ul_li]:text-left
                prose-hr:border-gray-300
                prose-table:border-collapse prose-table:text-[12px] prose-table:mx-auto
                prose-thead:bg-[#1a1a2e] prose-thead:text-white
                prose-th:px-3 prose-th:py-2 prose-th:text-center prose-th:font-semibold prose-th:text-[11px] prose-th:uppercase prose-th:tracking-wide
                prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-gray-200 prose-td:text-[12px] prose-td:align-top prose-td:text-center
                prose-tr:even:bg-gray-50
              ">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => {
                      const d = clauseDepth(leadingText(children));
                      return d !== null
                        ? <p style={{ textAlign: 'left', paddingLeft: `${d * 1.5}rem` }}>{children}</p>
                        : <p>{children}</p>;
                    },
                  }}
                >{content}</ReactMarkdown>
              </article>

              {/* Streaming cursor */}
              {isStreaming && content && (
                <span className="inline-block w-0.5 h-5 bg-[#c9a84c] animate-pulse ml-0.5 -mb-1" />
              )}
            </div>

            {/* Document footer */}
            {!isStreaming && content && (
              <div className="border-t border-gray-200 mx-12 py-6 mb-8">
                <div className="flex justify-between text-[9px] text-gray-400 uppercase tracking-wider">
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
              <Sparkles className="h-4 w-4 text-[#c9a84c] animate-pulse" />
              <span className="text-white/60 text-xs">
                {wordCount.toLocaleString()} words generated...
                {queueProgress && (
                  <span className="ml-2 text-white/40">
                    Document {queueProgress.current} of {queueProgress.total}
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#4a3f8a] to-[#c9a84c] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (wordCount / 3000) * 100)}%` }}
                />
              </div>
              {onStop && (
                <button
                  onClick={onStop}
                  className="px-3 py-1 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-red-200 border border-red-500/30 transition-all text-xs font-medium inline-flex items-center"
                >
                  <StopCircle className="h-3 w-3 mr-1" />
                  Stop
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentStreamViewer;
