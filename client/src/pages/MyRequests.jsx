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
    setLoading(true);
    setError("");

    api
      .get("/tickets", {
        params: { status: status || undefined, search: search || undefined, page, limit: PAGE_SIZE },
      })
      .then(({ data }) => {
        if (!ignore) setResult(data);
      })
      .catch(() => {
        if (!ignore) setError("Could not load your requests");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [status, search, page]);

  const changeTab = (value) => {
    setStatus(value);
    setPage(1);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const priorityLabel = (value) => PRIORITIES.find((p) => p.value === value)?.label ?? value;
  const filtered = status !== "" || search !== "";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">My Requests</h1>
        <Link
          to="/tickets/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> New request
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => changeTab(tab.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              status === tab.value
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 shadow-sm hover:text-blue-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={submitSearch} className="relative mt-4">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by title, description or ticket number"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-24 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        {search && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:underline"
          >
            Clear
          </button>
        )}
      </form>

      <div className="mt-6 space-y-3">
        {loading && <p className="rounded-2xl bg-white p-6 text-slate-500 shadow-sm">Loading...</p>}

        {!loading && error && <p className="rounded-2xl bg-white p-6 text-red-600 shadow-sm">{error}</p>}

        {!loading && !error && result.tickets.length === 0 && (
          <p className="rounded-2xl bg-white p-6 text-slate-500 shadow-sm">
            {filtered ? "No requests match your filters." : "You have not created any requests yet."}
          </p>
        )}

        {!loading &&
          !error &&
          result.tickets.map((t) => (
            <Link
              key={t._id}
              to={`/requests/${t._id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="min-w-0">
                <p className="text-sm text-slate-400">#{t.ticketNumber}</p>
                <p className="truncate font-medium text-slate-800">{t.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {categoryLabel(t.category)} &middot; {formatDate(t.createdAt)} &middot;{" "}
                  {priorityLabel(t.priority)} priority
                </p>
              </div>
              <StatusBadge status={t.status} />
            </Link>
          ))}
      </div>

      {!loading && !error && result.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <p className="text-sm text-slate-500">
            Page {page} of {result.totalPages} &middot; {result.total} requests
          </p>
          <button
            disabled={page >= result.totalPages}
            onClick={() => setPage(page + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}