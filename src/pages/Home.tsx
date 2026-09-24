import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Activity, ArrowRight, Brain, Camera, CheckCircle2, Heart, Mic, Sparkles } from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { AppleHealthCard } from "@/components/AppleHealthCard";
import { ScannedMealsJournal } from "@/components/ScannedMealsJournal";
import Header from "@/components/Header";

const features = [
  {
    icon: Camera,
    title: "Vision, quietly",
    body: "A photograph of the plate is enough. The scan names the dish and reads the nutrients without the usual dashboard noise.",
  },
  {
    icon: Mic,
    title: "A spoken table",
    body: "Tell it what you are about to eat. The reply comes back unhurried, with swaps that still taste like the meal you wanted.",
  },
  {
    icon: Activity,
    title: "Movement, counted",
    body: "Move, intake, and protein sit in three soft rings, calibrated to the burn your watch already recorded.",
  },
  {
    icon: Heart,
    title: "Shaped to you",
    body: "Suggestions follow the body you are growing toward, the way you eat, and the ingredients you cannot have.",
  },
  {
    icon: Brain,
    title: "Reasons, in the open",
    body: "Every score is a weighted sum. You can see which nutrient lifted the dish, and which one pulled it down.",
  },
  {
    icon: Sparkles,
    title: "Already enough",
    body: "When the plate in front of you is the best choice, the advisor says so instead of inventing a replacement.",
  },
];

const steps = [
  {
    n: "01",
    title: "Offer the meal",
    body: "Photograph the plate, or say it aloud. Either path begins the same reading.",
  },
  {
    n: "02",
    title: "Let it weigh",
    body: "Calories, protein, and the rest are scored against the body you described.",
  },
  {
    n: "03",
    title: "Choose the kinder plate",
    body: "One alternative is set apart. Allergies and diet stay outside the suggestion.",
  },
];

const Home = () => {
  const { profile, resetProfile } = useUserProfile();

  if (!profile.hasCompletedOnboarding) {
    return <OnboardingFlow />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <section className="container mx-auto px-4 py-16 md:py-28">
        <div className="grid items-center gap-16 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="animate-fade-up space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone bg-card px-4 py-2 text-xs uppercase tracking-widest text-sage">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
              Vision, voice, and a quieter kind of health
            </div>

            <h1 className="max-w-xl text-5xl leading-[1.05] text-foreground md:text-7xl lg:text-8xl">
              Make <span className="italic text-sage">smarter</span>
              <br />
              food choices
            </h1>

            <p className="max-w-lg text-lg leading-relaxed text-muted-foreground md:text-xl">
              Photograph a meal, or speak it. Healthier plates arrive already filtered for your table, your allergies, and the day your body has already spent.
            </p>

            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Link to="/analyze">
                <Button size="lg">
                  <Camera className="h-4 w-4" strokeWidth={1.5} />
                  Scan food
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </Button>
              </Link>
              <Link to="/analyze">
                <Button size="lg" variant="outline">
                  <Mic className="h-4 w-4" strokeWidth={1.5} />
                  Speak instead
                </Button>
              </Link>
            </div>

            <div className="inline-flex flex-wrap items-center gap-3 rounded-full border border-border bg-card/80 px-5 py-2 text-sm text-muted-foreground backdrop-blur-sm">
              <span>
                Table <span className="capitalize text-foreground">{profile.dietPreference}</span>
              </span>
              <span className="text-stone">·</span>
              <span>
                Aiming for <span className="capitalize text-foreground">{profile.targetBodyType}</span>
              </span>
              <button
                type="button"
                className="text-xs uppercase tracking-widest text-sage transition-colors duration-300 hover:text-terracotta"
                onClick={async () => {
                  await resetProfile();
                  window.location.reload();
                }}
              >
                Edit
              </button>
            </div>
          </div>

          <div className="relative mx-auto mb-10 w-full max-w-md animate-fade-up pb-8 lg:mt-8">
            <div className="aspect-[3/4] overflow-hidden rounded-t-[200px] bg-secondary shadow-elevated md:aspect-square">
              <svg viewBox="0 0 400 480" className="h-full w-full" aria-hidden="true">
                <rect width="400" height="480" fill="#E7DDD2" />
                <path
                  d="M70 360c40-120 70-180 130-210 50-24 90-10 130 30"
                  fill="none"
                  stroke="#8C9A84"
                  strokeWidth="1.5"
                />
                <path
                  d="M150 300c20-70 40-110 90-130"
                  fill="none"
                  stroke="#2D3A31"
                  strokeWidth="1"
                  opacity="0.45"
                />
                <ellipse cx="210" cy="250" rx="46" ry="78" fill="#8C9A84" opacity="0.35" transform="rotate(-18 210 250)" />
                <ellipse cx="248" cy="230" rx="28" ry="62" fill="#C27B66" opacity="0.28" transform="rotate(12 248 230)" />
                <path d="M200 330c8 40 8 70 0 110" fill="none" stroke="#2D3A31" strokeWidth="1.25" />
                <circle cx="92" cy="120" r="36" fill="none" stroke="#C27B66" strokeWidth="1" opacity="0.7" />
              </svg>
            </div>
            <Card className="absolute -bottom-8 left-6 right-6 bg-card/80 p-6 backdrop-blur-sm hover:translate-y-0">
              <p className="font-display text-xl italic leading-snug text-foreground">
                “A plate can be generous and still be kind to the day.”
              </p>
              <p className="mt-3 text-xs uppercase tracking-widest text-sage">From the garden notes</p>
            </Card>
          </div>
        </div>
      </section>

      <section className="container mx-auto space-y-10 px-4 py-16 md:py-24">
        <AppleHealthCard />
        <ScannedMealsJournal />
      </section>

      <section className="container mx-auto px-4 py-16 md:py-32">
        <div className="mb-16 max-w-2xl">
          <p className="text-xs uppercase tracking-widest text-sage">In the garden</p>
          <h2 className="mt-3 text-4xl md:text-6xl">
            Six quiet <span className="italic">instruments</span>
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3 md:gap-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className={index % 2 === 1 ? "md:translate-y-12" : undefined}>
                <Card className="h-full bg-card p-8">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sage/15">
                    <Icon className="h-5 w-5 text-sage" strokeWidth={1.5} />
                  </span>
                  <h3 className="mt-6 text-2xl">{feature.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">{feature.body}</p>
                </Card>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:py-32">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-4xl md:text-6xl">
            How the meal <span className="italic">unfolds</span>
          </h2>
          <div className="relative mt-16 grid gap-12 md:grid-cols-3">
            <svg
              className="pointer-events-none absolute left-[12%] right-[12%] top-6 hidden h-8 w-auto text-sage/50 md:block"
              viewBox="0 0 800 40"
              fill="none"
              aria-hidden="true"
            >
              <path d="M0 28 C 120 4, 200 36, 320 18 S 520 0, 640 22 800 8 800 8" stroke="currentColor" strokeWidth="1" />
            </svg>
            {steps.map((step) => (
              <div key={step.n} className="space-y-4">
                <span className="font-display text-5xl italic text-terracotta/80">{step.n}</span>
                <h3 className="text-2xl">{step.title}</h3>
                <p className="text-base leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:py-24">
        <Card className="mx-auto max-w-4xl bg-muted p-8 hover:translate-y-0 md:p-14">
          <h2 className="text-center text-3xl md:text-5xl">
            Why this table <span className="italic">stays</span>
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[
              "Food named from the photograph, not a guess you have to correct first",
              "Suggestions that know your diet, your goal, and what you cannot eat",
              "A score you can read, because the weights are written in the open",
              "Indian plates treated as the default, not an afterthought",
              "Allergens held back from every alternative",
              "Homemade meals counted by the ingredients you actually used",
            ].map((benefit) => (
              <div key={benefit} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sage" strokeWidth={1.5} />
                <span className="text-lg text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="mx-auto max-w-3xl space-y-8 text-center">
          <h2 className="text-4xl md:text-6xl">
            Ready to eat <span className="italic">kinder</span>?
          </h2>
          <p className="text-lg text-muted-foreground md:text-xl">
            Begin with the plate in front of you. The rest of the garden can wait.
          </p>
          <Link to="/analyze">
            <Button size="lg">
              <Camera className="h-4 w-4" strokeWidth={1.5} />
              Analyze your food
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
