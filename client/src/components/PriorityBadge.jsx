const STYLES = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-orange-50 text-orange-700",
  critical: "bg-red-50 text-red-700",
};

const LABELS = { low: "Low", medium: "Normal", high: "High", critical: "Critical" };

export default function PriorityBadge({ priority }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        STYLES[priority] ?? STYLES.medium
      }`}
    >
      {LABELS[priority] ?? priority}
    </span>
  );
}