import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
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

    api
      .get("/articles", { params: { manage: true } })
      .then(({ data }) => {
        if (!ignore) setArticles(data);
      })
      .catch(() => {
        if (!ignore) setError("Could not load articles");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const remove = async (article) => {
    if (!window.confirm(`Delete "${article.title}"? This cannot be undone.`)) return;

    setActionError("");
    try {
      await api.delete(`/articles/${article._id}`);
      setArticles((prev) => prev.filter((a) => a._id !== article._id));
    } catch (err) {
      setActionError(err.response?.data?.message || "Could not delete the article");
    }
  };

  return (
    <div>
      <Link
        to="/knowledge"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" /> Knowledge Base
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Manage articles</h1>
        <Link
          to="/knowledge/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> New article
        </Link>
      </div>

      {actionError && <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{actionError}</div>}

      <div className="mt-6 space-y-3">
        {loading && <p className="rounded-2xl bg-white p-6 text-slate-500 shadow-sm">Loading...</p>}
        {!loading && error && <p className="rounded-2xl bg-white p-6 text-red-600 shadow-sm">{error}</p>}
        {!loading && !error && articles.length === 0 && (
          <p className="rounded-2xl bg-white p-6 text-slate-500 shadow-sm">No articles yet.</p>
        )}

        {!loading &&
          !error &&
          articles.map((a) => (
            <div
              key={a._id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">
                  {a.title}
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs font-normal ${
                      a.isPublished ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {a.isPublished ? "Published" : "Draft"}
                  </span>
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {kbCategoryLabel(a.category)} &middot; {a.views} views &middot; Updated {formatDate(a.updatedAt)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/knowledge/${a._id}/edit`}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Edit
                </Link>
                {user.role === "admin" && (
                  <button
                    onClick={() => remove(a)}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}