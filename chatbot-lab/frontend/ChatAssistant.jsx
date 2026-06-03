import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles, Loader2, RefreshCw } from 'lucide-react';

export default function ChatAssistant({ role = 'parent', username = '7840954075' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sessionId] = useState(`session-${Math.random().toString(36).substr(2, 9)}`);
    const messagesEndRef = useRef(null);

    // Dynamic suggest chips
    const suggestions = {
        parent: [
            "Check attendance",
            "When is the next exam?",
            "Any pending fees?",
            "Summary report"
        ],
        admin: [
            "Roster overview",
            "Generate financial summary",
            "Verify security logs"
        ]
    };

    const activeSuggestions = suggestions[role] || suggestions.parent;

    useEffect(() => {
        if (isOpen && chatHistory.length === 0) {
            // Seed a premium greeting message
            setChatHistory([
                {
                    role: 'assistant',
                    content: `👋 Hello! I am **Grace AI**, your smart cognitive institutional assistant. How can I help you manage learning parameters today?`
                }
            ]);
        }
    }, [isOpen, chatHistory]);

    useEffect(() => {
        // Auto-scroll to bottom of messages
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleSend = async (textToSend) => {
        const query = textToSend || message;
        if (!query.trim()) return;

        setChatHistory(prev => [...prev, { role: 'user', content: query }]);
        if (!textToSend) setMessage('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5050/api/chatbot/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: query, sessionId, role, username })
            });
            const data = await response.json();
            
            setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
        } catch (error) {
            console.error("AI Communication error:", error);
            setChatHistory(prev => [...prev, { 
                role: 'assistant', 
                content: `⚠️ Failed to reach the isolated **Chatbot Lab Backend**. Ensure the server on port \`5050\` is running!` 
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[99999] font-inter">
            {/* Floating Chat Toggle Bubble */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 relative group border border-white/10"
                >
                    <MessageSquare className="w-6 h-6 animate-pulse" />
                    <span className="absolute right-full mr-3 bg-slate-900/90 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/5 shadow-md">
                        Grace AI Assistant
                    </span>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-slate-900 flex items-center justify-center">
                        <Sparkles className="w-2.5 h-2.5 text-slate-950 fill-slate-950" />
                    </div>
                </button>
            )}

            {/* Premium Chat Panel Container */}
            {isOpen && (
                <div 
                    className="w-[90vw] sm:w-[400px] h-[550px] bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 text-white"
                    style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                >
                    {/* Header */}
                    <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-tr from-violet-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg border border-white/10">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                                <h4 className="font-black text-sm tracking-wide uppercase leading-tight">Grace AI Assistant</h4>
                                <span className="text-[9px] font-black text-violet-400 tracking-widest uppercase flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5 fill-violet-400/20" /> Chatbot Lab Sandbox
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 hover:bg-slate-800/80 rounded-lg text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-800"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Message Ledger */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
                        {chatHistory.map((chat, idx) => {
                            const isAssistant = chat.role === 'assistant';
                            return (
                                <div 
                                    key={idx} 
                                    className={`flex gap-3 max-w-[85%] ${isAssistant ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'}`}
                                >
                                    {isAssistant && (
                                        <div className="w-7 h-7 bg-violet-900/40 text-violet-400 rounded-lg border border-violet-800/40 flex items-center justify-center shrink-0">
                                            <Bot className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <div className={`p-3.5 rounded-2xl text-xs leading-relaxed font-medium ${isAssistant ? 'bg-slate-900 text-slate-100 border border-slate-800/40 rounded-tl-none' : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-none'}`}>
                                            {chat.content}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {loading && (
                            <div className="flex gap-3 max-w-[85%] mr-auto text-left items-center">
                                <div className="w-7 h-7 bg-violet-900/40 text-violet-400 rounded-lg border border-violet-800/40 flex items-center justify-center shrink-0">
                                    <Bot className="w-3.5 h-3.5" />
                                </div>
                                <div className="p-3.5 bg-slate-900 text-slate-400 rounded-2xl rounded-tl-none text-xs flex items-center gap-2 border border-slate-800/40">
                                    <Loader2 className="w-3 h-3 animate-spin text-violet-400" /> Thinking...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestions Box */}
                    {chatHistory.length <= 2 && !loading && (
                        <div className="px-5 py-2 flex flex-wrap gap-2 shrink-0 border-t border-slate-900 bg-slate-950">
                            {activeSuggestions.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(item)}
                                    className="px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border border-slate-800/60 hover:border-slate-700"
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Console */}
                    <div className="p-4 bg-slate-900/50 border-t border-slate-900 flex items-center gap-3 shrink-0">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={`Ask anything as a ${role}...`}
                            className="flex-1 p-3 px-4 bg-slate-950 border border-slate-800 rounded-xl outline-none text-xs focus:border-violet-500 font-medium transition-all text-white placeholder-slate-500"
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={loading || !message.trim()}
                            className="p-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl transition-all shadow-md shadow-violet-900/10 disabled:opacity-30 disabled:scale-100 active:scale-95"
                        >
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
