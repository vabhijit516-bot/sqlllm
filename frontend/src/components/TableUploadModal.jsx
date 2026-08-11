import React, { useState, useRef } from 'react';
import { 
  Upload, Database, Table, Sparkles, CheckCircle2, AlertCircle, 
  FileText, Play, RefreshCw, X, ArrowRight, Layers, BarChart2, DollarSign, Cpu
} from 'lucide-react';
import { animateClick } from '../utils/useAnime';

export default function TableUploadModal({ isOpen, onClose, onTableCreated, onSelectPrompt }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'demo' | 'review'
  const [tableName, setTableName] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);
  const [demoTables, setDemoTables] = useState([]);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Handle Drag Events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle File Drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Handle File Input Select
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    setError(null);
    const suggestedName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
    setTableName(suggestedName);

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target.result);
    };
    reader.onerror = () => {
      setError("Failed to read file content.");
    };
    reader.readAsText(file);
  };

  // Upload Custom CSV Table to Backend
  const handleUploadTable = async () => {
    if (!tableName.trim()) {
      setError("Please provide a valid table name.");
      return;
    }
    if (!csvContent.trim()) {
      setError("Please select or paste valid CSV content.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/upload-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_name: tableName.trim(),
          csv_content: csvContent.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to create SQL table.");
      }

      setSuccessResult(data);
      setActiveTab('review');
      if (onTableCreated) onTableCreated(data.table_name);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load Preset Demo Tables into SQL Database
  const handleLoadDemoTables = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/demo-tables/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to load demo tables.");
      }
      setDemoTables(data.demo_tables || []);
      setSuccessResult(data.demo_tables[0] || null);
      if (onTableCreated) onTableCreated(data.demo_tables[0]?.table_name);
      setActiveTab('review');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sampleDemoCards = [
    {
      id: "demo_ai_benchmarks",
      title: "AI Model Benchmarks & Pricing",
      icon: Cpu,
      color: "from-cyan-500 to-blue-600",
      description: "Compare LLM performance across Gemini 2.5, GPT-4o, Claude 3.5, DeepSeek R1 & Llama 3.1",
      sampleQuery: "Which AI model has the highest MMLU score under $1.00 per million tokens in demo_ai_benchmarks?",
      metrics: "8 Models • 6 Attributes"
    },
    {
      id: "demo_saas_metrics",
      title: "Global SaaS Financial Metrics",
      icon: BarChart2,
      color: "from-emerald-500 to-teal-600",
      description: "Analyze ARR, Net Retention Rate (NRR), Churn Rate, and CAC Payback across Vercel, Stripe, Snowflake",
      sampleQuery: "Show me top SaaS companies in demo_saas_metrics with NRR above 130%",
      metrics: "8 Tech Enterprises • 7 Metrics"
    },
    {
      id: "demo_tech_payroll",
      title: "Tech Engineering & AI Payroll",
      icon: DollarSign,
      color: "from-purple-500 to-indigo-600",
      description: "Salaries, experience years, performance ratings, and roles across AI Architecture, Data Science & DevOps",
      sampleQuery: "What is the average salary by department in demo_tech_payroll?",
      metrics: "8 Employees • 7 Salaries"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl glass-panel border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400">
                <Database className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg text-slate-100 flex items-center">
                SQL Table & Database Upload Studio
                <span className="ml-2.5 px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Live Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Upload CSV datasets or load pre-built demo tables into SQLite for instant review & LLM analysis
              </p>
            </div>
          </div>

          <button
            onClick={(e) => {
              animateClick(e.currentTarget);
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all border border-slate-700/50"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center px-6 border-b border-slate-800/80 bg-slate-950/60 space-x-2">
          <button
            onClick={(e) => {
              animateClick(e.currentTarget);
              setActiveTab('upload');
            }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-all ${
              activeTab === 'upload'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload CSV Dataset</span>
          </button>

          <button
            onClick={(e) => {
              animateClick(e.currentTarget);
              setActiveTab('demo');
            }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-all ${
              activeTab === 'demo'
                ? 'border-cyan-500 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Preset Demo Tables</span>
          </button>

          {successResult && (
            <button
              onClick={(e) => {
                animateClick(e.currentTarget);
                setActiveTab('review');
              }}
              className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-all ${
                activeTab === 'review'
                  ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-4 h-4 text-emerald-400" />
              <span>Review Table Structure</span>
            </button>
          )}
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Upload Custom CSV Table */}
        {activeTab === 'upload' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Table Name Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono uppercase tracking-wider">
                SQL Table Name
              </label>
              <input
                type="text"
                placeholder="e.g. uploaded_sales_2026 or employee_records"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm font-mono text-cyan-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
              />
            </div>

            {/* Drag & Drop File Zone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono uppercase tracking-wider">
                Upload CSV File
              </label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-indigo-400 bg-indigo-500/10 scale-99' 
                    : 'border-slate-700/80 hover:border-indigo-500/60 bg-slate-900/50 hover:bg-slate-900/80'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    Click to browse or drag & drop CSV file here
                  </p>
                  <p className="text-xs text-slate-400">
                    Auto-detects column headers, data types (INTEGER, REAL, TEXT) and seeds into SQLite
                  </p>
                </div>
              </div>
            </div>

            {/* CSV Raw Content Text Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
                  CSV Raw Data (Paste or Preview)
                </label>
                {csvContent && (
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    {csvContent.split('\n').length} rows loaded
                  </span>
                )}
              </div>
              <textarea
                rows={5}
                placeholder="header_col1,header_col2,header_col3&#10;val1,123,45.67&#10;val2,456,89.10"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
              />
            </div>

            {/* Submit Upload Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={(e) => {
                  animateClick(e.currentTarget);
                  handleUploadTable();
                }}
                disabled={loading || !tableName || !csvContent}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Parsing & Inserting into SQL...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Create & Review SQL Table</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Preset Demo Tables */}
        {activeTab === 'demo' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
                    Instant Demo Datasets
                  </h4>
                  <p className="text-xs text-slate-400">
                    Click to load 3 rich example tables into the live SQLite database for testing AI SQL queries & charts.
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  animateClick(e.currentTarget);
                  handleLoadDemoTables();
                }}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    <span>Load All 3 Demo Tables</span>
                  </>
                )}
              </button>
            </div>

            {/* Demo Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sampleDemoCards.map((card) => {
                const IconComponent = card.icon;
                return (
                  <div 
                    key={card.id}
                    className="group rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/50 p-4 transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
                  >
                    <div>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${card.color} flex items-center justify-center text-white mb-3 shadow-md`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {card.title}
                      </h4>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-mono text-cyan-400 bg-cyan-500/10 rounded-md border border-cyan-500/20">
                        {card.id}
                      </span>
                      <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                        {card.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-500 font-mono block mb-2">
                        {card.metrics}
                      </span>
                      <button
                        onClick={(e) => {
                          animateClick(e.currentTarget);
                          handleLoadDemoTables();
                          if (onSelectPrompt) onSelectPrompt(card.sampleQuery);
                          onClose();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-cyan-600/30 text-cyan-300 hover:text-cyan-100 font-semibold text-xs border border-slate-700/60 hover:border-cyan-500/40 transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Query with AI</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Table Reviewer */}
        {activeTab === 'review' && successResult && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Table Header Summary */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-mono font-bold text-base text-emerald-300">
                      {successResult.table_name}
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active SQL Table
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {successResult.row_count} rows inserted • {successResult.columns?.length || 0} columns configured
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  animateClick(e.currentTarget);
                  if (onSelectPrompt) {
                    onSelectPrompt(`Inspect data and give summary insights for table ${successResult.table_name}`);
                  }
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Ask AI Agent</span>
              </button>
            </div>

            {/* Column Schema Details */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-400 mb-2">
                Column Schema & Types
              </h4>
              <div className="flex flex-wrap gap-2">
                {successResult.columns?.map((col, idx) => (
                  <div key={idx} className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-2 text-xs font-mono">
                    <span className="text-slate-200 font-semibold">{col.name}</span>
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {col.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Rows Preview Grid */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-400 mb-2">
                Sample Data Rows Preview (Top 10)
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      {successResult.columns?.map((col, idx) => (
                        <th key={idx} className="px-3 py-2.5 whitespace-nowrap">
                          {col.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {successResult.rows?.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-900/50 transition-colors">
                        {successResult.columns?.map((col, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 whitespace-nowrap max-w-xs truncate">
                            {row[col.name] !== undefined ? String(row[col.name]) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
