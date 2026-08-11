import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Code, Copy, Check, ChevronDown, ChevronUp, Cpu, Sparkles, Download, Zap, Table, ArrowUpRight } from 'lucide-react';
import anime from 'animejs';
import ChartViewer from './ChartViewer';
import MermaidViewer from './MermaidViewer';
import { animateClick, animateAccordion, animatePulseAura } from '../utils/useAnime';

const KNOWN_TABLES = ['customers', 'categories', 'products', 'orders', 'order_items', 'inventory', 'reviews'];

export default function ChatMessage({ message, onPinChart, onSelectTable }) {
  const [copied, setCopied] = useState(false);
  const [showThoughts, setShowThoughts] = useState(false);
  const messageCardRef = useRef(null);
  const thoughtsRef = useRef(null);
  const sqlCardRef = useRef(null);

  const isUser = message.role === 'user';

  // Anime.js entrance animation on mount
  useEffect(() => {
    if (messageCardRef.current) {
      anime({
        targets: messageCardRef.current,
        translateY: [24, 0],
        opacity: [0, 1],
        scale: [0.96, 1],
        duration: 550,
        easing: 'cubicBezier(0.16, 1, 0.3, 1)'
      });
    }
  }, []);

  // Anime.js pulse aura for generated SQL blocks
  useEffect(() => {
    if (sqlCardRef.current && !isUser) {
      animatePulseAura(sqlCardRef);
    }
  }, [message.sql_query, isUser]);

  const toggleThoughts = (e) => {
    if (e && e.currentTarget) animateClick(e.currentTarget);
    const nextState = !showThoughts;
    setShowThoughts(nextState);
    if (thoughtsRef.current) {
      animateAccordion(thoughtsRef.current, nextState);
    }
  };

  const copySQL = (e) => {
    if (e && e.currentTarget) animateClick(e.currentTarget);
    if (!message.sql_query) return;
    navigator.clipboard.writeText(message.sql_query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = async (e) => {
    if (e && e.currentTarget) animateClick(e.currentTarget);
    if (!message.chart_data || !message.chart_data.data) return;
    try {
      const res = await fetch('/api/export/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: message.chart_data.data,
          filename: 'techx_data_export.csv'
        })
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'techx_data_export.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export CSV error:', err);
    }
  };

  // Detect tables mentioned in SQL or content text
  const detectedTables = KNOWN_TABLES.filter(t => {
    const textToSearch = ((message.content || '') + ' ' + (message.sql_query || '')).toLowerCase();
    return textToSearch.includes(t);
  });

  return (
    <div ref={messageCardRef} className={`flex space-x-3.5 mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0 border border-indigo-400/30">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}

      {/* Message Content Container */}
      <div className={`max-w-3xl ${isUser ? 'order-1' : 'order-2'} w-full`}>
        {/* Header Name & Timestamp */}
        <div className={`flex items-center space-x-2 mb-1.5 text-xs text-slate-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="font-semibold text-slate-200 font-display">{isUser ? 'You' : 'TechX Intelligence'}</span>
          <span className="text-slate-600">•</span>
          <span className="font-mono text-[11px] text-slate-400">
            {new Date(message.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Message Bubble */}
        <div
          className={`p-4 md:p-5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none shadow-xl shadow-indigo-600/20 font-medium'
              : 'glass-panel border border-slate-700/70 rounded-tl-none text-slate-200 shadow-2xl'
          }`}
        >
          {/* Main Content Text */}
          <div className="whitespace-pre-wrap font-sans text-slate-100">{message.content}</div>

          {/* Interactive Table Redirection Pills */}
          {!isUser && detectedTables.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-slate-700/50 flex items-center flex-wrap gap-1.5">
              <span className="text-[11px] font-mono text-slate-400 mr-1 flex items-center">
                <Table className="w-3.5 h-3.5 text-cyan-400 mr-1" /> Referenced Tables:
              </span>
              {detectedTables.map((tbl) => (
                <button
                  key={tbl}
                  onClick={(e) => {
                    animateClick(e);
                    onSelectTable(tbl);
                  }}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-500/40 text-xs font-mono transition-all hover:scale-105 group shadow-sm"
                  title={`Redirect to ${tbl} table inspector`}
                >
                  <span>{tbl}</span>
                  <ArrowUpRight className="w-3 h-3 text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              ))}
            </div>
          )}

          {/* Assistant Tool Thought Process Accordion */}
          {!isUser && message.thought_steps && message.thought_steps.length > 0 && (
            <div className="mt-3.5 border-t border-slate-700/50 pt-2.5">
              <button
                onClick={toggleThoughts}
                className="flex items-center space-x-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-mono py-1 px-2 rounded-lg hover:bg-indigo-950/40"
              >
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Agent Execution Log ({message.thought_steps.length} steps)</span>
                {showThoughts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <div ref={thoughtsRef} className="overflow-hidden" style={{ height: showThoughts ? 'auto' : 0, opacity: showThoughts ? 1 : 0 }}>
                <div className="mt-2 space-y-1.5 p-3 rounded-xl bg-slate-950/30 backdrop-blur-md border border-slate-800/60 font-mono text-[11px]">
                  {message.thought_steps.map((step, sIdx) => (
                    <div key={sIdx} className="flex items-center justify-between text-slate-400 py-0.5 border-b border-slate-900/40 last:border-0">
                      <span className="text-cyan-400 flex items-center font-semibold">
                        <Zap className="w-3 h-3 text-cyan-400 mr-1" />
                        {step.tool}
                      </span>
                      <span className="text-slate-400 text-[10px] truncate max-w-xs">{step.result || step.query || 'completed'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Formatted Generated SQL Block */}
          {!isUser && message.sql_query && (
            <div ref={sqlCardRef} className="mt-4 rounded-2xl bg-slate-950/30 backdrop-blur-md border border-indigo-500/40 overflow-hidden font-mono text-xs shadow-2xl">
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/40 border-b border-slate-800/60">
                <div className="flex items-center space-x-2 text-indigo-400">
                  <Code className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold text-slate-200">Generated SQL Query</span>
                </div>
                <button
                  onClick={copySQL}
                  className="flex items-center space-x-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/50 hover:bg-slate-700/60 text-slate-300 border border-slate-700/60 transition-all active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>
              <pre className="p-4 text-cyan-300 overflow-x-auto whitespace-pre-wrap leading-relaxed selection:bg-indigo-600 bg-slate-950/20">{message.sql_query}</pre>
            </div>
          )}

          {/* Rendered Chart Widget */}
          {!isUser && message.chart_data && (
            <div>
              <ChartViewer chartData={message.chart_data} onPin={onPinChart} />
              <div className="mt-2.5 flex justify-end">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center space-x-1.5 text-xs px-3.5 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/40 shadow-md transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV Dataset</span>
                </button>
              </div>
            </div>
          )}

          {/* Rendered Mermaid Diagram Widget */}
          {!isUser && message.diagram_data && (
            <MermaidViewer diagramData={message.diagram_data} />
          )}

          {/* Natural Language Data Insight Card */}
          {!isUser && message.explanation && !message.content.includes(message.explanation) && (
            <div className="mt-4 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start space-x-3.5 shadow-lg">
              <div className="w-7 h-7 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-indigo-300" />
              </div>
              <div>
                <h5 className="font-display font-bold text-xs text-indigo-200 uppercase tracking-wider mb-1">AI Executive Summary</h5>
                <p className="text-xs text-slate-300 leading-relaxed">{message.explanation}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-9 h-9 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 order-2 shadow-md">
          <User className="w-5 h-5 text-slate-300" />
        </div>
      )}
    </div>
  );
}

