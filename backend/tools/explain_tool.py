import json
from typing import List, Dict, Any, Optional

def explain_data(
    data_summary: str,
    key_insights: List[str],
    recommendations: Optional[List[str]] = None
) -> str:
    """
    Generate structured, conversational data insights and strategic business recommendations.
    
    Args:
        data_summary (str): Natural language narrative overview of the data set.
        key_insights (List[str]): List of key data findings, top metrics, or anomalies.
        recommendations (List[str], optional): Strategic next steps or business recommendations based on the findings.
        
    Returns:
        str: JSON string containing structured insight cards.
    """
    explanation_payload = {
        "status": "success",
        "data_summary": data_summary,
        "key_insights": key_insights,
        "recommendations": recommendations or []
    }

    return json.dumps(explanation_payload, indent=2)

EXPLAIN_TOOL_DECLARATION = {
    "name": "explain_data",
    "description": "Synthesize data insights, statistical highlights, and strategic recommendations into clear conversational explanations.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "data_summary": {
                "type": "STRING",
                "description": "Comprehensive natural language explanation summarizing the findings from query data."
            },
            "key_insights": {
                "type": "ARRAY",
                "description": "Bullet points highlighting top metrics, growth trends, or significant outliers.",
                "items": { "type": "STRING" }
            },
            "recommendations": {
                "type": "ARRAY",
                "description": "Actionable business or technical recommendations derived from the insights.",
                "items": { "type": "STRING" }
            }
        },
        "required": ["data_summary", "key_insights"]
    }
}

if __name__ == "__main__":
    print(explain_data(
        "Sales revenue is heavily concentrated in Electronics with Quantum X Laptop leading overall performance.",
        ["Electronics generated 62% of total revenue.", "Quantum X Laptop had 45 sales averaging $1,299.99."],
        ["Increase inventory threshold for Quantum X Laptop in US-East warehouse."]
    ))
