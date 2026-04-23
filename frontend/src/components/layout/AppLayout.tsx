import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { VerifyOtpModal } from "@/components/VerifyOtpModal";

export function AppLayout() {
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    // Check if isVerified is strictly false or falsy (undefined for older users).
    const showBanner = user && !user.isVerified;
    
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-500 flex flex-col">
            {showBanner && (
              <div className="bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400 px-4 py-2 text-sm flex items-center justify-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Please verify your email address.</span>
                <button 
                  onClick={() => setIsVerifyModalOpen(true)}
                  className="underline underline-offset-2 hover:text-yellow-700 dark:hover:text-yellow-300 ml-2 font-bold"
                >
                  Verify Now
                </button>
              </div>
            )}
            <Navbar />
            <div className="flex-1">
              <Outlet />
            </div>
            {showBanner && (
              <VerifyOtpModal open={isVerifyModalOpen} onOpenChange={setIsVerifyModalOpen} />
            )}
        </div>
    );
}
