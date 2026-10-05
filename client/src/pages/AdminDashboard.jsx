import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { CATEGORIES, STATUS_STYLES, categoryLabel } from "../lib/constants";
import { formatDate } from "../lib/format";
import BarList from "../components/BarList";
import PriorityBadge from "../components/PriorityBadge";

const PRIORITY_BARS = [
  { key: "critical", label: "Critical", color: "bg-red-500" },
  { key: "high", label: "High", color: "bg-orange-500" },
  { key: "medium", label: "Normal", color: "bg-blue-500" },
  { key: "low", label: "Low", color: "bg-slate-400" },
];

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

function StatCard({ label, value, to }) {
  const content = (
    <>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </>
  );

  const className = "rounded-2xl bg-white p-5 shadow-sm";

  return to ? (
    <Link to={to} className={`${className} transition hover:shadow-md`}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-semibold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}

// The backend only returns days that have tickets, so empty days are filled with zero
const buildLastSevenDays = (rows) => {
  const counts = rows.reduce((acc, r) => {
    acc[r.date] = r.count;
    return acc;
  }, {});

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const day = new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
      weekday: "short",
      timeZone: "UTC",
    });
    return { date, day, count: counts[date] || 0 };
  });
};

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
      .then(([s, u]) => {
        if (ignore) return;
        setStats(s.data);
        setUnassigned(u.data.tickets);
      })
      .catch(() => {
        if (!ignore) setError("Could not load the dashboard");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return <p className="rounded-2xl bg-white p-6 text-slate-500 shadow-sm">Loading...</p>;
  }

  if (error) {
    return <p className="rounded-2xl bg-white p-6 text-red-600 shadow-sm">{error}</p>;
  }

  const days = buildLastSevenDays(stats.last7Days);
  const maxDay = Math.max(...days.map((d) => d.count), 1);
  const byStatus = stats.byStatus;
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">
        {greeting()}, {firstName}
      </h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total tickets" value={stats.total} to="/queue" />
        <StatCard label="Open" value={byStatus.open || 0} />
        <StatCard label="In progress" value={byStatus.in_progress || 0} />
        <StatCard label="Unassigned" value={stats.unassigned} to="/queue?assignee=unassigned" />
        <StatCard label="Resolved or closed" value={(byStatus.resolved || 0) + (byStatus.closed || 0)} />
      </div>

      <Panel title="Tickets created in the last 7 days">
        <div className="flex items-end gap-3">
          {days.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center">
              <div className="flex h-32 w-full items-end">
                <div
                  className="w-full rounded-t-lg bg-blue-500"
                  style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: d.count ? 6 : 2 }}
                />
              </div>
              <p className="mt-2 text-sm font-medium text-slate-700">{d.count}</p>
              <p className="text-xs text-slate-400">{d.day}</p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="By status">
          <BarList
            items={Object.entries(STATUS_STYLES).map(([value, s]) => ({
              label: s.label,
              value: byStatus[value] || 0,
              color: s.dot,
            }))}
          />
        </Panel>

        <Panel title="By priority">
          <BarList
            items={PRIORITY_BARS.map((p) => ({
              label: p.label,
              value: stats.byPriority[p.key] || 0,
              color: p.color,
            }))}
          />
        </Panel>

        <Panel title="By category">
          <BarList
            items={CATEGORIES.map((c) => ({
              label: c.label,
              value: stats.byCategory[c.value] || 0,
              color: "bg-blue-500",
            }))}
          />
        </Panel>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Waiting for an agent</h2>
          <Link to="/queue?assignee=unassigned" className="text-sm font-medium text-blue-600 hover:underline">
            View all
          </Link>
        </div>

        <div className="rounded-2xl bg-white shadow-sm">
          {unassigned.length === 0 && <p className="p-6 text-slate-500">Every open ticket has an agent.</p>}
          {unassigned.map((t) => (
            <Link
              key={t._id}
              to={`/requests/${t._id}`}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 last:border-b-0 hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{t.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">
                  #{t.ticketNumber} &middot; {t.createdBy?.name} &middot; {categoryLabel(t.category)} &middot;{" "}
                  {formatDate(t.createdAt)}
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