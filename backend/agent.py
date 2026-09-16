import os
import json
import re
from typing import Dict, Any, List, Tuple
from dotenv import load_dotenv

# Import tools
from tools.schema_tool import get_schema, SCHEMA_TOOL_DECLARATION
from tools.query_tool import execute_query, QUERY_TOOL_DECLARATION
from tools.chart_tool import generate_chart, CHART_TOOL_DECLARATION
from tools.diagram_tool import generate_flowchart, DIAGRAM_TOOL_DECLARATION
from tools.explain_tool import explain_data, EXPLAIN_TOOL_DECLARATION

load_dotenv()

# Map tool names to python functions
TOOL_MAP = {
    "get_schema": get_schema,
    "execute_query": execute_query,
    "generate_chart": generate_chart,
    "generate_flowchart": generate_flowchart,
    "explain_data": explain_data
}

ALL_TOOL_DECLARATIONS = [
    SCHEMA_TOOL_DECLARATION,
    QUERY_TOOL_DECLARATION,
    CHART_TOOL_DECLARATION,
    DIAGRAM_TOOL_DECLARATION,
    EXPLAIN_TOOL_DECLARATION
]

SYSTEM_PROMPT = """
You are TechX Enterprise AI, an advanced Intelligent Database & Visual Analytics Platform.
Your goal is to answer user requests based on the database schema and data.

You have access to the following tools:
1. `get_schema`: Retrieves the database schema.
2. `execute_query`: Executes a SELECT query.
3. `generate_chart`: Generates chart data.
4. `generate_flowchart`: Generates diagram.

You MUST respond with a valid JSON object. 
If the user is asking a data question, output:
{
  "sql_query": "SELECT ...",
  "needs_chart": true/false,
  "chart_type": "bar/line/pie",
  "x_axis_key": "column_name",
  "y_axis_keys": ["column_name"],
  "explanation": "Brief explanation of what the query does"
}
If the user asks for a flowchart or ER diagram, output:
{
  "sql_query": null,
  "diagram_type": "er" or "flowchart",
  "mermaid_code": "valid mermaid.js code",
  "explanation": "Brief explanation of the diagram"
}
If no query or diagram is needed, output:
{
  "sql_query": null,
  "explanation": "Your answer"
}

Ensure the SQL query uses correct table and column names from the provided schema. Always generate standard SQLite compatible SQL.
"""

def call_llm(prompt: str) -> str:
    """Try to call Ollama, fallback to Gemini."""
    api_key = os.getenv("GEMINI_API_KEY")
    
    # Try Ollama first as per user request
    try:
        import ollama
        resp = ollama.chat(model='llama3.1', messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ], format='json')
        return resp['message']['content']
    except Exception as e:
        print(f"Ollama failed or not available ({e}), falling back to Gemini")
        if not api_key:
            raise Exception("No Gemini API key and Ollama failed.")
        
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key)
        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.1,
            response_mime_type="application/json"
        )
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
            config=config
        )
        return response.text

def explain_results(user_prompt: str, data: str) -> str:
    """Generate final natural language response based on SQL results."""
    api_key = os.getenv("GEMINI_API_KEY")
    prompt = f"User asked: {user_prompt}\nQuery Results: {data}\nProvide a concise and natural answer based on the data."
    
    try:
        import ollama
        resp = ollama.chat(model='llama3.1', messages=[
            {"role": "system", "content": "You are a helpful data assistant. Provide a natural language summary of the data results to answer the user's question."},
            {"role": "user", "content": prompt}
        ])
        return resp['message']['content']
    except Exception:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt
        )
        return response.text

def run_agent(user_prompt: str, history: List[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Main agent execution entry point. 
    Uses LLM to dynamically parse requests and generate SQL for all tables including uploaded ones.
    """
    thought_steps = []
    
    # 1. Get Schema
    schema_str = get_schema()
    thought_steps.append({"tool": "get_schema", "status": "success", "result": "Retrieved database schema."})
    
    # 2. Prepare Prompt
    full_content = f"Schema:\n{schema_str}\n\n"
    if history:
        prev_turns = "\n".join([f"{h['role'].upper()}: {h['content']}" for h in history[-4:]])
        full_content += f"Conversation History:\n{prev_turns}\n\n"
    full_content += f"Current User Request: {user_prompt}"
    
    # 3. Call LLM
    try:
        llm_response_text = call_llm(full_content)
        parsed = json.loads(llm_response_text)
    except Exception as e:
        print(f"Error parsing LLM JSON: {e}")
        return {
            "content": f"I'm sorry, I couldn't process that request properly. Error: {e}",
            "sql_query": None,
            "thought_steps": thought_steps,
            "chart_data": None,
            "diagram_data": None,
            "explanation": "Error processing request."
        }
        
    sql_executed = parsed.get("sql_query")
    chart_payload = None
    diagram_payload = None
    explanation_text = parsed.get("explanation", "")
    final_content = explanation_text

    # 4. Handle Diagrams
    if parsed.get("diagram_type") and parsed.get("mermaid_code"):
        diag_res = generate_flowchart(
            diagram_type=parsed.get("diagram_type"),
            title="Generated Diagram",
            mermaid_code=parsed.get("mermaid_code"),
            explanation=explanation_text
        )
        thought_steps.append({"tool": "generate_flowchart", "status": "success", "result": "Generated diagram."})
        diagram_payload = json.loads(diag_res)
    
    # 5. Handle SQL Queries
    if sql_executed:
        query_res_str = execute_query(sql_executed)
        query_res = json.loads(query_res_str)
        thought_steps.append({"tool": "execute_query", "status": query_res.get("status"), "query": sql_executed, "row_count": query_res.get("row_count", 0)})
        
        if query_res.get("status") == "success" and query_res.get("rows"):
            # Generate Chart if requested
            if parsed.get("needs_chart") and parsed.get("chart_type"):
                chart_res = generate_chart(
                    chart_type=parsed.get("chart_type"),
                    title="Data Visualization",
                    data=query_res["rows"],
                    x_axis_key=parsed.get("x_axis_key", ""),
                    y_axis_keys=parsed.get("y_axis_keys", [])
                )
                chart_payload = json.loads(chart_res)
                thought_steps.append({"tool": "generate_chart", "status": "success", "result": f"Generated {parsed.get('chart_type')} chart."})
            
            # Use LLM to explain data results
            final_content = explain_results(user_prompt, json.dumps(query_res["rows"][:20]))
        else:
            final_content = f"Query failed or returned no results: {query_res.get('message', 'No rows found.')}"
            
    return {
        "content": final_content,
        "sql_query": sql_executed,
        "thought_steps": thought_steps,
        "chart_data": chart_payload,
        "diagram_data": diagram_payload,
        "explanation": explanation_text
    }

if __name__ == "__main__":
    res = run_agent("Show me top 5 products by revenue")
    print("Agent result:", json.dumps(res, indent=2))

