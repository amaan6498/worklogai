import { Sparkles } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardSidebarProps {
    date: Date | undefined;
    onDateSelect: (date: Date | undefined) => void;
    onOpenStandup: () => void;
    onOpenAiInsight: () => void;
}

export function DashboardSidebar({
    date,
    onDateSelect,
    onOpenStandup,
    onOpenAiInsight,
}: DashboardSidebarProps) {
    return (
        <aside className="space-y-8 hidden md:block">
            <section className="bg-white dark:bg-zinc-900/40 p-4 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={onDateSelect}
                    className="rounded-md"
                />
            </section>

            <Card className="p-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-none rounded-[2.5rem] shadow-2xl">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-4 flex items-center">
                    <Sparkles className="w-3 h-3 mr-2 text-primary" /> Intelligence
                </h3>
                <p className="text-sm font-light leading-relaxed mb-6">
                    Review your monthly productivity patterns using AI synthesis.
                </p>
                <div className="flex flex-col gap-3">
                    <Button
                        onClick={onOpenStandup}
                        className="w-full bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 rounded-2xl py-6 hover:scale-[1.02] transition-transform shadow-lg"
                    >
                        Standup Builder
                    </Button>
                    <Button
                        onClick={onOpenAiInsight}
                        className="w-full bg-primary text-white rounded-2xl py-6 hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20"
                    >
                        Generate Insight
                    </Button>
                </div>
            </Card>
        </aside>
    );
}
