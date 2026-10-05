import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { categoryLabel } from "../lib/constants";
import { formatDate } from "../lib/format";
import PriorityBadge from "../components/PriorityBadge";

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

function StatCard({ label, value, to }) {
  return (
    <Link to={to} className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md">
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </Link>
  );
}

function TicketRow({ ticket, right }) {
  return (
    <Link
      to={`/requests/${ticket._id}`}
      className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 last:border-b-0 hover:bg-slate-50"
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-800">{ticket.title}</p>
        <p className="mt-0.5 text-sm text-slate-500">
          #{ticket.ticketNumber} &middot; {ticket.createdBy?.name} &middot; {categoryLabel(ticket.category)}{" "}
          &middot; {formatDate(ticket.createdAt)}
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
          .sort(
            (a, b) =>
              PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
              new Date(a.createdAt) - new Date(b.createdAt)
          )
          .slice(0, 5);

        setStats(s.data);
        setAttention(active);
        setResolved(done.data.tickets);
        setWaiting(unassigned.data.total);
      })
      .catch(() => {
        if (!ignore) setError("Could not load your dashboard");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const firstName = user.name.split(" ")[0];

  if (loading) {
    return <p className="rounded-2xl bg-white p-6 text-slate-500 shadow-sm">Loading...</p>;
  }

  if (error) {
    return <p className="rounded-2xl bg-white p-6 text-red-600 shadow-sm">{error}</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">
        {greeting()}, {firstName}
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="My open tickets" value={stats.open + stats.inProgress} to="/queue?assignee=me" />
        <StatCard label="Waiting for pickup" value={waiting} to="/queue?assignee=unassigned" />
        <StatCard label="Resolved by me" value={stats.resolved} to="/queue?assignee=me" />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Needs your attention</h2>
        <div className="rounded-2xl bg-white shadow-sm">
          {attention.length === 0 && (
            <p className="p-6 text-slate-500">Nothing needs your attention right now.</p>
          )}
          {attention.map((t) => (
            <TicketRow key={t._id} ticket={t} right={<PriorityBadge priority={t.priority} />} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Recently resolved</h2>
        <div className="rounded-2xl bg-white shadow-sm">
          {resolved.length === 0 && <p className="p-6 text-slate-500">No resolved tickets yet.</p>}
          {resolved.map((t) => (
            <TicketRow key={t._id} ticket={t} right={<span className="text-sm text-green-600">Resolved</span>} />
          ))}
        </div>
      </section>
    </div>
  );
}