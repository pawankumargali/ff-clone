import { Navigate, Outlet, useLocation } from "react-router";
import { isAuthenticated } from "../../services/auth.service";

export default function PrivateRoute() {
  const location = useLocation();
  return isAuthenticated() ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
}
