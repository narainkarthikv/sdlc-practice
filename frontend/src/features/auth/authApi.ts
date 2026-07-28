import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { apiBaseUrl } from "../../runtimeConfig";
import type { AuthSession, LoginInput, SignupInput } from "../../types";

function requireBody<T extends object>(body: T | undefined, action: string): T {
  if (!body || typeof body !== "object") {
    throw new Error(`${action} request body is required`);
  }

  return body;
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({ baseUrl: apiBaseUrl }),
  endpoints: (builder) => ({
    signup: builder.mutation<AuthSession, SignupInput>({
      query: (body) => ({
        url: "/auth/signup",
        method: "POST",
        body: requireBody(body, "Signup")
      })
    }),
    login: builder.mutation<AuthSession, LoginInput>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body: requireBody(body, "Login")
      })
    })
  })
});

export const { useLoginMutation, useSignupMutation } = authApi;
