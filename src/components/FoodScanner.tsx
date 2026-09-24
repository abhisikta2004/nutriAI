import { useState } from "react";
import { Upload, Loader2, Camera, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/contexts/UserProfileContext";

interface FoodScannerProps {
  onAnalysis: (result: any) => void;
}

export const FoodScanner = ({ onAnalysis }: FoodScannerProps) => {
  const { profile } = useUserProfile();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  const extractErrorMessage = async (error: unknown): Promise<string> => {
    if (!error) return "An unexpected error occurred.";
    if (typeof error === "string") return error;
    
    const ctx = (error as any)?.context;
    if (ctx && typeof ctx.json === "function") {
      try {
        const body = await ctx.json();
        if (body?.error) return body.error;
        if (body?.message) return body.message;
      } catch {
        // ignore json parse error
      }
    }
    if ((error as any)?.message) {
      return (error as any).message;
    }
    return "Failed to analyze food. Please try again.";
  };

  const invokeAnalyzeFood = async (body: any, retries = 1) => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const { data, error } = await supabase.functions.invoke("analyze-food", { body });

      if (!error) return data;

      lastError = error;
      const status = (error as any)?.context?.status ?? (error as any)?.status;
      const retryable = [429, 500, 502, 503, 504].includes(status);

      if (attempt < retries && retryable) {
        await sleep(800 * (attempt + 1));
        continue;
      }

      break;
    }

    throw lastError;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      toast.error("Image is too large. Please choose a smaller photo.");
      return;
    }

    // Fast preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const base64 = await fileToOptimizedBase64(file);
      await analyzeFood(base64);
    } catch (err) {
      console.error("Error processing image:", err);
      toast.error("Failed to process image file. Please try another image.");
    }
  };

  const analyzeFood = async (base64: string) => {
    setIsAnalyzing(true);
    try {
      const data = await invokeAnalyzeFood(
        {
          image: base64,
          userProfile: {
            dietPreference: profile.dietPreference,
            allergies: profile.allergies,
            currentBodyType: profile.currentBodyType,
            targetBodyType: profile.targetBodyType,
            weight: profile.weight,
            age: profile.age,
          },
        },
        1
      );

      if (data) {
        data.scannedImage = base64;
      }
      onAnalysis(data);
      toast.success("Food analyzed successfully!");
    } catch (error) {
      console.error("Analysis error:", error);
      const msg = await extractErrorMessage(error);
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const fileToOptimizedBase64 = async (file: File): Promise<string> => {
    try {
      return await fileToOptimizedDataUrl(file);
    } catch (err) {
      console.warn("Image optimization failed, using original image", err);
      return await fileToBase64(file);
    }
  };

  const fileToOptimizedDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        try {
          const maxDim = 1280;
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));

          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas 2D context not available");

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
          resolve(dataUrl);
        } catch (e) {
          reject(e);
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };

      img.onerror = (e) => {
        URL.revokeObjectURL(objectUrl);
        reject(e);
      };

      img.src = objectUrl;
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const resetScanner = () => {
    setPreview(null);
  };

  return (
    <Card className="border-border/80 bg-card p-8 shadow-card">
      <div
        className={`relative rounded-[40px] border border-dashed p-10 text-center transition-all duration-500 ${
          dragActive
            ? "border-sage bg-sage/10"
            : "border-border hover:border-sage/60"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept="image/*"
          onChange={handleFileInput}
          disabled={isAnalyzing}
        />

        {preview ? (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Food preview"
              className="mx-auto max-h-72 rounded-t-[140px] border border-border/40 object-cover shadow-elevated"
            />
            
            {isAnalyzing ? (
              <div className="flex items-center justify-center gap-2 text-primary font-semibold py-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Analyzing nutritional profile & finding healthier swaps...</span>
              </div>
            ) : (
              <div className="flex gap-3 justify-center pt-2">
                <Button variant="outline" size="sm" onClick={resetScanner}>
                  <Camera className="h-4 w-4 mr-1.5" />
                  Scan Another Food
                </Button>
              </div>
            )}
          </div>
        ) : (
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center gap-4"
          >
            <div className="rounded-full border border-sage/30 bg-sage/10 p-5 text-sage shadow-soft transition-transform duration-700 ease-out hover:scale-105">
              <Upload className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-1.5">
              <p className="text-lg font-bold text-foreground">
                Drop your food photo here or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Instant AI recognition with USDA-grade nutrient calculation & healthier alternatives
              </p>
            </div>
            <Button type="button" variant="outline" size="lg" disabled={isAnalyzing} className="shadow-sm">
              <Camera className="h-4 w-4 mr-2" />
              Select Food Image
            </Button>
          </label>
        )}
      </div>
    </Card>
  );
};
