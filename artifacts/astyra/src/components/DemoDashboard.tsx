import { motion } from "framer-motion";
import { Check, Sparkles, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DemoDashboardProps {
  look: string;
  occasion: string;
  onSelectFreemium: () => void;
  onSelectPaid: () => void;
}

const freemiumFeatures = [
  "5 makeup simulations per month",
  "3 occasions to choose from",
  "Standard image quality",
  "Basic makeup recipes",
];

const paidFeatures = [
  "Unlimited makeup simulations",
  "All 6 occasions unlocked",
  "High-resolution output",
  "Full makeup recipes & tips",
  "Priority processing",
  "New looks added weekly",
];

export function DemoDashboard({ look, occasion, onSelectFreemium, onSelectPaid }: DemoDashboardProps) {
  return (
    <motion.div
      key="demo-dashboard"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto space-y-12 pt-4"
    >
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
          <Lock size={14} />
          Demo Complete
        </div>
        <h2 className="text-3xl md:text-4xl font-serif text-foreground">
          Love your new <span className="text-primary italic">{look}</span> look?
        </h2>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto">
          Your free demo is done. Choose a plan to keep discovering your perfect looks — unlimited times.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Freemium */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-3xl p-7 border border-card-border shadow-md flex flex-col"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-primary">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-lg font-serif font-semibold">Freemium</h3>
              <p className="text-xs text-muted-foreground">Free forever</p>
            </div>
          </div>

          <div className="mb-5">
            <span className="text-4xl font-serif font-bold">$0</span>
            <span className="text-muted-foreground text-sm ml-2">/ month</span>
          </div>

          <ul className="space-y-2.5 mb-7 flex-1">
            {freemiumFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                <Check size={14} className="text-primary mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <Button
            variant="outline"
            className="w-full border-primary/40 text-primary hover:bg-primary/5"
            onClick={onSelectFreemium}
          >
            Start for Free
          </Button>
        </motion.div>

        {/* Paid */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-primary rounded-3xl p-7 border border-primary shadow-xl shadow-primary/20 flex flex-col relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                <Crown size={18} />
              </div>
              <div>
                <h3 className="text-lg font-serif font-semibold text-white">Full Access</h3>
                <p className="text-xs text-white/70">Unlock everything</p>
              </div>
            </div>

            <div className="mb-5">
              <span className="text-4xl font-serif font-bold text-white">$12</span>
              <span className="text-white/70 text-sm ml-2">/ month</span>
            </div>

            <ul className="space-y-2.5 mb-7 flex-1">
              {paidFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white">
                  <Check size={14} className="text-white/80 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              className="w-full bg-white text-primary hover:bg-white/90 font-semibold"
              onClick={onSelectPaid}
            >
              Get Full Access
            </Button>
          </div>
        </motion.div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button className="text-primary font-semibold hover:underline" onClick={onSelectFreemium}>
          Sign in
        </button>
      </p>
    </motion.div>
  );
}
