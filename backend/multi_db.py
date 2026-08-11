import os
import json
import sqlite3
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()

class MultiDatabaseManager:
    """
    Multi-Database Connectivity Manager supporting:
    - SQLite (Local Domain DB)
    - Supabase (PostgreSQL Cloud DB)
    - Firebase Firestore (NoSQL Document Store)
    - Unstructured Logs Store
    """
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL", "")
        self.supabase_key = os.getenv("SUPABASE_KEY", "")
        self.firebase_project_id = os.getenv("FIREBASE_PROJECT_ID", "")
        self._init_firebase()
        self._init_supabase()

    def _init_supabase(self):
        self.supabase_client = None
        if self.supabase_url and self.supabase_key:
            try:
                from supabase import create_client
                self.supabase_client = create_client(self.supabase_url, self.supabase_key)
                print("Connected to Supabase PostgreSQL database.")
            except Exception as e:
                print("Supabase connection info:", e)

    def _init_firebase(self):
        self.firebase_app = None
        if self.firebase_project_id:
            try:
                import firebase_admin
                from firebase_admin import credentials, firestore
                if not firebase_admin._apps:
                    cred = credentials.ApplicationDefault()
                    self.firebase_app = firebase_admin.initialize_app(cred, {'projectId': self.firebase_project_id})
                print("Connected to Firebase Firestore NoSQL database.")
            except Exception as e:
                print("Firebase connection info:", e)

    @staticmethod
    def get_all_schemas() -> Dict[str, Any]:
        """Unified schema inspector across SQLite, Supabase, and Firebase NoSQL collections."""
        from tools.schema_tool import get_schema
        sqlite_schema = json.loads(get_schema())

        nosql_collections = {
            "login_logs": {
                "type": "NoSQL Document Collection",
                "fields": ["log_id", "user_id", "email", "event_type", "timestamp", "data"]
            },
            "chat_logs": {
                "type": "NoSQL Document Collection",
                "fields": ["log_id", "session_id", "user_query", "sql_executed", "chart_generated", "timestamp"]
            }
        }

        return {
            "databases": {
                "sqlite_ecommerce": sqlite_schema,
                "supabase_postgresql": {
                    "status": "connected" if db_manager.supabase_client else "ready (configured via .env)",
                    "url": db_manager.supabase_url or "https://your-supabase-project.supabase.co"
                },
                "firebase_firestore": {
                    "status": "connected" if db_manager.firebase_app else "ready (configured via .env)",
                    "collections": nosql_collections
                }
            }
        }

db_manager = MultiDatabaseManager()
