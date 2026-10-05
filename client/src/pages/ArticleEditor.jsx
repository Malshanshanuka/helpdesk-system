import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../api/axios";
import { KB_CATEGORIES } from "../lib/constants";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function ArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);

  const [form, setForm] = useState({
    title: "",
    summary: "",
    content: "",
    category: "computer",
    isPublished: true,
  });
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editing) return;

    let ignore = false;

    api
      .get(`/articles/${id}`, { params: { track: false } })
      .then(({ data }) => {
        if (ignore) return;
        setForm({
          title: data.title,
          summary: data.summary,
          content: data.content,
          category: data.category,
          isPublished: data.isPublished,
        });
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
  }, [id, editing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (editing) {
        await api.patch(`/articles/${id}`, form);
      } else {
        await api.post("/articles", form);
      }
      navigate("/knowledge/manage");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save the article");
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="rounded-2xl bg-white p-6 text-slate-500 shadow-sm">Loading...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/knowledge/manage"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" /> Manage articles
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-slate-800">{editing ? "Edit article" : "New article"}</h1>

      {error && <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
          <input name="title" value={form.title} onChange={handleChange} maxLength={150} className={inputClass} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Short summary</label>
          <input name="summary" value={form.summary} onChange={handleChange} maxLength={300} className={inputClass} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
          <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
            {KB_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Content</label>
          <textarea
            name="content"
            value={form.content}
            onChange={handleChange}
            rows={14}
            placeholder="Write the steps clearly. Line breaks are kept as you type them."
            className={inputClass}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="isPublished" checked={form.isPublished} onChange={handleChange} />
          Published (employees can see it). Untick to save as a draft.
        </label>

        <div className="flex justify-end gap-3">
          <Link
            to="/knowledge/manage"
            className="rounded-lg border border-slate-200 px-5 py-2.5 font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save article"}
          </button>
        </div>
      </form>
    </div>
  );
}