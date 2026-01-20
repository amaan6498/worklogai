import { Button } from "@/components/ui/button";
import { Loader2, Edit2 } from "lucide-react";
import type { Task } from "@/hooks/useWorkLogs"; 

interface LogEntryListProps {
    tasks: Task[];
    loading: boolean;
    onEdit: (task: Task) => void;
}

export function LogEntryList({ tasks, loading, onEdit }: LogEntryListProps) {
    if (loading) {
        return (
            <div className="flex flex-col items-center gap-4 py-20">
                <Loader2 className="animate-spin text-primary w-8 h-8" />
                <p className="text-[10px] font-bold tracking-widest text-zinc-300 uppercase">
                    Synchronizing
                </p>
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-900 rounded-[2.5rem]">
                <p className="text-zinc-400 dark:text-zinc-700 text-sm italic font-light">
                    No records for this date.
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-10">
            {tasks.map((task, idx) => (
                <div
                    key={task._id}
                    className="group flex gap-8 items-start animate-in fade-in slide-in-from-bottom-2 duration-500"
                >
                    <span className="text-[10px] font-bold text-zinc-200 dark:text-zinc-800 mt-2 min-w-[30px] transition-colors group-hover:text-primary">
                        {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1">
                        <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                                <p className="text-zinc-800 dark:text-zinc-200 text-xl tracking-tight leading-snug group-hover:translate-x-1 transition-transform">
                                    {task.content}
                                </p>
                                {task.tags && task.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {task.tags.map((tag, i) => (
                                            <span
                                                key={i}
                                                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20 uppercase tracking-wider"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit(task)}
                                className="opacity-0 group-hover:opacity-100 rounded-full w-8 h-8 text-zinc-300 hover:text-primary transition-all"
                            >
                                <Edit2 className="w-3 h-3" />
                            </Button>
                        </div>
                        <div className="h-[1px] w-full bg-zinc-100 dark:bg-zinc-900 mt-6" />
                    </div>
                </div>
            ))}
        </div>
    );
}
