import { NutritionInfo, AlternativeReason } from "./types.ts";
import { LinearRegressionModel } from "./model.ts";
import { getGoalTransitionMultipliers, toNumber } from "./scoring.ts";

export const FEATURE_SPECS = [
  { key: 'calories', name: 'Calories', scale: 600, unit: 'kcal', defaultBetter: 'lower' },
  { key: 'protein', name: 'Protein', scale: 30, unit: 'g', defaultBetter: 'higher' },
  { key: 'carbs', name: 'Carbohydrates', scale: 100, unit: 'g', defaultBetter: 'lower' },
  { key: 'fat', name: 'Fat', scale: 40, unit: 'g', defaultBetter: 'lower' },
  { key: 'saturatedFat', name: 'Saturated Fat', scale: 20, unit: 'g', defaultBetter: 'lower' },
  { key: 'sugar', name: 'Sugar', scale: 50, unit: 'g', defaultBetter: 'lower' },
  { key: 'fiber', name: 'Fiber', scale: 15, unit: 'g', defaultBetter: 'higher' },
  { key: 'sodium', name: 'Sodium', scale: 2000, unit: 'mg', defaultBetter: 'lower' },
  { key: 'processingLevel', name: 'Processing Level', scale: 1.0, unit: '%', defaultBetter: 'lower' },
] as const;

/**
 * Explainable AI Method: Linear Coefficient × Feature Delta (w_i * (candidate_scaled_i - baseline_scaled_i))
 * 
 * For the trained linear regression model, the exact mathematical contribution of feature i to the
 * prediction gap between a candidate alternative and baseline food is:
 *   contribution_i = effective_weight_i * (candidate_scaled_i - baseline_scaled_i)
 * where effective_weight_i = model.weights[i] * goal_multiplier_i.
 */
export function calculateFeatureImportance(
  baseline: NutritionInfo, 
  alternative: NutritionInfo, 
  model: LinearRegressionModel | null,
  targetBodyType: string = 'athletic',
  currentBodyType: string = 'average'
): AlternativeReason[] {
  const getRawValues = (nutrition: NutritionInfo) => ({
    calories: toNumber(nutrition.calories, 0),
    protein: toNumber(nutrition.protein, 0),
    carbs: toNumber(nutrition.carbs, 0),
    fat: toNumber(nutrition.fat, 0),
    saturatedFat: toNumber(nutrition.saturatedFat, 0),
    sugar: toNumber(nutrition.sugar, 0),
    fiber: toNumber(nutrition.fiber, 0),
    sodium: toNumber(nutrition.sodium, 0),
    processingLevel: toNumber(nutrition.processingLevel, 0.5)
  });

  const baseRaw = getRawValues(baseline);
  const altRaw = getRawValues(alternative);

  // Primary path: Linear model feature contribution calculation
  if (model && model.weights && model.weights.length >= 9) {
    const multipliers = getGoalTransitionMultipliers(targetBodyType, currentBodyType);
    
    const contributions = FEATURE_SPECS.map((spec, i) => {
      const bVal = baseRaw[spec.key as keyof typeof baseRaw];
      const aVal = altRaw[spec.key as keyof typeof altRaw];
      const rawDiff = aVal - bVal;
      
      const scaledDiff = rawDiff / spec.scale;
      const effectiveWeight = model.weights[i] * (multipliers[i] ?? 1.0);
      const contribution = effectiveWeight * scaledDiff;
      
      const absDiff = Math.abs(rawDiff);
      const formattedDiff = spec.unit === '%' 
        ? `${Math.round(absDiff * 100)}%`
        : spec.unit === 'kcal' || spec.unit === 'mg'
        ? `${Math.round(absDiff)}${spec.unit}`
        : `${Math.round(absDiff * 10) / 10}${spec.unit}`;

      let status: 'better' | 'worse' | 'same' = 'same';
      let actualChange = '';
      let explanation = '';

      const isSubstantial = spec.key === 'calories' ? absDiff >= 10
        : spec.key === 'sodium' ? absDiff >= 20
        : spec.key === 'processingLevel' ? absDiff >= 0.05
        : absDiff >= 0.5;

      if (!isSubstantial) {
        status = 'same';
        actualChange = `Similar ${spec.name.toLowerCase()}`;
        explanation = `${spec.name} content is roughly comparable between both foods`;
      } else if (contribution > 0.002) {
        status = 'better';
        if (spec.key === 'calories') {
          actualChange = rawDiff < 0 ? `${Math.round(absDiff)} fewer calories` : `${Math.round(absDiff)} more calories`;
          explanation = rawDiff < 0
            ? "Fewer calories reduce calorie surplus and support body composition goals"
            : "Provides additional caloric energy tailored to weight and muscle gain";
        } else if (spec.key === 'protein') {
          actualChange = `${formattedDiff} more protein`;
          explanation = "Higher protein actively promotes muscle repair, metabolic rate, and satiety";
        } else if (spec.key === 'sugar') {
          actualChange = `${formattedDiff} less sugar`;
          explanation = "Reduced sugar helps avoid insulin spikes and reduces metabolic stress";
        } else if (spec.key === 'fiber') {
          actualChange = `${formattedDiff} more fiber`;
          explanation = "Increased dietary fiber improves gut microbiome health and extends fullness";
        } else if (spec.key === 'saturatedFat') {
          actualChange = `${formattedDiff} less saturated fat`;
          explanation = "Lower saturated fat supports healthy lipid profiles and cardiovascular wellness";
        } else if (spec.key === 'sodium') {
          actualChange = `${formattedDiff} less sodium`;
          explanation = "Lower sodium helps maintain balanced blood pressure and reduces water retention";
        } else if (spec.key === 'fat') {
          actualChange = rawDiff > 0 ? `${formattedDiff} more healthy fat` : `${formattedDiff} less fat`;
          explanation = rawDiff > 0 ? "Provides dense healthy fats for mass building" : "Lower total fat reduces overall caloric density";
        } else if (spec.key === 'carbs') {
          actualChange = rawDiff > 0 ? `${formattedDiff} more energizing carbs` : `${formattedDiff} fewer carbs`;
          explanation = rawDiff > 0 ? "Supplies complex carbohydrate energy for mass gain" : "Lower carbohydrate content supports glycemic control";
        } else if (spec.key === 'processingLevel') {
          actualChange = "Less processed";
          explanation = "Less processed ingredients retain higher natural micronutrient density";
        }
      } else if (contribution < -0.002) {
        status = 'worse';
        if (spec.key === 'calories') {
          actualChange = rawDiff > 0 ? `${Math.round(absDiff)} more calories` : `${Math.round(absDiff)} fewer calories`;
          explanation = rawDiff > 0
            ? "Higher calorie density slightly detracts from the health score"
            : "Lower calories may provide less sustained energy";
        } else if (spec.key === 'protein') {
          actualChange = `${formattedDiff} less protein`;
          explanation = "Lower protein content slightly reduces the amino acid profile";
        } else if (spec.key === 'sugar') {
          actualChange = `${formattedDiff} more sugar`;
          explanation = "Higher sugar content detracts from the nutritional rating";
        } else if (spec.key === 'fiber') {
          actualChange = `${formattedDiff} less fiber`;
          explanation = "Lower fiber provides less digestive support";
        } else if (spec.key === 'saturatedFat') {
          actualChange = `${formattedDiff} more saturated fat`;
          explanation = "Higher saturated fat increases cardiovascular load";
        } else if (spec.key === 'sodium') {
          actualChange = `${formattedDiff} more sodium`;
          explanation = "Higher sodium may contribute to fluid retention";
        } else if (spec.key === 'fat') {
          actualChange = `${formattedDiff} more fat`;
          explanation = "Higher total fat increases overall calorie density";
        } else if (spec.key === 'carbs') {
          actualChange = `${formattedDiff} more carbs`;
          explanation = "Higher carbohydrate load";
        } else if (spec.key === 'processingLevel') {
          actualChange = "More processed";
          explanation = "Higher processing level indicates more refined ingredients";
        }
      } else {
        status = 'same';
        actualChange = `Similar ${spec.name.toLowerCase()}`;
        explanation = `${spec.name} content is roughly equivalent`;
      }

      return {
        factor: spec.name,
        explanation,
        actualChange,
        status,
        absoluteContribution: Math.abs(contribution),
        contribution
      };
    });

    // Rank features by absolute contribution descending
    contributions.sort((a, b) => b.absoluteContribution - a.absoluteContribution);

    return contributions.map(c => ({
      factor: c.factor,
      explanation: c.explanation,
      actualChange: c.actualChange,
      status: c.status
    }));
  }

  // Fallback path
  return FEATURE_SPECS.map(spec => {
    const rawDiff = altRaw[spec.key as keyof typeof altRaw] - baseRaw[spec.key as keyof typeof baseRaw];
    const isImprovement = (spec.defaultBetter === 'lower' && rawDiff < 0) || (spec.defaultBetter === 'higher' && rawDiff > 0);
    const isWorse = (spec.defaultBetter === 'lower' && rawDiff > 0) || (spec.defaultBetter === 'higher' && rawDiff < 0);
    const absDiff = Math.abs(rawDiff);

    const formattedDiff = spec.unit === '%'
      ? `${Math.round(absDiff * 100)}%`
      : `${Math.round(absDiff * 10) / 10}${spec.unit}`;

    let status: 'better' | 'worse' | 'same' = 'same';
    let actualChange = `Similar ${spec.name.toLowerCase()}`;
    let explanation = `${spec.name} is comparable`;

    if (absDiff > 0.5) {
      if (isImprovement) {
        status = 'better';
        actualChange = rawDiff > 0 ? `${formattedDiff} more ${spec.name.toLowerCase()}` : `${formattedDiff} less ${spec.name.toLowerCase()}`;
        explanation = `Nutritionally favorable ${spec.name.toLowerCase()} profile`;
      } else if (isWorse) {
        status = 'worse';
        actualChange = rawDiff > 0 ? `${formattedDiff} more ${spec.name.toLowerCase()}` : `${formattedDiff} less ${spec.name.toLowerCase()}`;
        explanation = `Higher ${spec.name.toLowerCase()} is less favorable`;
      }
    }

    return { factor: spec.name, explanation, actualChange, status };
  });
}
