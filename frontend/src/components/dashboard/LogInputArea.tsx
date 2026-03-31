import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mic, MicOff, Plus, MoreHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
interface LogInputAreaProps {
    content: string;
    setContent: (content: string) => void;
    isListening: boolean;
    onToggleVoice: () => void;
    onAdd: () => void;
    loading: boolean;
    logType: "work" | "sick_leave" | "earned_leave" | "casual_leave";
    onUpdateLogType: (type: "work" | "sick_leave" | "earned_leave" | "casual_leave") => Promise<boolean>;
}

export function LogInputArea({
    content,
    setContent,
    isListening,
    onToggleVoice,
    onAdd,
    loading,
    logType,
    onUpdateLogType,
}: LogInputAreaProps) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
                <span className="text-sm font-medium text-zinc-500">
                    {logType === "work" ? "Work Day" : `On ${logType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
                </span>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={loading}
                            className="rounded-full w-8 h-8 text-zinc-400 hover:text-primary transition-all focus-visible:opacity-100"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-1">
                        <DropdownMenuItem onClick={() => onUpdateLogType("work")} className="rounded-lg text-xs font-medium cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 px-3 py-2">
                            Work
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateLogType("sick_leave")} className="rounded-lg text-xs font-medium cursor-pointer focus:bg-red-50 dark:focus:bg-red-900/10 text-red-600 focus:text-red-600 px-3 py-2">
                            Sick Leave
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateLogType("earned_leave")} className="rounded-lg text-xs font-medium cursor-pointer focus:bg-red-50 dark:focus:bg-red-900/10 text-red-600 focus:text-red-600 px-3 py-2">
                            Earned Leave
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateLogType("casual_leave")} className="rounded-lg text-xs font-medium cursor-pointer focus:bg-red-50 dark:focus:bg-red-900/10 text-red-600 focus:text-red-600 px-3 py-2">
                            Casual Leave
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="relative group">
                {logType === "work" ? (
                    <>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Record a new milestone..."
                            disabled={loading}
                            className="min-h-[120px] md:min-h-[160px] bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 md:p-8 text-lg md:text-xl resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus-visible:ring-1 focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-800 shadow-sm dark:shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                        />

                        <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 flex gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={onToggleVoice}
                                disabled={loading}
                                className={`rounded-full w-12 h-12 md:w-14 md:h-14 border-none shadow-lg transition-all ${isListening
                                        ? "bg-red-50 text-red-500 hover:bg-red-100 animate-pulse"
                                        : "bg-white dark:bg-zinc-800 text-zinc-400 hover:text-primary hover:bg-zinc-50 dark:hover:bg-zinc-700"
                                    }`}
                            >
                                {isListening ? (
                                    <MicOff className="w-5 h-5 md:w-6 md:h-6" />
                                ) : (
                                    <Mic className="w-5 h-5 md:w-6 md:h-6" />
                                )}
                            </Button>

                            <Button
                                onClick={onAdd}
                                disabled={!content.trim() || loading}
                                className="rounded-full w-12 h-12 md:w-14 md:h-14 p-0 bg-primary shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <Plus className="w-6 h-6 md:w-8 md:h-8 text-white" />
                                )}
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="min-h-[120px] md:min-h-[160px] bg-zinc-50 dark:bg-zinc-900/30 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-[2.5rem] p-6 md:p-8 flex items-center justify-center text-zinc-500 shadow-sm dark:shadow-inner">
                        <p className="text-sm md:text-base font-medium flex items-center">
                            🌴 You are marked as being on <span className="capitalize ml-1 font-bold text-primary">{logType.replace('_', ' ')}</span> today.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
