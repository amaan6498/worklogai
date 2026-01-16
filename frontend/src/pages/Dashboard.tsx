import React, { useState, useEffect, useCallback } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Plus,
  Sparkles,
  FileDown,
  LogOut,
  Loader2,
  Moon,
  Sun,
  Edit2
} from 'lucide-react';
import { AiSummaryModal } from "@/components/AiSummaryModal";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Task {
  _id: string;
  content: string;
  createdAt: string;
}

export default function Dashboard() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Data States
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentLogId, setCurrentLogId] = useState<string>("");

  // UI States
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string>("");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const handleAiSummaryGenerated = (summary: string) => {
    setAiSummary(summary);
    // Optional: scroll to bottom
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  };

  /**
   * 1. Fetch Logs for specific date
   * Matches: GET /api/worklogs/date/:date
   */
  const fetchLogs = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const { data } = await api.get(`/worklogs/date/${formattedDate}`);

      // Backend returns { _id, tasks: [...] }
      setTasks(data.tasks || []);
      setCurrentLogId(data._id || "");
    } catch (error: any) {
      console.error("Fetch Error:", error);
      setTasks([]);
      setCurrentLogId("");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  /**
   * 2. Add New Task
   * Matches: POST /api/worklogs
   */
  const handleAddTask = async () => {
    if (!content.trim()) return;
    try {
      const formattedDate = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      const { data } = await api.post('/worklogs', {
        date: formattedDate,
        content: content.trim()
      });

      setTasks(data.tasks);
      setCurrentLogId(data._id);
      setContent("");
      toast.success("Record added");
    } catch (error: any) {
      toast.error("Failed to save entry");
    }
  };

  /**
   * 3. Edit Task Logic
   * Matches: PUT /api/worklogs/task/:logId/:taskId
   */
  const openEditModal = (task: Task) => {
    setEditingTaskId(task._id);
    setEditContent(task.content);
    setIsEditModalOpen(true);
  };

  const handleUpdateTask = async () => {
    if (!editContent.trim() || !currentLogId || !editingTaskId) return;
    try {
      const { data } = await api.put(`/worklogs/task/${currentLogId}/${editingTaskId}`, {
        content: editContent
      });
      setTasks(data.tasks);
      setIsEditModalOpen(false);
      toast.success("Record updated");
    } catch (error) {
      toast.error("Update failed");
    }
  };

  /**
   * 4. Export Logic
   * Matches: GET /api/worklogs/summary
   */
  const handleExport = async () => {
    try {
      toast.info("Preparing Excel document...");
      const response = await api.get('/worklogs/summary', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `WorkLog_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Export failed");
    }
  };

  /**
   * 5. AI Summary Mockup
   */
  const handleAiSummary = () => {
    setIsAiModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-500">

      {/* --- NAVIGATION --- */}
      <nav className="border-b border-zinc-100 dark:border-zinc-900 px-8 py-5 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-20">
        <h1 className="text-xs font-bold tracking-[0.4em] uppercase select-none">
          WorkLog <span className="text-primary italic">AI</span>
        </h1>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="rounded-full w-9 h-9 text-zinc-400 hover:text-primary transition-colors"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>
          <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-zinc-400 hover:text-red-500 rounded-full text-[10px] font-bold tracking-widest uppercase"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[320px_1fr] gap-12 p-8">

        {/* --- SIDEBAR --- */}
        <aside className="space-y-8">
          <section className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              className="rounded-md"
            />
          </section>

          <Card className="p-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-none rounded-[2.5rem] shadow-2xl">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-4 flex items-center">
              <Sparkles className="w-3 h-3 mr-2 text-primary" /> Intelligence
            </h3>
            <p className="text-sm font-light leading-relaxed mb-6">Review your monthly productivity patterns using AI synthesis.</p>
            <Button
              onClick={handleAiSummary}
              className="w-full bg-primary text-white rounded-2xl py-6 hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20"
            >
              Generate Insight
            </Button>
          </Card>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <section className="space-y-10">
          <header className="flex justify-between items-end">
            <div>
              <p className="text-primary font-bold text-[10px] uppercase tracking-[0.3em] mb-2">Timeline</p>
              <h2 className="text-5xl font-semibold tracking-tighter italic">
                {date ? format(date, 'MMMM d') : '...'}
              </h2>
            </div>
            <Button
              variant="outline"
              onClick={handleExport}
              className="rounded-full px-6 border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-widest h-10"
            >
              <FileDown className="w-3 h-3 mr-2" /> Export xlsx
            </Button>
          </header>

          {/* New Entry Input */}
          <div className="relative group">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Record a new milestone..."
              className="min-h-[160px] bg-zinc-50 dark:bg-zinc-900/30 border-none rounded-[2.5rem] p-8 text-xl resize-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 focus-visible:ring-0 shadow-inner"
            />
            <Button
              onClick={handleAddTask}
              disabled={!content.trim() || loading}
              className="absolute bottom-6 right-6 rounded-full w-14 h-14 p-0 bg-primary shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Plus className="w-8 h-8 text-white" />}
            </Button>
          </div>

          {/* List Display */}
          <div className="space-y-10 py-4">
            {loading ? (
              <div className="flex flex-col items-center gap-4 py-20">
                <Loader2 className="animate-spin text-primary w-8 h-8" />
                <p className="text-[10px] font-bold tracking-widest text-zinc-300 uppercase">Synchronizing</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-900 rounded-[2.5rem]">
                <p className="text-zinc-300 dark:text-zinc-700 text-sm italic font-light">No records for this date.</p>
              </div>
            ) : (
              <div className="grid gap-10">
                {tasks.map((task, idx) => (
                  <div key={task._id} className="group flex gap-8 items-start animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <span className="text-[10px] font-bold text-zinc-200 dark:text-zinc-800 mt-2 min-w-[30px] transition-colors group-hover:text-primary">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-4">
                        <p className="text-zinc-800 dark:text-zinc-200 text-xl tracking-tight leading-snug group-hover:translate-x-1 transition-transform">
                          {task.content}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(task)}
                          className="opacity-0 group-hover:opacity-100 rounded-full w-8 h-8 text-zinc-300 hover:text-primary transition-all"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="h-[1px] w-full bg-zinc-50 dark:bg-zinc-900 mt-6" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Summary Section */}
          {aiSummary && (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-[2.5rem] p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-primary/20 p-3 rounded-full">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
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
            <DialogTitle className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-2">
              Modify Record
            </DialogTitle>
            <DialogDescription className="text-zinc-400 font-light italic">
              Update your daily progress details.
            </DialogDescription>
          </DialogHeader>

          <div className="py-8">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[180px] bg-zinc-50 dark:bg-zinc-900/50 border-none rounded-[2rem] p-6 text-xl resize-none focus-visible:ring-1 focus-visible:ring-primary/20 shadow-inner"
            />
          </div>

          <DialogFooter className="flex gap-4 sm:justify-end">
            <Button
              variant="ghost"
              onClick={() => setIsEditModalOpen(false)}
              className="bg-[#ffffff] text-black rounded-xl px-10 py-6 h-auto text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-primary/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTask}
              className="bg-primary text-white rounded-xl px-10 py-6 h-auto text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-primary/20"
            >
              Update Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AiSummaryModal
        open={isAiModalOpen}
        onOpenChange={setIsAiModalOpen}
        onSummaryGenerated={handleAiSummaryGenerated}
      />
    </div>
  );
}