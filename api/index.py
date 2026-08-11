import sys
import os

# Add backend directory to sys.path for Vercel serverless environment
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from main import app
