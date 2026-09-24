import { NutritionInfo } from "./types.ts";
import { ensureModelTrained } from "./model.ts";

export function toNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

// Estimate processing level from product data
export function getProcessingLevel(product: any): number {
  const ingredients = product.ingredients_text?.toLowerCase() || '';
  const categories = product.categories?.toLowerCase() || '';
  
  let score = 0.5;
  
  if (ingredients.includes('preservative') || ingredients.includes('artificial')) score += 0.2;
  if (ingredients.includes('color') || ingredients.includes('flavoring')) score += 0.15;
  if (categories.includes('fresh') || categories.includes('raw')) score -= 0.3;
  if (categories.includes('organic')) score -= 0.2;
  if (categories.includes('processed') || categories.includes('ultra-processed')) score += 0.3;
  
  return Math.max(0.1, Math.min(1.0, score));
}

/**
 * Goal-specific feature weight multipliers based on user targetBodyType.
 * Adjusts the linear regression weights and feature contributions to align with individual fitness goals:
 * 
 * Multiplier Matrix:
 * Feature index order: [Calories, Protein, Carbs, Fat, SatFat, Sugar, Fiber, Sodium, Processing]
 * - athletic:     [0.9,      1.4,     1.0,   1.0, 1.1,    1.1,   1.2,   1.0,    1.0] -> Upweights protein (1.4x) & fiber (1.2x); allows moderate calories for muscle growth.
 * - muscle_gain:  [0.9,      1.4,     1.0,   1.0, 1.1,    1.1,   1.2,   1.0,    1.0] -> Synonym for athletic.
 * - thin:         [1.3,      1.1,     1.1,   1.1, 1.2,    1.3,   1.3,   1.1,    1.0] -> Emphasizes calorie/sugar restriction and fiber for lean definition.
 * - weight_loss:  [1.3,      1.1,     1.1,   1.1, 1.2,    1.3,   1.3,   1.1,    1.0] -> Synonym for thin/fat-loss.
 * - overweight:   [1.4,      1.1,     1.1,   1.2, 1.3,    1.4,   1.3,   1.2,    1.0] -> Stronger calorie/sugar/fat penalty to support metabolic health.
 * - obese:        [1.4,      1.1,     1.1,   1.2, 1.3,    1.4,   1.3,   1.2,    1.0] -> Strongest calorie/sugar/fat penalty.
 * - average:      [1.0,      1.0,     1.0,   1.0, 1.0,    1.0,   1.0,   1.0,    1.0] -> Base model weights unchanged (maintenance).
 * - maintenance:  [1.0,      1.0,     1.0,   1.0, 1.0,    1.0,   1.0,   1.0,    1.0] -> Synonym for average.
 */
export const GOAL_FEATURE_MULTIPLIERS: Record<string, number[]> = {
  athletic:    [0.9, 1.4, 1.0, 1.0, 1.1, 1.1, 1.2, 1.0, 1.0],
  muscle_gain: [0.9, 1.4, 1.0, 1.0, 1.1, 1.1, 1.2, 1.0, 1.0],
  thin:        [1.3, 1.1, 1.1, 1.1, 1.2, 1.3, 1.3, 1.1, 1.0],
  weight_loss: [1.3, 1.1, 1.1, 1.1, 1.2, 1.3, 1.3, 1.1, 1.0],
  overweight:  [1.4, 1.1, 1.1, 1.2, 1.3, 1.4, 1.3, 1.2, 1.0],
  obese:       [1.4, 1.1, 1.1, 1.2, 1.3, 1.4, 1.3, 1.2, 1.0],
  average:     [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
  maintenance: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
};

export function getGoalMultipliers(targetBodyType?: string): number[] {
  const key = (targetBodyType || 'athletic').toLowerCase();
  return GOAL_FEATURE_MULTIPLIERS[key] || GOAL_FEATURE_MULTIPLIERS.athletic;
}

// Calculate basic health score for training labels & rule-based fallback
export function calculateBasicHealthScore(nutriments: any, targetBodyType: string = 'athletic'): number {
  const calories = toNumber(nutriments['energy-kcal_100g'] ?? (nutriments.energy_100g ? nutriments.energy_100g / 4.184 : 0) ?? nutriments.calories, 0);
  const protein = toNumber(nutriments.proteins_100g ?? nutriments.protein, 0);
  const fiber = toNumber(nutriments.fiber_100g ?? nutriments.fiber, 0);
  const fat = toNumber(nutriments.fat_100g ?? nutriments.fat, 0);
  const saturatedFat = toNumber(nutriments['saturated-fat_100g'] ?? nutriments.saturatedFat, 0);
  const sugar = toNumber(nutriments.sugars_100g ?? nutriments.sugar, 0);
  const processingLevel = toNumber(nutriments.processingLevel, 0.3);
  
  // Note: Open Food Facts sodium_100g is in grams; if < 20 and > 0, convert to mg. Otherwise assume mg.
  const rawSodium = toNumber(nutriments.sodium_100g ?? nutriments.sodium, 0);
  const sodium = rawSodium < 20 && rawSodium > 0 ? rawSodium * 1000 : rawSodium;
  
  const mult = getGoalMultipliers(targetBodyType);
  let score = 55;
  
  // Positive factors (proportional, continuous benefits)
  score += Math.min(25, protein * 1.5) * mult[1]; // Protein bonus up to +25
  score += Math.min(20, fiber * 2.5) * mult[6];   // Fiber bonus up to +20

  // Low processing & whole food bonus
  if (processingLevel <= 0.3) {
    score += 15 * mult[8];
  } else if (processingLevel > 0.6) {
    score -= 15 * mult[8];
  }

  // Low calorie & low sugar profile bonus (fresh fruits/vegetables/smoothies)
  if (calories < 120 && sugar < 12 && saturatedFat < 1) {
    score += 12;
  }
  
  // Negative factors (proportional penalties)
  if (calories > 350) score -= Math.min(25, ((calories - 350) / 15)) * mult[0];
  if (fat > 15) score -= Math.min(20, ((fat - 15) * 1.0)) * mult[3];
  if (saturatedFat > 3) score -= Math.min(20, ((saturatedFat - 3) * 2.0)) * mult[4];
  if (sugar > 12) score -= Math.min(25, ((sugar - 12) * 1.0)) * mult[5];
  if (sodium > 300) score -= Math.min(15, ((sodium - 300) / 50)) * mult[7];
  
  return Math.max(5, Math.min(98, Math.round(score)));
}

// Calculate health score using trained ML model or fallback with goal-specific weighting
export async function calculateHealthScore(nutrition: NutritionInfo, targetBodyType: string = 'athletic'): Promise<number> {
  const model = await ensureModelTrained();
  const multipliers = getGoalMultipliers(targetBodyType);
  
  if (model && model.weights && model.weights.length >= 9) {
    // Features normalized for scoring
    const features = [
      (nutrition.calories || 0) / 600,
      (nutrition.protein || 0) / 30,
      (nutrition.carbs || 0) / 100,
      (nutrition.fat || 0) / 40,
      (nutrition.saturatedFat || 0) / 20,
      (nutrition.sugar || 0) / 50,
      (nutrition.fiber || 0) / 15,
      (nutrition.sodium || 0) / 2000,
      nutrition.processingLevel ?? 0.5
    ];
    
    // Apply goal multipliers to weights for target-specific scoring
    let score = model.bias;
    for (let i = 0; i < features.length; i++) {
      const effectiveWeight = model.weights[i] * (multipliers[i] ?? 1.0);
      score += effectiveWeight * features[i];
    }
    return Math.max(5, Math.min(98, Math.round(score * 10) / 10));
  }
  
  // Fallback to rule-based scoring with goal adjustments if model not available
  return calculateBasicHealthScore({
    'energy-kcal_100g': nutrition.calories,
    'proteins_100g': nutrition.protein,
    'fat_100g': nutrition.fat,
    'saturated-fat_100g': nutrition.saturatedFat,
    'sugars_100g': nutrition.sugar,
    'fiber_100g': nutrition.fiber,
    'sodium': nutrition.sodium
  }, targetBodyType);
}
