import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:text-blue-600"
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isStaff = user.role === "it_support" || user.role === "admin";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-xl font-bold text-blue-600">HelpDesk</span>
          <nav className="flex items-center gap-1">
            {isStaff ? (
              <>
                <NavLink to="/" end className={linkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/queue" className={linkClass}>
                  All Tickets
                </NavLink>
                <NavLink to="/knowledge" className={linkClass}>
                  Knowledge Base
                </NavLink>
                {user.role === "admin" && (
                  <NavLink to="/users" className={linkClass}>
                    Users
                  </NavLink>
                )}
              </>
            ) : (
              <>
                <NavLink to="/" end className={linkClass}>
                  Home
                </NavLink>
                <NavLink to="/requests" className={linkClass}>
                  My Requests
                </NavLink>
                <NavLink to="/knowledge" className={linkClass}>
                  Knowledge Base
                </NavLink>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-800">{user.name}</p>
            <p className="text-xs capitalize text-slate-500">
              {user.role.replace("_", " ")}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}