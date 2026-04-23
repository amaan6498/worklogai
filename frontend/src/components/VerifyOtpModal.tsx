import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VerifyOtpModal({ open, onOpenChange }: Props) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const email = user?.email;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp", { email, otp });
      localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      toast.success("Account verified successfully!");
      onOpenChange(false);
      window.location.reload(); // Hard refresh to clear the banner instantly
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const { data } = await api.post("/auth/resend-otp", { email });
      toast.success(data.message || "OTP resent successfully");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-950 border-none rounded-[2.5rem] p-10 w-[95%] max-w-md shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold mb-2 text-center text-zinc-900 dark:text-white">Verify Your Email</DialogTitle>
          <DialogDescription className="text-zinc-500 text-center">
            Enter the 6-digit verification code sent to <br/><span className="font-semibold text-zinc-800 dark:text-zinc-200">{email}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleVerify} className="space-y-6 mt-4">
          <Input
            type="text"
            placeholder="6-Digit OTP"
            className="bg-zinc-100 dark:bg-zinc-800/50 border-none h-14 rounded-2xl focus-visible:ring-primary tracking-widest text-center text-xl font-medium"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength={6}
          />
          <Button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-primary dark:hover:bg-primary transition-all duration-300 rounded-xl font-medium shadow-lg"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Verify Account"}
          </Button>
        </form>

        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-xs text-zinc-500 hover:text-primary transition-colors disabled:opacity-50 font-medium"
          >
            {resending ? "Sending..." : "Didn't receive code? Resend OTP"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
