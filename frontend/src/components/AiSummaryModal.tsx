import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, Sparkles } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import api from "@/lib/api";
import { toast } from "sonner";

interface AiSummaryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSummaryGenerated: (summary: string) => void;
}

export function AiSummaryModal({ open, onOpenChange, onSummaryGenerated }: AiSummaryModalProps) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!dateRange?.from || !dateRange?.to) {
            toast.error("Please select a date range");
            return;
        }

        setLoading(true);

        try {
            const start = format(dateRange.from, 'yyyy-MM-dd');
            const end = format(dateRange.to, 'yyyy-MM-dd');

            const { data } = await api.get(`/worklogs/ai-summary?start=${start}&end=${end}`);

            if (data.summary) {
                onSummaryGenerated(data.summary);
                onOpenChange(false);
                toast.success("Insight generated successfully");
            } else {
                toast.info("No logs found for this period");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate insight");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-zinc-950 border-none rounded-[2.5rem] p-8 max-w-md shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> AI Intelligence
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400 font-light italic">
                        Select a date range to generate a comprehensive activity summary.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-6 mt-6">
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-[2rem] border border-zinc-100 dark:border-zinc-800">
                        <Calendar
                            mode="range"
                            selected={dateRange}
                            onSelect={setDateRange}
                            className="rounded-md"
                        />
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={loading || !dateRange?.from || !dateRange?.to}
                        className="w-full bg-primary text-white rounded-xl py-6 hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Synthesizing...
                            </>
                        ) : (
                            "Generate Insight"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
