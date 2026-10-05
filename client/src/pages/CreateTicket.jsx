import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Paperclip } from "lucide-react";
import api from "../api/axios";
import { CATEGORIES, PRIORITIES, categoryLabel } from "../lib/constants";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (e) => {
    const picked = e.target.files[0];
    if (!picked) return setFile(null);

    if (picked.size > MAX_FILE_SIZE) {
      e.target.value = "";
      setFile(null);
      return setError("The file must be 5 MB or smaller");
    }

    setError("");
    setFile(picked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim() || !form.description.trim()) {
      return setError("Please fill in both the summary and the description");
    }

    setLoading(true);
    try {
      const { data: ticket } = await api.post("/tickets", { ...form, category });

      if (file) {
        try {
          const body = new FormData();
          body.append("message", "Screenshot attached");
          body.append("attachments", file);
          await api.post(`/tickets/${ticket._id}/comments`, body);
        } catch {
          // The ticket exists already, so only the attachment is reported as failed
          setUploadFailed(true);
        }
      }

      setCreated(ticket);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create the ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setCategory("");
    setForm(emptyForm);
    setFile(null);
    setError("");
    setCreated(null);
    setUploadFailed(false);
  };

  if (created) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
          <Check className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-800">Request submitted</h1>
        <p className="mt-2 text-slate-500">
          Your ticket number is <span className="font-semibold text-slate-800">#{created.ticketNumber}</span>.
          Our IT team will get back to you soon.
        </p>

        {uploadFailed && (
          <p className="mt-4 rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-700">
            Your ticket was created, but the screenshot could not be uploaded.
          </p>
        )}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700">
            Back to home
          </Link>
          <button
            onClick={reset}
            className="rounded-lg border border-slate-200 px-5 py-2.5 font-medium text-slate-600 hover:bg-slate-50"
          >
            Create another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium text-blue-600">Step {step} of 2</p>

      {step === 1 && (
        <div className="mt-2">
          <h1 className="text-2xl font-bold text-slate-800">What do you need help with?</h1>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const selected = category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex items-center gap-4 rounded-2xl border-2 bg-white p-5 text-left transition ${
                    selected ? "border-blue-600 bg-blue-50" : "border-transparent shadow-sm hover:border-slate-200"
                  }`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{cat.label}</p>
                    <p className="text-sm text-slate-500">{cat.hint}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              disabled={!category}
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="mt-2">
          <h1 className="text-2xl font-bold text-slate-800">Tell us about the problem</h1>

          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <span>Category: {categoryLabel(category)}</span>
            <button type="button" onClick={() => setStep(1)} className="font-medium text-blue-600 hover:underline">
              Change
            </button>
          </div>

          {error && <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

          <div className="mt-6 space-y-5 rounded-2xl bg-white p-6 shadow-sm">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Short summary</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                maxLength={150}
                placeholder="For example: Laptop cannot connect to WiFi"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">What is happening?</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="Describe the problem and when it started"
                className={inputClass}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">How urgent is this?</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PRIORITIES.map((p) => (
                  <label
                    key={p.value}
                    className={`cursor-pointer rounded-lg border-2 p-3 text-center text-sm transition ${
                      form.priority === p.value
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={p.value}
                      checked={form.priority === p.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="block font-medium">{p.label}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {PRIORITIES.find((p) => p.value === form.priority)?.hint}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Add a screenshot (optional)</label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50">
                <Paperclip className="h-4 w-4" />
                <span>{file ? file.name : "Choose an image, PDF or text file (max 5 MB)"}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf,text/plain"
                  onChange={handleFile}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 font-medium text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Ticket"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}