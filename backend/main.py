import json
import uuid
import csv
import io
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

# Initialize App DB and Seed Domain DB
init_app_db()
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
    """Retrieve user chat history sessions filtered by user email."""
    conn = get_app_db_connection()
    cursor = conn.cursor()
    if email and email.strip():
        cursor.execute(
            "SELECT session_id, title, created_at FROM chat_sessions WHERE user_email = ? ORDER BY updated_at DESC LIMIT 25;",
            (email,)
        )
    else:
        cursor.execute(
            "SELECT session_id, title, created_at FROM chat_sessions ORDER BY updated_at DESC LIMIT 25;"
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

@app.post("/api/seed")
def trigger_seed():
    """Endpoint to re-seed database with fresh data."""
    seed_database()
    return {"status": "success", "message": "Database re-seeded successfully."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
