import pytest
import json
import os
import sys

# Ensure backend root is on Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.schema_tool import get_schema
from tools.query_tool import execute_query
from tools.chart_tool import generate_chart
from tools.diagram_tool import generate_flowchart
from tools.explain_tool import explain_data
from seed_db import seed_database

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    seed_database()

def test_get_schema():
    schema_raw = get_schema()
    schema = json.loads(schema_raw)
    assert "tables" in schema
    assert "products" in schema["tables"]
    assert "orders" in schema["tables"]
    assert len(schema["tables"]["products"]["columns"]) > 0

def test_execute_query_valid():
    query = "SELECT product_name, price FROM products LIMIT 5;"
    result_raw = execute_query(query)
    result = json.loads(result_raw)
    assert result["status"] == "success"
    assert result["row_count"] <= 5
    assert "columns" in result
    assert "product_name" in result["columns"]

def test_execute_query_disallowed():
    query = "DELETE FROM customers;"
    result_raw = execute_query(query)
    result = json.loads(result_raw)
    assert result["status"] == "error"
    assert "prohibited" in result["message"].lower()

def test_generate_chart():
    sample_data = [
        {"category": "Electronics", "sales": 45000},
        {"category": "Apparel", "sales": 28000}
    ]
    chart_raw = generate_chart("bar", "Sales by Category", sample_data, "category", ["sales"])
    chart = json.loads(chart_raw)
    assert chart["status"] == "success"
    assert chart["chart_type"] == "bar"
    assert chart["x_axis_key"] == "category"
    assert chart["y_axis_keys"] == ["sales"]
    assert len(chart["data"]) == 2

def test_generate_flowchart():
    mermaid = "erDiagram CUSTOMERS ||--o{ ORDERS : places"
    diag_raw = generate_flowchart("er", "Test ER Diagram", mermaid)
    diag = json.loads(diag_raw)
    assert diag["status"] == "success"
    assert diag["diagram_type"] == "er"
    assert "erDiagram" in diag["mermaid_code"]

def test_explain_data():
    summary = "Electronics led overall sales performance."
    insights = ["Revenue grew 18% month over month.", "Laptop model X accounted for 40% of sales."]
    recs = ["Stock more units in US warehouse."]
    explain_raw = explain_data(summary, insights, recs)
    explain = json.loads(explain_raw)
    assert explain["status"] == "success"
    assert explain["data_summary"] == summary
    assert len(explain["key_insights"]) == 2
    assert len(explain["recommendations"]) == 1
