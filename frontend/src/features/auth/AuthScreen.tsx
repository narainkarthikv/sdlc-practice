import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAppDispatch } from "../../app/hooks";
import { useTheme } from "../../themeContext";
import { setCredentials } from "./authSlice";
import { useLoginMutation, useSignupMutation } from "./authApi";
import type { LoginInput, SignupInput } from "../../types";

type Mode = "login" | "signup";

const emptyLogin: LoginInput = {
  email: "",
  password: ""
};

const emptySignup: SignupInput = {
  displayName: "",
  email: "",
  password: ""
};

function getMutationErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return "Something went wrong";
  }

  if ("data" in error && typeof (error as { data?: unknown }).data === "object") {
    const data = (error as { data?: { message?: unknown } }).data;
    if (data?.message && typeof data.message === "string") {
      return data.message;
    }
  }

  if ("error" in error && typeof (error as { error?: unknown }).error === "string") {
    return (error as { error: string }).error;
  }

  return "Something went wrong";
}

export default function AuthScreen() {
  const dispatch = useAppDispatch();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<Mode>("signup");
  const [loginForm, setLoginForm] = useState<LoginInput>(emptyLogin);
  const [signupForm, setSignupForm] = useState<SignupInput>(emptySignup);
  const [login, loginState] = useLoginMutation();
  const [signup, signupState] = useSignupMutation();
  const activeState = mode === "login" ? loginState : signupState;

  useEffect(() => {
    document.title = mode === "login" ? "Log in" : "Create account";
  }, [mode]);

  const submitLabel = useMemo(
    () => (mode === "login" ? "Log in" : "Create account"),
    [mode]
  );

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await login(loginForm).unwrap();
    dispatch(setCredentials(response));
  }

  async function handleSignupSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await signup(signupForm).unwrap();
    dispatch(setCredentials(response));
  }

  return (
    <main className="theme-transition min-h-screen px-4 py-8 text-slate-900 dark:text-slate-100 light:text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="theme-transition relative overflow-hidden rounded-[2rem] border p-8 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-glow light:border-slate-300 light:bg-slate-50">
          <div className="absolute inset-0 opacity-50">
            <div className="absolute left-0 top-0 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
          </div>

          <div className="relative z-10 flex h-full flex-col justify-between gap-8">
            <div className="max-w-xl">
              <p className="theme-transition text-sm uppercase tracking-[0.35em] dark:text-cyan-300/80 light:text-blue-600/80">
                Todoist SDLC
              </p>
              <h1 className="theme-transition mt-4 text-4xl font-semibold tracking-tight dark:text-white light:text-slate-900 sm:text-5xl">
                One account for tasks, summaries, and the workflow you want to keep moving.
              </h1>
              <p className="theme-transition mt-4 max-w-lg text-sm leading-7 dark:text-slate-300 light:text-slate-600">
                Use a UUID-backed account record, bcrypt password hashing, and a Redux Toolkit auth
                flow that keeps login state predictable on the client.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["UUID identity", "Every account gets a stable server-generated ID."],
                ["Bcrypt hashing", "Passwords are stored as salted hashes."],
                ["RTK mutations", "Auth calls stay isolated and cache-friendly."]
              ].map(([title, body]) => (
                <article
                  key={title}
                  className="theme-transition rounded-2xl border p-4 dark:border-white/10 dark:bg-slate-950/50 light:border-slate-300 light:bg-white/80"
                >
                  <h2 className="text-sm font-semibold dark:text-white light:text-slate-900">
                    {title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 dark:text-slate-300 light:text-slate-600">
                    {body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="theme-transition flex flex-col justify-center rounded-[2rem] border p-6 dark:border-white/10 dark:bg-slate-950/55 dark:shadow-glow light:border-slate-300 light:bg-slate-50 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="theme-transition text-sm uppercase tracking-[0.3em] dark:text-slate-400 light:text-slate-500">
                Account access
              </p>
              <h2 className="theme-transition mt-2 text-2xl font-semibold dark:text-white light:text-slate-900">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-transition flex h-11 w-11 items-center justify-center rounded-full border text-lg dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 light:border-slate-300 light:bg-white light:hover:bg-slate-100"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border p-1 dark:border-white/10 dark:bg-white/5 light:border-slate-300 light:bg-white">
            {(["signup", "login"] as Mode[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  mode === option
                    ? "dark:bg-cyan-400 light:bg-blue-600 light:text-white dark:text-slate-950"
                    : "dark:text-slate-300 light:text-slate-600"
                }`}
              >
                {option === "signup" ? "Sign up" : "Log in"}
              </button>
            ))}
          </div>

          <form
            className="mt-6 grid gap-4"
            onSubmit={mode === "login" ? handleLoginSubmit : handleSignupSubmit}
          >
            {mode === "signup" ? (
              <label className="grid gap-2 text-sm">
                <span className="font-medium dark:text-slate-200 light:text-slate-700">
                  Display name
                </span>
                <input
                  className="theme-transition w-full rounded-2xl border px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-400/50 dark:border-white/10 dark:bg-white/5 dark:text-white light:border-slate-300 light:bg-white light:text-slate-900 light:focus:border-blue-400"
                  placeholder="Ari Morgan"
                  value={signupForm.displayName}
                  onChange={(event) =>
                    setSignupForm({ ...signupForm, displayName: event.target.value })
                  }
                  autoComplete="name"
                  required
                />
              </label>
            ) : null}

            <label className="grid gap-2 text-sm">
              <span className="font-medium dark:text-slate-200 light:text-slate-700">Email</span>
              <input
                type="email"
                className="theme-transition w-full rounded-2xl border px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-400/50 dark:border-white/10 dark:bg-white/5 dark:text-white light:border-slate-300 light:bg-white light:text-slate-900 light:focus:border-blue-400"
                placeholder="you@example.com"
                value={mode === "login" ? loginForm.email : signupForm.email}
                onChange={(event) => {
                  if (mode === "login") {
                    setLoginForm({ ...loginForm, email: event.target.value });
                    return;
                  }

                  setSignupForm({ ...signupForm, email: event.target.value });
                }}
                autoComplete="email"
                required
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium dark:text-slate-200 light:text-slate-700">Password</span>
              <input
                type="password"
                className="theme-transition w-full rounded-2xl border px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-400/50 dark:border-white/10 dark:bg-white/5 dark:text-white light:border-slate-300 light:bg-white light:text-slate-900 light:focus:border-blue-400"
                placeholder="At least 8 characters"
                value={mode === "login" ? loginForm.password : signupForm.password}
                onChange={(event) => {
                  if (mode === "login") {
                    setLoginForm({ ...loginForm, password: event.target.value });
                    return;
                  }

                  setSignupForm({ ...signupForm, password: event.target.value });
                }}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={8}
                required
              />
            </label>

            <button
              type="submit"
              disabled={activeState.isLoading}
              className="theme-transition rounded-2xl px-4 py-3 font-medium text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-400 light:bg-blue-600 light:text-white"
            >
              {activeState.isLoading ? "Working..." : submitLabel}
            </button>
          </form>

          {activeState.error ? (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {getMutationErrorMessage(activeState.error)}
            </div>
          ) : null}

          <p className="mt-5 text-sm leading-6 dark:text-slate-400 light:text-slate-600">
            {mode === "login"
              ? "New here? Switch to sign up and create your account first."
              : "Already have an account? Switch to login and use the same email/password pair."}
          </p>
        </section>
      </div>
    </main>
  );
}
