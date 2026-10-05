import { Monitor, Wifi, KeyRound, Mail, AppWindow, LifeBuoy, ShieldCheck } from "lucide-react";

// Values must match the category enum in the backend Ticket model
export const CATEGORIES = [
  { value: "computer", label: "Computer & Hardware", hint: "Laptop, desktop, printer", icon: Monitor },
  { value: "network", label: "Network & Internet", hint: "WiFi, VPN, internet", icon: Wifi },
  { value: "account", label: "Account & Password", hint: "Login, password reset", icon: KeyRound },
  { value: "email", label: "Email", hint: "Outlook, mailbox", icon: Mail },
  { value: "software", label: "Software", hint: "Install, errors, licences", icon: AppWindow },
  { value: "other", label: "Something else", hint: "Anything not listed", icon: LifeBuoy },
];

// Values must match the priority enum in the backend Ticket model
export const PRIORITIES = [
  { value: "low", label: "Low", hint: "Not urgent" },
  { value: "medium", label: "Normal", hint: "Affects my work a little" },
  { value: "high", label: "High", hint: "I cannot work properly" },
  { value: "critical", label: "Critical", hint: "Work is completely blocked" },
];

export const STATUS_STYLES = {
  open: { label: "Open", badge: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  in_progress: { label: "In Progress", badge: "bg-orange-50 text-orange-700", dot: "bg-orange-500" },
  resolved: { label: "Resolved", badge: "bg-green-50 text-green-700", dot: "bg-green-500" },
  closed: { label: "Closed", badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
};

export const categoryLabel = (value) =>
  CATEGORIES.find((c) => c.value === value)?.label ?? value;

// Values must match ARTICLE_CATEGORIES in the backend Article model
export const KB_CATEGORIES = [
  { value: "computer", label: "Computer", icon: Monitor },
  { value: "network", label: "Network", icon: Wifi },
  { value: "email", label: "Email", icon: Mail },
  { value: "account", label: "Accounts", icon: KeyRound },
  { value: "software", label: "Software", icon: AppWindow },
  { value: "security", label: "Security", icon: ShieldCheck },
];

export const kbCategoryLabel = (value) =>
  KB_CATEGORIES.find((c) => c.value === value)?.label ?? value;

// Article category to the closest ticket category
export const ticketCategoryFor = (kbCategory) =>
  kbCategory === "security" ? "other" : kbCategory;