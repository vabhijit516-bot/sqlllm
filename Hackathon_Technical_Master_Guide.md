# 🚀 TechX Enterprise AI — Hackathon Technical Master Guide & Defense Cheat Sheet

> **Purpose**: Use this document as your ultimate technical reference manual to present **TechX Enterprise AI** and confidently answer any deep technical, architectural, or security questions from hackathon judges and evaluators.

---

## ⚡ 1. The 30-Second Elevator Pitch

> *"TechX Enterprise AI is an end-to-end conversational analytics platform that democratizes database access for non-technical users. Powered by LLM function calling, it turns natural language queries into safe, read-only SQL/NoSQL operations, renders dynamic 2D/3D visualizations and Mermaid ER diagrams in real time, provides 100% SQL transparency with an interactive Rerun Drawer, and logs audit data into an unstructured NoSQL document store — all wrapped in an interactive Three.js 3D database command center."*

---

## 🛠️ 2. Complete Technology Stack Matrix

| Component | Technology | Role & Purpose | Key Highlights |
|---|---|---|---|
| **Frontend Framework** | **React 18 + Vite** | Single Page Application (SPA) UI framework | Ultra-fast HMR, component modularity, instant bundling |
| **Styling & UI Components** | **Tailwind CSS + Lucide Icons** | Glassmorphism technical Command Center theme | Dark mode navy/slate palette, responsive drawers, custom utility classes |
| **3D Backdrop Engine** | **Three.js** | Interactive 3D database node grid & constellation background | Synchronized 3D camera depth shifts reacting to scroll up/down & mouse movement |
| **Animation Physics** | **Anime.js** | Micro-interaction feedback & spring scale-in animations | Elastic button click feedback (`animateClick`), card staggered entrance animations |
| **2D Data Visualizations** | **Recharts** | Interactive SVG charting library | Supports Bar, Line, Pie, Scatter, Area charts; Manual Chart-Type Switcher; Accessible Table Fallback |
| **Diagram Engine** | **Mermaid.js** | Code-driven vector diagram renderer | Dynamically renders Entity-Relationship (`erDiagram`) & Process Pipelines (`graph TD`) with SVG download |
| **Backend Framework** | **Python 3.12 + FastAPI + Uvicorn** | High-performance asynchronous REST API server | OpenAPI/Swagger docs (`/docs`), Pydantic input validation, CORS security middleware |
| **AI / LLM Engine** | **Google Gemini API (`google-genai` SDK)** | Gemini 2.5 Flash function-calling model | Structured tool schema declarations + local smart orchestrator fallback engine |
| **Relational Database** | **SQLite 3 (`ecommerce.db`)** | Primary domain database | 7 tables (`customers`, `categories`, `products`, `orders`, `order_items`, `inventory`, `reviews`) |
| **Cloud SQL Adapter** | **Supabase (PostgreSQL Cloud)** | Enterprise Cloud PostgreSQL connectivity | Cloud database adapter in `multi_db.py` |
| **NoSQL Document Store** | **Firebase Admin SDK (Firestore NoSQL)** | Enterprise NoSQL document database | Cloud Firestore JSON document collection manager |
| **Unstructured Audit Logger**| **SQLite NoSQL Engine (`unstructured_logs.db`)** | Unstructured document storage | Stores `login_logs` and `chat_logs` as JSON documents with JSON path query extraction (`json_extract`) |
| **Authentication & Security**| **Google OAuth 2.0 + PyJWT** | Identity & Session management | Token verification, guest fallback, read-only SQL AST validator |
| **DevOps & Testing** | **Docker + Pytest** | Containerization & Automated Unit Testing | `Dockerfile`, `docker-compose.yml`, 6 automated Pytest tool unit tests passing |

---

## 🏗️ 3. 4-Zone Modular System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ZONE 1: PRESENTATION LAYER                      │
│  • React 18 SPA + Vite                                                 │
│  • Three.js 3D Database Constellation Backdrop (Scroll Depth Shift)    │
│  • Anime.js Spring Physics & Card Scaling                              │
│  • Recharts (Bar, Line, Pie, Scatter, Area) + Manual Switcher          │
│  • Mermaid.js ER & Process Flowchart Renderer + SVG Download           │
│  • Speech-to-Text Audio Web Speech API Receiver                        │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTP REST API (JSON Payloads)
┌──────────────────────────────────▼─────────────────────────────────────┐
│                         ZONE 2: BACKEND API & AUTH                     │
│  • Python 3.12 FastAPI Server (Uvicorn Async Worker)                  │
│  • Google OAuth 2.0 Token Verification & PyJWT Session Handler         │
│  • CORS Middleware & Security Rules                                    │
│  • Export Engine: CSV Exporter (`/api/export/csv`)                     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Tool Function Dispatcher
┌──────────────────────────────────▼─────────────────────────────────────┐
│                       ZONE 3: LLM AGENT & TOOLS ENGINE                 │
│  • Google Gemini 2.5 Flash Model (Function Calling Engine)            │
│  • Local Smart Orchestrator Fallback Engine                            │
│  • 5 Function-Calling Tools:                                           │
│    1. get_schema                                                       │
│    2. execute_query (Read-Only SQL AST Validator)                      │
│    3. generate_chart                                                   │
│    4. generate_flowchart                                               │
│    5. explain_data                                                     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Multi-DB Drivers
┌──────────────────────────────────▼─────────────────────────────────────┐
│                      ZONE 4: MULTI-DATABASE LAYER                      │
│  • Relational DB: Local SQLite (`ecommerce.db`) + Supabase PG Cloud    │
│  • NoSQL DB: Firebase Firestore Cloud + Unstructured Log Store         │
│  • App State DB: SQLite (`app_state.db`) for Chat Session Persistence  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🧰 4. Deep-Dive Specification of the 5 Agent Tools

Each tool is exposed as a structured function-calling tool that the LLM agent can invoke:

### **1. `get_schema`**
- **Location**: [`backend/tools/schema_tool.py`](file:///c:/Users/ABHIJIT/OneDrive/Documents/llm%20sql/backend/tools/schema_tool.py)
- **Purpose**: Inspects relational database schemas (tables, column names, data types, primary keys, foreign key constraints) and NoSQL document collections.
- **Output**: Structured JSON schema representation passed to LLM context.

### **2. `execute_query`**
- **Location**: [`backend/tools/query_tool.py`](file:///c:/Users/ABHIJIT/OneDrive/Documents/llm%20sql/backend/tools/query_tool.py)
- **Purpose**: Safely validates and executes read-only SQL `SELECT` statements.
- **Security Check**: Blocks non-read statements (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`).
- **Output**: JSON payload containing column names, row arrays, row count, execution time in milliseconds (`query_time_ms`), and column metadata.

### **3. `generate_chart`**
- **Location**: [`backend/tools/chart_tool.py`](file:///c:/Users/ABHIJIT/OneDrive/Documents/llm%20sql/backend/tools/chart_tool.py) & [`ChartViewer.jsx`](file:///c:/Users/ABHIJIT/OneDrive/Documents/llm%20sql/frontend/src/components/ChartViewer.jsx)
- **Purpose**: Creates visualization configurations for **Bar**, **Line**, **Pie**, **Scatter**, and **Area** charts.
- **Key Features**: Manual Chart-Type Switcher button, Accessible Data Table Fallback toggle, Full-Screen Modal View, and 1-click SVG chart download.

### **4. `generate_flowchart`**
- **Location**: [`backend/tools/diagram_tool.py`](file:///c:/Users/ABHIJIT/OneDrive/Documents/llm%20sql/backend/tools/diagram_tool.py) & [`MermaidViewer.jsx`](file:///c:/Users/ABHIJIT/OneDrive/Documents/llm%20sql/frontend/src/components/MermaidViewer.jsx)
- **Purpose**: Generates vector diagrams for **Entity-Relationship (ER) Diagrams** (`erDiagram`), **Process Flow Pipelines** (`graph TD`), and Decision Trees.
- **Output**: Dynamically rendered Mermaid.js SVG graphic with zoom, pan, and SVG export.

### **5. `explain_data`**
- **Location**: [`backend/tools/explain_tool.py`](file:///c:/Users/ABHIJIT/OneDrive/Documents/llm%20sql/backend/tools/explain_tool.py)
- **Purpose**: Analyzes raw query results to produce conversational insights, statistical takeaways, outlier highlights, and business recommendations.

---

## ⚡ 5. Complete End-to-End Execution Workflow

1. **User Input Ingestion**:
   - User types a natural language query (e.g., *"Show me the top 5 products by revenue this quarter"*) or speaks via Web Speech API.
2. **Context Assembly**:
   - Frontend packages current message + last 4 turns of chat history from `app_state.db` and posts to `/api/chat`.
3. **Schema Introspection**:
   - LLM agent invokes `get_schema()` to retrieve available tables, column names, data types, and foreign key relations.
4. **SQL Synthesis & Validation**:
   - Agent synthesizes an optimal SQL `SELECT` statement and passes it through `execute_query()`. The backend validator verifies read-only safety.
5. **Execution & Timing**:
   - `execute_query()` executes the query against SQLite / Supabase, returning rows, column metadata, and execution timing in milliseconds.
6. **Visualization Generation**:
   - Agent calls `generate_chart()` to produce a Recharts Bar chart widget payload and `explain_data()` to generate analytical key takeaways.
7. **Unstructured Audit Logging**:
   - The entire interaction is logged into `unstructured_logs.db` under the `chat_logs` NoSQL document collection.
8. **UI Rendering**:
   - Frontend renders the chat card with:
     - Formatted generated SQL code block with **Edit SQL** and **Copy** buttons.
     - Interactive Recharts Bar Chart with manual chart-type switcher.
     - Natural Language Insight Card.
     - Clickable **Table Redirection Pills** (e.g. `products`, `orders`) launching the live table inspector modal (`TablePreviewModal`).

---

## 🎯 6. Hackathon Judge Q&A Defense — Winning Answers

### **Q1: How do you prevent SQL Injection or destructive query execution (e.g., DROP TABLE)?**
> **Answer**: We enforce a strict **Read-Only SQL AST Validator** in `query_tool.py`. Before any SQL string reaches the database engine, it is stripped of comments, tokenized, and verified. If the query contains any statement other than `SELECT` (e.g., `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `EXEC`), execution is immediately rejected with a 400 Security Exception. Furthermore, database connections use read-only transactions.

### **Q2: What happens if the Gemini LLM API key is down, throttled, or unavailable?**
> **Answer**: We built an **Intelligent Local Smart Orchestrator** in `agent.py`. If the LLM API fails or no API key is present, our local orchestrator dynamically inspects the database schema using regex-based natural language patterns to generate valid SQL SELECT queries, build Recharts payloads, construct Mermaid ER diagrams, and produce structured analytical responses with zero downtime!

### **Q3: How do you handle unstructured data logging alongside relational database tables?**
> **Answer**: We developed a dual database engine in `unstructured_logger.py`. While business data resides in relational tables (`ecommerce.db` with 7 tables), all user login records (`login_logs`) and conversation turns (`chat_logs`) are saved as unstructured JSON documents inside `unstructured_logs.db`. We use SQLite's native `json_extract()` functions to perform fast NoSQL document queries over JSON fields without needing rigid schema migrations!

### **Q4: How does your visualization system handle accessibility and different chart preferences?**
> **Answer**: In `ChartViewer.jsx`, every chart component includes a **Manual Chart-Type Switcher** allowing users to switch between Bar, Line, Pie, Scatter, and Area views in real time. We also built an **Accessible Data Table Fallback** button that converts any chart into a readable, high-contrast HTML table for screen readers and WCAG compliance.

### **Q5: How do you handle multi-database connectivity (SQL + NoSQL)?**
> **Answer**: Our `multi_db.py` module establishes unified connection adapters for local SQLite (`ecommerce.db`), Supabase Cloud PostgreSQL, and Firebase Firestore NoSQL. The agent's schema discovery tool introspects relational tables and NoSQL document collections simultaneously, providing a single conversational interface across multi-cloud databases.

### **Q6: How did you test and verify your agent tools?**
> **Answer**: We implemented an automated Pytest test suite in `backend/tests/test_tools.py`. It tests all 5 tools (`get_schema`, `execute_query`, `generate_chart`, `generate_flowchart`, `explain_data`), verifying valid JSON schema structure, read-only SQL security enforcement, Recharts formatting, and Mermaid diagram output. All 6 tests pass in 0.24 seconds!

---

## 🌐 7. Quick Reference Links & Commands

- **Start Backend Server**: `python -m uvicorn main:app --host 0.0.0.0 --port 8000` (in `backend/`)
- **Start Frontend Server**: `npm run dev` (in `frontend/`)
- **Run Pytest Test Suite**: `python -m pytest backend/tests/test_tools.py`
- **Build Frontend Bundle**: `npm run build` (in `frontend/`)
- **Frontend URL**: [http://localhost:5173](http://localhost:5173)
- **FastAPI OpenAPI Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **GitHub Repository**: [https://github.com/vabhijit516-bot/sqlllm](https://github.com/vabhijit516-bot/sqlllm)
