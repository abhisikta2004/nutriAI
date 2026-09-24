import streamlit as st
import base64
import asyncio
from typing import Optional, List

from python_app.models import (
    AnalyzeRequest, 
    UserProfileInput, 
    DetailedLogInput,
    CustomIngredient,
    NutritionInfo,
    IdentifiedFood
)
from python_app.llm import (
    identify_food_with_ai, 
    identify_food_from_voice_query, 
    generate_spoken_explanation
)
from python_app.scoring import calculate_health_score_sync, calculate_basic_health_score, get_goal_transition_multipliers
from python_app.model import (
    get_trained_model, 
    train_health_score_model,
    get_benchmark_training_data, 
    normalize_features, 
    FEATURE_NAMES, 
    FEATURE_SCALES
)
from python_app.alternatives import get_healthier_alternatives
from python_app.allergens import detect_allergens, detect_dietary_conflict
from python_app.detailed_log import process_detailed_log
from python_app.explain import calculate_feature_importance

st.set_page_config(
    page_title="NutriAI — Explainable Food Health Advisor",
    page_icon="🥗",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom High-End Styling
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', sans-serif;
    }
    
    .main-title {
        font-size: 2.75rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.1rem;
    }
    
    .subtitle {
        color: #4b5563;
        font-size: 1.1rem;
        font-weight: 500;
        margin-bottom: 1.5rem;
    }
    
    .score-card {
        padding: 1.75rem;
        border-radius: 1.25rem;
        background: linear-gradient(145deg, #ffffff, #f0fdf4);
        border: 2px solid #86efac;
        box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.1), 0 8px 10px -6px rgba(16, 185, 129, 0.05);
        text-align: center;
        margin-bottom: 1.5rem;
    }
    
    .optimal-badge {
        background: linear-gradient(135deg, #10B981, #059669);
        color: white;
        padding: 0.5rem 1.25rem;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 0.95rem;
        display: inline-block;
        margin-top: 0.75rem;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    
    .swap-card {
        border: 1px solid #e2e8f0;
        border-radius: 1rem;
        padding: 1.5rem;
        margin-bottom: 1.25rem;
        background: #ffffff;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .spoken-bubble {
        background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
        border-left: 4px solid #10b981;
        padding: 1.25rem 1.5rem;
        border-radius: 0.75rem;
        font-style: normal;
        color: #065f46;
        font-size: 1.05rem;
        line-height: 1.6;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.04);
        margin-top: 0.5rem;
    }
    
    .diet-alert-card {
        background: linear-gradient(135deg, #fffbeb 0%, #fef2f2 100%);
        border: 2px solid #f87171;
        border-radius: 1rem;
        padding: 1.25rem 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.08);
    }
    
    .feature-badge-better {
        background-color: #dcfce7;
        color: #15803d;
        font-weight: 600;
        padding: 0.2rem 0.6rem;
        border-radius: 0.4rem;
        display: inline-block;
        margin: 0.2rem 0;
    }
    
    .feature-badge-worse {
        background-color: #fee2e2;
        color: #b91c1c;
        font-weight: 600;
        padding: 0.2rem 0.6rem;
        border-radius: 0.4rem;
        display: inline-block;
        margin: 0.2rem 0;
    }
</style>
""", unsafe_allow_html=True)

# Sidebar: User Profile & Personalization
st.sidebar.markdown("### 🎯 Body Goals & Personalization")

current_body = st.sidebar.selectbox(
    "Current Body Type",
    options=["thin", "average", "athletic", "overweight", "obese"],
    index=1,
    format_func=lambda x: {
        "thin": "🧍 Thin / Underweight",
        "average": "🧍 Average / Standard",
        "athletic": "🏋️ Athletic / Lean",
        "overweight": "🧍 Overweight",
        "obese": "🧍 Obese / High Fat"
    }[x]
)

target_goal = st.sidebar.selectbox(
    "Target Body Goal",
    options=["athletic", "muscle_gain", "weight_loss", "thin", "average", "overweight", "obese"],
    format_func=lambda x: {
        "athletic": "⚡ Athletic (High Protein & Vitality)",
        "muscle_gain": "💪 Muscle Gain / Hypertrophy",
        "weight_loss": "🔥 Weight Loss (Caloric Deficit)",
        "thin": "🏃 Lean / Toned Definition",
        "average": "⚖️ Maintenance / Balanced",
        "overweight": "📈 Gaining Mass (Bulk)",
        "obese": "🚀 Heavy Mass Gaining (Calorie Surplus)"
    }[x]
)

diet_pref = st.sidebar.selectbox(
    "Dietary Preference",
    options=["non-veg", "vegetarian", "vegan"],
    format_func=lambda x: {"non-veg": "🍗 Non-Vegetarian", "vegetarian": "🥦 Vegetarian", "vegan": "🌱 100% Vegan"}[x]
)

allergies_selected = st.sidebar.multiselect(
    "Known Allergies & Exclusions",
    options=["dairy", "milk", "lactose", "eggs", "peanuts", "nuts", "tree nuts", "wheat", "gluten", "soy", "fish", "shellfish"],
    default=[]
)

# Sidebar: Dynamic Goal Multipliers Inspector
with st.sidebar.expander("🧠 Active Goal Multipliers & Model Weights", expanded=False):
    model = get_trained_model()
    multipliers = get_goal_transition_multipliers(target_goal, current_body)
    st.markdown(f"**Transition:** `{current_body}` ➔ `{target_goal}`")
    st.markdown(f"**Base Intercept (Bias):** `{model.bias:.2f}`")
    for name, scale, w, m in zip(FEATURE_NAMES, FEATURE_SCALES, model.weights, multipliers):
        eff = w * m
        color = "green" if eff > 0 else "red"
        st.markdown(f"- **{name}**: `:{color}[eff: {eff:+.2f}]` *(base {w:+.2f} × {m:.1f}x)*")

# Header Section
st.markdown("<h1 class='main-title'>🥗 NutriAI</h1>", unsafe_allow_html=True)
st.markdown("<div class='subtitle'>Explainable AI Nutrition Advisor, Vision Scanner & Goal-Tailored Food Swaps</div>", unsafe_allow_html=True)

# Main Navigation Tabs
tab_photo, tab_camera, tab_voice, tab_compare, tab_manual = st.tabs([
    "📸 Photo Scanner", 
    "📷 Camera Capture", 
    "🎙️ Voice Advisor", 
    "⚖️ Food vs Food XAI", 
    "🧪 Macro Tuning Lab"
])

analysis_result = None

# Analysis helper
async def run_food_analysis_pipeline(identified_food_obj):
    baseline_score = calculate_health_score_sync(identified_food_obj.nutrition, target_goal, current_body)
    raw_alts = await get_healthier_alternatives(
        {"identifiedFood": identified_food_obj.name, "nutritionInfo": identified_food_obj.nutrition},
        baseline_score,
        target_goal,
        current_body
    )
    filtered = []
    for alt in raw_alts:
        nm = alt.name.lower()
        if diet_pref == 'vegan' and any(x in nm for x in ['chicken', 'meat', 'fish', 'egg', 'milk', 'dairy', 'cheese', 'butter', 'honey', 'mutton', 'beef', 'pork']):
            continue
        if diet_pref == 'vegetarian' and any(x in nm for x in ['chicken', 'meat', 'fish', 'mutton', 'beef', 'pork', 'prawn', 'shrimp', 'crab', 'egg']):
            continue
        if any(a in nm for a in allergies_selected):
            continue
        filtered.append(alt)
        
    best = filtered[0] if filtered else None
    spoken = generate_spoken_explanation(identified_food_obj.name, int(round(baseline_score)), target_goal, best, len(filtered) == 0)
    allergens = detect_allergens(identified_food_obj.name, allergies_selected)
    dietary_conflict = detect_dietary_conflict(identified_food_obj.name, diet_pref)
    
    return {
        "identified": identified_food_obj,
        "baseline_score": int(round(baseline_score)),
        "alternatives": filtered,
        "already_optimal": len(filtered) == 0,
        "best_choice": best,
        "spoken": spoken,
        "allergens": allergens,
        "dietary_conflict": dietary_conflict
    }

with tab_photo:
    st.subheader("Upload Meal Photo")
    uploaded_file = st.file_uploader("Upload an image of your meal or packaged food", type=["jpg", "jpeg", "png", "webp"], key="file_scanner")
    
    if uploaded_file is not None:
        col_img, col_btn = st.columns([1, 2])
        with col_img:
            st.image(uploaded_file, caption="Selected Food Photo", use_container_width=True)
            
        with col_btn:
            st.markdown("#### Ready to Scan")
            st.markdown(f"Scoring calibrated for your goal: **{current_body.title()} ➔ {target_goal.replace('_', ' ').title()}** with **{diet_pref.title()}** preference.")
            if st.button("🔍 Analyze Meal with AI", type="primary", use_container_width=True, key="btn_photo"):
                with st.spinner("Analyzing food with multimodal AI vision..."):
                    bytes_data = uploaded_file.getvalue()
                    base64_img = f"data:image/jpeg;base64,{base64.b64encode(bytes_data).decode('utf-8')}"
                    
                    try:
                        identified = asyncio.run(identify_food_with_ai(base64_img))
                        analysis_result = asyncio.run(run_food_analysis_pipeline(identified))
                    except Exception as e:
                        st.error(f"Analysis Error: {e}")

with tab_camera:
    st.subheader("Snap Food Photo with Camera")
    cam_file = st.camera_input("Take a photo of your dish")
    if cam_file is not None:
        if st.button("🔍 Analyze Camera Capture", type="primary", use_container_width=True, key="btn_camera"):
            with st.spinner("NutriAI is analyzing camera snapshot..."):
                bytes_data = cam_file.getvalue()
                base64_img = f"data:image/jpeg;base64,{base64.b64encode(bytes_data).decode('utf-8')}"
                try:
                    identified = asyncio.run(identify_food_with_ai(base64_img))
                    analysis_result = asyncio.run(run_food_analysis_pipeline(identified))
                except Exception as e:
                    st.error(f"Camera Analysis Error: {e}")

with tab_voice:
    st.subheader("Conversational Voice Input")
    st.markdown("Speak or describe your meal in natural conversational language:")
    
    col_ex1, col_ex2, col_ex3 = st.columns(3)
    preset_query = None
    if col_ex1.button("🥣 Greek Yogurt with Berries"):
        preset_query = "Greek yogurt with fresh strawberries, blueberries, chia seeds and a drizzle of honey"
    if col_ex2.button("🍗 Grilled Chicken & Veggies"):
        preset_query = "Grilled chicken breast with steamed broccoli and brown rice"
    if col_ex3.button("🍕 Loaded Cheesy Pizza"):
        preset_query = "Two slices of double cheese pepperoni pizza with garlic bread"

    voice_input = st.text_input("Spoken Meal Description:", value=preset_query or "", placeholder="e.g. A bowl of oats porridge with sliced banana and chia seeds")
    
    if st.button("🎙️ Process Voice Description", type="primary", key="btn_voice"):
        if not voice_input.strip():
            st.warning("Please enter a food description.")
        else:
            with st.spinner("Processing natural language food input..."):
                try:
                    identified = asyncio.run(identify_food_from_voice_query(voice_input.strip()))
                    analysis_result = asyncio.run(run_food_analysis_pipeline(identified))
                except Exception as e:
                    st.error(f"Voice Analysis Error: {e}")

with tab_compare:
    st.subheader("Side-by-Side Explainable AI Food Comparator")
    st.markdown("Compare any two food profiles side-by-side to understand how calories, carbs, and fats contribute under your goal.")
    
    col_a, col_b = st.columns(2)
    with col_a:
        st.markdown("### 🍎 Food A (Baseline)")
        name_a = st.text_input("Food A Name", value="Regular Potato Chips", key="name_a")
        cal_a = st.number_input("Calories (kcal)", value=536.0, step=10.0, key="cal_a")
        prot_a = st.number_input("Protein (g)", value=7.0, step=0.5, key="prot_a")
        carbs_a = st.number_input("Carbs (g)", value=53.0, step=1.0, key="carbs_a")
        fat_a = st.number_input("Fat (g)", value=34.0, step=1.0, key="fat_a")
        satfat_a = st.number_input("Sat Fat (g)", value=11.0, step=0.5, key="satfat_a")
        sugar_a = st.number_input("Sugar (g)", value=0.5, step=0.5, key="sugar_a")
        fiber_a = st.number_input("Fiber (g)", value=4.0, step=0.5, key="fiber_a")
        sod_a = st.number_input("Sodium (mg)", value=550.0, step=25.0, key="sod_a")
        proc_a = st.slider("Processing Level", 0.1, 1.0, 0.8, step=0.1, key="proc_a")

    with col_b:
        st.markdown("### 🥑 Food B (Candidate Swap)")
        name_b = st.text_input("Food B Name", value="Roasted Fox Nuts (Makhana)", key="name_b")
        cal_b = st.number_input("Calories (kcal)", value=120.0, step=10.0, key="cal_b")
        prot_b = st.number_input("Protein (g)", value=3.5, step=0.5, key="prot_b")
        carbs_b = st.number_input("Carbs (g)", value=22.0, step=1.0, key="carbs_b")
        fat_b = st.number_input("Fat (g)", value=2.0, step=1.0, key="fat_b")
        satfat_b = st.number_input("Sat Fat (g)", value=0.2, step=0.5, key="satfat_b")
        sugar_b = st.number_input("Sugar (g)", value=0.5, step=0.5, key="sugar_b")
        fiber_b = st.number_input("Fiber (g)", value=4.5, step=0.5, key="fiber_b")
        sod_b = st.number_input("Sodium (mg)", value=80.0, step=25.0, key="sod_b")
        proc_b = st.slider("Processing Level", 0.1, 1.0, 0.2, step=0.1, key="proc_b")

    if st.button("⚖️ Run Explainable AI Comparison", type="primary", use_container_width=True):
        nut_a = NutritionInfo(calories=cal_a, protein=prot_a, carbs=carbs_a, fat=fat_a, saturatedFat=satfat_a, sugar=sugar_a, fiber=fiber_a, sodium=sod_a, processingLevel=proc_a)
        nut_b = NutritionInfo(calories=cal_b, protein=prot_b, carbs=carbs_b, fat=fat_b, saturatedFat=satfat_b, sugar=sugar_b, fiber=fiber_b, sodium=sod_b, processingLevel=proc_b)
        
        score_a_val = calculate_health_score_sync(nut_a, target_goal, current_body)
        score_b_val = calculate_health_score_sync(nut_b, target_goal, current_body)
        
        reasons = calculate_feature_importance(nut_a, nut_b, get_trained_model(), target_goal, current_body)
        
        st.divider()
        col_res_a, col_res_b = st.columns(2)
        with col_res_a:
            st.metric(f"{name_a} Score", f"{int(round(score_a_val))}/100")
        with col_res_b:
            diff = int(round(score_b_val)) - int(round(score_a_val))
            st.metric(f"{name_b} Score", f"{int(round(score_b_val))}/100", delta=f"{diff:+d} pts")
            
        st.markdown(f"#### 🔬 Mathematical Feature Contributions ({current_body.title()} ➔ {target_goal.title()}):")
        for r in reasons:
            badge_class = "feature-badge-better" if r.status == "better" else "feature-badge-worse" if r.status == "worse" else ""
            icon = "🟢" if r.status == "better" else "🔴" if r.status == "worse" else "⚪"
            st.markdown(f"- {icon} **{r.factor}**: <span class='{badge_class}'>{r.actualChange}</span> — *{r.explanation}*", unsafe_allow_html=True)

with tab_manual:
    st.subheader("Direct Parameter Playground")
    st.markdown("Directly adjust macronutrient quantities to observe immediate scoring reaction under your body goal:")
    
    col_m1, col_m2, col_m3 = st.columns(3)
    with col_m1:
        m_name = st.text_input("Dish Name", value="Custom Nutrient Profile", key="lab_name")
        m_cal = st.number_input("Calories (kcal)", value=350.0, step=10.0, key="lab_cal")
        m_prot = st.number_input("Protein (g)", value=20.0, step=1.0, key="lab_prot")
    with col_m2:
        m_carbs = st.number_input("Carbohydrates (g)", value=40.0, step=2.0, key="lab_carbs")
        m_fat = st.number_input("Total Fat (g)", value=12.0, step=1.0, key="lab_fat")
        m_satfat = st.number_input("Saturated Fat (g)", value=3.0, step=0.5, key="lab_satfat")
    with col_m3:
        m_sugar = st.number_input("Sugar (g)", value=4.0, step=1.0, key="lab_sugar")
        m_fiber = st.number_input("Fiber (g)", value=6.0, step=1.0, key="lab_fiber")
        m_sodium = st.number_input("Sodium (mg)", value=350.0, step=50.0, key="lab_sod")
        m_proc = st.slider("Processing Level (0.1 Fresh - 1.0 Ultra-processed)", 0.1, 1.0, 0.3, step=0.1, key="lab_proc")

    if st.button("📊 Evaluate Health Score", type="primary", key="btn_macro"):
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
        analysis_result = asyncio.run(run_food_analysis_pipeline(custom_identified))

# Render Results
if analysis_result:
    st.divider()
    res = analysis_result
    identified = res["identified"]
    n = identified.nutrition
    score = res["baseline_score"]
    
    st.markdown(f"## 🍽️ Analysis: **{identified.name}**")
    
    # Dietary Conflict Alert
    if res["dietary_conflict"]:
        st.markdown(f"""
        <div class="diet-alert-card">
            <h4 style="margin: 0; color: #dc2626; font-size: 1.15rem;">⚠️ Dietary Preference Alert!</h4>
            <p style="margin: 0.5rem 0 0 0; color: #7f1d1d; font-weight: 600;">{res["dietary_conflict"]}</p>
            <p style="margin: 0.25rem 0 0 0; color: #991b1b; font-size: 0.85rem;">Your profile preference is <strong>{diet_pref.upper()}</strong>. Healthier vegetarian/vegan swaps are suggested below.</p>
        </div>
        """, unsafe_allow_html=True)
    
    if res["allergens"]:
        st.warning(f"⚠️ **Allergen Alert Detected:** Contains **{', '.join(res['allergens'])}**")

    # Health Score & Optimal Banner
    col_score, col_spoken = st.columns([1, 2])
    with col_score:
        score_color = "#10b981" if score >= 75 else "#f59e0b" if score >= 50 else "#ef4444"
        st.markdown(f"""
        <div class="score-card" style="border-color: {score_color}">
            <h4 style="margin: 0; color: #4b5563; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.05em;">NutriAI Health Score</h4>
            <div style="font-size: 3.75rem; font-weight: 900; color: {score_color}; line-height: 1.1;">{score}<span style="font-size: 1.5rem; color: #9ca3af; font-weight: 500;">/100</span></div>
            {"<div class='optimal-badge'>✨ Optimal Choice! No Swaps Needed</div>" if res['already_optimal'] else f"<div style='color: #4b5563; font-weight: 600; margin-top: 0.5rem;'>{len(res['alternatives'])} Healthier Alternative{'s' if len(res['alternatives']) > 1 else ''} Found</div>"}
        </div>
        """, unsafe_allow_html=True)

    with col_spoken:
        st.markdown("#### 🗣️ NutriAI Spoken Advisor Script")
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
                        <h4 style="margin: 0; font-size: 1.3rem; color: #1f2937;">{i+1}. {alt.name}</h4>
                        <span style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 0.35rem 0.9rem; border-radius: 9999px; font-weight: 700;">
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
