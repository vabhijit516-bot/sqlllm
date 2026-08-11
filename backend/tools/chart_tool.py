import json
from typing import List, Dict, Any, Optional

def generate_chart(
    chart_type: str,
    title: str,
    data: List[Dict[str, Any]],
    x_axis_key: str,
    y_axis_keys: List[str],
    description: Optional[str] = ""
) -> str:
    """
    Generate data visualization configuration payload for frontend chart components (Bar, Line, Pie, Scatter, Area).
    
    Args:
        chart_type (str): Type of chart - 'bar', 'line', 'pie', 'scatter', or 'area'.
        title (str): Descriptive chart header title.
        data (List[Dict[str, Any]]): Data rows object array.
        x_axis_key (str): Column key for X-axis / categories.
        y_axis_keys (List[str]): Column keys for Y-axis numerical values.
        description (str, optional): Short context explanation of chart.
        
    Returns:
        str: JSON string containing complete chart metadata and formatted dataset.
    """
    valid_types = ["bar", "line", "pie", "scatter", "area"]
    norm_type = chart_type.lower().strip()
    if norm_type not in valid_types:
        norm_type = "bar"

    colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#3b82f6"]

    chart_config = {
        "status": "success",
        "chart_type": norm_type,
        "title": title,
        "description": description,
        "x_axis_key": x_axis_key,
        "y_axis_keys": y_axis_keys,
        "colors": colors[:len(y_axis_keys)] if len(y_axis_keys) <= len(colors) else colors,
        "data": data
    }

    return json.dumps(chart_config, indent=2)

CHART_TOOL_DECLARATION = {
    "name": "generate_chart",
    "description": "Create data visualizations (bar chart, line chart, pie chart, scatter plot, area chart). Use after execute_query to visualize returned numerical/categorical dataset.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "chart_type": {
                "type": "STRING",
                "description": "Chart format: 'bar' (categorical), 'line' (trends over time), 'pie' (distribution/percentages), 'scatter' (correlation), or 'area' (cumulative trends)."
            },
            "title": {
                "type": "STRING",
                "description": "Clean, descriptive title for the chart widget."
            },
            "data": {
                "type": "ARRAY",
                "description": "List of object dictionaries returned by execute_query.",
                "items": { "type": "OBJECT" }
            },
            "x_axis_key": {
                "type": "STRING",
                "description": "Field name to display on X-axis or Pie slices (e.g. 'product_name', 'order_date', 'category_name')."
            },
            "y_axis_keys": {
                "type": "ARRAY",
                "description": "List of numeric field names for Y-axis values (e.g. ['total_revenue'], ['stock_quantity']).",
                "items": { "type": "STRING" }
            },
            "description": {
                "type": "STRING",
                "description": "Optional brief sentence explaining what this chart depicts."
            }
        },
        "required": ["chart_type", "title", "data", "x_axis_key", "y_axis_keys"]
    }
}

if __name__ == "__main__":
    sample_data = [
        {"product_name": "Quantum X Laptop", "revenue": 12999.9},
        {"product_name": "Pro Espresso Machine", "revenue": 8980.0},
        {"product_name": "NoiseCancel Headphones", "revenue": 5400.0}
    ]
    print(generate_chart("bar", "Top Products by Revenue", sample_data, "product_name", ["revenue"]))
