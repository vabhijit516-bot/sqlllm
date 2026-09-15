import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Code, Copy, Check, ChevronDown, ChevronUp, Cpu, Sparkles, Download, Zap, Table, ArrowUpRight, Play, Edit3, X } from 'lucide-react';
import anime from 'animejs';
import ChartViewer from './ChartViewer';
import MermaidViewer from './MermaidViewer';
import { animateClick } from '../utils/useAnime';

const KNOWN_TABLES = ['customers', 'categories', 'products', 'orders', 'order_items', 'inventory', 'reviews'];

export default function ChatMessage({ message, onPinChart, onSelectTable, onRerunSQL }) {
  const [copied, setCopied] = useState(false);
  const [showThoughts, setShowThoughts] = useState(false);
  const [isEditingSQL, setIsEditingSQL] = useState(false);
  const [editedSQL, setEditedSQL] = useState('');
  const messageCardRef = useRef(null);

  const isUser = message.role === 'user';

  useEffect(() => {
    if (message.sql_query) {
      setEditedSQL(message.sql_query);
    }
  }, [message]);

  // Anime.js entrance animation on render
  useEffect(() => {
    if (messageCardRef.current) {
      anime({
        targets: messageCardRef.current,
        translateY: [20, 0],
        opacity: [0, 1],
        scale: [0.97, 1],
        duration: 500,
        easing: 'cubicBezier(0.16, 1, 0.3, 1)'
      });
    }
  }, []);

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

  // Detect tables mentioned in SQL or text
  const detectedTables = KNOWN_TABLES.filter(t => {
    const textToSearch = ((message.content || '') + ' ' + (message.sql_query || '')).toLowerCase();
    return textToSearch.includes(t);
  });

  return (
    <div ref={messageCardRef} className={`flex space-x-3.5 mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}

      {/* Message Content Container */}
      <div className={`max-w-3xl ${isUser ? 'order-1' : 'order-2'} w-full`}>
        {/* Header Name & Timestamp */}
        <div className={`flex items-center space-x-2 mb-1 text-xs text-slate-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="font-semibold text-slate-300">{isUser ? 'You' : 'TechX Agent'}</span>
          <span>•</span>
          <span>{new Date(message.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {/* Bubble */}
        <div
          className={`p-4 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none shadow-lg shadow-indigo-600/20 font-medium'
              : 'glass-panel border border-slate-700/60 rounded-tl-none text-slate-200 shadow-xl'
          }`}
        >
          {/* Main Content Text */}
          <div className="whitespace-pre-wrap font-sans">{message.content}</div>

          {/* Interactive Table Redirection Pills */}
          {!isUser && detectedTables.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-slate-700/40 flex items-center flex-wrap gap-1.5">
              <span className="text-[11px] font-mono text-slate-400 mr-1 flex items-center">
                <Table className="w-3 h-3 text-cyan-400 mr-1" /> Referenced Tables:
              </span>
              {detectedTables.map((tbl) => (
                <button
                  key={tbl}
                  onClick={(e) => {
                    animateClick(e.currentTarget);
                    if (onSelectTable) onSelectTable(tbl);
                  }}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30 text-xs font-mono transition-all group"
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
            <div className="mt-3 border-t border-slate-700/50 pt-2.5">
              <button
                onClick={(e) => {
                  animateClick(e.currentTarget);
                  setShowThoughts(!showThoughts);
                }}
                className="flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-mono"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Agent Tool Execution Log ({message.thought_steps.length} steps)</span>
                {showThoughts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showThoughts && (
                <div className="mt-2 space-y-1.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-[11px]">
                  {message.thought_steps.map((step, sIdx) => (
                    <div key={sIdx} className="flex items-center justify-between text-slate-400">
                      <span className="text-cyan-400 flex items-center">
                        <Zap className="w-3 h-3 text-cyan-400 mr-1" />
                        {step.tool}
                      </span>
                      <span className="text-slate-500 text-[10px] truncate max-w-xs">{step.result || step.query || 'executed'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Formatted Generated SQL Block with Edit & Copy Controls */}
          {!isUser && message.sql_query && (
            <div className="mt-4 rounded-xl bg-slate-950/90 border border-indigo-500/30 overflow-hidden font-mono text-xs shadow-lg">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center space-x-2 text-indigo-400">
                  <Code className="w-4 h-4" />
                  <span className="font-semibold text-slate-200">Generated SQL Query</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsEditingSQL(true)}
                    className="flex items-center space-x-1 text-[11px] px-2 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit SQL</span>
                  </button>
                  <button
                    onClick={copySQL}
                    className="flex items-center space-x-1 text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <pre className="p-3 text-cyan-300 overflow-x-auto whitespace-pre-wrap">{message.sql_query}</pre>
            </div>
          )}

          {/* Rendered Chart Widget */}
          {!isUser && message.chart_data && (
            <div>
              <ChartViewer chartData={message.chart_data} onPin={onPinChart} />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center space-x-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Dataset CSV</span>
                </button>
              </div>
            </div>
          )}

          {/* Rendered Mermaid Diagram Widget */}
          {!isUser && message.diagram_data && (
            <MermaidViewer diagramData={message.diagram_data} />
          )}

          {/* Natural Language Insight Card */}
          {!isUser && message.explanation && !message.content.includes(message.explanation) && (
            <div className="mt-4 p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-display font-semibold text-xs text-indigo-200 uppercase tracking-wider mb-1">Data Insights</h5>
                <p className="text-xs text-slate-300 leading-relaxed">{message.explanation}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-9 h-9 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 order-2">
          <User className="w-5 h-5 text-slate-300" />
        </div>
      )}

      {/* Edit SQL Drawer Modal */}
      {isEditingSQL && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-scroll-in">
          <div className="w-full max-w-2xl glass-panel border border-indigo-500/30 rounded-3xl p-6 flex flex-col shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Edit3 className="w-5 h-5" />
                <h3 className="font-display font-bold text-lg text-slate-100">Edit & Rerun SQL Query</h3>
              </div>
              <button
                onClick={() => setIsEditingSQL(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={editedSQL}
              onChange={(e) => setEditedSQL(e.target.value)}
              rows={6}
              className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-cyan-300 outline-none focus:border-indigo-500"
            />

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsEditingSQL(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  animateClick(e.currentTarget);
                  if (onRerunSQL) onRerunSQL(editedSQL);
                  setIsEditingSQL(false);
                }}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 hover:from-indigo-500 hover:to-cyan-400"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Run Modified SQL</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
