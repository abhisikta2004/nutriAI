import streamlit as st
import base64
import asyncio
from typing import Optional

from python_app.models import (
    AnalyzeRequest, 
    UserProfileInput, 
    DetailedLogInput,
    CustomIngredient,
    NutritionInfo
)
from python_app.llm import (
    identify_food_with_ai, 
    identify_food_from_voice_query, 
    generate_spoken_explanation
)
from python_app.scoring import calculate_health_score, calculate_basic_health_score
from python_app.model import ensure_model_trained, get_benchmark_training_data, normalize_features, FEATURE_NAMES, FEATURE_SCALES
from python_app.alternatives import get_healthier_alternatives
from python_app.allergens import detect_allergens
from python_app.detailed_log import process_detailed_log

st.set_page_config(
    page_title="NutriAI — Explainable Food Health Advisor",
    page_icon="🥗",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown("""
<style>
    .main-title {
        font-size: 2.5rem;
        font-weight: 800;
        background: linear-gradient(135deg, #10B981, #059669);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.2rem;
    }
    .score-card {
        padding: 1.5rem;
        border-radius: 1rem;
        background: linear-gradient(135deg, #f0fdf4, #dcfce7);
        border: 2px solid #86efac;
        text-align: center;
        margin-bottom: 1.5rem;
    }
    .optimal-badge {
        background-color: #10B981;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 2rem;
        font-weight: 700;
        display: inline-block;
        margin-top: 0.5rem;
    }
    .macro-box {
        background: #ffffff;
        padding: 1rem;
        border-radius: 0.75rem;
        border: 1px solid #e5e7eb;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .swap-card {
        border: 2px solid #e5e7eb;
        border-radius: 1rem;
        padding: 1.25rem;
        margin-bottom: 1rem;
        background: #fafafa;
    }
    .spoken-bubble {
        background: linear-gradient(135deg, #ecfdf5, #f0fdf4);
        border-left: 4px solid #10b981;
        padding: 1rem;
        border-radius: 0.5rem;
        font-style: italic;
        margin-top: 1rem;
    }
</style>
""", unsafe_allow_html=True)

# Sidebar: User Profile & Goals
st.sidebar.header("🎯 Your Health Profile")
target_goal = st.sidebar.selectbox(
    "Target Fitness Goal",
    options=["athletic", "muscle_gain", "weight_loss", "thin", "average"],
    format_func=lambda x: {
        "athletic": "⚡ Athletic (High Protein & Vitality)",
        "muscle_gain": "💪 Muscle Gain (Hypertrophy)",
        "weight_loss": "🔥 Weight Loss (Calorie Deficit)",
        "thin": "🏃 Lean / Toned Definition",
        "average": "⚖️ Maintenance / Balanced"
    }[x]
)

diet_pref = st.sidebar.selectbox(
    "Dietary Preference",
    options=["non-veg", "vegetarian", "vegan"],
    format_func=lambda x: {"non-veg": "🍗 Non-Vegetarian", "vegetarian": "🥦 Vegetarian", "vegan": "🌱 100% Vegan"}[x]
)

allergies_selected = st.sidebar.multiselect(
    "Known Allergies",
    options=["dairy", "milk", "lactose", "eggs", "peanuts", "nuts", "tree nuts", "wheat", "gluten", "soy", "fish", "shellfish"],
    default=[]
)

# Sidebar: ML Model Stats
with st.sidebar.expander("🧠 ML Model Parameters & Weights"):
    model = asyncio.run(ensure_model_trained())
    st.write(f"**Baseline Bias:** `{model.bias:.2f}`")
    for name, scale, w in zip(FEATURE_NAMES, FEATURE_SCALES, model.weights):
        st.write(f"- **{name}**: `{w:+.2f}` *(Scale {scale:.0f})*")

# Header Section
st.markdown("<h1 class='main-title'>🥗 NutriAI</h1>", unsafe_allow_html=True)
st.markdown("**Explainable AI Nutrition Analysis & Healthier Food Swaps** *(Pure Python Machine Learning Engine)*")

# Mode Tabs
tab_photo, tab_camera, tab_voice, tab_manual = st.tabs(["📸 Photo Scanner", "📷 Camera Capture", "🎙️ Voice Advisor", "🧪 Direct Macro Analyzer"])

analysis_result = None

# Reusable pipeline
async def run_food_analysis(identified_food_obj):
    baseline_score = await calculate_health_score(identified_food_obj.nutrition, target_goal)
    raw_alts = await get_healthier_alternatives(
        {"identifiedFood": identified_food_obj.name, "nutritionInfo": identified_food_obj.nutrition},
        baseline_score,
        target_goal
    )
    filtered = []
    for alt in raw_alts:
        nm = alt.name.lower()
        if diet_pref == 'vegan' and any(x in nm for x in ['chicken', 'meat', 'fish', 'egg', 'milk', 'dairy', 'cheese', 'butter', 'honey']):
            continue
        if diet_pref == 'vegetarian' and any(x in nm for x in ['chicken', 'meat', 'fish', 'mutton', 'beef', 'pork', 'prawn', 'shrimp']):
            continue
        if any(a in nm for a in allergies_selected):
            continue
        filtered.append(alt)
        
    best = filtered[0] if filtered else None
    spoken = generate_spoken_explanation(identified_food_obj.name, int(round(baseline_score)), target_goal, best, len(filtered) == 0)
    allergens = detect_allergens(identified_food_obj.name, allergies_selected)
    
    return {
        "identified": identified_food_obj,
        "baseline_score": int(round(baseline_score)),
        "alternatives": filtered,
        "already_optimal": len(filtered) == 0,
        "best_choice": best,
        "spoken": spoken,
        "allergens": allergens
    }

with tab_photo:
    st.subheader("Scan Your Meal Photo")
    uploaded_file = st.file_uploader("Upload a photo of your meal or snack", type=["jpg", "jpeg", "png", "webp"], key="file_scanner")
    
    if uploaded_file is not None:
        col_img, col_btn = st.columns([1, 2])
        with col_img:
            st.image(uploaded_file, caption="Meal Preview", use_container_width=True)
            
        with col_btn:
            if st.button("🔍 Analyze Meal with AI", type="primary", use_container_width=True, key="btn_photo"):
                with st.spinner("Analyzing nutrients and calculating health score..."):
                    bytes_data = uploaded_file.getvalue()
                    base64_img = f"data:image/jpeg;base64,{base64.b64encode(bytes_data).decode('utf-8')}"
                    
                    try:
                        identified = asyncio.run(identify_food_with_ai(base64_img))
                        analysis_result = asyncio.run(run_food_analysis(identified))
                    except Exception as e:
                        st.error(f"Analysis error: {e}")

with tab_camera:
    st.subheader("Snap a Photo with Your Camera")
    cam_file = st.camera_input("Take a photo of your dish")
    if cam_file is not None:
        if st.button("🔍 Analyze Camera Capture", type="primary", use_container_width=True, key="btn_camera"):
            with st.spinner("NutriAI is analyzing your camera capture..."):
                bytes_data = cam_file.getvalue()
                base64_img = f"data:image/jpeg;base64,{base64.b64encode(bytes_data).decode('utf-8')}"
                try:
                    identified = asyncio.run(identify_food_with_ai(base64_img))
                    analysis_result = asyncio.run(run_food_analysis(identified))
                except Exception as e:
                    st.error(f"Camera analysis error: {e}")

with tab_voice:
    st.subheader("Spoken Meal Input & Conversational Advisor")
    st.markdown("Speak or describe what you are eating in natural language:")
    
    col_ex1, col_ex2, col_ex3 = st.columns(3)
    preset_query = None
    if col_ex1.button("🥣 Greek yogurt with berries"):
        preset_query = "Greek yogurt with fresh strawberries, blueberries and honey"
    if col_ex2.button("🍗 Grilled chicken & rice"):
        preset_query = "Grilled chicken breast with steamed broccoli and brown rice"
    if col_ex3.button("🍕 Cheesy slice of pizza"):
        preset_query = "Two slices of double cheese loaded pizza with pepperoni"

    voice_input = st.text_input("Describe your meal:", value=preset_query or "", placeholder="e.g. A bowl of oats porridge with sliced banana and chia seeds")
    
    if st.button("🎙️ Process Voice Description", type="primary", key="btn_voice"):
        if not voice_input.strip():
            st.warning("Please enter or say what food you are having.")
        else:
            with st.spinner("NutriAI is thinking and analyzing nutrition..."):
                try:
                    identified = asyncio.run(identify_food_from_voice_query(voice_input.strip()))
                    analysis_result = asyncio.run(run_food_analysis(identified))
                except Exception as e:
                    st.error(f"Voice analysis error: {e}")

with tab_manual:
    st.subheader("Direct Nutritional Parameter Testing")
    st.markdown("Directly adjust macronutrient parameters to observe model score calculation:")
    
    col_m1, col_m2, col_m3 = st.columns(3)
    with col_m1:
        m_name = st.text_input("Dish Name", value="Custom Nutrient Profile")
        m_cal = st.number_input("Calories (kcal)", value=250.0, step=10.0)
        m_prot = st.number_input("Protein (g)", value=15.0, step=1.0)
    with col_m2:
        m_carbs = st.number_input("Carbohydrates (g)", value=30.0, step=2.0)
        m_fat = st.number_input("Total Fat (g)", value=8.0, step=1.0)
        m_satfat = st.number_input("Saturated Fat (g)", value=2.0, step=0.5)
    with col_m3:
        m_sugar = st.number_input("Sugar (g)", value=4.0, step=1.0)
        m_fiber = st.number_input("Fiber (g)", value=5.0, step=1.0)
        m_sodium = st.number_input("Sodium (mg)", value=350.0, step=50.0)
        m_proc = st.slider("Processing Level (0.1 Fresh - 1.0 Ultra-processed)", 0.1, 1.0, 0.3, step=0.1)

    if st.button("📊 Evaluate Macro Score", type="primary", key="btn_macro"):
        from python_app.models import IdentifiedFood
        nut = NutritionInfo(
            calories=m_cal,
            protein=m_prot,
            carbs=m_carbs,
            fat=m_fat,
            saturatedFat=m_satfat,
            sugar=m_sugar,
            fiber=m_fiber,
            sodium=m_sodium,
            processingLevel=m_proc
        )
        custom_identified = IdentifiedFood(name=m_name, confidence=1.0, nutrition=nut)
        analysis_result = asyncio.run(run_food_analysis(custom_identified))

# Render Results
if analysis_result:
    st.divider()
    res = analysis_result
    identified = res["identified"]
    n = identified.nutrition
    score = res["baseline_score"]
    
    st.markdown(f"## 🍽️ Analysis: **{identified.name}**")
    
    if res["allergens"]:
        st.warning(f"⚠️ **Allergen Alert Detected:** Contains {', '.join(res['allergens'])}")

    # Health Score & Optimal Banner
    col_score, col_spoken = st.columns([1, 2])
    with col_score:
        score_color = "#10b981" if score >= 75 else "#f59e0b" if score >= 50 else "#ef4444"
        st.markdown(f"""
        <div class="score-card" style="border-color: {score_color}">
            <h4 style="margin: 0; color: #4b5563;">Health Score</h4>
            <div style="font-size: 3.5rem; font-weight: 900; color: {score_color};">{score}<span style="font-size: 1.5rem; color: #9ca3af;">/100</span></div>
            {"<div class='optimal-badge'>✨ Optimal Choice! No Swaps Needed</div>" if res['already_optimal'] else f"<div style='color: #4b5563; font-weight: 600;'>{len(res['alternatives'])} Healthier Alternative{'s' if len(res['alternatives']) > 1 else ''} Found</div>"}
        </div>
        """, unsafe_allow_html=True)

    with col_spoken:
        st.markdown("#### 🗣️ NutriAI Spoken Advice")
        st.markdown(f"<div class='spoken-bubble'>\"{res['spoken']}\"</div>", unsafe_allow_html=True)

    # Macro Breakdown Grid
    st.markdown("### 📊 Nutritional Breakdown (per 100g)")
    c1, c2, c3, c4, c5, c6, c7, c8 = st.columns(8)
    c1.metric("Calories", f"{int(round(n.calories))} kcal")
    c2.metric("Protein", f"{round(n.protein, 1)}g")
    c3.metric("Carbs", f"{round(n.carbs, 1)}g")
    c4.metric("Fat", f"{round(n.fat, 1)}g")
    c5.metric("Sat Fat", f"{round(n.saturatedFat or 0.0, 1)}g")
    c6.metric("Sugar", f"{round(n.sugar or 0.0, 1)}g")
    c7.metric("Fiber", f"{round(n.fiber or 0.0, 1)}g")
    c8.metric("Sodium", f"{int(round(n.sodium or 0.0))}mg")

    # Healthier Alternatives
    st.markdown("---")
    if res["already_optimal"]:
        st.success("🎉 **Great meal!** This food already has a clean nutritional profile aligned with your goal.")
    else:
        st.markdown(f"### 💡 Recommended Healthier Alternatives (Beat Baseline by >3 pts)")
        for i, alt in enumerate(res["alternatives"]):
            diff = alt.healthScore - score
            with st.container():
                st.markdown(f"""
                <div class="swap-card">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="margin: 0; font-size: 1.3rem;">{i+1}. {alt.name}</h4>
                        <span style="background: #10b981; color: white; padding: 0.3rem 0.8rem; border-radius: 1rem; font-weight: bold;">
                            Score: {alt.healthScore}/100 (+{diff} pts)
                        </span>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
                # Reasons
                col_r1, col_r2 = st.columns([1, 1])
                with col_r1:
                    st.markdown("**Key Nutritional Benefits:**")
                    for benefit in alt.benefits:
                        st.markdown(f"- ✅ {benefit}")
                with col_r2:
                    st.markdown("**Explainable AI Feature Contributions:**")
                    for r in alt.reasons[:3]:
                        icon = "🟢" if r.status == "better" else "🔴" if r.status == "worse" else "⚪"
                        st.markdown(f"- {icon} **{r.factor}**: {r.actualChange} *({r.explanation})*")
