import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import ChatAssistant from './ChatAssistant';
import { Bot, User, Shield, Server, Terminal, Settings, Layers, Code, Play } from 'lucide-react';

function SandboxApp() {
    const [role, setRole] = useState('parent');
    const [username, setUsername] = useState('7840954075');
    const [logs, setLogs] = useState([]);
    const [backendStatus, setBackendStatus] = useState('checking');

    // Intercept fetch inside ChatAssistant for debugging console logs
    useEffect(() => {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = args[0];
            const options = args[1];
            
            if (typeof url === 'string' && url.includes('/api/chatbot/chat')) {
                const requestBody = JSON.parse(options.body);
                const timestamp = new Date().toLocaleTimeString();
                
                // Add outgoing request log
                const reqLog = {
                    id: Math.random().toString(),
                    type: 'outgoing',
                    timestamp,
                    title: 'POST /api/chatbot/chat',
                    payload: requestBody
                };
                setLogs(prev => [reqLog, ...prev]);

                try {
                    const response = await originalFetch(...args);
                    const clone = response.clone();
                    const responseData = await clone.json();

                    // Add incoming response log
                    const resLog = {
                        id: Math.random().toString(),
                        type: 'incoming',
                        timestamp,
                        title: 'Response Received (200 OK)',
                        payload: responseData
                    };
                    setLogs(prev => [resLog, ...prev]);
                    return response;
                } catch (error) {
                    const errLog = {
                        id: Math.random().toString(),
                        type: 'error',
                        timestamp,
                        title: 'Network Connection Failed',
                        payload: { error: error.message, server: 'http://localhost:5050' }
                    };
                    setLogs(prev => [errLog, ...prev]);
                    throw error;
                }
            }
            return originalFetch(...args);
        };

        // Ping backend status
        const checkBackend = async () => {
            try {
                const res = await originalFetch('http://localhost:5050/');
                if (res.ok) {
                    setBackendStatus('online');
                } else {
                    setBackendStatus('error');
                }
            } catch (e) {
                setBackendStatus('offline');
            }
        };

        checkBackend();
        const interval = setInterval(checkBackend, 5000);
        return () => {
            window.fetch = originalFetch;
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 font-sans flex flex-col selection:bg-violet-600 selection:text-white relative overflow-hidden">
            {/* Glowing mesh background decoration */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-800/10 rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-800/10 rounded-full blur-[160px] pointer-events-none" />

            {/* Premium Top Navigation */}
            <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-8 py-5 flex items-center justify-between shrink-0 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-900/20 border border-white/10">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-outfit font-black text-lg tracking-wide uppercase">Grace AI Sandbox</h1>
                        <p className="text-[10px] font-black text-violet-400 tracking-widest uppercase">Chatbot Lab Prototyping Panel</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Backend Health Check Badge */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                        <span className={`w-2 h-2 rounded-full ${
                            backendStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' :
                            backendStatus === 'checking' ? 'bg-amber-400 animate-pulse' :
                            'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                        }`} />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Server (5050): {backendStatus.toUpperCase()}
                        </span>
                    </div>
                </div>
            </header>

            {/* Dashboard Workspace */}
            <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto w-full">
                {/* Control Panel (4 Columns) */}
                <section className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/60 p-6 rounded-3xl space-y-6">
                        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800/80">
                            <Settings className="w-4 h-4 text-violet-400" />
                            <h2 className="font-outfit font-bold text-sm uppercase tracking-wider text-slate-200">Simulation Config</h2>
                        </div>

                        {/* Role Selector */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <User className="w-3 h-3 text-slate-500" /> Logged-In User Role
                            </label>
                            <div className="grid grid-cols-2 gap-2.5">
                                <button
                                    onClick={() => setRole('parent')}
                                    className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                                        role === 'parent' 
                                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 border-transparent text-white shadow-lg shadow-violet-900/20' 
                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                                    }`}
                                >
                                    <Shield className="w-3.5 h-3.5" /> Parent Portal
                                </button>
                                <button
                                    onClick={() => setRole('admin')}
                                    className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                                        role === 'admin' 
                                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 border-transparent text-white shadow-lg shadow-violet-900/20' 
                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                                    }`}
                                >
                                    <Layers className="w-3.5 h-3.5" /> Administrator
                                </button>
                            </div>
                        </div>

                        {/* Parent Username Selector */}
                        {role === 'parent' && (
                            <div className="space-y-3 animate-in fade-in duration-200">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <User className="w-3 h-3 text-slate-500" /> Simulated Parent Account (From DB)
                                </label>
                                <select
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 text-slate-300 focus:border-violet-500 outline-none transition-all cursor-pointer"
                                >
                                    <option value="7840954075">7840954075 (Dhongade A.)</option>
                                    <option value="7875407569">7875407569 (Dhonagde A.)</option>
                                    <option value="2342342343">2342342343 (Patange R.)</option>
                                    <option value="1234567890">1234567890 (Ghayla S.)</option>
                                    <option value="7840954074">7840954074 (asdasd)</option>
                                </select>
                            </div>
                        )}

                        {/* Info Sandbox Specs */}
                        <div className="bg-slate-950/80 border border-slate-900/50 p-4 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-violet-400 tracking-wider">
                                <Server className="w-3.5 h-3.5" /> Sandbox Specification
                            </div>
                            <ul className="space-y-2 text-[11px] text-slate-400 leading-relaxed font-medium">
                                <li className="flex justify-between"><span className="text-slate-500">Service:</span> Standalone Sandbox</li>
                                <li className="flex justify-between"><span className="text-slate-500">Framework:</span> React + Vite Engine</li>
                                <li className="flex justify-between"><span className="text-slate-500">Port Mapping:</span> Frontend: 3000 | Backend: 5050</li>
                                <li className="flex justify-between"><span className="text-slate-500">AI Integrator:</span> Google Gemini Pro</li>
                            </ul>
                        </div>
                    </div>

                    {/* How to Run Sandbox Notice Card */}
                    <div className="bg-gradient-to-br from-violet-950/20 to-indigo-950/20 border border-violet-800/20 p-5 rounded-3xl">
                        <h4 className="font-outfit font-black text-xs uppercase tracking-wider text-violet-300 flex items-center gap-2 mb-2">
                            <Play className="w-3.5 h-3.5 text-violet-400 fill-violet-400/20" /> How to Start Chatbot Lab
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium mb-3">
                            Run these two terminal commands inside the `/chatbot-lab` workspace directory:
                        </p>
                        <div className="bg-slate-950/90 border border-slate-900 p-3 rounded-xl font-mono text-[10px] text-violet-300 space-y-1.5">
                            <p className="text-slate-500"># Start isolated backend server</p>
                            <p>npm run backend</p>
                            <p className="text-slate-500 mt-2"># Start isolated Vite client</p>
                            <p>npm run dev</p>
                        </div>
                    </div>
                </section>

                {/* Developer Logger Console (8 Columns) */}
                <section className="lg:col-span-8 bg-slate-900/20 backdrop-blur-sm border border-slate-800/40 rounded-3xl overflow-hidden flex flex-col h-[520px]">
                    <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/20">
                        <div className="flex items-center gap-2.5">
                            <Terminal className="w-4 h-4 text-emerald-400" />
                            <h2 className="font-outfit font-bold text-sm uppercase tracking-wider text-slate-200">Real-Time HTTP Payloads Console</h2>
                        </div>
                        <button 
                            onClick={() => setLogs([])}
                            className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg transition-colors bg-slate-950"
                        >
                            Clear Logs
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs">
                        {logs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2.5">
                                <Code className="w-8 h-8 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Waiting for sandbox API requests...</p>
                            </div>
                        ) : (
                            logs.map(log => (
                                <div 
                                    key={log.id} 
                                    className={`p-4 rounded-2xl border text-[11px] space-y-2 ${
                                        log.type === 'outgoing' ? 'bg-violet-950/20 border-violet-800/20' :
                                        log.type === 'incoming' ? 'bg-emerald-950/10 border-emerald-800/25' :
                                        'bg-rose-950/15 border-rose-800/30'
                                    }`}
                                >
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider pb-2 border-b border-slate-800/20">
                                        <span className={
                                            log.type === 'outgoing' ? 'text-violet-400' :
                                            log.type === 'incoming' ? 'text-emerald-400' :
                                            'text-rose-400'
                                        }>
                                            {log.type === 'outgoing' ? '⚡ OUTGOING REQUEST' : log.type === 'incoming' ? '📥 INCOMING RESPONSE' : '⚠️ NETWORK ERROR'}
                                        </span>
                                        <span className="text-slate-500 font-medium">{log.timestamp}</span>
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-200 mb-1">{log.title}</div>
                                        <pre className="text-[10px] text-slate-400 overflow-x-auto whitespace-pre-wrap max-h-[120px] bg-slate-950/70 p-3 rounded-xl border border-slate-900/60 leading-relaxed">
                                            {JSON.stringify(log.payload, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>

            {/* Mount the Floating Drawer Component */}
            <ChatAssistant role={role} username={username} />
        </div>
    );
}

const rootElement = document.getElementById('root');
ReactDOM.createRoot(rootElement).render(<SandboxApp />);
