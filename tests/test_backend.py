import pytest
import asyncio
import httpx
from python_app.models import (
    NutritionInfo, 
    IdentifiedFood, 
    DetailedLogInput, 
    CustomIngredient,
    CompareFoodsRequest
)
from python_app.model import (
    LinearRegressionModel, 
    train_health_score_model, 
    get_benchmark_training_data, 
    normalize_features,
    get_trained_model,
    ensure_model_trained
)
from python_app.scoring import (
    calculate_health_score_sync, 
    calculate_health_score, 
    get_goal_multipliers,
    get_goal_transition_multipliers,
    to_number,
    get_processing_level
)
from python_app.explain import calculate_feature_importance
from python_app.alternatives import get_healthier_alternatives
from python_app.allergens import detect_allergens, detect_dietary_conflict
from python_app.detailed_log import process_detailed_log
from python_app.classify import get_food_category, detect_meal_type, get_category_matched_search_terms
from python_app.llm import get_heuristic_nutrition, generate_spoken_explanation
from python_app.api import app

def test_model_training_and_evaluation():
    model = train_health_score_model(use_closed_form=True)
    assert model.bias > 0
    assert len(model.weights) == 9
    
    dataset = get_benchmark_training_data()
    features, labels = normalize_features(dataset)
    metrics = model.evaluate(features, labels)
    
    assert metrics["r2"] > 0.65
    assert metrics["mae"] < 15.0

def test_scoring_multipliers():
    athletic_mult = get_goal_multipliers("athletic")
    loss_mult = get_goal_multipliers("weight_loss")
    
    # Protein multiplier in athletic should be high (>= 1.5)
    assert athletic_mult[1] >= 1.5
    # Calorie multiplier in weight loss should be penalizing (>= 1.3)
    assert loss_mult[0] >= 1.3
    
    # Check bounds
    nut_junk = NutritionInfo(calories=650, protein=2, carbs=80, fat=35, saturatedFat=15, sugar=45, fiber=0.5, sodium=1100, processingLevel=0.9)
    score_junk = calculate_health_score_sync(nut_junk, "athletic")
    assert 5.0 <= score_junk <= 30.0

    nut_superfood = NutritionInfo(calories=95, protein=5, carbs=14, fat=0.5, saturatedFat=0.1, sugar=4, fiber=6, sodium=30, processingLevel=0.1)
    score_super = calculate_health_score_sync(nut_superfood, "athletic")
    assert 80.0 <= score_super <= 98.0

def test_goal_transition_weight_gain_scoring():
    # Test transition combinations (e.g. thin -> obese / overweight vs obese -> thin)
    gain_mult = get_goal_transition_multipliers("obese", "thin")
    loss_mult = get_goal_transition_multipliers("thin", "obese")
    
    # In weight gain (thin -> obese), calorie and fat penalties are relaxed / inverted
    assert gain_mult[0] < 0.0 # Calorie penalty reversed for bulking
    assert gain_mult[3] < 0.0 # Fat penalty reversed
    assert gain_mult[2] < 0.0 # Carb penalty reversed
    
    # In weight loss (obese -> thin), calories and fat are strongly penalized
    assert loss_mult[0] > 1.2
    assert loss_mult[3] > 1.3
    
    # High-carb, calorie-rich nutrient profile (e.g. Peanut butter & Oats bowl)
    nut_bulk = NutritionInfo(calories=550, protein=22, carbs=65, fat=24, saturatedFat=3.5, sugar=8, fiber=7, sodium=180, processingLevel=0.2)
    
    score_bulking = calculate_health_score_sync(nut_bulk, "obese", current_body_type="thin")
    score_cutting = calculate_health_score_sync(nut_bulk, "thin", current_body_type="obese")
    
    # The food must score significantly higher when gaining weight than when cutting
    assert score_bulking > score_cutting
    assert score_bulking >= 70.0

def test_dietary_conflict_detection():
    # 1. Vegetarian profile with non-veg food
    warn_chicken = detect_dietary_conflict("Chicken Biryani", "veg")
    assert warn_chicken is not None
    assert "non-vegetarian" in warn_chicken.lower()
    
    warn_fish = detect_dietary_conflict("Grilled Salmon Fish", "vegetarian")
    assert warn_fish is not None
    assert "non-vegetarian" in warn_fish.lower()
    
    warn_beef = detect_dietary_conflict("Beef Steak Burger", "veg")
    assert warn_beef is not None
    
    # Veg food with veg profile -> No warning
    assert detect_dietary_conflict("Paneer Butter Masala", "veg") is None
    assert detect_dietary_conflict("Mixed Green Salad", "vegetarian") is None
    assert detect_dietary_conflict("Steamed Brown Rice", "veg") is None

    # 2. Vegan profile with dairy / egg food
    warn_egg = detect_dietary_conflict("Scrambled Eggs", "vegan")
    assert warn_egg is not None
    assert "vegan" in warn_egg.lower()
    
    warn_paneer = detect_dietary_conflict("Paneer Tikka", "vegan")
    assert warn_paneer is not None
    assert "vegan" in warn_paneer.lower()
    
    assert detect_dietary_conflict("Tofu and Broccoli Stir Fry", "vegan") is None

def test_explainable_ai_feature_importance():
    model = get_trained_model()
    base = NutritionInfo(calories=500, protein=5, carbs=60, fat=25, saturatedFat=10, sugar=30, fiber=1, sodium=600, processingLevel=0.8)
    swap = NutritionInfo(calories=120, protein=15, carbs=10, fat=2, saturatedFat=0.5, sugar=2, fiber=5, sodium=80, processingLevel=0.2)
    
    reasons = calculate_feature_importance(base, swap, model, "athletic")
    assert len(reasons) > 0
    
    # Check that reasons have status and explanations
    for r in reasons:
        assert r.status in ["better", "worse", "same"]
        assert len(r.actualChange) > 0
        assert len(r.explanation) > 0

def test_allergen_detection():
    allergies = ["dairy", "wheat", "peanuts", "eggs"]
    
    # Direct match
    assert "dairy" in detect_allergens("Dairy Milk Shake", allergies)
    
    # Keyword match
    assert "wheat" in detect_allergens("Butter Naan", allergies)
    assert "dairy" in detect_allergens("Paneer Butter Masala", allergies)
    assert "eggs" in detect_allergens("Egg Omelette", allergies)
    
    # Clean food without allergens
    assert len(detect_allergens("Fresh Apple Slices", allergies)) == 0

def test_detailed_portion_logger():
    # Piece-based food
    ident_egg = IdentifiedFood(name="Boiled Egg", confidence=0.98, nutrition=NutritionInfo(calories=155, protein=13, carbs=1.1, fat=11, fiber=0, sugar=1.1, sodium=124))
    res_egg = process_detailed_log(ident_egg, DetailedLogInput(pieces=2))
    assert res_egg["totalCalories"] == 78 * 2
    assert "2 pieces" in res_egg["servingInfo"]

    # Gram weight portioning
    ident_rice = IdentifiedFood(name="Steamed Rice", confidence=0.95, nutrition=NutritionInfo(calories=130, protein=2.7, carbs=28, fat=0.3, fiber=0.4, sugar=0, sodium=1))
    res_rice = process_detailed_log(ident_rice, DetailedLogInput(weight=200))
    assert res_rice["totalCalories"] == 130 * 2
    assert "200g" in res_rice["servingInfo"]

    # Custom ingredients addition
    custom = [CustomIngredient(name="honey", quantity=1, unit="tbsp")]
    res_custom = process_detailed_log(ident_rice, DetailedLogInput(weight=100, customIngredients=custom))
    assert res_custom["totalCalories"] > 130

def test_classify_and_search_terms():
    assert get_food_category("Gulab Jamun") == "sweet"
    assert get_food_category("Potato Chips") == "salty-snack"
    assert get_food_category("Butter Chicken") == "curry"
    
    assert detect_meal_type("Oatmeal Porridge") == "breakfast"
    assert detect_meal_type("Biryani") == "lunch-dinner"
    
    terms = get_category_matched_search_terms("Potato Chips", "salty-snack", "snack")
    assert len(terms) > 0
    assert any("makhana" in t.lower() or "chips" in t.lower() or "chana" in t.lower() for t in terms)

def test_spoken_advisor_script():
    spoken = generate_spoken_explanation("Potato Chips", 20, "athletic", None, True)
    assert "Potato Chips" in spoken
    assert "..." in spoken

def test_distinct_suggestion_scores_and_veg_filtering():
    async def run_test():
        # Test 1: Suggestions for vegetarian user have NO non-veg items and have DISTINCT scores
        base_burger = {
            "identifiedFood": "Double Cheeseburger",
            "nutritionInfo": NutritionInfo(calories=550, protein=25, carbs=40, fat=32, saturatedFat=14, sugar=6, fiber=2, sodium=950, processingLevel=0.8)
        }
        alts_veg = await get_healthier_alternatives(
            base_burger,
            baseline_score=35.0,
            target_body_type="athletic",
            current_body_type="average",
            diet_preference="veg"
        )
        assert len(alts_veg) >= 2
        # Verify no non-veg items in suggestions
        for alt in alts_veg:
            assert detect_dietary_conflict(alt.name, "veg") is None
            
        # Verify suggestion scores are DISTINCT (not all identical)
        scores = [a.healthScore for a in alts_veg]
        assert len(scores) == len(set(scores)), f"Scores should be distinct, got {scores}"

    asyncio.run(run_test())

def test_fastapi_rest_endpoints():
    async def run_api_tests():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            # 1. Health
            res = await client.get("/health")
            assert res.status_code == 200
            assert res.json()["status"] == "healthy"

            # 2. Model Info
            res = await client.get("/model-info")
            assert res.status_code == 200
            assert "weights" in res.json()["model"]

            # 3. Predict Score
            res = await client.post("/predict-score", json={
                "calories": 150, "protein": 12, "carbs": 18, "fat": 3, "saturatedFat": 0.5, "sugar": 2, "fiber": 4, "sodium": 120, "processingLevel": 0.2
            })
            assert res.status_code == 200
            assert res.json()["healthScore"] > 70

            # 4. Compare Foods
            res = await client.post("/compare-foods", json={
                "foodA_name": "Fried Samosa",
                "foodA_nutrition": {"calories": 300, "protein": 4, "carbs": 30, "fat": 18, "saturatedFat": 6, "sugar": 2, "fiber": 1, "sodium": 400, "processingLevel": 0.8},
                "foodB_name": "Moong Dal Chilla",
                "foodB_nutrition": {"calories": 140, "protein": 9, "carbs": 18, "fat": 4, "saturatedFat": 0.5, "sugar": 2, "fiber": 4, "sodium": 220, "processingLevel": 0.2},
                "targetBodyType": "athletic",
                "currentBodyType": "average"
            })
            assert res.status_code == 200
            comp = res.json()
            assert comp["winner"] == "Moong Dal Chilla"
            assert len(comp["reasons"]) > 0

            # 5. Analyze Food with Veg preference & Non-veg input -> dietary warning triggered & veg alternatives provided
            res = await client.post("/analyze-food", json={
                "voiceQuery": "Crispy chicken wings with butter sauce",
                "userProfile": {
                    "targetBodyType": "obese",
                    "currentBodyType": "thin",
                    "dietPreference": "veg"
                }
            })
            assert res.status_code == 200
            data = res.json()
            assert "identifiedFood" in data
            assert data["healthScore"] is not None
            assert data["dietaryWarning"] is not None
            assert "non-vegetarian" in data["dietaryWarning"].lower()
            
            # Check alternatives are present and strictly vegetarian
            assert len(data["alternatives"]) > 0
            for alt in data["alternatives"]:
                assert detect_dietary_conflict(alt["name"], "veg") is None
            
            # Check suggestion scores are distinct
            alt_scores = [a["healthScore"] for a in data["alternatives"]]
            assert len(alt_scores) == len(set(alt_scores)), f"Alternative scores should be distinct, got {alt_scores}"

    asyncio.run(run_api_tests())
