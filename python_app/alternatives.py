import re
import asyncio
from typing import List, Set, Dict, Any
from .models import Alternative, NutritionInfo
from .model import ensure_model_trained
from .scoring import calculate_health_score, to_number
from .explain import calculate_feature_importance
from .classify import get_food_category, detect_meal_type, get_category_matched_search_terms
from .open_food_facts import search_open_food_facts
from .curated_data import meal_type_alternatives, alternatives_by_category

def normalize_name(name: str) -> str:
    cleaned = re.sub(r'[^a-z0-9\s]', '', name.lower())
    words = re.sub(r'\s+', ' ', cleaned).strip().split(' ')
    return ' '.join(words[:2])

def is_similar_to_seen(name: str, seen_names: Set[str]) -> bool:
    norm_new = normalize_name(name)
    for seen in seen_names:
        norm_seen = normalize_name(seen)
        if norm_new == norm_seen or norm_new in norm_seen or norm_seen in norm_new:
            return True
    return False

async def get_curated_alternatives(
    baseline_food: Dict[str, Any],
    category: str = 'general',
    meal_type: str = 'any',
    target_body_type: str = 'athletic',
    baseline_score: float = 0.0
) -> List[Alternative]:
    name = str(baseline_food.get("identifiedFood", "")).lower()
    key = category

    if category == 'salty-snack' and 'chip' in name:
        key = 'salty-chips'
    elif category == 'sweet' and ('biscuit' in name or 'cookie' in name):
        key = 'sweet-biscuit'
    elif category == 'sweet' and 'chocolate' in name:
        key = 'sweet-chocolate'

    if meal_type == 'lunch-dinner' and 'lunch-dinner' in meal_type_alternatives:
        candidates = meal_type_alternatives['lunch-dinner']
    elif meal_type == 'breakfast' and ('breakfast' in alternatives_by_category or 'breakfast' in meal_type_alternatives):
        candidates = alternatives_by_category.get('breakfast') or meal_type_alternatives.get('breakfast', [])
    else:
        candidates = alternatives_by_category.get(key) or alternatives_by_category.get(category) or alternatives_by_category.get('general', [])

    model = await ensure_model_trained()
    evaluated = []

    for alt in candidates:
        score = await calculate_health_score(alt.nutrition, target_body_type)
        reasons = calculate_feature_importance(
            baseline_food["nutritionInfo"],
            alt.nutrition,
            model,
            target_body_type
        )
        if score > baseline_score + 3.0:
            evaluated.append(Alternative(
                name=alt.name,
                healthScore=int(round(score)),
                benefits=[
                    f"{int(round(alt.nutrition.protein))}g protein per 100g",
                    f"{int(round(alt.nutrition.fiber or 0))}g fiber per 100g",
                    f"{int(round(alt.nutrition.calories))} calories per 100g"
                ],
                reasons=reasons,
                nutrition=alt.nutrition,
                isRegional=False
            ))

    return evaluated

async def get_healthier_alternatives(
    baseline_food: Dict[str, Any],
    baseline_score: float,
    target_body_type: str = 'athletic'
) -> List[Alternative]:
    food_name = baseline_food.get("identifiedFood", "snack")
    category = get_food_category(food_name, "")
    meal_type = detect_meal_type(food_name)

    alternatives: List[Alternative] = []
    seen_names: Set[str] = set()
    model = await ensure_model_trained()

    # 1. Fast path: Evaluate curated alternatives in 0ms
    curated = await get_curated_alternatives(baseline_food, category, meal_type, target_body_type, baseline_score)
    for alt in curated:
        if len(alternatives) >= 3:
            break
        if not is_similar_to_seen(alt.name, seen_names):
            seen_names.add(alt.name)
            alternatives.append(alt)

    # 2. Query Open Food Facts if more alternatives needed
    if len(alternatives) < 3:
        search_terms = get_category_matched_search_terms(food_name, category, meal_type)
        tasks = [search_open_food_facts(term) for term in search_terms[:2]]
        search_results = await asyncio.gather(*tasks, return_exceptions=True)

        candidate_products = []
        for res in search_results:
            if isinstance(res, list):
                candidate_products.extend(res)

        for product in candidate_products:
            if len(alternatives) >= 3:
                break
            if not product or not isinstance(product, dict) or not product.get("nutriments"):
                continue

            product_name = str(product.get("product_name", "")).strip()
            if not product_name or product_name.lower() == "unknown" or len(product_name) < 3:
                continue
            if is_similar_to_seen(product_name, seen_names):
                continue

            nutriments = product["nutriments"]
            raw_sodium = to_number(nutriments.get("sodium_100g") or nutriments.get("sodium"), 0.0)
            sodium_mg = raw_sodium * 1000.0 if raw_sodium < 20.0 and raw_sodium > 0.0 else raw_sodium

            calories = to_number(
                nutriments.get("energy-kcal_100g") or 
                (float(nutriments.get("energy_100g", 0)) / 4.184 if nutriments.get("energy_100g") else None), 
                0.0
            )
            alt_nutrition = NutritionInfo(
                calories=calories,
                protein=to_number(nutriments.get("proteins_100g"), 0.0),
                carbs=to_number(nutriments.get("carbohydrates_100g"), 0.0),
                fat=to_number(nutriments.get("fat_100g"), 0.0),
                saturatedFat=to_number(nutriments.get("saturated-fat_100g"), 0.0),
                sugar=to_number(nutriments.get("sugars_100g"), 0.0),
                fiber=to_number(nutriments.get("fiber_100g"), 0.0),
                sodium=sodium_mg,
                vitamins=0.6,
                processingLevel=0.3
            )

            if alt_nutrition.calories <= 5 and alt_nutrition.protein <= 0.1 and alt_nutrition.carbs <= 0.1:
                continue

            alt_score = await calculate_health_score(alt_nutrition, target_body_type)
            if alt_score > baseline_score + 3.0:
                reasons = calculate_feature_importance(
                    baseline_food["nutritionInfo"],
                    alt_nutrition,
                    model,
                    target_body_type
                )
                if reasons:
                    seen_names.add(product_name)
                    alternatives.append(Alternative(
                        name=product_name,
                        healthScore=int(round(alt_score)),
                        benefits=[
                            f"{int(round(alt_nutrition.protein))}g protein per 100g",
                            f"{int(round(alt_nutrition.fiber or 0))}g fiber per 100g",
                            f"{int(round(alt_nutrition.calories))} calories per 100g"
                        ],
                        reasons=reasons,
                        nutrition=alt_nutrition,
                        isRegional=False
                    ))

    return alternatives[:3]
