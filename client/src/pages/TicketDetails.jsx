import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Paperclip, Send, X, ChevronDown } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { PRIORITIES, STATUS_STYLES, categoryLabel } from "../lib/constants";
import { formatDateTime, formatSize } from "../lib/format";
import StatusBadge from "../components/StatusBadge";
import Attachment from "../components/Attachment";

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const describeActivity = (a) => {
  switch (a.action) {
    case "created":
      return "Ticket created";
    case "status_changed":
      return `Status changed from ${a.details.replace(/_/g, " ")}`;
    case "assigned":
      return a.details;
    case "unassigned":
      return "Ticket unassigned";
    default:
      return a.details || a.action.replace(/_/g, " ");
  }
};

export default function TicketDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [updating, setUpdating] = useState(false);
const [actionError, setActionError] = useState("");

const isStaff = user.role === "it_support" || user.role === "admin";

const refreshActivity = async () => {
  const { data } = await api.get(`/tickets/${id}/activity`);
  setActivity(data);
};

const changeStatus = async (e) => {
  setActionError("");
  setUpdating(true);
  try {
    const { data } = await api.patch(`/tickets/${id}/status`, { status: e.target.value });
    setTicket(data);
    await refreshActivity();
  } catch (err) {
    setActionError(err.response?.data?.message || "Could not update the status");
  } finally {
    setUpdating(false);
  }
};

const assignTo = async (assignedTo) => {
  setActionError("");
  setUpdating(true);
  try {
    const { data } = await api.patch(`/tickets/${id}/assign`, { assignedTo });
    setTicket(data);
    await refreshActivity();
  } catch (err) {
    setActionError(err.response?.data?.message || "Could not update the assignment");
  } finally {
    setUpdating(false);
  }
};

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");

    Promise.all([
      api.get(`/tickets/${id}`),
      api.get(`/tickets/${id}/comments`),
      api.get(`/tickets/${id}/activity`),
    ])
      .then(([t, c, a]) => {
        if (ignore) return;
        setTicket(t.data);
        setComments(c.data);
        setActivity(a.data);
      })
      .catch((err) => {
        if (!ignore) setError(err.response?.data?.message || "Could not load this request");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files);
    e.target.value = "";

    const all = [...files, ...picked];
    if (all.length > MAX_FILES) return setReplyError(`You can attach up to ${MAX_FILES} files`);
    if (all.some((f) => f.size > MAX_FILE_SIZE)) return setReplyError("Each file must be 5 MB or smaller");

    setReplyError("");
    setFiles(all);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const sendReply = async (e) => {
    e.preventDefault();
    setReplyError("");

    if (!message.trim() && files.length === 0) return;

    setSending(true);
    try {
      const body = new FormData();
      body.append("message", message.trim());
      files.forEach((f) => body.append("attachments", f));

      const { data } = await api.post(`/tickets/${id}/comments`, body);
      setComments((prev) => [...prev, data]);
      setMessage("");
      setFiles([]);
    } catch (err) {
      setReplyError(err.response?.data?.message || "Could not send your reply");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <p className="rounded-2xl bg-white p-6 text-slate-500 shadow-sm">Loading...</p>;
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-red-600">{error}</p>
        <Link to="/requests" className="mt-4 inline-block font-medium text-blue-600 hover:underline">
          Back to My Requests
        </Link>
      </div>
    );
  }

  // The original description is shown as the first message of the conversation
  const messages = [
    {
      _id: "original",
      author: ticket.createdBy,
      message: ticket.description,
      attachments: [],
      createdAt: ticket.createdAt,
    },
    ...comments,
  ];

  const priority = PRIORITIES.find((p) => p.value === ticket.priority)?.label ?? ticket.priority;
  const history = activity.filter((a) => a.action !== "commented");

  return (
    <div className="mx-auto max-w-3xl">
      <Link
  to={isStaff ? "/queue" : "/requests"}
  className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-600"
>
  <ArrowLeft className="h-4 w-4" /> {isStaff ? "All Tickets" : "My Requests"}
</Link>
      <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{ticket.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              #{ticket.ticketNumber} &middot; {categoryLabel(ticket.category)} &middot; {priority} priority
            </p>
          </div>
          <StatusBadge status={ticket.status} />
        </div>
        <p className="mt-3 text-sm text-slate-500">
          {ticket.assignedTo ? `Assigned to ${ticket.assignedTo.name}` : "Waiting to be assigned"}
        </p>
      </div>

      {isStaff && (
  <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
    <p className="font-semibold text-slate-800">Manage this ticket</p>
    <p className="mt-1 text-sm text-slate-500">
      Requested by {ticket.createdBy.name} ({ticket.createdBy.email})
      {ticket.createdBy.department ? `, ${ticket.createdBy.department}` : ""}
    </p>

    {actionError && (
      <div className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{actionError}</div>
    )}

    <div className="mt-4 flex flex-wrap items-end gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
        <select
          value={ticket.status}
          onChange={changeStatus}
          disabled={updating}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 disabled:opacity-60"
        >
          {Object.entries(STATUS_STYLES).map(([value, s]) => (
            <option key={value} value={value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {ticket.assignedTo?._id === user._id ? (
        <button
          type="button"
          disabled={updating}
          onClick={() => assignTo(null)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
        >
          Unassign me
        </button>
      ) : (
        <button
          type="button"
          disabled={updating}
          onClick={() => assignTo(user._id)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          Assign to me
        </button>
      )}
    </div>
  </div>
)}

      <div className="mt-6 space-y-4">
        {messages.map((m) => {
          const mine = m.author._id === user._id;
          const staff = m.author.role === "it_support" || m.author.role === "admin";
          const name = mine ? "You" : staff ? `${m.author.name} (IT Support)` : m.author.name;

          return (
            <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  mine ? "bg-blue-600 text-white" : "bg-white text-slate-800 shadow-sm"
                }`}
              >
                <p className={`text-xs font-medium ${mine ? "text-blue-100" : "text-slate-500"}`}>
                  {name} &middot; {formatDateTime(m.createdAt)}
                </p>
                {m.message && <p className="mt-1 whitespace-pre-wrap">{m.message}</p>}
                {m.attachments.map((file) => (
                  <Attachment key={file.filename} file={file} mine={mine} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {ticket.status === "closed" ? (
        <p className="mt-6 rounded-2xl bg-slate-100 p-4 text-center text-sm text-slate-500">
          This request is closed. Create a new request if you need more help.
        </p>
      ) : (
        <form onSubmit={sendReply} className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
          {replyError && (
            <div className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{replyError}</div>
          )}

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Write a reply..."
            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          {files.length > 0 && (
            <ul className="mt-3 space-y-2">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600"
                >
                  <span className="truncate">
                    {f.name} ({formatSize(f.size)})
                  </span>
                  <button type="button" onClick={() => removeFile(i)} aria-label="Remove file">
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex items-center justify-between">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-500 hover:text-blue-600">
              <Paperclip className="h-4 w-4" /> Attach
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,application/pdf,text/plain"
                onChange={handleFiles}
                className="sr-only"
              />
            </label>
            <button
              type="submit"
              disabled={sending || (!message.trim() && files.length === 0)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send"} <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex w-full items-center justify-between text-left font-medium text-slate-800"
        >
          Ticket history
          <ChevronDown className={`h-5 w-5 text-slate-400 transition ${showHistory ? "rotate-180" : ""}`} />
        </button>

        {showHistory && (
          <ul className="mt-4 space-y-3 border-l-2 border-slate-100 pl-4">
            {history.map((a) => (
              <li key={a._id}>
                <p className="text-sm text-slate-700">{describeActivity(a)}</p>
                <p className="text-xs text-slate-400">
                  {a.actor.name} &middot; {formatDateTime(a.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}