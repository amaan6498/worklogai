import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

export function AppLayout() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-500">
            <Navbar />
            <Outlet />
        </div>
    );
}
