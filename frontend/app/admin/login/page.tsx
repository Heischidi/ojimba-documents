"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { authApi, ApiError } from "@/lib/api";
import { Lock, Loader2, Package2, Eye, EyeOff, ShieldCheck } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await authApi.login(data.email, data.password);
      toast.success("Welcome back!");
      router.push("/admin");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Login failed.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 flex-col items-center justify-center p-12">
        <div className="max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-6">
            <Package2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">DigiStore</h1>
          <p className="text-gray-400 leading-relaxed">
            Manage your digital products, track orders, and monitor revenue from
            one place.
          </p>

          <div className="mt-12 space-y-4 text-left">
            {[
              "Full product management",
              "Real-time order tracking",
              "Secure file delivery",
              "Customer management",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm text-gray-400">
                <ShieldCheck className="w-4 h-4 text-brand-500 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
              <Package2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-xl">DigiStore</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Sign in to your account
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Admin access only. Unauthorized logins are monitored.
            </p>
          </div>

          <div className="card-elevated p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="label" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@example.com"
                  className={`input ${errors.email ? "input-error" : ""}`}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="field-error">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`input pr-10 ${errors.password ? "input-error" : ""}`}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="field-error">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 justify-center text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Signing in…
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Sign In
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            <Link href="/" className="hover:text-gray-600 transition-colors">
              ← Back to storefront
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
