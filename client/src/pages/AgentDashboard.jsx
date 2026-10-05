import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { categoryLabel } from "../lib/constants";
import { formatDate } from "../lib/format";
import PriorityBadge from "../components/PriorityBadge";
import { Inbox, Clock, CheckCircle2 } from "lucide-react";

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

function StatCard({ label, value, to, icon: Icon, color }) {
  return (
    <Link to={to} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </Link>
  );
}

function TicketRow({ ticket, right, isLast }) {
  return (
    <Link to={`/requests/${ticket._id}`}
      className={`flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition hover:bg-slate-50 ${!isLast ? "border-b border-slate-100" : ""}`}>
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-800">{ticket.title}</p>
        <p className="mt-0.5 text-xs text-slate-400">
          #{ticket.ticketNumber} · {ticket.createdBy?.name} · {categoryLabel(ticket.category)} · {formatDate(ticket.createdAt)}
        </p>
      </div>
      {right}
    </Link>
  );
}

export default function AgentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [attention, setAttention] = useState([]);
  const [resolved, setResolved] = useState([]);
  const [waiting, setWaiting] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    Promise.all([
      api.get("/stats/me"),
      api.get("/tickets", { params: { assignedTo: "me", limit: 50 } }),
      api.get("/tickets", { params: { assignedTo: "me", status: "resolved", limit: 5 } }),
      api.get("/tickets", { params: { assignedTo: "unassigned", status: "open", limit: 1 } }),
    ])
      .then(([s, mine, done, unassigned]) => {
        if (ignore) return;
        const active = mine.data.tickets
          .filter((t) => t.status === "open" || t.status === "in_progress")
          .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || new Date(a.createdAt) - new Date(b.createdAt))
          .slice(0, 5);
        setStats(s.data); setAttention(active); setResolved(done.data.tickets); setWaiting(unassigned.data.total);
      })
      .catch(() => { if (!ignore) setError("Could not load your dashboard"); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  const firstName = user.name.split(" ")[0];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
    </div>
  );
  if (error) return <p className="rounded-2xl bg-red-50 p-6 text-red-600 border border-red-100">{error}</p>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{greeting()}, {firstName} 👋</h1>
        <p className="text-slate-500 mt-1">Here's your support queue overview.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="My open tickets"       value={stats.open + stats.inProgress} to="/queue?assignee=me"          icon={Inbox}         color="bg-sky-500" />
        <StatCard label="Waiting for pickup"    value={waiting}                       to="/queue?assignee=unassigned"  icon={Clock}         color="bg-amber-500" />
        <StatCard label="Resolved by me"        value={stats.resolved}                to="/queue?assignee=me"          icon={CheckCircle2}  color="bg-emerald-500" />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold text-slate-800">Needs your attention</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {attention.length === 0 && <p className="p-6 text-slate-400 text-sm">Nothing needs your attention right now. 🎉</p>}
          {attention.map((t, i) => <TicketRow key={t._id} ticket={t} right={<PriorityBadge priority={t.priority} />} isLast={i === attention.length - 1} />)}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-slate-800">Recently resolved</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {resolved.length === 0 && <p className="p-6 text-slate-400 text-sm">No resolved tickets yet.</p>}
          {resolved.map((t, i) => (
            <TicketRow key={t._id} ticket={t}
              right={<span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Resolved</span>}
              isLast={i === resolved.length - 1} />
          ))}
        </div>
      </section>
    </div>
  );
}
