import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Paperclip, CheckCircle2 } from "lucide-react";
import api from "../api/axios";
import { CATEGORIES, PRIORITIES, categoryLabel } from "../lib/constants";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-3 focus:ring-sky-100";

const emptyForm = { title: "", description: "", priority: "medium" };

export default function CreateTicket() {
  const [searchParams] = useSearchParams();
  const fromUrl = searchParams.get("category");
  const initialCategory = CATEGORIES.some((c) => c.value === fromUrl) ? fromUrl : "";

  const [step, setStep] = useState(initialCategory ? 2 : 1);
  const [category, setCategory] = useState(initialCategory);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);
  const [uploadFailed, setUploadFailed] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = (e) => {
    const picked = e.target.files[0];
    if (!picked) return setFile(null);
    if (picked.size > MAX_FILE_SIZE) { e.target.value = ""; setFile(null); return setError("The file must be 5 MB or smaller"); }
    setError(""); setFile(picked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (!form.title.trim() || !form.description.trim()) return setError("Please fill in both the summary and the description");
    setLoading(true);
    try {
      const { data: ticket } = await api.post("/tickets", { ...form, category });
      if (file) {
        try {
          const body = new FormData();
          body.append("message", "Screenshot attached");
          body.append("attachments", file);
          await api.post(`/tickets/${ticket._id}/comments`, body);
        } catch { setUploadFailed(true); }
      }
      setCreated(ticket);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create the ticket. Please try again.");
    } finally { setLoading(false); }
  };

  const reset = () => { setStep(1); setCategory(""); setForm(emptyForm); setFile(null); setError(""); setCreated(null); setUploadFailed(false); };

  if (created) {
    return (
      <div className="mx-auto max-w-xl animate-fade-in">
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Request submitted!</h1>
          <p className="mt-2 text-slate-500">
            Your ticket number is{" "}
            <span className="font-bold text-slate-800">#{created.ticketNumber}</span>.
            Our IT team will get back to you soon.
          </p>
          {uploadFailed && (
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700 ring-1 ring-amber-200">
              Your ticket was created, but the screenshot could not be uploaded.
            </p>
          )}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/" className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-2.5 font-semibold text-white shadow-md transition hover:from-sky-600 hover:to-indigo-700">
              Back to home
            </Link>
            <button onClick={reset} className="rounded-xl border border-slate-200 px-6 py-2.5 font-semibold text-slate-600 transition hover:bg-slate-50">
              Create another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      {/* Progress */}
      <div className="mb-6 flex items-center gap-3">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold transition ${
              step >= s ? "bg-sky-600 text-white shadow-md shadow-sky-500/30" : "bg-slate-100 text-slate-400"
            }`}>
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            <span className={`text-sm font-semibold ${step >= s ? "text-slate-800" : "text-slate-400"}`}>
              {s === 1 ? "Category" : "Details"}
            </span>
            {s < 2 && <div className={`h-0.5 w-12 rounded ${step > s ? "bg-sky-500" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <h1 className="text-2xl font-bold text-slate-800">What do you need help with?</h1>
          <p className="mt-1 text-slate-500 text-sm">Choose a category to get started</p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const selected = category === cat.value;
              return (
                <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                  className={`flex items-center gap-4 rounded-2xl border-2 bg-white p-5 text-left transition ${
                    selected
                      ? "border-sky-500 bg-sky-50 shadow-md shadow-sky-500/15"
                      : "border-slate-100 shadow-sm hover:border-sky-200 hover:shadow-md"
                  }`}>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition ${
                    selected ? "bg-sky-500 text-white" : "bg-gradient-to-br from-sky-50 to-indigo-50 text-sky-600"
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{cat.label}</p>
                    <p className="text-sm text-slate-500">{cat.hint}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-end">
            <button type="button" disabled={!category} onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:from-sky-600 hover:to-indigo-700 disabled:opacity-50">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit}>
          <h1 className="text-2xl font-bold text-slate-800">Tell us about the problem</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <span>Category: <strong className="text-slate-700">{categoryLabel(category)}</strong></span>
            <button type="button" onClick={() => setStep(1)} className="font-semibold text-sky-600 hover:underline">Change</button>
          </div>

          {error && <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{error}</div>}

          <div className="mt-6 space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Short summary</label>
              <input name="title" value={form.title} onChange={handleChange} maxLength={150}
                placeholder="E.g. Laptop cannot connect to WiFi" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">What is happening?</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={5}
                placeholder="Describe the problem and when it started" className={inputClass} />
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-700">How urgent is this?</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PRIORITIES.map((p) => (
                  <label key={p.value}
                    className={`cursor-pointer rounded-xl border-2 p-3 text-center text-sm transition ${
                      form.priority === p.value
                        ? "border-sky-500 bg-sky-50 text-sky-700"
                        : "border-slate-100 text-slate-600 hover:border-sky-200"
                    }`}>
                    <input type="radio" name="priority" value={p.value} checked={form.priority === p.value} onChange={handleChange} className="sr-only" />
                    <span className="block font-bold">{p.label}</span>
                    <span className="block text-xs mt-0.5 text-slate-400">{p.hint}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Add a screenshot (optional)</label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 px-4 py-3.5 text-sm text-slate-500 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600">
                <Paperclip className="h-4 w-4" />
                <span>{file ? file.name : "Choose an image, PDF or text file (max 5 MB)"}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf,text/plain" onChange={handleFile} className="sr-only" />
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button type="button" onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-6 py-2.5 font-semibold text-slate-600 transition hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button type="submit" disabled={loading}
              className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:from-sky-600 hover:to-indigo-700 disabled:opacity-60">
              {loading ? "Submitting…" : "Submit Ticket"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
