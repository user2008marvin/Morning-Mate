import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { useListSubmissions, useGetAdminStats } from "@workspace/api-client-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Loader2, Users, Calendar, Image as ImageIcon, Mail } from "lucide-react";

export default function Admin() {
  const [page, setPage] = useState(1);
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: listData, isLoading: listLoading } = useListSubmissions({ page, pageSize: 20 });

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <Header />
      
      <main className="pt-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-serif text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Overview of try-on submissions and captured leads.</p>
          </div>
          <Link href="/">
            <Button variant="outline">Back to App</Button>
          </Link>
        </div>

        {statsLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
        ) : stats ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
                <div className="flex items-center gap-4 mb-4 text-muted-foreground">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary"><ImageIcon size={24} /></div>
                  <h3 className="font-semibold">Total Submissions</h3>
                </div>
                <p className="text-4xl font-serif font-bold text-foreground">{stats.totalSubmissions}</p>
              </div>
              <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
                <div className="flex items-center gap-4 mb-4 text-muted-foreground">
                  <div className="p-3 bg-secondary rounded-2xl text-secondary-foreground"><Calendar size={24} /></div>
                  <h3 className="font-semibold">Today</h3>
                </div>
                <p className="text-4xl font-serif font-bold text-foreground">{stats.submissionsToday}</p>
              </div>
              <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
                <div className="flex items-center gap-4 mb-4 text-muted-foreground">
                  <div className="p-3 bg-accent rounded-2xl text-accent-foreground"><Users size={24} /></div>
                  <h3 className="font-semibold">This Week</h3>
                </div>
                <p className="text-4xl font-serif font-bold text-foreground">{stats.submissionsThisWeek}</p>
              </div>
              <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
                <div className="flex items-center gap-4 mb-4 text-muted-foreground">
                  <div className="p-3 bg-primary rounded-2xl text-white"><Mail size={24} /></div>
                  <h3 className="font-semibold">Email Capture Rate</h3>
                </div>
                <p className="text-4xl font-serif font-bold text-foreground">{Math.round(stats.emailCaptureRate * 100)}%</p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
                <h3 className="text-xl font-serif font-semibold mb-6">Popular Occasions</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.byOccasion} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" />
                      <YAxis dataKey="occasion" type="category" width={100} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip 
                        cursor={{fill: 'hsl(var(--secondary))'}}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {stats.byOccasion.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--accent))'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
                <h3 className="text-xl font-serif font-semibold mb-6">Popular Looks</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.byLook} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="look" angle={-45} textAnchor="end" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} height={60} />
                      <YAxis />
                      <Tooltip 
                        cursor={{fill: 'hsl(var(--secondary))'}}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {stats.byLook.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="hsl(var(--primary))" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {/* Submissions Table */}
        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 border-b border-border flex justify-between items-center bg-secondary/20">
            <h3 className="text-2xl font-serif font-semibold">Recent Submissions</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Date</th>
                  <th className="p-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Photo</th>
                  <th className="p-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Occasion</th>
                  <th className="p-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Look</th>
                  <th className="p-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">User</th>
                </tr>
              </thead>
              <tbody>
                {listLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
                ) : listData?.submissions.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No submissions yet.</td></tr>
                ) : (
                  listData?.submissions.map(sub => (
                    <tr key={sub.id} className="border-b border-border/50 hover:bg-secondary/10 transition-colors">
                      <td className="p-4 text-sm whitespace-nowrap text-muted-foreground">
                        {format(new Date(sub.createdAt), "MMM d, h:mm a")}
                      </td>
                      <td className="p-4">
                        {sub.imageDataUrl ? (
                          <img src={sub.imageDataUrl} alt="thumb" className="w-12 h-12 rounded-lg object-cover shadow-sm border border-border" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground"><ImageIcon size={16}/></div>
                        )}
                      </td>
                      <td className="p-4 font-medium">{sub.occasion}</td>
                      <td className="p-4">{sub.look}</td>
                      <td className="p-4">
                        <div className="text-sm font-semibold">{sub.firstName || "Anonymous"}</div>
                        <div className="text-xs text-muted-foreground">{sub.email || "No email provided"}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {listData && listData.total > 20 && (
            <div className="p-6 border-t border-border flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Showing page {listData.page}</span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={listData.submissions.length < 20}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
