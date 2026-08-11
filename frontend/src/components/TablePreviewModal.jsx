import React, { useState, useEffect, useRef } from 'react';
import { Table, X, Sparkles, RefreshCw } from 'lucide-react';
import { animateClick, animateModalIn, useAnimeStagger } from '../utils/useAnime';

export default function TablePreviewModal({ tableName, onClose, onAnalyzeTable }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const modalBoxRef = useRef(null);
  const tableBodyRef = useRef(null);

  useEffect(() => {
    if (!tableName) return;
    fetchTableData();
  }, [tableName]);

  useEffect(() => {
    if (modalBoxRef.current) {
      animateModalIn(modalBoxRef);
    }
  }, [tableName]);

  useAnimeStagger(tableBodyRef, 'tr', [data], {
    staggerMs: 40,
    translateY: [15, 0],
    duration: 400
  });

  const fetchTableData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/table/${tableName}?limit=15`);
      const result = await res.json();
      setData(result);
    } catch (e) {
      console.error('Table fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!tableName) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div
        ref={modalBoxRef}
        className="w-full max-w-4xl glass-panel border border-indigo-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] glow-indigo"
      >
        {/* Header */}
        <div className="p-5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-cyan-400 shadow-md">
              <Table className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-display font-extrabold text-lg text-slate-100 font-mono">
                  {tableName}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] border border-cyan-500/30 font-mono font-semibold">
                  Live DB Redirect
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Inspecting top rows and schema structure from SQLite domain database
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                animateClick(e.currentTarget);
                onAnalyzeTable(tableName);
                onClose();
              }}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyze in Chat</span>
            </button>

            <button
              onClick={(e) => {
                animateClick(e.currentTarget);
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#090d16]/90">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center space-y-3">
              <RefreshCw className="w-7 h-7 animate-spin text-indigo-400" />
              <span className="text-xs font-mono text-slate-300">Fetching live database records...</span>
            </div>
          ) : data && data.rows && data.rows.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/80 shadow-inner">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-300">
                    {Object.keys(data.rows[0]).map((col) => (
                      <th key={col} className="p-3.5 text-cyan-300 font-semibold uppercase tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody ref={tableBodyRef} className="divide-y divide-slate-800/60 text-slate-300">
                  {data.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-indigo-950/30 transition-colors">
                      {Object.values(row).map((val, cIdx) => (
                        <td key={cIdx} className="p-3.5 truncate max-w-xs">
                          {val !== null && val !== undefined ? String(val) : <span className="text-slate-600 italic">null</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No records found in table '{tableName}'.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

