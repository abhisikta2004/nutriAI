import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  Sparkles, 
  Trash2, 
  Utensils, 
  CheckCircle2, 
  ArrowRight, 
  Flame, 
  Calendar,
  Clock,
  TrendingUp,
  Image as ImageIcon
} from "lucide-react";
import { useAppleHealth } from "@/contexts/AppleHealthContext";
import { Link } from "react-router-dom";

export const ScannedMealsJournal: React.FC = () => {
  const { syncState, deleteMealLog, clearMealLogs } = useAppleHealth();
  const [filter, setFilter] = useState<"all" | "healthier" | "original">("all");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const meals = syncState.loggedMeals || [];

  const filteredMeals = meals.filter((meal) => {
    if (filter === "healthier") return meal.loggedChoiceType === "healthier_alternative";
    if (filter === "original") return meal.loggedChoiceType === "original";
    return true;
  });

  const healthierCount = meals.filter(m => m.loggedChoiceType === "healthier_alternative").length;
  const originalCount = meals.filter(m => m.loggedChoiceType === "original").length;
  const healthierRate = meals.length > 0 ? Math.round((healthierCount / meals.length) * 100) : 0;

  return (
    <section className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Camera className="h-5 w-5" />
            </div>
            <h3 className="text-2xl font-bold text-foreground tracking-tight">
              Scanned Meals & Food Journal
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Photo log of your scanned dishes and whether you logged the original food or a healthier alternative.
          </p>
        </div>

        {meals.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearMealLogs}
              className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border/70 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Journal
            </Button>
            <Link to="/analyze">
              <Button size="sm" className="text-xs font-semibold gap-1.5 shadow-sm">
                <Camera className="h-3.5 w-3.5" />
                Scan New Meal
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Stats Summary Bar */}
      {meals.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 bg-card/70 border-border/60">
            <p className="text-xs text-muted-foreground">Total Meals Scanned</p>
            <p className="text-xl font-bold text-foreground mt-0.5">{meals.length}</p>
          </Card>

          <Card className="p-4 bg-card/70 border-border/60">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Healthier Swaps
            </p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{healthierCount}</p>
          </Card>

          <Card className="p-4 bg-card/70 border-border/60">
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Original Dishes</p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{originalCount}</p>
          </Card>

          <Card className="p-4 bg-card/70 border-border/60">
            <p className="text-xs text-primary font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Healthier Choice Rate
            </p>
            <p className="text-xl font-bold text-primary mt-0.5">{healthierRate}%</p>
          </Card>
        </div>
      )}

      {/* Filter Tabs */}
      {meals.length > 0 && (
        <div className="flex items-center gap-2 border-b border-border/50 pb-3 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
              filter === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            All Logs ({meals.length})
          </button>
          <button
            onClick={() => setFilter("healthier")}
            className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              filter === "healthier"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Healthier Alternatives ({healthierCount})
          </button>
          <button
            onClick={() => setFilter("original")}
            className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
              filter === "original"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Original Dishes ({originalCount})
          </button>
        </div>
      )}

      {/* Meal Journal List */}
      {filteredMeals.length === 0 ? (
        <Card className="p-10 text-center space-y-4 bg-gradient-to-br from-card to-muted/20 border-dashed border-2 border-border/70">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-sm">
            <Camera className="h-7 w-7" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h4 className="text-lg font-bold text-foreground">
              {meals.length === 0 ? "No Scanned Meals Yet" : "No Meals in This Filter"}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {meals.length === 0
                ? "Snap a photo of your breakfast, lunch, or dinner to analyze nutrients and record whether you chose the original dish or a healthier alternative."
                : "Try selecting 'All Logs' to view all your recorded meals."}
            </p>
          </div>
          {meals.length === 0 && (
            <Link to="/analyze">
              <Button size="sm" className="font-semibold gap-2 mt-2 shadow-sm">
                <Camera className="h-4 w-4" />
                Scan Your First Food Photo
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMeals.map((meal) => {
            const isHealthier = meal.loggedChoiceType === "healthier_alternative";
            const dateStr = new Date(meal.loggedAt).toLocaleDateString([], {
              month: "short",
              day: "numeric"
            });
            const timeStr = new Date(meal.loggedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            });

            return (
              <Card
                key={meal.id}
                className="p-4.5 bg-card/85 border border-border/60 hover:border-border transition-all duration-200 shadow-sm hover:shadow-card flex flex-col justify-between gap-3 group relative overflow-hidden"
              >
                {/* Background ambient gradient based on choice */}
                <div 
                  className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none ${
                    isHealthier ? "bg-emerald-500/10" : "bg-amber-500/10"
                  }`} 
                />

                <div className="flex items-start gap-4 relative z-10">
                  {/* Scanned Photo Thumbnail */}
                  <div 
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-muted/40 border border-border/60 shrink-0 relative cursor-pointer group/photo shadow-sm"
                    onClick={() => meal.scannedImage && setSelectedPhoto(meal.scannedImage)}
                  >
                    {meal.scannedImage ? (
                      <>
                        <img
                          src={meal.scannedImage}
                          alt={meal.originalDishName || meal.foodName}
                          className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-2 text-center bg-gradient-to-br from-muted/30 to-muted/80">
                        <Utensils className="h-6 w-6 mb-1 opacity-70" />
                        <span className="text-[10px] font-medium leading-tight">Voice / Scan</span>
                      </div>
                    )}
                  </div>

                  {/* Dish Info & Choice Badge */}
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {/* Scanned Dish Name */}
                        <h4 className="text-base font-bold text-foreground truncate" title={meal.originalDishName || meal.foodName}>
                          {meal.originalDishName || meal.foodName}
                        </h4>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>{dateStr} • {timeStr}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => deleteMealLog(meal.id)}
                        className="text-muted-foreground/50 hover:text-destructive transition-colors p-1 rounded-md hover:bg-muted"
                        title="Remove from journal"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Choice Badge (Healthier Alternative vs Original) */}
                    <div>
                      {isHealthier ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">
                            Healthier Swap Chosen: <strong>{meal.alternativeName || meal.foodName}</strong>
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold">
                          <Utensils className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span>Original Dish Logged</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Macro Nutrients Footer */}
                <div className="pt-2.5 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2 relative z-10">
                  <div className="flex items-center gap-3 font-medium">
                    <span className="text-foreground font-bold flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5 text-red-500" />
                      {meal.calories} kcal
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {meal.protein}g Protein
                    </span>
                    <span>{meal.carbs}g Carbs</span>
                    <span>{meal.fat}g Fat</span>
                  </div>

                  <Badge variant="outline" className="text-[10px] bg-muted/40 font-mono py-0">
                    Apple Health 🍎
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Photo Lightbox Dialog */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-xl max-h-[85vh] bg-card rounded-2xl overflow-hidden border border-border/60 shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto}
              alt="Scanned Food Zoom"
              className="max-h-[75vh] w-auto mx-auto rounded-xl object-contain"
            />
            <div className="text-center pt-2 pb-1">
              <Button size="sm" variant="ghost" onClick={() => setSelectedPhoto(null)} className="text-xs">
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
