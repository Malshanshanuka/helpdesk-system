import { useEffect, useMemo, useState } from "react";
import { Search, Shield, UserCheck, Users as UsersIcon } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  { value: "employee",   label: "Employee" },
  { value: "it_support", label: "IT Support" },
  { value: "admin",      label: "Admin" },
];

const initials = (name) =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

const AVATAR_COLORS = [
  "from-sky-400 to-indigo-500",
  "from-violet-400 to-purple-600",
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-orange-500",
  "from-pink-400 to-rose-600",
];

const avatarColor = (name) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId]         = useState("");
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    let ignore = false;
    api.get("/users")
      .then(({ data }) => { if (!ignore) setUsers(data); })
      .catch(() => { if (!ignore) setError("Could not load users"); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (!term) return true;
      return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
    });
  }, [users, search, roleFilter]);

  const counts = useMemo(() =>
    users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {}), [users]);

  const replaceUser = (updated) => setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));

  const changeRole = async (target, role) => {
    if (role === target.role) return;
    setActionError(""); setBusyId(target._id);
    try { const { data } = await api.patch(`/users/${target._id}/role`, { role }); replaceUser(data); }
    catch (err) { setActionError(err.response?.data?.message || "Could not change the role"); }
    finally { setBusyId(""); }
  };

  const toggleActive = async (target) => {
    if (target.isActive && !window.confirm(`Deactivate ${target.name}? They will no longer be able to sign in.`)) return;
    setActionError(""); setBusyId(target._id);
    try { const { data } = await api.patch(`/users/${target._id}/status`, { isActive: !target.isActive }); replaceUser(data); }
    catch (err) { setActionError(err.response?.data?.message || "Could not update the account"); }
    finally { setBusyId(""); }
  };

  const filters = [
    { value: "", label: "All", count: users.length, icon: UsersIcon },
    ...ROLES.map((r) => ({ ...r, count: counts[r.value] || 0, icon: r.value === "admin" ? Shield : UserCheck })),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Users</h1>
        <p className="text-slate-500 text-sm mt-1">Manage user accounts and permissions</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const Icon = f.icon;
          return (
            <button key={f.value} onClick={() => setRoleFilter(f.value)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                roleFilter === f.value
                  ? "bg-sky-600 text-white shadow-md shadow-sky-500/30"
                  : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:ring-sky-300 hover:text-sky-600"
              }`}>
              <Icon className="h-3.5 w-3.5" />
              {f.label} <span className="rounded-full bg-current/10 px-1.5 py-0.5 text-xs">{f.count}</span>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100" />
      </div>

      {actionError && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{actionError}</div>}

      <div className="space-y-3">
        {loading && <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" /></div>}
        {!loading && error && <p className="rounded-xl bg-red-50 p-5 text-sm text-red-600 border border-red-100">{error}</p>}
        {!loading && !error && visible.length === 0 && (
          <p className="rounded-xl bg-white p-8 text-center text-slate-400 shadow-sm border border-slate-100">No users match your filters.</p>
        )}

        {!loading && !error && visible.map((u) => {
          const isMe = u._id === me._id;
          const busy = busyId === u._id;
          return (
            <div key={u._id}
              className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md ${!u.isActive ? "opacity-60" : ""}`}>
              <div className="flex min-w-0 items-center gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(u.name)} text-sm font-bold text-white shadow-sm`}>
                  {initials(u.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-slate-800">{u.name}</p>
                    {isMe && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-600 ring-1 ring-sky-200">you</span>}
                    {!u.isActive && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Deactivated</span>}
                  </div>
                  <p className="truncate text-sm text-slate-400">
                    {u.email}{u.department ? ` · ${u.department}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select value={u.role} onChange={(e) => changeRole(u, e.target.value)} disabled={isMe || busy}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-400 disabled:opacity-60">
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <button onClick={() => toggleActive(u)} disabled={isMe || busy}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                    u.isActive ? "border-red-200 text-red-600 hover:bg-red-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  }`}>
                  {u.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
