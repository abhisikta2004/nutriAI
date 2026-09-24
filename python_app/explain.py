from typing import List, Optional, Dict, Any
from .models import NutritionInfo, AlternativeReason
from .model import LinearRegressionModel
from .scoring import get_goal_multipliers, to_number

FEATURE_SPECS = [
    {"key": "calories", "name": "Calories", "scale": 600.0, "unit": "kcal", "defaultBetter": "lower"},
    {"key": "protein", "name": "Protein", "scale": 30.0, "unit": "g", "defaultBetter": "higher"},
    {"key": "carbs", "name": "Carbohydrates", "scale": 100.0, "unit": "g", "defaultBetter": "lower"},
    {"key": "fat", "name": "Fat", "scale": 40.0, "unit": "g", "defaultBetter": "lower"},
    {"key": "saturatedFat", "name": "Saturated Fat", "scale": 20.0, "unit": "g", "defaultBetter": "lower"},
    {"key": "sugar", "name": "Sugar", "scale": 50.0, "unit": "g", "defaultBetter": "lower"},
    {"key": "fiber", "name": "Fiber", "scale": 15.0, "unit": "g", "defaultBetter": "higher"},
    {"key": "sodium", "name": "Sodium", "scale": 2000.0, "unit": "mg", "defaultBetter": "lower"},
    {"key": "processingLevel", "name": "Processing Level", "scale": 1.0, "unit": "%", "defaultBetter": "lower"},
]

def calculate_feature_importance(
    baseline: NutritionInfo,
    alternative: NutritionInfo,
    model: Optional[LinearRegressionModel],
    target_body_type: str = "athletic"
) -> List[AlternativeReason]:
    base_dict = baseline.model_dump()
    alt_dict = alternative.model_dump()

    if model and len(model.weights) >= 9:
        multipliers = get_goal_multipliers(target_body_type)
        contributions = []

        for i, spec in enumerate(FEATURE_SPECS):
            b_val = to_number(base_dict.get(spec["key"]), 0.0)
            a_val = to_number(alt_dict.get(spec["key"]), 0.0)
            raw_diff = a_val - b_val
            
            scaled_diff = raw_diff / spec["scale"]
            effective_weight = model.weights[i] * multipliers[i]
            contribution = effective_weight * scaled_diff
            
            abs_diff = abs(raw_diff)
            if spec["unit"] == "%":
                formatted_diff = f"{round(abs_diff * 100)}%"
            elif spec["unit"] in ["kcal", "mg"]:
                formatted_diff = f"{round(abs_diff)}{spec['unit']}"
            else:
                formatted_diff = f"{round(abs_diff, 1)}{spec['unit']}"

            is_substantial = False
            if spec["key"] == "calories":
                is_substantial = abs_diff >= 10.0
            elif spec["key"] == "sodium":
                is_substantial = abs_diff >= 20.0
            elif spec["key"] == "processingLevel":
                is_substantial = abs_diff >= 0.05
            else:
                is_substantial = abs_diff >= 0.5

            status = "same"
            actual_change = ""
            explanation = ""

            if not is_substantial:
                status = "same"
                actual_change = f"Similar {spec['name'].lower()}"
                explanation = f"{spec['name']} content is roughly comparable between both foods"
            elif contribution > 0.002:
                status = "better"
                if spec["key"] == "calories":
                    actual_change = f"{round(abs_diff)} fewer calories" if raw_diff < 0 else f"{round(abs_diff)} more calories"
                    explanation = "Fewer calories reduce calorie surplus and support body composition goals" if raw_diff < 0 else "Provides additional caloric energy tailored to muscle recovery"
                elif spec["key"] == "protein":
                    actual_change = f"{formatted_diff} more protein"
                    explanation = "Higher protein actively promotes muscle repair, metabolic rate, and satiety"
                elif spec["key"] == "sugar":
                    actual_change = f"{formatted_diff} less sugar"
                    explanation = "Reduced sugar helps avoid insulin spikes and reduces metabolic stress"
                elif spec["key"] == "fiber":
                    actual_change = f"{formatted_diff} more fiber"
                    explanation = "Increased dietary fiber improves gut microbiome health and extends fullness"
                elif spec["key"] == "saturatedFat":
                    actual_change = f"{formatted_diff} less saturated fat"
                    explanation = "Lower saturated fat supports healthy lipid profiles and cardiovascular wellness"
                elif spec["key"] == "sodium":
                    actual_change = f"{formatted_diff} less sodium"
                    explanation = "Lower sodium helps maintain balanced blood pressure and reduces water retention"
                elif spec["key"] == "fat":
                    actual_change = f"{formatted_diff} less fat"
                    explanation = "Lower total fat reduces overall caloric density"
                elif spec["key"] == "carbs":
                    actual_change = f"{formatted_diff} fewer carbs"
                    explanation = "Lower carbohydrate content supports glycemic control"
                elif spec["key"] == "processingLevel":
                    actual_change = "Less processed"
                    explanation = "Less processed ingredients retain higher natural micronutrient density"
            elif contribution < -0.002:
                status = "worse"
                if spec["key"] == "calories":
                    actual_change = f"{round(abs_diff)} more calories" if raw_diff > 0 else f"{round(abs_diff)} fewer calories"
                    explanation = "Higher calorie density slightly detracts from the health score" if raw_diff > 0 else "Lower calories may provide less sustained energy"
                elif spec["key"] == "protein":
                    actual_change = f"{formatted_diff} less protein"
                    explanation = "Lower protein content slightly reduces the amino acid profile"
                elif spec["key"] == "sugar":
                    actual_change = f"{formatted_diff} more sugar"
                    explanation = "Higher sugar content detracts from the nutritional rating"
                elif spec["key"] == "fiber":
                    actual_change = f"{formatted_diff} less fiber"
                    explanation = "Lower fiber provides less digestive support"
                elif spec["key"] == "saturatedFat":
                    actual_change = f"{formatted_diff} more saturated fat"
                    explanation = "Higher saturated fat increases cardiovascular load"
                elif spec["key"] == "sodium":
                    actual_change = f"{formatted_diff} more sodium"
                    explanation = "Higher sodium may contribute to fluid retention"
                elif spec["key"] == "fat":
                    actual_change = f"{formatted_diff} more fat"
                    explanation = "Higher total fat increases overall calorie density"
                elif spec["key"] == "carbs":
                    actual_change = f"{formatted_diff} more carbs"
                    explanation = "Higher carbohydrate load"
                elif spec["key"] == "processingLevel":
                    actual_change = "More processed"
                    explanation = "Higher processing level indicates more refined ingredients"

            contributions.append({
                "factor": spec["name"],
                "explanation": explanation,
                "actualChange": actual_change,
                "status": status,
                "absContribution": abs(contribution),
                "contribution": contribution
            })

        # Rank by absolute contribution impact
        contributions.sort(key=lambda x: x["absContribution"], reverse=True)
        meaningful = [c for c in contributions if c["status"] != "same"]
        
        return [
            AlternativeReason(
                factor=item["factor"],
                explanation=item["explanation"],
                actualChange=item["actualChange"],
                status=item["status"]
            )
            for item in meaningful
        ]

    return [
        AlternativeReason(
            factor="Overall Nutrition",
            explanation="Superior balance of macro and micronutrients",
            actualChange="Improved nutrition",
            status="better"
        )
    ]
