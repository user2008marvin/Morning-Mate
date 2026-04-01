import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function EmailCapture() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    setIsLoading(true);
    try {
      // Send email to backend for storage/newsletter signup
      const response = await fetch("/api/email-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast.success("Thanks for signing up! Check your email for updates.");
        setEmail("");
      } else {
        toast.error("Failed to sign up. Please try again.");
      }
    } catch (error) {
      toast.error("Error signing up. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        style={{
          flex: 1,
          minWidth: 200,
          padding: "12px 16px",
          borderRadius: 40,
          border: "2px solid #ff5f1f",
          fontSize: 14,
          fontFamily: "inherit",
        }}
        disabled={isLoading}
      />
      <Button
        type="submit"
        disabled={isLoading}
        style={{
          padding: "12px 32px",
          borderRadius: 40,
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        {isLoading ? "Signing up..." : "Get Updates"}
      </Button>
    </form>
  );
}
