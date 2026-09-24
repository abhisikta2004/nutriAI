# 🥗 NutriAI — Full Python Edition

This is the pure Python conversion of **NutriAI** (Explainable AI Food Health Advisor & Swaps Engine).

---

## 📦 What Was Converted:

1. **ML Model & Gradient Descent Training** (`model.py`):
   - Linear Regression model with MSE loss gradient descent.
   - In-memory benchmark training on nutritional datasets.
2. **Nutritional Scoring Engine & Multipliers** (`scoring.py`):
   - Target body type multipliers (Athletic, Muscle Gain, Weight Loss, Lean, Maintenance).
3. **Explainable AI & Feature Importance** (`explain.py`):
   - Exact mathematical contribution delta $w_i \cdot (x_{cand,i} - x_{base,i})$ with status flags (better/worse/same).
4. **Gemini Multimodal AI & Voice Processing** (`llm.py`):
   - Vision-based image recognition.
   - Natural language spoken meal processing.
   - Conversational voice advisor script generation.
   - Resilient heuristic nutritional fallback for rate-limit protection.
5. **Smart Alternative Swaps & Margin Filter** (`alternatives.py`):
   - Only recommends alternatives that improve on baseline by $>3$ points.
   - Strict derivation of `already_optimal` when no candidate beats baseline.
6. **Allergen Detection** (`allergens.py`):
   - 3-layer matching (direct, keyword categories, and food composition map).
7. **Detailed Portion Logger** (`detailed_log.py`):
   - Piece-based foods, custom ingredients, and unit multipliers.
8. **FastAPI Backend Server** (`api.py` / `main.py`):
   - Full REST API with CORS for web & mobile clients.
9. **Interactive Full-Stack Web App** (`app.py`):
   - Streamlit interface with photo scanner, voice advisor, macro breakdown cards, and visual swaps.

---

## 🚀 How to Run:

### 1. Install Dependencies
```bash
pip install -r python_app/requirements.txt
```

### 2. Set Environment Variables (`.env`)
```bash
GEMINI_API_KEY="your-google-gemini-api-key"
```

### 3. Run Interactive UI App (Streamlit)
```bash
streamlit run app.py
```
Open **`http://localhost:8501`** in your browser.

### 4. Run REST API Server (FastAPI)
```bash
python main.py
```
API Documentation will be available at **`http://localhost:8000/docs`**.
