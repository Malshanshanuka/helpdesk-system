import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../api/axios";
import { PRIORITIES, categoryLabel } from "../lib/constants";
import { formatDate } from "../lib/format";
import StatusBadge from "../components/StatusBadge";

const TABS = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const PAGE_SIZE = 8;

export default function MyRequests() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ tickets: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoading(true); setError("");
    api.get("/tickets", { params: { status: status || undefined, search: search || undefined, page, limit: PAGE_SIZE } })
      .then(({ data }) => { if (!ignore) setResult(data); })
      .catch(() => { if (!ignore) setError("Could not load your requests"); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [status, search, page]);

  const changeTab = (v) => { setStatus(v); setPage(1); };
  const submitSearch = (e) => { e.preventDefault(); setSearch(searchInput.trim()); setPage(1); };
  const clearSearch = () => { setSearchInput(""); setSearch(""); setPage(1); };

  const priorityLabel = (v) => PRIORITIES.find((p) => p.value === v)?.label ?? v;
  const filtered = status !== "" || search !== "";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Requests</h1>
          <p className="text-slate-500 text-sm mt-1">Track and manage your support tickets</p>
        </div>
        <Link to="/tickets/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:from-sky-600 hover:to-indigo-700">
          <Plus className="h-4 w-4" /> New request
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button key={tab.value} onClick={() => changeTab(tab.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              status === tab.value
                ? "bg-sky-600 text-white shadow-md shadow-sky-500/30"
                : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:ring-sky-300 hover:text-sky-600"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={submitSearch} className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by title, description or ticket number…"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-24 text-sm outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100" />
        {search && (
          <button type="button" onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-sky-600 hover:underline">
            Clear
          </button>
        )}
      </form>

      {/* Tickets */}
      <div className="space-y-3">
        {loading && <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" /></div>}
        {!loading && error && <p className="rounded-xl bg-red-50 p-5 text-sm text-red-600 border border-red-100">{error}</p>}
        {!loading && !error && result.tickets.length === 0 && (
          <p className="rounded-xl bg-white p-8 text-center text-slate-400 shadow-sm border border-slate-100">
            {filtered ? "No requests match your filters." : "You haven't created any requests yet."}
          </p>
        )}
        {!loading && !error && result.tickets.map((t) => (
          <Link key={t._id} to={`/requests/${t._id}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md hover:-translate-y-0.5">
            <div className="min-w-0">
              <p className="text-xs text-slate-400 font-medium">#{t.ticketNumber}</p>
              <p className="truncate font-semibold text-slate-800">{t.title}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {categoryLabel(t.category)} · {formatDate(t.createdAt)} · {priorityLabel(t.priority)} priority
              </p>
            </div>
            <StatusBadge status={t.status} />
          </Link>
        ))}
      </div>

      {!loading && !error && result.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <p className="text-sm text-slate-500">Page {page} of {result.totalPages} · {result.total} requests</p>
          <button disabled={page >= result.totalPages} onClick={() => setPage(page + 1)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
