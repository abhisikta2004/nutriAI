import os
import uvicorn
from dotenv import load_dotenv

load_dotenv()

from python_app.api import app

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"🚀 Starting NutriAI Python FastAPI backend on http://localhost:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
