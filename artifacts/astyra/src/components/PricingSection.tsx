import { motion } from "framer-motion";
import { Check, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PricingSectionProps {
  onSelectFreemium: () => void;
  onSelectPaid: () => void;
  sectionRef?: React.RefObject<HTMLDivElement>;
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

export function PricingSection({ onSelectFreemium, onSelectPaid, sectionRef }: PricingSectionProps) {
  return (
    <section
      id="pricing"
      ref={sectionRef}
      className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-14 space-y-4"
      >
        <div className="inline-block px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold tracking-wide uppercase">
          Choose Your Plan
        </div>
        <h2 className="text-4xl md:text-5xl font-serif text-foreground">
          Your look, <span className="text-primary italic">your terms.</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Start free or go all-in. Either way, your best look is waiting.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Freemium */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card rounded-3xl p-8 border border-card-border shadow-md flex flex-col h-full"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-primary">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-semibold">Freemium</h3>
              <p className="text-sm text-muted-foreground">Get started for free</p>
            </div>
          </div>

          <div className="mb-6">
            <span className="text-5xl font-serif font-bold text-foreground">$0</span>
            <span className="text-muted-foreground ml-2 text-sm">/ month</span>
          </div>

          <ul className="space-y-3 mb-8 flex-1">
            {freemiumFeatures.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                <Check size={16} className="text-primary mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <Button
            variant="outline"
            size="lg"
            className="w-full border-primary/40 text-primary hover:bg-primary/5"
            onClick={onSelectFreemium}
          >
            Get Started Free
          </Button>
        </motion.div>

        {/* Paid */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-primary rounded-3xl p-8 border border-primary shadow-xl shadow-primary/20 flex flex-col h-full relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-bl-full -z-0" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                <Crown size={20} />
              </div>
              <div>
                <h3 className="text-xl font-serif font-semibold text-white">Full Access</h3>
                <p className="text-sm text-white/70">Unlock everything</p>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-5xl font-serif font-bold text-white">$12</span>
              <span className="text-white/70 ml-2 text-sm">/ month</span>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {paidFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-white">
                  <Check size={16} className="text-white/80 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              className="w-full bg-white text-primary hover:bg-white/90 font-semibold"
              onClick={onSelectPaid}
            >
              Get Full Access
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
