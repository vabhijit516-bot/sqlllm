import React, { useState, useEffect, useRef } from 'react';
import ThreeCanvas from './components/ThreeCanvas';
import ChatMessage from './components/ChatMessage';
import SchemaExplorer from './components/SchemaExplorer';
import DashboardView from './components/DashboardView';
import GoogleAuth from './components/GoogleAuth';
import VoiceInput from './components/VoiceInput';
import TablePreviewModal from './components/TablePreviewModal';
import { animateClick, animateTabSwitch, animateFloat, useAnimeStagger, useAnimeTilt } from './utils/useAnime';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'schema' | 'dashboard'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Chat Session & Messages
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionSearch, setSessionSearch] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // User Auth & Dashboard Pinned Items
  const [user, setUser] = useState(null);
  const [pinnedCharts, setPinnedCharts] = useState([]);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [selectedTable, setSelectedTable] = useState(null);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const mainContentRef = useRef(null);
  const heroBadgeRef = useRef(null);
  const promptGridRef = useRef(null);
  const sessionListRef = useRef(null);
  const textareaRef = useRef(null);

  // Quick suggestion chips above the input bar (with interactive image icons)
  const quickChips = [
    { 
      label: "Top 5 Products", 
      icon: "bar_chart", 
      gradient: "from-cyan-500 to-blue-600",
      glow: "group-hover:shadow-[0_0_12px_rgba(6,182,212,0.6)]",
      query: "Show me top 5 products by revenue this quarter" 
    },
    { 
      label: "ER Diagram", 
      icon: "account_tree", 
      gradient: "from-purple-500 to-indigo-600",
      glow: "group-hover:shadow-[0_0_12px_rgba(168,85,247,0.6)]",
      query: "Draw me the ER diagram for this database" 
    },
    { 
      label: "Revenue Trend", 
      icon: "trending_up", 
      gradient: "from-emerald-400 to-teal-600",
      glow: "group-hover:shadow-[0_0_12px_rgba(52,211,153,0.6)]",
      query: "Show me monthly revenue trend for orders over the last year" 
    },
    { 
      label: "Top Customers", 
      icon: "monetization_on", 
      gradient: "from-amber-400 to-orange-600",
      glow: "group-hover:shadow-[0_0_12px_rgba(251,191,36,0.6)]",
      query: "Which customers have spent the most money?" 
    },
    { 
      label: "Inventory Check", 
      icon: "inventory_2", 
      gradient: "from-rose-400 to-pink-600",
      glow: "group-hover:shadow-[0_0_12px_rgba(251,113,133,0.6)]",
      query: "Which products have low stock level in inventory?" 
    }
  ];

  // Fetch Session History list on mount or when user logs in
  useEffect(() => {
    fetchSessions(user?.email);
  }, [user?.email]);

  const changeTab = (tabName) => {
    setActiveTab(tabName);
    if (mainContentRef.current) {
      animateTabSwitch(mainContentRef);
    }
  };

  const handleScroll = () => {
    if (chatContainerRef.current) {
      setScrollOffset(chatContainerRef.current.scrollTop);
    }
  };

  const fetchSessions = async (userEmail) => {
    try {
      const emailQuery = userEmail || (user ? user.email : '');
      const endpoint = emailQuery ? `/api/sessions?email=${encodeURIComponent(emailQuery)}` : '/api/sessions';
      const res = await fetch(endpoint);
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (e) {
      console.error('Fetch sessions error:', e);
    }
  };



  const loadSessionMessages = async (sid) => {
    try {
      setSessionId(sid);
      const res = await fetch(`/api/sessions/${sid}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (e) {
      console.error('Fetch session messages error:', e);
    }
  };

  const handleDeleteSession = async (e, sid) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation history?')) return;

    try {
      const res = await fetch(`/api/sessions/${sid}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.session_id !== sid));
        if (sessionId === sid) {
          setSessionId(null);
          setMessages([]);
        }
      } else {
        console.error('Failed to delete session');
      }
    } catch (err) {
      console.error('Delete session error:', err);
    }
  };

  const startNewSession = (e) => {
    if (e && e.currentTarget) animateClick(e.currentTarget);
    setSessionId(null);
    setMessages([]);
    changeTab('chat');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (queryText) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend || !textToSend.trim() || loading) return;

    setInputQuery('');
    setLoading(true);

    const userMsg = {
      message_id: Date.now().toString(),
      role: 'user',
      content: textToSend.trim(),
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          session_id: sessionId,
          user_email: user ? user.email : 'guest@datapulse.ai'
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (!sessionId && data.session_id) {
        setSessionId(data.session_id);
        fetchSessions();
      }

      setMessages((prev) => [...prev, data]);
    } catch (err) {
      console.error('Send message error:', err);
      setMessages((prev) => [
        ...prev,
        {
          message_id: Date.now().toString(),
          role: 'assistant',
          content: 'Sorry, an error occurred processing your database query. Please check your backend connection.',
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePinChart = (chartData) => {
    setPinnedCharts((prev) => [...prev, chartData]);
  };

  const handleRemovePinnedChart = (index) => {
    setPinnedCharts((prev) => prev.filter((_, i) => i !== index));
  };

  const filteredSessions = sessions.filter((s) =>
    (s.title || '').toLowerCase().includes(sessionSearch.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-transparent text-on-background font-body-md antialiased selection:bg-primary-container selection:text-on-primary-container relative overflow-hidden">
      {/* Waterfall Custom Image Background */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-85 pointer-events-none transition-all duration-700 filter brightness-105 contrast-105"
        style={{ backgroundImage: `url('/waterfall_bg.jpg')` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#0c1324]/60 via-[#0c1324]/40 to-[#0c1324]/75 pointer-events-none" />

      {/* 3D Three.js Interactive Backdrop */}
      <ThreeCanvas scrollOffset={scrollOffset} />

      {/* SideNavBar */}
      <nav className={`${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 hidden md:flex flex-col h-screen p-sm border-r border-outline-variant/50 bg-[#0c1324]/75 backdrop-blur-xl flex-shrink-0 z-20 relative shadow-2xl`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center overflow-hidden border border-outline-variant relative flex-shrink-0 shadow-md">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-container/20 to-secondary-container/20"></div>
              <span className="font-headline-md text-primary-container font-bold relative z-10">T</span>
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-headline-md text-headline-md font-extrabold text-on-surface tracking-tight">TechX AI</h1>
                <p className="font-label-sm text-label-sm text-primary-container">Intelligence Core</p>
              </div>
            )}
          </div>
          <button
            onClick={(e) => {
              animateClick(e.currentTarget);
              setSidebarOpen(!sidebarOpen);
            }}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-md hover:bg-surface-variant/50 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">{sidebarOpen ? 'chevron_left' : 'chevron_right'}</span>
          </button>
        </div>

        {/* CTA */}
        <button
          onClick={startNewSession}
          className="primary-gradient-btn text-white w-full py-3 rounded-lg font-label-md flex items-center justify-center gap-2 mb-6 group shadow-lg shadow-primary-container/10 active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:rotate-90 transition-transform duration-300">add</span>
          {sidebarOpen && <span>New Conversation</span>}
        </button>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto">
          <ul className="space-y-1.5">
            <li>
              <button
                onClick={(e) => {
                  animateClick(e.currentTarget);
                  changeTab('chat');
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold transition-all relative overflow-hidden ${
                  activeTab === 'chat'
                    ? 'bg-secondary-container text-on-secondary-container translate-x-1 primary-glow'
                    : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary-fixed-dim'
                }`}
              >
                {activeTab === 'chat' && <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>}
                <span className="material-symbols-outlined text-[20px] relative z-10">chat_bubble</span>
                {sidebarOpen && <span className="font-label-md text-label-md relative z-10">Agent Chat</span>}
              </button>
            </li>

            <li>
              <button
                onClick={(e) => {
                  animateClick(e.currentTarget);
                  changeTab('schema');
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold transition-all relative overflow-hidden ${
                  activeTab === 'schema'
                    ? 'bg-secondary-container text-on-secondary-container translate-x-1 primary-glow'
                    : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary-fixed-dim'
                }`}
              >
                {activeTab === 'schema' && <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>}
                <span className="material-symbols-outlined text-[20px] relative z-10">database</span>
                {sidebarOpen && <span className="font-label-md text-label-md relative z-10">Schema Explorer</span>}
              </button>
            </li>

            <li>
              <button
                onClick={(e) => {
                  animateClick(e.currentTarget);
                  changeTab('dashboard');
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-bold transition-all relative overflow-hidden ${
                  activeTab === 'dashboard'
                    ? 'bg-secondary-container text-on-secondary-container translate-x-1 primary-glow'
                    : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary-fixed-dim'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px] relative z-10">grid_view</span>
                  {sidebarOpen && <span className="font-label-md text-label-md relative z-10">Dashboard</span>}
                </div>
                {sidebarOpen && pinnedCharts.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary-container text-[11px] font-mono border border-primary-container/30 font-bold">
                    {pinnedCharts.length}
                  </span>
                )}
              </button>
            </li>
          </ul>

          {/* Interactive Searchable Recent Conversations */}
          {sidebarOpen && (
            <div ref={sessionListRef} className="mt-6 border-t border-outline-variant/40 pt-4 space-y-2">
              <div className="flex items-center justify-between px-3 mb-1">
                <h2 className="text-[10px] uppercase tracking-widest text-outline font-semibold">
                  Recent Conversations
                </h2>
                <span className="text-[10px] font-mono text-primary-container font-bold">{filteredSessions.length}</span>
              </div>

              {/* Sidebar Search Input */}
              <div className="px-2 mb-2">
                <div className="flex items-center gap-1.5 bg-surface-container/60 border border-outline-variant/60 rounded-lg px-2.5 py-1 text-xs focus-within:border-primary-container transition-colors">
                  <span className="material-symbols-outlined text-[14px] text-outline">search</span>
                  <input
                    type="text"
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    placeholder="Search chats..."
                    className="w-full bg-transparent text-on-surface placeholder-on-surface-variant focus:outline-none text-[11px]"
                  />
                  {sessionSearch && (
                    <button onClick={() => setSessionSearch('')} className="text-outline hover:text-on-surface text-[12px]">✕</button>
                  )}
                </div>
              </div>

              <ul className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {filteredSessions.map((s) => (
                  <li key={s.session_id} className="group/session relative">
                    <div
                      onClick={(e) => {
                        animateClick(e.currentTarget);
                        loadSessionMessages(s.session_id);
                        changeTab('chat');
                      }}
                      className={`session-item w-full flex items-center justify-between px-3 py-2 text-on-surface-variant hover:bg-surface-variant/50 cursor-pointer rounded-lg transition-colors group text-left ${
                        sessionId === s.session_id ? 'bg-surface-variant text-on-surface font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-1">
                        <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary-container flex-shrink-0">
                          history
                        </span>
                        <span className="font-label-sm text-label-sm truncate group-hover:text-on-surface">
                          {s.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        title="Delete conversation"
                        onClick={(e) => handleDeleteSession(e, s.session_id)}
                        className="opacity-0 group-hover/session:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 text-outline rounded transition-all flex-shrink-0 ml-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent bg-pattern z-10">
        {/* TopAppBar */}
        <header className="h-16 flex justify-between items-center w-full px-md py-xs max-w-container-max mx-auto bg-[#0c1324]/50 backdrop-blur-md border-b border-outline-variant/40 z-20 flex-shrink-0">
          {/* Left Status Indicators */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-on-surface p-1.5 hover:bg-surface-variant rounded-md"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1 rounded-full border border-outline-variant text-xs shadow-sm">
                <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse"></span>
                <span className="text-on-surface font-mono">SQLite + Postgres</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1 rounded-full border border-outline-variant text-xs shadow-sm">
                <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
                <span className="text-on-surface font-mono">NoSQL Logs</span>
              </div>
              <div className="hidden lg:flex items-center gap-2 bg-surface-container-high px-3 py-1 rounded-full border border-outline-variant text-xs shadow-sm">
                <span className="material-symbols-outlined text-[14px] text-primary-container">auto_awesome</span>
                <span className="text-on-surface font-mono">Anime.js Engine</span>
              </div>
            </div>
          </div>

          {/* Right Header Google Sign-In */}
          <div className="flex items-center gap-3">
            <GoogleAuth user={user} onAuthSuccess={(u) => setUser(u)} onLogout={() => setUser(null)} />
          </div>
        </header>

        {/* Dynamic Content Display */}
        <div ref={mainContentRef} className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
          {activeTab === 'schema' && (
            <div className="h-full flex justify-center p-6 overflow-y-auto">
              <SchemaExplorer
                onSelectPrompt={(promptText) => {
                  changeTab('chat');
                  handleSendMessage(promptText);
                }}
              />
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardView pinnedCharts={pinnedCharts} onRemoveChart={handleRemovePinnedChart} />
          )}

          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col h-full min-h-0 relative">
              {/* Chat Feed Scroll Area */}
              <main
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto flex flex-col relative z-0 pb-44"
              >
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full z-10 my-auto py-6">
                    {/* Hero Badge */}
                    <div ref={heroBadgeRef} className="glass-panel px-6 py-2.5 rounded-full flex items-center gap-4 mb-6 shadow-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center">
                          <span className="font-headline-md text-primary-container font-bold text-[10px]">T</span>
                        </div>
                        <span className="font-label-md text-label-md text-on-surface font-semibold">TechX Intelligence Core</span>
                      </div>
                      <div className="w-px h-4 bg-outline-variant"></div>
                      <div className="flex items-center gap-2 text-primary-container">
                        <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                        <span className="font-label-md text-label-md">Multi-DB SQL & NoSQL</span>
                      </div>
                    </div>

                    {/* Headline */}
                    <div className="text-center mb-8 max-w-3xl mx-auto">
                      <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-on-surface mb-4 leading-tight tracking-tight">
                        How can <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] to-[#3626ce]">TechX Enterprise AI</span> analyze your database today?
                      </h2>
                      <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
                        Ask natural language questions to query SQL tables, render 2D/3D charts, generate Mermaid ER diagrams, and receive conversational insights.
                      </p>
                    </div>

                    {/* Suggestion Cards Grid */}
                    <div ref={promptGridRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                      {/* Card 1 */}
                      <button
                        onClick={(e) => {
                          animateClick(e.currentTarget);
                          handleSendMessage('Show me the top 5 products by revenue this quarter');
                        }}
                        className="prompt-card glass-card p-5 rounded-xl text-left flex flex-col gap-3 group relative overflow-hidden active:scale-98"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-secondary-container/25"></div>
                        <div className="flex items-center gap-2 text-secondary-container">
                          <span className="material-symbols-outlined">bar_chart</span>
                          <span className="font-label-md text-label-md font-bold">Sales Analysis</span>
                        </div>
                        <p className="font-body-md text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors">
                          "Show me top 5 products by revenue this quarter"
                        </p>
                      </button>

                      {/* Card 2 */}
                      <button
                        onClick={(e) => {
                          animateClick(e.currentTarget);
                          handleSendMessage('Draw me the ER diagram for this database');
                        }}
                        className="prompt-card glass-card p-5 rounded-xl text-left flex flex-col gap-3 group relative overflow-hidden active:scale-98"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-primary-container/25"></div>
                        <div className="flex items-center gap-2 text-primary-container">
                          <span className="material-symbols-outlined">account_tree</span>
                          <span className="font-label-md text-label-md font-bold">Database ER Diagram</span>
                        </div>
                        <p className="font-body-md text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors">
                          "Draw me the ER diagram for this database"
                        </p>
                      </button>

                      {/* Card 3 */}
                      <button
                        onClick={(e) => {
                          animateClick(e.currentTarget);
                          handleSendMessage('Create a flowchart showing how orders flow through our system');
                        }}
                        className="prompt-card glass-card p-5 rounded-xl text-left flex flex-col gap-3 group relative overflow-hidden active:scale-98"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary-container/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-tertiary-container/25"></div>
                        <div className="flex items-center gap-2 text-[#fbbf24]">
                          <span className="material-symbols-outlined">schema</span>
                          <span className="font-label-md text-label-md font-bold">Process Visualization</span>
                        </div>
                        <p className="font-body-md text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors">
                          "Create a flowchart showing how orders flow through our system"
                        </p>
                      </button>

                      {/* Card 4 */}
                      <button
                        onClick={(e) => {
                          animateClick(e.currentTarget);
                          handleSendMessage('Show me the monthly revenue trend for orders over the last year');
                        }}
                        className="prompt-card glass-card p-5 rounded-xl text-left flex flex-col gap-3 group relative overflow-hidden active:scale-98"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary-fixed-dim/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-tertiary-fixed-dim/25"></div>
                        <div className="flex items-center gap-2 text-tertiary-fixed-dim">
                          <span className="material-symbols-outlined">insights</span>
                          <span className="font-label-md text-label-md font-bold">Trend Analytics</span>
                        </div>
                        <p className="font-body-md text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors">
                          "Show me monthly revenue trend for orders over the last year"
                        </p>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 md:p-8 space-y-4 max-w-4xl mx-auto w-full">
                    {messages.map((msg, idx) => (
                      <ChatMessage
                        key={msg.message_id || idx}
                        message={msg}
                        onPinChart={handlePinChart}
                        onSelectTable={(tbl) => setSelectedTable(tbl)}
                      />
                    ))}
                  </div>
                )}

                {/* Processing Indicator */}
                {loading && (
                  <div className="max-w-4xl mx-auto w-full px-4 md:px-8 mb-6 flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-primary-container to-secondary-container flex items-center justify-center text-on-primary-container shadow-lg">
                      <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                    </div>
                    <div className="glass-panel p-4 rounded-2xl border border-outline-variant text-xs text-on-surface-variant flex items-center space-x-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-container animate-ping"></div>
                      <span className="font-mono">Agent executing get_schema → execute_query → generate_chart...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </main>

              {/* Bottom Input Area with Interactive Quick Prompt Chips */}
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-surface via-surface/95 to-transparent pt-6 pb-4 px-4 z-20">
                <div className="max-w-3xl mx-auto space-y-2">
                  {/* Interactive Quick Chips with Interactive Image Badges */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {quickChips.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          animateClick(e.currentTarget);
                          setInputQuery(chip.query);
                          textareaRef.current?.focus();
                        }}
                        className="group px-3 py-1.5 rounded-full bg-surface-container-high/90 hover:bg-surface-variant text-[11px] font-mono text-on-surface-variant hover:text-on-surface border border-outline-variant/60 hover:border-cyan-500/40 whitespace-nowrap transition-all duration-300 shadow-sm active:scale-95 flex items-center gap-2 hover:scale-[1.02]"
                      >
                        <span className={`relative w-5 h-5 rounded-md bg-gradient-to-br ${chip.gradient} flex items-center justify-center text-white text-[12px] shadow-sm ${chip.glow} group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 overflow-hidden`}>
                          <span className="material-symbols-outlined text-[13px] transition-transform duration-300 group-hover:scale-115">
                            {chip.icon}
                          </span>
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                        </span>
                        <span>{chip.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Glass Input Bar */}
                  <div className="relative glass-panel rounded-2xl chat-input-glow transition-all duration-300">
                    <textarea
                      ref={textareaRef}
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask any question about your database or requested visualization..."
                      rows={1}
                      className="w-full glass-panel bg-[#0c1324]/30 border border-outline-variant/60 rounded-2xl py-4 pl-6 pr-28 font-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-0 focus:border-cyan-400/50 transition-colors resize-none shadow-xl"
                    />

                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {inputQuery && (
                        <button
                          onClick={() => setInputQuery('')}
                          className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-variant transition-colors text-xs"
                          title="Clear prompt"
                        >
                          ✕
                        </button>
                      )}

                      <VoiceInput onTranscript={(t) => setInputQuery((prev) => (prev ? prev + ' ' + t : t))} />
                      
                      <button
                        onClick={(e) => {
                          animateClick(e.currentTarget);
                          handleSendMessage();
                        }}
                        disabled={!inputQuery.trim() || loading}
                        aria-label="Send message"
                        className="p-2.5 rounded-xl bg-secondary-container/20 text-secondary hover:bg-secondary-container hover:text-on-secondary-container disabled:opacity-40 transition-colors primary-glow active:scale-95 flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>send</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-center font-label-sm text-[11px] text-outline-variant font-mono">
                    TechX AI translates natural language into structured SQL operations. Query results are read-only.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table Inspection Modal */}
      {selectedTable && (
        <TablePreviewModal
          tableName={selectedTable}
          onClose={() => setSelectedTable(null)}
          onAnalyzeTable={(tbl) => {
            changeTab('chat');
            handleSendMessage(`Analyze the contents, key columns, and sample rows of table '${tbl}'`);
          }}
        />
      )}
    </div>
  );
}




