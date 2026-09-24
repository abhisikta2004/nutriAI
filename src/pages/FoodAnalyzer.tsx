import { useState } from "react";
import { Link } from "react-router-dom";
import { FoodScanner } from "@/components/FoodScanner";
import { VoiceAdvisor } from "@/components/VoiceAdvisor";
import { FoodResults } from "@/components/FoodResults";
import { Utensils, Brain, ArrowLeft, Camera, Mic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";

const FoodAnalyzer = () => {
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [inputMode, setInputMode] = useState<"photo" | "voice">("photo");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background flex flex-col">
      <Header />

      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <Link to="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8 md:py-12 space-y-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-primary/10 rounded-full">
            <Utensils className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary">
              AI-Powered Nutrition Analysis & Voice Advisor
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Discover Healthier Food Choices
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Scan a photo or talk hands-free in natural voice to get instant healthier alternatives 
            powered by Explainable AI.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="inline-flex p-1.5 bg-muted/60 backdrop-blur-md rounded-2xl border border-border/50 shadow-sm gap-2">
            <button
              onClick={() => setInputMode("photo")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                inputMode === "photo"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Camera className="h-4 w-4" />
              Photo Scanner
            </button>
            <button
              onClick={() => setInputMode("voice")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                inputMode === "voice"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Mic className="h-4 w-4" />
              Voice Advisor
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-bold uppercase tracking-wider">
                Voice AI
              </span>
            </button>
          </div>
        </div>

        {/* Input Interface based on Selected Mode */}
        <div className="max-w-2xl mx-auto">
          {inputMode === "photo" ? (
            <FoodScanner onAnalysis={setAnalysisResult} />
          ) : (
            <VoiceAdvisor onAnalysis={setAnalysisResult} />
          )}
        </div>

        {/* Results */}
        {analysisResult && (
          <div className="max-w-7xl mx-auto pt-8">
            <FoodResults data={analysisResult} />
          </div>
        )}

        {/* Explainable AI Badge */}
        {!analysisResult && (
          <div className="text-center pt-8">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Brain className="h-4 w-4" />
              <span>Powered by Weighted Nutrient Contribution Analysis</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodAnalyzer;
