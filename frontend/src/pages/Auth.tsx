import React, { useState, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertTriangle } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSlowMessage, setShowSlowMessage] = useState(false);
  const navigate = useNavigate();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowSlowMessage(false);

    // Start 10s timer for slow connection message
    timeoutRef.current = setTimeout(() => {
      setShowSlowMessage(true);
    }, 10000);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/signup";
      const payload = isLogin ? { email, password } : { name, email, password };

      const { data } = await api.post(endpoint, payload);

      localStorage.setItem("token", data.token);
      toast.success(isLogin ? "Welcome back" : "Account created successfully");
      navigate("/dashboard");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Authentication failed");
    } finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setLoading(false);
      setShowSlowMessage(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <Card className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 border-none shadow-2xl rounded-3xl">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold tracking-tight uppercase tracking-widest text-xs mb-2">
            WorkLog <span className="text-primary font-bold italic lowercase text-2xl">ai</span>
          </h1>
          <p className="text-sm text-zinc-400 font-light">Minimalist productivity tracking.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
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
          <div className="space-y-1">
            <Input
              type="password"
              placeholder="Password"
              className="bg-zinc-100 dark:bg-zinc-800 border-none h-12 rounded-xl focus-visible:ring-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

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
            {loading ? <Loader2 className="animate-spin" /> : (isLogin ? "Sign In" : "Create Account")}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            disabled={loading}
            className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 hover:text-primary transition-colors font-bold disabled:opacity-50"
          >
            {isLogin ? "New here? Create account" : "Have an account? Sign in"}
          </button>
        </div>
      </Card>
    </div>
  );
}