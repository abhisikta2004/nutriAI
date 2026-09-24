import { defaultJsonHeaders } from "./types.ts";
import { toNumber, getProcessingLevel, calculateBasicHealthScore } from "./scoring.ts";

/**
 * Safe fetch wrapper with timeout and exponential backoff retry for Open Food Facts API
 */
export async function safeFetchJson(url: string, retries: number = 1, delayMs: number = 200, timeoutMs: number = 3500): Promise<any> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { 
        headers: defaultJsonHeaders,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.includes('application/json')) {
          const snippet = await response.text().catch(() => '');
          throw new Error(`Non-JSON response (${contentType}): ${snippet.slice(0, 120)}`);
        }
        return await response.json();
      }

      if (response.status >= 500 || response.status === 429) {
        throw new Error(`Server returned ${response.status} for ${url}`);
      } else {
        throw new Error(`Request failed (${response.status}) for ${url}`);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;
      if (attempt < retries) {
        const backoff = delayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, backoff));
      }
    }
  }

  throw lastError;
}

// Search Open Food Facts for products with fast 1.5s timeout
export async function searchOpenFoodFacts(query: string): Promise<any[]> {
  try {
    const data = await safeFetchJson(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&countries=India&json=1&page_size=8`,
      0,
      100,
      1500
    );
    return data.products || [];
  } catch (error) {
    console.warn(`Open Food Facts search skipped for "${query}":`, error);
    return [];
  }
}

// Fetch training data in parallel from Open Food Facts
export async function fetchTrainingData(): Promise<any[]> {
  const categories = ['vegetables', 'legumes', 'whole-grains', 'fruits', 'nuts', 'dairy', 'snacks', 'beverages'];
  
  const results = await Promise.allSettled(
    categories.map(category =>
      safeFetchJson(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(category)}&countries=India&json=1&page_size=25`,
        1,
        200,
        3000
      )
    )
  );

  const allData: any[] = [];

  for (const result of results) {
    if (result.status !== 'fulfilled' || !result.value?.products) continue;
    const products = result.value.products;

    for (const product of products) {
      if (!product.nutriments) continue;

      // Open Food Facts reports sodium in grams (sodium_100g); convert to milligrams (mg, ×1000)
      const rawSodiumGrams = toNumber(product.nutriments['sodium_100g'] ?? product.nutriments['sodium'], 0);
      const sodiumMg = rawSodiumGrams * 1000;

      const nutrition = {
        calories: toNumber(product.nutriments['energy-kcal_100g'] || (product.nutriments.energy_100g ? product.nutriments.energy_100g / 4.184 : 0), 0),
        protein: toNumber(product.nutriments.proteins_100g, 0),
        carbs: toNumber(product.nutriments.carbohydrates_100g, 0),
        fat: toNumber(product.nutriments.fat_100g, 0),
        saturatedFat: toNumber(product.nutriments['saturated-fat_100g'], 0),
        sugar: toNumber(product.nutriments.sugars_100g, 0),
        fiber: toNumber(product.nutriments.fiber_100g, 0),
        sodium: sodiumMg,
        processingLevel: getProcessingLevel(product),
        healthScore: calculateBasicHealthScore({
          calories: product.nutriments['energy-kcal_100g'] || (product.nutriments.energy_100g ? product.nutriments.energy_100g / 4.184 : 0),
          protein: product.nutriments.proteins_100g || 0,
          fiber: product.nutriments.fiber_100g || 0,
          fat: product.nutriments.fat_100g || 0,
          saturatedFat: product.nutriments['saturated-fat_100g'] || 0,
          sugar: product.nutriments.sugars_100g || 0,
          sodium: sodiumMg
        })
      };

      allData.push(nutrition);
    }
  }

  return allData;
}
