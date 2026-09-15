import React, { useState, useEffect, useRef } from 'react';
import anime from 'animejs';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  Download,
  BarChart2,
  TrendingUp,
  PieChart as PieIcon,
  Activity,
  Bookmark,
  Layers,
  Table as TableIcon,
  Maximize2,
  X
} from 'lucide-react';
import { animateClick } from '../utils/useAnime';

const COLOR_PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function ChartViewer({ chartData, onPin }) {
  const chartCardRef = useRef(null);
  const [currentChartType, setCurrentChartType] = useState('bar');
  const [showDataTable, setShowDataTable] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (chartData && chartData.chart_type) {
      setCurrentChartType(chartData.chart_type.toLowerCase());
    }
  }, [chartData]);

  useEffect(() => {
    if (chartCardRef.current) {
      anime({
        targets: chartCardRef.current,
        scale: [0.95, 1],
        opacity: [0, 1],
        translateY: [15, 0],
        duration: 650,
        easing: 'cubicBezier(0.16, 1, 0.3, 1)'
      });
    }
  }, [chartData, currentChartType]);

  if (!chartData || !chartData.data || chartData.data.length === 0) return null;

  const { title, description, x_axis_key, y_axis_keys, data } = chartData;
  const primaryYKey = y_axis_keys && y_axis_keys.length > 0 ? y_axis_keys[0] : 'value';

  const downloadSVG = () => {
    const svgElem = document.querySelector(`.chart-container-${title.replace(/\s+/g, '')} svg`);
    if (!svgElem) return;
    const svgData = new XMLSerializer().serializeToString(svgElem);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_chart.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderChartContent = () => {
    switch (currentChartType) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={x_axis_key} stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#6366f1', borderRadius: '12px', color: '#ffffff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
              itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: '500' }}
              labelStyle={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '13px' }}
            />
            <Legend />
            {y_axis_keys.map((key, idx) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLOR_PALETTE[idx % COLOR_PALETTE.length]}
                strokeWidth={3}
                dot={{ r: 5, fill: COLOR_PALETTE[idx % COLOR_PALETTE.length] }}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#6366f1', borderRadius: '12px', color: '#ffffff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
              itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: '500' }}
              labelStyle={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '13px' }}
            />
            <Legend />
            <Pie
              data={data}
              dataKey={primaryYKey}
              nameKey={x_axis_key}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={45}
              paddingAngle={5}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
              ))}
            </Pie>
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={x_axis_key} stroke="#94a3b8" name={x_axis_key} />
            <YAxis dataKey={primaryYKey} stroke="#94a3b8" name={primaryYKey} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#6366f1', borderRadius: '12px', color: '#ffffff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
              itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: '500' }}
              labelStyle={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '13px' }}
            />
            <Scatter name={title} data={data} fill="#818cf8" />
          </ScatterChart>
        );

      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={x_axis_key} stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#6366f1', borderRadius: '12px', color: '#ffffff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
              itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: '500' }}
              labelStyle={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '13px' }}
            />
            {y_axis_keys.map((key, idx) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLOR_PALETTE[idx % COLOR_PALETTE.length]}
                fill={COLOR_PALETTE[idx % COLOR_PALETTE.length]}
                fillOpacity={0.35}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
      default:
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={x_axis_key} stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#6366f1', borderRadius: '12px', color: '#ffffff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
              itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: '500' }}
              labelStyle={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '13px' }}
            />
            <Legend />
            {y_axis_keys.map((key, idx) => (
              <Bar
                key={key}
                dataKey={key}
                fill={COLOR_PALETTE[idx % COLOR_PALETTE.length]}
                radius={[6, 6, 0, 0]}
              />
            ))}
          </BarChart>
        );
    }
  };

  const getChartIcon = () => {
    switch (currentChartType) {
      case 'line': return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case 'pie': return <PieIcon className="w-5 h-5 text-amber-400" />;
      case 'scatter': return <Activity className="w-5 h-5 text-cyan-400" />;
      case 'area': return <Layers className="w-5 h-5 text-purple-400" />;
      default: return <BarChart2 className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div
      ref={chartCardRef}
      className={`mt-4 p-5 rounded-2xl glass-panel border border-indigo-500/20 shadow-2xl chart-container-${title.replace(/\s+/g, '')}`}
    >
      {/* Top Header Controls */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-700/50 pb-3 flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          {getChartIcon()}
          <div>
            <h4 className="font-display font-semibold text-lg text-slate-100">{title}</h4>
            {description && <p className="text-xs text-slate-400">{description}</p>}
          </div>
        </div>

        {/* Controls: Chart Type Switcher & Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Manual Chart Type Switcher */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 space-x-1">
            {['bar', 'line', 'pie', 'scatter', 'area'].map((type) => (
              <button
                key={type}
                onClick={(e) => {
                  animateClick(e.currentTarget);
                  setCurrentChartType(type);
                  setShowDataTable(false);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono capitalize transition-all ${
                  currentChartType === type && !showDataTable
                    ? 'bg-indigo-600 text-white font-semibold shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {type}
              </button>
            ))}

            {/* Data Table Fallback Toggle */}
            <button
              onClick={(e) => {
                animateClick(e.currentTarget);
                setShowDataTable(!showDataTable);
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all flex items-center space-x-1 ${
                showDataTable
                  ? 'bg-cyan-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Accessible Table Fallback"
            >
              <TableIcon className="w-3 h-3" />
              <span>Table</span>
            </button>
          </div>

          {onPin && (
            <button
              onClick={(e) => {
                animateClick(e.currentTarget);
                onPin({ ...chartData, chart_type: currentChartType });
              }}
              className="flex items-center space-x-1 text-xs px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 transition-all"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pin to Dashboard</span>
            </button>
          )}

          <button
            onClick={() => setIsFullScreen(true)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-all"
            title="Full Screen View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={downloadSVG}
            className="flex items-center space-x-1 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-all"
            title="Download SVG Chart"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SVG</span>
          </button>
        </div>
      </div>

      {/* Main Chart or Accessible Table View */}
      {showDataTable ? (
        <div className="w-full max-h-72 overflow-auto rounded-xl border border-slate-800 bg-slate-950/80 p-2 font-mono text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-cyan-300">
                <th className="p-2 font-semibold">{x_axis_key}</th>
                {y_axis_keys.map((k) => (
                  <th key={k} className="p-2 font-semibold">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {data.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-900/60">
                  <td className="p-2">{String(row[x_axis_key] || '')}</td>
                  {y_axis_keys.map((k) => (
                    <td key={k} className="p-2">{String(row[k] || '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="w-full h-72 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {renderChartContent()}
          </ResponsiveContainer>
        </div>
      )}

      {/* Full Screen View Modal */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-scroll-in">
          <div className="w-full max-w-5xl h-[80vh] glass-panel border border-indigo-500/30 rounded-3xl p-6 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                {getChartIcon()}
                <h3 className="font-display font-bold text-xl text-slate-100">{title}</h3>
              </div>
              <button
                onClick={() => setIsFullScreen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                {renderChartContent()}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
