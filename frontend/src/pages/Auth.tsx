import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/api"; 
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState(""); // Added name state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Changed 'register' to 'signup' to match your controller
      const endpoint = isLogin ? "/auth/login" : "/auth/signup";
      
      // 2. Included 'name' in the request body
      const payload = isLogin ? { email, password } : { name, email, password };
      
      const { data } = await api.post(endpoint, payload);
      
      localStorage.setItem("token", data.token);
      toast.success(isLogin ? "Welcome back" : "Account created successfully");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Authentication failed");
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
          {/* Only show Name field during Sign Up */}
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
          <Button type="submit" className="w-full h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-primary dark:hover:bg-primary transition-all duration-300 rounded-xl font-medium shadow-lg shadow-primary/10">
            {isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 hover:text-primary transition-colors font-bold"
          >
            {isLogin ? "New here? Create account" : "Have an account? Sign in"}
          </button>
        </div>
      </Card>
    </div>
  );
}