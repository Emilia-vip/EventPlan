import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../errors";
import { loginSchema, parseForm, signupSchema } from "../validation";
import { Icon } from "./Icon";
import { CloseButton, FormError, Overlay, inputClass } from "./ui";

export type AuthMode = "login" | "signup";

type Props = {
  mode: AuthMode;
  onClose: () => void;
};

export function AuthPanel({ mode: initialMode, onClose }: Props) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const isLogin = mode === "login";

  function switchMode() {
    setMode(isLogin ? "signup" : "login");
    setFormError("");
  }

  async function run(action: () => Promise<void>) {
    setSubmitting(true);
    try {
      await action();
      onClose();
    } catch (err) {
      setFormError(errorMessage(err));
      setSubmitting(false);
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const form = new FormData(e.currentTarget);
    if (isLogin) {
      const parsed = parseForm(loginSchema, form);
      if (!parsed.ok) return setFormError(parsed.message);
      await run(() => login(parsed.data));
    } else {
      const parsed = parseForm(signupSchema, form);
      if (!parsed.ok) return setFormError(parsed.message);
      await run(() => signup(parsed.data));
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div className="p-6 sm:p-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#7a5c45]">{isLogin ? "Welcome back" : "Join Meeting Point"}</span>
            <h2 className="font-display text-5xl leading-[0.98] tracking-[-0.035em] text-[#3b2a20]">{isLogin ? "Log in" : "Create account"}</h2>
            <p className="mt-3 text-[#8a7767]">{isLogin ? "Log in to get tickets and see your bookings." : "A free account lets you get tickets and keep track of your bookings."}</p>
          </div>
          <CloseButton onClose={onClose} />
        </div>
        <form className="space-y-4" key={mode} noValidate onSubmit={submit}>
          {!isLogin && (
            <label className="block text-sm font-semibold text-[#4d3b2e]">Name
              <input autoComplete="name" className={inputClass} maxLength={200} name="name" placeholder="First and last name" type="text" />
            </label>
          )}
          <label className="block text-sm font-semibold text-[#4d3b2e]">Email
            <input autoComplete="email" className={inputClass} maxLength={200} name="email" placeholder="name@example.com" type="email" />
          </label>
          <label className="block text-sm font-semibold text-[#4d3b2e]">Password
            <input autoComplete={isLogin ? "current-password" : "new-password"} className={inputClass} maxLength={200} name="password" placeholder={isLogin ? "Your password" : "At least 8 characters"} type="password" />
          </label>
          {formError && <FormError message={formError} />}
          <button className="flex w-full items-center justify-center gap-2 rounded-full bg-[#7a5c45] px-6 py-4 font-semibold text-white transition hover:bg-[#5e4634] disabled:cursor-wait disabled:opacity-70" disabled={submitting} type="submit">
            {submitting ? "Please wait…" : isLogin ? "Log in" : "Create account"} {!submitting && <Icon name="arrow" size={18} />}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[#8a7767]">
          {isLogin ? "New here?" : "Already have an account?"}{" "}
          <button className="font-semibold text-[#7a5c45] underline underline-offset-4 hover:text-[#5e4634]" onClick={switchMode} type="button">
            {isLogin ? "Create an account" : "Log in"}
          </button>
        </p>
      </div>
    </Overlay>
  );
}
