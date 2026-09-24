import { NutritionInfo } from "./types.ts";

export interface CuratedItem {
  name: string;
  nutrition: NutritionInfo;
}

// Meal-type specific alternatives for lunch/dinner and breakfast
export const mealTypeAlternatives: Record<string, CuratedItem[]> = {
  'breakfast': [
    {
      name: "Moong Dal Chilla with Mint Chutney",
      nutrition: { calories: 140, protein: 9, carbs: 18, fat: 4, saturatedFat: 0.5, sugar: 2, fiber: 4, sodium: 220, vitamins: 0.7, processingLevel: 0.2 }
    },
    {
      name: "Tofu Scramble with Spinach & Whole Grain Toast",
      nutrition: { calories: 165, protein: 15, carbs: 14, fat: 6, saturatedFat: 0.8, sugar: 2, fiber: 4.5, sodium: 240, vitamins: 0.8, processingLevel: 0.2 }
    },
    {
      name: "Oats Upma with Fresh Vegetables",
      nutrition: { calories: 180, protein: 6, carbs: 30, fat: 5, saturatedFat: 0.8, sugar: 2, fiber: 5, sodium: 320, vitamins: 0.7, processingLevel: 0.2 }
    },
    {
      name: "Egg White Omelette with Spinach",
      nutrition: { calories: 120, protein: 18, carbs: 4, fat: 3, saturatedFat: 0.8, sugar: 1, fiber: 2, sodium: 280, vitamins: 0.9, processingLevel: 0.2 }
    },
    {
      name: "Ragi Porridge with Almonds & Walnuts",
      nutrition: { calories: 160, protein: 5, carbs: 28, fat: 4, saturatedFat: 0.5, sugar: 3, fiber: 6, sodium: 15, vitamins: 0.8, processingLevel: 0.1 }
    }
  ],
  'lunch-dinner': [
    {
      name: "Paneer Tikka with Mint Salad & Multigrain Roti",
      nutrition: { calories: 270, protein: 18, carbs: 26, fat: 11, saturatedFat: 3.5, sugar: 2, fiber: 5.5, sodium: 340, vitamins: 0.8, processingLevel: 0.2 }
    },
    {
      name: "Tofu & Broccoli Stir-Fry with Quinoa",
      nutrition: { calories: 215, protein: 19, carbs: 20, fat: 7, saturatedFat: 1.0, sugar: 3, fiber: 6.2, sodium: 260, vitamins: 0.9, processingLevel: 0.2 }
    },
    {
      name: "Dal Tadka with Steamed Brown Rice",
      nutrition: { calories: 280, protein: 14, carbs: 45, fat: 5, saturatedFat: 0.8, sugar: 3, fiber: 10, sodium: 420, vitamins: 0.8, processingLevel: 0.2 }
    },
    {
      name: "Palak Paneer with Multigrain Chapati",
      nutrition: { calories: 290, protein: 16, carbs: 30, fat: 12, saturatedFat: 4.0, sugar: 2.5, fiber: 7.0, sodium: 360, vitamins: 0.8, processingLevel: 0.2 }
    },
    {
      name: "Grilled Tandoori Chicken with Salad",
      nutrition: { calories: 220, protein: 32, carbs: 6, fat: 8, saturatedFat: 2.0, sugar: 2, fiber: 3, sodium: 380, vitamins: 0.8, processingLevel: 0.3 }
    },
    {
      name: "Grilled Fish with Steamed Vegetables",
      nutrition: { calories: 240, protein: 30, carbs: 12, fat: 8, saturatedFat: 1.5, sugar: 4, fiber: 5, sodium: 350, vitamins: 0.9, processingLevel: 0.2 }
    },
    {
      name: "Chicken Tikka with Multigrain Roti",
      nutrition: { calories: 310, protein: 28, carbs: 28, fat: 9, saturatedFat: 2.0, sugar: 2, fiber: 4, sodium: 450, vitamins: 0.7, processingLevel: 0.3 }
    }
  ]
};

// Curated alternatives categorized by food type
export const alternativesByCategory: Record<string, CuratedItem[]> = {
  sweet: [
    {
      name: "Dates & Nuts Ladoo",
      nutrition: { calories: 180, protein: 4, carbs: 28, fat: 7, saturatedFat: 1, sugar: 18, fiber: 4, sodium: 5, vitamins: 0.7, processingLevel: 0.2 }
    },
    {
      name: "Dark Chocolate (85% Cacao)",
      nutrition: { calories: 598, protein: 7.8, carbs: 45.9, fat: 42.6, saturatedFat: 24.5, sugar: 14, fiber: 10.9, sodium: 12, vitamins: 0.7, processingLevel: 0.3 }
    },
    {
      name: "Greek Yogurt with Honey",
      nutrition: { calories: 120, protein: 12, carbs: 12, fat: 4, saturatedFat: 2, sugar: 10, fiber: 0, sodium: 45, vitamins: 0.7, processingLevel: 0.3 }
    },
    {
      name: "Frozen Banana Nice Cream",
      nutrition: { calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, saturatedFat: 0.1, sugar: 12.2, fiber: 2.6, sodium: 1, vitamins: 0.6, processingLevel: 0.1 }
    }
  ],
  'sweet-biscuit': [
    {
      name: "Oats & Honey Digestive Biscuits",
      nutrition: { calories: 420, protein: 9, carbs: 62, fat: 14, saturatedFat: 4, sugar: 16, fiber: 8, sodium: 300, vitamins: 0.6, processingLevel: 0.4 }
    },
    {
      name: "Ragi Millet Cookies",
      nutrition: { calories: 400, protein: 8, carbs: 58, fat: 13, saturatedFat: 4, sugar: 12, fiber: 9, sodium: 280, vitamins: 0.7, processingLevel: 0.4 }
    },
    {
      name: "Whole Wheat Marie Biscuits",
      nutrition: { calories: 380, protein: 7, carbs: 64, fat: 9, saturatedFat: 3, sugar: 14, fiber: 7, sodium: 250, vitamins: 0.5, processingLevel: 0.4 }
    }
  ],
  'sweet-chocolate': [
    {
      name: "Dark Chocolate (70% Cacao)",
      nutrition: { calories: 580, protein: 7, carbs: 46, fat: 41, saturatedFat: 23, sugar: 18, fiber: 9, sodium: 15, vitamins: 0.7, processingLevel: 0.3 }
    },
    {
      name: "Protein Chocolate Bar",
      nutrition: { calories: 220, protein: 18, carbs: 20, fat: 9, saturatedFat: 4, sugar: 5, fiber: 8, sodium: 140, vitamins: 0.7, processingLevel: 0.4 }
    },
    {
      name: "Almond Butter Dark Chocolate",
      nutrition: { calories: 280, protein: 8, carbs: 22, fat: 18, saturatedFat: 6, sugar: 12, fiber: 4, sodium: 30, vitamins: 0.7, processingLevel: 0.3 }
    }
  ],
  'salty-snack': [
    {
      name: "Seaweed Snacks (Roasted)",
      nutrition: { calories: 60, protein: 3, carbs: 6, fat: 3, saturatedFat: 0.5, sugar: 1, fiber: 2, sodium: 180, vitamins: 0.7, processingLevel: 0.2 }
    },
    {
      name: "Air-Popped Popcorn",
      nutrition: { calories: 90, protein: 3, carbs: 18, fat: 1, saturatedFat: 0.2, sugar: 0.5, fiber: 4, sodium: 80, vitamins: 0.5, processingLevel: 0.1 }
    },
    {
      name: "Edamame (Steamed)",
      nutrition: { calories: 121, protein: 11, carbs: 9, fat: 5, saturatedFat: 0.6, sugar: 2, fiber: 5, sodium: 6, vitamins: 0.8, processingLevel: 0.1 }
    },
    {
      name: "Roasted Almonds (Unsalted)",
      nutrition: { calories: 170, protein: 6, carbs: 6, fat: 15, saturatedFat: 1.1, sugar: 1, fiber: 3, sodium: 1, vitamins: 0.7, processingLevel: 0.1 }
    }
  ],
  'salty-chips': [
    {
      name: "Sweet Potato Chips (Baked)",
      nutrition: { calories: 380, protein: 4, carbs: 62, fat: 12, saturatedFat: 1.2, sugar: 6, fiber: 5, sodium: 240, vitamins: 0.7, processingLevel: 0.3 }
    },
    {
      name: "Beetroot Crisps (Air-Fried)",
      nutrition: { calories: 360, protein: 5, carbs: 58, fat: 10, saturatedFat: 1, sugar: 8, fiber: 6, sodium: 200, vitamins: 0.8, processingLevel: 0.3 }
    },
    {
      name: "Kale Chips (Baked)",
      nutrition: { calories: 180, protein: 6, carbs: 22, fat: 8, saturatedFat: 1, sugar: 2, fiber: 5, sodium: 150, vitamins: 0.9, processingLevel: 0.2 }
    },
    {
      name: "Quinoa Puffs",
      nutrition: { calories: 340, protein: 8, carbs: 55, fat: 9, saturatedFat: 1, sugar: 2, fiber: 4, sodium: 180, vitamins: 0.6, processingLevel: 0.3 }
    }
  ],
  beverage: [
    {
      name: "Sparkling Water with Lemon",
      nutrition: { calories: 5, protein: 0, carbs: 1, fat: 0, saturatedFat: 0, sugar: 0.5, fiber: 0, sodium: 10, vitamins: 0.3, processingLevel: 0.1 }
    },
    {
      name: "Kombucha (Low Sugar)",
      nutrition: { calories: 25, protein: 0.5, carbs: 6, fat: 0, saturatedFat: 0, sugar: 4, fiber: 0, sodium: 10, vitamins: 0.6, processingLevel: 0.2 }
    },
    {
      name: "Herbal Tea (Unsweetened)",
      nutrition: { calories: 2, protein: 0, carbs: 0.5, fat: 0, saturatedFat: 0, sugar: 0, fiber: 0, sodium: 5, vitamins: 0.5, processingLevel: 0.1 }
    },
    {
      name: "Fresh Vegetable Juice",
      nutrition: { calories: 40, protein: 2, carbs: 8, fat: 0.2, saturatedFat: 0, sugar: 6, fiber: 2, sodium: 120, vitamins: 0.9, processingLevel: 0.2 }
    }
  ],
  fried: [
    {
      name: "Oven-Roasted Cauliflower Bites",
      nutrition: { calories: 90, protein: 4, carbs: 12, fat: 3, saturatedFat: 0.3, sugar: 3, fiber: 4, sodium: 180, vitamins: 0.8, processingLevel: 0.2 }
    },
    {
      name: "Baked Falafel",
      nutrition: { calories: 160, protein: 8, carbs: 18, fat: 6, saturatedFat: 0.8, sugar: 2, fiber: 5, sodium: 280, vitamins: 0.6, processingLevel: 0.3 }
    },
    {
      name: "Zucchini Fritters (Air-Fried)",
      nutrition: { calories: 110, protein: 5, carbs: 14, fat: 4, saturatedFat: 0.5, sugar: 3, fiber: 3, sodium: 200, vitamins: 0.7, processingLevel: 0.3 }
    }
  ],
  'fast-food': [
    {
      name: "Grilled Chicken Sandwich (Whole Wheat)",
      nutrition: { calories: 280, protein: 28, carbs: 28, fat: 7, saturatedFat: 1.5, sugar: 4, fiber: 5, sodium: 450, vitamins: 0.6, processingLevel: 0.4 }
    },
    {
      name: "Vegetable Wrap with Hummus",
      nutrition: { calories: 250, protein: 10, carbs: 35, fat: 8, saturatedFat: 1, sugar: 5, fiber: 8, sodium: 380, vitamins: 0.8, processingLevel: 0.3 }
    },
    {
      name: "Grilled Paneer Tikka Wrap",
      nutrition: { calories: 320, protein: 18, carbs: 32, fat: 13, saturatedFat: 5, sugar: 3, fiber: 4, sodium: 420, vitamins: 0.7, processingLevel: 0.3 }
    }
  ],
  'rice-dish': [
    {
      name: "Brown Rice Vegetable Pulao",
      nutrition: { calories: 200, protein: 5, carbs: 38, fat: 3, saturatedFat: 0.5, sugar: 2, fiber: 5, sodium: 280, vitamins: 0.7, processingLevel: 0.2 }
    },
    {
      name: "Quinoa Biryani",
      nutrition: { calories: 220, protein: 9, carbs: 35, fat: 5, saturatedFat: 0.8, sugar: 3, fiber: 6, sodium: 350, vitamins: 0.8, processingLevel: 0.2 }
    },
    {
      name: "Millets Khichdi",
      nutrition: { calories: 180, protein: 7, carbs: 32, fat: 3, saturatedFat: 0.5, sugar: 2, fiber: 5, sodium: 280, vitamins: 0.8, processingLevel: 0.2 }
    }
  ],
  'curry': [
    {
      name: "Grilled Tandoori Chicken",
      nutrition: { calories: 180, protein: 28, carbs: 4, fat: 6, saturatedFat: 1.5, sugar: 2, fiber: 1, sodium: 420, vitamins: 0.7, processingLevel: 0.3 }
    },
    {
      name: "Dal Tadka (Low Oil)",
      nutrition: { calories: 150, protein: 10, carbs: 22, fat: 3, saturatedFat: 0.5, sugar: 2, fiber: 8, sodium: 320, vitamins: 0.8, processingLevel: 0.2 }
    },
    {
      name: "Grilled Fish Tikka",
      nutrition: { calories: 160, protein: 26, carbs: 4, fat: 5, saturatedFat: 1, sugar: 1, fiber: 1, sodium: 380, vitamins: 0.8, processingLevel: 0.3 }
    }
  ],
  'pasta-noodles': [
    {
      name: "Whole Wheat Pasta with Vegetables",
      nutrition: { calories: 280, protein: 12, carbs: 48, fat: 5, saturatedFat: 1, sugar: 6, fiber: 8, sodium: 380, vitamins: 0.7, processingLevel: 0.3 }
    },
    {
      name: "Zucchini Noodles with Pesto",
      nutrition: { calories: 120, protein: 5, carbs: 8, fat: 9, saturatedFat: 2, sugar: 4, fiber: 3, sodium: 280, vitamins: 0.8, processingLevel: 0.2 }
    },
    {
      name: "Soba Noodle Stir Fry",
      nutrition: { calories: 260, protein: 10, carbs: 42, fat: 6, saturatedFat: 1, sugar: 4, fiber: 4, sodium: 400, vitamins: 0.7, processingLevel: 0.3 }
    }
  ],
  'breakfast': [
    {
      name: "Oats Idli with Sambar",
      nutrition: { calories: 140, protein: 6, carbs: 24, fat: 2, saturatedFat: 0.3, sugar: 2, fiber: 5, sodium: 320, vitamins: 0.7, processingLevel: 0.2 }
    },
    {
      name: "Ragi Dosa with Chutney",
      nutrition: { calories: 160, protein: 7, carbs: 28, fat: 3, saturatedFat: 0.5, sugar: 1, fiber: 5, sodium: 280, vitamins: 0.8, processingLevel: 0.2 }
    },
    {
      name: "Moong Dal Chilla",
      nutrition: { calories: 140, protein: 9, carbs: 18, fat: 4, saturatedFat: 0.5, sugar: 2, fiber: 4, sodium: 220, vitamins: 0.7, processingLevel: 0.2 }
    }
  ],
  general: [
    {
      name: "Mixed Nuts & Seeds",
      nutrition: { calories: 580, protein: 20, carbs: 18, fat: 50, saturatedFat: 5, sugar: 3, fiber: 10, sodium: 5, vitamins: 0.8, processingLevel: 0.1 }
    },
    {
      name: "Greek Yogurt with Berries",
      nutrition: { calories: 120, protein: 14, carbs: 12, fat: 3, saturatedFat: 1.5, sugar: 8, fiber: 2, sodium: 50, vitamins: 0.7, processingLevel: 0.3 }
    },
    {
      name: "Fresh Fruit Bowl",
      nutrition: { calories: 80, protein: 1, carbs: 20, fat: 0.3, saturatedFat: 0, sugar: 15, fiber: 3, sodium: 2, vitamins: 0.9, processingLevel: 0.1 }
    }
  ]
};
