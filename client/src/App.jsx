import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import CreateTicket from "./pages/CreateTicket";
import MyRequests from "./pages/MyRequests";
import TicketDetails from "./pages/TicketDetails";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import ComingSoon from "./components/ComingSoon";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/tickets/new" element={<CreateTicket />} />
          <Route path="/requests" element={<MyRequests />} />
          <Route path="/requests/:id" element={<TicketDetails />} />
          <Route path="/knowledge" element={<ComingSoon title="Knowledge Base" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;