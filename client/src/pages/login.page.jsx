import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AuthFormShell } from "@/features/auth/components/auth-form-shell.jsx";
import { FormField } from "@/features/auth/components/form-field.jsx";
import { signInSchema } from "@/features/auth/schemas/auth.schemas.js";
import { getAuthErrorMessage } from "@/features/auth/utils/auth-error.js";
import { authClient } from "@/lib/auth-client.js";

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 dark:border-slate-700 dark:bg-slate-950";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  async function onSubmit(values) {
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
      rememberMe: values.rememberMe,
    });

    if (error) {
      toast.error(getAuthErrorMessage(error, "Unable to sign in."));
      return;
    }

    toast.success("Signed in successfully.");
    navigate(location.state?.from ?? "/account", { replace: true });
  }

  return (
    <AuthFormShell
      title="Welcome back"
      description="Sign in with your registered email and password."
      footer={
        <>
          New to the league?{" "}
          <Link to="/register" className="font-bold text-amber-600 dark:text-amber-400">
            Create an account
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField id="email" label="Email address" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={inputClassName}
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </FormField>

        <FormField id="password" label="Password" error={errors.password?.message}>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className={`${inputClassName} pr-12`}
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
        </FormField>

        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 accent-amber-500"
            {...register("rememberMe")}
          />
          Keep me signed in
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-black text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? <LoaderCircle className="animate-spin" size={19} /> : null}
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthFormShell>
  );
}
