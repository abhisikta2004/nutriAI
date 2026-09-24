import { IdentifiedFood, DetailedLogInput } from "./types.ts";
import { toNumber } from "./scoring.ts";

export interface PieceFoodNutrition {
  weight: number;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface IngredientNutrition {
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  unit: 'g' | 'ml' | 'piece' | 'tbsp' | 'tsp' | 'cup';
}

export const PIECE_BASED_FOODS: Record<string, PieceFoodNutrition> = {
  'egg': { weight: 50, cal: 78, protein: 6.3, carbs: 0.6, fat: 5.3, fiber: 0, sugar: 0.6, sodium: 62 },
  'boiled egg': { weight: 50, cal: 78, protein: 6.3, carbs: 0.6, fat: 5.3, fiber: 0, sugar: 0.6, sodium: 62 },
  'fried egg': { weight: 55, cal: 92, protein: 6.3, carbs: 0.6, fat: 7.3, fiber: 0, sugar: 0.6, sodium: 92 },
  'omelette': { weight: 65, cal: 95, protein: 7, carbs: 1, fat: 7.5, fiber: 0, sugar: 0.5, sodium: 120 },
  'poori': { weight: 30, cal: 100, protein: 2, carbs: 13, fat: 5, fiber: 0.5, sugar: 0.5, sodium: 80 },
  'puri': { weight: 30, cal: 100, protein: 2, carbs: 13, fat: 5, fiber: 0.5, sugar: 0.5, sodium: 80 },
  'roti': { weight: 35, cal: 85, protein: 3, carbs: 18, fat: 0.5, fiber: 1.2, sugar: 0.3, sodium: 120 },
  'chapati': { weight: 35, cal: 85, protein: 3, carbs: 18, fat: 0.5, fiber: 1.2, sugar: 0.3, sodium: 120 },
  'paratha': { weight: 60, cal: 180, protein: 4, carbs: 25, fat: 8, fiber: 1, sugar: 0.5, sodium: 250 },
  'naan': { weight: 90, cal: 262, protein: 9, carbs: 45, fat: 5, fiber: 2, sugar: 3, sodium: 418 },
  'idli': { weight: 40, cal: 58, protein: 2, carbs: 12, fat: 0.2, fiber: 0.5, sugar: 0.3, sodium: 40 },
  'dosa': { weight: 80, cal: 133, protein: 3.9, carbs: 21, fat: 3.7, fiber: 1, sugar: 0.5, sodium: 95 },
  'samosa': { weight: 50, cal: 150, protein: 3, carbs: 15, fat: 9, fiber: 1, sugar: 1, sodium: 180 },
  'pakora': { weight: 25, cal: 75, protein: 2, carbs: 7, fat: 5, fiber: 0.5, sugar: 0.3, sodium: 120 },
  'vada': { weight: 40, cal: 120, protein: 3, carbs: 12, fat: 7, fiber: 0.8, sugar: 0.5, sodium: 150 },
  'chicken leg': { weight: 110, cal: 220, protein: 24, carbs: 0, fat: 14, fiber: 0, sugar: 0, sodium: 85 },
  'chicken breast': { weight: 120, cal: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74 },
  'chicken wing': { weight: 35, cal: 80, protein: 7, carbs: 0, fat: 6, fiber: 0, sugar: 0, sodium: 55 },
  'chicken thigh': { weight: 85, cal: 180, protein: 20, carbs: 0, fat: 11, fiber: 0, sugar: 0, sodium: 70 },
  'fish fillet': { weight: 100, cal: 120, protein: 22, carbs: 0, fat: 3, fiber: 0, sugar: 0, sodium: 80 },
  'mutton piece': { weight: 85, cal: 180, protein: 18, carbs: 0, fat: 12, fiber: 0, sugar: 0, sodium: 75 },
  'prawn': { weight: 10, cal: 10, protein: 2, carbs: 0, fat: 0.2, fiber: 0, sugar: 0, sodium: 15 },
  'shrimp': { weight: 10, cal: 10, protein: 2, carbs: 0, fat: 0.2, fiber: 0, sugar: 0, sodium: 15 },
  'crab': { weight: 100, cal: 97, protein: 19, carbs: 0, fat: 1.5, fiber: 0, sugar: 0, sodium: 330 },
  'lobster': { weight: 100, cal: 89, protein: 19, carbs: 0, fat: 0.9, fiber: 0, sugar: 0, sodium: 380 },
  'tikka': { weight: 40, cal: 65, protein: 8, carbs: 1, fat: 3, fiber: 0, sugar: 0.5, sodium: 120 },
  'kebab': { weight: 50, cal: 85, protein: 9, carbs: 2, fat: 4.5, fiber: 0.3, sugar: 0.5, sodium: 150 },
  'momo': { weight: 25, cal: 45, protein: 2.5, carbs: 6, fat: 1.5, fiber: 0.3, sugar: 0.2, sodium: 85 },
  'dumpling': { weight: 25, cal: 45, protein: 2.5, carbs: 6, fat: 1.5, fiber: 0.3, sugar: 0.2, sodium: 85 },
  'spring roll': { weight: 40, cal: 90, protein: 2, carbs: 10, fat: 5, fiber: 0.5, sugar: 0.5, sodium: 130 },
  'cutlet': { weight: 60, cal: 130, protein: 5, carbs: 12, fat: 7, fiber: 1, sugar: 0.5, sodium: 180 },
  'kachori': { weight: 45, cal: 160, protein: 3, carbs: 18, fat: 9, fiber: 1, sugar: 1, sodium: 200 },
};

export const INGREDIENT_NUTRITION: Record<string, IngredientNutrition> = {
  'banana': { cal: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12, sodium: 1, unit: 'piece' },
  'mango': { cal: 60, protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6, sugar: 14, sodium: 1, unit: 'piece' },
  'apple': { cal: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10, sodium: 1, unit: 'piece' },
  'orange': { cal: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, sugar: 9, sodium: 0, unit: 'piece' },
  'strawberry': { cal: 32, protein: 0.7, carbs: 8, fat: 0.3, fiber: 2, sugar: 5, sodium: 1, unit: 'piece' },
  'milk': { cal: 42, protein: 3.4, carbs: 5, fat: 1, fiber: 0, sugar: 5, sodium: 44, unit: 'ml' },
  'cream': { cal: 340, protein: 2.1, carbs: 2.8, fat: 37, fiber: 0, sugar: 2.8, sodium: 34, unit: 'tbsp' },
  'sugar': { cal: 387, protein: 0, carbs: 100, fat: 0, fiber: 0, sugar: 100, sodium: 0, unit: 'tsp' },
  'honey': { cal: 304, protein: 0.3, carbs: 82, fat: 0, fiber: 0.2, sugar: 82, sodium: 4, unit: 'tbsp' },
  'oil': { cal: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0, sodium: 0, unit: 'tbsp' },
  'ghee': { cal: 900, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0, sodium: 0, unit: 'tsp' },
  'butter': { cal: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0, sugar: 0.1, sodium: 576, unit: 'tbsp' },
  'rice': { cal: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0, sodium: 1, unit: 'cup' },
  'potato': { cal: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2, sugar: 0.8, sodium: 6, unit: 'g' },
  'paneer': { cal: 265, protein: 18, carbs: 1.2, fat: 21, fiber: 0, sugar: 1.2, sodium: 15, unit: 'g' },
  'cheese': { cal: 402, protein: 25, carbs: 1.3, fat: 33, fiber: 0, sugar: 0.5, sodium: 621, unit: 'g' },
  'yogurt': { cal: 59, protein: 3.5, carbs: 3.6, fat: 3.3, fiber: 0, sugar: 3.6, sodium: 46, unit: 'g' },
  'curd': { cal: 59, protein: 3.5, carbs: 3.6, fat: 3.3, fiber: 0, sugar: 3.6, sodium: 46, unit: 'g' },
  'fruits': { cal: 60, protein: 0.8, carbs: 15, fat: 0.3, fiber: 2, sugar: 12, sodium: 1, unit: 'piece' },
  'dressing': { cal: 150, protein: 0.3, carbs: 5, fat: 15, fiber: 0, sugar: 4, sodium: 280, unit: 'tbsp' },
  'sauce': { cal: 50, protein: 0.5, carbs: 10, fat: 0.3, fiber: 0.5, sugar: 8, sodium: 350, unit: 'tbsp' },
  'mayo': { cal: 94, protein: 0.1, carbs: 0.4, fat: 10, fiber: 0, sugar: 0.1, sodium: 88, unit: 'tbsp' },
  'mayonnaise': { cal: 94, protein: 0.1, carbs: 0.4, fat: 10, fiber: 0, sugar: 0.1, sodium: 88, unit: 'tbsp' },
  'ketchup': { cal: 17, protein: 0.2, carbs: 4, fat: 0, fiber: 0, sugar: 3.5, sodium: 154, unit: 'tbsp' },
};

export const UNIT_MULTIPLIERS: Record<string, number> = {
  'g': 0.01,      // nutrition per 100g, so 1g = 0.01
  'ml': 0.01,     // same as grams for liquids
  'piece': 1,     // per piece (e.g., 1 banana)
  'tbsp': 0.15,   // ~15g per tablespoon
  'tsp': 0.05,    // ~5g per teaspoon
  'cup': 2.4,     // ~240g per cup
};

export interface DetailedLogResult {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalSugar: number;
  totalSodium: number;
  servingInfo: string;
}

export function processDetailedLog(
  identified: IdentifiedFood,
  detailedLog?: DetailedLogInput
): DetailedLogResult {
  let totalCalories = identified.nutrition.calories;
  let totalProtein = identified.nutrition.protein;
  let totalCarbs = identified.nutrition.carbs;
  let totalFat = identified.nutrition.fat;
  let totalFiber = identified.nutrition.fiber || 0;
  let totalSugar = identified.nutrition.sugar || 0;
  let totalSodium = identified.nutrition.sodium || 0;
  let servingInfo = "per 100g";

  if (!detailedLog || typeof detailedLog !== 'object') {
    return {
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      totalFiber,
      totalSugar,
      totalSodium,
      servingInfo
    };
  }

  const weight = toNumber(detailedLog.weight, 100);
  const pieces = toNumber(detailedLog.pieces, 1);
  const foodLower = identified.name.toLowerCase();

  let isPieceBased = false;
  for (const [food, nutrition] of Object.entries(PIECE_BASED_FOODS)) {
    if (foodLower.includes(food)) {
      isPieceBased = true;
      const effectivePieces = pieces > 0 ? pieces : 1;
      totalCalories = nutrition.cal * effectivePieces;
      totalProtein = nutrition.protein * effectivePieces;
      totalCarbs = nutrition.carbs * effectivePieces;
      totalFat = nutrition.fat * effectivePieces;
      totalFiber = nutrition.fiber * effectivePieces;
      totalSugar = nutrition.sugar * effectivePieces;
      totalSodium = nutrition.sodium * effectivePieces;
      servingInfo = `${effectivePieces} piece${effectivePieces > 1 ? 's' : ''}`;
      console.log(`Piece-based calculation for ${food}: ${effectivePieces} pieces`);
      break;
    }
  }

  // If not piece-based, calculate from weight
  if (!isPieceBased && weight > 0) {
    const multiplier = weight / 100;
    totalCalories = identified.nutrition.calories * multiplier;
    totalProtein = identified.nutrition.protein * multiplier;
    totalCarbs = identified.nutrition.carbs * multiplier;
    totalFat = identified.nutrition.fat * multiplier;
    totalFiber = (identified.nutrition.fiber || 0) * multiplier;
    totalSugar = (identified.nutrition.sugar || 0) * multiplier;
    totalSodium = (identified.nutrition.sodium || 0) * multiplier;
    servingInfo = `${weight}g serving`;
    console.log(`Weight-based calculation: ${weight}g, multiplier: ${multiplier}`);

    if (pieces > 1) {
      servingInfo += ` (${pieces} pieces)`;
    }
  }

  // Handle custom ingredients from detailed log
  const customIngredients = detailedLog.customIngredients;
  if (customIngredients && Array.isArray(customIngredients) && customIngredients.length > 0) {
    console.log('Processing custom ingredients:', JSON.stringify(customIngredients));

    for (const ing of customIngredients) {
      if (!ing || typeof ing !== 'object') continue;

      const ingName = String(ing.name || '').toLowerCase();
      const ingQty = toNumber(ing.quantity, 0);

      if (ingQty <= 0) continue;

      for (const [ingredient, nutrition] of Object.entries(INGREDIENT_NUTRITION)) {
        if (ingName.includes(ingredient)) {
          const baseMultiplier = UNIT_MULTIPLIERS[nutrition.unit] || 1;
          const effectiveMultiplier = ingQty * baseMultiplier;

          totalCalories += nutrition.cal * effectiveMultiplier;
          totalProtein += nutrition.protein * effectiveMultiplier;
          totalCarbs += nutrition.carbs * effectiveMultiplier;
          totalFat += nutrition.fat * effectiveMultiplier;
          totalFiber += nutrition.fiber * effectiveMultiplier;
          totalSugar += nutrition.sugar * effectiveMultiplier;
          totalSodium += nutrition.sodium * effectiveMultiplier;

          console.log(`Added ingredient ${ingredient}: ${ingQty} ${nutrition.unit}, multiplier: ${effectiveMultiplier}`);
          break;
        }
      }
    }
  }

  return {
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    totalFiber,
    totalSugar,
    totalSodium,
    servingInfo
  };
}
