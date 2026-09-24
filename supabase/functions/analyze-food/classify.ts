// Get food category for similar item matching
export function getFoodCategory(foodName: string, ingredients: string = ''): string {
  const name = foodName.toLowerCase();
  const ing = ingredients.toLowerCase();
  
  // Sweet/Dessert items
  if (name.includes('chocolate') || name.includes('candy') || name.includes('cookie') || 
      name.includes('cake') || name.includes('ice cream') || name.includes('dessert') ||
      name.includes('sweet') || name.includes('brownie') || name.includes('pastry') ||
      name.includes('muffin') || name.includes('donut') || (ing.includes('sugar') && ing.includes('cocoa'))) {
    return 'sweet';
  }
  
  // Salty snacks
  if (name.includes('chip') || name.includes('crisp') || name.includes('cracker') ||
      name.includes('pretzel') || name.includes('popcorn') || name.includes('snack') ||
      name.includes('namkeen') || name.includes('mixture')) {
    return 'salty-snack';
  }
  
  // Beverages
  if (name.includes('soda') || name.includes('juice') || name.includes('drink') ||
      name.includes('cola') || name.includes('beverage') || name.includes('tea') || 
      name.includes('coffee') || name.includes('milkshake') || name.includes('smoothie')) {
    return 'beverage';
  }
  
  // Fried foods
  if (name.includes('fried') || name.includes('fries') || name.includes('nugget') ||
      name.includes('tempura') || name.includes('pakora') || name.includes('samosa') ||
      name.includes('bhaji') || name.includes('vada')) {
    return 'fried';
  }
  
  // Fast food
  if (name.includes('burger') || name.includes('pizza') || name.includes('sandwich') ||
      name.includes('hot dog') || name.includes('wrap') || name.includes('taco')) {
    return 'fast-food';
  }
  
  // Main meals - rice/grain based
  if (name.includes('rice') || name.includes('biryani') || name.includes('pulao') ||
      name.includes('fried rice') || name.includes('khichdi')) {
    return 'rice-dish';
  }
  
  // Curry/gravy dishes
  if (name.includes('curry') || name.includes('masala') || name.includes('korma') ||
      name.includes('tikka') || name.includes('butter chicken') || name.includes('paneer')) {
    return 'curry';
  }
  
  // Pasta/Noodles
  if (name.includes('pasta') || name.includes('noodle') || name.includes('spaghetti') ||
      name.includes('lasagna') || name.includes('chow mein') || name.includes('hakka')) {
    return 'pasta-noodles';
  }
  
  // Breakfast items
  if (name.includes('cereal') || name.includes('oatmeal') || name.includes('pancake') ||
      name.includes('waffle') || name.includes('idli') || name.includes('dosa') ||
      name.includes('poha') || name.includes('upma') || name.includes('paratha')) {
    return 'breakfast';
  }
  
  return 'general';
}

// Detect meal type based on food name
export function detectMealType(foodName: string): 'breakfast' | 'lunch-dinner' | 'snack' | 'any' {
  const name = foodName.toLowerCase();
  
  // Breakfast items
  if (name.includes('cereal') || name.includes('oatmeal') || name.includes('porridge') ||
      name.includes('pancake') || name.includes('waffle') || name.includes('toast') ||
      name.includes('egg') || name.includes('bacon') || name.includes('sausage') ||
      name.includes('paratha') || name.includes('idli') || name.includes('dosa') ||
      name.includes('poha') || name.includes('upma') || name.includes('cornflakes') ||
      name.includes('muesli') || name.includes('granola') || name.includes('breakfast')) {
    return 'breakfast';
  }
  
  // Lunch/Dinner items (main meals)
  if (name.includes('rice') || name.includes('biryani') || name.includes('curry') ||
      name.includes('dal') || name.includes('roti') || name.includes('naan') ||
      name.includes('pasta') || name.includes('noodle') || name.includes('stir fry') ||
      name.includes('steak') || name.includes('chicken') || name.includes('fish') ||
      name.includes('salmon') || name.includes('burger') || name.includes('pizza') ||
      name.includes('sandwich') || name.includes('wrap') || name.includes('salad') ||
      name.includes('soup') || name.includes('thali') || name.includes('paneer') ||
      name.includes('tikka') || name.includes('kebab') || name.includes('pulao') ||
      name.includes('fried rice') || name.includes('chow mein') || name.includes('manchurian') ||
      name.includes('korma') || name.includes('masala') || name.includes('vindaloo') ||
      name.includes('lasagna') || name.includes('casserole') || name.includes('roast')) {
    return 'lunch-dinner';
  }
  
  // Snack items
  if (name.includes('chip') || name.includes('crisp') || name.includes('cookie') ||
      name.includes('biscuit') || name.includes('chocolate') || name.includes('candy') ||
      name.includes('popcorn') || name.includes('nuts') || name.includes('cracker') ||
      name.includes('bar') || name.includes('samosa') || name.includes('pakora') ||
      name.includes('bhaji') || name.includes('vada') || name.includes('chaat') ||
      name.includes('ice cream') || name.includes('cake') || name.includes('pastry') ||
      name.includes('muffin') || name.includes('donut') || name.includes('brownie')) {
    return 'snack';
  }
  
  return 'any';
}

// Get search terms that match the same food category - IMPROVED for better suggestions
export function getCategoryMatchedSearchTerms(foodName: string, category: string, mealType: string): string[] {
  const lowerName = foodName.toLowerCase();
  
  // INDIAN CURRY/GRAVY dishes - suggest healthier Indian curries
  if (lowerName.includes('butter chicken') || lowerName.includes('chicken curry') ||
      lowerName.includes('tikka masala') || lowerName.includes('korma')) {
    return ['tandoori chicken', 'chicken tikka grilled', 'chicken kebab', 'grilled chicken breast'];
  }
  
  if (lowerName.includes('paneer') || lowerName.includes('palak') || lowerName.includes('matar')) {
    return ['tofu curry', 'grilled paneer tikka', 'palak tofu', 'cottage cheese grilled'];
  }
  
  if (lowerName.includes('dal') || lowerName.includes('lentil') || lowerName.includes('rajma') ||
      lowerName.includes('chole') || lowerName.includes('chana')) {
    return ['moong dal soup', 'masoor dal', 'sprouted lentils', 'chickpea salad'];
  }
  
  // RICE dishes - suggest healthier rice alternatives
  if (lowerName.includes('biryani') || lowerName.includes('pulao') || lowerName.includes('fried rice')) {
    return ['brown rice pulao', 'quinoa biryani', 'vegetable khichdi', 'millets pulao'];
  }
  
  if (lowerName.includes('rice') && !lowerName.includes('fried')) {
    return ['brown rice', 'quinoa', 'millets cooked', 'cauliflower rice'];
  }
  
  // BREAD/ROTI - suggest healthier flatbreads
  if (lowerName.includes('naan') || lowerName.includes('paratha') || lowerName.includes('kulcha') ||
      lowerName.includes('bhatura') || lowerName.includes('poori') || lowerName.includes('puri')) {
    return ['whole wheat roti', 'multigrain roti', 'bajra roti', 'jowar roti'];
  }
  
  if (lowerName.includes('roti') || lowerName.includes('chapati') || lowerName.includes('bread')) {
    return ['multigrain bread', 'oats roti', 'ragi roti', 'whole wheat sourdough'];
  }
  
  // FRIED SNACKS - suggest baked/grilled versions
  if (lowerName.includes('samosa') || lowerName.includes('pakora') || lowerName.includes('pakoda') ||
      lowerName.includes('bhaji') || lowerName.includes('vada') || lowerName.includes('kachori')) {
    return ['baked samosa', 'air fried pakora', 'grilled paneer tikka', 'roasted chickpeas'];
  }
  
  if (lowerName.includes('fries') || lowerName.includes('french fries')) {
    return ['baked sweet potato fries', 'air fried potato wedges', 'zucchini fries baked', 'carrot fries'];
  }
  
  // CHICKEN/MEAT - suggest grilled/baked versions
  if (lowerName.includes('fried chicken') || lowerName.includes('chicken nuggets') ||
      lowerName.includes('chicken wings')) {
    return ['grilled chicken breast', 'baked chicken', 'tandoori chicken', 'chicken kebab'];
  }
  
  if (lowerName.includes('chicken') || lowerName.includes('meat') || lowerName.includes('mutton') ||
      lowerName.includes('lamb') || lowerName.includes('beef')) {
    return ['grilled chicken breast', 'lean turkey', 'grilled fish fillet', 'baked salmon'];
  }
  
  // FISH/SEAFOOD - suggest healthier preparations
  if (lowerName.includes('fish fry') || lowerName.includes('fried fish')) {
    return ['grilled fish', 'baked salmon', 'steamed fish', 'fish tikka'];
  }
  
  if (lowerName.includes('fish') || lowerName.includes('salmon') || lowerName.includes('prawn') ||
      lowerName.includes('shrimp')) {
    return ['grilled salmon', 'steamed fish', 'baked cod', 'grilled prawns'];
  }
  
  // PIZZA/BURGER - suggest healthier versions
  if (lowerName.includes('pizza')) {
    return ['whole wheat pizza', 'cauliflower crust pizza', 'grilled vegetable wrap', 'stuffed bell peppers'];
  }
  
  if (lowerName.includes('burger')) {
    return ['grilled chicken sandwich', 'lettuce wrap burger', 'turkey burger', 'veggie burger'];
  }
  
  // PASTA/NOODLES - suggest whole grain versions
  if (lowerName.includes('pasta') || lowerName.includes('macaroni') || lowerName.includes('spaghetti') ||
      lowerName.includes('lasagna')) {
    return ['whole wheat pasta', 'chickpea pasta', 'lentil pasta', 'zucchini noodles'];
  }
  
  if (lowerName.includes('noodle') || lowerName.includes('chow mein') || lowerName.includes('hakka')) {
    return ['soba noodles', 'rice noodles', 'vegetable stir fry', 'zucchini noodles'];
  }
  
  // SWEETS/DESSERTS - suggest healthier alternatives
  if (lowerName.includes('gulab jamun') || lowerName.includes('rasgulla') || lowerName.includes('jalebi') ||
      lowerName.includes('ladoo') || lowerName.includes('barfi') || lowerName.includes('halwa')) {
    return ['dates ladoo', 'ragi ladoo', 'oats ladoo', 'dry fruit barfi'];
  }
  
  if (lowerName.includes('cake') || lowerName.includes('pastry') || lowerName.includes('brownie') ||
      lowerName.includes('muffin') || lowerName.includes('donut')) {
    return ['banana bread', 'oats muffin', 'protein brownie', 'date walnut cake'];
  }
  
  if (lowerName.includes('ice cream') || lowerName.includes('kulfi')) {
    return ['frozen yogurt', 'banana nice cream', 'coconut ice cream', 'fruit sorbet'];
  }
  
  if (lowerName.includes('chocolate') || lowerName.includes('candy')) {
    return ['dark chocolate 85%', 'cacao nibs', 'dates chocolate', 'almond butter cups'];
  }
  
  // COOKIES/BISCUITS - suggest healthier versions
  if (lowerName.includes('cookie') || lowerName.includes('biscuit') || lowerName.includes('cream')) {
    return ['oats cookies', 'ragi biscuits', 'multigrain digestive', 'almond cookies'];
  }
  
  // CHIPS/SNACKS - suggest baked alternatives with variety
  if (lowerName.includes('chip') || lowerName.includes('crisp') || lowerName.includes('namkeen') ||
      lowerName.includes('lay') || lowerName.includes('kurkure') || lowerName.includes('bhujia')) {
    return ['roasted makhana fox nuts', 'roasted chana masala', 'baked multigrain chips', 'masala peanuts roasted'];
  }
  
  // PACKAGED SNACKS specifically
  if (lowerName.includes('maggi') || lowerName.includes('instant noodle') || lowerName.includes('cup noodle')) {
    return ['oats noodles', 'vegetable hakka noodles', 'rice noodles', 'soba noodles'];
  }
  
  // BEVERAGES - suggest healthier drinks
  if (lowerName.includes('soda') || lowerName.includes('cola') || lowerName.includes('soft drink') ||
      lowerName.includes('pepsi') || lowerName.includes('coke')) {
    return ['coconut water', 'lime water', 'green tea', 'buttermilk'];
  }
  
  if (lowerName.includes('milkshake') || lowerName.includes('shake') || lowerName.includes('smoothie')) {
    return ['protein smoothie', 'banana oat smoothie', 'green smoothie', 'yogurt smoothie'];
  }
  
  if (lowerName.includes('juice') || lowerName.includes('drink')) {
    return ['coconut water', 'vegetable juice', 'infused water', 'green tea'];
  }
  
  // BREAKFAST items
  if (lowerName.includes('dosa') || lowerName.includes('idli') || lowerName.includes('uttapam')) {
    return ['ragi dosa', 'oats idli', 'moong dal chilla', 'vegetable uttapam'];
  }
  
  if (lowerName.includes('poha') || lowerName.includes('upma') || lowerName.includes('paratha')) {
    return ['vegetable poha', 'oats upma', 'multigrain paratha', 'sprouts paratha'];
  }
  
  if (lowerName.includes('cereal') || lowerName.includes('cornflakes')) {
    return ['oatmeal', 'muesli', 'quinoa porridge', 'chia pudding'];
  }
  
  // EGG dishes
  if (lowerName.includes('egg') || lowerName.includes('omelette') || lowerName.includes('omelet')) {
    return ['egg white omelette', 'boiled eggs', 'poached eggs', 'scrambled egg whites'];
  }
  
  // FRUIT - suggest similar fruits
  if (lowerName.includes('banana') || lowerName.includes('apple') || lowerName.includes('mango') ||
      lowerName.includes('orange') || lowerName.includes('fruit')) {
    return ['berries mixed', 'papaya', 'guava', 'watermelon'];
  }
  
  // Meal-type based fallback
  if (mealType === 'breakfast') {
    return ['oats porridge', 'moong dal chilla', 'vegetable poha', 'egg white omelette'];
  } else if (mealType === 'lunch-dinner') {
    return ['grilled chicken breast', 'dal tadka', 'vegetable stir fry', 'quinoa bowl'];
  }
  
  // Default healthy snacks
  return ['mixed nuts', 'roasted chickpeas', 'greek yogurt', 'fresh fruit bowl'];
}
