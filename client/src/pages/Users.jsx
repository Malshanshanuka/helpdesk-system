import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  { value: "employee", label: "Employee" },
  { value: "it_support", label: "IT Support" },
  { value: "admin", label: "Admin" },
];

const initials = (name) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function Users() {
  const { user: me } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    let ignore = false;

    api
      .get("/users")
      .then(({ data }) => {
        if (!ignore) setUsers(data);
      })
      .catch(() => {
        if (!ignore) setError("Could not load users");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (!term) return true;
      return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
    });
  }, [users, search, roleFilter]);

  const counts = useMemo(
    () =>
      users.reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
      }, {}),
    [users]
  );

  const replaceUser = (updated) => {
    setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
  };

  const changeRole = async (target, role) => {
    if (role === target.role) return;
    setActionError("");
    setBusyId(target._id);
    try {
      const { data } = await api.patch(`/users/${target._id}/role`, { role });
      replaceUser(data);
    } catch (err) {
      setActionError(err.response?.data?.message || "Could not change the role");
    } finally {
      setBusyId("");
    }
  };

  const toggleActive = async (target) => {
    if (target.isActive && !window.confirm(`Deactivate ${target.name}? They will no longer be able to sign in.`)) {
      return;
    }
    setActionError("");
    setBusyId(target._id);
    try {
      const { data } = await api.patch(`/users/${target._id}/status`, { isActive: !target.isActive });
      replaceUser(data);
    } catch (err) {
      setActionError(err.response?.data?.message || "Could not update the account");
    } finally {
      setBusyId("");
    }
  };

  const filters = [{ value: "", label: "All", count: users.length }, ...ROLES.map((r) => ({ ...r, count: counts[r.value] || 0 }))];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Users</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setRoleFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              roleFilter === f.value ? "bg-blue-600 text-white" : "bg-white text-slate-600 shadow-sm hover:text-blue-600"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      <div className="relative mt-4">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {actionError && <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{actionError}</div>}

      <div className="mt-6 space-y-3">
        {loading && <p className="rounded-2xl bg-white p-6 text-slate-500 shadow-sm">Loading...</p>}
        {!loading && error && <p className="rounded-2xl bg-white p-6 text-red-600 shadow-sm">{error}</p>}
        {!loading && !error && visible.length === 0 && (
          <p className="rounded-2xl bg-white p-6 text-slate-500 shadow-sm">No users match your filters.</p>
        )}

        {!loading &&
          !error &&
          visible.map((u) => {
            const isMe = u._id === me._id;
            const busy = busyId === u._id;

            return (
              <div
                key={u._id}
                className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm ${
                  u.isActive ? "" : "opacity-60"
                }`}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-600">
                    {initials(u.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">
                      {u.name}
                      {isMe && <span className="ml-2 text-xs font-normal text-slate-400">(you)</span>}
                      {!u.isActive && (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
                          Deactivated
                        </span>
                      )}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {u.email}
                      {u.department ? ` \u00b7 ${u.department}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u, e.target.value)}
                    disabled={isMe || busy}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:opacity-60"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => toggleActive(u)}
                    disabled={isMe || busy}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-60 ${
                      u.isActive
                        ? "border-red-200 text-red-600 hover:bg-red-50"
                        : "border-green-200 text-green-600 hover:bg-green-50"
                    }`}
                  >
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