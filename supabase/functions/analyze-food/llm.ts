import { IdentifiedFood } from "./types.ts";
import { toNumber } from "./scoring.ts";

export function extractJsonCandidate(content: string): string | null {
  if (!content) return null;

  let s = content.trim();

  if (s.includes('```json')) {
    s = s.split('```json')[1]?.split('```')[0]?.trim() ?? s;
  } else if (s.includes('```')) {
    s = s.split('```')[1]?.split('```')[0]?.trim() ?? s;
  }

  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    return s.slice(first, last + 1);
  }

  return null;
}

const SYSTEM_INSTRUCTION = `You are a certified clinical nutritionist and computer vision nutrition specialist with access to USDA and international food databases. Analyze the food and provide PRECISE nutritional data per 100g serving.

If the image or input DOES NOT contain any edible food, drink, dish, or meal (e.g. an electronic device, furniture, pet, empty room, person without food, or random object):
Return ONLY:
{
  "isFood": false,
  "name": "Non-food item",
  "error": "No food detected in this image. Please provide a clear photo of food."
}

If the image or input CONTAINS food:
Return ONLY this JSON structure with realistic nutritional data per 100g serving:
{
  "isFood": true,
  "name": "specific food name with preparation style",
  "confidence": 0.95,
  "nutrition": {
    "calories": realistic_number,
    "protein": number_minimum_0.3,
    "carbs": number_minimum_0.5,
    "fat": number_minimum_0.1,
    "saturatedFat": number,
    "sugar": number,
    "fiber": number,
    "sodium": number_mg,
    "processingLevel": 0.1_to_1.0
  }
}

MANDATORY NUTRITION RULES (per 100g):
1. Never return 0 for protein, carbs, or fat unless it is pure oil or pure water.
2. Reference values per 100g:
   - Grains/Rice/Bread: protein 3-12g, carbs 20-75g, fat 0.5-5g, fiber 1-8g
   - Meat/Poultry/Fish: protein 15-30g, carbs 0-2g, fat 1-25g, fiber 0g
   - Vegetables: protein 1-5g, carbs 3-20g, fat 0.1-1g, fiber 1-5g
   - Fruits: protein 0.5-2g, carbs 8-25g, fat 0.1-1g, fiber 1-4g
   - Dairy/Yogurt: protein 3-25g, carbs 3-12g, fat 0.5-35g, fiber 0g
   - Snacks/Fried: protein 3-10g, carbs 40-70g, fat 15-40g, fiber 1-4g
   - Sweets/Desserts: protein 2-8g, carbs 40-80g, fat 5-30g, fiber 0.5-3g
   - Legumes/Beans: protein 5-25g, carbs 15-60g, fat 0.5-5g, fiber 5-15g`;

/**
 * Discover fast Gemini Flash models only (excludes slow reasoning/video/audio models).
 */
export async function getFastGeminiModels(apiKey: string): Promise<string[]> {
  const fallbackList = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash'];

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      signal: controller.signal
    });
    clearTimeout(timer);

    if (listRes.ok) {
      const listData = await listRes.json();
      if (listData.models && Array.isArray(listData.models)) {
        const discovered = listData.models
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => m.name.replace(/^models\//, ''))
          .filter((name: string) => name.includes('flash') && !name.includes('tts') && !name.includes('transcribe'));

        if (discovered.length > 0) {
          discovered.sort((a: string, b: string) => {
            const score = (name: string) => {
              if (name === 'gemini-3.6-flash') return 100;
              if (name === 'gemini-3.7-flash') return 90;
              if (name === 'gemini-3.8-flash') return 80;
              return 50;
            };
            return score(b) - score(a);
          });
          return Array.from(new Set([...discovered, ...fallbackList]));
        }
      }
    }
  } catch {
    // Fall back to candidate list on timeout/error
  }

  return fallbackList;
}

/**
 * Instant nutritional profile fallback when Gemini API hits rate limits (429).
 */
export function getHeuristicNutrition(query: string): IdentifiedFood {
  const q = query.toLowerCase();
  
  let name = query.trim();
  let nutrition = {
    calories: 180,
    protein: 8,
    carbs: 22,
    fat: 6,
    saturatedFat: 1.5,
    sugar: 4,
    fiber: 3,
    sodium: 220,
    processingLevel: 0.3
  };

  if (q.includes('yogurt') || q.includes('curd') || q.includes('dahi')) {
    name = 'Greek Yogurt with Fresh Fruit';
    nutrition = { calories: 125, protein: 13, carbs: 12, fat: 3.5, saturatedFat: 1.5, sugar: 9, fiber: 1.5, sodium: 45, processingLevel: 0.2 };
  } else if (q.includes('smoothie') || q.includes('shake')) {
    name = 'Fruit & Protein Smoothie';
    nutrition = { calories: 140, protein: 8, carbs: 22, fat: 2, saturatedFat: 0.5, sugar: 14, fiber: 3.5, sodium: 60, processingLevel: 0.2 };
  } else if (q.includes('chicken') || q.includes('turkey') || q.includes('tikka')) {
    name = 'Grilled Chicken Breast with Rice';
    nutrition = { calories: 165, protein: 31, carbs: 4, fat: 3.6, saturatedFat: 1, sugar: 0, fiber: 1, sodium: 220, processingLevel: 0.2 };
  } else if (q.includes('egg') || q.includes('omelette') || q.includes('omelet')) {
    name = 'Egg Omelette with Vegetables';
    nutrition = { calories: 154, protein: 12, carbs: 2.5, fat: 10.5, saturatedFat: 3, sugar: 1, fiber: 1, sodium: 240, processingLevel: 0.2 };
  } else if (q.includes('salad')) {
    name = 'Fresh Garden Salad with Dressing';
    nutrition = { calories: 95, protein: 3, carbs: 8, fat: 6, saturatedFat: 1, sugar: 3, fiber: 3.5, sodium: 180, processingLevel: 0.1 };
  } else if (q.includes('oat') || q.includes('oatmeal') || q.includes('porridge')) {
    name = 'Oatmeal Porridge';
    nutrition = { calories: 150, protein: 6, carbs: 27, fat: 3, saturatedFat: 0.5, sugar: 2, fiber: 4.5, sodium: 80, processingLevel: 0.1 };
  } else if (q.includes('salmon') || q.includes('fish') || q.includes('tuna')) {
    name = 'Grilled Fish Fillet';
    nutrition = { calories: 180, protein: 26, carbs: 0, fat: 8, saturatedFat: 1.5, sugar: 0, fiber: 0, sodium: 190, processingLevel: 0.2 };
  } else if (q.includes('nut') || q.includes('almond') || q.includes('walnut') || q.includes('seed')) {
    name = 'Mixed Raw Nuts & Seeds';
    nutrition = { calories: 580, protein: 20, carbs: 18, fat: 50, saturatedFat: 5, sugar: 3, fiber: 10, sodium: 5, processingLevel: 0.1 };
  } else if (q.includes('rice') || q.includes('biryani') || q.includes('pulao')) {
    name = 'Steamed Rice Dish';
    nutrition = { calories: 180, protein: 4.5, carbs: 36, fat: 2.5, saturatedFat: 0.5, sugar: 0.5, fiber: 2, sodium: 210, processingLevel: 0.3 };
  } else if (q.includes('burger') || q.includes('sandwich') || q.includes('wrap')) {
    name = 'Meal Sandwich / Wrap';
    nutrition = { calories: 250, protein: 14, carbs: 28, fat: 10, saturatedFat: 3, sugar: 3, fiber: 2.5, sodium: 480, processingLevel: 0.5 };
  } else if (q.includes('pizza')) {
    name = 'Cheese & Vegetable Pizza';
    nutrition = { calories: 270, protein: 11, carbs: 32, fat: 11, saturatedFat: 4.5, sugar: 4, fiber: 2.5, sodium: 560, processingLevel: 0.6 };
  } else if (q.includes('chip') || q.includes('crisp') || q.includes('snack') || q.includes('french fries') || q.includes('fries')) {
    name = 'Fried Snack';
    nutrition = { calories: 340, protein: 4, carbs: 45, fat: 17, saturatedFat: 5, sugar: 2, fiber: 3, sodium: 460, processingLevel: 0.8 };
  }

  return {
    name,
    confidence: 0.90,
    nutrition
  };
}

/**
 * Call vision LLM to identify food and extract base nutritional values.
 */
export async function identifyFoodWithAI(image: string): Promise<IdentifiedFood> {
  const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY');

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in Supabase secrets');
  }

  console.log('Analyzing food image with Gemini AI for identification...');

  let mimeType = 'image/jpeg';
  let base64Data = image;

  if (image.includes(';base64,')) {
    const parts = image.split(';base64,');
    const header = parts[0];
    base64Data = parts[1] || '';
    if (header.startsWith('data:')) {
      mimeType = header.substring(5) || 'image/jpeg';
    }
  } else if (image.startsWith('data:')) {
    const commaIndex = image.indexOf(',');
    if (commaIndex !== -1) {
      const header = image.slice(0, commaIndex);
      base64Data = image.slice(commaIndex + 1);
      if (header.startsWith('data:') && header.includes('/')) {
        mimeType = header.slice(5).split(';')[0] || 'image/jpeg';
      }
    }
  }
  base64Data = base64Data.replace(/\s+/g, '');

  let contentText = '';
  let geminiSuccess = false;
  const errorLogs: string[] = [];

  const models = await getFastGeminiModels(apiKey);

  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `${SYSTEM_INSTRUCTION}\n\nIdentify this food and provide accurate nutritional values per 100g in JSON format.` },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
            maxOutputTokens: 800
          }
        })
      });
      clearTimeout(timer);

      if (response.ok) {
        const result = await response.json();
        contentText = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (contentText) {
          geminiSuccess = true;
          console.log(`Successfully identified food image using ${model}`);
          break;
        }
      } else {
        const errBody = await response.text().catch(() => '');
        errorLogs.push(`${model} (${response.status}): ${errBody.slice(0, 150)}`);
      }
    } catch (err: any) {
      clearTimeout(timer);
      errorLogs.push(`${model} (exception): ${err?.message || String(err)}`);
    }

    if (geminiSuccess) break;
  }

  if (!geminiSuccess || !contentText) {
    const isRateLimit = errorLogs.some(e => e.includes('429') || e.includes('RESOURCE_EXHAUSTED') || e.includes('Quota exceeded'));
    if (isRateLimit) {
      throw new Error('Gemini API rate limit reached (20 free requests limit). Please wait a few seconds and try again.');
    }
    throw new Error(`Food image identification failed: ${errorLogs.join(' | ')}`);
  }

  const extracted = extractJsonCandidate(contentText);
  if (!extracted) {
    if (/no food|cannot identify|not a food|not recognize|non-food/i.test(contentText)) {
      throw new Error('No food was detected in this image. Please upload a clear photo of food.');
    }
    throw new Error('AI could not extract nutritional data from this image. Please try again with a clearer photo.');
  }

  let identified: any;
  try {
    identified = JSON.parse(extracted);
  } catch (e) {
    console.error('Failed to parse AI JSON:', e, 'Content was:', extracted);
    throw new Error('Could not parse nutrition data. Please try another photo.');
  }

  if (
    identified.isFood === false || 
    identified.is_food === false ||
    /no food|not food|non-food/i.test(identified.name || '')
  ) {
    throw new Error('No food was detected in this photo. Please upload a clear photo of your meal or food item.');
  }

  const foodName = String(
    identified.name || 
    identified.foodName || 
    identified.food_name || 
    identified.dish || 
    identified.food || 
    identified.foodItem || 
    identified.food_item || 
    identified.item || 
    identified.identifiedFood || 
    identified.title || 
    identified.label || 
    ''
  ).trim();

  if (!foodName || foodName.toLowerCase() === 'food item' || foodName.toLowerCase() === 'unknown food') {
    throw new Error('Could not recognize the food in this image. Please try a clearer angle or better lighting.');
  }

  const rawNutrition = identified.nutrition || identified.nutritionPer100g || identified.nutriments || identified;

  const nutrition = {
    calories: toNumber(rawNutrition.calories || rawNutrition.energy || rawNutrition['energy-kcal'], 0),
    protein: toNumber(rawNutrition.protein || rawNutrition.proteins, 0),
    carbs: toNumber(rawNutrition.carbs || rawNutrition.carbohydrates, 0),
    fat: toNumber(rawNutrition.fat || rawNutrition.fats || rawNutrition.totalFat, 0),
    saturatedFat: toNumber(rawNutrition.saturatedFat || rawNutrition['saturated-fat'], 0),
    sugar: toNumber(rawNutrition.sugar || rawNutrition.sugars, 0),
    fiber: toNumber(rawNutrition.fiber || rawNutrition.fibers, 0),
    sodium: toNumber(rawNutrition.sodium, 0),
    processingLevel: toNumber(rawNutrition.processingLevel, 0.5),
  };

  const isAnimalProduct = /meat|chicken|fish|beef|pork|lamb|tuna|salmon|shrimp|prawn|egg|bacon|sausage/.test(foodName.toLowerCase());

  if (!nutrition.protein || nutrition.protein < 0.3) {
    nutrition.protein = isAnimalProduct ? 18 : 2.5;
  }
  if (!nutrition.carbs || nutrition.carbs < 0.5) {
    nutrition.carbs = isAnimalProduct ? 0.5 : 15;
  }
  if (!nutrition.fat || nutrition.fat < 0.1) {
    nutrition.fat = 3;
  }
  if (!nutrition.fiber || nutrition.fiber < 0.1) {
    nutrition.fiber = isAnimalProduct ? 0 : 1.5;
  }
  if (!nutrition.sodium || nutrition.sodium < 5) {
    nutrition.sodium = 150;
  }
  if (!nutrition.calories || nutrition.calories < 10) {
    nutrition.calories = 150;
  }

  return {
    name: foodName,
    confidence: toNumber(identified.confidence, 0.95),
    nutrition: nutrition
  };
}

/**
 * Identify food and nutritional parameters from spoken natural language text.
 */
export async function identifyFoodFromVoiceQuery(query: string): Promise<IdentifiedFood> {
  const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY');

  if (!apiKey) {
    return getHeuristicNutrition(query);
  }

  console.log('Analyzing spoken voice food query with Gemini AI:', query);

  const errorLogs: string[] = [];
  const models = await getFastGeminiModels(apiKey);
  let contentText = '';
  let success = false;

  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${SYSTEM_INSTRUCTION}

The user said the following food/meal via voice:
"${query}"

Identify the primary food item described, and provide accurate nutritional values per 100g in JSON format.`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
            maxOutputTokens: 800
          }
        })
      });
      clearTimeout(timer);

      if (response.ok) {
        const result = await response.json();
        contentText = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (contentText) {
          success = true;
          console.log(`Successfully identified voice food query using ${model}`);
          break;
        }
      } else {
        const errText = await response.text().catch(() => '');
        errorLogs.push(`${model} (${response.status}): ${errText.slice(0, 150)}`);
      }
    } catch (err: any) {
      clearTimeout(timer);
      errorLogs.push(`${model} (exception): ${err?.message || String(err)}`);
    }
  }

  if (success && contentText) {
    const extracted = extractJsonCandidate(contentText);
    if (extracted) {
      try {
        const identified = JSON.parse(extracted);
        const rawNutrition = identified.nutrition || identified.nutritionPer100g || identified;

        const nutrition = {
          calories: toNumber(rawNutrition.calories || rawNutrition.energy, 160),
          protein: toNumber(rawNutrition.protein || rawNutrition.proteins, 5),
          carbs: toNumber(rawNutrition.carbs || rawNutrition.carbohydrates, 20),
          fat: toNumber(rawNutrition.fat || rawNutrition.fats, 5),
          saturatedFat: toNumber(rawNutrition.saturatedFat, 1),
          sugar: toNumber(rawNutrition.sugar || rawNutrition.sugars, 3),
          fiber: toNumber(rawNutrition.fiber || rawNutrition.fibers, 2),
          sodium: toNumber(rawNutrition.sodium, 250),
          processingLevel: toNumber(rawNutrition.processingLevel, 0.4),
        };

        const foodName = String(
          identified.name || 
          identified.foodName || 
          identified.food_name || 
          identified.dish || 
          identified.food || 
          identified.foodItem || 
          identified.item || 
          query
        ).trim();

        return {
          name: foodName,
          confidence: toNumber(identified.confidence, 0.95),
          nutrition
        };
      } catch {
        // Use heuristic fallback
      }
    }
  }

  // Instant graceful fallback when Gemini hits rate limits (429) or spikes
  console.log('Using heuristic nutritional fallback for voice query:', query);
  return getHeuristicNutrition(query);
}

/**
 * Generate natural human-like spoken explanation with cadence, pauses (...), and encouraging tone.
 */
export function generateSpokenExplanation(
  foodName: string,
  baselineScore: number,
  targetBodyType: string,
  bestChoice: any | null,
  alreadyOptimal: boolean
): string {
  const goal = (targetBodyType || 'athletic').replace('_', ' ');

  if (alreadyOptimal || !bestChoice) {
    return `That's a fantastic choice! ... Based on our nutritional model for your ${goal} goal, ${foodName} scores ${baselineScore} out of 100. ... It has a clean, well-balanced nutrient profile with minimal empty calories. ... No healthier swaps are needed in our database, so go right ahead and enjoy your meal!`;
  }

  const scoreGain = bestChoice.healthScore - baselineScore;
  const topBenefit = bestChoice.reasons?.[0]?.actualChange || bestChoice.benefits?.[0] || 'higher protein and cleaner macros';

  return `Got it! Let me check that for you. ... ${foodName} currently scores around ${baselineScore} out of 100 for your ${goal} goal. ... Here is a great swap: ... I recommend trying ${bestChoice.name}, which boosts your health score to ${bestChoice.healthScore}, a gain of ${scoreGain} points! ... It provides ${topBenefit}. ... Would you like to check out this alternative?`;
}
