import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-800">Hello, {user.name}</h1>
      <p className="mt-1 text-slate-500">How can we help you today?</p>
    </div>
  );
}