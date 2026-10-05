import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, FileText, Settings } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { KB_CATEGORIES, kbCategoryLabel } from "../lib/constants";

function ArticleCard({ article }) {
  return (
    <Link
      to={`/knowledge/${article._id}`}
      className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="font-medium text-slate-800">{article.title}</p>
        <p className="mt-0.5 text-sm text-slate-500">{article.summary}</p>
        <p className="mt-1 text-xs text-slate-400">{kbCategoryLabel(article.category)}</p>
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

  useEffect(() => {
    setInput(search);
  }, [search]);

  useEffect(() => {
    api
      .get("/articles/popular")
      .then(({ data }) => setPopular(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");

    api
      .get("/articles", { params: { search: search || undefined, category: category || undefined } })
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
  }, [search, category]);

  const update = (next) => {
    const s = next.search ?? search;
    const c = next.category ?? category;
    const params = {};
    if (s) params.search = s;
    if (c) params.category = c;
    setSearchParams(params);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    update({ search: input.trim() });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Knowledge Base</h1>
          <p className="mt-1 text-slate-500">Find an answer before you create a ticket.</p>
        </div>
        {isStaff && (
          <Link
            to="/knowledge/manage"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Settings className="h-4 w-4" /> Manage articles
          </Link>
        )}
      </div>

      <form onSubmit={submitSearch} className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search articles..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </form>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => update({ category: "" })}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            category === "" ? "bg-blue-600 text-white" : "bg-white text-slate-600 shadow-sm hover:text-blue-600"
          }`}
        >
          All
        </button>
        {KB_CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.value}
              onClick={() => update({ category: c.value })}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                category === c.value ? "bg-blue-600 text-white" : "bg-white text-slate-600 shadow-sm hover:text-blue-600"
              }`}
            >
              <Icon className="h-4 w-4" /> {c.label}
            </button>
          );
        })}
      </div>

      {!filtered && popular.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Popular articles</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {popular.slice(0, 4).map((a) => (
              <ArticleCard key={a._id} article={a} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">
          {filtered ? `${articles.length} result${articles.length === 1 ? "" : "s"}` : "All articles"}
        </h2>

        {loading && <p className="rounded-2xl bg-white p-6 text-slate-500 shadow-sm">Loading...</p>}
        {!loading && error && <p className="rounded-2xl bg-white p-6 text-red-600 shadow-sm">{error}</p>}

        {!loading && !error && articles.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-500">No articles match your search.</p>
            <Link to="/tickets/new" className="mt-3 inline-block font-medium text-blue-600 hover:underline">
              Create a ticket instead
            </Link>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {articles.map((a) => (
              <ArticleCard key={a._id} article={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}