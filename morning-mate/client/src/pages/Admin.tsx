/**
 * GlowJo — Admin Analytics Dashboard
 * Accessible at /admin. Only visible/usable by users with role "admin".
 * Shows sign-ups and pageviews in the last 24h / 48h / 7d without needing to ask anyone.
 */
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 14,
        padding: "20px 18px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        flex: 1,
        minWidth: 140,
      }}
    >
      <div style={{ fontSize: 13, color: "#888", fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: "#1a1a2e" }}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a2e", marginBottom: 12 }}>{title}</div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>{children}</div>
    </div>
  );
}

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const { data, isLoading, error, refetch, isFetching } = trpc.analytics.getSummary.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  if (authLoading) {
    return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Loading…</div>;
  }

  if (!user || user.role !== "admin") {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>
        <h2>Admin only</h2>
        <p>You need to be signed in with an admin account to view this page.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7fb", padding: "32px 24px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a1a2e", margin: 0 }}>GlowJo Analytics</h1>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            style={{
              background: "#ff5f1f",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontWeight: 700,
              cursor: isFetching ? "default" : "pointer",
              opacity: isFetching ? 0.6 : 1,
            }}
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {isLoading && <p>Loading stats…</p>}
        {error && <p style={{ color: "#c0392b" }}>Failed to load: {error.message}</p>}

        {data && (
          <>
            <Section title="New sign-ups">
              <StatCard label="Last 24 hours" value={data.signups.last24h} />
              <StatCard label="Last 48 hours" value={data.signups.last48h} />
              <StatCard label="Last 7 days" value={data.signups.last7d} />
            </Section>

            <Section title="Page views">
              <StatCard label="Last 24 hours" value={data.pageviews.last24h} />
              <StatCard label="Last 48 hours" value={data.pageviews.last48h} />
              <StatCard label="Last 7 days" value={data.pageviews.last7d} />
            </Section>

            <Section title="Totals">
              <StatCard label="Total users ever" value={data.totalUsers} />
              <StatCard label="Newsletter emails" value={data.totalEmails} />
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
