import { useState } from "react";
import { Link } from "react-router-dom";
import { FoodScanner } from "@/components/FoodScanner";
import { VoiceAdvisor } from "@/components/VoiceAdvisor";
import { FoodResults } from "@/components/FoodResults";
import { AppleHealthCard } from "@/components/AppleHealthCard";
import { ScannedMealsJournal } from "@/components/ScannedMealsJournal";
import { Utensils, Brain, ArrowLeft, Camera, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";

const FoodAnalyzer = () => {
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [inputMode, setInputMode] = useState<"photo" | "voice">("photo");

  return (
    <div className="flex min-h-screen flex-col bg-background">
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
          <div className="inline-flex items-center gap-3 rounded-full border border-stone bg-card px-5 py-2 text-xs uppercase tracking-widest text-sage">
            <Utensils className="h-4 w-4" strokeWidth={1.5} />
            <span>Nutrition analysis & voice advisor</span>
          </div>
          
          <h1 className="text-5xl leading-[1.05] md:text-7xl">
            Discover <span className="italic text-sage">healthier</span> food choices
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Scan a photo or talk hands-free in natural voice to get instant healthier alternatives 
            calibrated with your Apple Health activity & targets.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="inline-flex flex-wrap justify-center gap-2 rounded-full border border-border bg-muted p-1.5">
            <button
              onClick={() => setInputMode("photo")}
              className={`flex items-center gap-2 rounded-full px-6 py-3 text-xs uppercase tracking-widest transition-all duration-300 ${
                inputMode === "photo"
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Camera className="h-4 w-4" strokeWidth={1.5} />
              Photo
            </button>
            <button
              onClick={() => setInputMode("voice")}
              className={`flex items-center gap-2 rounded-full px-6 py-3 text-xs uppercase tracking-widest transition-all duration-300 ${
                inputMode === "voice"
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mic className="h-4 w-4" strokeWidth={1.5} />
              Voice
              <span className="rounded-full bg-terracotta px-2 py-0.5 text-[10px] tracking-widest text-accent-foreground">
                Live
              </span>
            </button>
          </div>
        </div>

        {/* Live Apple Health Activity Card */}
        <div className="max-w-4xl mx-auto">
          <AppleHealthCard />
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

        {/* Scanned Meals Journal */}
        <div className="max-w-5xl mx-auto pt-8">
          <ScannedMealsJournal />
        </div>

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
