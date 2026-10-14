import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../../types';
import { sendAssistantMessage } from '../../services/api';
import { 
  Bot, 
  Send, 
  Sparkles, 
  X, 
  Wrench, 
  BookOpen, 
  Maximize2, 
  Minimize2, 
  Radio, 
  MessageSquare
} from 'lucide-react';

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullPage?: () => void;
}

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({
  isOpen,
  onClose,
  onOpenFullPage,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const handleSend = async (customText?: string) => {
    const text = (customText || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const resp = await sendAssistantMessage(text);
      setMessages((prev) => [...prev, resp]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error: ${err.message || 'Assistant request failed'}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-[#101827] border-l border-slate-800 shadow-2xl flex flex-col animate-slide-left">
      {/* Header */}
      <div className="p-4 bg-[#0A101D] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#142338] border border-[#35D9F5]/30 flex items-center justify-center text-[#35D9F5]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white font-sans flex items-center gap-1.5">
              <span>Operational Assistant</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">GCC Crisis Copilot</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onOpenFullPage && (
            <button
              onClick={() => {
                onClose();
                onOpenFullPage();
              }}
              title="Expand to full workspace"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin text-xs">
        {messages.length === 0 ? (
          <div className="text-center py-10 px-2">
            <Bot className="w-10 h-10 text-[#35D9F5] mx-auto mb-3 opacity-80" />
            <p className="text-white font-bold mb-1">How can I assist command ops?</p>
            <p className="text-[11px] text-slate-400 mb-4">
              Query SOPs or run instant predictions on traffic and flood risk.
            </p>

            <div className="space-y-2 text-left">
              <button
                onClick={() => handleSend("What are Chembarambakkam reservoir discharge limits during cyclone alerts?")}
                className="w-full p-2.5 bg-[#080D16] border border-slate-800 hover:border-[#35D9F5]/40 rounded-xl text-[11px] text-slate-300 transition-all text-left"
              >
                🌊 Chembarambakkam SOP discharge limits
              </button>
              <button
                onClick={() => handleSend("Predict Anna Salai traffic congestion during evening peak")}
                className="w-full p-2.5 bg-[#080D16] border border-slate-800 hover:border-[#35D9F5]/40 rounded-xl text-[11px] text-slate-300 transition-all text-left"
              >
                🚗 Anna Salai traffic congestion prediction
              </button>
              <button
                onClick={() => handleSend("What is the flood diversion plan for Kathipara junction?")}
                className="w-full p-2.5 bg-[#080D16] border border-slate-800 hover:border-[#35D9F5]/40 rounded-xl text-[11px] text-slate-300 transition-all text-left"
              >
                🚧 Kathipara junction flood diversion SOP
              </button>
            </div>
          </div>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] p-3 rounded-xl leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-[#080D16] border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                {/* Tool calls */}
                {m.tool_calls && m.tool_calls.length > 0 && (
                  <div className="mb-2 p-1.5 bg-[#142338] border border-[#35D9F5]/30 rounded-lg text-[10px] font-mono text-[#35D9F5] flex items-center gap-1.5">
                    <Wrench className="w-3 h-3" />
                    <span>ML Tool: {m.tool_calls[0].tool_name}</span>
                  </div>
                )}

                <div className="whitespace-pre-wrap">{m.content}</div>

                {/* Sources count */}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center gap-1 text-[10px] text-slate-400">
                    <BookOpen className="w-3 h-3 text-[#35D9F5]" />
                    <span>{m.sources.length} Verified Sources cited</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <div className="w-2 h-2 rounded-full bg-[#35D9F5] animate-ping" />
            <span className="font-mono text-[11px]">Processing command query...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-[#0A101D] border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type query or tool command..."
            className="flex-1 px-3 py-2 bg-[#080D16] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#35D9F5]"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 bg-[#35D9F5] text-[#080D16] rounded-xl hover:bg-[#35D9F5]/90 disabled:opacity-50 transition-all font-bold"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
