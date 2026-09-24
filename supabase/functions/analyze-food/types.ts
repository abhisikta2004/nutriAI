import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const defaultJsonHeaders = {
  'User-Agent': 'NutriAI-FoodHealthAdvisor/1.0',
  'Accept': 'application/json',
};

// Zod validation schemas for incoming requests with nullable and passthrough support
export const CustomIngredientSchema = z.object({
  name: z.string().optional(),
  quantity: z.union([z.number(), z.string()]).optional(),
  unit: z.string().optional(),
}).passthrough();

export const DetailedLogSchema = z.object({
  weight: z.union([z.number(), z.string()]).optional(),
  pieces: z.union([z.number(), z.string()]).optional(),
  servingSize: z.string().optional(),
  cookingMethod: z.string().optional(),
  customIngredients: z.array(CustomIngredientSchema).optional(),
}).passthrough();

export const UserProfileSchema = z.object({
  dietPreference: z.string().optional().default('non-veg'),
  allergies: z.array(z.string()).optional().default([]),
  targetBodyType: z.string().optional().default('athletic'),
  currentBodyType: z.string().optional(),
  weight: z.union([z.number(), z.string()]).optional(),
  height: z.union([z.number(), z.string()]).optional(),
  age: z.union([z.number(), z.string()]).optional(),
  hasCompletedOnboarding: z.boolean().optional(),
}).passthrough();

export const AnalyzeRequestSchema = z.object({
  image: z.string().min(1, 'Image data is required'),
  identifyOnly: z.boolean().optional().default(false),
  detailedLog: DetailedLogSchema.nullable().optional(),
  userProfile: UserProfileSchema.nullable().optional(),
}).passthrough();

// Inferred TypeScript types from Zod schemas
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type UserProfileInput = z.infer<typeof UserProfileSchema>;
export type DetailedLogInput = z.infer<typeof DetailedLogSchema>;
export type CustomIngredient = z.infer<typeof CustomIngredientSchema>;

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat?: number;
  sugar?: number;
  fiber?: number;
  sodium?: number;
  vitamins?: number;
  processingLevel?: number;
}

export interface AlternativeReason {
  factor: string;
  explanation: string;
  actualChange: string;
  status: 'better' | 'worse' | 'same';
}

export interface Alternative {
  name: string;
  healthScore: number;
  benefits: string[];
  reasons: AlternativeReason[];
  nutrition: NutritionInfo;
  isRegional?: boolean;
}

export interface IdentifiedFood {
  name: string;
  confidence: number;
  nutrition: NutritionInfo;
}

export interface AnalyzeResponse {
  identifiedFood: string;
  confidence: number;
  nutritionInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    saturatedFat: number;
    sugar: number;
    fiber: number;
    sodium: number;
  };
  totalCalories?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
  totalFiber?: number;
  totalSugar?: number;
  totalSodium?: number;
  servingInfo?: string;
  hasDetailedLog?: boolean;
  alternatives?: Alternative[];
  alreadyOptimal?: boolean;
  bestChoice?: Alternative | null;
  allergenWarning?: string[];
}
