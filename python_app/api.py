import os
import uvicorn
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional, List

from .models import (
    AnalyzeRequest, 
    AnalyzeResponse, 
    NutritionResponse, 
    NutritionInfo
)
from .llm import (
    identify_food_with_ai, 
    identify_food_from_voice_query, 
    generate_spoken_explanation
)
from .scoring import calculate_health_score
from .model import ensure_model_trained, train_health_score_model, get_benchmark_training_data, normalize_features
from .alternatives import get_healthier_alternatives
from .allergens import detect_allergens
from .detailed_log import process_detailed_log

app = FastAPI(
    title="NutriAI Food Health Advisor API",
    description="Explainable AI Food Health Analysis, Macro Estimation & Conversational Voice Advisor in Python",
    version="2.0.0"
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
async def get_model_info():
    """Retrieve current ML model parameters, weights, and evaluation metrics."""
    model = await ensure_model_trained()
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
async def predict_health_score(nutrition: NutritionInfo, target_body_type: Optional[str] = "athletic"):
    """Directly calculate explainable health score for given nutritional parameters."""
    score = await calculate_health_score(nutrition, target_body_type or "athletic")
    return {
        "healthScore": score,
        "targetBodyType": target_body_type,
        "nutrition": nutrition
    }

@app.post("/train-model")
async def train_model_endpoint():
    """Re-train the Linear Regression model on latest benchmark and curated dataset."""
    model = train_health_score_model()
    dataset = get_benchmark_training_data()
    features, labels = normalize_features(dataset)
    metrics = model.evaluate(features, labels)
    return {
        "status": "success",
        "message": "Model successfully retrained via gradient descent",
        "metrics": metrics
    }

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

        # 2. Baseline nutrition & health score
        baseline_nutrition = identified.nutrition
        baseline_score = await calculate_health_score(baseline_nutrition, target_body_type)

        # 3. Search for healthier alternatives (>3 pts better)
        raw_alternatives = await get_healthier_alternatives(
            {
                "identifiedFood": identified.name,
                "nutritionInfo": baseline_nutrition
            },
            baseline_score,
            target_body_type
        )

        # 4. Filter alternatives by diet and allergies
        filtered_alternatives = []
        for alt in raw_alternatives:
            alt_name = alt.name.lower()
            if diet_preference == 'vegan':
                if any(x in alt_name for x in ['chicken', 'meat', 'fish', 'egg', 'milk', 'dairy', 'yogurt', 'cheese', 'butter', 'honey']):
                    continue
            elif diet_preference == 'vegetarian':
                if any(x in alt_name for x in ['chicken', 'meat', 'fish', 'mutton', 'beef', 'pork', 'prawn', 'shrimp']):
                    continue

            if any(allergy.lower() in alt_name for allergy in allergies):
                continue

            filtered_alternatives.append(alt)

        # 5. Process detailed logs (weights, pieces, custom ingredients)
        detailed_result = process_detailed_log(identified, request.detailedLog)

        # 6. Allergen detection
        allergen_warning = detect_allergens(identified.name, allergies)

        # 7. Select best choice and detect already-optimal state
        best_choice = None
        if filtered_alternatives:
            sorted_alts = sorted(filtered_alternatives, key=lambda x: x.healthScore, reverse=True)
            best_choice = sorted_alts[0]

        already_optimal = len(filtered_alternatives) == 0

        # 8. Generate conversational spoken response
        spoken_response = generate_spoken_explanation(
            identified.name,
            int(round(baseline_score)),
            target_body_type,
            best_choice,
            already_optimal
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
            spokenResponse=spoken_response
        )

    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
