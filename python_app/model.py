import os
import json
import math
import asyncio
from typing import List, Optional, Dict, Any, Tuple
from .curated_data import meal_type_alternatives, alternatives_by_category
from .scoring import calculate_basic_health_score

FEATURE_NAMES = [
    "Calories",
    "Protein",
    "Carbs",
    "Fat",
    "Saturated Fat",
    "Sugar",
    "Fiber",
    "Sodium",
    "Processing Level"
]

FEATURE_SCALES = [600.0, 30.0, 100.0, 40.0, 20.0, 50.0, 15.0, 2000.0, 1.0]

class LinearRegressionModel:
    """
    Explainable Linear Regression Machine Learning Model for Nutritional Scoring.
    Trained via Gradient Descent on Mean Squared Error (MSE) loss with optional L2 regularization.
    """
    def __init__(self, weights: Optional[List[float]] = None, bias: float = 58.0):
        # Feature order: [Calories, Protein, Carbs, Fat, SatFat, Sugar, Fiber, Sodium, Processing]
        # Calibrated nutritional baseline weights (scale factor applied to normalized features):
        self.weights: List[float] = weights if weights is not None else [-16.0, 28.0, -6.0, -8.0, -20.0, -26.0, 24.0, -14.0, -20.0]
        self.bias: float = bias
        self.loss_history: List[float] = []

    def predict_raw(self, features: List[float]) -> float:
        """Calculate continuous linear prediction: bias + sum(w_i * x_i)."""
        result = self.bias
        for i in range(len(features)):
            val = features[i] if i < len(features) and features[i] is not None else 0.0
            result += self.weights[i] * val
        return result

    def predict(self, features: List[float]) -> float:
        """Calculate bounded health score between 5.0 and 98.0."""
        raw = self.predict_raw(features)
        return max(5.0, min(98.0, round(raw, 1)))

    def train(
        self, 
        features: List[List[float]], 
        labels: List[float], 
        epochs: int = 150, 
        learning_rate: float = 0.05,
        l2_reg: float = 0.0001
    ) -> Dict[str, Any]:
        """
        Train the model parameters using Gradient Descent on MSE loss.
        """
        if not features or not labels:
            return {"epochs": 0, "final_loss": 0.0}

        num_features = len(features[0])
        num_samples = len(features)
        self.loss_history = []

        for epoch in range(epochs):
            weight_gradients = [0.0] * num_features
            bias_gradient = 0.0
            total_loss = 0.0

            # Forward pass & gradient computation
            for i in range(num_samples):
                prediction = self.predict_raw(features[i])
                error = prediction - labels[i]
                total_loss += error ** 2

                for j in range(num_features):
                    weight_gradients[j] += error * features[i][j]
                bias_gradient += error

            # Mean squared error
            mse = total_loss / num_samples
            self.loss_history.append(mse)

            # Gradient update with L2 regularization
            for j in range(num_features):
                reg_term = l2_reg * self.weights[j]
                self.weights[j] -= (learning_rate * (weight_gradients[j] / num_samples + reg_term))
            self.bias -= (learning_rate * bias_gradient) / num_samples

        return {
            "epochs": epochs,
            "initial_loss": round(self.loss_history[0], 4) if self.loss_history else 0.0,
            "final_loss": round(self.loss_history[-1], 4) if self.loss_history else 0.0,
            "bias": round(self.bias, 3),
            "weights": [round(w, 3) for w in self.weights]
        }

    def evaluate(self, features: List[List[float]], labels: List[float]) -> Dict[str, float]:
        """Evaluate model accuracy metrics on a dataset (MSE, RMSE, MAE, R2)."""
        if not features or not labels:
            return {"mse": 0.0, "rmse": 0.0, "mae": 0.0, "r2": 0.0}

        num_samples = len(features)
        y_mean = sum(labels) / num_samples
        ss_tot = sum((y - y_mean) ** 2 for y in labels)
        ss_res = 0.0
        mae_sum = 0.0

        for i in range(num_samples):
            pred = self.predict(features[i])
            actual = labels[i]
            ss_res += (pred - actual) ** 2
            mae_sum += abs(pred - actual)

        mse = ss_res / num_samples
        rmse = math.sqrt(mse)
        mae = mae_sum / num_samples
        r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 1.0

        return {
            "mse": round(mse, 3),
            "rmse": round(rmse, 3),
            "mae": round(mae, 3),
            "r2": round(r2, 4)
        }

    def to_dict(self) -> Dict[str, Any]:
        return {
            "weights": self.weights,
            "bias": self.bias,
            "feature_names": FEATURE_NAMES,
            "feature_scales": FEATURE_SCALES
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "LinearRegressionModel":
        weights = data.get("weights", [])
        bias = data.get("bias", 58.0)
        return cls(weights=weights, bias=bias)

    def save(self, filepath: str):
        """Save model parameters to JSON file."""
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(self.to_dict(), f, indent=2)

    @classmethod
    def load(cls, filepath: str) -> Optional["LinearRegressionModel"]:
        """Load model parameters from JSON file."""
        if not os.path.exists(filepath):
            return None
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            return cls.from_dict(data)

    def summary(self) -> str:
        lines = [
            "🧠 NutriAI Linear Regression Model Summary",
            f"Bias: {self.bias:.3f}",
            "Feature Weights:"
        ]
        for name, scale, w in zip(FEATURE_NAMES, FEATURE_SCALES, self.weights):
            lines.append(f"  - {name:<18} (Scale {scale:>6.1f}): Weight = {w:>7.3f}")
        return "\n".join(lines)


def get_benchmark_training_data() -> List[Dict[str, Any]]:
    """
    Generate rich training benchmark dataset combining curated food profiles and
    boundary nutritional prototypes (junk food, lean protein, balanced meals, whole grains).
    """
    samples: List[Dict[str, Any]] = []

    # 1. Add all curated items
    all_curated = []
    for items in meal_type_alternatives.values():
        all_curated.extend(items)
    for items in alternatives_by_category.values():
        all_curated.extend(items)

    for item in all_curated:
        n = item.nutrition
        samples.append({
            "calories": n.calories,
            "protein": n.protein,
            "carbs": n.carbs,
            "fat": n.fat,
            "saturatedFat": n.saturatedFat or 0.0,
            "sugar": n.sugar or 0.0,
            "fiber": n.fiber or 0.0,
            "sodium": n.sodium or 0.0,
            "processingLevel": n.processingLevel or 0.3,
            "healthScore": calculate_basic_health_score({
                "calories": n.calories,
                "protein": n.protein,
                "carbs": n.carbs,
                "fat": n.fat,
                "saturatedFat": n.saturatedFat or 0.0,
                "sugar": n.sugar or 0.0,
                "fiber": n.fiber or 0.0,
                "sodium": n.sodium or 0.0,
                "processingLevel": n.processingLevel or 0.3,
            }, "athletic")
        })

    # 2. Add boundary synthetic benchmarks (ultra-processed, optimal whole foods, keto, smoothies)
    benchmarks = [
        # Ultra-processed / Fast Foods / High-sugar items
        {"calories": 550, "protein": 5, "carbs": 65, "fat": 30, "saturatedFat": 12, "sugar": 35, "fiber": 1, "sodium": 850, "processingLevel": 0.9, "healthScore": 18},
        {"calories": 480, "protein": 7, "carbs": 60, "fat": 24, "saturatedFat": 10, "sugar": 28, "fiber": 2, "sodium": 600, "processingLevel": 0.8, "healthScore": 24},
        {"calories": 540, "protein": 6, "carbs": 55, "fat": 34, "saturatedFat": 11, "sugar": 2, "fiber": 3, "sodium": 750, "processingLevel": 0.9, "healthScore": 22},
        {"calories": 150, "protein": 0, "carbs": 39, "fat": 0, "saturatedFat": 0, "sugar": 39, "fiber": 0, "sodium": 30, "processingLevel": 0.9, "healthScore": 14},
        {"calories": 340, "protein": 14, "carbs": 32, "fat": 18, "saturatedFat": 7, "sugar": 4, "fiber": 2, "sodium": 920, "processingLevel": 0.8, "healthScore": 36},
        {"calories": 420, "protein": 8, "carbs": 52, "fat": 20, "saturatedFat": 8, "sugar": 22, "fiber": 2, "sodium": 490, "processingLevel": 0.8, "healthScore": 32},

        # Fresh / Optimal Healthy Foods, Superfoods & Smoothies
        {"calories": 110, "protein": 3, "carbs": 22, "fat": 0.5, "saturatedFat": 0.1, "sugar": 12, "fiber": 4, "sodium": 20, "processingLevel": 0.1, "healthScore": 86},
        {"calories": 65, "protein": 2, "carbs": 12, "fat": 0.3, "saturatedFat": 0.1, "sugar": 6, "fiber": 5, "sodium": 40, "processingLevel": 0.1, "healthScore": 92},
        {"calories": 120, "protein": 22, "carbs": 2, "fat": 2, "saturatedFat": 0.5, "sugar": 0, "fiber": 0, "sodium": 180, "processingLevel": 0.2, "healthScore": 88},
        {"calories": 160, "protein": 6, "carbs": 28, "fat": 3, "saturatedFat": 0.5, "sugar": 2, "fiber": 6, "sodium": 220, "processingLevel": 0.2, "healthScore": 84},
        {"calories": 80, "protein": 3, "carbs": 14, "fat": 0.5, "saturatedFat": 0.1, "sugar": 3, "fiber": 4, "sodium": 90, "processingLevel": 0.1, "healthScore": 92},
        {"calories": 210, "protein": 8, "carbs": 35, "fat": 4, "saturatedFat": 0.6, "sugar": 5, "fiber": 7, "sodium": 30, "processingLevel": 0.2, "healthScore": 85},
        {"calories": 240, "protein": 28, "carbs": 8, "fat": 8, "saturatedFat": 1.5, "sugar": 2, "fiber": 4, "sodium": 280, "processingLevel": 0.2, "healthScore": 87},
        {"calories": 130, "protein": 14, "carbs": 8, "fat": 3, "saturatedFat": 0.6, "sugar": 4, "fiber": 3, "sodium": 110, "processingLevel": 0.2, "healthScore": 90},

        # Moderate / Balanced Everyday Meals
        {"calories": 320, "protein": 12, "carbs": 45, "fat": 9, "saturatedFat": 2.5, "sugar": 6, "fiber": 4, "sodium": 480, "processingLevel": 0.5, "healthScore": 62},
        {"calories": 260, "protein": 10, "carbs": 38, "fat": 7, "saturatedFat": 1.8, "sugar": 5, "fiber": 5, "sodium": 380, "processingLevel": 0.4, "healthScore": 68},
        {"calories": 290, "protein": 16, "carbs": 40, "fat": 6, "saturatedFat": 1.2, "sugar": 3, "fiber": 6, "sodium": 350, "processingLevel": 0.3, "healthScore": 76},
    ]

    samples.extend(benchmarks)
    return samples

def normalize_features(data_list: List[Dict[str, Any]]) -> Tuple[List[List[float]], List[float]]:
    """Convert nutritional data dictionaries into normalized feature vectors [0..1] and target labels."""
    features = [
        [
            (d.get("calories") or 0.0) / 600.0,
            (d.get("protein") or 0.0) / 30.0,
            (d.get("carbs") or 0.0) / 100.0,
            (d.get("fat") or 0.0) / 40.0,
            (d.get("saturatedFat") or 0.0) / 20.0,
            (d.get("sugar") or 0.0) / 50.0,
            (d.get("fiber") or 0.0) / 15.0,
            (d.get("sodium") or 0.0) / 2000.0,
            d.get("processingLevel", 0.5)
        ]
        for d in data_list
    ]
    labels = [float(d.get("healthScore", 50.0)) for d in data_list]
    return features, labels

_trained_model: Optional[LinearRegressionModel] = None

def train_health_score_model(extra_data: Optional[List[Dict[str, Any]]] = None) -> LinearRegressionModel:
    """Train linear regression ML model with gradient descent on benchmark and optional OpenFoodFacts data."""
    training_data = get_benchmark_training_data()
    if extra_data:
        training_data.extend(extra_data)

    features, labels = normalize_features(training_data)

    model = LinearRegressionModel()
    train_metrics = model.train(features, labels, epochs=150, learning_rate=0.05)
    eval_metrics = model.evaluate(features, labels)

    print(f"✅ NutriAI Python Model Trained (MSE: {eval_metrics['mse']}, MAE: {eval_metrics['mae']}, R²: {eval_metrics['r2']})")
    return model

async def ensure_model_trained() -> LinearRegressionModel:
    """Return the global cached trained model singleton."""
    global _trained_model
    if _trained_model is None:
        _trained_model = train_health_score_model()
    return _trained_model


if __name__ == "__main__":
    print("=" * 65)
    print("🚀 NutriAI Python Model Training & Evaluation Benchmark")
    print("=" * 65)

    model = train_health_score_model()
    print("\n" + model.summary())

    dataset = get_benchmark_training_data()
    features, labels = normalize_features(dataset)
    metrics = model.evaluate(features, labels)

    print("\n📊 Evaluation Metrics on Benchmark Dataset:")
    print(f"  • Total Samples: {len(dataset)}")
    print(f"  • Mean Squared Error (MSE): {metrics['mse']}")
    print(f"  • Root Mean Squared Error (RMSE): {metrics['rmse']}")
    print(f"  • Mean Absolute Error (MAE): {metrics['mae']} score points")
    print(f"  • R² Score (Variance Explained): {metrics['r2'] * 100:.2f}%")

    print("\n🧪 Sample Food Predictions:")
    test_cases = [
        ("Ultra-processed Burger", [550/600, 5/30, 65/100, 30/40, 12/20, 35/50, 1/15, 850/2000, 0.9]),
        ("Fresh Greek Yogurt Bowl", [125/600, 13/30, 12/100, 3.5/40, 1.5/20, 9/50, 1.5/15, 45/2000, 0.2]),
        ("Grilled Chicken & Veggies", [165/600, 31/30, 4/100, 3.6/40, 1.0/20, 0/50, 2/15, 220/2000, 0.2]),
        ("Sugary Soda Can (330ml)", [150/600, 0/30, 39/100, 0/40, 0/20, 39/50, 0/15, 30/2000, 0.9]),
        ("Oatmeal with Chia & Banana", [160/600, 6/30, 28/100, 3/40, 0.5/20, 2/50, 6/15, 220/2000, 0.2]),
    ]

    for name, feat in test_cases:
        score = model.predict(feat)
        print(f"  • {name:<30} -> Health Score: {score:>4.1f}/100")
    print("=" * 65)
