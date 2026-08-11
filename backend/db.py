import sqlite3
import os
import shutil
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

if os.getenv("VERCEL"):
    TMP_DIR = Path("/tmp")
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    DB_PATH = TMP_DIR / "ecommerce.db"
    APP_DB_PATH = TMP_DIR / "app_state.db"
    
    src_db = BASE_DIR / "ecommerce.db"
    src_app_db = BASE_DIR / "app_state.db"
    
    if src_db.exists() and not DB_PATH.exists():
        try:
            shutil.copy(src_db, DB_PATH)
        except Exception:
            pass
    if src_app_db.exists() and not APP_DB_PATH.exists():
        try:
            shutil.copy(src_app_db, APP_DB_PATH)
        except Exception:
            pass
else:
    DB_PATH = BASE_DIR / os.getenv("DATABASE_PATH", "ecommerce.db")
    APP_DB_PATH = BASE_DIR / os.getenv("APP_DB_PATH", "app_state.db")


def get_db_connection():
    """Returns a SQLite connection object to the e-commerce database."""
    try:
        conn = sqlite3.connect(DB_PATH)
    except sqlite3.OperationalError:
        tmp_db = Path("/tmp") / "ecommerce.db"
        if not tmp_db.exists() and (BASE_DIR / "ecommerce.db").exists():
            try:
                shutil.copy(BASE_DIR / "ecommerce.db", tmp_db)
            except Exception:
                pass
        conn = sqlite3.connect(tmp_db)
    conn.row_factory = sqlite3.Row
    return conn

def get_app_db_connection():
    """Returns a SQLite connection object to the app state / chat history database."""
    try:
        conn = sqlite3.connect(APP_DB_PATH)
    except sqlite3.OperationalError:
        tmp_app_db = Path("/tmp") / "app_state.db"
        if not tmp_app_db.exists() and (BASE_DIR / "app_state.db").exists():
            try:
                shutil.copy(BASE_DIR / "app_state.db", tmp_app_db)
            except Exception:
                pass
        conn = sqlite3.connect(tmp_app_db)
    conn.row_factory = sqlite3.Row
    return conn

def init_app_db():
    """Initializes app state tables for chat sessions, messages, and saved queries."""
    try:
        conn = get_app_db_connection()
        cursor = conn.cursor()
        
        # Sessions table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_sessions (
            session_id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            user_email TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Chat Messages table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            message_id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            sql_query TEXT,
            thought_steps TEXT,
            chart_data TEXT,
            diagram_data TEXT,
            explanation TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id)
        )
        """)

        # Users table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            picture TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        conn.commit()
        conn.close()
    except Exception as e:
        print("init_app_db warning:", e)


if __name__ == "__main__":
    init_app_db()
    print("App state database initialized successfully.")
