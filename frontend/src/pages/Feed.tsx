import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { Loader2, Sparkles, Filter, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";
import type     { Task } from "@/hooks/useWorkLogs";

interface Log {
    _id: string;
    date: string;
    tasks: Task[];
    userId: string;
}

export default function Feed() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Filter
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastLogElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    // Reset when date changes
    useEffect(() => {
        setLogs([]);
        setPage(1);
        setHasMore(true);
    }, [date]);

    // Fetch Logs
    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                let url = `/worklogs?page=${page}&limit=10`;
                if (date) {
                    url += `&date=${format(date, 'yyyy-MM-dd')}`;
                }

                const { data } = await api.get(url);

                // If using the new pagination structure: { logs, totalPages }
                // Or fallback if API returns just array (old method, but we updated needed API)
                const newLogs = data.logs || data;

                setLogs(prev => page === 1 ? newLogs : [...prev, ...newLogs]);
                setHasMore(newLogs.length > 0);
            } catch (error) {
                console.error("Feed fetch error", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [page, date]);

    return (
        <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 md:gap-12 p-4 md:p-8">
            {/* --- FEED --- */}
            <div className="space-y-8">
                <header className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Global Feed</h2>
                        <p className="text-sm text-zinc-400">A chronological stream of all logging activity.</p>
                    </div>
                    <div className="flex gap-2">
                        {/* Mobile Filter Toggle */}
                        <Button variant="outline" size="sm" onClick={() => setIsFilterOpen(!isFilterOpen)} className="md:hidden rounded-full font-bold uppercase tracking-wider text-[10px] h-8">
                            <Filter className="w-3 h-3 mr-2" /> {isFilterOpen ? "Hide" : "Filter"}
                        </Button>

                        {date && (
                            <Button variant="ghost" size="sm" onClick={() => { setDate(undefined); setIsFilterOpen(false); }} className="text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-[10px] uppercase tracking-wider h-8">
                                <span className="hidden sm:inline">Clear</span> <X className="w-4 h-4 sm:ml-2" />
                            </Button>
                        )}
                    </div>
                </header>

                {/* Mobile Filter View */}
                {isFilterOpen && (
                    <div className="md:hidden bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 animate-in slide-in-from-top-2">
                        <div className="flex justify-center">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(d) => { setDate(d); setIsFilterOpen(false); }}
                                className="rounded-md"
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {logs.map((log, index) => {
                        const isLast = logs.length === index + 1;
                        return (
                            <div key={log._id} ref={isLast ? lastLogElementRef : null} className="relative pl-6 md:pl-8 group">
                                {/* Timeline Line */}
                                <div className="absolute left-[9px] md:left-[11px] top-6 bottom-[-24px] w-[2px] bg-zinc-100 dark:bg-zinc-800 group-last:bottom-auto group-last:h-full" />

                                <div className="absolute left-[-2px] md:left-0 top-1 w-6 h-6 rounded-full bg-white dark:bg-zinc-950 border-4 border-zinc-100 dark:border-zinc-800 flex items-center justify-center z-10">
                                    <div className="w-2 h-2 rounded-full bg-primary/50" />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                        {format(new Date(log.date), "EEE, MMM do")}
                                    </h3>

                                    <div className="bg-white dark:bg-zinc-900/40 p-5 md:p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm transition-transform hover:scale-[1.01] duration-300">
                                        <ul className="space-y-4">
                                            {log.tasks.map((task, i) => (
                                                <li key={`${log._id}_${i}`} className="group/item">
                                                    <p className="text-sm md:text-base font-light text-zinc-700 dark:text-zinc-200 leading-relaxed">
                                                        {task.content}
                                                    </p>

                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {task.tags?.map((tag, t) => (
                                                            <span key={t} className="text-[10px] uppercase font-bold text-primary opacity-60 bg-primary/5 px-2 py-0.5 rounded-full">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                        <span className="text-[10px] text-zinc-300 dark:text-zinc-700 font-mono self-center">
                                                            {format(new Date(task.createdAt || log.date), "HH:mm")}
                                                        </span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {loading && (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
                        </div>
                    )}

                    {!loading && logs.length === 0 && (
                        <div className="text-center py-20 text-zinc-400 text-sm">
                            No logs found for this period.
                        </div>
                    )}

                    {!loading && logs.length > 0 && !hasMore && (
                        <div className="text-center py-8 text-zinc-300 text-xs uppercase tracking-widest">
                            End of History
                        </div>
                    )}
                </div>
            </div>

            {/* --- SIDEBAR FILTER --- */}
            <aside className="hidden md:block space-y-8">
                <div className="sticky top-28">
                    <section className="bg-white dark:bg-zinc-900/40 p-4 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <div className="px-4 py-2 mb-2 flex items-center text-xs font-bold uppercase tracking-widest text-zinc-400">
                            <Filter className="w-3 h-3 mr-2" /> Filter Stream
                        </div>
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md"
                        />
                    </section>

                    <Card className="mt-8 p-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-none rounded-[2.5rem] shadow-xl">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-2 flex items-center">
                            <Sparkles className="w-3 h-3 mr-2 text-primary" /> Pro Tip
                        </h3>
                        <p className="text-xs font-light leading-relaxed opacity-80">
                            Navigate through history to find patterns in your productivity. Filter by specific dates to pinpoint achievements.
                        </p>
                    </Card>
                </div>
            </aside>
        </main>
    );
}
