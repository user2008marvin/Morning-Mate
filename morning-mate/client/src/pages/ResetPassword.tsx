import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const utils = trpc.useUtils();
  const resetMutation = trpc.auth.resetPassword.useMutation();

  useEffect(() => {
    if (!token) navigate("/");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await resetMutation.mutateAsync({ token, password });
      await utils.auth.me.invalidate();
      setDone(true);
      toast.success("Password updated! You're now signed in. 🌟");
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #fff8ee 0%, #ffe8cc 100%)" }}
    >
      <div className="w-full max-w-sm">
        <div className="rounded-3xl overflow-hidden shadow-2xl bg-white">
          {/* Header */}
          <div
            className="px-8 pt-10 pb-6 text-center"
            style={{ background: "linear-gradient(135deg, #ff9a3c 0%, #ff6b35 100%)" }}
          >
            <div className="text-5xl mb-2">{done ? "🎉" : "🔐"}</div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {done ? "All Done!" : "Set New Password"}
            </h1>
            <p className="text-white/80 text-sm mt-1 font-medium">
              {done ? "Your password has been updated" : "Choose a strong password"}
            </p>
          </div>

          <div className="px-8 py-7">
            {done ? (
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-6">
                  You're signed in and ready to go!
                </p>
                <button
                  onClick={() => navigate("/app")}
                  className="w-full py-3.5 rounded-xl font-black text-white text-base tracking-tight active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #ff9a3c 0%, #ff6b35 100%)" }}
                >
                  Open GlowJo ☀️
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#ff9a3c] outline-none text-sm font-medium text-gray-800 transition-colors bg-gray-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Same password again"
                    required
                    autoComplete="new-password"
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
                  {loading ? "Updating..." : "Set New Password →"}
                </button>

                <p className="text-center text-xs text-gray-400">
                  Remember your password?{" "}
                  <a href="/" className="text-[#ff6b35] font-bold hover:underline">
                    Go home
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
