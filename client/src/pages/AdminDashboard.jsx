import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { CATEGORIES, STATUS_STYLES, categoryLabel } from "../lib/constants";
import { formatDate } from "../lib/format";
import BarList from "../components/BarList";
import PriorityBadge from "../components/PriorityBadge";
import { TrendingUp, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

const PRIORITY_BARS = [
  { key: "critical", label: "Critical", color: "bg-red-500" },
  { key: "high",     label: "High",     color: "bg-orange-500" },
  { key: "medium",   label: "Normal",   color: "bg-sky-500" },
  { key: "low",      label: "Low",      color: "bg-slate-400" },
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const buildLastSevenDays = (rows) => {
  const counts = rows.reduce((acc, r) => { acc[r.date] = r.count; return acc; }, {});
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10);
    const day = new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" });
    return { date, day, count: counts[date] || 0 };
  });
};

function StatCard({ label, value, to, icon: Icon, color }) {
  const inner = (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-3xl font-bold text-slate-800">{value ?? "—"}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function Panel({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-bold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [unassigned, setUnassigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    Promise.all([
      api.get("/stats"),
      api.get("/tickets", { params: { assignedTo: "unassigned", status: "open", limit: 5 } }),
    ])
      .then(([s, u]) => { if (!ignore) { setStats(s.data); setUnassigned(u.data.tickets); } })
      .catch(() => { if (!ignore) setError("Could not load the dashboard"); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
    </div>
  );

  if (error) return <p className="rounded-2xl bg-red-50 p-6 text-red-600 border border-red-100">{error}</p>;

  const days = buildLastSevenDays(stats.last7Days);
  const maxDay = Math.max(...days.map((d) => d.count), 1);
  const byStatus = stats.byStatus;
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{greeting()}, {firstName} 👋</h1>
        <p className="text-slate-500 mt-1">Here's what's happening across the support queue.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total tickets"       value={stats.total}                                          to="/queue"                      icon={TrendingUp}    color="bg-sky-500" />
        <StatCard label="Open"                value={byStatus.open || 0}                                   to={undefined}                   icon={AlertTriangle} color="bg-amber-500" />
        <StatCard label="In Progress"         value={byStatus.in_progress || 0}                            to={undefined}                   icon={Clock}         color="bg-indigo-500" />
        <StatCard label="Unassigned"          value={stats.unassigned}                                     to="/queue?assignee=unassigned"  icon={AlertTriangle} color="bg-red-500" />
        <StatCard label="Resolved / Closed"  value={(byStatus.resolved || 0) + (byStatus.closed || 0)}   to={undefined}                   icon={CheckCircle2}  color="bg-emerald-500" />
      </div>

      {/* 7-day chart */}
      <Panel title="Tickets created — last 7 days">
        <div className="flex items-end gap-2">
          {days.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-semibold text-slate-600">{d.count || ""}</span>
              <div className="h-32 w-full flex items-end">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-sky-500 to-indigo-500 transition-all"
                  style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: d.count ? 6 : 2 }}
                />
              </div>
              <p className="text-xs text-slate-400">{d.day}</p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="By status">
          <BarList items={Object.entries(STATUS_STYLES).map(([value, s]) => ({ label: s.label, value: byStatus[value] || 0, color: s.dot }))} />
        </Panel>
        <Panel title="By priority">
          <BarList items={PRIORITY_BARS.map((p) => ({ label: p.label, value: stats.byPriority[p.key] || 0, color: p.color }))} />
        </Panel>
        <Panel title="By category">
          <BarList items={CATEGORIES.map((c) => ({ label: c.label, value: stats.byCategory[c.value] || 0, color: "bg-sky-500" }))} />
        </Panel>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Waiting for an agent</h2>
          <Link to="/queue?assignee=unassigned" className="text-sm font-semibold text-sky-600 hover:underline">View all →</Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {unassigned.length === 0 && <p className="p-6 text-slate-400 text-sm">Every open ticket has an agent. 🎉</p>}
          {unassigned.map((t, i) => (
            <Link key={t._id} to={`/requests/${t._id}`}
              className={`flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition hover:bg-slate-50 ${i < unassigned.length - 1 ? "border-b border-slate-100" : ""}`}>
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-800">{t.title}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  #{t.ticketNumber} · {t.createdBy?.name} · {categoryLabel(t.category)} · {formatDate(t.createdAt)}
                </p>
              </div>
              <PriorityBadge priority={t.priority} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
