import { useEffect, useState } from "react";
import { format } from "date-fns";
import api from "@/lib/api";
import { Loader2, Search } from "lucide-react";
import { Dialog, DialogContent } from "./ui/dialog";

interface SearchModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (log: any) => void;
}

export function SearchModal({ open, onOpenChange, onSelect }: SearchModalProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length > 1) {
                setLoading(true);
                try {
                    const { data } = await api.get(`/worklogs/search?q=${encodeURIComponent(query)}`);
                    setResults(data);
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 bg-transparent border-none shadow-none max-w-2xl">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden w-full flex flex-col">
                    <div className="flex items-center px-4 border-b border-zinc-100 dark:border-zinc-800">
                        <Search className="w-5 h-5 text-zinc-400 mr-2" />
                        <input
                            className="flex h-14 w-full bg-transparent text-sm outline-none placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
                            placeholder="Search entries..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                        {loading && <Loader2 className="w-4 h-4 text-zinc-400 animate-spin ml-2" />}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto p-2">
                        {results.length === 0 && query.length > 1 && !loading && (
                            <div className="py-12 text-center text-sm text-zinc-500">
                                No results found.
                            </div>
                        )}

                        {results.length > 0 && (
                            <div className="space-y-1">
                                {results.map((item) => (
                                    <div
                                        key={item._id}
                                        onClick={() => {
                                            onOpenChange(false);
                                            onSelect(item);
                                        }}
                                        className="px-4 py-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer group transition-colors"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 group-hover:text-primary transition-colors">
                                                {format(new Date(item.date), 'MMMM d, yyyy')}
                                            </span>
                                            <span className="text-[10px] font-mono text-zinc-300">
                                                {item.createdAt ? format(new Date(item.createdAt), 'HH:mm') : ''}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-1">
                                            {item.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 flex justify-between">
                        <span>Search across all your logs</span>
                        <span>ESC to close</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
