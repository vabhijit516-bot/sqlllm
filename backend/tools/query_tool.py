import sqlite3
import json
import time
import re
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import get_db_connection

def execute_query(sql_query: str) -> str:
    """
    Execute a read-only SQL SELECT query against the SQLite database.
    
    Args:
        sql_query (str): The SQL SELECT query to execute.
        
    Returns:
        str: JSON string containing execution status, columns, rows data, row count, execution time, and generated query.
    """
    cleaned_query = sql_query.strip().rstrip(";")

    # Security check: strictly enforce SELECT / EXPLAIN queries
    disallowed_keywords = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE", "REPLACE"]
    first_word = cleaned_query.split()[0].upper() if cleaned_query else ""

    if first_word in disallowed_keywords or any(f" {kw} " in cleaned_query.upper() for kw in ["DROP TABLE", "DELETE FROM", "UPDATE "]):
        return json.dumps({
            "status": "error",
            "message": "Write operations (INSERT, UPDATE, DELETE, DROP, etc.) are strictly prohibited. Please provide a read-only SELECT query."
        })

    try:
        start_time = time.time()
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(cleaned_query)
        rows_raw = cursor.fetchall()
        execution_time_ms = round((time.time() - start_time) * 1000, 2)

        if cursor.description:
            columns = [desc[0] for desc in cursor.description]
        else:
            columns = []

        # Format rows as list of dicts
        rows = [dict(row) for row in rows_raw]
        conn.close()

        return json.dumps({
            "status": "success",
            "sql_query": cleaned_query,
            "columns": columns,
            "rows": rows,
            "row_count": len(rows),
            "execution_time_ms": execution_time_ms
        }, indent=2)

    except sqlite3.Error as sqlite_err:
        return json.dumps({
            "status": "error",
            "sql_query": cleaned_query,
            "message": f"SQL Execution Error: {str(sqlite_err)}"
        })
    except Exception as e:
        return json.dumps({
            "status": "error",
            "sql_query": cleaned_query,
            "message": f"Unexpected error executing query: {str(e)}"
        })

QUERY_TOOL_DECLARATION = {
    "name": "execute_query",
    "description": "Execute a SQL SELECT query against the SQLite database and return results as JSON.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "sql_query": {
                "type": "STRING",
                "description": "Valid SQL SELECT query string to execute."
            }
        },
        "required": ["sql_query"]
    }
}

if __name__ == "__main__":
    print(execute_query("SELECT * FROM categories LIMIT 3;"))
