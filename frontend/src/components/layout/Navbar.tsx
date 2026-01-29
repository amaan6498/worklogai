import { useNavigate, NavLink } from "react-router-dom";
import { Moon, Sun, Search, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { NavbarSearch } from "@/components/NavbarSearch";
import { useState } from "react";
import { format } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/auth");
    };

    const handleSearchSelect = (date: Date) => {
        // Just navigate to dashboard with date param
        const dateStr = format(date, "yyyy-MM-dd");
        navigate(`/dashboard?date=${dateStr}`);
        setIsMobileSearchOpen(false);
    };

    return (
        <>
            <nav className="border-b border-zinc-200 dark:border-zinc-900 px-8 py-4 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-20">
                <div onClick={() => navigate("/dashboard")} className="cursor-pointer">
                    <h1 className="text-xs font-bold tracking-[0.4em] uppercase select-none shrink-0">
                        WorkLog <span className="text-primary italic">AI</span>
                    </h1>
                </div>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-6">
                    <NavLink to="/dashboard" className={({ isActive }) => `text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-primary' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>Dashboard</NavLink>
                    <NavLink to="/feed" className={({ isActive }) => `text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-primary' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>Feed</NavLink>
                    <NavLink to="/tags" className={({ isActive }) => `text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-primary' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>Tags</NavLink>
                </div>

                <NavbarSearch onSelectDate={handleSearchSelect} className="hidden md:block" />

                <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)} className="md:hidden rounded-full w-9 h-9 text-zinc-400 hover:text-primary transition-colors">
                        <Search className="w-4 h-4" />
                    </Button>

                    {/* Mobile Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden rounded-full w-9 h-9 text-zinc-400 hover:text-primary transition-colors">
                                <Menu className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl">
                            <DropdownMenuItem onClick={() => navigate("/dashboard")} className="rounded-xl px-4 py-3 font-bold text-xs uppercase tracking-wider">Dashboard</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate("/feed")} className="rounded-xl px-4 py-3 font-bold text-xs uppercase tracking-wider">Global Feed</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate("/tags")} className="rounded-xl px-4 py-3 font-bold text-xs uppercase tracking-wider">Tags Manager</DropdownMenuItem>

                            <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800 my-2 mx-2" />

                            <DropdownMenuItem onClick={() => setTheme(theme === "light" ? "dark" : "light")} className="rounded-xl px-4 py-3 font-bold text-xs uppercase tracking-wider flex justify-between">
                                <span>Theme</span>
                                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleLogout} className="rounded-xl px-4 py-3 font-bold text-xs uppercase tracking-wider text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex justify-between">
                                <span>Logout</span>
                                <LogOut className="w-4 h-4" />
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Desktop Buttons (Hidden on Mobile) */}
                    <div className="hidden md:flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")} className="rounded-full w-9 h-9 text-zinc-400 hover:text-primary transition-colors">
                            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </Button>
                        <div className="w-[1px] h-4 bg-zinc-300 dark:bg-zinc-800 mx-1" />
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-zinc-400 hover:text-red-500 rounded-full text-[10px] font-bold tracking-widest uppercase">
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Mobile Search Bar */}
            {isMobileSearchOpen && (
                <div className="md:hidden border-b border-zinc-200 dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md p-4 sticky top-[73px] z-10 animate-in slide-in-from-top-2">
                    <NavbarSearch onSelectDate={handleSearchSelect} className="mx-0 max-w-none" />
                </div>
            )}
        </>
    );
}
