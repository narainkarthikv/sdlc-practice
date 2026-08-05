import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import AuthScreen from "./features/auth/AuthScreen";
import Dashboard from "./features/dashboard/Dashboard";
import { logout } from "./features/auth/authSlice";

function App() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const sessionId = useAppSelector((state) => state.auth.sessionId);
  const expiresAt = useAppSelector((state) => state.auth.expiresAt);

  useEffect(() => {
    if (!sessionId || !expiresAt) return undefined;
    const remaining = Date.parse(expiresAt) - Date.now();
    if (remaining <= 0) {
      dispatch(logout());
      return undefined;
    }
    const timeout = window.setTimeout(() => dispatch(logout()), remaining);
    return () => window.clearTimeout(timeout);
  }, [dispatch, expiresAt, sessionId]);

  useEffect(() => {
    const handleExpired = () => dispatch(logout());
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, [dispatch]);

  return currentUser ? <Dashboard /> : <AuthScreen />;
}

export default App;
