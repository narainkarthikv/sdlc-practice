import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "../features/auth/authApi";
import authReducer, { type AuthState } from "../features/auth/authSlice";

const authStorageKey = "todoist-auth-session";
const loadedAuthState = loadAuthState();

function loadAuthState(): AuthState | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const raw = window.localStorage.getItem(authStorageKey);
    if (!raw) {
      return undefined;
    }

    const parsed = JSON.parse(raw) as AuthState;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !parsed.user ||
      !parsed.sessionId ||
      !parsed.expiresAt ||
      Date.parse(parsed.expiresAt) <= Date.now()
    ) {
      window.localStorage.removeItem(authStorageKey);
      return undefined;
    }

    return parsed;
  } catch {
    return undefined;
  }
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(authApi.middleware),
  preloadedState: loadedAuthState ? { auth: loadedAuthState } : undefined
});

store.subscribe(() => {
  if (typeof window === "undefined") {
    return;
  }

  const state = store.getState().auth;
  if (!state.user) {
    window.localStorage.removeItem(authStorageKey);
    return;
  }

  window.localStorage.setItem(authStorageKey, JSON.stringify(state));
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
