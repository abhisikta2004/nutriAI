import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useAppleHealth } from "@/contexts/AppleHealthContext";
import { AppleHealthModal } from "@/components/AppleHealthModal";
import { Button } from "@/components/ui/button";
import { Leaf, LogIn, LogOut, Menu, User, X } from "lucide-react";

const Header = () => {
  const { session, profile, resetProfile, loading } = useUserProfile();
  const { syncState, lastSyncedText } = useAppleHealth();
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await resetProfile();
    setMenuOpen(false);
  };

  const activeBurn = syncState.activity.activeEnergyBurned || 0;

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const healthPill = (
    <button
      onClick={() => {
        setShowHealthModal(true);
        setMenuOpen(false);
      }}
      className="inline-flex items-center gap-2 rounded-full border border-stone bg-card px-3 py-1.5 text-xs text-foreground shadow-soft transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-card"
      title="Open Apple Health Sync Center"
    >
      <span className="font-display text-sm italic text-terracotta">Move</span>
      <span className="font-medium">{activeBurn} kcal</span>
      <span className="rounded-full bg-sage/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-health-good">
        {lastSyncedText}
      </span>
    </button>
  );

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:h-20">
          <Link to="/" className="group flex items-center gap-3" onClick={() => setMenuOpen(false)}>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage/15 transition-transform duration-500 ease-out group-hover:scale-105">
              <Leaf className="h-4 w-4 text-sage" strokeWidth={1.5} />
            </span>
            <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Nutri<span className="italic text-sage">AI</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-3 md:flex">
            {healthPill}
            {loading ? (
              <div className="h-11 w-28 animate-pulse rounded-full bg-muted" />
            ) : session?.user ? (
              <>
                <div className="flex max-w-[220px] items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
                  <User className="h-3.5 w-3.5 shrink-0 text-sage" strokeWidth={1.5} />
                  <span className="truncate text-xs text-foreground">{session.user.email}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5 text-muted-foreground hover:text-terracotta">
                  <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <span className="rounded-full border border-clay bg-secondary px-3 py-1 text-[10px] uppercase tracking-widest text-foreground">
                  Guest
                </span>
                <Link to="/auth">
                  <Button size="sm" className="gap-1.5">
                    <LogIn className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </nav>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors duration-300 hover:bg-muted md:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-30 flex flex-col bg-background px-6 pb-10 pt-24 md:hidden">
          <p className="font-display text-4xl italic text-foreground">The garden</p>
          <p className="mt-2 max-w-xs text-lg capitalize text-muted-foreground">
            {profile.dietPreference} table, aiming for {profile.targetBodyType}.
          </p>
          <div className="mt-8">{healthPill}</div>
          <div className="mt-auto flex flex-col gap-3">
            <Link to="/analyze" onClick={() => setMenuOpen(false)}>
              <Button className="w-full">Scan a meal</Button>
            </Link>
            {session?.user ? (
              <Button variant="outline" className="w-full" onClick={handleSignOut}>
                Sign Out
              </Button>
            ) : (
              <Link to="/auth" onClick={() => setMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      <AppleHealthModal open={showHealthModal} onOpenChange={setShowHealthModal} />
    </>
  );
};

export default Header;
