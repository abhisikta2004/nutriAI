# 🥗 NutriAI — Full Python Edition (Phase 3 Execution)

A high-performance **Python Machine Learning & Explainable AI Engine** for nutritional scoring, computer vision meal identification, conversational voice advisory, and healthy food swaps.

---

## 🏛️ System Architecture

```
                                  ┌───────────────────────────┐
                                  │      Client Layer         │
                                  │  (Streamlit UI / React /  │
                                  │       Mobile App)         │
                                  └─────────────┬─────────────┘
                                                │ REST / JSON
                                  ┌─────────────▼─────────────┐
                                  │     FastAPI Server        │
                                  │     (python_app/api.py)   │
                                  └──────┬─────────────┬──────┘
                                         │             │
                    ┌────────────────────┴───┐     ┌───┴─────────────────────┐
                    │ Multimodal Vision / LLM│     │ Explainable AI & ML Core│
                    │   (python_app/llm.py)  │     │   (python_app/model.py) │
                    └────────────────────────┘     └───────────┬─────────────┘
                                                               │
                           ┌───────────────────────────────────┼───────────────────────────────────┐
                           │                                   │                                   │
              ┌────────────▼────────────┐        ┌─────────────▼───────────┐         ┌─────────────▼───────────┐
              │ Nutritional Scoring     │        │ Feature Importance XAI  │         │ Dynamic Swaps Engine    │
              │ (python_app/scoring.py) │        │ (python_app/explain.py) │         │(python_app/alternatives)│
              └─────────────────────────┘        └─────────────────────────┘         └─────────────────────────┘
```

---

## 📦 Core Modules

1. **ML Model & Closed-Form Optimizer** ([`model.py`](file:///Users/tanmaymac/cv_1/nutriAI/python_app/model.py)):
   - Linear Regression model with continuous mathematical scoring:
     $$\text{Score} = \text{Bias} + \sum_{i=1}^{9} (w_i \cdot m_i) \cdot \left(\frac{x_i}{\text{Scale}_i}\right)$$
   - Supports analytical closed-form **Ridge Regression** ($\theta = (X^T X + \lambda I)^{-1} X^T y$) and iterative Gradient Descent.
   - Evaluated on comprehensive benchmark datasets ($R^2 \ge 0.75$, $\text{MAE} < 10$).

2. **Personalized Multiplier Scoring Engine** ([`scoring.py`](file:///Users/tanmaymac/cv_1/nutriAI/python_app/scoring.py)):
   - Body-type multiplier vectors ($m_i$) tailoring scores for **Athletic**, **Muscle Gain**, **Weight Loss**, **Lean**, and **Maintenance**.
   - Bounded continuous health rating scale $[5.0, 98.0]$.

3. **Explainable AI Feature Importance Engine** ([`explain.py`](file:///Users/tanmaymac/cv_1/nutriAI/python_app/explain.py)):
   - Calculates exact mathematical contribution deltas:
     $$\Delta \text{Contribution}_i = (w_i \cdot m_i) \cdot \left(\frac{x_{\text{swap}, i} - x_{\text{base}, i}}{\text{Scale}_i}\right)$$
   - Translates mathematical gradients into human-understandable nutritional insights.

4. **Dynamic Alternative Swaps & Optimal Detector** ([`alternatives.py`](file:///Users/tanmaymac/cv_1/nutriAI/python_app/alternatives.py)):
   - Margin-based recommendation filter requiring $>3.0$ score improvement.
   - Automatically determines `alreadyOptimal` state when no candidate beats the baseline.

5. **3-Layer Allergen Filter** ([`allergens.py`](file:///Users/tanmaymac/cv_1/nutriAI/python_app/allergens.py)):
   - Direct matching, keyword ontology lookup, and food composition mapping.

6. **Portion & Recipe Logger** ([`detailed_log.py`](file:///Users/tanmaymac/cv_1/nutriAI/python_app/detailed_log.py)):
   - Handles piece-based foods (eggs, rotis, dosas, samosas), gram weight scaling, and custom recipe ingredients.

7. **Multimodal Gemini AI & Conversational Voice Advisor** ([`llm.py`](file:///Users/tanmaymac/cv_1/nutriAI/python_app/llm.py)):
   - Multimodal computer vision image parsing.
   - Natural language spoken meal processing.
   - Conversational voice advisor script generation with natural pauses (`...`).
   - Resilient heuristic fallback ensuring zero-downtime during rate limits.

8. **Production FastAPI Backend** ([`api.py`](file:///Users/tanmaymac/cv_1/nutriAI/python_app/api.py)):
   - Endpoints:
     - `GET /health` — Service health check.
     - `GET /model-info` — Inspect model weights, bias, feature scales, and $R^2$ metrics.
     - `POST /predict-score` — Direct health score computation.
     - `POST /train-model` — Trigger model retraining.
     - `POST /compare-foods` — Side-by-side Explainable AI comparison of two food profiles.
     - `POST /analyze-food` — Full pipeline execution (Vision/Voice $\to$ Macros $\to$ Score $\to$ Swaps $\to$ Voice Script).

9. **Interactive Full-Stack Web App** ([`app.py`](file:///Users/tanmaymac/cv_1/nutriAI/python_app/app.py)):
   - Streamlit interface with 5 dedicated workspaces:
     - 📸 **Photo Scanner**: Drag-and-drop meal image analysis.
     - 📷 **Camera Capture**: Live webcam meal scanning.
     - 🎙️ **Voice Advisor**: Hands-free spoken meal logger & conversational response.
     - ⚖️ **Food vs Food XAI**: Real-time side-by-side comparison with mathematical contribution breakdown.
     - 🧪 **Macro Tuning Lab**: Interactive nutritional slider laboratory.

---

## 🚀 Quickstart Guide

### 1. Install Requirements
```bash
pip install -r python_app/requirements.txt
```

### 2. Configure Environment Variables
Create or edit `.env`:
```ini
GEMINI_API_KEY="your-google-gemini-api-key"
PORT=8000
```

### 3. Run the Streamlit Web Application
```bash
streamlit run app.py
```
*Access UI at:* `http://localhost:8501`

### 4. Run the FastAPI REST Server
```bash
python main.py
```
*Access OpenAPI Docs at:* `http://localhost:8000/docs`

### 5. Run the Automated Test Suite
```bash
python3 -m pytest tests/test_backend.py -v
```
