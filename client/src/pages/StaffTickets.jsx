import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../api/axios";
import { PRIORITIES, categoryLabel } from "../lib/constants";
import { formatDate } from "../lib/format";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";

const STATUS_TABS = [
  { value: "", label: "All" }, { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" }, { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];
const ASSIGNEE_TABS = [
  { value: "", label: "Everyone" }, { value: "me", label: "Assigned to me" },
  { value: "unassigned", label: "Unassigned" },
];
const PAGE_SIZE = 10;

function Pills({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            value === o.value
              ? "bg-sky-600 text-white shadow-md shadow-sky-500/30"
              : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:ring-sky-300 hover:text-sky-600"
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function StaffTickets() {
  const [searchParams] = useSearchParams();
  const fromUrl = searchParams.get("assignee");

  const [status, setStatus] = useState("");
  const [assignee, setAssignee] = useState(["me", "unassigned"].includes(fromUrl) ? fromUrl : "");
  const [priority, setPriority] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ tickets: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoading(true); setError("");
    api.get("/tickets", { params: { status: status || undefined, assignedTo: assignee || undefined, priority: priority || undefined, search: search || undefined, page, limit: PAGE_SIZE } })
      .then(({ data }) => { if (!ignore) setResult(data); })
      .catch(() => { if (!ignore) setError("Could not load tickets"); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [status, assignee, priority, search, page]);

  const changeStatus   = (v) => { setStatus(v);   setPage(1); };
  const changeAssignee = (v) => { setAssignee(v); setPage(1); };
  const changePriority = (e) => { setPriority(e.target.value); setPage(1); };
  const submitSearch   = (e) => { e.preventDefault(); setSearch(searchInput.trim()); setPage(1); };
  const clearSearch    = ()  => { setSearchInput(""); setSearch(""); setPage(1); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">All Tickets</h1>
        <p className="text-slate-500 text-sm mt-1">Manage and respond to support requests</p>
      </div>

      <div className="space-y-3">
        <Pills options={STATUS_TABS}   value={status}   onChange={changeStatus} />
        <Pills options={ASSIGNEE_TABS} value={assignee} onChange={changeAssignee} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={submitSearch} className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, description or ticket number…"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-20 text-sm outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100" />
          {search && (
            <button type="button" onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-sky-600 hover:underline">Clear</button>
          )}
        </form>
        <select value={priority} onChange={changePriority}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-sky-400">
          <option value="">Any priority</option>
          {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {loading && <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" /></div>}
        {!loading && error && <p className="rounded-xl bg-red-50 p-5 text-sm text-red-600 border border-red-100">{error}</p>}
        {!loading && !error && result.tickets.length === 0 && (
          <p className="rounded-xl bg-white p-8 text-center text-slate-400 shadow-sm border border-slate-100">No tickets match your filters.</p>
        )}
        {!loading && !error && result.tickets.map((t) => (
          <Link key={t._id} to={`/requests/${t._id}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md hover:-translate-y-0.5">
            <div className="min-w-0">
              <p className="text-xs text-slate-400 font-medium">#{t.ticketNumber}</p>
              <p className="truncate font-semibold text-slate-800">{t.title}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {t.createdBy?.name} · {categoryLabel(t.category)} · {formatDate(t.createdAt)} ·{" "}
                {t.assignedTo ? `Assigned to ${t.assignedTo.name}` : "Unassigned"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={t.priority} />
              <StatusBadge status={t.status} />
            </div>
          </Link>
        ))}
      </div>

      {!loading && !error && result.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <p className="text-sm text-slate-500">Page {page} of {result.totalPages} · {result.total} tickets</p>
          <button disabled={page >= result.totalPages} onClick={() => setPage(page + 1)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
