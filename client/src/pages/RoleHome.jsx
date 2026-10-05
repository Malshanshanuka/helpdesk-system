import { useAuth } from "../context/AuthContext";
import Home from "./Home";
import AgentDashboard from "./AgentDashboard";

export default function RoleHome() {
  const { user } = useAuth();
  return user.role === "employee" ? <Home /> : <AgentDashboard />;
}