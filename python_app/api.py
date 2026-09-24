import os
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional, List

from .models import (
    AnalyzeRequest, 
    AnalyzeResponse, 
    NutritionResponse, 
    NutritionInfo,
    CompareFoodsRequest,
    CompareFoodsResponse
)
from .llm import (
    identify_food_with_ai, 
    identify_food_from_voice_query, 
    generate_spoken_explanation
)
from .scoring import calculate_health_score, calculate_health_score_sync
from .model import (
    get_trained_model,
    ensure_model_trained, 
    train_health_score_model, 
    get_benchmark_training_data, 
    normalize_features
)
from .alternatives import get_healthier_alternatives
from .allergens import detect_allergens, detect_dietary_conflict
from .detailed_log import process_detailed_log
from .explain import calculate_feature_importance

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-train / warmup the ML model on startup
    get_trained_model()
    yield

app = FastAPI(
    title="NutriAI Food Health Advisor API",
    description="Explainable AI Food Health Analysis, Macro Estimation & Conversational Voice Advisor in Python",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend integrations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "NutriAI-Python-Engine"}

@app.get("/model-info")
def get_model_info():
    """Retrieve current ML model parameters, weights, and evaluation metrics."""
    model = get_trained_model()
    dataset = get_benchmark_training_data()
    features, labels = normalize_features(dataset)
    metrics = model.evaluate(features, labels)
    return {
        "status": "trained",
        "model": model.to_dict(),
        "evaluation": metrics,
        "sampleCount": len(dataset)
    }

@app.post("/predict-score")
def predict_health_score(
    nutrition: NutritionInfo, 
    target_body_type: Optional[str] = "athletic",
    current_body_type: Optional[str] = "average"
):
    """Directly calculate explainable health score for given nutritional parameters and body goal transition."""
    score = calculate_health_score_sync(nutrition, target_body_type or "athletic", current_body_type or "average")
    return {
        "healthScore": score,
        "targetBodyType": target_body_type,
        "currentBodyType": current_body_type,
        "nutrition": nutrition
    }

@app.post("/train-model")
def train_model_endpoint(use_closed_form: bool = True):
    """Re-train the Linear Regression model on benchmark and curated datasets."""
    model = train_health_score_model(use_closed_form=use_closed_form)
    dataset = get_benchmark_training_data()
    features, labels = normalize_features(dataset)
    metrics = model.evaluate(features, labels)
    return {
        "status": "success",
        "message": "Model successfully retrained",
        "metrics": metrics
    }

@app.post("/compare-foods", response_model=CompareFoodsResponse)
def compare_foods_endpoint(request: CompareFoodsRequest):
    """Side-by-side Explainable AI comparison between two food profiles with exact feature deltas."""
    target_goal = request.targetBodyType or "athletic"
    current_body = request.currentBodyType or "average"
    model = get_trained_model()

    score_a = calculate_health_score_sync(request.foodA_nutrition, target_goal, current_body)
    score_b = calculate_health_score_sync(request.foodB_nutrition, target_goal, current_body)

    int_score_a = int(round(score_a))
    int_score_b = int(round(score_b))

    reasons = calculate_feature_importance(
        baseline=request.foodA_nutrition,
        alternative=request.foodB_nutrition,
        model=model,
        target_body_type=target_goal,
        current_body_type=current_body
    )

    winner = request.foodB_name if int_score_b > int_score_a else (request.foodA_name if int_score_a > int_score_b else "Tie")

    return CompareFoodsResponse(
        foodA_name=request.foodA_name,
        foodA_score=int_score_a,
        foodB_name=request.foodB_name,
        foodB_score=int_score_b,
        scoreDifference=abs(int_score_b - int_score_a),
        winner=winner,
        reasons=reasons,
        targetBodyType=target_goal
    )

@app.post("/analyze-food", response_model=AnalyzeResponse)
async def analyze_food(request: AnalyzeRequest):
    voice_query = request.voiceQuery
    if not request.image and not voice_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a food photo or spoken food description."
        )

    user_profile = request.userProfile
    diet_preference = user_profile.dietPreference if user_profile and user_profile.dietPreference else "non-veg"
    allergies = user_profile.allergies if user_profile and user_profile.allergies else []
    target_body_type = user_profile.targetBodyType if user_profile and user_profile.targetBodyType else "athletic"
    current_body_type = user_profile.currentBodyType if user_profile and user_profile.currentBodyType else "average"

    try:
        # 1. Identification (Vision or Voice)
        if voice_query and voice_query.strip():
            identified = await identify_food_from_voice_query(voice_query.strip())
        elif request.image:
            identified = await identify_food_with_ai(request.image)
        else:
            raise ValueError("No valid food image or voice query provided")

        # Fast-path for identify-only mode
        if request.identifyOnly:
            n = identified.nutrition
            return AnalyzeResponse(
                identifiedFood=identified.name,
                confidence=identified.confidence,
                nutritionInfo=NutritionResponse(
                    calories=int(round(n.calories)),
                    protein=round(n.protein, 1),
                    carbs=round(n.carbs, 1),
                    fats=round(n.fat, 1),
                    saturatedFat=round(n.saturatedFat or 0.0, 1),
                    sugar=round(n.sugar or 0.0, 1),
                    fiber=round(n.fiber or 0.0, 1),
                    sodium=int(round(n.sodium or 0.0)),
                )
            )

        # 2. Baseline nutrition & health score with transition multipliers
        baseline_nutrition = identified.nutrition
        baseline_score = calculate_health_score_sync(baseline_nutrition, target_body_type, current_body_type)

        # 3. Search for healthier alternatives (>2 pts better, matching diet preference)
        raw_alternatives = await get_healthier_alternatives(
            {
                "identifiedFood": identified.name,
                "nutritionInfo": baseline_nutrition
            },
            baseline_score,
            target_body_type,
            current_body_type,
            diet_preference
        )

        # 4. Filter alternatives strictly by diet preference and allergies
        filtered_alternatives = []
        for alt in raw_alternatives:
            if detect_dietary_conflict(alt.name, diet_preference) is not None:
                continue

            if any(allergy.lower() in alt.name.lower() for allergy in allergies):
                continue

            filtered_alternatives.append(alt)

        # 5. Process detailed logs (weights, pieces, custom ingredients)
        detailed_result = process_detailed_log(identified, request.detailedLog)

        # 6. Allergen & Dietary Conflict detection
        allergen_warning = detect_allergens(identified.name, allergies)
        dietary_warning = detect_dietary_conflict(identified.name, diet_preference)

        # 7. Select best choice and detect already-optimal state
        best_choice = None
        if filtered_alternatives:
            sorted_alts = sorted(filtered_alternatives, key=lambda x: x.healthScore, reverse=True)
            best_choice = sorted_alts[0]

        already_optimal = len(filtered_alternatives) == 0 and not dietary_warning

        # 8. Generate conversational spoken response
        spoken_response = generate_spoken_explanation(
            identified.name,
            int(round(baseline_score)),
            target_body_type,
            best_choice,
            already_optimal,
            dietary_warning
        )

        n = identified.nutrition
        return AnalyzeResponse(
            identifiedFood=identified.name,
            confidence=identified.confidence,
            healthScore=int(round(baseline_score)),
            nutritionInfo=NutritionResponse(
                calories=int(round(n.calories)),
                protein=round(n.protein, 1),
                carbs=round(n.carbs, 1),
                fats=round(n.fat, 1),
                saturatedFat=round(n.saturatedFat or 0.0, 1),
                sugar=round(n.sugar or 0.0, 1),
                fiber=round(n.fiber or 0.0, 1),
                sodium=int(round(n.sodium or 0.0)),
            ),
            totalCalories=int(round(detailed_result["totalCalories"])),
            totalProtein=round(detailed_result["totalProtein"], 1),
            totalCarbs=round(detailed_result["totalCarbs"], 1),
            totalFat=round(detailed_result["totalFat"], 1),
            totalFiber=round(detailed_result["totalFiber"], 1),
            totalSugar=round(detailed_result["totalSugar"], 1),
            totalSodium=int(round(detailed_result["totalSodium"])),
            servingInfo=detailed_result["servingInfo"],
            hasDetailedLog=bool(request.detailedLog),
            alternatives=filtered_alternatives,
            alreadyOptimal=already_optimal,
            bestChoice=best_choice,
            allergenWarning=allergen_warning if allergen_warning else None,
            dietaryWarning=dietary_warning,
            spokenResponse=spoken_response
        )

    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
