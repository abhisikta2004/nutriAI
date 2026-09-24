import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, TrendingUp, ArrowUp, ArrowDown, Scale, Trophy, Star, AlertTriangle } from "lucide-react";
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
    nutritionInfo: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
      saturatedFat?: number;
      sugar?: number;
      fiber?: number;
      sodium?: number;
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
        <Badge variant={getHealthBadgeVariant(alt.healthScore)}>{alt.healthScore}</Badge>
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
            { label: 'Calories', original: originalNutrition.calories, alt: alt.nutrition.calories, unit: '', lower: true },
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
                  isBetter ? 'text-green-600 dark:text-green-400' : 
                  isWorse ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
                }`}>
                  {Math.round(row.alt)}{row.unit}
                  {isBetter && <ArrowDown className="h-3 w-3" />}
                  {isWorse && <ArrowUp className="h-3 w-3" />}
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
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "outline";
  };

  const regularAlternatives = data.alternatives || [];

  const bestChoice = data.bestChoice || 
    (regularAlternatives.length > 0 
      ? regularAlternatives.reduce((a, b) => a.healthScore > b.healthScore ? a : b)
      : null);

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

      {/* Identified Food */}
      <Card className="p-6 bg-gradient-to-br from-card to-muted/20 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">{data.identifiedFood}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Confidence: {Math.round(data.confidence * 100)}%
              {data.servingInfo && ` • Serving: ${data.servingInfo}`}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Calories</p>
            <p className="text-lg font-semibold">{data.nutritionInfo.calories}</p>
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

      {/* Already Optimal State */}
      {(data.alreadyOptimal || (!bestChoice && regularAlternatives.length === 0)) ? (
        <Card className="p-6 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border-2 border-emerald-500/30 shadow-elevated animate-in zoom-in-95 duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Already an Optimal Choice
                </Badge>
                <span className="text-xs text-muted-foreground font-medium">Top Tier Nutrition</span>
              </div>
              <h3 className="text-xl font-bold text-foreground">
                "{data.identifiedFood}" is already a great nutritional choice!
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Based on our model scoring and your profile goals ({profile.dietPreference}, goal: {profile.targetBodyType}), 
                this food already has an excellent nutrient balance. No healthier alternatives are needed — keep enjoying this smart meal!
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