export interface AppleHealthActivity {
  activeEnergyBurned: number; // in kcal (Move Ring)
  basalEnergyBurned: number;  // in kcal (BMR)
  stepCount: number;
  flightsClimbed?: number;
  exerciseMinutes?: number;
  restingHeartRate?: number;
  bodyWeight?: number;        // in kg
  lastSyncedAt: string;
}

export interface AppleHealthDietaryLog {
  id: string;
  foodName: string;
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
  syncMethod: "shortcut" | "file" | "manual";
}
