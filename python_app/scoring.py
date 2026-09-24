from typing import Dict, Any, List, Optional
from .models import NutritionInfo

def to_number(value: Any, fallback: float) -> float:
    if value is None:
        return fallback
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(str(value).strip())
    except (ValueError, TypeError):
        return fallback

def get_processing_level(product: Dict[str, Any]) -> float:
    ingredients = str(product.get("ingredients_text", "")).lower()
    categories = str(product.get("categories", "")).lower()
    
    score = 0.5
    if "preservative" in ingredients or "artificial" in ingredients:
        score += 0.2
    if "color" in ingredients or "flavoring" in ingredients:
        score += 0.15
    if "fresh" in categories or "raw" in categories:
        score -= 0.3
    if "organic" in categories:
        score -= 0.2
    if "processed" in categories or "ultra-processed" in categories:
        score += 0.3
    
    return max(0.1, min(1.0, score))

GOAL_FEATURE_MULTIPLIERS: Dict[str, List[float]] = {
    "athletic":    [0.9, 1.4, 1.0, 1.0, 1.1, 1.1, 1.2, 1.0, 1.0],
    "muscle_gain": [0.9, 1.4, 1.0, 1.0, 1.1, 1.1, 1.2, 1.0, 1.0],
    "thin":        [1.3, 1.1, 1.1, 1.1, 1.2, 1.3, 1.3, 1.1, 1.0],
    "weight_loss": [1.3, 1.1, 1.1, 1.1, 1.2, 1.3, 1.3, 1.1, 1.0],
    "overweight":  [1.4, 1.1, 1.1, 1.2, 1.3, 1.4, 1.3, 1.2, 1.0],
    "obese":       [1.4, 1.1, 1.1, 1.2, 1.3, 1.4, 1.3, 1.2, 1.0],
    "average":     [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    "maintenance": [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
}

def get_goal_multipliers(target_body_type: Optional[str] = "athletic") -> List[float]:
    key = (target_body_type or "athletic").lower()
    return GOAL_FEATURE_MULTIPLIERS.get(key, GOAL_FEATURE_MULTIPLIERS["athletic"])

def calculate_basic_health_score(nutriments: Dict[str, Any], target_body_type: str = "athletic") -> float:
    calories = to_number(nutriments.get("energy-kcal_100g") or (float(nutriments.get("energy_100g", 0)) / 4.184 if nutriments.get("energy_100g") else None) or nutriments.get("calories"), 0.0)
    protein = to_number(nutriments.get("proteins_100g") or nutriments.get("protein"), 0.0)
    fiber = to_number(nutriments.get("fiber_100g") or nutriments.get("fiber"), 0.0)
    fat = to_number(nutriments.get("fat_100g") or nutriments.get("fat"), 0.0)
    saturated_fat = to_number(nutriments.get("saturated-fat_100g") or nutriments.get("saturatedFat"), 0.0)
    sugar = to_number(nutriments.get("sugars_100g") or nutriments.get("sugar"), 0.0)
    processing_level = to_number(nutriments.get("processingLevel"), 0.3)
    
    raw_sodium = to_number(nutriments.get("sodium_100g") or nutriments.get("sodium"), 0.0)
    sodium = raw_sodium * 1000 if 0 < raw_sodium < 20 else raw_sodium
    
    mult = get_goal_multipliers(target_body_type)
    score = 55.0
    
    # Positive factors
    score += min(25.0, protein * 1.5) * mult[1]
    score += min(20.0, fiber * 2.5) * mult[6]
    
    if processing_level <= 0.3:
        score += 15.0 * mult[8]
    elif processing_level > 0.6:
        score -= 15.0 * mult[8]
        
    if calories < 120 and sugar < 12 and saturated_fat < 1:
        score += 12.0
        
    # Negative factors
    if calories > 350:
        score -= min(25.0, (calories - 350) / 15.0) * mult[0]
    if fat > 15:
        score -= min(20.0, (fat - 15) * 1.0) * mult[3]
    if saturated_fat > 3:
        score -= min(20.0, (saturated_fat - 3) * 2.0) * mult[4]
    if sugar > 12:
        score -= min(25.0, (sugar - 12) * 1.0) * mult[5]
    if sodium > 300:
        score -= min(15.0, (sodium - 300) / 50.0) * mult[7]
        
    return max(5.0, min(98.0, round(score, 1)))

async def calculate_health_score(nutrition: NutritionInfo, target_body_type: str = "athletic") -> float:
    from .model import ensure_model_trained
    model = await ensure_model_trained()
    multipliers = get_goal_multipliers(target_body_type)
    
    if model and len(model.weights) >= 9:
        features = [
            (nutrition.calories or 0.0) / 600.0,
            (nutrition.protein or 0.0) / 30.0,
            (nutrition.carbs or 0.0) / 100.0,
            (nutrition.fat or 0.0) / 40.0,
            (nutrition.saturatedFat or 0.0) / 20.0,
            (nutrition.sugar or 0.0) / 50.0,
            (nutrition.fiber or 0.0) / 15.0,
            (nutrition.sodium or 0.0) / 2000.0,
            nutrition.processingLevel if nutrition.processingLevel is not None else 0.5
        ]
        
        score = model.bias
        for i in range(len(features)):
            effective_weight = model.weights[i] * multipliers[i]
            score += effective_weight * features[i]
            
        return max(5.0, min(98.0, round(score, 1)))
        
    return calculate_basic_health_score({
        "calories": nutrition.calories,
        "protein": nutrition.protein,
        "fat": nutrition.fat,
        "saturatedFat": nutrition.saturatedFat,
        "sugar": nutrition.sugar,
        "fiber": nutrition.fiber,
        "sodium": nutrition.sodium,
        "processingLevel": nutrition.processingLevel
    }, target_body_type)
