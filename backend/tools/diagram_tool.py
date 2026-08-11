import json
from typing import Optional

def generate_flowchart(
    diagram_type: str,
    title: str,
    mermaid_code: str,
    explanation: Optional[str] = ""
) -> str:
    """
    Generate Mermaid.js diagrams (ER Diagrams, Process Flowcharts, Decision Trees, System Data Pipelines).
    
    Args:
        diagram_type (str): Type of diagram - 'er' (Entity Relationship), 'flowchart' (Process Flow), or 'decision_tree'.
        title (str): Diagram title header.
        mermaid_code (str): Valid Mermaid syntax definition (e.g. 'erDiagram ...' or 'graph TD ...').
        explanation (str, optional): Explanatory summary of the diagram.
        
    Returns:
        str: JSON string containing diagram metadata and Mermaid definition.
    """
    diagram_payload = {
        "status": "success",
        "diagram_type": diagram_type.lower().strip(),
        "title": title,
        "mermaid_code": mermaid_code.strip(),
        "explanation": explanation
    }

    return json.dumps(diagram_payload, indent=2)

DIAGRAM_TOOL_DECLARATION = {
    "name": "generate_flowchart",
    "description": "Create flowcharts, ER diagrams, process flows, or decision trees using Mermaid.js syntax.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "diagram_type": {
                "type": "STRING",
                "description": "Diagram category: 'er' for database ER diagrams, 'flowchart' for process pipelines/workflows, or 'decision_tree' for logic."
            },
            "title": {
                "type": "STRING",
                "description": "Title of the diagram visualization."
            },
            "mermaid_code": {
                "type": "STRING",
                "description": "Valid Mermaid diagram syntax string. Example for ER: 'erDiagram CUSTOMERS ||--o{ ORDERS : places'. Example for flowchart: 'graph TD; A[Customer Order] --> B[Payment Verification] --> C[Inventory Reserve] --> D[Fulfillment]'."
            },
            "explanation": {
                "type": "STRING",
                "description": "Short description explaining the components and workflow depicted in the diagram."
            }
        },
        "required": ["diagram_type", "title", "mermaid_code"]
    }
}

if __name__ == "__main__":
    sample_mermaid = """
    erDiagram
        CUSTOMERS ||--o{ ORDERS : "places"
        ORDERS ||--|{ ORDER_ITEMS : "contains"
        PRODUCTS ||--o{ ORDER_ITEMS : "included in"
    """
    print(generate_flowchart("er", "E-Commerce ER Diagram", sample_mermaid))
