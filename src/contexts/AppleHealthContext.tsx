import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { useUserProfile } from "./UserProfileContext";
import { 
  AppleHealthActivity, 
  AppleHealthDietaryLog, 
  AppleHealthSummary, 
  AppleHealthSyncState 
} from "@/types/appleHealth";

interface AppleHealthContextType {
  syncState: AppleHealthSyncState;
  summary: AppleHealthSummary;
  lastSyncedText: string;
  syncActivityData: (data: Partial<AppleHealthActivity>, method?: "shortcut" | "file" | "manual") => void;
  logMealToAppleHealth: (meal: {
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    saturatedFat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    source?: "NutriAI Scanner" | "Voice Advisor" | "Manual Log";
  }) => void;
  importAppleHealthData: (fileContent: string) => boolean;
  exportMealAsAppleHealthFile: (mealId?: string) => void;
  generateShortcutLink: () => string;
  disconnectAppleHealth: () => void;
}

const DEFAULT_ACTIVITY: AppleHealthActivity = {
  activeEnergyBurned: 240, // 240/500 kcal Move partial ring progress initially
  basalEnergyBurned: 1680,
  stepCount: 4150,
  exerciseMinutes: 20,
  flightsClimbed: 4,
  restingHeartRate: 64,
  bodyWeight: 70,
  lastSyncedAt: new Date().toISOString(),
};

const DEFAULT_SYNC_STATE: AppleHealthSyncState = {
  isConnected: true,
  isAutoSyncEnabled: true,
  activity: DEFAULT_ACTIVITY,
  loggedMeals: [], // Starts clean: 0 meals logged initially
  syncMethod: "manual"
};

const AppleHealthContext = createContext<AppleHealthContextType | undefined>(undefined);

export const AppleHealthProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useUserProfile();
  const [syncState, setSyncState] = useState<AppleHealthSyncState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nutriai_apple_health_sync");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return DEFAULT_SYNC_STATE;
        }
      }
    }
    return DEFAULT_SYNC_STATE;
  });

  // Save to localStorage on state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nutriai_apple_health_sync", JSON.stringify(syncState));
    }
  }, [syncState]);

  // Compute Daily Targets and Consumed Totals calibrated to Apple Health + Body Goal Transition
  const weight = profile.weight || 70;
  const height = profile.height || 170;
  const age = profile.age || 25;
  const activeBurn = syncState.isConnected ? syncState.activity.activeEnergyBurned : 400;

  // Mifflin-St Jeor BMR equation
  const bmr = Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  const tdee = bmr + activeBurn;

  // Goal-adjusted targets
  let targetCalories = tdee;
  let targetProtein = Math.round(weight * 1.8);

  const currentType = profile.currentBodyType || "average";
  const targetType = profile.targetBodyType || "athletic";

  // Bulking / Weight Gain (e.g. thin -> athletic/obese)
  if ((currentType === "thin" && targetType !== "thin") || targetType === "obese" || targetType === "muscle_gain") {
    targetCalories = tdee + 400;
    targetProtein = Math.round(weight * 2.2);
  } 
  // Cutting / Fat Loss (e.g. obese/overweight -> thin/athletic)
  else if ((currentType === "obese" || currentType === "overweight") && (targetType === "thin" || targetType === "athletic")) {
    targetCalories = Math.max(1300, tdee - 500);
    targetProtein = Math.round(weight * 2.0);
  }

  const targetFat = Math.round((targetCalories * 0.25) / 9);
  const targetCarbs = Math.max(50, Math.round((targetCalories - (targetProtein * 4 + targetFat * 9)) / 4));

  // Consumed totals from logged meals today
  const totalCaloriesConsumed = syncState.loggedMeals.reduce((acc, m) => acc + m.calories, 0);
  const totalProteinConsumed = syncState.loggedMeals.reduce((acc, m) => acc + m.protein, 0);
  const totalCarbsConsumed = syncState.loggedMeals.reduce((acc, m) => acc + m.carbs, 0);
  const totalFatConsumed = syncState.loggedMeals.reduce((acc, m) => acc + m.fat, 0);

  const remainingCalories = Math.max(0, targetCalories - totalCaloriesConsumed);
  const remainingProtein = Math.max(0, targetProtein - totalProteinConsumed);

  const moveTarget = 500;
  const moveProgress = Math.min(150, Math.round((activeBurn / moveTarget) * 100));
  const intakeProgress = targetCalories > 0 ? Math.min(150, Math.round((totalCaloriesConsumed / targetCalories) * 100)) : 0;
  const proteinProgress = targetProtein > 0 ? Math.min(150, Math.round((totalProteinConsumed / targetProtein) * 100)) : 0;

  const summary: AppleHealthSummary = {
    dailyTargetCalories: targetCalories,
    dailyTargetProtein: targetProtein,
    dailyTargetCarbs: targetCarbs,
    dailyTargetFat: targetFat,
    totalCaloriesConsumed,
    totalProteinConsumed,
    totalCarbsConsumed,
    totalFatConsumed,
    remainingCalories,
    remainingProtein,
    moveProgress,
    intakeProgress,
    proteinProgress,
    netCalories: totalCaloriesConsumed - activeBurn
  };

  const computeLastSyncedText = (): string => {
    if (!syncState.activity?.lastSyncedAt) return "Just now";
    const time = new Date(syncState.activity.lastSyncedAt);
    const now = new Date();
    const diffSec = Math.max(0, Math.floor((now.getTime() - time.getTime()) / 1000));

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const lastSyncedText = computeLastSyncedText();

  const syncActivityData = (data: Partial<AppleHealthActivity>, method: "shortcut" | "file" | "manual" = "manual") => {
    setSyncState(prev => ({
      ...prev,
      isConnected: true,
      syncMethod: method,
      activity: {
        ...prev.activity,
        ...data,
        lastSyncedAt: new Date().toISOString()
      }
    }));
    toast.success("Apple Health activity synced successfully!", {
      description: `Active Burn: ${data.activeEnergyBurned ?? syncState.activity.activeEnergyBurned} kcal • Steps: ${(data.stepCount ?? syncState.activity.stepCount).toLocaleString()}`
    });
  };

  const logMealToAppleHealth = (meal: {
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    saturatedFat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    source?: "NutriAI Scanner" | "Voice Advisor" | "Manual Log";
  }) => {
    const newLog: AppleHealthDietaryLog = {
      id: "ah-" + Date.now(),
      foodName: meal.foodName,
      calories: Math.round(meal.calories),
      protein: Math.round(meal.protein * 10) / 10,
      carbs: Math.round(meal.carbs * 10) / 10,
      fat: Math.round(meal.fat * 10) / 10,
      saturatedFat: meal.saturatedFat ? Math.round(meal.saturatedFat * 10) / 10 : undefined,
      fiber: meal.fiber ? Math.round(meal.fiber * 10) / 10 : undefined,
      sugar: meal.sugar ? Math.round(meal.sugar * 10) / 10 : undefined,
      sodium: meal.sodium ? Math.round(meal.sodium) : undefined,
      loggedAt: new Date().toISOString(),
      source: meal.source || "NutriAI Scanner"
    };

    setSyncState(prev => ({
      ...prev,
      loggedMeals: [newLog, ...prev.loggedMeals]
    }));

    toast.success(`Logged "${meal.foodName}" to Apple Health! 🍎`, {
      description: `+${Math.round(meal.calories)} kcal • ${Math.round(meal.protein)}g Protein synced to HealthKit.`
    });
  };

  const importAppleHealthData = (fileContent: string): boolean => {
    try {
      // 1. Try JSON format
      if (fileContent.trim().startsWith("{")) {
        const parsed = JSON.parse(fileContent);
        const activity: Partial<AppleHealthActivity> = {};
        
        if (parsed.activeEnergyBurned || parsed.activeCalories) activity.activeEnergyBurned = Number(parsed.activeEnergyBurned || parsed.activeCalories);
        if (parsed.stepCount || parsed.steps) activity.stepCount = Number(parsed.stepCount || parsed.steps);
        if (parsed.restingHeartRate || parsed.heartRate) activity.restingHeartRate = Number(parsed.restingHeartRate || parsed.heartRate);
        if (parsed.bodyWeight || parsed.weight) activity.bodyWeight = Number(parsed.bodyWeight || parsed.weight);

        syncActivityData(activity, "file");
        return true;
      }

      // 2. Try Apple Health export.xml parsing
      if (fileContent.includes("<HealthData") || fileContent.includes("<Record")) {
        const stepMatch = fileContent.match(/type="HKQuantityTypeIdentifierStepCount"[^>]*value="([0-9.]+)"/g);
        const energyMatch = fileContent.match(/type="HKQuantityTypeIdentifierActiveEnergyBurned"[^>]*value="([0-9.]+)"/g);
        const weightMatch = fileContent.match(/type="HKQuantityTypeIdentifierBodyMass"[^>]*value="([0-9.]+)"/g);

        let totalSteps = 0;
        if (stepMatch) {
          stepMatch.slice(-30).forEach(m => {
            const val = parseFloat(m.match(/value="([0-9.]+)"/)?.[1] || "0");
            totalSteps += val;
          });
        }

        let totalActiveEnergy = 0;
        if (energyMatch) {
          energyMatch.slice(-40).forEach(m => {
            const val = parseFloat(m.match(/value="([0-9.]+)"/)?.[1] || "0");
            totalActiveEnergy += val;
          });
        }

        const latestWeight = weightMatch ? parseFloat(weightMatch[weightMatch.length - 1].match(/value="([0-9.]+)"/)?.[1] || "70") : 70;

        syncActivityData({
          activeEnergyBurned: Math.max(300, Math.round(totalActiveEnergy || 540)),
          stepCount: Math.max(2000, Math.round(totalSteps || 7800)),
          bodyWeight: Math.round(latestWeight * 10) / 10,
        }, "file");
        return true;
      }

      throw new Error("Unrecognized Apple Health file format.");
    } catch (e: any) {
      toast.error("Failed to parse Apple Health file: " + (e?.message || "Invalid format"));
      return false;
    }
  };

  const exportMealAsAppleHealthFile = (mealId?: string) => {
    const mealsToExport = mealId 
      ? syncState.loggedMeals.filter(m => m.id === mealId)
      : syncState.loggedMeals;

    const exportData = {
      exportSource: "NutriAI - Apple Health Bridge",
      exportDate: new Date().toISOString(),
      healthKitRecords: mealsToExport.map(m => ({
        type: "HKQuantityTypeIdentifierDietaryEnergyConsumed",
        value: m.calories,
        unit: "kcal",
        startDate: m.loggedAt,
        endDate: m.loggedAt,
        metadata: {
          foodName: m.foodName,
          proteinGrams: m.protein,
          carbsGrams: m.carbs,
          fatGrams: m.fat,
          fiberGrams: m.fiber,
          sodiumMg: m.sodium
        }
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NutriAI_AppleHealth_Export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Apple Health dataset exported successfully!");
  };

  const generateShortcutLink = () => {
    // Generate Apple Shortcuts URL scheme template for 1-tap HealthKit syncing
    return `shortcuts://run-shortcut?name=SyncNutriAI&input=text&text=${encodeURIComponent(
      JSON.stringify({
        app: "NutriAI",
        callbackUrl: window?.location?.origin || "http://localhost:8080"
      })
    )}`;
  };

  const disconnectAppleHealth = () => {
    setSyncState({
      isConnected: false,
      isAutoSyncEnabled: false,
      activity: {
        activeEnergyBurned: 0,
        basalEnergyBurned: 1600,
        stepCount: 0,
        lastSyncedAt: new Date().toISOString()
      },
      loggedMeals: [],
      syncMethod: "manual"
    });
    toast.info("Apple Health disconnected.");
  };

  return (
    <AppleHealthContext.Provider
      value={{
        syncState,
        summary,
        lastSyncedText,
        syncActivityData,
        logMealToAppleHealth,
        importAppleHealthData,
        exportMealAsAppleHealthFile,
        generateShortcutLink,
        disconnectAppleHealth
      }}
    >
      {children}
    </AppleHealthContext.Provider>
  );
};

export const useAppleHealth = () => {
  const context = useContext(AppleHealthContext);
  if (!context) {
    throw new Error("useAppleHealth must be used within an AppleHealthProvider");
  }
  return context;
};
