import { Alternative, NutritionInfo } from "./types.ts";
import { ensureModelTrained } from "./model.ts";
import { calculateHealthScore, toNumber } from "./scoring.ts";
import { calculateFeatureImportance } from "./explain.ts";
import { getFoodCategory, detectMealType, getCategoryMatchedSearchTerms } from "./classify.ts";
import { searchOpenFoodFacts } from "./openFoodFacts.ts";
import { mealTypeAlternatives, alternativesByCategory } from "./curatedData.ts";
import { detectDietaryConflict } from "./allergens.ts";

// Normalize name for deduplication
export function normalizeName(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 2)
    .join(' ');
}

// Check if a name is similar to any in the seen set
export function isSimilarToSeen(name: string, seenNames: Set<string>): boolean {
  const normalizedNew = normalizeName(name);
  
  for (const seen of seenNames) {
    const normalizedSeen = normalizeName(seen);
    if (normalizedNew === normalizedSeen) return true;
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
  currentBodyType: string = 'average',
  baselineScore: number = 0,
  dietPreference: string = 'non-veg'
): Promise<Alternative[]> {
  const name = (baselineFood?.identifiedFood || '').toLowerCase();
  let key = category;

  if (category === 'salty-snack' && name.includes('chip')) {
    key = 'salty-chips';
  } else if (category === 'sweet' && (name.includes('biscuit') || name.includes('cookie'))) {
    key = 'sweet-biscuit';
  } else if (category === 'sweet' && name.includes('chocolate')) {
    key = 'sweet-chocolate';
  }

  let candidates: any[];
  if (mealType === 'lunch-dinner' && mealTypeAlternatives['lunch-dinner']) {
    candidates = mealTypeAlternatives['lunch-dinner'];
  } else if (mealType === 'breakfast' && (alternativesByCategory['breakfast'] || mealTypeAlternatives['breakfast'])) {
    candidates = alternativesByCategory['breakfast'] || mealTypeAlternatives['breakfast'];
  } else {
    candidates = alternativesByCategory[key] || alternativesByCategory[category] || alternativesByCategory.general || [];
  }

  // Filter candidates matching user's vegetarian/vegan preference
  const alternatives = candidates.filter(item => {
    return detectDietaryConflict(item.name, dietPreference) === null;
  });

  const model = await ensureModelTrained();
  
  const evaluated = await Promise.all(alternatives.map(async alt => {
    const score = await calculateHealthScore(alt.nutrition, targetBodyType, currentBodyType);
    const reasons = calculateFeatureImportance(baselineFood.nutritionInfo, alt.nutrition, model, targetBodyType, currentBodyType);

    return {
      name: alt.name,
      healthScore: Math.round(score),
      benefits: [
        `${Math.round(alt.nutrition.protein)}g protein per 100g`,
        `${Math.round(alt.nutrition.fiber || 0)}g fiber per 100g`,
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

  // Only return alternatives that are genuinely healthier than baseline by >2 points
  const valid = evaluated.filter(alt => alt.healthScore > baselineScore + 2);
  valid.sort((a, b) => b.healthScore - a.healthScore);
  return valid;
}

export async function getHealthierAlternatives(
  baselineFood: { identifiedFood: string; nutritionInfo: NutritionInfo },
  baselineScore: number,
  targetBodyType: string = 'athletic',
  currentBodyType: string = 'average',
  dietPreference: string = 'non-veg'
): Promise<Alternative[]> {
  const foodName = baselineFood.identifiedFood || 'snack';
  const category = getFoodCategory(foodName, '');
  const mealType = detectMealType(foodName);
  
  const alternatives: Alternative[] = [];
  const seenNames = new Set<string>();
  const model = await ensureModelTrained();

  // 1. Instant Curated Alternatives
  const curated = await getCuratedAlternatives(
    baselineFood, 
    category, 
    mealType, 
    targetBodyType, 
    currentBodyType, 
    baselineScore,
    dietPreference
  );
  
  for (const alt of curated) {
    if (alternatives.length >= 4) break;
    if (!isSimilarToSeen(alt.name, seenNames)) {
      seenNames.add(alt.name);
      alternatives.push(alt);
    }
  }

  // 2. Query Open Food Facts if more alternatives needed
  if (alternatives.length < 3) {
    const searchTerms = getCategoryMatchedSearchTerms(foodName, category, mealType);
    const searchTasks = searchTerms.slice(0, 2).map(term => searchOpenFoodFacts(term));
    const searchResults = await Promise.all(searchTasks);
    
    const candidateProducts = searchResults.flat();
    
    for (const product of candidateProducts) {
      if (alternatives.length >= 3) break;
      if (!product?.nutriments) continue;
      
      const productName = (product.product_name || '').trim();
      if (!productName || productName.toLowerCase() === 'unknown' || productName.length < 3) continue;
      if (isSimilarToSeen(productName, seenNames)) continue;
      if (detectDietaryConflict(productName, dietPreference) !== null) continue;

      const nutriments = product.nutriments;
      const rawSodium = toNumber(nutriments.sodium_100g ?? nutriments.sodium, 0);
      const sodiumMg = rawSodium < 20 && rawSodium > 0 ? rawSodium * 1000 : rawSodium;
      
      const calories = toNumber(nutriments['energy-kcal_100g'] ?? (nutriments.energy_100g ? nutriments.energy_100g / 4.184 : null), 0);
      const altNutrition: NutritionInfo = {
        calories,
        protein: toNumber(nutriments.proteins_100g, 0),
        carbs: toNumber(nutriments.carbohydrates_100g, 0),
        fat: toNumber(nutriments.fat_100g, 0),
        saturatedFat: toNumber(nutriments['saturated-fat_100g'], 0),
        sugar: toNumber(nutriments.sugars_100g, 0),
        fiber: toNumber(nutriments.fiber_100g, 0),
        sodium: sodiumMg,
        vitamins: 0.6,
        processingLevel: 0.3
      };

      if (altNutrition.calories <= 5 && altNutrition.protein <= 0.1 && altNutrition.carbs <= 0.1) continue;

      const altScore = await calculateHealthScore(altNutrition, targetBodyType, currentBodyType);
      
      if (altScore > baselineScore + 2) {
        const reasons = calculateFeatureImportance(baselineFood.nutritionInfo, altNutrition, model, targetBodyType, currentBodyType);
        
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
            reasons,
            nutrition: altNutrition,
            isRegional: false
          });
        }
      }
    }
  }

  // Sort and ensure score differentiation
  alternatives.sort((a, b) => b.healthScore - a.healthScore);
  
  // Guard against identical scores by differentiating according to protein/fiber richness
  const finalAlts = alternatives.slice(0, 3);
  for (let i = 1; i < finalAlts.length; i++) {
    if (finalAlts[i].healthScore >= finalAlts[i - 1].healthScore) {
      finalAlts[i].healthScore = Math.max(baselineScore + 1, finalAlts[i - 1].healthScore - (i + 1));
    }
  }

  return finalAlts;
}
