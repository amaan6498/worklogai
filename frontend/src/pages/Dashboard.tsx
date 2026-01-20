import React, { useState, useEffect } from "react";
import { format, eachDayOfInterval } from "date-fns";
import {
  Sparkles,
  LogOut,
  Moon,
  Sun,
  Search,
  Plus,
  X,
  Loader2,
  Activity,
  FileDown
} from "lucide-react";
import { Tooltip } from "react-tooltip";
import { ActivityCalendar } from "react-activity-calendar";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";

import { NavbarSearch } from "@/components/NavbarSearch";
import { AiSummaryModal } from "@/components/AiSummaryModal";
import api from "@/lib/api";

import { useWorkLogs } from "@/hooks/useWorkLogs";
import type { Task } from "@/hooks/useWorkLogs";
import { useSpeech } from "@/hooks/useSpeech";
import { TimelineHeader } from "@/components/dashboard/TimelineHeader";
import { LogInputArea } from "@/components/dashboard/LogInputArea";
import { LogEntryList } from "@/components/dashboard/LogEntryList";

export default function Dashboard() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Custom Hooks
  const { date, setDate, tasks, loading, addTask, updateTask } = useWorkLogs();

  const [content, setContent] = useState("");
  const { isListening, toggleVoiceInput } = useSpeech((text) =>
    setContent((prev) => (prev ? prev + " " + text : text))
  );

  // Stats State (Could be moved to a hook too, but keeping it here for now)
  const [stats, setStats] = useState<Array<{ date: string; count: number; level: number }>>([]);

  // UI States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editNewTag, setEditNewTag] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string>("");

  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const calendarTheme = theme === "system" ? systemTheme : theme;


  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/worklogs/stats");
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31);
        const days = eachDayOfInterval({ start: startOfYear, end: endOfYear });

        const filledData = days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const log = data.find((d: any) => d.date === dateStr);
          if (log) {
            return { date: dateStr, count: log.count, level: log.level };
          }
          return { date: dateStr, count: 0, level: 0 };
        });
        setStats(filledData);
      } catch (error) {
        console.error("Failed to fetch stats", error);
        setStats([{ date: format(new Date(), "yyyy-MM-dd"), count: 0, level: 0 }]);
      }
    };
    fetchStats();
  }, []);

  const handleAddTaskWrapper = async () => {
    const success = await addTask(content);
    if (success) setContent("");
  };

  const handleExport = async () => {
    try {
      toast.info("Preparing Excel document...");
      const response = await api.get("/worklogs/summary", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `WorkLog_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Export failed");
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTaskId(task._id);
    setEditContent(task.content);
    setEditTags(task.tags || []);
    setEditNewTag("");
    setIsEditModalOpen(true);
  };

  const handleUpdateTaskWrapper = async () => {
    const success = await updateTask(editingTaskId, editContent, editTags);
    if (success) setIsEditModalOpen(false);
  };

  const handleAiSummaryGenerated = (summary: string) => {
    setAiSummary(summary);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 100);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-500">

      {/* --- NAVIGATION --- */}
      <nav className="border-b border-zinc-200 dark:border-zinc-900 px-8 py-4 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-20">
        <h1 className="text-xs font-bold tracking-[0.4em] uppercase select-none shrink-0">
          WorkLog <span className="text-primary italic">AI</span>
        </h1>

        <NavbarSearch onSelectDate={setDate} className="hidden md:block" />

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(!isSearchOpen)} className="md:hidden rounded-full w-9 h-9 text-zinc-400 hover:text-primary transition-colors">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")} className="rounded-full w-9 h-9 text-zinc-400 hover:text-primary transition-colors">
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>
          <div className="w-[1px] h-4 bg-zinc-300 dark:bg-zinc-800 mx-1" />
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-zinc-400 hover:text-red-500 rounded-full text-[10px] font-bold tracking-widest uppercase">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </nav>

      {/* Mobile Search Bar */}
      {isSearchOpen && (
        <div className="md:hidden border-b border-zinc-200 dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md p-4 sticky top-[73px] z-10 animate-in slide-in-from-top-2">
          <NavbarSearch onSelectDate={(d) => { setDate(d); setIsSearchOpen(false); }} className="mx-0 max-w-none" />
        </div>
      )}

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6 md:gap-12 p-4 md:p-8">

        {/* --- SIDEBAR --- */}
        <aside className="space-y-8 hidden md:block">
          <section className="bg-white dark:bg-zinc-900/40 p-4 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} className="rounded-md" />
          </section>

          <Card className="p-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-none rounded-[2.5rem] shadow-2xl">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-4 flex items-center">
              <Sparkles className="w-3 h-3 mr-2 text-primary" /> Intelligence
            </h3>
            <p className="text-sm font-light leading-relaxed mb-6">Review your monthly productivity patterns using AI synthesis.</p>
            <Button onClick={() => setIsAiModalOpen(true)} className="w-full bg-primary text-white rounded-2xl py-6 hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20">
              Generate Insight
            </Button>
          </Card>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <section className="space-y-6 md:space-y-10">
          <TimelineHeader
            date={date}
            setDate={setDate}
            onOpenActivity={() => setIsActivityModalOpen(true)}
            onExport={handleExport}
          />

          <LogInputArea
            content={content}
            setContent={setContent}
            isListening={isListening}
            onToggleVoice={toggleVoiceInput}
            onAdd={handleAddTaskWrapper}
            loading={loading}
          />

          <div className="flex flex-wrap justify-end gap-2 md:hidden">
            <Button variant="outline" onClick={() => setIsAiModalOpen(true)} className="rounded-full px-4 md:px-6 border-zinc-300 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-widest h-10 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors md:hidden flex-grow md:flex-grow-0">
              <Sparkles className="w-3 h-3 mr-2 text-primary" /> AI Insight
            </Button>
            <Button variant="outline" onClick={handleExport} className="rounded-full px-4 md:px-6 border-zinc-300 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-widest h-10 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors flex-grow md:flex-grow-0">
              <FileDown className="w-3 h-3 mr-2 text-primary" /> Export
            </Button>
          </div>

          <div className="space-y-10 py-4">
            <LogEntryList tasks={tasks} loading={loading} onEdit={openEditModal} />
          </div>

          {aiSummary && (
            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-[2.5rem] p-10 shadow-xl dark:shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-primary/20 p-3 rounded-full"><Sparkles className="w-6 h-6 text-primary" /></div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] opacity-80">AI Insight</h3>
                  <p className="text-xs opacity-50 font-light">Generated Analysis</p>
                </div>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-lg font-light leading-relaxed whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{aiSummary}</p>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* --- EDIT MODAL --- */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-white dark:bg-zinc-950 border-none rounded-[2.5rem] p-10 max-w-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-2">Modify Record</DialogTitle>
            <DialogDescription className="text-zinc-400 font-light italic">Update your daily progress details.</DialogDescription>
          </DialogHeader>
          <div className="py-8">
            <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="min-h-[180px] bg-zinc-50 dark:bg-zinc-900/50 border-none rounded-[2rem] p-6 text-xl resize-none focus-visible:ring-1 focus-visible:ring-primary/20 shadow-inner" />
            <div className="mt-6 space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Manage Tags</label>
              <div className="flex gap-2">
                <Input value={editNewTag} onChange={(e) => setEditNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && editNewTag.trim()) { if (!editTags.includes(editNewTag.trim())) { setEditTags([...editTags, editNewTag.trim()]); setEditNewTag(""); } } }} placeholder="Add a new tag..." className="bg-zinc-50 dark:bg-zinc-900/50 border-none rounded-xl h-9 text-sm" />
                <Button onClick={() => { if (editNewTag.trim() && !editTags.includes(editNewTag.trim())) { setEditTags([...editTags, editNewTag.trim()]); setEditNewTag(""); } }} size="icon" variant="ghost" className="rounded-xl shrink-0 h-9 w-9 hover:bg-zinc-100 dark:hover:bg-zinc-800"><Plus className="w-4 h-4 text-zinc-500" /></Button>
              </div>
              {editTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {editTags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold border-transparent bg-primary/10 text-primary uppercase tracking-wider">
                      #{tag}
                      <button onClick={() => setEditTags((prev) => prev.filter((_, idx) => idx !== i))} className="ml-1 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="flex gap-4 sm:justify-end">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)} className="bg-[#ffffff] text-black rounded-xl px-10 py-6 h-auto text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-primary/20">Cancel</Button>
            <Button onClick={handleUpdateTaskWrapper} className="bg-primary text-white rounded-xl px-10 py-6 h-auto text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-primary/20">Update Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- ACTIVITY MODAL --- */}
      <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
        <DialogContent className="bg-white dark:bg-zinc-950 border-none rounded-[2.5rem] p-10 w-[95vw] max-w-7xl shadow-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-[10px] font-bold uppercase tracking-[0.3em] text-green-500 mb-2 flex items-center"><Activity className="w-4 h-4 mr-2" /> Productivity Stream</DialogTitle>
            <DialogDescription className="text-zinc-400 font-light italic">A 365-day visualization of your work consistency.</DialogDescription>
          </DialogHeader>
          <div className="py-12 overflow-x-auto flex justify-center items-center bg-zinc-50/50 dark:bg-zinc-900/30 rounded-[2rem]">
            <div className="flex justify-start min-w-[800px]">
              {stats.length > 0 ? (
                <>
                  <ActivityCalendar data={stats} theme={{ light: ["#d4d4d8", "#9be9a8", "#40c463", "#30a14e", "#216e39"], dark: ["#3f3f46", "#0e4429", "#006d32", "#26a641", "#39d353"], }} labels={{ totalCount: `{{count}} tasks in ${new Date().getFullYear()}`, }} colorScheme={calendarTheme === "dark" ? "dark" : "light"} showWeekdayLabels blockSize={12} blockMargin={4} fontSize={11} renderBlock={(block, activity) => React.cloneElement(block, { "data-tooltip-id": "react-tooltip", "data-tooltip-html": `${activity.count} tasks on ${activity.date}`, })} />
                  <Tooltip id="react-tooltip" />
                </>
              ) : (
                <div className="flex items-center justify-center h-[200px] w-full text-zinc-400 text-xs"><Loader2 className="w-6 h-6 animate-spin mr-3" /> synchronizing...</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AiSummaryModal open={isAiModalOpen} onOpenChange={setIsAiModalOpen} onSummaryGenerated={handleAiSummaryGenerated} />
    </div>
  );
}
