import React, { useRef } from 'react';
import ChartViewer from './ChartViewer';
import { LayoutDashboard, Trash2 } from 'lucide-react';
import { animateClick, useAnimeStagger } from '../utils/useAnime';

export default function DashboardView({ pinnedCharts, onRemoveChart }) {
  const gridRef = useRef(null);

  useAnimeStagger(gridRef, '.dashboard-card', [pinnedCharts], {
    staggerMs: 80,
    translateY: [30, 0]
  });

  if (!pinnedCharts || pinnedCharts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 animate-scroll-in">
        <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-xl">
          <LayoutDashboard className="w-8 h-8 text-indigo-400" />
        </div>
        <h3 className="font-display font-extrabold text-xl text-slate-100">Custom Analytics Dashboard is Empty</h3>
        <p className="text-xs max-w-md mt-2 text-slate-400 leading-relaxed">
          Pin visualizations from your agent conversation using the <span className="text-indigo-300 font-semibold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">📌 Pin to Dashboard</span> button to assemble real-time BI reports.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
            <LayoutDashboard className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-slate-100">Executive BI Dashboard</h2>
            <p className="text-xs text-slate-400 font-mono">Pinned interactive analytics widgets ({pinnedCharts.length} active metrics)</p>
          </div>
        </div>
      </div>

      <div ref={gridRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pinnedCharts.map((chart, idx) => (
          <div key={idx} className="dashboard-card relative group">
            <button
              onClick={(e) => {
                animateClick(e.currentTarget);
                onRemoveChart(idx);
              }}
              className="absolute top-8 right-8 z-20 p-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-95"
              title="Remove widget from Dashboard"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <ChartViewer chartData={chart} />
          </div>
        ))}
      </div>
    </div>
  );
}

