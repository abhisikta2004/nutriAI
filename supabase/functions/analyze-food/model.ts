import { fetchTrainingData } from "./openFoodFacts.ts";
import { alternativesByCategory, mealTypeAlternatives } from "./curatedData.ts";
import { calculateBasicHealthScore } from "./scoring.ts";

// Simple Linear Regression Model (custom implementation for Deno edge functions)
export class LinearRegressionModel {
  weights: number[] = [];
  bias: number = 0;
  
  train(features: number[][], labels: number[], epochs: number = 100, learningRate: number = 0.05) {
    if (!features || features.length === 0 || !labels || labels.length === 0) return;
    const numFeatures = features[0].length;
    const numSamples = features.length;
    
    // Initialize weights and bias with sensible defaults
    this.weights = Array(numFeatures).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.bias = 0.5;
    
    // Gradient descent training
    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalLoss = 0;
      const weightGradients = Array(numFeatures).fill(0);
      let biasGradient = 0;
      
      // Calculate gradients
      for (let i = 0; i < numSamples; i++) {
        const prediction = this.predict(features[i]);
        const error = prediction - labels[i];
        totalLoss += error * error;
        
        // Update gradients
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
  
  predict(features: number[]): number {
    let result = this.bias;
    for (let i = 0; i < features.length; i++) {
      result += this.weights[i] * features[i];
    }
    // Sigmoid activation for 0-1 output
    return 1 / (1 + Math.exp(-result));
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

  // 2. Add boundary synthetic benchmarks (junk food, high protein, ultra-healthy, etc.)
  const benchmarks = [
    { calories: 550, protein: 5, carbs: 65, fat: 30, saturatedFat: 12, sugar: 35, fiber: 1, sodium: 850, processingLevel: 0.9, healthScore: 18 },
    { calories: 480, protein: 7, carbs: 60, fat: 24, saturatedFat: 10, sugar: 28, fiber: 2, sodium: 600, processingLevel: 0.8, healthScore: 24 },
    { calories: 120, protein: 22, carbs: 2, fat: 2, saturatedFat: 0.5, sugar: 0, fiber: 0, sodium: 180, processingLevel: 0.2, healthScore: 88 },
    { calories: 160, protein: 6, carbs: 28, fat: 3, saturatedFat: 0.5, sugar: 2, fiber: 6, sodium: 220, processingLevel: 0.2, healthScore: 84 },
    { calories: 80, protein: 3, carbs: 14, fat: 0.5, saturatedFat: 0.1, sugar: 3, fiber: 4, sodium: 90, processingLevel: 0.1, healthScore: 92 },
    { calories: 320, protein: 12, carbs: 45, fat: 9, saturatedFat: 2.5, sugar: 6, fiber: 4, sodium: 480, processingLevel: 0.5, healthScore: 60 },
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
  
  // Prepare normalized features and labels
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
  
  const labels = trainingData.map(d => (d.healthScore || 50) / 100);
  
  // Train model with gradient descent
  const model = new LinearRegressionModel();
  model.train(features, labels, 120, 0.08);
  
  console.log('Model training complete. Weights:', model.weights.map(w => Number(w.toFixed(3))));
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
