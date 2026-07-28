import { useAppSelector } from "./app/hooks";
import AuthScreen from "./features/auth/AuthScreen";
import Dashboard from "./features/dashboard/Dashboard";

function App() {
  const currentUser = useAppSelector((state) => state.auth.user);

  return currentUser ? <Dashboard /> : <AuthScreen />;
}

export default App;
