import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  corsHeaders, 
  AnalyzeRequestSchema, 
  AnalyzeResponse,
  NutritionInfo,
  Alternative
} from "./types.ts";
import { identifyFoodWithAI } from "./llm.ts";
import { calculateHealthScore } from "./scoring.ts";
import { getHealthierAlternatives } from "./alternatives.ts";
import { detectAllergens } from "./allergens.ts";
import { processDetailedLog } from "./detailedLog.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    const parseResult = AnalyzeRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request payload', 
          details: parseResult.error.format() 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { image, identifyOnly, detailedLog, userProfile } = parseResult.data;
    const dietPreference = userProfile?.dietPreference || 'non-veg';
    const allergies = userProfile?.allergies || [];
    const targetBodyType = userProfile?.targetBodyType || 'athletic';

    console.log(`Analyzing food with preferences - Diet: ${dietPreference}, Target: ${targetBodyType}, Allergies: ${JSON.stringify(allergies)}`);

    // 1. Vision LLM Identification and initial nutrition extraction
    const identified = await identifyFoodWithAI(image);
    console.log('Food identified:', identified.name);
    console.log('Base nutrition per 100g:', JSON.stringify(identified.nutrition));

    // Fast-path: in detailed mode we do a lightweight first pass (name + nutrition only)
    if (identifyOnly) {
      const identifyOnlyResponse = {
        identifiedFood: identified.name,
        confidence: identified.confidence,
        nutritionInfo: {
          calories: Math.round(identified.nutrition.calories),
          protein: Math.round(identified.nutrition.protein * 10) / 10,
          carbs: Math.round(identified.nutrition.carbs * 10) / 10,
          fats: Math.round(identified.nutrition.fat * 10) / 10,
          saturatedFat: Math.round((identified.nutrition.saturatedFat || 0) * 10) / 10,
          sugar: Math.round((identified.nutrition.sugar || 0) * 10) / 10,
          fiber: Math.round((identified.nutrition.fiber || 0) * 10) / 10,
          sodium: Math.round(identified.nutrition.sodium || 0),
        },
      };

      return new Response(
        JSON.stringify(identifyOnlyResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Baseline nutrition & health score using custom ML model
    const baselineNutrition: NutritionInfo = {
      calories: identified.nutrition.calories,
      protein: identified.nutrition.protein,
      carbs: identified.nutrition.carbs,
      fat: identified.nutrition.fat,
      saturatedFat: identified.nutrition.saturatedFat,
      sugar: identified.nutrition.sugar,
      fiber: identified.nutrition.fiber,
      sodium: identified.nutrition.sodium,
      vitamins: 0.5,
      processingLevel: identified.nutrition.processingLevel ?? 0.5
    };

    const baselineScore = await calculateHealthScore(baselineNutrition, targetBodyType);
    console.log('Baseline health score:', baselineScore);

    // 3. Check if food is already an optimal healthy choice (score >= 70)
    let filteredAlternatives: Alternative[] = [];
    const isAlreadyHealthy = baselineScore >= 70;

    if (!isAlreadyHealthy) {
      console.log('Searching for healthier alternatives...');
      const rawAlternatives = await getHealthierAlternatives(
        {
          identifiedFood: identified.name,
          nutritionInfo: baselineNutrition
        },
        baselineScore,
        targetBodyType
      );

      // 4. Filter alternatives based on diet preference and allergies
      filteredAlternatives = rawAlternatives.filter(alt => {
        const name = alt.name.toLowerCase();
        
        if (dietPreference === 'vegan') {
          const nonVegan = ['chicken', 'meat', 'fish', 'egg', 'milk', 'dairy', 'yogurt', 'cheese', 'butter', 'honey'];
          if (nonVegan.some(item => name.includes(item))) return false;
        } else if (dietPreference === 'vegetarian') {
          const nonVeg = ['chicken', 'meat', 'fish', 'mutton', 'beef', 'pork', 'prawn', 'shrimp'];
          if (nonVeg.some(item => name.includes(item))) return false;
        }
        
        for (const allergy of allergies) {
          if (name.includes(allergy.toLowerCase())) return false;
        }
        
        return true;
      });
    }

    // 5. Calculate detailed total nutrition if custom ingredients or serving details provided
    const detailedResult = processDetailedLog(identified, detailedLog);

    // 6. Unified three-layer allergen detection on the identified food
    const allergenWarning = detectAllergens(identified.name, allergies);
    if (allergenWarning.length > 0) {
      console.log('Allergen warning detected:', allergenWarning, 'in food:', identified.name);
    }

    // 7. Pick best choice and detect already-optimal state
    let bestChoice: Alternative | null = null;
    if (filteredAlternatives.length > 0) {
      const sorted = [...filteredAlternatives].sort((a, b) => b.healthScore - a.healthScore);
      bestChoice = sorted[0];
    }

    const alreadyOptimal = isAlreadyHealthy || filteredAlternatives.length === 0;

    // 8. Assemble final response
    const result: AnalyzeResponse = {
      identifiedFood: identified.name,
      confidence: identified.confidence,
      nutritionInfo: {
        calories: Math.round(identified.nutrition.calories),
        protein: Math.round(identified.nutrition.protein * 10) / 10,
        carbs: Math.round(identified.nutrition.carbs * 10) / 10,
        fats: Math.round(identified.nutrition.fat * 10) / 10,
        saturatedFat: Math.round((identified.nutrition.saturatedFat || 0) * 10) / 10,
        sugar: Math.round((identified.nutrition.sugar || 0) * 10) / 10,
        fiber: Math.round((identified.nutrition.fiber || 0) * 10) / 10,
        sodium: Math.round(identified.nutrition.sodium || 0),
      },
      totalCalories: Math.round(detailedResult.totalCalories),
      totalProtein: Math.round(detailedResult.totalProtein * 10) / 10,
      totalCarbs: Math.round(detailedResult.totalCarbs * 10) / 10,
      totalFat: Math.round(detailedResult.totalFat * 10) / 10,
      totalFiber: Math.round(detailedResult.totalFiber * 10) / 10,
      totalSugar: Math.round(detailedResult.totalSugar * 10) / 10,
      totalSodium: Math.round(detailedResult.totalSodium),
      servingInfo: detailedResult.servingInfo,
      hasDetailedLog: !!detailedLog,
      alternatives: filteredAlternatives,
      alreadyOptimal,
      bestChoice,
      allergenWarning: allergenWarning.length > 0 ? allergenWarning : undefined
    };

    console.log('Analysis complete. Alternatives returned:', filteredAlternatives.length, 'Already optimal:', alreadyOptimal);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-food function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Failed to analyze food image'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
