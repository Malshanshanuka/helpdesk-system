import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, FileText, Settings, BookOpen } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { KB_CATEGORIES, kbCategoryLabel } from "../lib/constants";

function ArticleCard({ article }) {
  return (
    <Link to={`/knowledge/${article._id}`}
      className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md hover:-translate-y-0.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-indigo-50 text-sky-600 ring-1 ring-sky-100">
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-slate-800">{article.title}</p>
        <p className="mt-0.5 text-sm text-slate-500 line-clamp-2">{article.summary}</p>
        <p className="mt-1.5 text-xs font-medium text-sky-600">{kbCategoryLabel(article.category)}</p>
      </div>
    </Link>
  );
}

export default function KnowledgeBase() {
  const { user } = useAuth();
  const isStaff = user.role === "it_support" || user.role === "admin";

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  const [input, setInput] = useState(search);
  const [articles, setArticles] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filtered = search !== "" || category !== "";

  useEffect(() => { setInput(search); }, [search]);
  useEffect(() => { api.get("/articles/popular").then(({ data }) => setPopular(data)).catch(() => {}); }, []);
  useEffect(() => {
    let ignore = false;
    setLoading(true); setError("");
    api.get("/articles", { params: { search: search || undefined, category: category || undefined } })
      .then(({ data }) => { if (!ignore) setArticles(data); })
      .catch(() => { if (!ignore) setError("Could not load articles"); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [search, category]);

  const update = (next) => {
    const s = next.search ?? search, c = next.category ?? category;
    const params = {};
    if (s) params.search = s;
    if (c) params.category = c;
    setSearchParams(params);
  };

  const submitSearch = (e) => { e.preventDefault(); update({ search: input.trim() }); };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Knowledge Base</h1>
            <p className="text-slate-500 text-sm">Find answers before creating a ticket</p>
          </div>
        </div>
        {isStaff && (
          <Link to="/knowledge/manage"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-sky-300 hover:text-sky-600">
            <Settings className="h-4 w-4" /> Manage articles
          </Link>
        )}
      </div>

      {/* Search */}
      <form onSubmit={submitSearch} className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search articles…"
          className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-sm shadow-sm outline-none focus:border-sky-400 focus:ring-3 focus:ring-sky-100" />
      </form>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => update({ category: "" })}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            category === ""
              ? "bg-sky-600 text-white shadow-md shadow-sky-500/30"
              : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:ring-sky-300 hover:text-sky-600"
          }`}>
          All
        </button>
        {KB_CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <button key={c.value} onClick={() => update({ category: c.value })}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                category === c.value
                  ? "bg-sky-600 text-white shadow-md shadow-sky-500/30"
                  : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:ring-sky-300 hover:text-sky-600"
              }`}>
              <Icon className="h-3.5 w-3.5" /> {c.label}
            </button>
          );
        })}
      </div>

      {/* Popular */}
      {!filtered && popular.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-slate-800">Popular articles</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {popular.slice(0, 4).map((a) => <ArticleCard key={a._id} article={a} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-bold text-slate-800">
          {filtered ? `${articles.length} result${articles.length === 1 ? "" : "s"}` : "All articles"}
        </h2>

        {loading && <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" /></div>}
        {!loading && error && <p className="rounded-xl bg-red-50 p-5 text-sm text-red-600 border border-red-100">{error}</p>}
        {!loading && !error && articles.length === 0 && (
          <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-400">No articles match your search.</p>
            <Link to="/tickets/new" className="mt-3 inline-block text-sm font-semibold text-sky-600 hover:underline">
              Create a ticket instead →
            </Link>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {articles.map((a) => <ArticleCard key={a._id} article={a} />)}
          </div>
        )}
      </section>
    </div>
  );
}
