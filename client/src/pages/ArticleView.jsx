import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
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
    setLoading(true);
    setError("");
    setSolved(false);

    api
      .get(`/articles/${id}`)
      .then(({ data }) => {
        if (!ignore) setArticle(data);
      })
      .catch((err) => {
        if (!ignore) setError(err.response?.data?.message || "Could not load this article");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) {
    return <p className="rounded-2xl bg-white p-6 text-slate-500 shadow-sm">Loading...</p>;
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-red-600">{error}</p>
        <Link to="/knowledge" className="mt-4 inline-block font-medium text-blue-600 hover:underline">
          Back to Knowledge Base
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/knowledge"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" /> Knowledge Base
      </Link>

      <article className="mt-4 rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-600">{kbCategoryLabel(article.category)}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-800">{article.title}</h1>
            <p className="mt-2 text-sm text-slate-400">
              Updated {formatDate(article.updatedAt)} &middot; {article.views} views
              {!article.isPublished && " \u00b7 Draft"}
            </p>
          </div>
          {isStaff && (
            <Link
              to={`/knowledge/${article._id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          )}
        </div>

        <div className="mt-6 whitespace-pre-wrap leading-relaxed text-slate-700">{article.content}</div>
      </article>

      <div className="mt-6 rounded-2xl bg-white p-6 text-center shadow-sm">
        {solved ? (
          <p className="font-medium text-green-600">Glad we could help.</p>
        ) : (
          <>
            <p className="font-medium text-slate-800">Did this solve your problem?</p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={() => setSolved(true)}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Yes, thanks
              </button>
              <Link
                to={`/tickets/new?category=${ticketCategoryFor(article.category)}`}
                className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                No, create a ticket
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}