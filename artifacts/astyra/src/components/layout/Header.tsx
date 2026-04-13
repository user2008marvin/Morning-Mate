import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const [clicks, setClicks] = useState(0);
  const [, setLocation] = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "register">("signin");
  const { user, logout } = useAuth();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const newClicks = clicks + 1;
    setClicks(newClicks);

    if (newClicks >= 5) {
      setClicks(0);
      setLocation("/admin");
    }

    setTimeout(() => {
      setClicks((prev) => Math.max(0, prev - 1));
    }, 2000);
  };

  const handleSignClick = () => {
    setAuthMode("signin");
    setAuthOpen(true);
  };

  const handleAuthSuccess = () => {
    setTimeout(() => {
      const el = document.getElementById("pricing");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 glass-panel border-b border-white/40 h-20 flex items-center justify-between px-6 transition-all duration-300">
        <Link href="/" className="inline-block" onClick={handleLogoClick}>
          <img
            src={`${import.meta.env.BASE_URL}images/logo.png`}
            alt="Morning Mate"
            className="h-8 md:h-10 object-contain hover:opacity-80 transition-opacity"
          />
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                <User size={14} />
                <span className="hidden sm:inline">{user.name}</span>
                {user.plan && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold capitalize">
                    {user.plan === "paid" ? "Full Access" : "Freemium"}
                  </span>
                )}
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignClick}
              className="rounded-full border-primary/30 text-primary hover:bg-primary/5 font-semibold px-5"
            >
              Sign In
            </Button>
          )}
        </div>
      </header>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authMode}
      />
    </>
  );
}
