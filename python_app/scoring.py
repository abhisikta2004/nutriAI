import math
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

def get_goal_transition_multipliers(
    target_body_type: Optional[str] = "athletic", 
    current_body_type: Optional[str] = "average"
) -> List[float]:
    """
    Dynamically derive 9-element feature multiplier vector based on the transition:
    (current_body_type -> target_body_type).
    
    Feature Order: [Calories, Protein, Carbs, Fat, SatFat, Sugar, Fiber, Sodium, Processing]
    """
    target = (target_body_type or "athletic").lower()
    current = (current_body_type or "average").lower()

    body_rank = {
        "thin": 1,
        "average": 2,
        "athletic": 2.5,
        "muscle_gain": 2.8,
        "overweight": 4,
        "obese": 5,
        "weight_loss": 1.5,
        "maintenance": 2
    }

    c_rank = body_rank.get(current, 2)
    t_rank = body_rank.get(target, 2.5)

    # 1. Extreme / High Mass Gaining (e.g. thin -> obese, thin -> overweight, average -> obese)
    # Rewards caloric density, rich healthy fats, and high carbohydrate loads
    if c_rank <= 2 and t_rank >= 4:
        return [-0.3, 1.5, -1.8, -0.6, 0.5, 0.6, 1.2, 0.9, 0.9]

    # 2. Moderate Weight Gain (e.g. thin -> average, thin -> athletic/muscle_gain)
    if c_rank == 1 and t_rank > 1:
        return [0.2, 1.5, -1.2, -0.3, 0.7, 0.8, 1.3, 0.9, 0.9]

    # 3. Bulking from average / Muscle Gain
    if target == "muscle_gain" or (current == "average" and target == "athletic"):
        return [0.6, 1.6, 0.6, 0.7, 1.0, 1.0, 1.3, 1.0, 1.1]

    # 4. Aggressive Weight Loss / Fat Cutting (e.g. obese -> thin/athletic/average, overweight -> thin)
    if c_rank >= 4 and t_rank <= 2.5:
        return [1.7, 1.4, 1.4, 1.5, 1.6, 1.7, 1.8, 1.3, 1.1]

    # 5. Moderate Weight Loss (e.g. overweight -> average, average -> thin)
    if c_rank > t_rank:
        return [1.4, 1.3, 1.2, 1.3, 1.4, 1.5, 1.5, 1.2, 1.0]

    # 6. Athletic Recomposition
    if target == "athletic":
        return [0.9, 1.5, 0.9, 0.9, 1.1, 1.1, 1.3, 1.0, 1.1]

    # 7. Default Balanced / Maintenance
    return [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]

def get_goal_multipliers(
    target_body_type: Optional[str] = "athletic", 
    current_body_type: Optional[str] = "average"
) -> List[float]:
    return get_goal_transition_multipliers(target_body_type, current_body_type)

def calculate_basic_health_score(
    nutriments: Dict[str, Any], 
    target_body_type: str = "athletic",
    current_body_type: str = "average"
) -> float:
    calories = to_number(nutriments.get("energy-kcal_100g") or (float(nutriments.get("energy_100g", 0)) / 4.184 if nutriments.get("energy_100g") else None) or nutriments.get("calories"), 0.0)
    protein = to_number(nutriments.get("proteins_100g") or nutriments.get("protein"), 0.0)
    fiber = to_number(nutriments.get("fiber_100g") or nutriments.get("fiber"), 0.0)
    carbs = to_number(nutriments.get("carbohydrates_100g") or nutriments.get("carbs"), 0.0)
    fat = to_number(nutriments.get("fat_100g") or nutriments.get("fat"), 0.0)
    saturated_fat = to_number(nutriments.get("saturated-fat_100g") or nutriments.get("saturatedFat"), 0.0)
    sugar = to_number(nutriments.get("sugars_100g") or nutriments.get("sugar"), 0.0)
    processing_level = to_number(nutriments.get("processingLevel"), 0.3)
    
    raw_sodium = to_number(nutriments.get("sodium_100g") or nutriments.get("sodium"), 0.0)
    sodium = raw_sodium * 1000 if 0 < raw_sodium < 20 else raw_sodium
    
    mult = get_goal_transition_multipliers(target_body_type, current_body_type)
    is_gaining = (current_body_type == 'thin' and target_body_type in ['obese', 'overweight', 'average', 'athletic']) or \
                 (target_body_type in ['overweight', 'obese'] and current_body_type != 'obese')

    score = 55.0
    
    # Positive factors
    score += min(25.0, protein * 1.5) * max(0.5, mult[1])
    score += min(20.0, fiber * 2.5) * max(0.5, mult[6])

    if is_gaining:
        # Positively reward rich carbs and healthy fats for gaining mass
        score += min(18.0, carbs * 0.4)
        score += min(15.0, fat * 0.6)
        if 300 <= calories <= 700:
            score += 10.0  # Caloric density bonus for bulking
    
    if processing_level <= 0.3:
        score += 15.0 * max(0.5, mult[8])
    elif processing_level > 0.6:
        score -= 15.0 * max(0.5, mult[8])
        
    if not is_gaining and calories < 120 and sugar < 12 and saturated_fat < 1:
        score += 12.0
        
    # Negative factors (adjusted thresholds for bulking vs cutting)
    cal_threshold = 650 if is_gaining else 350
    fat_threshold = 30 if is_gaining else 15

    if calories > cal_threshold and mult[0] > 0:
        score -= min(25.0, (calories - cal_threshold) / 15.0) * mult[0]
    if fat > fat_threshold and mult[3] > 0:
        score -= min(20.0, (fat - fat_threshold) * 1.0) * mult[3]
    if saturated_fat > 3:
        score -= min(20.0, (saturated_fat - 3) * 2.0) * max(0.5, mult[4])
    if sugar > 12:
        score -= min(25.0, (sugar - 12) * 1.0) * max(0.5, mult[5])
    if sodium > 300:
        score -= min(15.0, (sodium - 300) / 50.0) * max(0.5, mult[7])
        
    return max(5.0, min(98.0, round(score, 1)))

CALIBRATED_BASE_WEIGHTS = [-14.0, 28.0, -6.0, -10.0, -18.0, -24.0, 30.0, -10.0, -20.0]
CALIBRATED_BASE_BIAS = 65.0

def smooth_health_score(raw_score: float) -> float:
    """
    Smooth asymptotic compression curve preventing flat score saturation at upper (98) and lower (5) bounds.
    Generates natural, continuous, and distinguishable scores for every suggestion.
    """
    if raw_score > 80.0:
        return 80.0 + 18.0 * (1.0 - math.exp(-(raw_score - 80.0) / 22.0))
    elif raw_score < 20.0:
        return 20.0 - 15.0 * (1.0 - math.exp(-(20.0 - raw_score) / 15.0))
    return raw_score

def calculate_health_score_sync(
    nutrition: NutritionInfo, 
    target_body_type: str = "athletic",
    current_body_type: str = "average"
) -> float:
    """Synchronously compute health score using the calibrated linear model with goal transition multipliers."""
    multipliers = get_goal_transition_multipliers(target_body_type, current_body_type)
    
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
    
    raw = CALIBRATED_BASE_BIAS
    for i in range(len(features)):
        effective_weight = CALIBRATED_BASE_WEIGHTS[i] * multipliers[i]
        raw += effective_weight * features[i]
        
    smoothed = smooth_health_score(raw)
    return max(5.0, min(98.0, round(smoothed, 1)))

async def calculate_health_score(
    nutrition: NutritionInfo, 
    target_body_type: str = "athletic",
    current_body_type: str = "average"
) -> float:
    """Async alias for calculate_health_score_sync."""
    return calculate_health_score_sync(nutrition, target_body_type, current_body_type)
