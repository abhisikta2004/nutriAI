import { Alternative, NutritionInfo } from "./types.ts";
import { ensureModelTrained } from "./model.ts";
import { calculateHealthScore, toNumber } from "./scoring.ts";
import { calculateFeatureImportance } from "./explain.ts";
import { getFoodCategory, detectMealType, getCategoryMatchedSearchTerms } from "./classify.ts";
import { searchOpenFoodFacts } from "./openFoodFacts.ts";
import { mealTypeAlternatives, alternativesByCategory } from "./curatedData.ts";

// Normalize name for deduplication (handles variations like "Grilled Chicken" vs "grilled chicken breast")
export function normalizeName(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 2)  // Take first 2 words for similarity matching
    .join(' ');
}

// Check if a name is similar to any in the seen set
export function isSimilarToSeen(name: string, seenNames: Set<string>): boolean {
  const normalizedNew = normalizeName(name);
  
  for (const seen of seenNames) {
    const normalizedSeen = normalizeName(seen);
    // Check if names share the same first 2 significant words
    if (normalizedNew === normalizedSeen) return true;
    // Also check if one contains the other
    if (normalizedNew.includes(normalizedSeen) || normalizedSeen.includes(normalizedNew)) return true;
  }
  return false;
}

// Curated alternatives as fallback (organized by category AND meal type)
export async function getCuratedAlternatives(
  baselineFood: { identifiedFood: string; nutritionInfo: NutritionInfo }, 
  category: string = 'general', 
  mealType: string = 'any',
  targetBodyType: string = 'athletic',
  baselineScore: number = 0
): Promise<Alternative[]> {
  const name = (baselineFood?.identifiedFood || '').toLowerCase();
  let key = category;

  // Determine specific subcategory
  if (category === 'salty-snack' && name.includes('chip')) {
    key = 'salty-chips';
  } else if (category === 'sweet' && (name.includes('biscuit') || name.includes('cookie'))) {
    key = 'sweet-biscuit';
  } else if (category === 'sweet' && name.includes('chocolate')) {
    key = 'sweet-chocolate';
  }

  // For lunch/dinner items, prefer meal-type specific alternatives
  let alternatives: any[];
  if (mealType === 'lunch-dinner' && mealTypeAlternatives['lunch-dinner']) {
    alternatives = mealTypeAlternatives['lunch-dinner'];
  } else if (mealType === 'breakfast' && (alternativesByCategory['breakfast'] || mealTypeAlternatives['breakfast'])) {
    alternatives = alternativesByCategory['breakfast'] || mealTypeAlternatives['breakfast'];
  } else {
    alternatives = alternativesByCategory[key] || alternativesByCategory[category] || alternativesByCategory.general;
  }

  const model = await ensureModelTrained();
  
  const evaluated = await Promise.all(alternatives.map(async alt => {
    const score = await calculateHealthScore(alt.nutrition, targetBodyType);
    const reasons = calculateFeatureImportance(baselineFood.nutritionInfo, alt.nutrition, model, targetBodyType);

    return {
      name: alt.name,
      healthScore: Math.round(score),
      benefits: [
        `${Math.round(alt.nutrition.protein)}g protein per 100g`,
        `${Math.round(alt.nutrition.fiber)}g fiber per 100g`,
        `${Math.round(alt.nutrition.calories)} calories per 100g`
      ],
      reasons: reasons.length > 0 ? reasons : [
        {
          factor: "Overall Nutrition",
          explanation: "Better nutritional profile for health",
          actualChange: "Improved nutrition",
          status: "better" as const
        }
      ],
      nutrition: alt.nutrition,
      isRegional: false
    };
  }));

  // Only return curated alternatives that actually beat the baseline
  return evaluated.filter(alt => alt.healthScore > baselineScore + 3);
}

// Get healthier alternatives from Open Food Facts & curated data in parallel
export async function getHealthierAlternatives(
  baselineFood: { identifiedFood: string; nutritionInfo: NutritionInfo }, 
  baselineScore: number,
  targetBodyType: string = 'athletic'
): Promise<Alternative[]> {
  const foodName = baselineFood?.identifiedFood || 'snack';
  const category = getFoodCategory(foodName, '');
  const mealType = detectMealType(foodName);
  
  console.log(`Food: ${foodName}, Category: ${category}, Meal Type: ${mealType}, Target: ${targetBodyType}`);
  
  // Generate search terms that match the same category of food
  const searchTerms = getCategoryMatchedSearchTerms(foodName, category, mealType);
  
  const alternatives: Alternative[] = [];
  const seenNames = new Set<string>();
  const model = await ensureModelTrained();

  // Run searches in parallel across top 3 search terms
  const searchResults = await Promise.allSettled(
    searchTerms.slice(0, 3).map(term => searchOpenFoodFacts(term))
  );

  const candidateProducts: any[] = [];
  for (const res of searchResults) {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      candidateProducts.push(...res.value);
    }
  }

  for (const product of candidateProducts) {
    if (!product || !product.nutriments) continue;
    
    const productName = String(product.product_name || '').trim();
    if (!productName || productName.toLowerCase() === 'unknown' || productName.length < 3) continue;
    
    // Strong deduplication - check normalized similarity
    if (isSimilarToSeen(productName, seenNames)) continue;

    // Open Food Facts reports sodium in grams (sodium_100g); convert to milligrams (mg, ×1000)
    const rawSodiumGrams = toNumber(product.nutriments['sodium_100g'] ?? product.nutriments['sodium'], 0);
    const sodiumMg = rawSodiumGrams * 1000;

    const altNutrition: NutritionInfo = {
      calories: toNumber(product.nutriments['energy-kcal_100g'] || (product.nutriments.energy_100g ? product.nutriments.energy_100g / 4.184 : 0), 0),
      protein: toNumber(product.nutriments.proteins_100g, 0),
      carbs: toNumber(product.nutriments.carbohydrates_100g, 0),
      fat: toNumber(product.nutriments.fat_100g, 0),
      saturatedFat: toNumber(product.nutriments['saturated-fat_100g'], 0),
      sugar: toNumber(product.nutriments.sugars_100g, 0),
      fiber: toNumber(product.nutriments.fiber_100g, 0),
      sodium: sodiumMg,
      vitamins: 0.6,
      processingLevel: 0.3
    };

    // Filter out zero-calorie or corrupted empty entries
    if (altNutrition.calories <= 5 && altNutrition.protein <= 0.1 && altNutrition.carbs <= 0.1) continue;

    const altScore = await calculateHealthScore(altNutrition, targetBodyType);

    // Only accept candidates that beat baseline by the margin threshold (+3)
    if (altScore > baselineScore + 3) {
      const reasons = calculateFeatureImportance(baselineFood.nutritionInfo, altNutrition, model, targetBodyType);
      
      if (reasons.length > 0) {
        seenNames.add(productName);
        alternatives.push({
          name: productName,
          healthScore: Math.round(altScore),
          benefits: [
            `${Math.round(altNutrition.protein)}g protein per 100g`,
            `${Math.round(altNutrition.fiber || 0)}g fiber per 100g`,
            `${Math.round(altNutrition.calories)} calories per 100g`
          ],
          reasons: reasons,
          nutrition: altNutrition,
          isRegional: false
        });

        if (alternatives.length >= 3) break;
      }
    }
  }

  // If not enough from API, add curated alternatives matching category ONLY if they beat the baseline
  if (alternatives.length < 3) {
    const curated = await getCuratedAlternatives(baselineFood, category, mealType, targetBodyType, baselineScore);
    const filteredCurated = curated.filter(c => !isSimilarToSeen(c.name, seenNames) && c.healthScore > baselineScore + 3);
    
    for (const alt of filteredCurated) {
      if (alternatives.length >= 3) break;
      if (!isSimilarToSeen(alt.name, seenNames)) {
        seenNames.add(alt.name);
        alternatives.push(alt);
      }
    }
  }

  return alternatives.slice(0, 3);
}
