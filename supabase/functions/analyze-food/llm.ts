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

const SYSTEM_INSTRUCTION = `You are a certified nutritionist with access to USDA and global food databases. Analyze the food image and provide PRECISE nutritional data per 100g serving.

ABSOLUTE RULES - VIOLATION IS NOT ALLOWED:
1. NEVER return 0 for protein, carbs, fat, or fiber - ALL foods contain these nutrients
2. Use evidence-based values from nutritional databases
3. When uncertain, estimate conservatively but NEVER use zero

MANDATORY MINIMUM VALUES (per 100g):
- Protein: minimum 0.3g (even pure sugar has trace protein)
- Carbs: minimum 0.5g (even meat has trace carbs from glycogen)
- Fat: minimum 0.1g (all foods contain some lipids)
- Fiber: minimum 0.1g for plant foods, 0g ONLY for pure animal products/oils
- Sugar: can be 0 for unsweetened foods
- Sodium: minimum 5mg (naturally present in all foods)

REFERENCE VALUES BY FOOD TYPE:
- Grains/Rice/Bread: protein 3-12g, carbs 20-75g, fat 0.5-5g, fiber 1-8g
- Meat/Poultry/Fish: protein 15-30g, carbs 0-2g, fat 1-25g, fiber 0g
- Vegetables: protein 1-5g, carbs 3-20g, fat 0.1-1g, fiber 1-5g
- Fruits: protein 0.5-2g, carbs 8-25g, fat 0.1-1g, fiber 1-4g
- Dairy: protein 3-25g, carbs 3-12g, fat 0.5-35g, fiber 0g
- Snacks/Fried: protein 3-10g, carbs 40-70g, fat 15-40g, fiber 1-4g
- Sweets/Desserts: protein 2-8g, carbs 40-80g, fat 5-30g, fiber 0.5-3g
- Legumes/Beans: protein 5-25g, carbs 15-60g, fat 0.5-5g, fiber 5-15g

Return ONLY this JSON structure:
{
  "name": "specific food name with preparation style",
  "confidence": 0.85-0.98,
  "nutrition": {
    "calories": realistic_number,
    "protein": number_minimum_0.3,
    "carbs": number_minimum_0.5,
    "fat": number_minimum_0.1,
    "saturatedFat": number,
    "sugar": number,
    "fiber": number_minimum_0.1_for_plants,
    "sodium": number_mg_minimum_5,
    "processingLevel": 0.1_to_1.0
  }
}`;

/**
 * Call vision LLM to identify food and extract base nutritional values.
 * Supports Google Gemini native REST API (primary) with OpenAI-compatible gateway fallback.
 */
export async function identifyFoodWithAI(image: string): Promise<IdentifiedFood> {
  const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('LOVABLE_API_KEY');

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in Supabase secrets');
  }

  console.log('Analyzing food image with AI for identification...');

  // Robust base64 data and mime-type extraction without slow/brittle regex
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
  // Strip any whitespace, carriage returns or newlines from base64 string
  base64Data = base64Data.replace(/\s+/g, '');

  let contentText = '';

  // 1. Primary: Direct Google Gemini API (generateContent)
  let geminiSuccess = false;
  const errorLogs: string[] = [];

  if (!apiKey.startsWith('sk_')) {
    // Dynamically discover all active models supporting generateContent on this API key
    let models = ['gemini-3.6-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-2.0-flash-lite-preview'];
    try {
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (listRes.ok) {
        const listData = await listRes.json();
        if (listData.models && Array.isArray(listData.models)) {
          const discovered = listData.models
            .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
            .map((m: any) => m.name.replace(/^models\//, ''))
            .filter((name: string) => name.includes('flash') || name.includes('pro') || name.includes('gemini'));
          if (discovered.length > 0) {
            // Prioritize flash models, then pro models
            discovered.sort((a: string, b: string) => {
              if (a.includes('3.6') && !b.includes('3.6')) return -1;
              if (!a.includes('3.6') && b.includes('3.6')) return 1;
              if (a.includes('flash') && !b.includes('flash')) return -1;
              if (!a.includes('flash') && b.includes('flash')) return 1;
              return 0;
            });
            models = discovered;
            console.log('Discovered active Gemini models for this key:', models);
          }
        }
      }
    } catch (e) {
      console.warn('Could not query model list, using fallback candidate list:', e);
    }

    for (const model of models) {
      // Retry up to 2 times on transient 503 errors with backoff
      const maxRetries = 1;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: `${SYSTEM_INSTRUCTION}\n\nIdentify this food and provide accurate nutritional values per 100g.` },
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

          if (response.ok) {
            const result = await response.json();
            contentText = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            if (contentText) {
              geminiSuccess = true;
              console.log(`Successfully identified food using ${model} (attempt ${attempt + 1})`);
              break;
            } else {
              errorLogs.push(`${model}: empty candidates in response`);
            }
          } else {
            const errBody = await response.text().catch(() => '');
            const isTransient = response.status === 503 || response.status === 500;
            
            if (isTransient && attempt < maxRetries) {
              const backoff = 800 * (attempt + 1);
              console.warn(`Gemini ${model} returned ${response.status} (attempt ${attempt + 1}), retrying in ${backoff}ms...`);
              await new Promise(r => setTimeout(r, backoff));
              continue;
            }

            errorLogs.push(`${model} (${response.status}): ${errBody.slice(0, 150)}`);
            console.warn(`Gemini ${model} returned ${response.status}`);
            break;
          }
        } catch (err: any) {
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
            continue;
          }
          errorLogs.push(`${model} (exception): ${err?.message || String(err)}`);
          console.warn(`Error trying ${model}:`, err);
          break;
        }
      }

      if (geminiSuccess) break;
    }
  }

  // 2. Fallback: OpenAI-compatible gateway (Lovable or OpenRouter)
  if (!geminiSuccess) {
    console.log('Falling back to chat completions gateway...');
    const gatewayEndpoint = apiKey.startsWith('sk_') 
      ? 'https://ai.gateway.lovable.dev/v1/chat/completions'
      : 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    const gatewayModel = apiKey.startsWith('sk_') ? 'google/gemini-2.5-flash' : 'gemini-3.6-flash';

    const aiResponse = await fetch(gatewayEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: gatewayModel,
        response_format: { type: "json_object" },
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Identify this food and provide accurate nutritional values per 100g in JSON format.' },
              { type: 'image_url', image_url: { url: image } }
            ]
          }
        ],
        max_tokens: 600,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text().catch(() => '');
      if (errText.includes('RESOURCE_EXHAUSTED') || errText.includes('Quota exceeded') || aiResponse.status === 429) {
        throw new Error('Gemini API rate limit reached. Please wait a few seconds and try scanning again.');
      }
      throw new Error(`AI identification failed: ${errorLogs.join(' | ')}`);
    }

    const raw = await aiResponse.json();
    contentText = raw.choices?.[0]?.message?.content ?? '';
  }

  console.log('Raw AI response content:', contentText);

  const extracted = extractJsonCandidate(contentText);
  if (!extracted) {
    if (/no food|cannot identify|not a food|not recognize/i.test(contentText)) {
      throw new Error('Could not identify any food in this image. Please upload a clear photo of food.');
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

  // Handle various JSON response field shapes gracefully
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

  const foodName = String(identified.name || identified.foodName || identified.identifiedFood || 'Identified Food').trim();
  const isAnimalProduct = /meat|chicken|fish|beef|pork|lamb|tuna|salmon|shrimp|prawn|egg|bacon|sausage/.test(foodName.toLowerCase());

  // Ensure minimum values - NO food should have 0 for these
  if (!nutrition.protein || nutrition.protein < 0.3) {
    nutrition.protein = isAnimalProduct ? 18 : 2.5;
    console.log('Fixed protein value to:', nutrition.protein);
  }
  if (!nutrition.carbs || nutrition.carbs < 0.5) {
    nutrition.carbs = isAnimalProduct ? 0.5 : 15;
    console.log('Fixed carbs value to:', nutrition.carbs);
  }
  if (!nutrition.fat || nutrition.fat < 0.1) {
    nutrition.fat = 3;
    console.log('Fixed fat value to:', nutrition.fat);
  }
  if (!nutrition.fiber || nutrition.fiber < 0.1) {
    nutrition.fiber = isAnimalProduct ? 0 : 1.5;
    console.log('Fixed fiber value to:', nutrition.fiber);
  }
  if (!nutrition.sodium || nutrition.sodium < 5) {
    nutrition.sodium = 150;
    console.log('Fixed sodium value to:', nutrition.sodium);
  }
  if (!nutrition.calories || nutrition.calories < 10) {
    nutrition.calories = 150;
    console.log('Fixed calories value to:', nutrition.calories);
  }

  return {
    name: foodName,
    confidence: toNumber(identified.confidence, 0.92),
    nutrition: nutrition
  };
}
