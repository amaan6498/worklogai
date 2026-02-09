import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Brain,
    Search,
    MessageSquare,
    ArrowRight,
    Mic,
} from "lucide-react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { useRef } from "react";

const FeatureCard = ({
    feature,
    index,
    progress
}: {
    feature: typeof features[0];
    index: number;
    progress: MotionValue<number>
}) => {
    const range = [index * 0.25, 1];
    const targetScale = 1 - ((features.length - index) * 0.05);

    const scale = useTransform(progress, range, [1, targetScale]);

    return (
        <div className="h-screen flex items-center justify-center sticky top-32 px-4 md:px-0">
            <motion.div
                style={{ scale, top: `calc(-5% + ${index * 25}px)` }}
                className="relative -top-[25%] h-[400px] md:h-[500px] w-full max-w-4xl bg-card rounded-[2rem] md:rounded-[3rem] border border-border p-6 md:p-12 flex flex-col justify-between overflow-hidden shadow-2xl origin-top"
            >
                <div className="space-y-6 relative z-10">
                    <div className="p-4 bg-primary/10 w-fit rounded-2xl">
                        {feature.icon}
                    </div>
                    <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-card-foreground">
                        {feature.title}
                    </h3>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
                        {feature.description}
                    </p>
                </div>

                <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl opacity-50" />
            </motion.div>
        </div>
    );
};

const features = [
    {
        title: "Smart Logging.",
        description: "Effortlessly capture your daily tasks. Rich text support meets intuitive categorization for a seamless workflow.",
        icon: <LayoutDashboard className="h-8 w-8 text-primary" />,
    },
    {
        title: "AI Intelligence.",
        description: "Turn raw logs into actionable insights. Our advanced models summarize your day, week, or month in seconds.",
        icon: <Brain className="h-8 w-8 text-primary" />,
    },
    {
        title: "Global Search.",
        description: "Find anything, instantly. A powerful search engine that understands context and retrieves your past work in milliseconds.",
        icon: <Search className="h-8 w-8 text-primary" />,
    },
    {
        title: "Voice Integration.",
        description: "Just speak. Advanced voice-to-text technology transcribes your thoughts into structured logs automatically.",
        icon: <Mic className="h-8 w-8 text-primary" />,
    },
];

const LandingPage = () => {
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end']
    });

    return (
        <div className="bg-background text-foreground font-sans selection:bg-muted">

            {/* Navbar */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div
                        className="cursor-pointer flex items-center gap-2 group"
                        onClick={() => navigate("/")}
                    >
                        <h1 className="text-xs font-bold tracking-[0.4em] uppercase select-none shrink-0">
                            WorkLog <span className="text-primary italic">AI</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/auth")}
                            className="text-sm font-medium text-primary md:text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Log in
                        </button>
                        <Button
                            onClick={() => navigate("/auth?mode=signup")}
                            size="sm"
                            className="rounded-full px-5 shadow-none hidden md:block"
                        >
                            Sign up
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-12 md:pt-24 md:pb-20 px-6 overflow-hidden">
                <div className="max-w-5xl mx-auto text-center space-y-8">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-6xl md:text-8xl font-semibold tracking-tighter text-foreground leading-[0.95]"
                    >
                        Effortless Logging for <br className="hidden md:block" />
                        <span className="text-muted-foreground">High Performers.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium"
                    >
                        WorkLog AI provides the intelligent logging tools and voice-powered interface to track, summarize, and analyze your daily progress.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                        className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Button
                            onClick={() => navigate("/auth?mode=signup")}
                            size="lg"
                            className="rounded-full text-lg px-8 py-6 transition-all"
                        >
                            Start Free <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </motion.div>
                </div>
            </section>

            {/* Parallax Features Section */}
            <section ref={containerRef} className="bg-background relative mb-16 pt-12">
                {/* Introduction to Features */}
                <div className="max-w-3xl mx-auto text-center px-6 py-1">
                    <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-6">
                        Why WorkLog AI?
                    </h2>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        We rethought the work log from the ground up. No clutter. No distractions. Just pure focus on what you achieved today.
                    </p>
                </div>

                {features.map((feature, index) => (
                    <FeatureCard
                        key={index}
                        feature={feature}
                        index={index}
                        progress={scrollYProgress}
                    />
                ))}
            </section>

            {/* Feedback / CTA Section */}
            <section className="px-6 py-16 md:py-24 bg-secondary/5 text-center">
                <div className="max-w-3xl mx-auto space-y-10">
                    <h2 className="text-4xl md:text-6xl font-semibold tracking-tighter">
                        Build Better Habits.
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-xl mx-auto">
                        Join thousands of professionals who are taking control of their productivity. Your future self will thank you.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button
                            onClick={() => navigate("/auth?mode=signup")}
                            size="lg"
                            className="rounded-full text-lg px-10 py-7 shadow-xl hover:shadow-2xl transition-all"
                        >
                            Get Started Now
                        </Button>
                        <Button
                            variant="ghost"
                            size="lg"
                            className="rounded-full text-lg px-8 py-7 text-muted-foreground hover:bg-secondary"
                            onClick={() => navigate("/feedback")}
                        >
                            <MessageSquare className="mr-2 h-5 w-5" />
                            Provide Feedback
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-background py-12 px-6 border-t border-border">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-muted-foreground text-sm">
                    <p className="mb-4 md:mb-0">&copy; {new Date().getFullYear()} WorkLog AI Inc. All rights reserved.</p>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                        <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                        <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
