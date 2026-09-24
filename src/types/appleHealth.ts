export interface AppleHealthActivity {
  activeEnergyBurned: number; // in kcal (Move Ring)
  basalEnergyBurned: number;  // in kcal (BMR)
  stepCount: number;          // Daily Steps
  lastSyncedAt: string;
}

export interface AppleHealthDietaryLog {
  id: string;
  foodName: string;                     // Logged item name (e.g. "Cauliflower Crust Pizza" or "Pepperoni Pizza")
  originalDishName?: string;            // Original dish identified from photo/voice
  scannedImage?: string;                // Base64 thumbnail of the scanned food photo
  loggedChoiceType: "original" | "healthier_alternative"; // Whether user logged the same dish or a healthier alternative
  alternativeName?: string;             // If healthier alternative chosen, the alternative title
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  loggedAt: string;
  source: "NutriAI Scanner" | "Voice Advisor" | "Manual Log";
}

export interface AppleHealthSummary {
  dailyTargetCalories: number;
  dailyTargetProtein: number;
  dailyTargetCarbs: number;
  dailyTargetFat: number;
  totalCaloriesConsumed: number;
  totalProteinConsumed: number;
  totalCarbsConsumed: number;
  totalFatConsumed: number;
  remainingCalories: number;
  remainingProtein: number;
  moveProgress: number;    // 0 - 100+%
  intakeProgress: number;  // 0 - 100+%
  proteinProgress: number; // 0 - 100+%
  netCalories: number;     // Consumed - ActiveBurned
}

export interface AppleHealthSyncState {
  isConnected: boolean;
  isAutoSyncEnabled: boolean;
  activity: AppleHealthActivity;
  loggedMeals: AppleHealthDietaryLog[];
  syncMethod: "shortcut" | "manual";
}

