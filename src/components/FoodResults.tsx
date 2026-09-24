import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, TrendingUp, ArrowUp, ArrowDown, Scale, Trophy, Star, AlertTriangle, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useUserProfile } from "@/contexts/UserProfileContext";

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
  };
}

// Reusable Alternative Card Component
const AlternativeCard = ({ 
  alt, 
  isBest, 
  originalFood, 
  originalNutrition,
  getHealthBadgeVariant 
}: { 
  alt: Alternative; 
  isBest: boolean;
  originalFood: string;
  originalNutrition: FoodResultsProps['data']['nutritionInfo'];
  getHealthBadgeVariant: (score: number) => "default" | "secondary" | "destructive" | "outline";
}) => (
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
      </div>
    )}
  </Card>
);

export const FoodResults = ({ data }: FoodResultsProps) => {
  const { profile } = useUserProfile();
  
  // Single source of truth: Trust backend allergen warning
  const detectedAllergens = data.allergenWarning || [];
  
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Allergen Warning */}
      {detectedAllergens.length > 0 && (
        <Card className="p-5 bg-gradient-to-br from-red-500/10 via-red-500/5 to-amber-500/10 border-2 border-red-500/30 shadow-lg animate-in zoom-in-95 duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-red-500/20">
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
      </Card>

      {/* Already Optimal State Congratulatory Banner */}
      {isOptimal ? (
        <Card className="p-6 bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-teal-500/15 border-2 border-emerald-500/40 shadow-elevated animate-in zoom-in-95 duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-full bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 text-sm shadow-sm flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  🎉 Congratulations! Optimal Choice
                </Badge>
                <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold uppercase tracking-wider">
                  Health Score: {baselineScore}/100
                </span>
              </div>
              <h3 className="text-xl font-bold text-foreground">
                "{data.identifiedFood}" is already an optimal healthy choice!
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Based on our ML linear scoring model and your profile preferences ({profile.dietPreference}, goal: {profile.targetBodyType}), 
                this food already achieves top-tier nutritional balance. No alternatives in our database beat this food by more than 3 points — keep enjoying this smart, nutritious meal!
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Best Choice Highlight */}
          {bestChoice && (
            <Card className="p-6 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 border-2 border-primary/30 shadow-elevated animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-primary text-primary-foreground">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    Best Choice for You
                    <Star className="h-4 w-4 text-accent fill-accent" />
                  </h3>
                  <p className="text-sm text-muted-foreground">Based on your goals and preferences</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{bestChoice.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {bestChoice.benefits.slice(0, 2).join(" • ")}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className="text-lg px-4 py-2 bg-primary text-primary-foreground">
                    Score: {bestChoice.healthScore}
                  </Badge>
                </div>
              </div>
            </Card>
          )}

          {/* Similar Alternatives */}
          {regularAlternatives.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold text-foreground">Similar Healthier Alternatives</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {regularAlternatives.map((alt, idx) => (
                  <AlternativeCard
                    key={idx}
                    alt={alt}
                    isBest={bestChoice?.name === alt.name}
                    originalFood={data.identifiedFood}
                    originalNutrition={data.nutritionInfo}
                    getHealthBadgeVariant={getHealthBadgeVariant}
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