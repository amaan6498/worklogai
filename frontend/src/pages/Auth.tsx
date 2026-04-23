import React, { useState, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertTriangle, ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup" | "verify" | "forgot" | "reset">(
    (searchParams.get("mode") as "login" | "signup" | "verify" | "forgot" | "reset") || "login"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSlowMessage, setShowSlowMessage] = useState(false);
  const navigate = useNavigate();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowSlowMessage(false);

    timeoutRef.current = setTimeout(() => {
      setShowSlowMessage(true);
    }, 10000);

    try {
      if (mode === "login") {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("token", data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        toast.success("Welcome back");
        navigate("/dashboard");
      } else if (mode === "signup") {
        const { data } = await api.post("/auth/signup", { name, email, password });
        toast.success(data.message || "OTP sent to your email");
        setMode("verify");
      } else if (mode === "verify") {
        const { data } = await api.post("/auth/verify-otp", { email, otp });
        localStorage.setItem("token", data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        toast.success("Account verified successfully");
        navigate("/dashboard");
      } else if (mode === "forgot") {
        const { data } = await api.post("/auth/forgot-password", { email });
        toast.success(data.message || "Recovery email sent");
        setMode("reset");
      } else if (mode === "reset") {
        const { data } = await api.post("/auth/reset-password", { email, otp, newPassword: password });
        toast.success(data.message || "Password reset successful");
        setMode("login");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setLoading(false);
      setShowSlowMessage(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <Card className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 border-none shadow-2xl rounded-3xl relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 md:hidden text-muted-foreground hover:text-foreground rounded-full"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold tracking-tight uppercase tracking-widest text-xs mb-2">
            WorkLog <span className="text-primary font-bold italic lowercase text-2xl">ai</span>
          </h1>
          <p className="text-sm text-zinc-400 font-light">Minimalist productivity tracking.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1">
              <Input
                type="text"
                placeholder="Full Name"
                className="bg-zinc-100 dark:bg-zinc-800 border-none h-12 rounded-xl focus-visible:ring-primary"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          {(mode === "signup" || mode === "login" || mode === "forgot") && (
            <div className="space-y-1">
              <Input
                type="email"
                placeholder="Email address"
                className="bg-zinc-100 dark:bg-zinc-800 border-none h-12 rounded-xl focus-visible:ring-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          {(mode === "verify" || mode === "reset") && (
            <div className="space-y-1">
              <p className="text-xs text-zinc-500 mb-2 pl-1">
                {mode === "verify" ? `Enter OTP sent to ${email}` : `Enter reset OTP sent to ${email}`}
              </p>
              <Input
                type="text"
                placeholder="6-Digit OTP"
                className="bg-zinc-100 dark:bg-zinc-800 border-none h-12 rounded-xl focus-visible:ring-primary tracking-widest text-center"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
              />
              {mode === "verify" && (
                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const { data } = await api.post("/auth/resend-otp", { email });
                        toast.success(data.message || "OTP resent");
                      } catch (error: unknown) {
                        const err = error as { response?: { data?: { message?: string } } };
                        toast.error(err.response?.data?.message || "Failed to resend OTP");
                      }
                    }}
                    className="text-xs text-zinc-500 hover:text-primary transition-colors"
                  >
                    Resend OTP
                  </button>
                </div>
              )}
            </div>
          )}

          {(mode === "login" || mode === "signup" || mode === "reset") && (
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={mode === "reset" ? "New Password" : "Password"}
                className="bg-zinc-100 dark:bg-zinc-800 border-none h-12 rounded-xl focus-visible:ring-primary pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <Eye className="h-5 w-5" />
                ) : (
                  <EyeOff className="h-5 w-5" />
                )}
              </button>
            </div>
          )}

          {mode === "login" && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-xs text-zinc-500 hover:text-primary transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {showSlowMessage && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-xl text-xs font-medium animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Taking longer than expected... please wait.</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-primary dark:hover:bg-primary transition-all duration-300 rounded-xl font-medium shadow-lg shadow-primary/10 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : mode === "login" ? (
              "Sign In"
            ) : mode === "signup" ? (
              "Create Account"
            ) : mode === "verify" ? (
              "Verify Account"
            ) : mode === "forgot" ? (
              "Send Recovery Email"
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>

        <div className="mt-8 flex flex-col gap-3 text-center">
          {(mode === "login" || mode === "signup") ? (
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              disabled={loading}
              className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 hover:text-primary transition-colors font-bold disabled:opacity-50"
            >
              {mode === "login" ? "New here? Create account" : "Have an account? Sign in"}
            </button>
          ) : (
            <button
              onClick={() => setMode("login")}
              disabled={loading}
              className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 hover:text-primary transition-colors font-bold disabled:opacity-50"
            >
              Back to Login
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}