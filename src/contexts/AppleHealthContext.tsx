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
  syncActivityData: (data: Partial<AppleHealthActivity>, method?: "shortcut" | "manual") => void;
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
    scannedImage?: string;
    originalDishName?: string;
    loggedChoiceType?: "original" | "healthier_alternative";
    alternativeName?: string;
  }) => void;
  deleteMealLog: (id: string) => void;
  clearMealLogs: () => void;
  generateShortcutLink: () => string;
  disconnectAppleHealth: () => void;
}

const DEFAULT_ACTIVITY: AppleHealthActivity = {
  activeEnergyBurned: 0, // 0 kcal Move initially (0% Move Ring)
  basalEnergyBurned: 1680,
  stepCount: 0,          // 0 steps initially (0% Steps)
  lastSyncedAt: new Date().toISOString(),
};

const DEFAULT_SYNC_STATE: AppleHealthSyncState = {
  isConnected: true,
  isAutoSyncEnabled: true,
  activity: DEFAULT_ACTIVITY,
  loggedMeals: [], // Starts clean: 0 meals logged initially (0% Intake & Protein Rings)
  syncMethod: "manual"
};

const AppleHealthContext = createContext<AppleHealthContextType | undefined>(undefined);

export const AppleHealthProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useUserProfile();
  const [syncState, setSyncState] = useState<AppleHealthSyncState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nutriai_apple_health_sync_v2");
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
      localStorage.setItem("nutriai_apple_health_sync_v2", JSON.stringify(syncState));
    }
  }, [syncState]);

  // Listen for iOS Shortcut 1-Tap URL Query Parameters Sync (e.g. ?health_sync=1&kcal=520&steps=8500)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const params = new URLSearchParams(window.location.search);
      const isSync = params.get("health_sync") || params.get("apple_health_sync") || params.get("move") || params.get("kcal");

      if (isSync) {
        const move = Number(params.get("kcal") || params.get("move") || params.get("activeBurn") || params.get("activeEnergy") || 0);
        const steps = Number(params.get("steps") || params.get("stepCount") || 0);

        if (move > 0 || steps > 0) {
          syncActivityData({
            activeEnergyBurned: move,
            stepCount: steps,
          }, "shortcut");

          toast.success("Apple Health synced via iOS Shortcut! 🍎", {
            description: `Active Calories: ${move} kcal • Steps: ${steps.toLocaleString()}`
          });

          // Clean up URL parameters cleanly without reloading
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch (e) {
      console.warn("Shortcut URL parse error:", e);
    }
  }, []);

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

  const syncActivityData = (data: Partial<AppleHealthActivity>, method: "shortcut" | "manual" = "manual") => {
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
    toast.success("Apple Health synced successfully! 🍎", {
      description: `Active Calories: ${data.activeEnergyBurned ?? syncState.activity.activeEnergyBurned} kcal • Steps: ${(data.stepCount ?? syncState.activity.stepCount).toLocaleString()}`
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
    scannedImage?: string;
    originalDishName?: string;
    loggedChoiceType?: "original" | "healthier_alternative";
    alternativeName?: string;
  }) => {
    const newLog: AppleHealthDietaryLog = {
      id: "meal-" + Date.now(),
      foodName: meal.foodName,
      originalDishName: meal.originalDishName || meal.foodName,
      scannedImage: meal.scannedImage,
      loggedChoiceType: meal.loggedChoiceType || "original",
      alternativeName: meal.alternativeName,
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

    const choiceLabel = meal.loggedChoiceType === "healthier_alternative" 
      ? `Healthier Swap: "${meal.foodName}"` 
      : `Dish: "${meal.foodName}"`;

    toast.success(`Logged ${choiceLabel} to Apple Health! 🍎`, {
      description: `+${Math.round(meal.calories)} kcal • ${Math.round(meal.protein)}g Protein recorded in Journal.`
    });
  };

  const deleteMealLog = (id: string) => {
    setSyncState(prev => ({
      ...prev,
      loggedMeals: prev.loggedMeals.filter(m => m.id !== id)
    }));
    toast.info("Meal removed from food journal.");
  };

  const clearMealLogs = () => {
    setSyncState(prev => ({
      ...prev,
      loggedMeals: []
    }));
    toast.info("Food journal cleared.");
  };

  const generateShortcutLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://nutri-ai.vercel.app";
    return `${origin}/?health_sync=1&kcal=500&steps=10000`;
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
        deleteMealLog,
        clearMealLogs,
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
