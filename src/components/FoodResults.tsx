import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, TrendingUp, ArrowUp, ArrowDown, Scale, Trophy, Star, AlertTriangle, Sparkles, ShieldAlert, PlusCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useAppleHealth } from "@/contexts/AppleHealthContext";

interface AlternativeNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat: number;
  sugar: number;
  fiber: number;
  sodium: number;
}

interface Alternative {
  name: string;
  healthScore: number;
  benefits: string[];
  reasons: {
    factor: string;
    explanation: string;
    actualChange: string;
    status?: "better" | "worse" | "same";
  }[];
  nutrition?: AlternativeNutrition;
  isBestChoice?: boolean;
  isRegional?: boolean;
}

interface FoodResultsProps {
  data: {
    identifiedFood: string;
    confidence: number;
    healthScore?: number;
    scannedImage?: string;
    nutritionInfo: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
      saturatedFat?: number;
      sugar?: number;
      fiber?: number;
      sodium?: number;
      healthScore?: number;
    };
    totalCalories?: number;
    totalProtein?: number;
    totalCarbs?: number;
    totalFat?: number;
    servingInfo?: string;
    alreadyOptimal?: boolean;
    alternatives: Alternative[];
    bestChoice?: Alternative;
    allergenWarning?: string[];
    dietaryWarning?: string;
  };
}

// Reusable Alternative Card Component
const AlternativeCard = ({ 
  alt, 
  isBest, 
  originalFood, 
  originalNutrition,
  getHealthBadgeVariant,
  onLogToAppleHealth,
  summary
}: { 
  alt: Alternative; 
  isBest: boolean; 
  originalFood: string; 
  originalNutrition: FoodResultsProps['data']['nutritionInfo'];
  getHealthBadgeVariant: (score: number) => "default" | "secondary" | "destructive" | "outline";
  onLogToAppleHealth?: () => void;
  summary?: any;
}) => {
  const proteinClosure = summary?.dailyTargetProtein 
    ? Math.round(((alt.nutrition?.protein || 0) / summary.dailyTargetProtein) * 100)
    : 0;
  const calorieUsage = summary?.dailyTargetCalories
    ? Math.round(((alt.nutrition?.calories || 0) / summary.dailyTargetCalories) * 100)
    : 0;

  return (
    <Card
      className={`p-6 space-y-4 bg-gradient-to-br from-card to-muted/20 shadow-card hover:shadow-elevated transition-all hover:-translate-y-1 ${
        isBest ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {isBest && <Star className="h-4 w-4 text-accent fill-accent shrink-0" />}
            <h4 className="text-lg font-semibold text-foreground">{alt.name}</h4>
          </div>
          <Badge variant={getHealthBadgeVariant(alt.healthScore)} className="text-sm font-bold">
            Score: {alt.healthScore}
          </Badge>
        </div>
        <Progress value={alt.healthScore} className="h-2" />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Benefits:</p>
        <ul className="space-y-1">
          {alt.benefits.map((benefit, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      {alt.reasons && alt.reasons.length > 0 && (
        <div className="pt-2 border-t border-border/30 space-y-1.5">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Score Impact:</p>
          <div className="space-y-1">
            {alt.reasons.slice(0, 3).map((r, idx) => (
              <div key={idx} className="text-xs flex items-center gap-1.5">
                {r.status === 'better' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <ArrowUp className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    {r.actualChange}
                  </span>
                ) : r.status === 'worse' ? (
                  <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                    <ArrowDown className="h-3 w-3 shrink-0 text-red-600 dark:text-red-400" />
                    {r.actualChange}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    • {r.actualChange}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {alt.nutrition && (
        <div className="pt-4 border-t border-border/50 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary/50">
              <Scale className="h-3.5 w-3.5 text-secondary-foreground" />
            </div>
            <h5 className="text-sm font-semibold text-foreground">Comparison (per 100g)</h5>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b border-border/30">
              <span>Nutrient</span>
              <span className="text-center">{originalFood.split(' ').slice(0, 2).join(' ')}</span>
              <span className="text-center">{alt.name.split(' ').slice(0, 2).join(' ')}</span>
            </div>
            {[
              { label: 'Calories', original: originalNutrition.calories, alt: alt.nutrition.calories, unit: 'kcal', lower: true },
              { label: 'Protein', original: originalNutrition.protein, alt: alt.nutrition.protein, unit: 'g', lower: false },
              { label: 'Carbs', original: originalNutrition.carbs, alt: alt.nutrition.carbs, unit: 'g', lower: true },
              { label: 'Fat', original: originalNutrition.fats, alt: alt.nutrition.fat, unit: 'g', lower: true },
              { label: 'Sugar', original: originalNutrition.sugar || 0, alt: alt.nutrition.sugar, unit: 'g', lower: true },
              { label: 'Fiber', original: originalNutrition.fiber || 0, alt: alt.nutrition.fiber, unit: 'g', lower: false },
            ].map((row, i) => {
              const diff = row.alt - row.original;
              const isBetter = row.lower ? diff < -1 : diff > 1;
              const isWorse = row.lower ? diff > 1 : diff < -1;
              
              return (
                <div key={i} className="grid grid-cols-3 gap-2 text-xs items-center py-1">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="text-center font-medium text-foreground">
                    {Math.round(row.original)}{row.unit}
                  </span>
                  <span className={`text-center font-medium flex items-center justify-center gap-1 ${
                    isBetter ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 
                    isWorse ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-foreground'
                  }`}>
                    {Math.round(row.alt)}{row.unit}
                    {isBetter && <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                    {isWorse && <ArrowDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400 shrink-0" />}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Apple Health Ring Impact Badges */}
          {alt.nutrition.protein > 0 && (
            <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[11px] font-medium text-muted-foreground flex-wrap gap-1.5">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#30D158]" />
                +{alt.nutrition.protein}g Protein (+{proteinClosure}% of Ring)
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#FF9500]" />
                {alt.nutrition.calories} kcal ({calorieUsage}% Intake)
              </span>
            </div>
          )}
        </div>
      )}

      {onLogToAppleHealth && (
        <Button
          variant="outline"
          size="sm"
          onClick={onLogToAppleHealth}
          className="w-full text-xs font-semibold gap-1.5 border-border/80 hover:border-red-500/40 hover:bg-red-500/10 text-foreground transition-all mt-2"
        >
          <span>🍎</span>
          Log Alternative to Apple Health
        </Button>
      )}
    </Card>
  );
};

export const FoodResults = ({ data }: FoodResultsProps) => {
  const { profile } = useUserProfile();
  const { logMealToAppleHealth, summary } = useAppleHealth();
  
  // Single source of truth: Trust backend allergen and dietary warnings
  const detectedAllergens = data.allergenWarning || [];
  const dietaryWarning = data.dietaryWarning;
  
  const getHealthBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 75) return "default";
    if (score >= 50) return "secondary";
    return "outline";
  };

  const regularAlternatives = data.alternatives || [];
  const baselineScore = data.healthScore ?? data.nutritionInfo.healthScore ?? 50;

  const bestChoice = data.bestChoice || 
    (regularAlternatives.length > 0 
      ? regularAlternatives.reduce((a, b) => a.healthScore > b.healthScore ? a : b)
      : null);

  const isOptimal = data.alreadyOptimal || (!bestChoice && regularAlternatives.length === 0);

  const handleLogOriginalMeal = () => {
    logMealToAppleHealth({
      foodName: data.identifiedFood,
      originalDishName: data.identifiedFood,
      scannedImage: data.scannedImage,
      loggedChoiceType: "original",
      calories: data.totalCalories || data.nutritionInfo.calories,
      protein: data.totalProtein || data.nutritionInfo.protein,
      carbs: data.totalCarbs || data.nutritionInfo.carbs,
      fat: data.totalFat || data.nutritionInfo.fats,
      saturatedFat: data.nutritionInfo.saturatedFat,
      fiber: data.nutritionInfo.fiber,
      sugar: data.nutritionInfo.sugar,
      sodium: data.nutritionInfo.sodium,
      source: "NutriAI Scanner"
    });
  };

  const handleLogAlternative = (alt: Alternative) => {
    logMealToAppleHealth({
      foodName: alt.name,
      originalDishName: data.identifiedFood,
      alternativeName: alt.name,
      scannedImage: data.scannedImage,
      loggedChoiceType: "healthier_alternative",
      calories: alt.nutrition?.calories || 0,
      protein: alt.nutrition?.protein || 0,
      carbs: alt.nutrition?.carbs || 0,
      fat: alt.nutrition?.fat || 0,
      saturatedFat: alt.nutrition?.saturatedFat,
      fiber: alt.nutrition?.fiber,
      sugar: alt.nutrition?.sugar,
      sodium: alt.nutrition?.sodium,
      source: "NutriAI Scanner"
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Dietary Preference Conflict Warning (Veg / Vegan violation) */}
      {dietaryWarning && (
        <Card className="p-6 bg-gradient-to-br from-amber-500/20 via-red-500/15 to-card/90 border-2 border-red-500/50 shadow-elevated backdrop-blur-md animate-in zoom-in-95 duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start gap-4 relative z-10">
            <div className="p-3.5 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 shrink-0 shadow-sm animate-pulse">
              <ShieldAlert className="h-7 w-7" />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400 tracking-tight">
                  Dietary Preference Alert
                </h3>
                <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 shadow-sm">
                  Non-Veg Detected
                </Badge>
                <Badge variant="outline" className="text-xs bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold">
                  Profile: {profile.dietPreference?.toUpperCase() || "VEGETARIAN"}
                </Badge>
              </div>

              <p className="text-sm font-medium text-foreground leading-relaxed">
                {dietaryWarning}
              </p>

              <div className="pt-2 border-t border-red-500/20 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>We've automatically filtered the recommendations below to strictly <strong>100% Vegetarian & Vegan</strong> healthy swaps.</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Allergen Warning */}
      {detectedAllergens.length > 0 && (
        <Card className="p-5 bg-gradient-to-br from-red-500/10 via-red-500/5 to-amber-500/10 border-2 border-red-500/30 shadow-lg animate-in zoom-in-95 duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-red-500/20 shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400">
                ⚠️ Allergen Warning!
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                This food may contain allergens you've listed:
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {detectedAllergens.map((allergen, idx) => (
                  <Badge key={idx} variant="destructive" className="px-3 py-1">
                    {allergen}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Please verify ingredients carefully before consuming.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Identified Food Header Card */}
      <Card className="p-6 bg-gradient-to-br from-card to-muted/20 shadow-card">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
              <h2 className="text-2xl font-bold text-foreground">{data.identifiedFood}</h2>
              {dietaryWarning && (
                <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Non-Veg Item
                </Badge>
              )}
              {isOptimal && (
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Optimal Food
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Confidence: {Math.round(data.confidence * 100)}%
              {data.servingInfo && ` • Serving: ${data.servingInfo}`}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium uppercase">Health Score:</span>
              <Badge variant={getHealthBadgeVariant(baselineScore)} className="text-base px-3 py-1 font-bold">
                {baselineScore} / 100
              </Badge>
            </div>
            <Progress value={baselineScore} className="w-32 h-2" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Calories</p>
            <p className="text-lg font-semibold">{data.nutritionInfo.calories} kcal</p>
            {data.totalCalories && data.totalCalories !== data.nutritionInfo.calories && (
              <p className="text-xs text-primary font-medium">
                Total: {Math.round(data.totalCalories)} kcal
              </p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Protein</p>
            <p className="text-lg font-semibold">{data.nutritionInfo.protein}g</p>
            {data.totalProtein && data.totalProtein !== data.nutritionInfo.protein && (
              <p className="text-xs text-primary font-medium">
                Total: {Math.round(data.totalProtein)}g
              </p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Carbs</p>
            <p className="text-lg font-semibold">{data.nutritionInfo.carbs}g</p>
            {data.totalCarbs && data.totalCarbs !== data.nutritionInfo.carbs && (
              <p className="text-xs text-primary font-medium">
                Total: {Math.round(data.totalCarbs)}g
              </p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Fats</p>
            <p className="text-lg font-semibold">{data.nutritionInfo.fats}g</p>
            {data.totalFat && data.totalFat !== data.nutritionInfo.fats && (
              <p className="text-xs text-primary font-medium">
                Total: {Math.round(data.totalFat)}g
              </p>
            )}
          </div>
        </div>

        {/* Apple Health 1-Tap Log Footer */}
        <div className="mt-6 pt-4 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20 -mx-6 -mb-6 p-4 rounded-b-xl">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-base">🍎</span>
              <span className="text-xs text-foreground font-bold">
                Apple Health Ring Impact
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              +{Math.round(data.totalCalories || data.nutritionInfo.calories)} kcal Move/Intake • +{Math.round(data.totalProtein || data.nutritionInfo.protein)}g Protein Goal
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleLogOriginalMeal}
            className="text-xs font-semibold gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-sm shrink-0"
          >
            <span>🍎</span>
            Log to Apple Health
          </Button>
        </div>
      </Card>

      {/* Optimal Food State */}
      {isOptimal ? (
        <Card className="p-8 text-center space-y-4 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/30 shadow-card">
          <div className="inline-flex p-4 rounded-full bg-primary/20 text-primary">
            <Trophy className="h-10 w-10" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-2xl font-bold text-foreground">You made a great choice!</h3>
            <p className="text-muted-foreground">
              This food item already has an optimal nutritional profile for your goals. No healthier swaps are needed.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Best Choice Highlight Card */}
          {bestChoice && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-accent" />
                  <h3 className="text-xl font-bold text-foreground">Best Choice</h3>
                  <Badge variant="secondary" className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    +{bestChoice.healthScore - baselineScore} points higher
                  </Badge>
                </div>
                {['veg', 'vegetarian', 'vegan'].includes((profile.dietPreference || '').toLowerCase()) && (
                  <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    🌱 100% Vegetarian Friendly
                  </Badge>
                )}
              </div>
              <AlternativeCard
                alt={bestChoice}
                isBest={true}
                originalFood={data.identifiedFood}
                originalNutrition={data.nutritionInfo}
                getHealthBadgeVariant={getHealthBadgeVariant}
                onLogToAppleHealth={() => handleLogAlternative(bestChoice)}
                summary={summary}
              />
            </div>
          )}

          {/* Other Healthier Alternatives */}
          {regularAlternatives.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-bold text-foreground">
                    {bestChoice ? "More Healthier Alternatives" : "Healthier Alternatives"}
                  </h3>
                </div>
                {['veg', 'vegetarian', 'vegan'].includes((profile.dietPreference || '').toLowerCase()) && (
                  <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    🌱 Vegetarian Options
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularAlternatives
                  .filter((alt) => !bestChoice || alt.name !== bestChoice.name)
                  .map((alt, index) => (
                    <AlternativeCard
                      key={index}
                      alt={alt}
                      isBest={false}
                      originalFood={data.identifiedFood}
                      originalNutrition={data.nutritionInfo}
                      getHealthBadgeVariant={getHealthBadgeVariant}
                      onLogToAppleHealth={() => handleLogAlternative(alt)}
                      summary={summary}
                    />
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};