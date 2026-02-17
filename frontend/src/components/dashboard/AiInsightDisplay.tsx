import { useRef, useEffect } from "react";
import { Sparkles } from "lucide-react";

interface AiInsightDisplayProps {
    summary: string | null;
}

export function AiInsightDisplay({ summary }: AiInsightDisplayProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (summary && ref.current) {
            ref.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [summary]);

    if (!summary) return null;

    return (
        <div
            ref={ref}
            className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-[2.5rem] p-10 shadow-xl dark:shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
            <div className="flex items-center gap-4 mb-6">
                <div className="bg-primary/20 p-3 rounded-full">
                    <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.3em] opacity-80">
                        AI Insight
                    </h3>
                    <p className="text-xs opacity-50 font-light">Generated Analysis</p>
                </div>
            </div>
            <div className="prose dark:prose-invert max-w-none">
                <p className="text-lg font-light leading-relaxed whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                    {summary}
                </p>
            </div>
        </div>
    );
}
