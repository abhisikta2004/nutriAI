from typing import List, Dict

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
