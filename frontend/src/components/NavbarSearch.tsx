import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Calendar, Clock } from 'lucide-react';
import api from '@/lib/api';
import { format } from 'date-fns';

interface NavbarSearchProps {
    onSelectDate: (date: Date) => void;
    className?: string; // Add className prop
}

export function NavbarSearch({ onSelectDate, className }: NavbarSearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length > 1) {
                setLoading(true);
                try {
                    const { data } = await api.get(`/worklogs/search?q=${encodeURIComponent(query)}`);
                    setResults(data);
                    setShowResults(true);
                } catch (error) {
                    console.error("Search failed:", error);
                    setResults([]);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    // Click outside listener
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className={`relative flex-1 max-w-xl mx-8 ${className || ''}`}>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border-none rounded-full bg-zinc-100 dark:bg-zinc-900 text-sm placeholder:text-zinc-400 focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    placeholder="Search your work logs..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (e.target.value.length > 1) setShowResults(true);
                    }}
                    onFocus={() => {
                        if (query.length > 1) setShowResults(true);
                    }}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {loading && <Loader2 className="h-4 w-4 text-zinc-400 animate-spin" />}
                    {/* ESC indicator removed */}
                </div>
            </div>

            {/* Results Dropdown */}
            {showResults && (query.length > 1) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden z-50">

                    {results.length > 0 ? (
                        <div className="max-h-[60vh] overflow-y-auto py-2">
                            <div className="px-4 py-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                                Top Results
                            </div>
                            {results.map((item) => (
                                <button
                                    key={item._id}
                                    onClick={() => {
                                        onSelectDate(new Date(item.date));
                                        setShowResults(false);
                                        setQuery(""); // clear search or keep it? Google keeps it usually, but we are navigating.
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors flex flex-col gap-1 border-b border-zinc-50 dark:border-zinc-900 last:border-0"
                                >
                                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                                        <span className="flex items-center gap-1 font-bold text-zinc-500 uppercase tracking-wider">
                                            <Calendar className="w-3 h-3" /> {format(new Date(item.date), 'MMM d, yyyy')}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                                        <span className="flex items-center gap-1 font-mono">
                                            <Clock className="w-3 h-3" /> {format(new Date(item.createdAt), 'HH:mm')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-zinc-700 dark:text-zinc-200 line-clamp-2">
                                        {item.content}
                                    </p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-sm text-zinc-400">
                            {!loading && "No matching logs found."}
                            {loading && "Searching..."}
                        </div>
                    )}


                </div>
            )}
        </div>
    );
}
