import { STATUS_STYLES } from "../lib/constants";

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.open;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}