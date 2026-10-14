import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage, ConversationSummary, SourceCitation, ToolCallRecord } from '../types';
import { 
  sendAssistantMessage, 
  getAssistantConversations, 
  getConversationDetails, 
  deleteAssistantConversation 
} from '../services/api';
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  BookOpen, 
  Wrench, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Clock, 
  ExternalLink, 
  ShieldCheck, 
  Car, 
  CloudRain, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Info,
  Radio,
  FileText
} from 'lucide-react';

export const Assistant: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested Prompts
  const SUGGESTED_PROMPTS = [
    {
      title: "Chembarambakkam SOP",
      prompt: "What are the emergency SOP discharge protocols for Chembarambakkam reservoir during heavy rainfall?",
      tag: "Flood SOP",
    },
    {
      title: "Anna Salai Traffic",
      prompt: "Predict traffic congestion on Anna Salai at 18:00 with heavy rain.",
      tag: "Traffic ML",
    },
    {
      title: "IMD Rainfall Standards",
      prompt: "Explain the IMD rainfall intensity classification categories for Chennai.",
      tag: "Meteorology",
    },
    {
      title: "Kathipara Subways",
      prompt: "Show Kathipara junction flood diversion and subway closure SOPs.",
      tag: "Traffic Diversion",
    },
    {
      title: "Model Accuracy",
      prompt: "Retrieve the verified accuracy and performance metrics for the Traffic Random Forest model.",
      tag: "ML Architecture",
    },
  ];

  const loadConversations = async () => {
    try {
      const convs = await getAssistantConversations();
      setConversations(convs);
    } catch (e) {
      // Ignored
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const selectConversation = async (convId: string) => {
    try {
      setLoading(true);
      setActiveConvId(convId);
      const thread = await getConversationDetails(convId);
      if (thread && thread.messages) {
        setMessages(thread.messages.map((m: any) => ({
          id: m.message_id || m.id,
          role: m.role,
          content: m.content,
          sources: m.sources || [],
          tool_calls: m.tool_calls || [],
          created_at: m.created_at,
        })));
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = () => {
    setActiveConvId(undefined);
    setMessages([]);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await deleteAssistantConversation(convId);
      setConversations((prev) => prev.filter((c) => c.conversation_id !== convId));
      if (activeConvId === convId) {
        startNewConversation();
      }
    } catch {
      // Fallback
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await sendAssistantMessage(text, activeConvId);
      setMessages((prev) => [...prev, response]);
      if (!activeConvId && response.message_id) {
        // Refresh conversations list to show newly created thread
        loadConversations();
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ System Notice: ${err.message || 'Unable to connect to Assistant service.'}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleToolExpanded = (key: string) => {
    setExpandedTools((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-fade-in">
      {/* 1. Left Sidebar: Conversation Threads */}
      <div className="w-72 bg-[#101827] border border-slate-800 rounded-2xl flex flex-col p-4 shadow-xl">
        <button
          onClick={startNewConversation}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-[#35D9F5]/20 to-blue-500/20 hover:from-[#35D9F5]/30 hover:to-blue-500/30 border border-[#35D9F5]/30 rounded-xl text-xs font-bold text-[#35D9F5] flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Operational Thread</span>
        </button>

        <div className="mt-4 mb-2 flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Session History
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {conversations.length} Threads
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40" />
              No previous conversations.
            </div>
          ) : (
            conversations.map((c) => (
              <div
                key={c.conversation_id}
                onClick={() => selectConversation(c.conversation_id)}
                className={`group flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  activeConvId === c.conversation_id
                    ? 'bg-[#142338] border-[#35D9F5]/40 text-white shadow-sm'
                    : 'bg-[#080D16]/50 border-transparent hover:border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${
                    activeConvId === c.conversation_id ? 'text-[#35D9F5]' : 'text-slate-500'
                  }`} />
                  <span className="truncate font-sans font-medium">{c.title || 'Untitled Thread'}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(e, c.conversation_id)}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 text-slate-500 transition-opacity"
                  title="Delete thread"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
          <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
          <span>Local Dense Vector Store: Active</span>
        </div>
      </div>

      {/* 2. Main Chat Thread */}
      <div className="flex-1 bg-[#101827] border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Thread Header */}
        <div className="px-6 py-4 bg-[#0A101D] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#142338] border border-[#35D9F5]/30 flex items-center justify-center text-[#35D9F5] shadow-md shadow-[#35D9F5]/10">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white font-sans">
                  Urban Intelligence Assistant
                </h2>
                <span className="px-1.5 py-0.5 bg-[#35D9F5]/10 border border-[#35D9F5]/30 rounded text-[9px] font-mono text-[#35D9F5] uppercase">
                  RAG + ML Tools
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Grounded in official GCC Disaster SOPs, IMD criteria & Live Predictive Models
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Guardrails Enforced
            </span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-[#142338] border border-[#35D9F5]/20 flex items-center justify-center text-[#35D9F5] mb-4 shadow-xl">
                <Bot className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-sans">
                Chennai Command AI Assistant
              </h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Ask operational inquiries about flood discharge rules, stormwater networks, traffic diversions, or run live inference using Random Forest models.
              </p>

              {/* Prompt Suggestion Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                {SUGGESTED_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.prompt)}
                    className="p-3 bg-[#080D16] hover:bg-[#142338] border border-slate-800 hover:border-[#35D9F5]/40 rounded-xl transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-[#35D9F5] uppercase">
                        {p.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-sans group-hover:text-white line-clamp-2">
                      {p.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3.5 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role !== 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-[#142338] border border-[#35D9F5]/30 flex items-center justify-center text-[#35D9F5] flex-shrink-0 mt-1 shadow-md">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-4 text-xs font-sans leading-relaxed shadow-lg ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-[#1e40af] text-white rounded-br-none'
                      : 'bg-[#080D16] border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {/* Tool Call Cards */}
                  {msg.tool_calls && msg.tool_calls.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {msg.tool_calls.map((tool, tIdx) => {
                        const isExp = expandedTools[`${i}-${tIdx}`];
                        return (
                          <div
                            key={tIdx}
                            className="bg-[#101827] border border-slate-700 rounded-xl p-2.5 text-xs font-mono"
                          >
                            <div
                              onClick={() => toggleToolExpanded(`${i}-${tIdx}`)}
                              className="flex items-center justify-between cursor-pointer text-[#35D9F5] hover:text-[#35D9F5]/80"
                            >
                              <div className="flex items-center gap-2">
                                <Wrench className="w-3.5 h-3.5 text-[#35D9F5]" />
                                <span className="font-bold uppercase tracking-wider text-[11px]">
                                  Tool Executed: {tool.tool_name}
                                </span>
                              </div>
                              {isExp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </div>

                            <p className="text-[11px] text-slate-400 mt-1 font-sans">
                              {tool.description}
                            </p>

                            {isExp && (
                              <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] space-y-1.5">
                                <div>
                                  <span className="text-slate-400 font-semibold">Inputs: </span>
                                  <pre className="bg-[#080D16] p-2 rounded text-slate-300 overflow-x-auto">
                                    {JSON.stringify(tool.inputs, null, 2)}
                                  </pre>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-semibold">Result: </span>
                                  <pre className="bg-[#080D16] p-2 rounded text-emerald-300 overflow-x-auto">
                                    {JSON.stringify(tool.result, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Message Text */}
                  <div className="whitespace-pre-wrap font-sans">
                    {msg.content}
                  </div>

                  {/* Grounded Source Citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-slate-800">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                        <BookOpen className="w-3 h-3 text-[#35D9F5]" />
                        <span>Trusted Knowledge Citations ({msg.sources.length})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.sources.map((src, sIdx) => (
                          <div
                            key={sIdx}
                            className="bg-[#101827] border border-slate-800 hover:border-slate-700 p-2 rounded-xl text-[11px]"
                          >
                            <div className="flex items-center justify-between text-[#35D9F5] font-semibold mb-1">
                              <span className="truncate">[{sIdx + 1}] {src.title}</span>
                              <span className="text-[9px] font-mono px-1 py-0.2 bg-[#35D9F5]/10 rounded text-slate-300">
                                {Math.round(src.similarity_score * 100)}% match
                              </span>
                            </div>
                            <p className="text-slate-400 text-[10px] line-clamp-2 italic">
                              "{src.snippet}"
                            </p>
                            {src.source_url && (
                              <a
                                href={src.source_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[9px] text-blue-400 hover:underline flex items-center gap-1 mt-1"
                              >
                                Source Document <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0 mt-1 shadow-md">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-3.5 items-center text-xs text-slate-400">
              <div className="w-8 h-8 rounded-xl bg-[#142338] border border-[#35D9F5]/30 flex items-center justify-center text-[#35D9F5]">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-[#080D16] border border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-[#35D9F5] rounded-full animate-bounce" />
                <span className="inline-block w-2 h-2 bg-[#35D9F5] rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="inline-block w-2 h-2 bg-[#35D9F5] rounded-full animate-bounce [animation-delay:0.4s]" />
                <span className="ml-2 font-mono text-[11px] text-slate-400">
                  Retrieving knowledge & executing ML tools...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 bg-[#0A101D] border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-3"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about flood discharge rules, stormwater canals, or request a traffic prediction..."
                className="w-full px-4 py-3 bg-[#080D16] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#35D9F5] transition-all font-sans"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="px-5 py-3 bg-gradient-to-r from-[#35D9F5] to-blue-600 hover:from-[#35D9F5]/90 hover:to-blue-500 text-[#080D16] font-bold rounded-xl shadow-lg shadow-[#35D9F5]/20 flex items-center gap-2 transition-all disabled:opacity-50 text-sm"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send Query</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
