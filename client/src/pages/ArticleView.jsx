import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, ThumbsUp, Ticket } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { kbCategoryLabel, ticketCategoryFor } from "../lib/constants";
import { formatDate } from "../lib/format";

export default function ArticleView() {
  const { id } = useParams();
  const { user } = useAuth();
  const isStaff = user.role === "it_support" || user.role === "admin";

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true); setError(""); setSolved(false);
    api.get(`/articles/${id}`)
      .then(({ data }) => { if (!ignore) setArticle(data); })
      .catch((err) => { if (!ignore) setError(err.response?.data?.message || "Could not load this article"); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
    </div>
  );

  if (error) return (
    <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
      <p className="text-red-500">{error}</p>
      <Link to="/knowledge" className="mt-4 inline-block text-sm font-semibold text-sky-600 hover:underline">← Back to Knowledge Base</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5 animate-fade-in">
      <Link to="/knowledge" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-sky-600">
        <ArrowLeft className="h-4 w-4" /> Knowledge Base
      </Link>

      <article className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
              {kbCategoryLabel(article.category)}
            </span>
            <h1 className="mt-3 text-2xl font-bold text-slate-800">{article.title}</h1>
            <p className="mt-1.5 text-sm text-slate-400">
              Updated {formatDate(article.updatedAt)} · {article.views} views
              {!article.isPublished && " · Draft"}
            </p>
          </div>
          {isStaff && (
            <Link to={`/knowledge/${article._id}/edit`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:text-sky-600">
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          )}
        </div>
        <div className="mt-6 whitespace-pre-wrap leading-relaxed text-slate-700">{article.content}</div>
      </article>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
        {solved ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <ThumbsUp className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="font-bold text-slate-800">Glad we could help!</p>
            <p className="text-sm text-slate-400">If you need more help, you can always create a ticket.</p>
          </div>
        ) : (
          <>
            <p className="font-bold text-slate-800">Did this article solve your problem?</p>
            <p className="mt-1 text-sm text-slate-400">Your feedback helps us improve our knowledge base</p>
            <div className="mt-5 flex justify-center gap-3">
              <button onClick={() => setSolved(true)}
                className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-sky-600 hover:to-indigo-700">
                Yes, thanks!
              </button>
              <Link to={`/tickets/new?category=${ticketCategoryFor(article.category)}`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:text-sky-600">
                <Ticket className="h-4 w-4" /> Create a ticket
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
