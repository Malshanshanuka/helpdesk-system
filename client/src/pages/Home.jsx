import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Ticket } from "lucide-react";
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
    api
      .get("/tickets", { params: { limit: 3 } })
      .then(({ data }) => setTickets(data.tickets))
      .catch(() => setError("Could not load your recent requests"))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/knowledge?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-10">
      <section className="text-center">
        <h1 className="text-3xl font-bold text-slate-800">Hello, {firstName}</h1>
        <p className="mt-1 text-slate-500">How can we help you today?</p>

        <form onSubmit={handleSearch} className="mx-auto mt-6 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for help or an issue..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-800">What do you need help with?</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* Only the four most common categories are shown on the home page */}
          {CATEGORIES.slice(0, 4).map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.value}
                to={`/tickets/new?category=${cat.value}`}
                className="rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-4 font-medium text-slate-800">{cat.label}</p>
                <p className="mt-0.5 text-sm text-slate-500">{cat.hint}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-blue-600 p-6 text-white shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <Ticket className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold">Having a problem?</p>
            <p className="text-blue-100">Tell us what is wrong and we will help you.</p>
          </div>
        </div>
        <Link
          to="/tickets/new"
          className="rounded-lg bg-white px-5 py-2.5 font-medium text-blue-600 hover:bg-blue-50"
        >
          Create a Ticket
        </Link>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Your recent requests</h2>
          <Link to="/requests" className="text-sm font-medium text-blue-600 hover:underline">
            View all
          </Link>
        </div>

        <div className="rounded-2xl bg-white shadow-sm">
          {loading && <p className="p-6 text-slate-500">Loading...</p>}

          {!loading && error && <p className="p-6 text-red-600">{error}</p>}

          {!loading && !error && tickets.length === 0 && (
            <p className="p-6 text-slate-500">You have not created any requests yet.</p>
          )}

          {!loading &&
            !error &&
            tickets.map((t) => (
              <div
                key={t._id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 last:border-b-0"
              >
                <div>
                  <p className="font-medium text-slate-800">{t.title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    #{t.ticketNumber} &middot; {categoryLabel(t.category)} &middot;{" "}
                    {new Date(t.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}