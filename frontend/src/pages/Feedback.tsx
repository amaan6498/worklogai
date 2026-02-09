import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Send } from "lucide-react";

export default function Feedback() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            toast.success("Thank you for your feedback!");
            navigate("/");
        }, 1500);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
            <Card className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 border-none shadow-2xl rounded-3xl relative">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 left-4 text-muted-foreground hover:text-foreground rounded-full"
                    onClick={() => navigate("/")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>

                <div className="text-center mb-8 pt-4">
                    <h1 className="text-2xl font-bold tracking-tight">
                        We value your feedback
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Help us improve WorkLog AI.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground ml-1">Name</label>
                        <Input
                            type="text"
                            placeholder="Your name"
                            className="bg-zinc-100 dark:bg-zinc-800 border-none h-12 rounded-xl focus-visible: ring-primary"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground ml-1">Email</label>
                        <Input
                            type="email"
                            placeholder="name@example.com"
                            className="bg-zinc-100 dark:bg-zinc-800 border-none h-12 rounded-xl focus-visible:ring-primary"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground ml-1">Feedback</label>
                        <Textarea
                            placeholder="Tell us what you think..."
                            className="bg-zinc-100 dark:bg-zinc-800 border-none min-h-[120px] rounded-xl focus-visible:ring-primary resize-none p-4"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-primary dark:hover:bg-primary transition-all duration-300 rounded-xl font-medium shadow-lg shadow-primary/10 mt-6"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-2">Send Feedback <Send className="w-4 h-4" /></span>}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
