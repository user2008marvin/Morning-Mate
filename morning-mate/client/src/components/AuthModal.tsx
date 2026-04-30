import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (isNewAccount: boolean) => void;
}

type View = "login" | "register" | "forgot" | "forgot-sent";

export function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
  const resetRequestMutation = trpc.auth.requestPasswordReset.useMutation();

  // Clear form every time the modal opens so browser autofill doesn't leak a deleted account's email
  useEffect(() => {
    if (open) {
      setEmail("");
      setPassword("");
      setName("");
      setForgotEmail("");
      setError("");
      setView("login");
    }
  }, [open]);

  const clearForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setForgotEmail("");
    setError("");
  };

  const switchView = (v: View) => {
    setView(v);
    setError("");
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetRequestMutation.mutateAsync({ email: forgotEmail });
      setView("forgot-sent");
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (view === "login") {
        await loginMutation.mutateAsync({ email, password });
        toast.success("Welcome! 🌟");
        await utils.auth.me.invalidate();
        clearForm();
        onOpenChange(false);
        onSuccess?.(false); // existing account — keep local state
      } else if (view === "register") {
        if (!name.trim()) {
          setError("Please enter your name");
          return;
        }
        await registerMutation.mutateAsync({ email, password, name });
        toast.success("Account created! Welcome to GlowJo! 🎉");
        await utils.auth.me.invalidate();
        clearForm();
        onOpenChange(false);
        onSuccess?.(true); // new account — wipe stale local state
      }
    } catch (err: any) {
      const msg = err?.message || "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const headerText = {
    login: { emoji: "🌟", title: "Welcome!", sub: "Sign in to your parent account" },
    register: { emoji: "🎉", title: "Join GlowJo!", sub: "Create your parent account" },
    forgot: { emoji: "🔑", title: "Forgot Password?", sub: "We'll email you a reset link" },
    "forgot-sent": { emoji: "📬", title: "Check Your Email!", sub: "A reset link is on its way" },
  }[view];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!loading) { onOpenChange(o); clearForm(); setView("login"); } }}>
      <DialogContent className="p-0 gap-0 border-0 bg-transparent shadow-none max-w-sm w-full">
        <div className="rounded-3xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div
            className="px-8 pt-10 pb-6 text-center"
            style={{ background: "linear-gradient(135deg, #ff9a3c 0%, #ff6b35 100%)" }}
          >
            <div className="text-5xl mb-2">{headerText.emoji}</div>
            <DialogTitle className="text-2xl font-black text-white tracking-tight">
              {headerText.title}
            </DialogTitle>
            <p className="text-white/80 text-sm mt-1 font-medium">{headerText.sub}</p>
          </div>

          {/* Tab switcher — only for login/register */}
          {(view === "login" || view === "register") && (
            <div className="flex bg-[#fff8f0] border-b border-orange-100">
              <button
                type="button"
                onClick={() => switchView("login")}
                className={`flex-1 py-3 text-sm font-bold transition-all ${
                  view === "login"
                    ? "text-[#ff6b35] border-b-2 border-[#ff6b35]"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchView("register")}
                className={`flex-1 py-3 text-sm font-bold transition-all ${
                  view === "register"
                    ? "text-[#ff6b35] border-b-2 border-[#ff6b35]"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Form body */}
          <div className="bg-white px-8 py-6">

            {/* ── Login / Register ── */}
            {(view === "login" || view === "register") && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {view === "register" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sarah"
                      required
                      autoComplete="name"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#ff9a3c] outline-none text-sm font-medium text-gray-800 transition-colors bg-gray-50 focus:bg-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="parent@example.com"
                    required
                    autoComplete="off"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#ff9a3c] outline-none text-sm font-medium text-gray-800 transition-colors bg-gray-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Password {view === "register" && <span className="text-gray-400 normal-case font-normal">(min 6 chars)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete={view === "login" ? "current-password" : "new-password"}
                      className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-100 focus:border-[#ff9a3c] outline-none text-sm font-medium text-gray-800 transition-colors bg-gray-50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-black text-white text-base tracking-tight transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                  style={{ background: loading ? "#ccc" : "linear-gradient(135deg, #ff9a3c 0%, #ff6b35 100%)" }}
                >
                  {loading ? "Please wait..." : view === "login" ? "Sign In →" : "Create Account →"}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => switchView("forgot")}
                    className="text-sm text-[#ff6b35] font-semibold hover:underline"
                  >
                    Forgot your password?
                  </button>
                </div>

                <p className="text-center text-xs text-gray-400">
                  {view === "login" ? (
                    <>No account yet?{" "}
                      <button type="button" onClick={() => switchView("register")} className="text-[#ff6b35] font-bold hover:underline">
                        Create one free
                      </button>
                    </>
                  ) : (
                    <>Already have an account?{" "}
                      <button type="button" onClick={() => switchView("login")} className="text-[#ff6b35] font-bold hover:underline">
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              </form>
            )}

            {/* ── Forgot password — email entry ── */}
            {view === "forgot" && (
              <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                <p className="text-sm text-gray-500 text-center">
                  Enter the email address on your account and we'll send a reset link.
                </p>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="parent@example.com"
                    required
                    autoFocus
                    autoComplete="email"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#ff9a3c] outline-none text-sm font-medium text-gray-800 transition-colors bg-gray-50 focus:bg-white"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-black text-white text-base tracking-tight transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                  style={{ background: loading ? "#ccc" : "linear-gradient(135deg, #ff9a3c 0%, #ff6b35 100%)" }}
                >
                  {loading ? "Sending..." : "Send Reset Link →"}
                </button>

                <p className="text-center text-xs text-gray-400">
                  Remember it?{" "}
                  <button type="button" onClick={() => switchView("login")} className="text-[#ff6b35] font-bold hover:underline">
                    Back to sign in
                  </button>
                </p>
              </form>
            )}

            {/* ── Forgot password — sent confirmation ── */}
            {view === "forgot-sent" && (
              <div className="flex flex-col gap-4 text-center">
                <p className="text-sm text-gray-600 leading-relaxed">
                  If <strong>{forgotEmail}</strong> matches an account, you'll receive a reset link shortly.
                </p>
                <p className="text-xs text-gray-400">
                  Check your spam folder if it doesn't appear within a minute.
                </p>
                <button
                  type="button"
                  onClick={() => switchView("login")}
                  className="w-full py-3.5 rounded-xl font-black text-white text-base tracking-tight active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #ff9a3c 0%, #ff6b35 100%)" }}
                >
                  Back to Sign In
                </button>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="bg-[#fff8f0] px-8 py-4 text-center">
            <p className="text-[10px] text-gray-400">
              🔒 Your data is secure. For parents only — children use the app via PIN.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
