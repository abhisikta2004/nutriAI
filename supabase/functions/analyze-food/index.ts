import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  corsHeaders, 
  AnalyzeRequestSchema, 
  AnalyzeResponse,
  NutritionInfo,
  Alternative
} from "./types.ts";
import { identifyFoodWithAI, identifyFoodFromVoiceQuery, generateSpokenExplanation } from "./llm.ts";
import { calculateHealthScore } from "./scoring.ts";
import { getHealthierAlternatives } from "./alternatives.ts";
import { detectAllergens, detectDietaryConflict } from "./allergens.ts";
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

    const { image, voiceQuery, identifyOnly, detailedLog, userProfile } = parseResult.data;
    const dietPreference = userProfile?.dietPreference || 'non-veg';
    const allergies = userProfile?.allergies || [];
    const targetBodyType = userProfile?.targetBodyType || 'athletic';
    const currentBodyType = userProfile?.currentBodyType || 'average';

    console.log(`Analyzing food - Diet: ${dietPreference}, Current: ${currentBodyType}, Target: ${targetBodyType}, Allergies: ${JSON.stringify(allergies)}`);

    // 1. Identification (Vision or Voice)
    let identified;
    if (voiceQuery && voiceQuery.trim().length > 0) {
      console.log('Using voice query processor for:', voiceQuery);
      identified = await identifyFoodFromVoiceQuery(voiceQuery.trim());
    } else if (image) {
      identified = await identifyFoodWithAI(image);
    } else {
      throw new Error('Please provide a food photo or spoken food description.');
    }

    console.log('Food identified:', identified.name);

    // Fast-path: identify-only
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

    // 2. Baseline nutrition & health score with current -> target transition multipliers
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

    const baselineScore = await calculateHealthScore(baselineNutrition, targetBodyType, currentBodyType);
    console.log('Baseline health score:', baselineScore);

    // 3. Allergen & Dietary Preference Warnings
    const allergenWarning = detectAllergens(identified.name, allergies);
    const dietaryWarning = detectDietaryConflict(identified.name, dietPreference);

    if (dietaryWarning) {
      console.log('Dietary preference conflict detected:', dietaryWarning);
    }

    // 4. Search for healthier alternatives (>2 points better, matching diet preference)
    const rawAlternatives = await getHealthierAlternatives(
      {
        identifiedFood: identified.name,
        nutritionInfo: baselineNutrition
      },
      baselineScore,
      targetBodyType,
      currentBodyType,
      dietPreference
    );

    // 5. Strict filtering on diet preference and allergies
    const filteredAlternatives = rawAlternatives.filter(alt => {
      // Check dietary conflict
      if (detectDietaryConflict(alt.name, dietPreference) !== null) {
        return false;
      }
      
      // Check allergies
      for (const allergy of allergies) {
        if (alt.name.toLowerCase().includes(allergy.toLowerCase())) return false;
      }
      
      return true;
    });

    // 6. Detailed log portion processing
    const detailedResult = processDetailedLog(identified, detailedLog);

    // 7. Pick best choice and detect already-optimal state
    let bestChoice: Alternative | null = null;
    if (filteredAlternatives.length > 0) {
      const sorted = [...filteredAlternatives].sort((a, b) => b.healthScore - a.healthScore);
      bestChoice = sorted[0];
    }

    const alreadyOptimal = filteredAlternatives.length === 0 && !dietaryWarning;

    // 8. Generate conversational voice response script
    const spokenResponse = generateSpokenExplanation(
      identified.name,
      Math.round(baselineScore),
      targetBodyType,
      bestChoice,
      alreadyOptimal,
      dietaryWarning
    );

    // 9. Assemble final response
    const result: AnalyzeResponse = {
      identifiedFood: identified.name,
      confidence: identified.confidence,
      healthScore: Math.round(baselineScore),
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
      allergenWarning: allergenWarning.length > 0 ? allergenWarning : undefined,
      dietaryWarning: dietaryWarning || undefined,
      spokenResponse
    };

    console.log('Analysis complete. Alternatives:', filteredAlternatives.length, 'Dietary warning:', dietaryWarning);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-food function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Failed to analyze food'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
