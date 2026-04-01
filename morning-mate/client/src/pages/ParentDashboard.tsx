import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function ParentDashboard() {
  const [pinInput, setPinInput] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [pin, setPin] = useState("1234");

  const { data: children, isLoading } = trpc.app.getChildren.useQuery();
  const updateChildMutation = trpc.app.updateChild.useMutation({
    onSuccess: () => {
      toast.success("Settings saved!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save settings");
    },
  });

  const handleUnlock = () => {
    if (pinInput === pin) {
      setIsUnlocked(true);
      setPinInput("");
      toast.success("Parent dashboard unlocked");
    } else {
      toast.error("Incorrect PIN");
      setPinInput("");
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!isUnlocked) {
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
        <Card style={{ maxWidth: 400, width: "100%", padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#2d1a00", marginBottom: 24 }}>
            Parent Dashboard
          </h1>
          <p style={{ fontSize: 14, color: "#6b3a00", marginBottom: 24 }}>
            Enter your PIN to access settings and progress tracking.
          </p>
          <input
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.slice(0, 4))}
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
              marginBottom: 24,
            }}
            autoFocus
          />
          <Button
            onClick={handleUnlock}
            style={{ width: "100%", padding: "12px 24px", fontSize: 16 }}
            disabled={pinInput.length !== 4}
          >
            Unlock
          </Button>
        </Card>
      </div>
    );
  }

  const selectedChild = children?.find((c) => c.id === selectedChildId) || children?.[0];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f5f5",
      padding: "24px",
    }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#2d1a00" }}>
            👨‍👩‍👧 Parent Dashboard
          </h1>
          <Button
            onClick={() => setIsUnlocked(false)}
            variant="outline"
          >
            Lock
          </Button>
        </div>

        {/* Child Selection */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginBottom: 32 }}>
          {children?.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              style={{
                padding: "16px 12px",
                borderRadius: 12,
                border: selectedChild?.id === child.id ? "3px solid #ff5f1f" : "2px solid #ddd",
                background: selectedChild?.id === child.id ? "#fff3e0" : "white",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>👧</div>
              <div>{child.name}</div>
              <div style={{ fontSize: 12, color: "#999" }}>{child.age} yrs</div>
            </button>
          ))}
        </div>

        {selectedChild && (
          <>
            {/* Progress Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
              <Card style={{ padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>Current Streak</div>
                <div style={{ fontSize: 48, fontWeight: 900, color: "#ff5f1f" }}>
                  {selectedChild.streak || 0}
                </div>
                <div style={{ fontSize: 12, color: "#999" }}>days 🔥</div>
              </Card>
              <Card style={{ padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>Total Stars</div>
                <div style={{ fontSize: 48, fontWeight: 900, color: "#ffd700" }}>
                  {selectedChild.stars || 0}
                </div>
                <div style={{ fontSize: 12, color: "#999" }}>earned ⭐</div>
              </Card>
              <Card style={{ padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>Tier</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#4facfe", marginBottom: 8 }}>
                  Premium
                </div>
                <div style={{ fontSize: 12, color: "#999" }}>Plus Member</div>
              </Card>
            </div>

            {/* Settings */}
            <Card style={{ padding: 24, marginBottom: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#2d1a00", marginBottom: 20 }}>
                Settings
              </h2>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#2d1a00" }}>
                    Child Name
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedChild.name}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "2px solid #ddd",
                      fontSize: 16,
                      fontFamily: "inherit",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#2d1a00" }}>
                    School Start Time
                  </label>
                  <input
                    type="time"
                    defaultValue={selectedChild.schoolTime || "08:30"}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "2px solid #ddd",
                      fontSize: 16,
                      fontFamily: "inherit",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#2d1a00" }}>
                    Weekly Reward
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedChild.reward || "Ice Cream Friday"}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "2px solid #ddd",
                      fontSize: 16,
                      fontFamily: "inherit",
                    }}
                  />
                </div>
                <Button
                  onClick={() => {
                    if (selectedChild) {
                      updateChildMutation.mutate({
                        childId: selectedChild.id,
                        name: (document.querySelector('input[value="' + selectedChild.name + '"]') as HTMLInputElement)?.value || selectedChild.name,
                      });
                    }
                  }}
                  style={{ width: "100%", padding: "12px 24px", fontSize: 16 }}
                  disabled={updateChildMutation.isPending}
                >
                  {updateChildMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </Card>

            {/* Weekly Progress Calendar */}
            <Card style={{ padding: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#2d1a00", marginBottom: 20 }}>
                📅 This Week's Progress
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                  <div key={day} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#999", marginBottom: 8 }}>
                      {day}
                    </div>
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "1",
                        borderRadius: 12,
                        background: i < 5 ? "#4facfe" : "#ddd",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24,
                      }}
                    >
                      {i < 5 ? "✅" : ""}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
