import React, { useState, useEffect, useRef } from 'react';
import { Database, Table, Key, ChevronRight, ChevronDown, Play, RefreshCw, Zap, Link2 } from 'lucide-react';
import { animateClick, useAnimeStagger } from '../utils/useAnime';

export default function SchemaExplorer({ onSelectPrompt, onClose }) {
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedTables, setExpandedTables] = useState({});
  const containerRef = useRef(null);

  const fetchSchema = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/schema');
      const data = await res.json();
      setSchema(data.tables || {});
      const initial = {};
      Object.keys(data.tables || {}).slice(0, 3).forEach(t => initial[t] = true);
      setExpandedTables(initial);
    } catch (e) {
      console.error('Schema fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, []);

  useAnimeStagger(containerRef, '.schema-table-card', [schema, loading], {
    staggerMs: 60,
    translateY: [20, 0]
  });

  const toggleTable = (tableName) => {
    setExpandedTables(prev => ({ ...prev, [tableName]: !prev[tableName] }));
  };

  const samplePrompts = [
    { title: "Top 5 Products", query: "Show me the top 5 products by revenue" },
    { title: "ER Diagram", query: "Draw me the ER diagram for this database" },
    { title: "Order Process", query: "Create a flowchart showing how orders flow through our system" },
    { title: "Revenue Trend", query: "Show me the monthly revenue trend for orders" },
    { title: "Customer Summary", query: "Which countries have the most customers?" }
  ];

  return (
    <div ref={containerRef} className="h-full flex flex-col glass-panel border border-slate-800/80 rounded-2xl w-full max-w-sm text-slate-200 p-5 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Database className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-base text-slate-100">Schema Explorer</h3>
            <span className="text-[10px] text-slate-400 font-mono">SQLite + Postgres Catalog</span>
          </div>
        </div>
        <button
          onClick={(e) => {
            animateClick(e.currentTarget);
            fetchSchema();
          }}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all active:scale-95 border border-slate-700/50"
          title="Refresh Schema"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>

      {/* Quick Prompts Section */}
      <div className="mb-5">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center">
          <Zap className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
          Quick Query Templates
        </span>
        <div className="space-y-1.5">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                animateClick(e.currentTarget);
                onSelectPrompt(p.query);
              }}
              className="w-full text-left px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/60 hover:bg-indigo-600/25 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 transition-all flex items-center justify-between group shadow-sm active:scale-98"
            >
              <span className="truncate font-medium">{p.title}</span>
              <Play className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>

      {/* Database Tables Tree */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center">
            <Table className="w-3.5 h-3.5 text-cyan-400 mr-1.5" />
            Tables ({schema ? Object.keys(schema).length : 0})
          </span>
        </div>

        {loading ? (
          <div className="text-xs text-slate-400 py-8 text-center flex flex-col items-center space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
            <span>Loading database catalog...</span>
          </div>
        ) : (
          schema && Object.entries(schema).map(([tableName, info]) => {
            const isExpanded = expandedTables[tableName];
            return (
              <div key={tableName} className="schema-table-card rounded-xl bg-slate-950/70 border border-slate-800/80 overflow-hidden shadow-md">
                <button
                  onClick={(e) => {
                    animateClick(e.currentTarget);
                    toggleTable(tableName);
                  }}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-200 hover:bg-slate-800/60 transition-all"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Table className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="font-mono text-cyan-200 truncate">{tableName}</span>
                    <span className="text-[10px] text-slate-500 font-normal">({info.columns.length})</span>
                  </div>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </button>

                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-1.5 border-t border-slate-800/60 bg-slate-950/90 space-y-2 text-xs">
                    {info.columns.map((col, cIdx) => (
                      <div key={cIdx} className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <div className="flex items-center space-x-1.5 truncate">
                          {col.primary_key ? (
                            <Key className="w-3 h-3 text-amber-400 flex-shrink-0" title="Primary Key" />
                          ) : (
                            <span className="w-3 text-center text-slate-600">•</span>
                          )}
                          <span className={col.primary_key ? 'text-amber-300 font-semibold' : 'text-slate-300'}>
                            {col.name}
                          </span>
                        </div>
                        <span className="text-slate-500 text-[10px] uppercase font-mono">{col.type}</span>
                      </div>
                    ))}

                    {info.foreign_keys && info.foreign_keys.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-indigo-400 space-y-1">
                        {info.foreign_keys.map((fk, fkIdx) => (
                          <div key={fkIdx} className="truncate flex items-center space-x-1 font-mono">
                            <Link2 className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                            <span>{fk.from_column} → <span className="font-semibold text-indigo-300">{fk.target_table}</span>({fk.target_column})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

