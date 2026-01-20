import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mic, MicOff, Plus } from "lucide-react";

interface LogInputAreaProps {
    content: string;
    setContent: (content: string) => void;
    isListening: boolean;
    onToggleVoice: () => void;
    onAdd: () => void;
    loading: boolean;
}

export function LogInputArea({
    content,
    setContent,
    isListening,
    onToggleVoice,
    onAdd,
    loading,
}: LogInputAreaProps) {
    return (
        <div className="relative group">
            <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Record a new milestone..."
                className="min-h-[120px] md:min-h-[160px] bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 md:p-8 text-lg md:text-xl resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus-visible:ring-1 focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-800 shadow-sm dark:shadow-inner"
            />

            <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 flex gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={onToggleVoice}
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
        </div>
    );
}
