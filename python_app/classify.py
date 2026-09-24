from typing import List

def get_food_category(food_name: str, ingredients: str = '') -> str:
    name = food_name.lower()
    ing = ingredients.lower()
    
    # Sweet/Dessert items
    if any(k in name for k in [
        'chocolate', 'candy', 'cookie', 'cake', 'ice cream', 'dessert', 'sweet', 'brownie', 
        'pastry', 'muffin', 'donut', 'gulab jamun', 'rasgulla', 'jalebi', 'ladoo', 'barfi', 
        'halwa', 'kheer', 'kulfi', 'rasmalai', 'peda', 'mysore pak'
    ]) or ('sugar' in ing and 'cocoa' in ing):
        return 'sweet'
        
    # Salty snacks
    if any(k in name for k in ['chip', 'crisp', 'cracker', 'pretzel', 'popcorn', 'snack', 'namkeen', 'mixture', 'bhujia', 'sev', 'makhana']):
        return 'salty-snack'
        
    # Beverages
    if any(k in name for k in ['soda', 'juice', 'drink', 'cola', 'beverage', 'tea', 'coffee', 'milkshake', 'smoothie', 'lassi', 'chaas']):
        return 'beverage'
        
    # Fried foods
    if any(k in name for k in ['fried', 'fries', 'nugget', 'tempura', 'pakora', 'pakoda', 'samosa', 'bhaji', 'vada', 'kachori', 'poori', 'bhatura']):
        return 'fried'
        
    # Fast food
    if any(k in name for k in ['burger', 'pizza', 'sandwich', 'hot dog', 'wrap', 'taco', 'roll', 'frankie']):
        return 'fast-food'
        
    # Main meals - rice/grain based
    if any(k in name for k in ['rice', 'biryani', 'pulao', 'fried rice', 'khichdi', 'curd rice']):
        return 'rice-dish'
        
    # Curry/gravy dishes
    if any(k in name for k in ['curry', 'masala', 'korma', 'tikka', 'butter chicken', 'paneer', 'dal', 'sambar', 'rajma', 'chole']):
        return 'curry'
        
    # Pasta/Noodles
    if any(k in name for k in ['pasta', 'noodle', 'spaghetti', 'lasagna', 'chow mein', 'hakka', 'maggi']):
        return 'pasta-noodles'
        
    # Breakfast items
    if any(k in name for k in ['cereal', 'oatmeal', 'pancake', 'waffle', 'idli', 'dosa', 'poha', 'upma', 'paratha', 'chilla', 'uttapam']):
        return 'breakfast'
        
    return 'general'

def detect_meal_type(food_name: str) -> str:
    name = food_name.lower()
    
    # Breakfast items
    if any(k in name for k in [
        'cereal', 'oatmeal', 'porridge', 'pancake', 'waffle', 'toast', 'egg', 'bacon', 
        'sausage', 'paratha', 'idli', 'dosa', 'poha', 'upma', 'cornflakes', 'muesli', 'granola', 'breakfast', 'chilla', 'uttapam'
    ]):
        return 'breakfast'
        
    # Lunch/Dinner items (main meals)
    if any(k in name for k in [
        'rice', 'biryani', 'curry', 'dal', 'roti', 'naan', 'pasta', 'noodle', 'stir fry',
        'steak', 'chicken', 'fish', 'salmon', 'burger', 'pizza', 'sandwich', 'wrap', 'salad',
        'soup', 'thali', 'paneer', 'tikka', 'kebab', 'pulao', 'fried rice', 'chow mein', 'manchurian',
        'korma', 'masala', 'vindaloo', 'lasagna', 'casserole', 'roast'
    ]):
        return 'lunch-dinner'
        
    # Snack items
    if any(k in name for k in [
        'chip', 'crisp', 'cookie', 'biscuit', 'chocolate', 'candy', 'popcorn', 'nuts', 'cracker',
        'bar', 'samosa', 'pakora', 'bhaji', 'vada', 'chaat', 'ice cream', 'cake', 'pastry',
        'muffin', 'donut', 'brownie', 'namkeen', 'makhana', 'seeds', 'snack'
    ]):
        return 'snack'
        
    return 'any'

def get_category_matched_search_terms(food_name: str, category: str, meal_type: str) -> List[str]:
    lower_name = food_name.lower()
    
    # Indian curry / gravy dishes
    if any(k in lower_name for k in ['butter chicken', 'chicken curry', 'tikka masala', 'korma']):
        return ['tandoori chicken', 'chicken tikka grilled', 'chicken kebab', 'grilled chicken breast']
        
    if any(k in lower_name for k in ['paneer', 'palak', 'matar']):
        return ['tofu curry', 'grilled paneer tikka', 'palak tofu', 'cottage cheese grilled']
        
    if any(k in lower_name for k in ['dal', 'lentil', 'rajma', 'chole', 'chana']):
        return ['moong dal soup', 'masoor dal', 'sprouted lentils', 'chickpea salad']
        
    # Rice dishes
    if any(k in lower_name for k in ['biryani', 'pulao', 'fried rice']):
        return ['brown rice pulao', 'quinoa biryani', 'vegetable khichdi', 'millets pulao']
        
    if 'rice' in lower_name and 'fried' not in lower_name:
        return ['brown rice', 'quinoa', 'millets cooked', 'cauliflower rice']
        
    # Bread / Roti
    if any(k in lower_name for k in ['naan', 'paratha', 'kulcha', 'bhatura', 'poori', 'puri']):
        return ['whole wheat roti', 'multigrain roti', 'bajra roti', 'jowar roti']
        
    if any(k in lower_name for k in ['roti', 'chapati', 'bread']):
        return ['multigrain bread', 'oats roti', 'ragi roti', 'whole wheat sourdough']
        
    # Fried snacks
    if any(k in lower_name for k in ['samosa', 'pakora', 'pakoda', 'bhaji', 'vada', 'kachori']):
        return ['baked samosa', 'air fried pakora', 'grilled paneer tikka', 'roasted chickpeas']
        
    if any(k in lower_name for k in ['fries', 'french fries']):
        return ['baked sweet potato fries', 'air fried potato wedges', 'zucchini fries baked', 'carrot fries']
        
    # Chicken / Meat
    if any(k in lower_name for k in ['fried chicken', 'chicken nuggets', 'chicken wings']):
        return ['grilled chicken breast', 'baked chicken', 'tandoori chicken', 'chicken kebab']
        
    if any(k in lower_name for k in ['chicken', 'meat', 'mutton', 'lamb', 'beef']):
        return ['grilled chicken breast', 'lean turkey', 'grilled fish fillet', 'baked salmon']
        
    # Fish / Seafood
    if any(k in lower_name for k in ['fish fry', 'fried fish']):
        return ['grilled fish', 'baked salmon', 'steamed fish', 'fish tikka']
        
    if any(k in lower_name for k in ['fish', 'salmon', 'prawn', 'shrimp']):
        return ['grilled salmon', 'steamed fish', 'baked cod', 'grilled prawns']
        
    # Pizza / Burger
    if 'pizza' in lower_name:
        return ['whole wheat pizza', 'cauliflower crust pizza', 'grilled vegetable wrap', 'stuffed bell peppers']
        
    if 'burger' in lower_name:
        return ['grilled chicken sandwich', 'lettuce wrap burger', 'turkey burger', 'veggie burger']
        
    # Pasta / Noodles
    if any(k in lower_name for k in ['pasta', 'macaroni', 'spaghetti', 'lasagna']):
        return ['whole wheat pasta', 'chickpea pasta', 'lentil pasta', 'zucchini noodles']
        
    if any(k in lower_name for k in ['noodle', 'chow mein', 'hakka', 'maggi']):
        return ['soba noodles', 'rice noodles', 'vegetable stir fry', 'zucchini noodles']
        
    # Sweets / Desserts
    if any(k in lower_name for k in ['gulab jamun', 'rasgulla', 'jalebi', 'ladoo', 'barfi', 'halwa']):
        return ['dates ladoo', 'ragi ladoo', 'oats ladoo', 'dry fruit barfi']
        
    if any(k in lower_name for k in ['cake', 'pastry', 'brownie', 'muffin', 'donut']):
        return ['banana bread', 'oats muffin', 'protein brownie', 'date walnut cake']
        
    if any(k in lower_name for k in ['ice cream', 'kulfi']):
        return ['frozen yogurt', 'banana nice cream', 'coconut ice cream', 'fruit sorbet']
        
    if any(k in lower_name for k in ['chocolate', 'candy']):
        return ['dark chocolate 85%', 'cacao nibs', 'dates chocolate', 'almond butter cups']
        
    # Cookies / Biscuits
    if any(k in lower_name for k in ['cookie', 'biscuit', 'cream']):
        return ['oats cookies', 'ragi biscuits', 'multigrain digestive', 'almond cookies']
        
    # Chips / Snacks
    if any(k in lower_name for k in ['chip', 'crisp', 'namkeen', 'lay', 'kurkure', 'bhujia']):
        return ['roasted makhana fox nuts', 'roasted chana masala', 'baked multigrain chips', 'masala peanuts roasted']
        
    # Beverages
    if any(k in lower_name for k in ['soda', 'cola', 'soft drink', 'pepsi', 'coke']):
        return ['coconut water', 'lime water', 'green tea', 'buttermilk']
        
    if any(k in lower_name for k in ['milkshake', 'shake', 'smoothie']):
        return ['protein smoothie', 'banana oat smoothie', 'green smoothie', 'yogurt smoothie']
        
    if any(k in lower_name for k in ['juice', 'drink']):
        return ['coconut water', 'vegetable juice', 'infused water', 'green tea']
        
    # Breakfast
    if any(k in lower_name for k in ['dosa', 'idli', 'uttapam']):
        return ['ragi dosa', 'oats idli', 'moong dal chilla', 'vegetable uttapam']
        
    if any(k in lower_name for k in ['poha', 'upma', 'paratha']):
        return ['vegetable poha', 'oats upma', 'multigrain paratha', 'sprouts paratha']
        
    if any(k in lower_name for k in ['cereal', 'cornflakes']):
        return ['oatmeal', 'muesli', 'quinoa porridge', 'chia pudding']
        
    # Eggs
    if any(k in lower_name for k in ['egg', 'omelette', 'omelet']):
        return ['egg white omelette', 'boiled eggs', 'poached eggs', 'scrambled egg whites']
        
    # Fruit
    if any(k in lower_name for k in ['banana', 'apple', 'mango', 'orange', 'fruit']):
        return ['berries mixed', 'papaya', 'guava', 'watermelon']
        
    # Meal-type based fallback
    if meal_type == 'breakfast':
        return ['oats porridge', 'moong dal chilla', 'vegetable poha', 'egg white omelette']
    elif meal_type == 'lunch-dinner':
        return ['grilled chicken breast', 'dal tadka', 'vegetable stir fry', 'quinoa bowl']
        
    # Default healthy snacks
    return ['mixed nuts', 'roasted chickpeas', 'greek yogurt', 'fresh fruit bowl']
