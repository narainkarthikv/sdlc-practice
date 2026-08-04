import { useEffect, useState, type FormEvent } from "react";
import { useAppDispatch } from "../../app/hooks";
import { useTheme } from "../../theme/ThemeProvider";
import { Button } from "../../components/ui/Button";
import { setCredentials } from "./authSlice";
import { useLoginMutation, useSignupMutation } from "./authApi";
import type { LoginInput, SignupInput } from "../../types";

type Mode = "login" | "signup";

const emptyLogin: LoginInput = { email: "", password: "" };
const emptySignup: SignupInput = { displayName: "", email: "", password: "" };

function getMutationErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") return "Something went wrong";
  if ("data" in error && typeof (error as { data?: unknown }).data === "object") {
    const data = (error as { data?: { message?: unknown } }).data;
    if (typeof data?.message === "string") return data.message;
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
    document.title = `${mode === "login" ? "Log in" : "Create account"} | Todoist SDLC`;
  }, [mode]);

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch(setCredentials(await login(loginForm).unwrap()));
  }

  async function handleSignupSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch(setCredentials(await signup(signupForm).unwrap()));
  }

  return (
    <main className="auth-shell theme-transition">
      <section className="auth-showcase">
        <div className="auth-grid" />
        <div className="auth-brand"><div className="brand-mark"><CheckIcon /></div><div><strong>Todoist</strong><span>SDLC workspace</span></div></div>
        <div className="auth-hero">
          <p className="eyebrow">A calmer way to ship</p>
          <h1>Make progress visible.</h1>
          <p>Bring your tasks, momentum, and next best actions into one focused workspace built for teams that care about getting work over the line.</p>
          <div className="auth-feature-row"><div className="auth-feature"><CheckIcon /> Clear task ownership</div><div className="auth-feature"><SparkIcon /> AI-powered focus</div><div className="auth-feature"><ShieldIcon /> Private by design</div></div>
        </div>
        <div className="auth-quote"><span /> Built for focused teams, not busywork.</div>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-form-top"><div><p className="eyebrow">Welcome to your workspace</p><h2>{mode === "login" ? "Welcome back" : "Start making progress"}</h2></div><button type="button" className="icon-button auth-theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>{theme === "light" ? <MoonIcon /> : <SunIcon />}</button></div>
          <div className="auth-toggle" role="tablist" aria-label="Account access"><button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create account</button><button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Log in</button></div>
          <form className="auth-form" onSubmit={mode === "login" ? handleLoginSubmit : handleSignupSubmit}>
            {mode === "signup" ? <label className="auth-field"><span>Display name</span><input placeholder="Ari Morgan" value={signupForm.displayName} onChange={(event) => setSignupForm({ ...signupForm, displayName: event.target.value })} autoComplete="name" required /></label> : null}
            <label className="auth-field"><span>Email address</span><input type="email" placeholder="you@example.com" value={mode === "login" ? loginForm.email : signupForm.email} onChange={(event) => mode === "login" ? setLoginForm({ ...loginForm, email: event.target.value }) : setSignupForm({ ...signupForm, email: event.target.value })} autoComplete="email" required /></label>
            <label className="auth-field"><span>Password</span><input type="password" placeholder="At least 8 characters" value={mode === "login" ? loginForm.password : signupForm.password} onChange={(event) => mode === "login" ? setLoginForm({ ...loginForm, password: event.target.value }) : setSignupForm({ ...signupForm, password: event.target.value })} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required /></label>
            <Button type="submit" className="auth-submit" disabled={activeState.isLoading}>{activeState.isLoading ? "Setting things up..." : mode === "login" ? "Continue to workspace" : "Create my workspace"}<ArrowIcon /></Button>
          </form>
          {activeState.error ? <div className="alert alert-error auth-error"><AlertIcon /> <span>{getMutationErrorMessage(activeState.error)}</span></div> : null}
          <p className="auth-switch-copy">{mode === "login" ? "New to Todoist SDLC? Create an account to keep your team moving." : "Already have an account? Log in to pick up where you left off."}</p>
        </div>
      </section>
    </main>
  );
}

function Icon({ children }: { children: React.ReactNode }) { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>; }
const CheckIcon = () => <Icon><path d="m5 12 4 4L19 6" /></Icon>;
const SparkIcon = () => <Icon><path d="m12 3-1.5 5.5L5 10l5.5 1.5L12 17l1.5-5.5L19 10l-5.5-1.5L12 3Z" /></Icon>;
const ShieldIcon = () => <Icon><path d="M12 3 4.5 6v5c0 4.8 3.1 8.2 7.5 10 4.4-1.8 7.5-5.2 7.5-10V6L12 3Z" /><path d="m9 12 2 2 4-4" /></Icon>;
const ArrowIcon = () => <Icon><path d="M5 12h14M13 6l6 6-6 6" /></Icon>;
const AlertIcon = () => <Icon><path d="M12 4 3 20h18L12 4Z" /><path d="M12 10v4M12 17h.01" /></Icon>;
const MoonIcon = () => <Icon><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" /></Icon>;
const SunIcon = () => <Icon><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Icon>;
