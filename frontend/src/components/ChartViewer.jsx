import React, { useEffect, useRef } from 'react';
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
import { Download, BarChart2, TrendingUp, PieChart as PieIcon, Activity, Bookmark } from 'lucide-react';
import { animateClick } from '../utils/useAnime';

const COLOR_PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function ChartViewer({ chartData, onPin }) {
  const chartCardRef = useRef(null);

  useEffect(() => {
    if (chartCardRef.current) {
      anime({
        targets: chartCardRef.current,
        scale: [0.94, 1],
        opacity: [0, 1],
        translateY: [15, 0],
        duration: 650,
        easing: 'cubicBezier(0.16, 1, 0.3, 1)'
      });
    }
  }, [chartData]);

  if (!chartData || !chartData.data || chartData.data.length === 0) return null;

  const { chart_type, title, description, x_axis_key, y_axis_keys, data } = chartData;
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

  const renderChart = () => {
    switch (chart_type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={x_axis_key} stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
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
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
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
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
            <Scatter name={title} data={data} fill="#818cf8" />
          </ScatterChart>
        );

      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={x_axis_key} stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
            {y_axis_keys.map((key, idx) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLOR_PALETTE[idx % COLOR_PALETTE.length]}
                fill={COLOR_PALETTE[idx % COLOR_PALETTE.length]}
                fillOpacity={0.3}
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
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
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
    switch (chart_type) {
      case 'line': return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case 'pie': return <PieIcon className="w-5 h-5 text-amber-400" />;
      case 'scatter': return <Activity className="w-5 h-5 text-cyan-400" />;
      default: return <BarChart2 className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div ref={chartCardRef} className={`mt-4 p-5 rounded-2xl glass-panel border border-indigo-500/20 shadow-2xl chart-container-${title.replace(/\s+/g, '')}`}>
      <div className="flex items-center justify-between mb-3 border-b border-slate-700/50 pb-3">
        <div className="flex items-center space-x-2">
          {getChartIcon()}
          <div>
            <h4 className="font-display font-semibold text-lg text-slate-100">{title}</h4>
            {description && <p className="text-xs text-slate-400">{description}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onPin && (
            <button
              onClick={() => onPin(chartData)}
              className="flex items-center space-x-1 text-xs px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 transition-all"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Pin to Dashboard</span>
            </button>
          )}
          <button
            onClick={downloadSVG}
            className="flex items-center space-x-1 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-all"
            title="Download SVG Chart"
          >
            <Download className="w-3.5 h-3.5" />
            <span>SVG</span>
          </button>
        </div>
      </div>

      <div className="w-full h-72 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
