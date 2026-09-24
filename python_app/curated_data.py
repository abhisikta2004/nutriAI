from typing import Dict, List
from .models import NutritionInfo

class CuratedItem:
    def __init__(self, name: str, nutrition: Dict[str, float]):
        self.name = name
        self.nutrition = NutritionInfo(**nutrition)

# Meal-type specific alternatives for lunch/dinner and breakfast
meal_type_alternatives: Dict[str, List[CuratedItem]] = {
    'breakfast': [
        CuratedItem("Moong Dal Chilla with Mint Chutney", {
            "calories": 140, "protein": 9, "carbs": 18, "fat": 4, "saturatedFat": 0.5, "sugar": 2, "fiber": 4, "sodium": 220, "vitamins": 0.7, "processingLevel": 0.2
        }),
        CuratedItem("Tofu Scramble with Spinach & Whole Grain Toast", {
            "calories": 165, "protein": 15, "carbs": 14, "fat": 6, "saturatedFat": 0.8, "sugar": 2, "fiber": 4.5, "sodium": 240, "vitamins": 0.8, "processingLevel": 0.2
        }),
        CuratedItem("Oats Upma with Fresh Vegetables", {
            "calories": 180, "protein": 6, "carbs": 30, "fat": 5, "saturatedFat": 0.8, "sugar": 2, "fiber": 5, "sodium": 320, "vitamins": 0.7, "processingLevel": 0.2
        }),
        CuratedItem("Egg White Omelette with Spinach", {
            "calories": 120, "protein": 18, "carbs": 4, "fat": 3, "saturatedFat": 0.8, "sugar": 1, "fiber": 2, "sodium": 280, "vitamins": 0.9, "processingLevel": 0.2
        }),
        CuratedItem("Ragi Porridge with Almonds & Walnuts", {
            "calories": 160, "protein": 5, "carbs": 28, "fat": 4, "saturatedFat": 0.5, "sugar": 3, "fiber": 6, "sodium": 15, "vitamins": 0.8, "processingLevel": 0.1
        })
    ],
    'lunch-dinner': [
        CuratedItem("Paneer Tikka with Mint Salad & Multigrain Roti", {
            "calories": 270, "protein": 18, "carbs": 26, "fat": 11, "saturatedFat": 3.5, "sugar": 2, "fiber": 5.5, "sodium": 340, "vitamins": 0.8, "processingLevel": 0.2
        }),
        CuratedItem("Tofu & Broccoli Stir-Fry with Quinoa", {
            "calories": 215, "protein": 19, "carbs": 20, "fat": 7, "saturatedFat": 1.0, "sugar": 3, "fiber": 6.2, "sodium": 260, "vitamins": 0.9, "processingLevel": 0.2
        }),
        CuratedItem("Dal Tadka with Steamed Brown Rice", {
            "calories": 280, "protein": 14, "carbs": 45, "fat": 5, "saturatedFat": 0.8, "sugar": 3, "fiber": 10, "sodium": 420, "vitamins": 0.8, "processingLevel": 0.2
        }),
        CuratedItem("Palak Paneer with Multigrain Chapati", {
            "calories": 290, "protein": 16, "carbs": 30, "fat": 12, "saturatedFat": 4.0, "sugar": 2.5, "fiber": 7.0, "sodium": 360, "vitamins": 0.8, "processingLevel": 0.2
        }),
        CuratedItem("Grilled Tandoori Chicken with Salad", {
            "calories": 220, "protein": 32, "carbs": 6, "fat": 8, "saturatedFat": 2.0, "sugar": 2, "fiber": 3, "sodium": 380, "vitamins": 0.8, "processingLevel": 0.3
        }),
        CuratedItem("Grilled Fish with Steamed Vegetables", {
            "calories": 240, "protein": 30, "carbs": 12, "fat": 8, "saturatedFat": 1.5, "sugar": 4, "fiber": 5, "sodium": 350, "vitamins": 0.9, "processingLevel": 0.2
        }),
        CuratedItem("Chicken Tikka with Multigrain Roti", {
            "calories": 310, "protein": 28, "carbs": 28, "fat": 9, "saturatedFat": 2.0, "sugar": 2, "fiber": 4, "sodium": 450, "vitamins": 0.7, "processingLevel": 0.3
        })
    ]
}

# Curated alternatives categorized by food type
alternatives_by_category: Dict[str, List[CuratedItem]] = {
    'sweet': [
        CuratedItem("Dates & Nuts Ladoo", {
            "calories": 180, "protein": 4, "carbs": 28, "fat": 7, "saturatedFat": 1, "sugar": 18, "fiber": 4, "sodium": 5, "vitamins": 0.7, "processingLevel": 0.2
        }),
        CuratedItem("Dark Chocolate (85% Cacao)", {
            "calories": 598, "protein": 7.8, "carbs": 45.9, "fat": 42.6, "saturatedFat": 24.5, "sugar": 14, "fiber": 10.9, "sodium": 12, "vitamins": 0.7, "processingLevel": 0.3
        }),
        CuratedItem("Greek Yogurt with Honey", {
            "calories": 120, "protein": 12, "carbs": 12, "fat": 4, "saturatedFat": 2, "sugar": 10, "fiber": 0, "sodium": 45, "vitamins": 0.7, "processingLevel": 0.3
        }),
        CuratedItem("Frozen Banana Nice Cream", {
            "calories": 89, "protein": 1.1, "carbs": 22.8, "fat": 0.3, "saturatedFat": 0.1, "sugar": 12.2, "fiber": 2.6, "sodium": 1, "vitamins": 0.6, "processingLevel": 0.1
        })
    ],
    'sweet-biscuit': [
        CuratedItem("Oats & Honey Digestive Biscuits", {
            "calories": 420, "protein": 9, "carbs": 62, "fat": 14, "saturatedFat": 4, "sugar": 16, "fiber": 8, "sodium": 300, "vitamins": 0.6, "processingLevel": 0.4
        }),
        CuratedItem("Ragi Millet Cookies", {
            "calories": 400, "protein": 8, "carbs": 58, "fat": 13, "saturatedFat": 4, "sugar": 12, "fiber": 9, "sodium": 280, "vitamins": 0.7, "processingLevel": 0.4
        }),
        CuratedItem("Whole Wheat Marie Biscuits", {
            "calories": 380, "protein": 7, "carbs": 64, "fat": 9, "saturatedFat": 3, "sugar": 14, "fiber": 7, "sodium": 250, "vitamins": 0.5, "processingLevel": 0.4
        })
    ],
    'sweet-chocolate': [
        CuratedItem("Dark Chocolate (70% Cacao)", {
            "calories": 580, "protein": 7, "carbs": 46, "fat": 41, "saturatedFat": 23, "sugar": 18, "fiber": 9, "sodium": 15, "vitamins": 0.7, "processingLevel": 0.3
        }),
        CuratedItem("Protein Chocolate Bar", {
            "calories": 220, "protein": 18, "carbs": 20, "fat": 9, "saturatedFat": 4, "sugar": 5, "fiber": 8, "sodium": 140, "vitamins": 0.7, "processingLevel": 0.4
        }),
        CuratedItem("Almond Butter Dark Chocolate", {
            "calories": 280, "protein": 8, "carbs": 22, "fat": 18, "saturatedFat": 6, "sugar": 12, "fiber": 4, "sodium": 30, "vitamins": 0.7, "processingLevel": 0.3
        })
    ],
    'salty-snack': [
        CuratedItem("Seaweed Snacks (Roasted)", {
            "calories": 60, "protein": 3, "carbs": 6, "fat": 3, "saturatedFat": 0.5, "sugar": 1, "fiber": 2, "sodium": 180, "vitamins": 0.7, "processingLevel": 0.2
        }),
        CuratedItem("Air-Popped Popcorn", {
            "calories": 90, "protein": 3, "carbs": 18, "fat": 1, "saturatedFat": 0.2, "sugar": 0.5, "fiber": 4, "sodium": 80, "vitamins": 0.5, "processingLevel": 0.1
        }),
        CuratedItem("Edamame (Steamed)", {
            "calories": 121, "protein": 11, "carbs": 9, "fat": 5, "saturatedFat": 0.6, "sugar": 2, "fiber": 5, "sodium": 6, "vitamins": 0.8, "processingLevel": 0.1
        }),
        CuratedItem("Roasted Almonds (Unsalted)", {
            "calories": 170, "protein": 6, "carbs": 6, "fat": 15, "saturatedFat": 1.1, "sugar": 1, "fiber": 3, "sodium": 1, "vitamins": 0.7, "processingLevel": 0.1
        }),
        CuratedItem("Makhana (Roasted Fox Nuts)", {
            "calories": 120, "protein": 3, "carbs": 22, "fat": 2, "saturatedFat": 0.2, "sugar": 0.5, "fiber": 4, "sodium": 80, "vitamins": 0.7, "processingLevel": 0.2
        })
    ],
    'salty-chips': [
        CuratedItem("Sweet Potato Chips (Baked)", {
            "calories": 380, "protein": 4, "carbs": 62, "fat": 12, "saturatedFat": 1.2, "sugar": 6, "fiber": 5, "sodium": 240, "vitamins": 0.7, "processingLevel": 0.3
        }),
        CuratedItem("Beetroot Crisps (Air-Fried)", {
            "calories": 360, "protein": 5, "carbs": 58, "fat": 10, "saturatedFat": 1, "sugar": 8, "fiber": 6, "sodium": 200, "vitamins": 0.8, "processingLevel": 0.3
        }),
        CuratedItem("Kale Chips (Baked)", {
            "calories": 180, "protein": 6, "carbs": 22, "fat": 8, "saturatedFat": 1, "sugar": 2, "fiber": 5, "sodium": 150, "vitamins": 0.9, "processingLevel": 0.2
        }),
        CuratedItem("Quinoa Puffs", {
            "calories": 340, "protein": 8, "carbs": 55, "fat": 9, "saturatedFat": 1, "sugar": 2, "fiber": 4, "sodium": 180, "vitamins": 0.6, "processingLevel": 0.3
        })
    ],
    'beverage': [
        CuratedItem("Sparkling Water with Lemon", {
            "calories": 5, "protein": 0, "carbs": 1, "fat": 0, "saturatedFat": 0, "sugar": 0.5, "fiber": 0, "sodium": 10, "vitamins": 0.3, "processingLevel": 0.1
        }),
        CuratedItem("Kombucha (Low Sugar)", {
            "calories": 25, "protein": 0.5, "carbs": 6, "fat": 0, "saturatedFat": 0, "sugar": 4, "fiber": 0, "sodium": 10, "vitamins": 0.6, "processingLevel": 0.2
        }),
        CuratedItem("Herbal Tea (Unsweetened)", {
            "calories": 2, "protein": 0, "carbs": 0.5, "fat": 0, "saturatedFat": 0, "sugar": 0, "fiber": 0, "sodium": 5, "vitamins": 0.5, "processingLevel": 0.1
        }),
        CuratedItem("Fresh Vegetable Juice", {
            "calories": 40, "protein": 2, "carbs": 8, "fat": 0.2, "saturatedFat": 0, "sugar": 6, "fiber": 2, "sodium": 120, "vitamins": 0.9, "processingLevel": 0.2
        }),
        CuratedItem("Tender Coconut Water", {
            "calories": 19, "protein": 0.7, "carbs": 3.7, "fat": 0.2, "saturatedFat": 0, "sugar": 2.6, "fiber": 1.1, "sodium": 105, "vitamins": 0.9, "processingLevel": 0.1
        }),
        CuratedItem("Spiced Buttermilk (Chaas)", {
            "calories": 35, "protein": 2.5, "carbs": 3.5, "fat": 1, "saturatedFat": 0.6, "sugar": 2.5, "fiber": 0.2, "sodium": 140, "vitamins": 0.7, "processingLevel": 0.2
        })
    ],
    'fried': [
        CuratedItem("Oven-Roasted Cauliflower Bites", {
            "calories": 90, "protein": 4, "carbs": 12, "fat": 3, "saturatedFat": 0.3, "sugar": 3, "fiber": 4, "sodium": 180, "vitamins": 0.8, "processingLevel": 0.2
        }),
        CuratedItem("Baked Falafel", {
            "calories": 160, "protein": 8, "carbs": 18, "fat": 6, "saturatedFat": 0.8, "sugar": 2, "fiber": 5, "sodium": 280, "vitamins": 0.6, "processingLevel": 0.3
        }),
        CuratedItem("Zucchini Fritters (Air-Fried)", {
            "calories": 110, "protein": 5, "carbs": 14, "fat": 4, "saturatedFat": 0.5, "sugar": 3, "fiber": 3, "sodium": 200, "vitamins": 0.7, "processingLevel": 0.3
        })
    ],
    'fast-food': [
        CuratedItem("Grilled Chicken Sandwich (Whole Wheat)", {
            "calories": 280, "protein": 28, "carbs": 28, "fat": 7, "saturatedFat": 1.5, "sugar": 4, "fiber": 5, "sodium": 450, "vitamins": 0.6, "processingLevel": 0.4
        }),
        CuratedItem("Vegetable Wrap with Hummus", {
            "calories": 250, "protein": 10, "carbs": 35, "fat": 8, "saturatedFat": 1, "sugar": 5, "fiber": 8, "sodium": 380, "vitamins": 0.8, "processingLevel": 0.3
        }),
        CuratedItem("Grilled Paneer Tikka Wrap", {
            "calories": 320, "protein": 18, "carbs": 32, "fat": 13, "saturatedFat": 5, "sugar": 3, "fiber": 4, "sodium": 420, "vitamins": 0.7, "processingLevel": 0.3
        })
    ],
    'rice-dish': [
        CuratedItem("Brown Rice Vegetable Pulao", {
            "calories": 200, "protein": 5, "carbs": 38, "fat": 3, "saturatedFat": 0.5, "sugar": 2, "fiber": 5, "sodium": 280, "vitamins": 0.7, "processingLevel": 0.2
        }),
        CuratedItem("Quinoa Biryani", {
            "calories": 220, "protein": 9, "carbs": 35, "fat": 5, "saturatedFat": 0.8, "sugar": 3, "fiber": 6, "sodium": 350, "vitamins": 0.8, "processingLevel": 0.2
        }),
        CuratedItem("Millets Khichdi", {
            "calories": 180, "protein": 7, "carbs": 32, "fat": 3, "saturatedFat": 0.5, "sugar": 2, "fiber": 5, "sodium": 280, "vitamins": 0.8, "processingLevel": 0.2
        })
    ],
    'curry': [
        CuratedItem("Grilled Tandoori Chicken", {
            "calories": 180, "protein": 28, "carbs": 4, "fat": 6, "saturatedFat": 1.5, "sugar": 2, "fiber": 1, "sodium": 420, "vitamins": 0.7, "processingLevel": 0.3
        }),
        CuratedItem("Dal Tadka (Low Oil)", {
            "calories": 150, "protein": 10, "carbs": 22, "fat": 3, "saturatedFat": 0.5, "sugar": 2, "fiber": 8, "sodium": 320, "vitamins": 0.8, "processingLevel": 0.2
        }),
        CuratedItem("Grilled Fish Tikka", {
            "calories": 160, "protein": 26, "carbs": 4, "fat": 5, "saturatedFat": 1, "sugar": 1, "fiber": 1, "sodium": 380, "vitamins": 0.8, "processingLevel": 0.3
        })
    ],
    'pasta-noodles': [
        CuratedItem("Whole Wheat Pasta with Vegetables", {
            "calories": 280, "protein": 12, "carbs": 48, "fat": 5, "saturatedFat": 1, "sugar": 6, "fiber": 8, "sodium": 380, "vitamins": 0.7, "processingLevel": 0.3
        }),
        CuratedItem("Zucchini Noodles with Pesto", {
            "calories": 120, "protein": 5, "carbs": 8, "fat": 9, "saturatedFat": 2, "sugar": 4, "fiber": 3, "sodium": 280, "vitamins": 0.8, "processingLevel": 0.2
        }),
        CuratedItem("Soba Noodle Stir Fry", {
            "calories": 260, "protein": 10, "carbs": 42, "fat": 6, "saturatedFat": 1, "sugar": 4, "fiber": 4, "sodium": 400, "vitamins": 0.7, "processingLevel": 0.3
        })
    ],
    'breakfast_cat': [
        CuratedItem("Oats Idli with Sambar", {
            "calories": 140, "protein": 6, "carbs": 24, "fat": 2, "saturatedFat": 0.3, "sugar": 2, "fiber": 5, "sodium": 320, "vitamins": 0.7, "processingLevel": 0.2
        }),
        CuratedItem("Ragi Dosa with Chutney", {
            "calories": 160, "protein": 7, "carbs": 28, "fat": 3, "saturatedFat": 0.5, "sugar": 1, "fiber": 5, "sodium": 280, "vitamins": 0.8, "processingLevel": 0.2
        }),
        CuratedItem("Moong Dal Chilla", {
            "calories": 140, "protein": 9, "carbs": 18, "fat": 4, "saturatedFat": 0.5, "sugar": 2, "fiber": 4, "sodium": 220, "vitamins": 0.7, "processingLevel": 0.2
        })
    ],
    'general': [
        CuratedItem("Mixed Nuts & Seeds", {
            "calories": 580, "protein": 20, "carbs": 18, "fat": 50, "saturatedFat": 5, "sugar": 3, "fiber": 10, "sodium": 5, "vitamins": 0.8, "processingLevel": 0.1
        }),
        CuratedItem("Greek Yogurt with Berries", {
            "calories": 120, "protein": 14, "carbs": 12, "fat": 3, "saturatedFat": 1.5, "sugar": 8, "fiber": 2, "sodium": 50, "vitamins": 0.7, "processingLevel": 0.3
        }),
        CuratedItem("Fresh Fruit Bowl", {
            "calories": 80, "protein": 1, "carbs": 20, "fat": 0.3, "saturatedFat": 0, "sugar": 15, "fiber": 3, "sodium": 2, "vitamins": 0.9, "processingLevel": 0.1
        }),
        CuratedItem("Sprouted Moong Salad with Lemon & Herbs", {
            "calories": 110, "protein": 8, "carbs": 18, "fat": 1, "saturatedFat": 0.2, "sugar": 2, "fiber": 6, "sodium": 45, "vitamins": 0.9, "processingLevel": 0.1
        })
    ]
}
