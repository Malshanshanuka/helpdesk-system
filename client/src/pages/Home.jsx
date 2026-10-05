import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Ticket, ArrowRight } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { CATEGORIES, categoryLabel } from "../lib/constants";
import StatusBadge from "../components/StatusBadge";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/tickets", { params: { limit: 3 } })
      .then(({ data }) => setTickets(data.tickets))
      .catch(() => setError("Could not load your recent requests"))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/knowledge?search=${encodeURIComponent(query.trim())}`);
  };

  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-700 px-8 py-12 text-white shadow-xl shadow-sky-500/20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5" />
          <div className="absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-white/5" />
          <div className="absolute right-1/4 bottom-0 h-32 w-32 rounded-full bg-white/5" />
        </div>
        <div className="relative text-center">
          <p className="text-sky-200 text-sm font-medium mb-1">IT Support Portal</p>
          <h1 className="text-3xl font-bold md:text-4xl">Hello, {firstName} 👋</h1>
          <p className="mt-2 text-sky-100">How can we help you today?</p>

          <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search knowledge base for help…"
                className="w-full rounded-2xl border-0 bg-white py-4 pl-12 pr-4 text-slate-800 shadow-xl outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-white/40"
              />
              <button type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition">
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Category Cards */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">What do you need help with?</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.value} to={`/tickets/new?category=${cat.value}`}
                className="group flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-500/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-indigo-50 text-sky-600 ring-1 ring-sky-100 transition group-hover:from-sky-100 group-hover:to-indigo-100 group-hover:ring-sky-200">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-800">{cat.label}</p>
                <p className="mt-0.5 text-xs text-slate-400">{cat.hint}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Create Ticket CTA */}
      <section className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 p-6 text-white shadow-lg shadow-indigo-500/20 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
            <Ticket className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-bold">Still can't find an answer?</p>
            <p className="text-indigo-100 text-sm">Create a support ticket and our team will help you.</p>
          </div>
        </div>
        <Link to="/tickets/new"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50">
          Create a Ticket <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Recent Requests */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Your recent requests</h2>
          <Link to="/requests" className="text-sm font-semibold text-sky-600 hover:text-sky-700 hover:underline">
            View all →
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {loading && <p className="p-6 text-slate-400 text-sm">Loading…</p>}
          {!loading && error && <p className="p-6 text-red-500 text-sm">{error}</p>}
          {!loading && !error && tickets.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-slate-400">You haven&apos;t created any requests yet.</p>
              <Link to="/tickets/new" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:underline">
                Create your first ticket <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
          {!loading && !error && tickets.map((t, i) => (
            <Link key={t._id} to={`/requests/${t._id}`}
              className={`flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition hover:bg-slate-50 ${i < tickets.length - 1 ? "border-b border-slate-100" : ""}`}>
              <div>
                <p className="font-semibold text-slate-800">{t.title}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  #{t.ticketNumber} · {categoryLabel(t.category)} ·{" "}
                  {new Date(t.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
              </div>
              <StatusBadge status={t.status} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
