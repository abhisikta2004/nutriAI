/**
 * Single source of truth for allergen detection across NutriAI.
 * Uses a three-layer detection strategy:
 * 1. Direct match in food name
 * 2. Keyword-based category expansion (e.g. dairy -> cheese, butter, paneer)
 * 3. Food composition recipe map (e.g. butter chicken -> dairy, lactose, chicken)
 */

export const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  // Dairy/Milk products
  dairy: ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'paneer', 'ghee', 'whey', 'casein', 'lactose', 'curd', 'kheer', 'kulfi', 'lassi', 'raita', 'malai', 'rabri', 'basundi', 'ice cream', 'milkshake', 'latte', 'cappuccino', 'mozzarella', 'cheddar', 'parmesan', 'ricotta'],
  milk: ['milk', 'dairy', 'cheese', 'butter', 'cream', 'yogurt', 'paneer', 'ghee', 'whey', 'casein', 'lactose', 'curd', 'kheer', 'kulfi', 'lassi', 'raita', 'malai', 'ice cream', 'milkshake', 'latte', 'cappuccino'],
  lactose: ['milk', 'dairy', 'cheese', 'butter', 'cream', 'yogurt', 'paneer', 'curd', 'ice cream', 'lassi', 'kheer', 'kulfi', 'milkshake'],
  
  // Eggs
  eggs: ['egg', 'mayonnaise', 'meringue', 'albumin', 'omelette', 'omelet', 'scrambled', 'fried egg', 'boiled egg', 'egg curry', 'egg bhurji', 'cake', 'custard', 'pudding', 'french toast', 'pancake', 'waffle', 'brioche', 'quiche'],
  egg: ['egg', 'mayonnaise', 'meringue', 'omelette', 'omelet', 'scrambled', 'cake', 'custard', 'pudding', 'pancake', 'waffle', 'quiche'],
  
  // Nuts
  peanuts: ['peanut', 'groundnut', 'monkey nut', 'satay', 'pad thai', 'peanut butter', 'chikki'],
  peanut: ['peanut', 'groundnut', 'peanut butter', 'satay', 'chikki'],
  'tree nuts': ['almond', 'walnut', 'cashew', 'pistachio', 'hazelnut', 'macadamia', 'pecan', 'chestnut', 'brazil nut', 'pine nut', 'badam', 'kaju', 'pista', 'akhrot'],
  nuts: ['almond', 'walnut', 'cashew', 'pistachio', 'hazelnut', 'macadamia', 'pecan', 'peanut', 'groundnut', 'badam', 'kaju', 'pista', 'akhrot', 'chikki', 'praline', 'marzipan', 'nougat'],
  almond: ['almond', 'badam', 'marzipan', 'macaroon', 'frangipane'],
  cashew: ['cashew', 'kaju', 'kaju katli', 'kaju barfi'],
  walnut: ['walnut', 'akhrot', 'brownie'],
  pistachio: ['pistachio', 'pista', 'kulfi'],
  
  // Soy
  soy: ['soy', 'soya', 'tofu', 'tempeh', 'edamame', 'miso', 'soy sauce', 'soy milk', 'soybean'],
  soya: ['soy', 'soya', 'tofu', 'tempeh', 'edamame', 'miso', 'soy sauce', 'soy milk'],
  
  // Wheat/Gluten
  wheat: ['wheat', 'bread', 'flour', 'pasta', 'noodle', 'roti', 'chapati', 'naan', 'paratha', 'poori', 'puri', 'kulcha', 'bhatura', 'samosa', 'pakora', 'pizza', 'cake', 'cookie', 'biscuit', 'cracker', 'tortilla', 'couscous', 'semolina', 'suji', 'maida', 'atta'],
  gluten: ['wheat', 'barley', 'rye', 'oats', 'bread', 'pasta', 'noodle', 'cereal', 'beer', 'pizza', 'cake', 'cookie', 'biscuit', 'roti', 'chapati', 'naan', 'paratha', 'samosa', 'pakora'],
  
  // Seafood
  fish: ['fish', 'salmon', 'tuna', 'cod', 'sardine', 'anchovy', 'mackerel', 'trout', 'tilapia', 'bass', 'herring', 'halibut', 'pomfret', 'rohu', 'hilsa', 'surmai', 'bangda', 'rawas', 'fish curry', 'fish fry'],
  shellfish: ['shrimp', 'prawn', 'crab', 'lobster', 'oyster', 'mussel', 'clam', 'scallop', 'squid', 'calamari', 'octopus', 'jhinga', 'kolambi'],
  seafood: ['fish', 'shrimp', 'prawn', 'crab', 'lobster', 'oyster', 'mussel', 'clam', 'scallop', 'squid', 'salmon', 'tuna', 'pomfret', 'surmai', 'rawas'],
  prawn: ['prawn', 'shrimp', 'jhinga', 'kolambi'],
  shrimp: ['shrimp', 'prawn', 'jhinga'],
  crab: ['crab', 'crabmeat'],
  
  // Other common allergens
  sesame: ['sesame', 'tahini', 'hummus', 'til', 'gingelly', 'sesame oil', 'til chikki'],
  mustard: ['mustard', 'sarson', 'rai'],
  celery: ['celery', 'celeriac'],
  sulphites: ['wine', 'dried fruit', 'pickles', 'vinegar'],
  lupin: ['lupin', 'lupini'],
  molluscs: ['oyster', 'mussel', 'clam', 'scallop', 'squid', 'octopus', 'snail'],
  
  // Meat (for dietary preference / sensitivities)
  'non-veg': ['chicken', 'mutton', 'lamb', 'beef', 'pork', 'fish', 'prawn', 'shrimp', 'crab', 'egg', 'meat', 'bacon', 'ham', 'sausage', 'kebab', 'tikka', 'tandoori', 'biryani chicken', 'butter chicken', 'fish curry'],
  meat: ['chicken', 'mutton', 'lamb', 'beef', 'pork', 'meat', 'bacon', 'ham', 'sausage', 'kebab'],
  chicken: ['chicken', 'poultry', 'butter chicken', 'chicken curry', 'chicken tikka', 'tandoori chicken', 'chicken biryani', 'chicken nuggets', 'fried chicken'],
  
  // Spices (for sensitivities)
  spicy: ['chili', 'chilli', 'pepper', 'spicy', 'hot sauce', 'wasabi', 'horseradish'],
};

export const FOOD_ALLERGEN_MAP: Record<string, string[]> = {
  'butter chicken': ['dairy', 'lactose', 'chicken'],
  'paneer': ['dairy', 'lactose', 'milk'],
  'cheese': ['dairy', 'lactose', 'milk'],
  'pizza': ['dairy', 'wheat', 'gluten', 'cheese'],
  'pasta': ['wheat', 'gluten'],
  'naan': ['wheat', 'gluten', 'dairy'],
  'cake': ['wheat', 'gluten', 'eggs', 'dairy'],
  'ice cream': ['dairy', 'lactose', 'milk'],
  'biryani': ['wheat', 'gluten'],
  'samosa': ['wheat', 'gluten'],
  'pakora': ['wheat', 'gluten'],
  'mayonnaise': ['eggs', 'egg'],
  'custard': ['eggs', 'dairy', 'milk'],
  'kheer': ['dairy', 'milk', 'nuts'],
  'gulab jamun': ['dairy', 'wheat', 'milk'],
  'jalebi': ['wheat', 'gluten'],
  'kulfi': ['dairy', 'milk', 'nuts'],
  'lassi': ['dairy', 'milk', 'lactose'],
  'raita': ['dairy', 'milk'],
  'malai kofta': ['dairy', 'nuts'],
  'korma': ['dairy', 'nuts'],
  'fish curry': ['fish', 'seafood'],
  'prawn': ['shellfish', 'seafood', 'prawn'],
  'shrimp': ['shellfish', 'seafood', 'shrimp'],
  'egg curry': ['eggs', 'egg'],
  'omelette': ['eggs', 'egg'],
  'french toast': ['eggs', 'wheat', 'dairy'],
  'pancake': ['eggs', 'wheat', 'dairy'],
};

/**
 * Detect allergens present in a food item matching user's allergy profile.
 */
export function detectAllergens(foodName: string, userAllergies: string[]): string[] {
  const allergenWarning: string[] = [];
  const foodNameLower = foodName.toLowerCase();

  for (const allergy of userAllergies) {
    const allergyLower = allergy.toLowerCase().trim();
    if (!allergyLower) continue;

    // Check 1: Direct match in food name
    if (foodNameLower.includes(allergyLower)) {
      if (!allergenWarning.includes(allergy)) {
        allergenWarning.push(allergy);
      }
      continue;
    }

    // Check 2: Keyword-based detection
    const keywords = ALLERGEN_KEYWORDS[allergyLower] || [];
    let matchedKeyword = false;
    for (const keyword of keywords) {
      if (foodNameLower.includes(keyword.toLowerCase())) {
        if (!allergenWarning.includes(allergy)) {
          allergenWarning.push(allergy);
        }
        matchedKeyword = true;
        break;
      }
    }
    if (matchedKeyword) continue;

    // Check 3: Food composition recipe map
    for (const [food, containedAllergens] of Object.entries(FOOD_ALLERGEN_MAP)) {
      if (foodNameLower.includes(food)) {
        if (containedAllergens.includes(allergyLower) || 
            containedAllergens.some(a => allergyLower.includes(a) || a.includes(allergyLower))) {
          if (!allergenWarning.includes(allergy)) {
            allergenWarning.push(allergy);
          }
          break;
        }
      }
    }
  }

  return allergenWarning;
}
