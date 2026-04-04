import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";


const REWARDS = [
  "🍦 Ice Cream Friday",
  "🎮 Extra Screen Time",
  "🎬 Movie Night",
  "🏆 Special Outing",
  "📚 New Book",
  "🎨 Art Supplies",
];

const TASKS = [
  { id: "wake", emoji: "☀️", label: "Wake Up" },
  { id: "shower", emoji: "🛁", label: "Shower" },
  { id: "breakfast", emoji: "🥛", label: "Breakfast" },
  { id: "teeth", emoji: "🪥", label: "Brush Teeth" },
  { id: "dress", emoji: "👕", label: "Get Dressed" },
  { id: "bag", emoji: "🎒", label: "Pack Bag" },
];

export default function Onboarding() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [childName, setChildName] = useState("");
  const [age, setAge] = useState(7);
  const [schoolTime, setSchoolTime] = useState("08:30");
  const [selectedReward, setSelectedReward] = useState(REWARDS[0]);
  const [selectedTasks, setSelectedTasks] = useState(["wake", "breakfast", "teeth", "dress", "bag"]);
  const [pin, setPin] = useState("1234");
  const [language, setLanguage] = useState<"en" | "es">("en");

  const createChildMutation = trpc.app.createChild.useMutation({
    onSuccess: () => {
      toast.success("Profile created! Starting your morning routine...");
      navigate("/app");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create profile");
    },
  });

  const handleNext = () => {
    if (step === 1) {
      if (!childName.trim()) {
        toast.error("Please enter your child's name");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    } else if (step === 5) {
      createChildMutation.mutate({
        name: childName,
        age,
        schoolTime,
        reward: selectedReward,
        language,
        enabledTasks: TASKS.map((t) => selectedTasks.includes(t.id)),
      });
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #4facfe 0%, #ff9a3c 60%, #ff6b35 100%)",
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <Card style={{ maxWidth: 500, width: "100%", padding: 32 }}>
        {/* Step 1: Child Name */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: "#2d1a00", marginBottom: 8 }}>
                Welcome to GlowJo!
              </h1>
              <p style={{ fontSize: 16, color: "#6b3a00" }}>
                Let's set up your child's morning routine.
              </p>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#2d1a00" }}>
                What's your child's name?
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="e.g., Emma"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "2px solid #ff5f1f",
                  fontSize: 16,
                  fontFamily: "inherit",
                }}
                autoFocus
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#2d1a00" }}>
                Age
              </label>
              <select
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value))}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "2px solid #ff5f1f",
                  fontSize: 16,
                  fontFamily: "inherit",
                }}
              >
                {Array.from({ length: 10 }, (_, i) => i + 4).map((a) => (
                  <option key={a} value={a}>{a} years old</option>
                ))}
              </select>
            </div>
            <Button onClick={handleNext} style={{ width: "100%", padding: "12px 24px", fontSize: 16 }}>
              Next
            </Button>
          </div>
        )}

        {/* Step 2: School Time & Reward */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⏰</div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: "#2d1a00", marginBottom: 8 }}>
                School Time & Reward
              </h2>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#2d1a00" }}>
                School start time
              </label>
              <input
                type="time"
                value={schoolTime}
                onChange={(e) => setSchoolTime(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "2px solid #ff5f1f",
                  fontSize: 16,
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#2d1a00" }}>
                Weekly reward
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {REWARDS.map((reward) => (
                  <button
                    key={reward}
                    onClick={() => setSelectedReward(reward)}
                    style={{
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: selectedReward === reward ? "3px solid #ff5f1f" : "2px solid #ddd",
                      background: selectedReward === reward ? "#fff3e0" : "white",
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 700,
                      transition: "all 0.2s",
                    }}
                  >
                    {reward}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Button onClick={() => setStep(1)} variant="outline" style={{ flex: 1 }}>
                Back
              </Button>
              <Button onClick={handleNext} style={{ flex: 1 }}>
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Select Tasks */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: "#2d1a00", marginBottom: 8 }}>
                Morning Tasks
              </h2>
              <p style={{ fontSize: 14, color: "#6b3a00" }}>Select which tasks {childName} needs to complete</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {TASKS.map((task) => (
                <button
                  key={task.id}
                  onClick={() => {
                    setSelectedTasks((prev) =>
                      prev.includes(task.id) ? prev.filter((t) => t !== task.id) : [...prev, task.id]
                    );
                  }}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: selectedTasks.includes(task.id) ? "3px solid #ff5f1f" : "2px solid #ddd",
                    background: selectedTasks.includes(task.id) ? "#fff3e0" : "white",
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 700,
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    transition: "all 0.2s",
                  }}
                >
                  <span style={{ fontSize: 24 }}>{task.emoji}</span>
                  <span>{task.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 20 }}>
                    {selectedTasks.includes(task.id) ? "✓" : ""}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Button onClick={() => setStep(2)} variant="outline" style={{ flex: 1 }}>
                Back
              </Button>
              <Button onClick={handleNext} style={{ flex: 1 }}>
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Language */}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🌍</div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: "#2d1a00", marginBottom: 8 }}>
                Choose Language
              </h2>
              <p style={{ fontSize: 14, color: "#6b3a00" }}>
                What language should Sunny speak?
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                onClick={() => setLanguage("en")}
                style={{
                  padding: "16px 20px", borderRadius: 14,
                  border: language === "en" ? "3px solid #ff5f1f" : "2px solid #ddd",
                  background: language === "en" ? "#fff3e0" : "white",
                  cursor: "pointer", fontSize: 16, fontWeight: 700,
                  textAlign: "left", display: "flex", alignItems: "center", gap: 14,
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: 28 }}>🇬🇧</span>
                <div>
                  <div>English</div>
                  <div style={{ fontSize: 12, fontWeight: 400, color: "#888", marginTop: 2 }}>Free — included with all plans</div>
                </div>
                {language === "en" && <span style={{ marginLeft: "auto", color: "#ff5f1f", fontSize: 20 }}>✓</span>}
              </button>
              <button
                onClick={() => {
                  setLanguage("es");
                  toast("🌍 Spanish unlocks with the GlowJo plan! You can still set it now and upgrade later.", { duration: 4000 });
                }}
                style={{
                  padding: "16px 20px", borderRadius: 14,
                  border: language === "es" ? "3px solid #ff5f1f" : "2px solid #ddd",
                  background: language === "es" ? "#fff3e0" : "white",
                  cursor: "pointer", fontSize: 16, fontWeight: 700,
                  textAlign: "left", display: "flex", alignItems: "center", gap: 14,
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: 28 }}>🇪🇸</span>
                <div>
                  <div>Español</div>
                  <div style={{ fontSize: 12, fontWeight: 400, color: "#888", marginTop: 2 }}>GlowJo plan — $4.99/mo</div>
                </div>
                <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 800, padding: "3px 8px", borderRadius: 8, background: "#ff5f1f", color: "white" }}>PRO</span>
                {language === "es" && <span style={{ color: "#ff5f1f", fontSize: 20 }}>✓</span>}
              </button>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Button onClick={() => setStep(3)} variant="outline" style={{ flex: 1 }}>Back</Button>
              <Button onClick={handleNext} style={{ flex: 1 }}>Next</Button>
            </div>
          </div>
        )}

        {/* Step 5: Parent PIN */}
        {step === 5 && (  
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: "#2d1a00", marginBottom: 8 }}>
                Parent PIN
              </h2>
              <p style={{ fontSize: 14, color: "#6b3a00" }}>
                Set a 4-digit PIN to protect parent settings
              </p>
            </div>
            <div>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.slice(0, 4))}
                placeholder="0000"
                maxLength={4}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "2px solid #ff5f1f",
                  fontSize: 32,
                  fontFamily: "monospace",
                  textAlign: "center",
                  letterSpacing: 8,
                }}
                autoFocus
              />
            </div>
            <div style={{ background: "#fff3e0", padding: 12, borderRadius: 12, fontSize: 13, color: "#6b3a00" }}>
              <strong>💡 Tip:</strong> Use a PIN only you know. You'll need it to access parent settings.
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Button onClick={() => setStep(4)} variant="outline" style={{ flex: 1 }}>
                Back
              </Button>
              <Button
                onClick={handleNext}
                style={{ flex: 1 }}
                disabled={pin.length !== 4 || createChildMutation.isPending}
              >
                {createChildMutation.isPending ? "Creating..." : "Start GlowJo!"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <p style={{ marginTop: 24, fontSize: 12, color: "rgba(255,255,255,0.7)", textAlign: "center" }}>
        🔒 COPPA Compliant • No ads • No tracking
      </p>
    </div>
  );
}
