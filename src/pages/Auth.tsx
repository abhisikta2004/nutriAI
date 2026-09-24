import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Lock, ArrowLeft, Loader2, Sparkles } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Registration successful! You can now log in or check your email for confirmation.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute -left-16 top-16 h-64 w-40 rounded-t-[200px] bg-secondary" />
      <div className="pointer-events-none absolute -right-10 bottom-10 h-48 w-48 rounded-full bg-sage/15" />

      <div className="absolute left-6 top-8 md:left-8">
        <Link to="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            Back home
          </Button>
        </Link>
      </div>

      <Card className="relative w-full max-w-md space-y-6 bg-card/90 p-8 backdrop-blur-sm md:p-10">
        <div className="space-y-3 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-sage/15 px-3 py-1 text-xs uppercase tracking-widest text-sage">
            <Sparkles className="h-3 w-3" strokeWidth={1.5} />
            <span>Cloud sync</span>
          </div>
          <h2 className="text-4xl">
            {isSignUp ? (
              <>
                Create an <span className="italic">account</span>
              </>
            ) : (
              <>
                Welcome <span className="italic">back</span>
              </>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isSignUp
              ? "Sign up to save your body profile, preferences, and logs"
              : "Log in to access your synced preferences and food history"}
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="grid grid-cols-2 rounded-full border border-border bg-muted p-1">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`rounded-full py-2 text-xs uppercase tracking-widest transition-all duration-300 ${
              !isSignUp
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`rounded-full py-2 text-xs uppercase tracking-widest transition-all duration-300 ${
              isSignUp
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                disabled={loading}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isSignUp ? "Creating account..." : "Signing in..."}
              </span>
            ) : isSignUp ? (
              "Sign Up"
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground border-t border-border/20 pt-4">
          By continuing, you agree to store your nutritional profile details securely in NutriAI database.
        </div>
      </Card>
    </div>
  );
};

export default Auth;
