import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { 
  Flame, 
  Footprints, 
  Heart, 
  Activity, 
  Upload, 
  Download, 
  Smartphone, 
  ShieldCheck, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Clock,
  Zap,
  Info
} from "lucide-react";
import { useAppleHealth } from "@/contexts/AppleHealthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { AppleHealthRings } from "./AppleHealthRings";
import { toast } from "sonner";

interface AppleHealthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AppleHealthModal: React.FC<AppleHealthModalProps> = ({ open, onOpenChange }) => {
  const { 
    syncState, 
    summary, 
    lastSyncedText,
    syncActivityData, 
    importAppleHealthData, 
    exportMealAsAppleHealthFile, 
    generateShortcutLink,
    disconnectAppleHealth 
  } = useAppleHealth();
  const { profile } = useUserProfile();

  const [activeBurnInput, setActiveBurnInput] = useState<number>(syncState.activity.activeEnergyBurned || 240);
  const [stepsInput, setStepsInput] = useState<number>(syncState.activity.stepCount || 4150);
  const [heartRateInput, setHeartRateInput] = useState<number>(syncState.activity.restingHeartRate || 64);
  const [weightInput, setWeightInput] = useState<number>(profile.weight || 70);
  const [isImporting, setIsImporting] = useState(false);

  const handleManualSync = () => {
    syncActivityData({
      activeEnergyBurned: activeBurnInput,
      stepCount: stepsInput,
      restingHeartRate: heartRateInput,
      bodyWeight: weightInput
    }, "manual");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importAppleHealthData(content);
      }
      setIsImporting(false);
    };
    reader.onerror = () => {
      toast.error("Failed to read file.");
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  const copyShortcutLink = () => {
    const link = generateShortcutLink();
    navigator.clipboard.writeText(link);
    toast.success("Apple Health Shortcut URL copied to clipboard!", {
      description: "Paste in Safari or Shortcuts app to sync automatically."
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🍎</span>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  Apple Health & HealthKit Sync
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Two-way activity ingestion, live calorie burn calibration, and HealthKit meal logging.
                </DialogDescription>
              </div>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs flex items-center gap-1.5 font-semibold">
              <Clock className="h-3 w-3" />
              Last synced: {lastSyncedText}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="dashboard" className="space-y-5">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="dashboard" className="text-xs font-semibold">
              Activity & Rings
            </TabsTrigger>
            <TabsTrigger value="sync" className="text-xs font-semibold">
              Sync & Shortcuts
            </TabsTrigger>
            <TabsTrigger value="meals" className="text-xs font-semibold">
              Logged Meals ({syncState.loggedMeals.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Activity Rings & Health Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-5 bg-muted/20 rounded-2xl border border-border/50">
              <AppleHealthRings
                moveValue={syncState.activity.activeEnergyBurned}
                moveTarget={500}
                intakeValue={summary.totalCaloriesConsumed}
                intakeTarget={summary.dailyTargetCalories}
                proteinValue={summary.totalProteinConsumed}
                proteinTarget={summary.dailyTargetProtein}
                size={160}
              />

              <div className="space-y-3 text-center sm:text-left flex-1">
                <div>
                  <h4 className="text-base font-bold text-foreground">Today's HealthKit Activity</h4>
                  <p className="text-xs text-muted-foreground">
                    Last synced: {new Date(syncState.activity.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 font-medium text-red-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FA114F]" />
                      Move (Active Burn):
                    </span>
                    <strong className="text-foreground">{syncState.activity.activeEnergyBurned} / 500 kcal</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 font-medium text-amber-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF9500]" />
                      Dietary Intake:
                    </span>
                    <strong className="text-foreground">{summary.totalCaloriesConsumed} / {summary.dailyTargetCalories} kcal</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 font-medium text-emerald-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#30D158]" />
                      Protein Goal:
                    </span>
                    <strong className="text-foreground">{summary.totalProteinConsumed} / {summary.dailyTargetProtein}g</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-3.5 space-y-1 bg-card/60">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Flame className="h-3.5 w-3.5 text-red-500" />
                  <span>Active Energy</span>
                </div>
                <p className="text-lg font-bold text-foreground">{syncState.activity.activeEnergyBurned} kcal</p>
              </Card>

              <Card className="p-3.5 space-y-1 bg-card/60">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Footprints className="h-3.5 w-3.5 text-amber-500" />
                  <span>Steps</span>
                </div>
                <p className="text-lg font-bold text-foreground">{syncState.activity.stepCount.toLocaleString()}</p>
              </Card>

              <Card className="p-3.5 space-y-1 bg-card/60">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Heart className="h-3.5 w-3.5 text-pink-500" />
                  <span>Heart Rate</span>
                </div>
                <p className="text-lg font-bold text-foreground">{syncState.activity.restingHeartRate || 64} bpm</p>
              </Card>

              <Card className="p-3.5 space-y-1 bg-card/60">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Activity className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Net Calories</span>
                </div>
                <p className="text-lg font-bold text-foreground">{summary.netCalories} kcal</p>
              </Card>
            </div>

            {/* Dynamic TDEE formula breakdown */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-primary font-bold">
                <Info className="h-4 w-4" />
                <span>How Apple Health Calibrates Your Target Budget:</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Base BMR ({1680} kcal) + Apple Health Workout Burn ({syncState.activity.activeEnergyBurned} kcal) = Total Energy Expenditure ({1680 + syncState.activity.activeEnergyBurned} kcal). 
                Adjusted for your <strong>{profile.targetBodyType?.toUpperCase()}</strong> goal $\implies$ <strong>{summary.dailyTargetCalories} kcal daily target</strong>.
              </p>
            </div>
          </TabsContent>

          {/* TAB 2: Sync Methods & Shortcuts */}
          <TabsContent value="sync" className="space-y-5">
            {/* Method A: Apple Health Shortcut */}
            <Card className="p-4.5 space-y-3 bg-gradient-to-br from-card to-primary/5 border-border/70">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Option 1: 1-Tap iOS Shortcut Bridge</h4>
                  <p className="text-xs text-muted-foreground">Sync your Apple Watch & iPhone HealthKit data in 1 second.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" onClick={copyShortcutLink} className="text-xs font-semibold flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  Get Apple Health Shortcut
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.open(generateShortcutLink(), "_blank")} className="text-xs">
                  Open Shortcut
                </Button>
              </div>
            </Card>

            {/* Method B: XML/JSON Import */}
            <Card className="p-4.5 space-y-3 bg-gradient-to-br from-card to-amber-500/5 border-border/70">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Option 2: Import Apple Health Export File</h4>
                  <p className="text-xs text-muted-foreground">Upload your exported export.xml or metrics.json file from the Health app.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="cursor-pointer">
                  <input type="file" accept=".xml,.json,.txt" onChange={handleFileUpload} className="hidden" />
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md border border-border/50 shadow-sm transition-all">
                    <Upload className="h-3.5 w-3.5" />
                    {isImporting ? "Parsing file..." : "Select Apple Health File"}
                  </span>
                </label>
              </div>
            </Card>

            {/* Method C: Manual Biometric Adjuster */}
            <Card className="p-4.5 space-y-4 bg-card border-border/70">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-muted text-foreground">
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Option 3: Quick Biometric Sync</h4>
                    <p className="text-xs text-muted-foreground">Adjust live metrics matching your Apple Watch readings.</p>
                  </div>
                </div>
                <Button size="sm" onClick={handleManualSync} className="text-xs font-bold bg-primary text-primary-foreground">
                  Apply Sync
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Energy Burned:</span>
                    <strong className="text-red-500 font-bold">{activeBurnInput} kcal</strong>
                  </div>
                  <Slider 
                    min={100} 
                    max={1500} 
                    step={10} 
                    value={[activeBurnInput]} 
                    onValueChange={(val) => setActiveBurnInput(val[0])} 
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Steps:</span>
                    <strong className="text-amber-500 font-bold">{stepsInput.toLocaleString()} steps</strong>
                  </div>
                  <Slider 
                    min={1000} 
                    max={30000} 
                    step={100} 
                    value={[stepsInput]} 
                    onValueChange={(val) => setStepsInput(val[0])} 
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resting Heart Rate:</span>
                    <strong className="text-pink-500 font-bold">{heartRateInput} bpm</strong>
                  </div>
                  <Slider 
                    min={45} 
                    max={110} 
                    step={1} 
                    value={[heartRateInput]} 
                    onValueChange={(val) => setHeartRateInput(val[0])} 
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Body Weight:</span>
                    <strong className="text-emerald-500 font-bold">{weightInput} kg</strong>
                  </div>
                  <Slider 
                    min={40} 
                    max={150} 
                    step={0.5} 
                    value={[weightInput]} 
                    onValueChange={(val) => setWeightInput(val[0])} 
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 3: Logged Meals */}
          <TabsContent value="meals" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-foreground">HealthKit Meal Logs</h4>
                <p className="text-xs text-muted-foreground">Meals scanned in NutriAI and synced to Apple Health.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => exportMealAsAppleHealthFile()} className="text-xs flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export JSON
              </Button>
            </div>

            {syncState.loggedMeals.length === 0 ? (
              <div className="p-8 text-center space-y-2 bg-muted/20 rounded-xl border border-dashed border-border/70 text-muted-foreground">
                <p className="text-sm">No meals logged to Apple Health yet.</p>
                <p className="text-xs">Scan or speak a food in NutriAI and click "Log to Apple Health"!</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {syncState.loggedMeals.map((meal) => (
                  <div key={meal.id} className="p-3 bg-muted/30 rounded-lg border border-border/40 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-foreground">{meal.foodName}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                        <span>{meal.calories} kcal</span> • 
                        <span>{meal.protein}g Protein</span> • 
                        <span>{meal.carbs}g Carbs</span> • 
                        <span>{meal.fat}g Fat</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                        {new Date(meal.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
