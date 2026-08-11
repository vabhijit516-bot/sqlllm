import json
import uuid
import csv
import io
import os
import re
import time
import sqlite3
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, Header, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from db import init_app_db, get_app_db_connection, get_db_connection
from seed_db import seed_database
from agent import run_agent
from tools.schema_tool import get_schema
from auth import verify_google_token_and_upsert_user, decode_jwt_token
from unstructured_logger import log_unstructured_event, query_unstructured_logs
from multi_db import db_manager, MultiDatabaseManager

load_dotenv()

from db import DB_PATH

# Initialize App DB and Seed Domain DB
init_app_db()
if not os.getenv("VERCEL") or not DB_PATH.exists():
    try:
        seed_database()
    except Exception as e:
        print("Database seeding info:", e)


app = FastAPI(
    title="TechX Enterprise AI - Intelligent LLM Database Agent API",
    description="Enterprise Conversational AI Agent with multi-table redirection, SQL/NoSQL engine, Supabase, and Firebase NoSQL logging.",
    version="2.1.0"
)

# Enable CORS for frontend Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Pydantic Schemas
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_email: Optional[str] = "guest@techx.ai"

class GoogleAuthRequest(BaseModel):
    credential: str

class ExportCSVRequest(BaseModel):
    data: List[Dict[str, Any]]
    filename: Optional[str] = "export_data.csv"

class UploadCSVRequest(BaseModel):
    table_name: str
    csv_content: str

class UploadTableRequest(BaseModel):
    table_name: str
    columns: List[str]
    rows: List[Dict[str, Any]]

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "TechX AI - NanoBanana Intelligent LLM Agent",
        "endpoints": [
            "/api/chat",
            "/api/schema",
            "/api/table/{table_name}",
            "/api/sessions",
            "/api/auth/google",
            "/api/logs/login",
            "/api/logs/chat",
            "/api/multi-db/status"
        ]
    }

@app.get("/api/schema")
def fetch_schema(table: Optional[str] = None):
    """Retrieve database schema JSON representation across SQL & NoSQL."""
    schema_json = get_schema(table)
    return json.loads(schema_json)

@app.get("/api/table/{table_name}")
def inspect_table_data(table_name: str, limit: int = 10):
    """
    Directly inspect table contents and columns for chat redirection features.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name = ?;", (table_name,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")

        cursor.execute(f"PRAGMA table_info('{table_name}');")
        columns = [dict(c) for c in cursor.fetchall()]

        cursor.execute(f"SELECT * FROM '{table_name}' LIMIT ?;", (limit,))
        rows = [dict(r) for r in cursor.fetchall()]
        
        conn.close()
        return {
            "status": "success",
            "table_name": table_name,
            "columns": columns,
            "rows": rows,
            "row_count": len(rows)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/multi-db/status")
def fetch_multi_db_status():
    """Retrieve connectivity status for SQLite, Supabase, and Firebase."""
    return MultiDatabaseManager.get_all_schemas()

@app.post("/api/chat")
def handle_chat(req: ChatRequest):
    """Process user message using LLM Agent, record unstructured chat log document, and return response."""
    session_id = req.session_id or str(uuid.uuid4())
    conn = get_app_db_connection()
    cursor = conn.cursor()

    # Ensure session exists
    cursor.execute("SELECT session_id FROM chat_sessions WHERE session_id = ?;", (session_id,))
    if not cursor.fetchone():
        title = req.message[:30] + ("..." if len(req.message) > 30 else "")
        cursor.execute(
            "INSERT INTO chat_sessions (session_id, title, user_email) VALUES (?, ?, ?);",
            (session_id, title, req.user_email)
        )

    # Fetch recent session history for multi-turn context retention
    cursor.execute(
        "SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT 10;",
        (session_id,)
    )
    history_rows = cursor.fetchall()
    history = [{"role": row["role"], "content": row["content"]} for row in history_rows]

    # Save User message
    user_msg_id = str(uuid.uuid4())
    cursor.execute(
        "INSERT INTO chat_messages (message_id, session_id, role, content) VALUES (?, ?, 'user', ?);",
        (user_msg_id, session_id, req.message)
    )

    # Execute Agent logic
    agent_output = run_agent(req.message, history=history)

    # Save Assistant response in SQLite chat_messages table
    asst_msg_id = str(uuid.uuid4())
    cursor.execute("""
    INSERT INTO chat_messages (
        message_id, session_id, role, content, sql_query, thought_steps, chart_data, diagram_data, explanation
    ) VALUES (?, ?, 'assistant', ?, ?, ?, ?, ?, ?);
    """, (
        asst_msg_id,
        session_id,
        agent_output.get("content", ""),
        agent_output.get("sql_query"),
        json.dumps(agent_output.get("thought_steps", [])),
        json.dumps(agent_output.get("chart_data")),
        json.dumps(agent_output.get("diagram_data")),
        agent_output.get("explanation", "")
    ))

    conn.commit()
    conn.close()

    # Record Unstructured Chat Log Document (NoSQL document store)
    chat_log_id = log_unstructured_event(
        collection_name="chat_logs",
        event_type="AGENT_CONVERSATION_TURN",
        user_id=req.user_email,
        email=req.user_email,
        data={
            "session_id": session_id,
            "user_query": req.message,
            "sql_executed": agent_output.get("sql_query"),
            "thought_steps": agent_output.get("thought_steps", []),
            "has_chart": agent_output.get("chart_data") is not None,
            "has_diagram": agent_output.get("diagram_data") is not None,
            "explanation": agent_output.get("explanation")
        }
    )

    return {
        "session_id": session_id,
        "message_id": asst_msg_id,
        "role": "assistant",
        "content": agent_output.get("content", ""),
        "sql_query": agent_output.get("sql_query"),
        "thought_steps": agent_output.get("thought_steps", []),
        "chart_data": agent_output.get("chart_data"),
        "diagram_data": agent_output.get("diagram_data"),
        "explanation": agent_output.get("explanation"),
        "unstructured_chat_log_id": chat_log_id
    }

@app.get("/api/sessions")
def list_sessions(email: Optional[str] = None):
    """Retrieve user chat history sessions."""
    conn = get_app_db_connection()
    cursor = conn.cursor()
    if email and email.strip():
        cursor.execute(
            """SELECT session_id, title, user_email, created_at 
               FROM chat_sessions 
               WHERE user_email = ? OR user_email = 'guest@techx.ai' OR user_email IS NULL OR user_email = ''
               ORDER BY updated_at DESC LIMIT 50;""",
            (email,)
        )
        sessions = [dict(row) for row in cursor.fetchall()]
        if not sessions:
            cursor.execute(
                "SELECT session_id, title, user_email, created_at FROM chat_sessions ORDER BY updated_at DESC LIMIT 50;"
            )
            sessions = [dict(row) for row in cursor.fetchall()]
    else:
        cursor.execute(
            "SELECT session_id, title, user_email, created_at FROM chat_sessions ORDER BY updated_at DESC LIMIT 50;"
        )
        sessions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"sessions": sessions}


@app.get("/api/sessions/{session_id}")
def get_session_messages(session_id: str):
    """Retrieve full multi-turn message history for a given session."""
    conn = get_app_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT message_id, role, content, sql_query, thought_steps, chart_data, diagram_data, explanation, created_at
    FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC;
    """, (session_id,))
    
    rows = cursor.fetchall()
    conn.close()

    messages = []
    for r in rows:
        msg = dict(r)
        msg["thought_steps"] = json.loads(msg["thought_steps"]) if msg.get("thought_steps") else []
        msg["chart_data"] = json.loads(msg["chart_data"]) if msg.get("chart_data") else None
        msg["diagram_data"] = json.loads(msg["diagram_data"]) if msg.get("diagram_data") else None
        messages.append(msg)

    return {"session_id": session_id, "messages": messages}

@app.delete("/api/sessions/{session_id}")
def delete_session(session_id: str):
    """Delete a chat session and all its associated messages from the app database."""
    try:
        conn = get_app_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT session_id FROM chat_sessions WHERE session_id = ?;", (session_id,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Session not found")
        
        cursor.execute("DELETE FROM chat_messages WHERE session_id = ?;", (session_id,))
        cursor.execute("DELETE FROM chat_sessions WHERE session_id = ?;", (session_id,))
        
        conn.commit()
        conn.close()
        
        return {
            "status": "success",
            "message": "Session deleted successfully",
            "session_id": session_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/logs/login")
def fetch_login_logs(email: Optional[str] = None):
    """Query unstructured NoSQL login log document records."""
    logs = query_unstructured_logs("login_logs", filter_key="email" if email else None, filter_val=email if email else None)
    return {"collection": "login_logs", "count": len(logs), "documents": logs}

@app.get("/api/logs/chat")
def fetch_chat_logs():
    """Query unstructured NoSQL chat log document records."""
    logs = query_unstructured_logs("chat_logs")
    return {"collection": "chat_logs", "count": len(logs), "documents": logs}

@app.post("/api/auth/google")
def google_auth(req: GoogleAuthRequest):
    """Google OAuth sign in verification endpoint."""
    res = verify_google_token_and_upsert_user(req.credential)
    return res

@app.post("/api/export/csv")
def export_csv(req: ExportCSVRequest):
    """Convert dataset to downloadable CSV response."""
    if not req.data:
        raise HTTPException(status_code=400, detail="Data array cannot be empty")

    output = io.StringIO()
    headers = list(req.data[0].keys())
    writer = csv.DictWriter(output, fieldnames=headers)
    writer.writeheader()
    writer.writerows(req.data)

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={req.filename}"}
    )

def process_and_create_table_from_csv(table_name: str, csv_content: str):
    """
    Utility to create a new SQLite database table dynamically from CSV text content.
    """
    clean_name = re.sub(r'[^a-zA-Z0-9_]', '', table_name.lower().replace(' ', '_')).strip()
    if not clean_name:
        clean_name = f"uploaded_table_{int(time.time())}"
    if not clean_name.startswith("uploaded_") and not clean_name.startswith("demo_"):
        clean_name = f"uploaded_{clean_name}"

    reader = csv.reader(io.StringIO(csv_content.strip()))
    header = next(reader, None)
    if not header:
        raise ValueError("CSV content is empty")

    clean_columns = []
    seen = set()
    for col in header:
        c_clean = re.sub(r'[^a-zA-Z0-9_]', '', col.lower().replace(' ', '_')).strip()
        if not c_clean or c_clean in seen:
            c_clean = f"col_{len(clean_columns)+1}"
        seen.add(c_clean)
        clean_columns.append(c_clean)

    rows = []
    for row in reader:
        if not row or all(v.strip() == '' for v in row):
            continue
        row_dict = {}
        for i, val in enumerate(row):
            if i < len(clean_columns):
                val_str = val.strip()
                if val_str.isdigit():
                    row_dict[clean_columns[i]] = int(val_str)
                else:
                    try:
                        row_dict[clean_columns[i]] = float(val_str)
                    except ValueError:
                        row_dict[clean_columns[i]] = val_str
        rows.append(row_dict)

    if not rows:
        raise ValueError("No data rows found in CSV")

    col_types = {}
    for col in clean_columns:
        types = set()
        for r in rows:
            v = r.get(col)
            if isinstance(v, int):
                types.add("INTEGER")
            elif isinstance(v, float):
                types.add("REAL")
            elif v is not None and str(v) != "":
                types.add("TEXT")
        if "TEXT" in types or not types:
            col_types[col] = "TEXT"
        elif "REAL" in types:
            col_types[col] = "REAL"
        else:
            col_types[col] = "INTEGER"

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(f"DROP TABLE IF EXISTS '{clean_name}';")

    col_defs = [f"'{col}' {col_types[col]}" for col in clean_columns]
    create_sql = f"CREATE TABLE '{clean_name}' (id INTEGER PRIMARY KEY AUTOINCREMENT, {', '.join(col_defs)});"
    cursor.execute(create_sql)

    quoted_cols = ", ".join([f"'{c}'" for c in clean_columns])
    placeholders = ", ".join(["?"] * len(clean_columns))
    insert_sql = f"INSERT INTO '{clean_name}' ({quoted_cols}) VALUES ({placeholders});"

    for r in rows:
        vals = [r.get(col, None) for col in clean_columns]
        cursor.execute(insert_sql, vals)

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "table_name": clean_name,
        "columns": [{"name": col, "type": col_types[col]} for col in clean_columns],
        "row_count": len(rows),
        "rows": rows[:10]
    }

@app.post("/api/upload-table")
def upload_table_endpoint(req: UploadCSVRequest):
    """
    Upload CSV dataset or custom table data into SQLite database for review and AI querying.
    """
    try:
        res = process_and_create_table_from_csv(req.table_name, req.csv_content)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/demo-tables/load")
def load_demo_tables_endpoint():
    """
    Seeds and loads example demo tables (AI Benchmarks, SaaS Metrics, Tech Payroll) for instant demo & review.
    """
    try:
        csv_ai = """model_name,provider,parameters_b,mmlu_score,cost_per_1m_tokens_usd,context_window_k
Gemini 2.5 Flash,Google,8.5,86.4,0.075,1000
GPT-4o,OpenAI,200.0,88.7,2.50,128
Claude 3.5 Sonnet,Anthropic,175.0,88.3,3.00,200
DeepSeek R1,DeepSeek,671.0,90.8,0.55,128
Llama 3.1 405B,Meta,405.0,88.6,1.20,128
Mistral Large 2,Mistral,123.0,84.0,2.00,128
Qwen 2.5 72B,Alibaba,72.0,85.3,0.40,128
Grok 2,xAI,150.0,87.5,2.00,128"""

        csv_saas = """company_name,category,arr_millions,nrr_percentage,churn_rate_pct,cac_payback_months,employees
Vercel,Developer Tools,120.5,132.0,1.8,11,450
Snowflake,Data Cloud,2800.0,127.0,2.1,16,7000
Stripe,Fintech,3500.0,140.0,1.2,8,8000
Databricks,AI & Data,2400.0,135.0,1.5,14,6500
Figma,Design & UI,750.0,130.0,1.4,10,1300
Notion,Productivity,450.0,128.0,2.0,9,950
Canva,Graphic Design,1800.0,125.0,2.5,7,4000
Postman,API Platform,210.0,122.0,2.2,12,600"""

        csv_payroll = """employee_id,full_name,department,job_title,salary_usd,experience_years,performance_rating
1001,Elena Rostova,AI Engineering,Principal LLM Architect,240000,9,4.9
1002,Marcus Vance,Data Science,Senior Data Engineer,185000,6,4.7
1003,Aisha Chen,Product Management,VP of Product,260000,12,4.8
1004,Devon Miller,Infrastructure,DevOps Lead,175000,7,4.6
1005,Sophia Patel,Cybersecurity,Security Specialist,160000,5,4.5
1006,Liam O'Connor,Frontend,Staff UI/UX Engineer,190000,8,4.8
1007,Yuki Tanaka,AI Research,Research Scientist,225000,7,4.9
1008,Zara Ahmed,Sales Engineering,Solutions Architect,170000,6,4.4"""

        res_ai = process_and_create_table_from_csv("demo_ai_benchmarks", csv_ai)
        res_saas = process_and_create_table_from_csv("demo_saas_metrics", csv_saas)
        res_payroll = process_and_create_table_from_csv("demo_tech_payroll", csv_payroll)

        return {
            "status": "success",
            "message": "Demo tables loaded successfully into SQL database.",
            "demo_tables": [res_ai, res_saas, res_payroll]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/seed")
def trigger_seed():
    """Endpoint to re-seed database with fresh data."""
    seed_database()
    return {"status": "success", "message": "Database re-seeded successfully."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
