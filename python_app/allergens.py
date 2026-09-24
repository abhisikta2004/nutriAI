import re
from typing import List, Dict, Optional

ALLERGEN_KEYWORDS: Dict[str, List[str]] = {
    'dairy': ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'paneer', 'ghee', 'whey', 'casein', 'lactose', 'curd', 'kheer', 'kulfi', 'lassi', 'raita', 'malai', 'rabri', 'basundi', 'ice cream', 'milkshake', 'latte', 'cappuccino', 'mozzarella', 'cheddar', 'parmesan', 'ricotta'],
    'milk': ['milk', 'dairy', 'cheese', 'butter', 'cream', 'yogurt', 'paneer', 'ghee', 'whey', 'casein', 'lactose', 'curd', 'kheer', 'kulfi', 'lassi', 'raita', 'malai', 'ice cream', 'milkshake', 'latte', 'cappuccino'],
    'lactose': ['milk', 'dairy', 'cheese', 'butter', 'cream', 'yogurt', 'paneer', 'curd', 'ice cream', 'lassi', 'kheer', 'kulfi', 'milkshake'],
    'eggs': ['egg', 'mayonnaise', 'meringue', 'albumin', 'omelette', 'omelet', 'scrambled', 'fried egg', 'boiled egg', 'egg curry', 'egg bhurji', 'cake', 'custard', 'pudding', 'french toast', 'pancake', 'waffle', 'brioche', 'quiche'],
    'egg': ['egg', 'mayonnaise', 'meringue', 'omelette', 'omelet', 'scrambled', 'cake', 'custard', 'pudding', 'pancake', 'waffle', 'quiche'],
    'peanuts': ['peanut', 'groundnut', 'monkey nut', 'satay', 'pad thai', 'peanut butter', 'chikki'],
    'peanut': ['peanut', 'groundnut', 'peanut butter', 'satay', 'chikki'],
    'tree nuts': ['almond', 'walnut', 'cashew', 'pistachio', 'hazelnut', 'macadamia', 'pecan', 'chestnut', 'brazil nut', 'pine nut', 'badam', 'kaju', 'pista', 'akhrot'],
    'nuts': ['almond', 'walnut', 'cashew', 'pistachio', 'hazelnut', 'macadamia', 'pecan', 'peanut', 'groundnut', 'badam', 'kaju', 'pista', 'akhrot', 'chikki', 'praline', 'marzipan', 'nougat'],
    'almond': ['almond', 'badam', 'marzipan', 'macaroon', 'frangipane'],
    'cashew': ['cashew', 'kaju', 'kaju katli', 'kaju barfi'],
    'walnut': ['walnut', 'akhrot', 'brownie'],
    'pistachio': ['pistachio', 'pista', 'kulfi'],
    'soy': ['soy', 'soya', 'tofu', 'tempeh', 'edamame', 'miso', 'soy sauce', 'soy milk', 'soybean'],
    'soya': ['soy', 'soya', 'tofu', 'tempeh', 'edamame', 'miso', 'soy sauce', 'soy milk'],
    'wheat': ['wheat', 'bread', 'flour', 'pasta', 'noodle', 'roti', 'chapati', 'naan', 'paratha', 'poori', 'puri', 'kulcha', 'bhatura', 'samosa', 'pakora', 'pizza', 'cake', 'cookie', 'biscuit', 'cracker', 'tortilla', 'couscous', 'semolina', 'suji', 'maida', 'atta'],
    'gluten': ['wheat', 'barley', 'rye', 'oats', 'bread', 'pasta', 'noodle', 'cereal', 'beer', 'pizza', 'cake', 'cookie', 'biscuit', 'roti', 'chapati', 'naan', 'paratha', 'samosa', 'pakora'],
    'fish': ['fish', 'salmon', 'tuna', 'cod', 'sardine', 'anchovy', 'mackerel', 'trout', 'tilapia', 'bass', 'herring', 'halibut', 'pomfret', 'rohu', 'hilsa', 'surmai', 'bangda', 'rawas', 'fish curry', 'fish fry'],
    'shellfish': ['shrimp', 'prawn', 'crab', 'lobster', 'oyster', 'mussel', 'clam', 'scallop', 'squid', 'calamari', 'octopus', 'jhinga', 'kolambi'],
    'seafood': ['fish', 'shrimp', 'prawn', 'crab', 'lobster', 'oyster', 'mussel', 'clam', 'scallop', 'squid', 'salmon', 'tuna', 'pomfret', 'surmai', 'rawas'],
    'prawn': ['prawn', 'shrimp', 'jhinga', 'kolambi'],
    'shrimp': ['shrimp', 'prawn', 'jhinga'],
    'crab': ['crab', 'crabmeat'],
    'sesame': ['sesame', 'tahini', 'hummus', 'til', 'gingelly', 'sesame oil', 'til chikki'],
    'mustard': ['mustard', 'sarson', 'rai'],
    'celery': ['celery', 'celeriac'],
    'sulphites': ['wine', 'dried fruit', 'pickles', 'vinegar'],
    'lupin': ['lupin', 'lupini'],
    'molluscs': ['oyster', 'mussel', 'clam', 'scallop', 'squid', 'octopus', 'snail'],
    'non-veg': ['chicken', 'mutton', 'lamb', 'beef', 'pork', 'fish', 'prawn', 'shrimp', 'crab', 'egg', 'meat', 'bacon', 'ham', 'sausage', 'kebab', 'tikka', 'tandoori', 'biryani chicken', 'butter chicken', 'fish curry'],
    'meat': ['chicken', 'mutton', 'lamb', 'beef', 'pork', 'meat', 'bacon', 'ham', 'sausage', 'kebab'],
    'chicken': ['chicken', 'poultry', 'butter chicken', 'chicken curry', 'chicken tikka', 'tandoori chicken', 'chicken biryani', 'chicken nuggets', 'fried chicken'],
    'spicy': ['chili', 'chilli', 'pepper', 'spicy', 'hot sauce', 'wasabi', 'horseradish'],
}

FOOD_ALLERGEN_MAP: Dict[str, List[str]] = {
    'butter chicken': ['dairy', 'lactose', 'chicken'],
    'paneer': ['dairy', 'lactose', 'milk'],
    'cheese': ['dairy', 'lactose', 'milk'],
    'pizza': ['dairy', 'wheat', 'gluten', 'cheese'],
    'pasta': ['wheat', 'gluten'],
    'naan': ['wheat', 'gluten', 'dairy'],
    'cake': ['wheat', 'gluten', 'eggs', 'dairy'],
    'ice cream': ['dairy', 'lactose', 'milk'],
    'biryani': ['wheat', 'gluten'],
    'samosa': ['wheat', 'gluten'],
    'pakora': ['wheat', 'gluten'],
    'mayonnaise': ['eggs', 'egg'],
    'custard': ['eggs', 'dairy', 'milk'],
    'kheer': ['dairy', 'milk', 'nuts'],
    'gulab jamun': ['dairy', 'wheat', 'milk'],
    'jalebi': ['wheat', 'gluten'],
    'kulfi': ['dairy', 'milk', 'nuts'],
    'lassi': ['dairy', 'milk', 'lactose'],
    'raita': ['dairy', 'milk'],
    'malai kofta': ['dairy', 'nuts'],
    'korma': ['dairy', 'nuts'],
    'fish curry': ['fish', 'seafood'],
    'prawn': ['shellfish', 'seafood', 'prawn'],
    'shrimp': ['shellfish', 'seafood', 'shrimp'],
    'egg curry': ['eggs', 'egg'],
    'omelette': ['eggs', 'egg'],
    'french toast': ['eggs', 'wheat', 'dairy'],
    'pancake': ['eggs', 'wheat', 'dairy'],
}

NON_VEG_INDICATORS = [
    'chicken', 'mutton', 'lamb', 'beef', 'pork', 'bacon', 'ham', 'sausage', 'meat',
    'fish', 'salmon', 'tuna', 'pomfret', 'rohu', 'hilsa', 'surmai', 'bangda', 'rawas', 'cod', 'tilapia', 'seafood',
    'prawn', 'shrimp', 'crab', 'lobster', 'squid', 'calamari', 'octopus', 'jhinga', 'kolambi',
    'egg', 'eggs', 'omelette', 'omelet', 'egg bhurji', 'egg curry',
    'duck', 'turkey', 'poultry', 'pepperoni', 'prosciutto', 'salami',
    'chicken tikka', 'mutton tikka', 'fish tikka', 'chicken kebab', 'mutton kebab', 
    'seekh kebab', 'shami kebab', 'boti kebab', 'galouti kebab',
    'tandoori chicken', 'butter chicken', 'chicken biryani', 'mutton biryani', 'fish curry', 'fish fry'
]

NON_VEGAN_INDICATORS = NON_VEG_INDICATORS + [
    'milk', 'dairy', 'cheese', 'paneer', 'butter', 'ghee', 'cream', 'yogurt', 'curd',
    'malai', 'rabri', 'kheer', 'kulfi', 'lassi', 'raita', 'whey', 'casein', 'lactose',
    'honey', 'ice cream', 'mayonnaise', 'custard'
]

VEG_EXCLUSIONS = ['paneer', 'tofu', 'soya', 'soy', 'veg', 'vegetarian', 'mushroom', 'corn', 'aloo', 'gobhi', 'palak', 'dal']

def detect_allergens(food_name: str, user_allergies: List[str]) -> List[str]:
    allergen_warnings = []
    food_name_lower = food_name.lower()

    for allergy in user_allergies:
        allergy_lower = allergy.lower().strip()
        if not allergy_lower:
            continue

        if allergy_lower in food_name_lower:
            if allergy not in allergen_warnings:
                allergen_warnings.append(allergy)
            continue

        keywords = ALLERGEN_KEYWORDS.get(allergy_lower, [])
        matched = False
        for kw in keywords:
            if kw.lower() in food_name_lower:
                if allergy not in allergen_warnings:
                    allergen_warnings.append(allergy)
                matched = True
                break
        if matched:
            continue

        for food_item, contained in FOOD_ALLERGEN_MAP.items():
            if food_item in food_name_lower:
                if allergy_lower in contained or any(a in allergy_lower or allergy_lower in a for a in contained):
                    if allergy not in allergen_warnings:
                        allergen_warnings.append(allergy)
                    break

    return allergen_warnings

def detect_dietary_conflict(food_name: str, diet_preference: str) -> Optional[str]:
    if not diet_preference or not food_name:
        return None
        
    pref = diet_preference.lower().strip()
    lower_name = food_name.lower()

    # If preference is vegetarian or veg
    if pref in ['veg', 'vegetarian', 'lacto-vegetarian', 'ovo-lacto-vegetarian']:
        for item in NON_VEG_INDICATORS:
            # Check for word boundary or keyword match
            if re.search(r'\b' + re.escape(item) + r'\b', lower_name) or item in lower_name:
                # Guard against false positives like "veg kebab" or "paneer tikka"
                if any(f"{exc} {item}" in lower_name or f"{exc}-{item}" in lower_name for exc in VEG_EXCLUSIONS):
                    continue
                return f'Dietary Conflict: "{food_name}" contains Non-Vegetarian ingredients ({item}) which does not match your Vegetarian diet preference.'
                
    # If preference is vegan
    elif pref in ['vegan', 'plant-based']:
        for item in NON_VEGAN_INDICATORS:
            if re.search(r'\b' + re.escape(item) + r'\b', lower_name) or item in lower_name:
                if any(f"{exc} {item}" in lower_name or f"{exc}-{item}" in lower_name for exc in ['vegan', 'plant-based', 'dairy-free', 'soy', 'almond', 'oat', 'coconut']):
                    continue
                return f'Dietary Conflict: "{food_name}" contains Animal/Dairy ingredients ({item}) which does not match your Vegan diet preference.'

    return None
