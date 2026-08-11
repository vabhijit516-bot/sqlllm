import sqlite3
import json
import os
import sys

# Add parent dir to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import get_db_connection

def get_schema(table_name: str = None) -> str:
    """
    Retrieve database schema including table names, columns, data types, primary keys, and foreign keys.
    
    Args:
        table_name (str, optional): Specific table name to filter schema for. Defaults to None (all tables).
        
    Returns:
        str: JSON string representation of the database schema.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Fetch table names
        if table_name:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?;", (table_name,))
        else:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
            
        tables = [row['name'] for row in cursor.fetchall()]

        schema_info = {"tables": {}}

        for tbl in tables:
            # Columns info: cid, name, type, notnull, dflt_value, pk
            cursor.execute(f"PRAGMA table_info('{tbl}');")
            cols_raw = cursor.fetchall()
            
            # Foreign keys info: id, seq, table, from, to, on_update, on_delete, match
            cursor.execute(f"PRAGMA foreign_key_list('{tbl}');")
            fks_raw = cursor.fetchall()
            
            columns = []
            for col in cols_raw:
                columns.append({
                    "name": col["name"],
                    "type": col["type"],
                    "primary_key": bool(col["pk"]),
                    "nullable": not bool(col["notnull"])
                })

            foreign_keys = []
            for fk in fks_raw:
                foreign_keys.append({
                    "from_column": fk["from"],
                    "target_table": fk["table"],
                    "target_column": fk["to"]
                })

            schema_info["tables"][tbl] = {
                "columns": columns,
                "foreign_keys": foreign_keys
            }

        conn.close()
        return json.dumps(schema_info, indent=2)

    except Exception as e:
        return json.dumps({"error": f"Failed to retrieve schema: {str(e)}"})

SCHEMA_TOOL_DECLARATION = {
    "name": "get_schema",
    "description": "Retrieve database schema (tables, columns, data types, primary keys, and foreign key relationships). Call this first to inspect table structures before writing SQL queries.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "table_name": {
                "type": "STRING",
                "description": "Optional table name to retrieve schema for a specific table. Leave blank for all tables."
            }
        },
        "required": []
    }
}

if __name__ == "__main__":
    print(get_schema())
