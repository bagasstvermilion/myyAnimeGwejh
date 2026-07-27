import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Private() {
  const { role } = useAuth();

  if (role !== "admin") {
    return <Navigate to="/admin/overview" replace />;
  }

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-zinc-900">
        Private
      </h2>
      <p className="mt-1 max-w-md text-sm text-zinc-500">
        Penyimpanan API, anon, dan public key.
      </p>
    </div>
  );
}
