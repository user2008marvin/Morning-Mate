import { useState } from "react";
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
  onSuccess?: () => void;
}

type View = "login" | "register" | "forgot" | "forgot-sent";

export function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation();

  const clearForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setError("");
  };

  const switchView = (v: View) => {
    setView(v);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (view === "login") {
        await loginMutation.mutateAsync({ email, password });
        toast.success("Welcome back! 🌟");
        await utils.auth.me.invalidate();
        clearForm();
        onOpenChange(false);
        onSuccess?.();
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
        onSuccess?.();
      } else if (view === "forgot") {
        await requestResetMutation.mutateAsync({ email });
        switchView("forgot-sent");
      }
    } catch (err: any) {
      const msg = err?.message || "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const headerText = {
    login: { emoji: "🌟", title: "Welcome Back!", sub: "Sign in to your parent account" },
    register: { emoji: "🎉", title: "Join GlowJo!", sub: "Create your parent account" },
    forgot: { emoji: "🔑", title: "Forgot Password?", sub: "We'll email you a reset link" },
    "forgot-sent": { emoji: "📬", title: "Check Your Inbox!", sub: "A reset link is on its way" },
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
            {view === "forgot-sent" ? (
              <div className="text-center py-4">
                <p className="text-gray-700 text-sm leading-relaxed mb-4">
                  If <strong>{email}</strong> has a GlowJo account, a password reset link has been sent.
                  <br /><br />
                  Check your inbox (and spam folder) — the link expires in <strong>1 hour</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => { switchView("login"); clearForm(); }}
                  className="w-full py-3.5 rounded-xl font-black text-white text-base tracking-tight active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #ff9a3c 0%, #ff6b35 100%)" }}
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
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
                    autoComplete="email"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#ff9a3c] outline-none text-sm font-medium text-gray-800 transition-colors bg-gray-50 focus:bg-white"
                  />
                </div>

                {(view === "login" || view === "register") && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Password {view === "register" && <span className="text-gray-400 normal-case font-normal">(min 6 chars)</span>}
                      </label>
                      {view === "login" && (
                        <button
                          type="button"
                          onClick={() => switchView("forgot")}
                          className="text-xs text-[#ff6b35] font-semibold hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete={view === "login" ? "current-password" : "new-password"}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#ff9a3c] outline-none text-sm font-medium text-gray-800 transition-colors bg-gray-50 focus:bg-white"
                    />
                  </div>
                )}

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
                  {loading
                    ? "Please wait..."
                    : view === "login"
                    ? "Sign In →"
                    : view === "register"
                    ? "Create Account →"
                    : "Send Reset Link →"}
                </button>

                <p className="text-center text-xs text-gray-400">
                  {view === "forgot" ? (
                    <>
                      Remember it?{" "}
                      <button type="button" onClick={() => switchView("login")} className="text-[#ff6b35] font-bold hover:underline">
                        Back to sign in
                      </button>
                    </>
                  ) : view === "login" ? (
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
