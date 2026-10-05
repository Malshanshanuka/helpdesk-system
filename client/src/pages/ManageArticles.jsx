import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { kbCategoryLabel } from "../lib/constants";
import { formatDate } from "../lib/format";

export default function ManageArticles() {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let ignore = false;
    api.get("/articles", { params: { manage: true } })
      .then(({ data }) => { if (!ignore) setArticles(data); })
      .catch(() => { if (!ignore) setError("Could not load articles"); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  const remove = async (article) => {
    if (!window.confirm(`Delete "${article.title}"? This cannot be undone.`)) return;
    setActionError("");
    try {
      await api.delete(`/articles/${article._id}`);
      setArticles((prev) => prev.filter((a) => a._id !== article._id));
    } catch (err) { setActionError(err.response?.data?.message || "Could not delete the article"); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/knowledge" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-sky-600">
        <ArrowLeft className="h-4 w-4" /> Knowledge Base
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manage Articles</h1>
          <p className="text-slate-500 text-sm mt-1">Create and edit knowledge base articles</p>
        </div>
        <Link to="/knowledge/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:from-sky-600 hover:to-indigo-700">
          <Plus className="h-4 w-4" /> New article
        </Link>
      </div>

      {actionError && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{actionError}</div>}

      <div className="space-y-3">
        {loading && <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" /></div>}
        {!loading && error && <p className="rounded-xl bg-red-50 p-5 text-sm text-red-600 border border-red-100">{error}</p>}
        {!loading && !error && articles.length === 0 && (
          <p className="rounded-xl bg-white p-8 text-center text-slate-400 shadow-sm border border-slate-100">No articles yet.</p>
        )}

        {!loading && !error && articles.map((a) => (
          <div key={a._id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold text-slate-800">{a.title}</p>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  a.isPublished ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-500"
                }`}>
                  {a.isPublished ? "Published" : "Draft"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                {kbCategoryLabel(a.category)} · {a.views} views · Updated {formatDate(a.updatedAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to={`/knowledge/${a._id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:text-sky-600">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Link>
              {user.role === "admin" && (
                <button onClick={() => remove(a)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
