import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RoleHome from "./pages/RoleHome";
import CreateTicket from "./pages/CreateTicket";
import MyRequests from "./pages/MyRequests";
import TicketDetails from "./pages/TicketDetails";
import StaffTickets from "./pages/StaffTickets";
import Users from "./pages/Users";
import KnowledgeBase from "./pages/KnowledgeBase";
import ArticleView from "./pages/ArticleView";
import ManageArticles from "./pages/ManageArticles";
import ArticleEditor from "./pages/ArticleEditor";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<RoleHome />} />
          <Route path="/tickets/new" element={<CreateTicket />} />
          <Route path="/requests" element={<MyRequests />} />
          <Route path="/requests/:id" element={<TicketDetails />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />
          <Route path="/knowledge/:id" element={<ArticleView />} />

          <Route element={<ProtectedRoute roles={["it_support", "admin"]} />}>
            <Route path="/queue" element={<StaffTickets />} />
            <Route path="/knowledge/manage" element={<ManageArticles />} />
            <Route path="/knowledge/new" element={<ArticleEditor />} />
            <Route path="/knowledge/:id/edit" element={<ArticleEditor />} />
          </Route>

          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;