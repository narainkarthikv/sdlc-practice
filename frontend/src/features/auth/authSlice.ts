import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthSession } from "../../types";

export type AuthState = {
  user: AuthSession["user"] | null;
  sessionId: string | null;
  expiresAt: string | null;
};

const initialState: AuthState = {
  user: null,
  sessionId: null,
  expiresAt: null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthSession>) {
      state.user = action.payload.user;
      state.sessionId = action.payload.sessionId;
      state.expiresAt = action.payload.expiresAt;
    },
    logout(state) {
      state.user = null;
      state.sessionId = null;
      state.expiresAt = null;
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
