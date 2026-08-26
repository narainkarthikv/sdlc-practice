import { useEffect, useState, type FormEvent } from "react";
import { useAppDispatch } from "../../app/hooks";
import { useTheme } from "../../theme/ThemeProvider";
import { Button } from "../../components/ui/Button";
import {
  AlertIcon,
  ArrowIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  MoonIcon,
  ShieldIcon,
  SparkIcon,
  SunIcon
} from "../../components/ui/Icon";
import { getMutationErrorMessage } from "../../components/ui/errorMessage";
import { setCredentials } from "./authSlice";
import { useLoginMutation, useSignupMutation } from "./authApi";
import type { LoginInput, SignupInput } from "../../types";

type Mode = "login" | "signup";

const emptyLogin: LoginInput = { email: "", password: "" };
const emptySignup: SignupInput = { displayName: "", email: "", password: "" };

export default function AuthScreen() {
  const dispatch = useAppDispatch();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<Mode>("signup");
  const [loginForm, setLoginForm] = useState<LoginInput>(emptyLogin);
  const [signupForm, setSignupForm] = useState<SignupInput>(emptySignup);
  const [showPassword, setShowPassword] = useState(false);
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
          <div className="auth-feature-row"><div className="auth-feature"><CheckIcon /> Clear task ownership</div><div className="auth-feature"><SparkIcon /> Cue-powered focus</div><div className="auth-feature"><ShieldIcon /> Private by design</div></div>
        </div>
        <div className="auth-quote"><span /> Built for focused teams, not busywork.</div>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-form-top"><div><p className="eyebrow">Welcome to your workspace</p><h2>{mode === "login" ? "Welcome back" : "Start making progress"}</h2><p className="auth-cue-note">Insights and summaries powered by Cue — optimistic, action-focused guidance to keep you moving.</p></div><button type="button" className="icon-button auth-theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>{theme === "light" ? <MoonIcon /> : <SunIcon />}</button></div>
          <div className="auth-toggle" role="tablist" aria-label="Account access"><button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create account</button><button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Log in</button></div>
          <form className="auth-form" onSubmit={mode === "login" ? handleLoginSubmit : handleSignupSubmit}>
            {mode === "signup" ? <label className="auth-field"><span>Display name</span><input placeholder="Ari Morgan" value={signupForm.displayName} onChange={(event) => setSignupForm({ ...signupForm, displayName: event.target.value })} autoComplete="name" required /></label> : null}
            <label className="auth-field"><span>Email address</span><input type="email" placeholder="you@example.com" value={mode === "login" ? loginForm.email : signupForm.email} onChange={(event) => mode === "login" ? setLoginForm({ ...loginForm, email: event.target.value }) : setSignupForm({ ...signupForm, email: event.target.value })} autoComplete="email" required /></label>
            <label className="auth-field password-field"><span>Password</span>
              <div className="password-input-row">
                <input type={showPassword ? "text" : "password"} placeholder="At least 8 characters" value={mode === "login" ? loginForm.password : signupForm.password} onChange={(event) => mode === "login" ? setLoginForm({ ...loginForm, password: event.target.value }) : setSignupForm({ ...signupForm, password: event.target.value })} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required />
                <button type="button" className="icon-button password-toggle" onClick={() => setShowPassword(!showPassword)} aria-pressed={showPassword} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOffIcon /> : <EyeIcon />}</button>
              </div>
            </label>
            <Button type="submit" className="auth-submit" disabled={activeState.isLoading}>{activeState.isLoading ? "Setting things up..." : mode === "login" ? "Continue to workspace" : "Create my workspace"}<ArrowIcon /></Button>
          </form>
          {activeState.error ? <div className="alert alert-error auth-error"><AlertIcon /> <span>{getMutationErrorMessage(activeState.error)}</span></div> : null}
          <p className="auth-switch-copy">{mode === "login" ? "New to Todoist SDLC? Create an account to keep your team moving." : "Already have an account? Log in to pick up where you left off."}</p>
        </div>
      </section>
    </main>
  );
}
