import sqlite3
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / os.getenv("DATABASE_PATH", "ecommerce.db")
APP_DB_PATH = BASE_DIR / os.getenv("APP_DB_PATH", "app_state.db")

def get_db_connection():
    """Returns a SQLite connection object to the e-commerce database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_app_db_connection():
    """Returns a SQLite connection object to the app state / chat history database."""
    conn = sqlite3.connect(APP_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_app_db():
    """Initializes app state tables for chat sessions, messages, and saved queries."""
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

if __name__ == "__main__":
    init_app_db()
    print("App state database initialized successfully.")
