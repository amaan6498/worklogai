import { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, Activity, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";

interface TimelineHeaderProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    onOpenActivity: () => void;
    onExport: () => void;
}

export function TimelineHeader({ date, setDate, onOpenActivity, onExport }: TimelineHeaderProps) {
    const [isMobileCalendarOpen, setIsMobileCalendarOpen] = useState(false);

    return (
        <>
            <header className="flex justify-between items-end">
                <div>
                    <div>
                        <p className="text-primary font-bold text-[10px] uppercase tracking-[0.3em] mb-2">
                            Timeline
                        </p>
                        <div className="flex items-center gap-4">
                            <div
                                onClick={() =>
                                    window.innerWidth < 768 && setIsMobileCalendarOpen(true)
                                }
                                className="group flex items-center gap-2 md:pointer-events-none cursor-pointer active:opacity-70 transition-opacity"
                            >
                                <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter italic">
                                    {date ? format(date, "MMMM d, yyyy") : "..."}
                                </h2>
                                <ChevronDown className="w-6 h-6 text-zinc-300 md:hidden group-hover:text-primary transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex gap-4">
                    <Button
                        variant="outline"
                        onClick={onOpenActivity}
                        className="rounded-full px-6 border-zinc-300 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-widest h-10 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                    >
                        <Activity className="w-3 h-3 mr-2 text-primary" /> Activity
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onExport}
                        className="rounded-full px-6 border-zinc-300 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-widest h-10 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                    >
                        <FileDown className="w-3 h-3 mr-2 text-primary" /> Export xlsx
                    </Button>
                </div>
            </header>

            {/* Mobile Calendar Modal */}
            <Dialog
                open={isMobileCalendarOpen}
                onOpenChange={setIsMobileCalendarOpen}
            >
                <DialogContent className="bg-white dark:bg-zinc-950 border-none rounded-[2.5rem] p-8 w-[90vw] max-w-sm shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-2">
                            Select Date
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 font-light italic">
                            Jump to a specific day in your timeline.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center py-4">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(d) => {
                                if (d) {
                                    setDate(d);
                                    setIsMobileCalendarOpen(false);
                                }
                            }}
                            className="rounded-md border border-zinc-100 dark:border-zinc-800 p-3 shadow-inner bg-zinc-50 dark:bg-zinc-900/50"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
