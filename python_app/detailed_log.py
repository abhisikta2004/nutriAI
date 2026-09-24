from typing import Dict, Any, Optional
from .models import IdentifiedFood, DetailedLogInput
from .scoring import to_number

PIECE_BASED_FOODS: Dict[str, Dict[str, float]] = {
    'egg': {'weight': 50, 'cal': 78, 'protein': 6.3, 'carbs': 0.6, 'fat': 5.3, 'fiber': 0, 'sugar': 0.6, 'sodium': 62},
    'boiled egg': {'weight': 50, 'cal': 78, 'protein': 6.3, 'carbs': 0.6, 'fat': 5.3, 'fiber': 0, 'sugar': 0.6, 'sodium': 62},
    'fried egg': {'weight': 55, 'cal': 92, 'protein': 6.3, 'carbs': 0.6, 'fat': 7.3, 'fiber': 0, 'sugar': 0.6, 'sodium': 92},
    'omelette': {'weight': 65, 'cal': 95, 'protein': 7, 'carbs': 1, 'fat': 7.5, 'fiber': 0, 'sugar': 0.5, 'sodium': 120},
    'poori': {'weight': 30, 'cal': 100, 'protein': 2, 'carbs': 13, 'fat': 5, 'fiber': 0.5, 'sugar': 0.5, 'sodium': 80},
    'puri': {'weight': 30, 'cal': 100, 'protein': 2, 'carbs': 13, 'fat': 5, 'fiber': 0.5, 'sugar': 0.5, 'sodium': 80},
    'roti': {'weight': 35, 'cal': 85, 'protein': 3, 'carbs': 18, 'fat': 0.5, 'fiber': 1.2, 'sugar': 0.3, 'sodium': 120},
    'chapati': {'weight': 35, 'cal': 85, 'protein': 3, 'carbs': 18, 'fat': 0.5, 'fiber': 1.2, 'sugar': 0.3, 'sodium': 120},
    'paratha': {'weight': 60, 'cal': 180, 'protein': 4, 'carbs': 25, 'fat': 8, 'fiber': 1, 'sugar': 0.5, 'sodium': 250},
    'naan': {'weight': 90, 'cal': 262, 'protein': 9, 'carbs': 45, 'fat': 5, 'fiber': 2, 'sugar': 3, 'sodium': 418},
    'idli': {'weight': 40, 'cal': 58, 'protein': 2, 'carbs': 12, 'fat': 0.2, 'fiber': 0.5, 'sugar': 0.3, 'sodium': 40},
    'dosa': {'weight': 80, 'cal': 133, 'protein': 3.9, 'carbs': 21, 'fat': 3.7, 'fiber': 1, 'sugar': 0.5, 'sodium': 95},
    'samosa': {'weight': 50, 'cal': 150, 'protein': 3, 'carbs': 15, 'fat': 9, 'fiber': 1, 'sugar': 1, 'sodium': 180},
    'pakora': {'weight': 25, 'cal': 75, 'protein': 2, 'carbs': 7, 'fat': 5, 'fiber': 0.5, 'sugar': 0.3, 'sodium': 120},
    'vada': {'weight': 40, 'cal': 120, 'protein': 3, 'carbs': 12, 'fat': 7, 'fiber': 0.8, 'sugar': 0.5, 'sodium': 150},
    'chicken leg': {'weight': 110, 'cal': 220, 'protein': 24, 'carbs': 0, 'fat': 14, 'fiber': 0, 'sugar': 0, 'sodium': 85},
    'chicken breast': {'weight': 120, 'cal': 165, 'protein': 31, 'carbs': 0, 'fat': 3.6, 'fiber': 0, 'sugar': 0, 'sodium': 74},
    'chicken wing': {'weight': 35, 'cal': 80, 'protein': 7, 'carbs': 0, 'fat': 6, 'fiber': 0, 'sugar': 0, 'sodium': 55},
    'chicken thigh': {'weight': 85, 'cal': 180, 'protein': 20, 'carbs': 0, 'fat': 11, 'fiber': 0, 'sugar': 0, 'sodium': 70},
    'fish fillet': {'weight': 100, 'cal': 120, 'protein': 22, 'carbs': 0, 'fat': 3, 'fiber': 0, 'sugar': 0, 'sodium': 80},
    'mutton piece': {'weight': 85, 'cal': 180, 'protein': 18, 'carbs': 0, 'fat': 12, 'fiber': 0, 'sugar': 0, 'sodium': 75},
    'prawn': {'weight': 10, 'cal': 10, 'protein': 2, 'carbs': 0, 'fat': 0.2, 'fiber': 0, 'sugar': 0, 'sodium': 15},
    'shrimp': {'weight': 10, 'cal': 10, 'protein': 2, 'carbs': 0, 'fat': 0.2, 'fiber': 0, 'sugar': 0, 'sodium': 15},
    'crab': {'weight': 100, 'cal': 97, 'protein': 19, 'carbs': 0, 'fat': 1.5, 'fiber': 0, 'sugar': 0, 'sodium': 330},
    'lobster': {'weight': 100, 'cal': 89, 'protein': 19, 'carbs': 0, 'fat': 0.9, 'fiber': 0, 'sugar': 0, 'sodium': 380},
    'tikka': {'weight': 40, 'cal': 65, 'protein': 8, 'carbs': 1, 'fat': 3, 'fiber': 0, 'sugar': 0.5, 'sodium': 120},
    'kebab': {'weight': 50, 'cal': 85, 'protein': 9, 'carbs': 2, 'fat': 4.5, 'fiber': 0.3, 'sugar': 0.5, 'sodium': 150},
    'momo': {'weight': 25, 'cal': 45, 'protein': 2.5, 'carbs': 6, 'fat': 1.5, 'fiber': 0.3, 'sugar': 0.2, 'sodium': 85},
    'dumpling': {'weight': 25, 'cal': 45, 'protein': 2.5, 'carbs': 6, 'fat': 1.5, 'fiber': 0.3, 'sugar': 0.2, 'sodium': 85},
    'spring roll': {'weight': 40, 'cal': 90, 'protein': 2, 'carbs': 10, 'fat': 5, 'fiber': 0.5, 'sugar': 0.5, 'sodium': 130},
    'cutlet': {'weight': 60, 'cal': 130, 'protein': 5, 'carbs': 12, 'fat': 7, 'fiber': 1, 'sugar': 0.5, 'sodium': 180},
    'kachori': {'weight': 45, 'cal': 160, 'protein': 3, 'carbs': 18, 'fat': 9, 'fiber': 1, 'sugar': 1, 'sodium': 200},
}

INGREDIENT_NUTRITION: Dict[str, Dict[str, Any]] = {
    'banana': {'cal': 89, 'protein': 1.1, 'carbs': 23, 'fat': 0.3, 'fiber': 2.6, 'sugar': 12, 'sodium': 1, 'unit': 'piece'},
    'mango': {'cal': 60, 'protein': 0.8, 'carbs': 15, 'fat': 0.4, 'fiber': 1.6, 'sugar': 14, 'sodium': 1, 'unit': 'piece'},
    'apple': {'cal': 52, 'protein': 0.3, 'carbs': 14, 'fat': 0.2, 'fiber': 2.4, 'sugar': 10, 'sodium': 1, 'unit': 'piece'},
    'orange': {'cal': 47, 'protein': 0.9, 'carbs': 12, 'fat': 0.1, 'fiber': 2.4, 'sugar': 9, 'sodium': 0, 'unit': 'piece'},
    'strawberry': {'cal': 32, 'protein': 0.7, 'carbs': 8, 'fat': 0.3, 'fiber': 2, 'sugar': 5, 'sodium': 1, 'unit': 'piece'},
    'milk': {'cal': 42, 'protein': 3.4, 'carbs': 5, 'fat': 1, 'fiber': 0, 'sugar': 5, 'sodium': 44, 'unit': 'ml'},
    'cream': {'cal': 340, 'protein': 2.1, 'carbs': 2.8, 'fat': 37, 'fiber': 0, 'sugar': 2.8, 'sodium': 34, 'unit': 'tbsp'},
    'sugar': {'cal': 387, 'protein': 0, 'carbs': 100, 'fat': 0, 'fiber': 0, 'sugar': 100, 'sodium': 0, 'unit': 'tsp'},
    'honey': {'cal': 304, 'protein': 0.3, 'carbs': 82, 'fat': 0, 'fiber': 0.2, 'sugar': 82, 'sodium': 4, 'unit': 'tbsp'},
    'oil': {'cal': 884, 'protein': 0, 'carbs': 0, 'fat': 100, 'fiber': 0, 'sugar': 0, 'sodium': 0, 'unit': 'tbsp'},
    'ghee': {'cal': 900, 'protein': 0, 'carbs': 0, 'fat': 100, 'fiber': 0, 'sugar': 0, 'sodium': 0, 'unit': 'tsp'},
    'butter': {'cal': 717, 'protein': 0.9, 'carbs': 0.1, 'fat': 81, 'fiber': 0, 'sugar': 0.1, 'sodium': 576, 'unit': 'tbsp'},
    'rice': {'cal': 130, 'protein': 2.7, 'carbs': 28, 'fat': 0.3, 'fiber': 0.4, 'sugar': 0, 'sodium': 1, 'unit': 'cup'},
    'potato': {'cal': 77, 'protein': 2, 'carbs': 17, 'fat': 0.1, 'fiber': 2.2, 'sugar': 0.8, 'sodium': 6, 'unit': 'g'},
    'paneer': {'cal': 265, 'protein': 18, 'carbs': 1.2, 'fat': 21, 'fiber': 0, 'sugar': 1.2, 'sodium': 15, 'unit': 'g'},
    'cheese': {'cal': 402, 'protein': 25, 'carbs': 1.3, 'fat': 33, 'fiber': 0, 'sugar': 0.5, 'sodium': 621, 'unit': 'g'},
    'yogurt': {'cal': 59, 'protein': 3.5, 'carbs': 3.6, 'fat': 3.3, 'fiber': 0, 'sugar': 3.6, 'sodium': 46, 'unit': 'g'},
    'curd': {'cal': 59, 'protein': 3.5, 'carbs': 3.6, 'fat': 3.3, 'fiber': 0, 'sugar': 3.6, 'sodium': 46, 'unit': 'g'},
    'fruits': {'cal': 60, 'protein': 0.8, 'carbs': 15, 'fat': 0.3, 'fiber': 2, 'sugar': 12, 'sodium': 1, 'unit': 'piece'},
    'dressing': {'cal': 150, 'protein': 0.3, 'carbs': 5, 'fat': 15, 'fiber': 0, 'sugar': 4, 'sodium': 280, 'unit': 'tbsp'},
    'sauce': {'cal': 50, 'protein': 0.5, 'carbs': 10, 'fat': 0.3, 'fiber': 0.5, 'sugar': 8, 'sodium': 350, 'unit': 'tbsp'},
    'mayo': {'cal': 94, 'protein': 0.1, 'carbs': 0.4, 'fat': 10, 'fiber': 0, 'sugar': 0.1, 'sodium': 88, 'unit': 'tbsp'},
    'mayonnaise': {'cal': 94, 'protein': 0.1, 'carbs': 0.4, 'fat': 10, 'fiber': 0, 'sugar': 0.1, 'sodium': 88, 'unit': 'tbsp'},
    'ketchup': {'cal': 17, 'protein': 0.2, 'carbs': 4, 'fat': 0, 'fiber': 0, 'sugar': 3.5, 'sodium': 154, 'unit': 'tbsp'},
}

UNIT_MULTIPLIERS: Dict[str, float] = {
    'g': 0.01,
    'ml': 0.01,
    'piece': 1.0,
    'tbsp': 0.15,
    'tsp': 0.05,
    'cup': 2.4,
}

def process_detailed_log(identified: IdentifiedFood, detailed_log: Optional[DetailedLogInput] = None) -> Dict[str, Any]:
    n = identified.nutrition
    total_calories = n.calories
    total_protein = n.protein
    total_carbs = n.carbs
    total_fat = n.fat
    total_fiber = n.fiber or 0.0
    total_sugar = n.sugar or 0.0
    total_sodium = n.sodium or 0.0
    serving_info = "per 100g"

    if not detailed_log:
        return {
            "totalCalories": total_calories,
            "totalProtein": total_protein,
            "totalCarbs": total_carbs,
            "totalFat": total_fat,
            "totalFiber": total_fiber,
            "totalSugar": total_sugar,
            "totalSodium": total_sodium,
            "servingInfo": serving_info,
        }

    weight = to_number(detailed_log.weight, 100.0)
    pieces = to_number(detailed_log.pieces, 1.0)
    food_lower = identified.name.lower()

    is_piece_based = False
    for food_name, nutrition in PIECE_BASED_FOODS.items():
        if food_name in food_lower:
            is_piece_based = True
            eff_pieces = pieces if pieces > 0 else 1.0
            total_calories = nutrition['cal'] * eff_pieces
            total_protein = nutrition['protein'] * eff_pieces
            total_carbs = nutrition['carbs'] * eff_pieces
            total_fat = nutrition['fat'] * eff_pieces
            total_fiber = nutrition['fiber'] * eff_pieces
            total_sugar = nutrition['sugar'] * eff_pieces
            total_sodium = nutrition['sodium'] * eff_pieces
            serving_info = f"{int(eff_pieces)} piece{'s' if eff_pieces > 1 else ''}"
            break

    if not is_piece_based:
        factor = weight / 100.0 if weight > 0 else 1.0
        total_calories = n.calories * factor
        total_protein = n.protein * factor
        total_carbs = n.carbs * factor
        total_fat = n.fat * factor
        total_fiber = (n.fiber or 0.0) * factor
        total_sugar = (n.sugar or 0.0) * factor
        total_sodium = (n.sodium or 0.0) * factor
        serving_info = f"{int(weight)}g"

    # Add custom ingredients
    if detailed_log.customIngredients:
        for ing in detailed_log.customIngredients:
            ing_name = str(ing.name or "").lower().strip()
            qty = to_number(ing.quantity, 1.0)
            unit = str(ing.unit or "piece").lower()

            for key, info in INGREDIENT_NUTRITION.items():
                if key in ing_name:
                    unit_mult = UNIT_MULTIPLIERS.get(unit, 1.0)
                    total_calories += info['cal'] * qty * unit_mult
                    total_protein += info['protein'] * qty * unit_mult
                    total_carbs += info['carbs'] * qty * unit_mult
                    total_fat += info['fat'] * qty * unit_mult
                    total_fiber += info['fiber'] * qty * unit_mult
                    total_sugar += info['sugar'] * qty * unit_mult
                    total_sodium += info['sodium'] * qty * unit_mult
                    break

    return {
        "totalCalories": total_calories,
        "totalProtein": total_protein,
        "totalCarbs": total_carbs,
        "totalFat": total_fat,
        "totalFiber": total_fiber,
        "totalSugar": total_sugar,
        "totalSodium": total_sodium,
        "servingInfo": serving_info,
    }
