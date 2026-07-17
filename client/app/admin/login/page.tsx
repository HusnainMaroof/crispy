"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/admin/use-auth";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, loading } = useAuth();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".login-title", { y: -20, autoAlpha: 0, duration: 0.5 })
      .from(".login-subtitle", { y: -10, autoAlpha: 0, duration: 0.4 }, "-=0.3")
      .from(".login-field", { y: 15, autoAlpha: 0, duration: 0.4, stagger: 0.12 }, "-=0.2")
      .from(".login-btn", { y: 10, autoAlpha: 0, scale: 0.95, duration: 0.4 }, "-=0.15")
      .from(".login-error", { x: -10, autoAlpha: 0, duration: 0.3 }, "-=0.2");
  }, { scope: containerRef });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      router.push("/admin");
    } catch {
      setError("Invalid email or password.");
    }
  };

  return (
    <div ref={containerRef} className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="login-title font-[family-name:var(--font-bebas)] text-4xl uppercase text-white">
            Crispies Admin
          </h1>
          <p className="login-subtitle mt-2 text-sm text-white/50">Sign in to manage your restaurant.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="login-error rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="login-field">
            <label htmlFor="email" className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-white/50">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-brand-red/60 focus:bg-white/[0.05]"
              placeholder="admin@crispies.com"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password" className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-white/50">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 pr-12 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-brand-red/60 focus:bg-white/[0.05]"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Reveal password"}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-btn cursor-pointer flex w-full items-center justify-center gap-2 rounded-full bg-brand-red px-6 py-4 text-xs font-bold uppercase tracking-widest text-white transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
