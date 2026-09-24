import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Sparkles, Heart, Brain, ArrowRight, CheckCircle2, Mic, Activity } from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { AppleHealthCard } from "@/components/AppleHealthCard";
import Header from "@/components/Header";

const Home = () => {
  const { profile, resetProfile } = useUserProfile();

  // Show onboarding if not completed
  if (!profile.hasCompletedOnboarding) {
    return <OnboardingFlow />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 flex-1">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary/10 rounded-full animate-pulse">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary">
              AI-Powered Vision, Voice & Apple Health Intelligence
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Make{" "}
            <span className="bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent">
              Smarter
            </span>
            <br />
            Food Choices
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Snap a photo or speak hands-free to discover healthier alternatives instantly. 
            Calibrated live with Apple Watch active burn, steps, and HealthKit sync.
          </p>

          {/* User Profile Summary */}
          <Card className="inline-flex items-center gap-4 px-6 py-3 bg-card/80 backdrop-blur">
            <span className="text-sm text-muted-foreground">
              Profile: <span className="font-medium text-foreground capitalize">{profile.dietPreference}</span> • 
              Goal: <span className="font-medium text-foreground capitalize">{profile.targetBodyType}</span>
            </span>
            <Link to="/" onClick={async () => {
              await resetProfile();
              window.location.reload();
            }}>
              <Button variant="ghost" size="sm" className="text-xs">
                Edit Profile
              </Button>
            </Link>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
            <Link to="/analyze">
              <Button size="lg" className="text-lg px-8 py-6 shadow-[0_0_20px_rgba(142,71,45,0.3)] hover:shadow-[0_0_30px_rgba(142,71,45,0.5)] transition-all">
                <Camera className="mr-2 h-5 w-5" />
                Scan Food Photo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/analyze">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary/40 bg-card/80 hover:bg-primary/10 transition-all">
                <Mic className="mr-2 h-5 w-5 text-primary" />
                Talk to Voice Advisor
              </Button>
            </Link>
          </div>

          {/* Apple Health Live Sync Overview */}
          <div className="max-w-3xl mx-auto pt-6 text-left">
            <AppleHealthCard />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          <Card className="p-7 bg-card border-border/50 hover:border-primary/50 transition-all hover:shadow-card">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Vision AI Scanner</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Snap or upload any meal photo. Identifies foods and extracts USDA-level nutritional parameters in seconds.
              </p>
            </div>
          </Card>

          <Card className="p-7 bg-card border-border/50 hover:border-primary/50 transition-all hover:shadow-card">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Mic className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Conversational Voice</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Hands-free voice assistant. Speak what you're eating and hear natural spoken recommendations with conversational pauses.
              </p>
            </div>
          </Card>

          <Card className="p-7 bg-card border-border/50 hover:border-red-500/50 transition-all hover:shadow-card">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Apple Health & HealthKit</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Live concentric Activity Rings (Move, Intake, Protein). Calibrates your daily calorie allowance from Apple Watch workouts.
              </p>
            </div>
          </Card>

          <Card className="p-7 bg-card border-border/50 hover:border-primary/50 transition-all hover:shadow-card">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center">
                <Heart className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Goal Personalization</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Alternatives calibrated to your target body goal ({profile.targetBodyType}), diet preference, and allergens.
              </p>
            </div>
          </Card>

          <Card className="p-7 bg-card border-border/50 hover:border-primary/50 transition-all hover:shadow-card md:col-span-2 lg:col-span-2">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Brain className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Explainable AI Scoring</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Transparent linear ML regression coefficients show precisely what nutrient differences raised or lowered your score, dynamically weighted for your body transition.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                1
              </div>
              <h4 className="text-xl font-semibold text-foreground">Upload Photo or Speak</h4>
              <p className="text-muted-foreground">
                Take a picture of your food or speak hands-free with Voice Advisor for instant nutritional analysis.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xl font-bold">
                2
              </div>
              <h4 className="text-xl font-semibold text-foreground">AI Analysis</h4>
              <p className="text-muted-foreground">
                Our trained ML model analyzes nutritional content and calculates total calories based on your portion.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xl font-bold">
                3
              </div>
              <h4 className="text-xl font-semibold text-foreground">Get Best Result</h4>
              <p className="text-muted-foreground">
                Discover healthier alternatives with our top pick highlighted. Filtered for your allergies and diet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="p-12 bg-gradient-to-br from-primary/5 to-secondary/5 border-border/50 max-w-4xl mx-auto">
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground">
              Why Choose Our Food Advisor?
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {[
                "Real-time food identification using advanced AI",
                "Personalized suggestions based on your profile",
                "Trained ML model with Open Food Facts data",
                "Explainable recommendations you can trust",
                "Allergy-aware alternative filtering",
                "Detailed calorie tracking for homemade food"
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Ready to Eat Healthier?
          </h2>
          <p className="text-xl text-muted-foreground">
            Start making better food choices today with AI-powered insights
          </p>
          <Link to="/analyze">
            <Button size="lg" className="text-lg px-8 py-6 shadow-[0_0_20px_rgba(142,71,45,0.3)] hover:shadow-[0_0_30px_rgba(142,71,45,0.5)] transition-all">
              <Camera className="mr-2 h-5 w-5" />
              Analyze Your Food Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
