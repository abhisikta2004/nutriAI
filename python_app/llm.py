import os
import json
import re
import asyncio
import httpx
from typing import Optional, Dict, Any, List
from .models import IdentifiedFood, NutritionInfo, Alternative
from .scoring import to_number

def extract_json_candidate(content: str) -> Optional[str]:
    if not content:
        return None
    s = content.strip()
    if '```json' in s:
        s = s.split('```json')[1].split('```')[0].strip()
    elif '```' in s:
        s = s.split('```')[1].split('```')[0].strip()

    first = s.find('{')
    last = s.rfind('}')
    if first != -1 and last != -1 and last > first:
        return s[first:last + 1]
    return None

SYSTEM_INSTRUCTION = """You are a certified clinical nutritionist and computer vision nutrition specialist with access to USDA and international food databases. Analyze the food and provide PRECISE nutritional data per 100g serving.

If the image or input DOES NOT contain any edible food, drink, dish, or meal (e.g. an electronic device, furniture, pet, empty room, person without food, or random object):
Return ONLY:
{
  "isFood": false,
  "name": "Non-food item",
  "error": "No food detected in this image. Please provide a clear photo of food."
}

If the image or input CONTAINS food:
Return ONLY this JSON structure with realistic nutritional data per 100g serving:
{
  "isFood": true,
  "name": "specific food name with preparation style",
  "confidence": 0.95,
  "nutrition": {
    "calories": realistic_number,
    "protein": number_minimum_0.3,
    "carbs": number_minimum_0.5,
    "fat": number_minimum_0.1,
    "saturatedFat": number,
    "sugar": number,
    "fiber": number,
    "sodium": number_mg,
    "processingLevel": 0.1_to_1.0
  }
}

MANDATORY NUTRITION RULES (per 100g):
1. Never return 0 for protein, carbs, or fat unless it is pure oil or pure water.
2. Reference values per 100g:
   - Grains/Rice/Bread: protein 3-12g, carbs 20-75g, fat 0.5-5g, fiber 1-8g
   - Meat/Poultry/Fish: protein 15-30g, carbs 0-2g, fat 1-25g, fiber 0g
   - Vegetables: protein 1-5g, carbs 3-20g, fat 0.1-1g, fiber 1-5g
   - Fruits: protein 0.5-2g, carbs 8-25g, fat 0.1-1g, fiber 1-4g
   - Dairy/Yogurt: protein 3-25g, carbs 3-12g, fat 0.5-35g, fiber 0g
   - Snacks/Fried: protein 3-10g, carbs 40-70g, fat 15-40g, fiber 1-4g
   - Sweets/Desserts: protein 2-8g, carbs 40-80g, fat 5-30g, fiber 0.5-3g
   - Legumes/Beans: protein 5-25g, carbs 15-60g, fat 0.5-5g, fiber 5-15g"""

async def get_fast_gemini_models(api_key: str) -> List[str]:
    fallback_list = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash']
    try:
        async with httpx.AsyncClient(timeout=1.2) as client:
            res = await client.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}")
            if res.status_code == 200:
                data = res.json()
                models = data.get("models", [])
                discovered = [
                    m["name"].replace("models/", "")
                    for m in models
                    if "generateContent" in m.get("supportedGenerationMethods", [])
                    and "flash" in m.get("name", "")
                    and "tts" not in m.get("name", "")
                    and "transcribe" not in m.get("name", "")
                ]
                if discovered:
                    discovered.sort(key=lambda x: (
                        100 if x == 'gemini-3.6-flash' else
                        90 if x == 'gemini-3.7-flash' else
                        80 if x == 'gemini-3.8-flash' else 50
                    ), reverse=True)
                    return list(dict.fromkeys(discovered + fallback_list))
    except Exception:
        pass
    return fallback_list

def get_heuristic_nutrition(query: str) -> IdentifiedFood:
    q = query.lower()
    name = query.strip()
    nutrition = {
        "calories": 180.0, "protein": 8.0, "carbs": 22.0, "fat": 6.0,
        "saturatedFat": 1.5, "sugar": 4.0, "fiber": 3.0, "sodium": 220.0,
        "processingLevel": 0.3
    }

    if any(k in q for k in ['yogurt', 'curd', 'dahi']):
        name = 'Greek Yogurt with Fresh Fruit'
        nutrition = {"calories": 125, "protein": 13, "carbs": 12, "fat": 3.5, "saturatedFat": 1.5, "sugar": 9, "fiber": 1.5, "sodium": 45, "processingLevel": 0.2}
    elif any(k in q for k in ['smoothie', 'shake']):
        name = 'Fruit & Protein Smoothie'
        nutrition = {"calories": 140, "protein": 8, "carbs": 22, "fat": 2, "saturatedFat": 0.5, "sugar": 14, "fiber": 3.5, "sodium": 60, "processingLevel": 0.2}
    elif any(k in q for k in ['wings', 'crispy', 'fried chicken', 'butter chicken', 'nuggets', 'fast food']):
        name = 'Crispy Chicken Wings / Fried Chicken'
        nutrition = {"calories": 380, "protein": 19, "carbs": 22, "fat": 25, "saturatedFat": 8.0, "sugar": 3, "fiber": 1.0, "sodium": 820, "processingLevel": 0.8}
    elif any(k in q for k in ['chicken', 'turkey', 'tikka']):
        name = 'Grilled Chicken Breast with Rice'
        nutrition = {"calories": 165, "protein": 31, "carbs": 4, "fat": 3.6, "saturatedFat": 1, "sugar": 0, "fiber": 1, "sodium": 220, "processingLevel": 0.2}
    elif any(k in q for k in ['egg', 'omelette', 'omelet']):
        name = 'Egg Omelette with Vegetables'
        nutrition = {"calories": 154, "protein": 12, "carbs": 2.5, "fat": 10.5, "saturatedFat": 3, "sugar": 1, "fiber": 1, "sodium": 240, "processingLevel": 0.2}
    elif 'salad' in q:
        name = 'Fresh Garden Salad with Dressing'
        nutrition = {"calories": 95, "protein": 3, "carbs": 8, "fat": 6, "saturatedFat": 1, "sugar": 3, "fiber": 3.5, "sodium": 180, "processingLevel": 0.1}
    elif any(k in q for k in ['oat', 'oatmeal', 'porridge']):
        name = 'Oatmeal Porridge'
        nutrition = {"calories": 150, "protein": 6, "carbs": 27, "fat": 3, "saturatedFat": 0.5, "sugar": 2, "fiber": 4.5, "sodium": 80, "processingLevel": 0.1}
    elif any(k in q for k in ['salmon', 'fish', 'tuna']):
        name = 'Grilled Fish Fillet'
        nutrition = {"calories": 180, "protein": 26, "carbs": 0, "fat": 8, "saturatedFat": 1.5, "sugar": 0, "fiber": 0, "sodium": 190, "processingLevel": 0.2}
    elif any(k in q for k in ['nut', 'almond', 'walnut', 'seed']):
        name = 'Mixed Raw Nuts & Seeds'
        nutrition = {"calories": 580, "protein": 20, "carbs": 18, "fat": 50, "saturatedFat": 5, "sugar": 3, "fiber": 10, "sodium": 5, "processingLevel": 0.1}
    elif any(k in q for k in ['rice', 'biryani', 'pulao']):
        name = 'Steamed Rice Dish'
        nutrition = {"calories": 180, "protein": 4.5, "carbs": 36, "fat": 2.5, "saturatedFat": 0.5, "sugar": 0.5, "fiber": 2, "sodium": 210, "processingLevel": 0.3}
    elif any(k in q for k in ['burger', 'sandwich', 'wrap']):
        name = 'Meal Sandwich / Wrap'
        nutrition = {"calories": 250, "protein": 14, "carbs": 28, "fat": 10, "saturatedFat": 3, "sugar": 3, "fiber": 2.5, "sodium": 480, "processingLevel": 0.5}
    elif 'pizza' in q:
        name = 'Cheese & Vegetable Pizza'
        nutrition = {"calories": 270, "protein": 11, "carbs": 32, "fat": 11, "saturatedFat": 4.5, "sugar": 4, "fiber": 2.5, "sodium": 560, "processingLevel": 0.6}
    elif any(k in q for k in ['chip', 'crisp', 'snack', 'fries']):
        name = 'Fried Snack'
        nutrition = {"calories": 340, "protein": 4, "carbs": 45, "fat": 17, "saturatedFat": 5, "sugar": 2, "fiber": 3, "sodium": 460, "processingLevel": 0.8}

    return IdentifiedFood(
        name=name,
        confidence=0.90,
        nutrition=NutritionInfo(**nutrition)
    )

async def identify_food_with_ai(image: str) -> IdentifiedFood:
    api_key = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured")

    mime_type = "image/jpeg"
    base64_data = image

    if ';base64,' in image:
        parts = image.split(';base64,')
        header = parts[0]
        base64_data = parts[1] if len(parts) > 1 else ""
        if header.startswith('data:'):
            mime_type = header[5:] or "image/jpeg"
    elif image.startswith('data:'):
        comma_idx = image.find(',')
        if comma_idx != -1:
            header = image[:comma_idx]
            base64_data = image[comma_idx + 1:]
            if header.startswith('data:') and '/' in header:
                mime_type = header[5:].split(';')[0] or "image/jpeg"

    base64_data = re.sub(r'\s+', '', base64_data)
    models = await get_fast_gemini_models(api_key)
    content_text = ""
    error_logs = []

    async with httpx.AsyncClient(timeout=2.5) as client:
        for model in models:
            try:
                endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                payload = {
                    "contents": [{
                        "parts": [
                            {"text": f"{SYSTEM_INSTRUCTION}\n\nIdentify this food and provide accurate nutritional values per 100g in JSON format."},
                            {"inlineData": {"mimeType": mime_type, "data": base64_data}}
                        ]
                    }],
                    "generationConfig": {
                        "temperature": 0.2,
                        "responseMimeType": "application/json",
                        "maxOutputTokens": 800
                    }
                }
                res = await client.post(endpoint, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            content_text = parts[0].get("text", "")
                            if content_text:
                                break
                else:
                    error_logs.append(f"{model} ({res.status_code})")
            except Exception as e:
                error_logs.append(f"{model} ({str(e)})")

    if not content_text:
        if any("429" in e for e in error_logs):
            raise ValueError("Gemini API rate limit reached. Please wait a few seconds and try again.")
        raise ValueError(f"Food image identification failed: {' | '.join(error_logs)}")

    extracted = extract_json_candidate(content_text)
    if not extracted:
        raise ValueError("Could not extract nutritional profile from this image.")

    identified = json.loads(extracted)
    if identified.get("isFood") is False or identified.get("is_food") is False or re.search(r'no food|not food|non-food', str(identified.get("name", "")), re.I):
        raise ValueError("No food was detected in this photo. Please upload a clear photo of your meal or food item.")

    food_name = str(
        identified.get("name") or identified.get("foodName") or identified.get("food_name") or
        identified.get("dish") or identified.get("food") or identified.get("item") or ""
    ).strip()

    if not food_name or food_name.lower() in ["food item", "unknown food"]:
        raise ValueError("Could not recognize the food in this image. Please try a clearer angle or better lighting.")

    raw_nutrition = identified.get("nutrition") or identified.get("nutritionPer100g") or identified
    nutrition = {
        "calories": to_number(raw_nutrition.get("calories") or raw_nutrition.get("energy"), 150.0),
        "protein": to_number(raw_nutrition.get("protein") or raw_nutrition.get("proteins"), 5.0),
        "carbs": to_number(raw_nutrition.get("carbs") or raw_nutrition.get("carbohydrates"), 20.0),
        "fat": to_number(raw_nutrition.get("fat") or raw_nutrition.get("fats"), 5.0),
        "saturatedFat": to_number(raw_nutrition.get("saturatedFat"), 1.0),
        "sugar": to_number(raw_nutrition.get("sugar") or raw_nutrition.get("sugars"), 2.0),
        "fiber": to_number(raw_nutrition.get("fiber") or raw_nutrition.get("fibers"), 2.0),
        "sodium": to_number(raw_nutrition.get("sodium"), 150.0),
        "processingLevel": to_number(raw_nutrition.get("processingLevel"), 0.5),
    }

    return IdentifiedFood(
        name=food_name,
        confidence=to_number(identified.get("confidence"), 0.95),
        nutrition=NutritionInfo(**nutrition)
    )

async def identify_food_from_voice_query(query: str) -> IdentifiedFood:
    api_key = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')
    if not api_key:
        return get_heuristic_nutrition(query)

    models = await get_fast_gemini_models(api_key)
    content_text = ""

    async with httpx.AsyncClient(timeout=2.5) as client:
        for model in models:
            try:
                endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                payload = {
                    "contents": [{
                        "parts": [{
                            "text": f"{SYSTEM_INSTRUCTION}\n\nThe user said the following food/meal via voice:\n\"{query}\"\n\nIdentify the primary food item described, and provide accurate nutritional values per 100g in JSON format."
                        }]
                    }],
                    "generationConfig": {
                        "temperature": 0.2,
                        "responseMimeType": "application/json",
                        "maxOutputTokens": 800
                    }
                }
                res = await client.post(endpoint, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            content_text = parts[0].get("text", "")
                            if content_text:
                                break
            except Exception:
                pass

    if content_text:
        extracted = extract_json_candidate(content_text)
        if extracted:
            try:
                identified = json.loads(extracted)
                raw_nutrition = identified.get("nutrition") or identified.get("nutritionPer100g") or identified
                nutrition = {
                    "calories": to_number(raw_nutrition.get("calories") or raw_nutrition.get("energy"), 160.0),
                    "protein": to_number(raw_nutrition.get("protein") or raw_nutrition.get("proteins"), 5.0),
                    "carbs": to_number(raw_nutrition.get("carbs") or raw_nutrition.get("carbohydrates"), 20.0),
                    "fat": to_number(raw_nutrition.get("fat") or raw_nutrition.get("fats"), 5.0),
                    "saturatedFat": to_number(raw_nutrition.get("saturatedFat"), 1.0),
                    "sugar": to_number(raw_nutrition.get("sugar") or raw_nutrition.get("sugars"), 3.0),
                    "fiber": to_number(raw_nutrition.get("fiber") or raw_nutrition.get("fibers"), 2.0),
                    "sodium": to_number(raw_nutrition.get("sodium"), 250.0),
                    "processingLevel": to_number(raw_nutrition.get("processingLevel"), 0.4),
                }
                food_name = str(
                    identified.get("name") or identified.get("foodName") or identified.get("food_name") or
                    identified.get("dish") or identified.get("food") or query
                ).strip()

                return IdentifiedFood(
                    name=food_name,
                    confidence=to_number(identified.get("confidence"), 0.95),
                    nutrition=NutritionInfo(**nutrition)
                )
            except Exception:
                pass

    return get_heuristic_nutrition(query)

def generate_spoken_explanation(
    food_name: str,
    baseline_score: int,
    target_body_type: str,
    best_choice: Optional[Alternative],
    already_optimal: bool,
    dietary_warning: Optional[str] = None
) -> str:
    goal = (target_body_type or "athletic").replace("_", " ")

    if dietary_warning:
        if best_choice:
            top_benefit = (
                best_choice.reasons[0].actualChange
                if best_choice.reasons
                else (best_choice.benefits[0] if best_choice.benefits else "clean vegetarian macros")
            )
            return f"Heads up! ... You've selected a vegetarian or vegan diet preference, but {food_name} contains non-vegetarian or animal ingredients. ... For your {goal} goal, I recommend trying {best_choice.name}, which is 100% plant-friendly, healthier, and scores {best_choice.healthScore} out of 100! ... It provides {top_benefit}."
        return f"Heads up! ... You've selected a vegetarian diet preference, but {food_name} contains non-vegetarian ingredients. ... Please check the vegetarian alternatives below matching your {goal} goal."

    if already_optimal or not best_choice:
        return f"That's a fantastic choice! ... Based on our nutritional model for your {goal} goal, {food_name} scores {baseline_score} out of 100. ... It has a clean, well-balanced nutrient profile with minimal empty calories. ... No healthier swaps are needed in our database, so go right ahead and enjoy your meal!"

    score_gain = best_choice.healthScore - baseline_score
    top_benefit = (
        best_choice.reasons[0].actualChange
        if best_choice.reasons
        else (best_choice.benefits[0] if best_choice.benefits else "higher protein and cleaner macros")
    )

    return f"Got it! Let me check that for you. ... {food_name} currently scores around {baseline_score} out of 100 for your {goal} goal. ... Here is a great swap: ... I recommend trying {best_choice.name}, which boosts your health score to {best_choice.healthScore}, a gain of {score_gain} points! ... It provides {top_benefit}. ... Would you like to check out this alternative?"
