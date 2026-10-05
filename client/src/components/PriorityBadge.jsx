const STYLES = {
  low:      "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  medium:   "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  high:     "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  critical: "bg-red-50 text-red-700 ring-1 ring-red-200",
};
const LABELS = { low: "Low", medium: "Normal", high: "High", critical: "Critical" };

export default function PriorityBadge({ priority }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STYLES[priority] ?? STYLES.medium}`}>
      {LABELS[priority] ?? priority}
    </span>
  );
}
