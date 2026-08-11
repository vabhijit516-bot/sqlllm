import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { GitFork, Download, Maximize2 } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  themeVariables: {
    darkMode: true,
    background: '#0f172a',
    primaryColor: '#6366f1',
    primaryTextColor: '#f8fafc',
    primaryBorderColor: '#818cf8',
    lineColor: '#06b6d4',
    secondaryColor: '#10b981',
    tertiaryColor: '#1e293b'
  }
});

export default function MermaidViewer({ diagramData }) {
  const containerRef = useRef(null);
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!diagramData || !diagramData.mermaid_code) return;

    const renderDiagram = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, diagramData.mermaid_code);
        setSvgContent(svg);
        setError(null);
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError('Failed to render diagram definition.');
      }
    };

    renderDiagram();
  }, [diagramData]);

  if (!diagramData) return null;

  const downloadSVG = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${diagramData.title.toLowerCase().replace(/\s+/g, '_')}_diagram.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-4 p-5 rounded-2xl glass-panel border border-cyan-500/20 shadow-2xl animate-scroll-in">
      <div className="flex items-center justify-between mb-3 border-b border-slate-700/50 pb-3">
        <div className="flex items-center space-x-2">
          <GitFork className="w-5 h-5 text-cyan-400" />
          <div>
            <h4 className="font-display font-semibold text-lg text-slate-100">{diagramData.title}</h4>
            <p className="text-xs text-slate-400">
              {diagramData.diagram_type === 'er' ? 'Database Entity-Relationship Structure' : 'System Process Pipeline'}
            </p>
          </div>
        </div>

        <button
          onClick={downloadSVG}
          className="flex items-center space-x-1 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export SVG</span>
        </button>
      </div>

      {error ? (
        <div className="p-4 bg-red-900/20 border border-red-500/30 text-red-300 rounded-lg text-sm">
          {error}
        </div>
      ) : (
        <div
          ref={containerRef}
          className="w-full overflow-x-auto p-4 bg-slate-900/20 backdrop-blur-md rounded-xl flex justify-center items-center"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}

      {diagramData.explanation && (
        <p className="mt-3 text-xs text-slate-300 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
          💡 {diagramData.explanation}
        </p>
      )}
    </div>
  );
}
