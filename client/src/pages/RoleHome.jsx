import { useAuth } from "../context/AuthContext";
import Home from "./Home";
import AgentDashboard from "./AgentDashboard";
import AdminDashboard from "./AdminDashboard";

export default function RoleHome() {
  const { user } = useAuth();

  if (user.role === "admin") return <AdminDashboard />;
  if (user.role === "it_support") return <AgentDashboard />;
  return <Home />;
}