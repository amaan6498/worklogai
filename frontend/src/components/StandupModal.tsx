import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Loader2, FileText } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface StandupModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function StandupModal({ open, onOpenChange }: StandupModalProps) {
    const [loading, setLoading] = useState(false);
    const [standupText, setStandupText] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (open) {
            fetchStandupData();
        }
    }, [open]);

    const fetchStandupData = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/worklogs/standup');

            if (data.standup) {
                setStandupText(data.standup);
            } else {
                // Fallback if no AI response or empty
                setStandupText("No activity found to generate a standup.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch standup data");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(standupText);
            setCopied(true);
            toast.success("Copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error("Failed to copy");
            console.log(err);

        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-zinc-950 border-none rounded-[2.5rem] p-8 w-[95%] max-w-lg shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Standup Builder
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400 font-light italic">
                        Generate your daily standup update based on recent activity.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Textarea
                            value={standupText}
                            onChange={(e) => setStandupText(e.target.value)}
                            className="min-h-[250px] bg-zinc-50 dark:bg-zinc-900/50 border-none rounded-[2rem] p-6 text-sm font-mono leading-relaxed resize-none focus-visible:ring-1 focus-visible:ring-primary/20 shadow-inner"
                        />
                    )}
                </div>

                <DialogFooter>
                    <Button
                        onClick={handleCopy}
                        disabled={loading}
                        className="w-full bg-primary text-white rounded-xl py-6 hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20"
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Copied
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy to Clipboard
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
