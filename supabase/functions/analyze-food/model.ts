import { fetchTrainingData } from "./openFoodFacts.ts";
import { alternativesByCategory, mealTypeAlternatives } from "./curatedData.ts";
import { calculateBasicHealthScore } from "./scoring.ts";

// Simple Linear Regression Model (custom implementation for Deno edge functions)
export class LinearRegressionModel {
  weights: number[] = [];
  bias: number = 58;
  
  constructor() {
    // Feature order: [Calories, Protein, Carbs, Fat, SatFat, Sugar, Fiber, Sodium, Processing]
    // Calibrated nutritional starting weights (scale factor applied to normalized features):
    this.weights = [-16, 28, -6, -8, -20, -26, 24, -14, -20];
    this.bias = 58;
  }

  predictRaw(features: number[]): number {
    let result = this.bias;
    for (let i = 0; i < features.length; i++) {
      result += this.weights[i] * (features[i] ?? 0);
    }
    return result;
  }
  
  predict(features: number[]): number {
    const raw = this.predictRaw(features);
    return Math.max(5, Math.min(98, Math.round(raw * 10) / 10));
  }
  
  train(features: number[][], labels: number[], epochs: number = 150, learningRate: number = 0.05) {
    if (!features || features.length === 0 || !labels || labels.length === 0) return;
    const numFeatures = features[0].length;
    const numSamples = features.length;
    
    // Gradient descent training on linear regression MSE loss
    for (let epoch = 0; epoch < epochs; epoch++) {
      const weightGradients = Array(numFeatures).fill(0);
      let biasGradient = 0;
      
      // Calculate gradients
      for (let i = 0; i < numSamples; i++) {
        const prediction = this.predictRaw(features[i]);
        const error = prediction - labels[i];
        
        for (let j = 0; j < numFeatures; j++) {
          weightGradients[j] += error * features[i][j];
        }
        biasGradient += error;
      }
      
      // Update weights and bias
      for (let j = 0; j < numFeatures; j++) {
        this.weights[j] -= (learningRate * weightGradients[j]) / numSamples;
      }
      this.bias -= (learningRate * biasGradient) / numSamples;
    }
  }
}

// Generate rich benchmark training dataset from curated data and synthetic profiles
function getBenchmarkTrainingData(): any[] {
  const samples: any[] = [];

  // 1. Gather all curated items
  const allCurated = [
    ...Object.values(mealTypeAlternatives).flat(),
    ...Object.values(alternativesByCategory).flat()
  ];

  for (const item of allCurated) {
    if (!item.nutrition) continue;
    const n = item.nutrition;
    samples.push({
      calories: n.calories,
      protein: n.protein,
      carbs: n.carbs,
      fat: n.fat,
      saturatedFat: n.saturatedFat || 0,
      sugar: n.sugar || 0,
      fiber: n.fiber || 0,
      sodium: n.sodium || 0,
      processingLevel: n.processingLevel ?? 0.3,
      healthScore: calculateBasicHealthScore(n, 'athletic')
    });
  }

  // 2. Add boundary synthetic benchmarks (junk food, high protein, ultra-healthy, smoothies, etc.)
  const benchmarks = [
    // Ultra-processed / Junk Foods
    { calories: 550, protein: 5, carbs: 65, fat: 30, saturatedFat: 12, sugar: 35, fiber: 1, sodium: 850, processingLevel: 0.9, healthScore: 18 },
    { calories: 480, protein: 7, carbs: 60, fat: 24, saturatedFat: 10, sugar: 28, fiber: 2, sodium: 600, processingLevel: 0.8, healthScore: 24 },
    { calories: 540, protein: 6, carbs: 55, fat: 34, saturatedFat: 11, sugar: 2, fiber: 3, sodium: 750, processingLevel: 0.9, healthScore: 22 },
    { calories: 150, protein: 0, carbs: 39, fat: 0, saturatedFat: 0, sugar: 39, fiber: 0, sodium: 30, processingLevel: 0.9, healthScore: 14 },
    { calories: 340, protein: 14, carbs: 32, fat: 18, saturatedFat: 7, sugar: 4, fiber: 2, sodium: 920, processingLevel: 0.8, healthScore: 36 },

    // Fresh / Optimal Healthy Foods & Smoothies
    { calories: 110, protein: 3, carbs: 22, fat: 0.5, saturatedFat: 0.1, sugar: 12, fiber: 4, sodium: 20, processingLevel: 0.1, healthScore: 86 },
    { calories: 65, protein: 2, carbs: 12, fat: 0.3, saturatedFat: 0.1, sugar: 6, fiber: 5, sodium: 40, processingLevel: 0.1, healthScore: 92 },
    { calories: 120, protein: 22, carbs: 2, fat: 2, saturatedFat: 0.5, sugar: 0, fiber: 0, sodium: 180, processingLevel: 0.2, healthScore: 88 },
    { calories: 160, protein: 6, carbs: 28, fat: 3, saturatedFat: 0.5, sugar: 2, fiber: 6, sodium: 220, processingLevel: 0.2, healthScore: 84 },
    { calories: 80, protein: 3, carbs: 14, fat: 0.5, saturatedFat: 0.1, sugar: 3, fiber: 4, sodium: 90, processingLevel: 0.1, healthScore: 92 },
    { calories: 210, protein: 8, carbs: 35, fat: 4, saturatedFat: 0.6, sugar: 5, fiber: 7, sodium: 30, processingLevel: 0.2, healthScore: 85 },
    { calories: 240, protein: 28, carbs: 8, fat: 8, saturatedFat: 1.5, sugar: 2, fiber: 4, sodium: 280, processingLevel: 0.2, healthScore: 87 },

    // Moderate / Balanced Meals
    { calories: 320, protein: 12, carbs: 45, fat: 9, saturatedFat: 2.5, sugar: 6, fiber: 4, sodium: 480, processingLevel: 0.5, healthScore: 62 },
    { calories: 260, protein: 10, carbs: 38, fat: 7, saturatedFat: 1.8, sugar: 5, fiber: 5, sodium: 380, processingLevel: 0.4, healthScore: 68 },
  ];

  samples.push(...benchmarks);
  return samples;
}

// Global model cache / promise singleton
let trainedModel: LinearRegressionModel | null = null;
let modelTrainingPromise: Promise<LinearRegressionModel> | null = null;

// Train ML model using custom linear regression with gradient descent
export async function trainHealthScoreModel(): Promise<LinearRegressionModel> {
  console.log('Training ML health score model via gradient descent...');
  
  // Use rich benchmark dataset for instant (<1ms) deterministic in-memory training
  const trainingData = getBenchmarkTrainingData();
  
  // Prepare normalized features and labels (scores 0..100)
  const features = trainingData.map(d => [
    (d.calories || 0) / 600,
    (d.protein || 0) / 30,
    (d.carbs || 0) / 100,
    (d.fat || 0) / 40,
    (d.saturatedFat || 0) / 20,
    (d.sugar || 0) / 50,
    (d.fiber || 0) / 15,
    (d.sodium || 0) / 2000,
    d.processingLevel ?? 0.5
  ]);
  
  const labels = trainingData.map(d => Number(d.healthScore || 50));
  
  // Train model with gradient descent
  const model = new LinearRegressionModel();
  model.train(features, labels, 150, 0.05);
  
  console.log('Model training complete. Bias:', Number(model.bias.toFixed(2)), 'Weights:', model.weights.map(w => Number(w.toFixed(2))));
  return model;
}

// Initialize model training and return singleton instance
export async function ensureModelTrained(): Promise<LinearRegressionModel> {
  if (trainedModel) return trainedModel;
  
  if (!modelTrainingPromise) {
    modelTrainingPromise = trainHealthScoreModel();
  }
  
  trainedModel = await modelTrainingPromise;
  return trainedModel;
}
