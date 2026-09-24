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
 * Calculates customized feature weight multipliers based on the user's (currentBodyType -> targetBodyType) transition.
 * 
 * Feature order: [Calories, Protein, Carbs, Fat, SatFat, Sugar, Fiber, Sodium, Processing]
 */
export function getGoalTransitionMultipliers(targetBodyType?: string, currentBodyType?: string): number[] {
  const target = (targetBodyType || 'athletic').toLowerCase();
  const current = (currentBodyType || 'average').toLowerCase();

  // Numerical scale to assess weight direction: thin(1) < average(2) < athletic(2.5) < overweight(4) < obese(5)
  const bodyRank: Record<string, number> = {
    thin: 1,
    average: 2,
    athletic: 2.5,
    muscle_gain: 2.8,
    overweight: 4,
    obese: 5,
    weight_loss: 1.5,
    maintenance: 2
  };

  const currentRank = bodyRank[current] ?? 2;
  const targetRank = bodyRank[target] ?? 2.5;

  // Case 1: Extreme / High Weight Gain (e.g. thin -> obese, thin -> overweight, average -> obese)
  // Desires caloric surplus, carb richness, healthy fats, and high nutrient density.
  if (currentRank <= 2 && targetRank >= 4) {
    return [-0.3, 1.5, -1.8, -0.6, 0.5, 0.6, 1.2, 0.9, 0.9];
  }

  // Case 2: Moderate Healthy Weight Gain (e.g. thin -> average, thin -> athletic/muscle_gain)
  if (currentRank === 1 && targetRank > 1) {
    return [0.2, 1.5, -1.2, -0.3, 0.7, 0.8, 1.3, 0.9, 0.9];
  }

  // Case 3: Bulking / Muscle Gain from average
  if (target === 'muscle_gain' || (current === 'average' && target === 'athletic')) {
    return [0.6, 1.6, 0.6, 0.7, 1.0, 1.0, 1.3, 1.0, 1.1];
  }

  // Case 4: Aggressive Weight Loss / Fat Cutting (e.g. obese -> thin/athletic/average, overweight -> thin)
  if (currentRank >= 4 && targetRank <= 2.5) {
    return [1.7, 1.4, 1.4, 1.5, 1.6, 1.7, 1.8, 1.3, 1.1];
  }

  // Case 5: Moderate Weight Loss (e.g. overweight -> average/athletic, average -> thin)
  if (currentRank > targetRank) {
    return [1.4, 1.3, 1.2, 1.3, 1.4, 1.5, 1.5, 1.2, 1.0];
  }

  // Case 6: Athletic Recomposition
  if (target === 'athletic') {
    return [0.9, 1.5, 0.9, 0.9, 1.1, 1.1, 1.3, 1.0, 1.1];
  }

  // Case 7: Maintenance / Balanced Default
  return [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
}

export function getGoalMultipliers(targetBodyType?: string, currentBodyType?: string): number[] {
  return getGoalTransitionMultipliers(targetBodyType, currentBodyType);
}

// Calculate basic health score for training labels & rule-based fallback
export function calculateBasicHealthScore(
  nutriments: any, 
  targetBodyType: string = 'athletic',
  currentBodyType: string = 'average'
): number {
  const calories = toNumber(nutriments['energy-kcal_100g'] ?? (nutriments.energy_100g ? nutriments.energy_100g / 4.184 : 0) ?? nutriments.calories, 0);
  const protein = toNumber(nutriments.proteins_100g ?? nutriments.protein, 0);
  const fiber = toNumber(nutriments.fiber_100g ?? nutriments.fiber, 0);
  const carbs = toNumber(nutriments.carbohydrates_100g ?? nutriments.carbs, 0);
  const fat = toNumber(nutriments.fat_100g ?? nutriments.fat, 0);
  const saturatedFat = toNumber(nutriments['saturated-fat_100g'] ?? nutriments.saturatedFat, 0);
  const sugar = toNumber(nutriments.sugars_100g ?? nutriments.sugar, 0);
  const processingLevel = toNumber(nutriments.processingLevel, 0.3);
  
  const rawSodium = toNumber(nutriments.sodium_100g ?? nutriments.sodium, 0);
  const sodium = rawSodium < 20 && rawSodium > 0 ? rawSodium * 1000 : rawSodium;
  
  const mult = getGoalTransitionMultipliers(targetBodyType, currentBodyType);
  const isGaining = (currentBodyType === 'thin' && ['obese', 'overweight', 'average', 'athletic'].includes(targetBodyType)) ||
                    (['overweight', 'obese'].includes(targetBodyType) && currentBodyType !== 'obese');

  let score = 55;
  
  // Positive factors
  score += Math.min(25, protein * 1.5) * Math.max(0.5, mult[1]);
  score += Math.min(20, fiber * 2.5) * Math.max(0.5, mult[6]);

  if (isGaining) {
    // Reward healthy carbs and fats for weight gain goals
    score += Math.min(18, carbs * 0.4);
    score += Math.min(15, fat * 0.6);
    if (calories >= 300 && calories <= 700) {
      score += 10; // Caloric density bonus for bulking
    }
  }

  // Low processing bonus
  if (processingLevel <= 0.3) {
    score += 15 * Math.max(0.5, mult[8]);
  } else if (processingLevel > 0.6) {
    score -= 15 * Math.max(0.5, mult[8]);
  }

  // Low calorie & low sugar bonus (for non-bulking)
  if (!isGaining && calories < 120 && sugar < 12 && saturatedFat < 1) {
    score += 12;
  }
  
  // Negative factors (moderated for bulking, strict for cutting)
  const calThreshold = isGaining ? 650 : 350;
  const fatThreshold = isGaining ? 30 : 15;
  
  if (calories > calThreshold && mult[0] > 0) {
    score -= Math.min(25, ((calories - calThreshold) / 15)) * mult[0];
  }
  if (fat > fatThreshold && mult[3] > 0) {
    score -= Math.min(20, ((fat - fatThreshold) * 1.0)) * mult[3];
  }
  if (saturatedFat > 3) {
    score -= Math.min(20, ((saturatedFat - 3) * 2.0)) * Math.max(0.5, mult[4]);
  }
  if (sugar > 12) {
    score -= Math.min(25, ((sugar - 12) * 1.0)) * Math.max(0.5, mult[5]);
  }
  if (sodium > 300) {
    score -= Math.min(15, ((sodium - 300) / 50)) * Math.max(0.5, mult[7]);
  }
  
  return Math.max(5, Math.min(98, Math.round(score)));
}

export const CALIBRATED_BASE_WEIGHTS = [-14.0, 28.0, -6.0, -10.0, -18.0, -24.0, 30.0, -10.0, -20.0];
export const CALIBRATED_BASE_BIAS = 65.0;

/**
 * Smooth asymptotic compression curve preventing flat score saturation at upper (98) and lower (5) bounds.
 * Generates natural, continuous, and distinguishable scores for every suggestion.
 */
export function smoothHealthScore(rawScore: number): number {
  if (rawScore > 80.0) {
    return 80.0 + 18.0 * (1.0 - Math.exp(-(rawScore - 80.0) / 22.0));
  } else if (rawScore < 20.0) {
    return 20.0 - 15.0 * (1.0 - Math.exp(-(20.0 - rawScore) / 15.0));
  }
  return rawScore;
}

// Calculate health score using calibrated ML model with transition-specific weighting
export async function calculateHealthScore(
  nutrition: NutritionInfo, 
  targetBodyType: string = 'athletic',
  currentBodyType: string = 'average'
): Promise<number> {
  const multipliers = getGoalTransitionMultipliers(targetBodyType, currentBodyType);
  
  // Features normalized for scoring: [Calories, Protein, Carbs, Fat, SatFat, Sugar, Fiber, Sodium, Processing]
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
  
  // Apply goal multipliers to weights for combination-specific scoring
  let raw = CALIBRATED_BASE_BIAS;
  for (let i = 0; i < features.length; i++) {
    const effectiveWeight = CALIBRATED_BASE_WEIGHTS[i] * (multipliers[i] ?? 1.0);
    raw += effectiveWeight * features[i];
  }
  const smoothed = smoothHealthScore(raw);
  return Math.max(5.0, Math.min(98.0, Math.round(smoothed * 10) / 10));
}
