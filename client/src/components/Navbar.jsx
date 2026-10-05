import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, LayoutDashboard, Ticket, BookOpen, Users, ClipboardList } from "lucide-react";

const NavItem = ({ to, end, icon: Icon, label }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-white/15 text-white shadow-sm"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`
    }
  >
    <Icon className="h-4 w-4" />
    {label}
  </NavLink>
);

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isStaff = user.role === "it_support" || user.role === "admin";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">HelpFlow</span>
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex">
            {isStaff ? (
              <>
                <NavItem to="/" end icon={LayoutDashboard} label="Dashboard" />
                <NavItem to="/queue" icon={ClipboardList} label="All Tickets" />
                <NavItem to="/knowledge" icon={BookOpen} label="Knowledge Base" />
                {user.role === "admin" && (
                  <NavItem to="/users" icon={Users} label="Users" />
                )}
              </>
            ) : (
              <>
                <NavItem to="/" end icon={LayoutDashboard} label="Home" />
                <NavItem to="/requests" icon={Ticket} label="My Requests" />
                <NavItem to="/knowledge" icon={BookOpen} label="Knowledge Base" />
              </>
            )}
          </nav>
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-white">{user.name}</p>
            <p className="text-xs capitalize text-white/60">{user.role.replace("_", " ")}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white ring-2 ring-white/30">
            {initials}
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
