import json
import sqlite3
import time
import uuid
import os
import shutil
from typing import Dict, Any, List, Optional
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

if os.getenv("VERCEL"):
    TMP_DIR = Path("/tmp")
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    LOG_DB_PATH = TMP_DIR / "unstructured_logs.db"
    src_log_db = BASE_DIR / "unstructured_logs.db"
    if src_log_db.exists() and not LOG_DB_PATH.exists():
        try:
            shutil.copy(src_log_db, LOG_DB_PATH)
        except Exception as e:
            print("Failed to copy unstructured_logs.db to /tmp:", e)
else:
    LOG_DB_PATH = BASE_DIR / "unstructured_logs.db"

def get_log_db_connection():
    """Returns SQLite connection object dedicated to unstructured JSON document logs."""
    try:
        conn = sqlite3.connect(LOG_DB_PATH)
    except sqlite3.OperationalError:
        # Fallback to /tmp if BASE_DIR is read-only
        tmp_path = Path("/tmp") / "unstructured_logs.db"
        conn = sqlite3.connect(tmp_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_log_db():
    """Initializes unstructured document store tables for login and chat logs."""
    try:
        conn = get_log_db_connection()
        cursor = conn.cursor()
        
        # Document store table for unstructured logs
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS unstructured_logs (
            log_id TEXT PRIMARY KEY,
            collection_name TEXT NOT NULL,
            event_type TEXT NOT NULL,
            user_id TEXT,
            email TEXT,
            timestamp INTEGER NOT NULL,
            document_json TEXT NOT NULL
        );
        """)

        cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_collection_type ON unstructured_logs(collection_name, event_type);
        """)

        conn.commit()
        conn.close()
    except Exception as e:
        print("init_log_db warning:", e)

try:
    init_log_db()
except Exception as e:
    print("Failed to init log db:", e)


def log_unstructured_event(collection_name: str, event_type: str, user_id: str, email: str, data: Dict[str, Any]) -> str:
    """
    Log an unstructured event document (e.g. login logs, chat logs) into document store.
    
    Args:
        collection_name (str): Document collection name (e.g. 'login_logs', 'chat_logs').
        event_type (str): Event identifier (e.g. 'USER_LOGIN', 'CHAT_QUERY', 'AGENT_TOOL_CALL').
        user_id (str): User identifier.
        email (str): User email.
        data (Dict[str, Any]): Arbitrary unstructured document JSON dictionary.
        
    Returns:
        str: Generated log document ID.
    """
    log_id = str(uuid.uuid4())
    timestamp = int(time.time())

    full_document = {
        "log_id": log_id,
        "collection": collection_name,
        "event_type": event_type,
        "user_id": user_id,
        "email": email,
        "timestamp": timestamp,
        "iso_time": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(timestamp)),
        "data": data
    }

    try:
        # 1. Local SQLite JSON document store
        conn = get_log_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO unstructured_logs (log_id, collection_name, event_type, user_id, email, timestamp, document_json) VALUES (?, ?, ?, ?, ?, ?, ?);",
            (log_id, collection_name, event_type, user_id, email, timestamp, json.dumps(full_document))
        )
        conn.commit()
        conn.close()

        # 2. Remote Firebase Firestore / Supabase sync if credentials provided
        sync_remote_logs(collection_name, log_id, full_document)

    except Exception as e:
        print("Logging error:", e)

    return log_id

def sync_remote_logs(collection_name: str, log_id: str, document: Dict[str, Any]):
    """Sync log document to Firebase Firestore or Supabase if configured."""
    # Supabase sync
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    if supabase_url and supabase_key:
        try:
            from supabase import create_client
            client = create_client(supabase_url, supabase_key)
            client.table(collection_name).insert(document).execute()
        except Exception as e:
            pass # Fail gracefully if remote database credentials pending

def query_unstructured_logs(collection_name: str, filter_key: Optional[str] = None, filter_val: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
    """
    Query unstructured log documents using NoSQL/document filtering syntax.
    """
    conn = get_log_db_connection()
    cursor = conn.cursor()

    if filter_key and filter_val:
        cursor.execute(
            "SELECT document_json FROM unstructured_logs WHERE collection_name = ? AND json_extract(document_json, ?) = ? ORDER BY timestamp DESC LIMIT ?;",
            (collection_name, f"$.{filter_key}", filter_val, limit)
        )
    else:
        cursor.execute(
            "SELECT document_json FROM unstructured_logs WHERE collection_name = ? ORDER BY timestamp DESC LIMIT ?;",
            (collection_name, limit)
        )

    rows = cursor.fetchall()
    conn.close()

    return [json.loads(row["document_json"]) for row in rows]

if __name__ == "__main__":
    log_unstructured_event("login_logs", "USER_LOGIN", "u123", "test@techx.ai", {"ip": "127.0.0.1", "device": "Chrome"})
    logs = query_unstructured_logs("login_logs")
    print("Logged events:", logs)
