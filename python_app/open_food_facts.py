import asyncio
import httpx
from typing import List, Dict, Any, Optional
from urllib.parse import quote
from .scoring import to_number, get_processing_level, calculate_basic_health_score

HEADERS = {
    'User-Agent': 'NutriAI-FoodHealthAdvisor-Python/1.0',
    'Accept': 'application/json',
}

async def safe_fetch_json(url: str, retries: int = 1, delay_s: float = 0.2, timeout_s: float = 3.0) -> Optional[Dict[str, Any]]:
    last_error = None
    for attempt in range(retries + 1):
        try:
            async with httpx.AsyncClient(timeout=timeout_s) as client:
                res = await client.get(url, headers=HEADERS)
                if res.status_code == 200:
                    return res.json()
                elif res.status_code in (429, 500, 502, 503, 504):
                    last_error = Exception(f"Server returned {res.status_code}")
                else:
                    return None
        except Exception as e:
            last_error = e
        if attempt < retries:
            await asyncio.sleep(delay_s * (2 ** attempt))
    return None

async def search_open_food_facts(query: str) -> List[Dict[str, Any]]:
    url = f"https://world.openfoodfacts.org/cgi/search.pl?search_terms={quote(query)}&countries=India&json=1&page_size=8"
    try:
        data = await safe_fetch_json(url, retries=0, timeout_s=1.5)
        if data and isinstance(data, dict):
            return data.get("products", [])
    except Exception as e:
        print(f"Open Food Facts search skipped for '{query}': {e}")
    return []

async def fetch_training_data() -> List[Dict[str, Any]]:
    categories = ['vegetables', 'legumes', 'whole-grains', 'fruits', 'nuts', 'dairy', 'snacks', 'beverages']
    urls = [
        f"https://world.openfoodfacts.org/cgi/search.pl?search_terms={quote(cat)}&countries=India&json=1&page_size=20"
        for cat in categories
    ]
    
    tasks = [safe_fetch_json(u, retries=1, timeout_s=2.5) for u in urls]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    all_data: List[Dict[str, Any]] = []
    for res in results:
        if not isinstance(res, dict) or not res.get("products"):
            continue
        for product in res["products"]:
            nutriments = product.get("nutriments")
            if not nutriments:
                continue
            
            raw_sodium = to_number(nutriments.get("sodium_100g") or nutriments.get("sodium"), 0.0)
            sodium_mg = raw_sodium * 1000.0 if 0 < raw_sodium < 20 else raw_sodium
            
            cal = to_number(
                nutriments.get("energy-kcal_100g") or 
                (float(nutriments.get("energy_100g", 0)) / 4.184 if nutriments.get("energy_100g") else None),
                0.0
            )
            prot = to_number(nutriments.get("proteins_100g"), 0.0)
            carbs = to_number(nutriments.get("carbohydrates_100g"), 0.0)
            fat = to_number(nutriments.get("fat_100g"), 0.0)
            sat_fat = to_number(nutriments.get("saturated-fat_100g"), 0.0)
            sugar = to_number(nutriments.get("sugars_100g"), 0.0)
            fiber = to_number(nutriments.get("fiber_100g"), 0.0)
            proc_lvl = get_processing_level(product)
            
            if cal <= 5 and prot <= 0.1 and carbs <= 0.1:
                continue
                
            nutrition = {
                "calories": cal,
                "protein": prot,
                "carbs": carbs,
                "fat": fat,
                "saturatedFat": sat_fat,
                "sugar": sugar,
                "fiber": fiber,
                "sodium": sodium_mg,
                "processingLevel": proc_lvl,
                "healthScore": calculate_basic_health_score({
                    "calories": cal,
                    "protein": prot,
                    "fiber": fiber,
                    "fat": fat,
                    "saturatedFat": sat_fat,
                    "sugar": sugar,
                    "sodium": sodium_mg,
                    "processingLevel": proc_lvl
                }, "athletic")
            }
            all_data.append(nutrition)
            
    return all_data
