import { useState, useRef, useEffect, useCallback } from 'react';

// Lightweight declarations for the Web Speech API types/globals used here
declare type SpeechRecognition = any;
declare type SpeechRecognitionEvent = any;
declare const SpeechRecognition: { new(): SpeechRecognition } | undefined;
declare const webkitSpeechRecognition: { new(): SpeechRecognition } | undefined;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
  isStreaming?: boolean;
}

interface ChatEntry {
  id: string;
  title: string;
  preview: string;
  time: string;
  messages: Message[];
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

function uid() {
  return Math.random().toString(36).slice(2);
}

const SUGGESTED_PROMPTS = [
  { icon: '📦', label: 'Analyse my margins', prompt: 'Help me analyse my product margins. What should I know?' },
  { icon: '💰', label: 'Pricing strategy', prompt: 'How should I price my handmade products to stay competitive and profitable?' },
  { icon: '📋', label: 'Inventory tips', prompt: 'What are best practices for managing inventory as an artisan?' },
  { icon: '📈', label: 'Grow my business', prompt: 'What are actionable ways to grow revenue for a small craft business?' },
  { icon: '🧾', label: 'Track expenses', prompt: 'How do I effectively track making costs and expenses for each product?' },
  { icon: '🎁', label: 'Bundle products', prompt: 'Give me ideas for bundling my products to increase average order value.' },
];

function renderContent(text: string) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, li) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={li}>
            {parts.map((p, pi) =>
              p.startsWith('**') && p.endsWith('**') ? (
                <strong key={pi} className="font-semibold">{p.slice(2, -2)}</strong>
              ) : (
                <span key={pi}>{p}</span>
              )
            )}
            {li < lines.length - 1 && <br />}
          </span>
        );
      })}
    </>
  );
}

const PLACEHOLDERS = [
  'e.g. My copper earrings cost ₹80 to make and I sell at ₹200 — is that healthy?',
  'e.g. Which of my products has the best profit margin?',
  'e.g. How should I price a handmade ceramic mug?',
  'e.g. I have 40 units unsold — what should I do?',
  'e.g. Suggest ways to reduce my material costs',
  'e.g. How do I handle overdue payments from clients?',
  'e.g. What products should I bundle together for a gift set?',
  'e.g. My expenses are rising — how do I stay profitable?',
];

export function AIAssistant() {
  const [chats, setChats] = useState<ChatEntry[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<string | null>(null);
  const [twText, setTwText] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const vidInputRef = useRef<HTMLInputElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Typewriter effect cycling through PLACEHOLDERS when idle
  useEffect(() => {
    if (input || isLoading) { setTwText(''); return; }
    let pIdx = 0, cIdx = 0, deleting = false;
    setTwText('');
    const tick = () => {
      const word = PLACEHOLDERS[pIdx];
      if (!deleting) {
        cIdx++;
        setTwText(word.slice(0, cIdx));
        if (cIdx === word.length) { deleting = true; return 2200; }
        return 38;
      } else {
        cIdx--;
        setTwText(word.slice(0, cIdx));
        if (cIdx === 0) { deleting = false; pIdx = (pIdx + 1) % PLACEHOLDERS.length; return 400; }
        return 18;
      }
    };
    let timer: ReturnType<typeof setTimeout>;
    const run = () => { const delay = tick(); timer = setTimeout(run, delay ?? 38); };
    timer = setTimeout(run, 600);
    return () => clearTimeout(timer);
  }, [input, isLoading]);

  // Close plus-menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) setShowPlusMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const startVoice = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice input is not supported in this browser.'); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const rec = new SR();
    rec.lang = 'en-IN'; rec.interimResults = true; rec.continuous = false;
    rec.onresult = (e: any) => {
      let transcript = '';
      const len = e?.results?.length ?? 0;
      for (let i = 0; i < len; i++) {
        const r = e.results[i];
        if (r && r[0] && typeof r[0].transcript === 'string') transcript += r[0].transcript;
      }
      setInput(transcript);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  }, [isListening]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const startNewChat = useCallback(() => {
    setActiveChatId(null);
    setMessages([]);
    setInput('');
    setExpandedReasoning(null);
  }, []);

  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;

    const userMsg: Message = { id: uid(), role: 'user', content: text };
    const assistantId = uid();
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', reasoning: '', isStreaming: true };

    const newMessages = [...messages, userMsg, assistantMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const apiMessages = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

    let accContent = '';
    let accReasoning = '';

    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error(`Server error: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'content') {
              accContent += event.text;
              setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: accContent } : m));
            } else if (event.type === 'reasoning') {
              accReasoning += event.text;
              setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, reasoning: accReasoning } : m));
            } else if (event.type === 'error') {
              throw new Error(event.message);
            }
          } catch { /* skip malformed lines */ }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        const errText = (err as Error).message || 'Failed to get a response.';
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: `⚠️ ${errText}`, isStreaming: false } : m));
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
      setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, isStreaming: false } : m));

      setChats((prev) => {
        const title = text.length > 42 ? text.slice(0, 42) + '…' : text;
        const preview = accContent.slice(0, 65) || '…';
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const finalMsgs = newMessages.map((m) => m.id === assistantId
          ? { ...m, content: accContent, reasoning: accReasoning, isStreaming: false }
          : m
        );

        if (activeChatId) {
          return prev.map((c) => c.id === activeChatId ? { ...c, preview, time: timeStr, messages: finalMsgs } : c);
        }
        const entry: ChatEntry = { id: uid(), title, preview, time: timeStr, messages: finalMsgs };
        setActiveChatId(entry.id);
        return [entry, ...prev];
      });
    }
  }, [input, isLoading, messages, activeChatId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const loadChat = (chat: ChatEntry) => {
    setActiveChatId(chat.id);
    setMessages(chat.messages);
    setExpandedReasoning(null);
  };

  return (
    <div className="flex rounded-2xl overflow-hidden mt-6 border border-stone-200 shadow-lg bg-white" style={{ height: 'calc(100vh - 130px)' }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-64 flex flex-col shrink-0 bg-[#1C120E] text-white">
        {/* Brand header */}
        <div className="px-4 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C06030] to-[#8B3A1C] flex items-center justify-center shadow">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M4 5h12M4 10h8M4 15h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="16" cy="14" r="3.5" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.5"/>
                <path d="M15 14h2M16 13v2" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold leading-none text-white">SmartTracker AI</p>
              <p className="text-[10px] text-white/40 mt-0.5">Artisan Business Advisor</p>
            </div>
          </div>
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors text-xs font-medium text-white/80"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            New Chat
          </button>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto py-2">
          {chats.length === 0 ? (
            <p className="text-center text-[11px] text-white/30 px-4 mt-8 leading-relaxed">Your conversations<br/>will appear here.</p>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => loadChat(chat)}
                className={`w-full text-left px-4 py-3 transition-colors group relative ${
                  chat.id === activeChatId ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                {chat.id === activeChatId && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#C06030] rounded-r-full" />
                )}
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-xs font-medium text-white/80 truncate">{chat.title}</span>
                  <span className="text-[9px] text-white/30 shrink-0">{chat.time}</span>
                </div>
                <p className="text-[11px] text-white/40 truncate">{chat.preview}</p>
              </button>
            ))
          )}
        </div>

        {/* NVIDIA badge */}
        <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[#76B900] flex items-center justify-center shrink-0">
            <span className="text-white text-[7px] font-black">NV</span>
          </div>
          <div>
            <p className="text-[10px] text-white/50">Nemotron-3 Nano · Reasoning</p>
          </div>
        </div>
      </aside>

      {/* ── Main chat area ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FDFCFB]">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-stone-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow shadow-emerald-300" />
            <span className="text-sm font-medium text-stone-700">
              {activeChatId ? chats.find(c => c.id === activeChatId)?.title ?? 'Chat' : 'New Conversation'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M8 2a6 6 0 100 12A6 6 0 008 2z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5v4l2.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Streaming · Thinking enabled
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.length === 0 ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center h-full pb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C06030] to-[#8B3A1C] flex items-center justify-center shadow-lg mb-4">
                <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                  <path d="M5 7h18M5 12h12M5 17h9" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                  <circle cx="22" cy="20" r="4.5" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="1.8"/>
                  <path d="M20.5 20h3M22 18.5v3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-base font-semibold text-stone-800 mb-1">Your Artisan Business Advisor</h3>
              <p className="text-sm text-stone-500 text-center max-w-xs leading-relaxed mb-6">
                Ask me about pricing, margins, inventory, costs, or anything about growing your craft business.
              </p>
              {/* Suggested prompts grid */}
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {SUGGESTED_PROMPTS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => sendMessage(s.prompt)}
                    className="flex items-center gap-2.5 text-left px-3.5 py-3 rounded-xl bg-white border border-stone-200 hover:border-[#8B3A1C]/40 hover:bg-[#FDF6F2] transition-all shadow-sm group"
                  >
                    <span className="text-lg leading-none">{s.icon}</span>
                    <span className="text-xs font-medium text-stone-700 group-hover:text-[#8B3A1C] transition-colors">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                {/* AI avatar */}
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C06030] to-[#8B3A1C] flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M2 4h12M2 8h8M2 12h6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}

                <div className={`flex flex-col gap-1.5 max-w-[72%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Reasoning toggle */}
                  {msg.role === 'assistant' && msg.reasoning && (
                    <div className="w-full">
                      <button
                        onClick={() => setExpandedReasoning(expandedReasoning === msg.id ? null : msg.id)}
                        className="flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-stone-600 transition-colors py-0.5"
                      >
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
                          className={`transition-transform duration-200 ${expandedReasoning === msg.id ? 'rotate-90' : ''}`}>
                          <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>Reasoning thoughts</span>
                        {msg.isStreaming && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />}
                      </button>
                      {expandedReasoning === msg.id && (
                        <div className="mt-1.5 p-3 rounded-xl bg-amber-50 border border-amber-100 text-[11px] text-amber-800 leading-relaxed whitespace-pre-wrap font-mono max-h-44 overflow-y-auto">
                          {msg.reasoning}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-[#8B3A1C] text-white rounded-tr-sm'
                      : 'bg-white border border-stone-150 text-stone-800 rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.content ? (
                      renderContent(msg.content)
                    ) : msg.isStreaming ? (
                      <span className="flex gap-1 items-center h-4 px-1">
                        {[0, 150, 300].map((d) => (
                          <span key={d} className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </span>
                    ) : null}
                    {msg.isStreaming && msg.content && (
                      <span className="inline-block w-[2px] h-[1em] bg-current opacity-70 ml-0.5 animate-pulse align-middle" />
                    )}
                  </div>
                </div>

                {/* User avatar */}
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 mt-1">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="7" r="3.5" stroke="#A8A29E" strokeWidth="1.5"/>
                      <path d="M3 17c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#A8A29E" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input bar ─────────────────────────────────────────────────── */}
        <div className="px-6 pb-5 pt-3 bg-[#FDFCFB] border-t border-stone-100">
          <div className={`flex items-end gap-2 bg-white rounded-2xl border px-3 py-3 shadow-sm transition-colors ${
            isLoading ? 'border-stone-200' : 'border-stone-200 focus-within:border-[#8B3A1C]/50 focus-within:shadow-md'
          }`}>

            {/* Plus attachment button */}
            <div className="relative shrink-0" ref={plusMenuRef}>
              <button
                onClick={() => setShowPlusMenu(v => !v)}
                title="Attach"
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  showPlusMenu ? 'bg-[#8B3A1C]/10 text-[#8B3A1C]' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              {showPlusMenu && (
                <div className="absolute bottom-10 left-0 w-44 bg-white border border-stone-200 rounded-xl shadow-xl py-1 z-50">
                  <button
                    onClick={() => { imgInputRef.current?.click(); setShowPlusMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <rect x="2" y="4" width="16" height="12" rx="2" stroke="#8B3A1C" strokeWidth="1.5"/>
                      <circle cx="7" cy="9" r="2" stroke="#8B3A1C" strokeWidth="1.5"/>
                      <path d="M2 15l4-4 3 3 3-4 4 5" stroke="#8B3A1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Upload Image
                  </button>
                  <button
                    onClick={() => { vidInputRef.current?.click(); setShowPlusMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <rect x="2" y="5" width="11" height="10" rx="2" stroke="#8B3A1C" strokeWidth="1.5"/>
                      <path d="M13 8.5l5-3v9l-5-3v-3z" stroke="#8B3A1C" strokeWidth="1.5" strokeLinejoin="round"/>
                    </svg>
                    Upload Video
                  </button>
                </div>
              )}
              <input ref={imgInputRef} type="file" accept="image/*" className="hidden" />
              <input ref={vidInputRef} type="file" accept="video/*" className="hidden" />
            </div>

            {/* Animated typewriter overlay + textarea */}
            <div className="relative flex-1">
              {!input && !isLoading && (
                <div
                  aria-hidden
                  className="absolute inset-0 flex items-center pointer-events-none select-none"
                >
                  <span className="text-sm text-stone-400 leading-relaxed truncate">
                    {twText}
                    <span className="inline-block w-[1.5px] h-[1em] bg-stone-400 ml-[1px] align-middle animate-pulse" />
                  </span>
                </div>
              )}
              <textarea
                ref={textareaRef}
                id="ai-chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder=""
                rows={1}
                disabled={isLoading}
                className="w-full resize-none bg-transparent text-sm text-stone-800 outline-none leading-relaxed disabled:opacity-50"
                style={{ maxHeight: '160px' }}
              />
            </div>

            {/* Voice mic button */}
            <button
              onClick={startVoice}
              title={isListening ? 'Stop listening' : 'Voice input'}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                isListening
                  ? 'bg-red-50 text-red-500 animate-pulse'
                  : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                <rect x="7" y="2" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M4 10a6 6 0 0012 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M10 16v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Stop / Send button */}
            {isLoading ? (
              <button
                onClick={() => { abortRef.current?.abort(); setIsLoading(false); }}
                title="Stop generation"
                className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-red-50 hover:text-red-500 text-stone-500 flex items-center justify-center transition-colors shrink-0"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="1.5" y="1.5" width="9" height="9" rx="2" fill="currentColor"/>
                </svg>
              </button>
            ) : (
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim()}
                title="Send (Enter)"
                className="w-8 h-8 rounded-lg bg-[#8B3A1C] hover:bg-[#7A3319] disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0 shadow-sm hover:shadow-md"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M14 8L2 2l3 6-3 6 12-6z" fill="white"/>
                </svg>
              </button>
            )}
          </div>
          <p className="text-center text-[10px] text-stone-400 mt-2 select-none">
            <kbd className="px-1 py-0.5 rounded text-[9px] bg-stone-100 border border-stone-200 font-mono">Enter</kbd> to send ·{' '}
            <kbd className="px-1 py-0.5 rounded text-[9px] bg-stone-100 border border-stone-200 font-mono">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  );
}



