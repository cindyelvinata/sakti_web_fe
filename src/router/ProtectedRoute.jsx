import { useSyncExternalStore } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { authStorage } from "@/lib/authStorage";

export default function ProtectedRoute() {
  const location = useLocation();
  const hasAdminSession = useSyncExternalStore(
    authStorage.subscribe,
    authStorage.hasAdminSession,
  );

  if (!hasAdminSession) {
    authStorage.clearSession();
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
