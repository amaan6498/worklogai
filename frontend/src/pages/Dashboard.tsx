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
  Edit2,
  Activity,
  Search,
  X,
  Mic,
  MicOff,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ActivityCalendar } from 'react-activity-calendar';
import { Tooltip } from 'react-tooltip';
import { AiSummaryModal } from "@/components/AiSummaryModal";
import { NavbarSearch } from "@/components/NavbarSearch";
import { useTheme } from "@/components/theme-provider";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { format, eachDayOfInterval } from "date-fns";

interface Task {
  _id: string;
  content: string;
  tags?: string[];
  createdAt: string;
}

export default function Dashboard() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Determine effective theme for calendar
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const calendarTheme = theme === 'system' ? systemTheme : theme;

  // Data States
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentLogId, setCurrentLogId] = useState<string>("");
  const [stats, setStats] = useState<Array<{ date: string; count: number; level: number }>>([]);

  // UI States
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMobileCalendarOpen, setIsMobileCalendarOpen] = useState(false);

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editNewTag, setEditNewTag] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string>("");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const handleAiSummaryGenerated = (summary: string) => {
    setAiSummary(summary);
    // Optional: scroll to bottom
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast.success("Listening...");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setContent(prev => (prev ? prev + ' ' + transcript : transcript));
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      toast.error("Voice recognition failed.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
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

  const handlePrevDay = () => date && setDate(new Date(date.setDate(date.getDate() - 1)));
  const handleNextDay = () => date && setDate(new Date(date.setDate(date.getDate() + 1)));

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/worklogs/stats');

        // Generate the current year of dates
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31);
        const days = eachDayOfInterval({ start: startOfYear, end: endOfYear });

        const filledData = days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          // Find if we have api data for this day
          const log = data.find((d: any) => d.date === dateStr);
          if (log) {
            return { date: dateStr, count: log.count, level: log.level };
          }
          return { date: dateStr, count: 0, level: 0 };
        });

        setStats(filledData);
      } catch (error) {
        console.error("Failed to fetch stats", error);
        // Fallback to avoid crash
        setStats([{ date: format(new Date(), 'yyyy-MM-dd'), count: 0, level: 0 }]);
      }
    };
    fetchStats();
  }, []);

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
    setEditTags(task.tags || []);
    setEditNewTag("");
    setIsEditModalOpen(true);
  };

  const handleUpdateTask = async () => {
    if (!editContent.trim() || !currentLogId || !editingTaskId) return;
    try {
      const { data } = await api.put(`/worklogs/task/${currentLogId}/${editingTaskId}`, {
        content: editContent,
        tags: editTags
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-500">

      {/* --- NAVIGATION --- */}
      <nav className="border-b border-zinc-200 dark:border-zinc-900 px-8 py-4 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-20">
        <h1 className="text-xs font-bold tracking-[0.4em] uppercase select-none shrink-0">
          WorkLog <span className="text-primary italic">AI</span>
        </h1>

        <NavbarSearch onSelectDate={setDate} className="hidden md:block" />

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="md:hidden rounded-full w-9 h-9 text-zinc-400 hover:text-primary transition-colors"
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="rounded-full w-9 h-9 text-zinc-400 hover:text-primary transition-colors"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>
          <div className="w-[1px] h-4 bg-zinc-300 dark:bg-zinc-800 mx-1" />
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
        <section className="space-y-6 md:space-y-10">
          <header className="flex justify-between items-end">
            <div>
      
              <div>
                <p className="text-primary font-bold text-[10px] uppercase tracking-[0.3em] mb-2">Timeline</p>
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => window.innerWidth < 768 && setIsMobileCalendarOpen(true)}
                    className="group flex items-center gap-2 md:pointer-events-none cursor-pointer active:opacity-70 transition-opacity"
                  >
                    <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter italic">
                      {date ? format(date, 'MMMM d, yyyy') : '...'}
                    </h2>
                    <ChevronDown className="w-6 h-6 text-zinc-300 md:hidden group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:flex gap-4">
              <Button
                variant="outline"
                onClick={() => setIsActivityModalOpen(true)}
                className="rounded-full px-6 border-zinc-300 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-widest h-10 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <Activity className="w-3 h-3 mr-2 text-primary" /> Activity
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                className="rounded-full px-6 border-zinc-300 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-widest h-10 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <FileDown className="w-3 h-3 mr-2 text-primary" /> Export xlsx
              </Button>
            </div>
          </header>

          {/* New Entry Input */}
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
                onClick={toggleVoiceInput}
                className={`rounded-full w-12 h-12 md:w-14 md:h-14 border-none shadow-lg transition-all ${isListening
                  ? "bg-red-50 text-red-500 hover:bg-red-100 animate-pulse"
                  : "bg-white dark:bg-zinc-800 text-zinc-400 hover:text-primary hover:bg-zinc-50 dark:hover:bg-zinc-700"
                  }`}
              >
                {isListening ? <MicOff className="w-5 h-5 md:w-6 md:h-6" /> : <Mic className="w-5 h-5 md:w-6 md:h-6" />}
              </Button>

              <Button
                onClick={handleAddTask}
                disabled={!content.trim() || loading}
                className="rounded-full w-12 h-12 md:w-14 md:h-14 p-0 bg-primary shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Plus className="w-6 h-6 md:w-8 md:h-8 text-white" />}
              </Button>
            </div>
          </div>

          {/* Action Buttons (Mobile Only) */}
          <div className="flex flex-wrap justify-end gap-2 md:hidden">
            <Button
              variant="outline"
              onClick={handleAiSummary}
              className="rounded-full px-4 md:px-6 border-zinc-300 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-widest h-10 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors md:hidden flex-grow md:flex-grow-0"
            >
              <Sparkles className="w-3 h-3 mr-2 text-primary" /> AI Insight
            </Button>

            <Button
              variant="outline"
              onClick={handleExport}
              className="rounded-full px-4 md:px-6 border-zinc-300 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-widest h-10 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors flex-grow md:flex-grow-0"
            >
              <FileDown className="w-3 h-3 mr-2 text-primary" /> Export
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
              <div className="py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-900 rounded-[2.5rem]">
                <p className="text-zinc-400 dark:text-zinc-700 text-sm italic font-light">No records for this date.</p>
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
                        <div className="space-y-1">
                          <p className="text-zinc-800 dark:text-zinc-200 text-xl tracking-tight leading-snug group-hover:translate-x-1 transition-transform">
                            {task.content}
                          </p>
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {task.tags.map((tag, i) => (
                                <span key={i} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20 uppercase tracking-wider">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(task)}
                          className="opacity-0 group-hover:opacity-100 rounded-full w-8 h-8 text-zinc-300 hover:text-primary transition-all"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="h-[1px] w-full bg-zinc-100 dark:bg-zinc-900 mt-6" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Summary Section */}
          {aiSummary && (
            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-[2.5rem] p-10 shadow-xl dark:shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
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

            <div className="mt-6 space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Manage Tags</label>
              <div className="flex gap-2">
                <Input
                  value={editNewTag}
                  onChange={(e) => setEditNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editNewTag.trim()) {
                      if (!editTags.includes(editNewTag.trim())) {
                        setEditTags([...editTags, editNewTag.trim()]);
                        setEditNewTag("");
                      }
                    }
                  }}
                  placeholder="Add a new tag..."
                  className="bg-zinc-50 dark:bg-zinc-900/50 border-none rounded-xl h-9 text-sm"
                />
                <Button
                  onClick={() => {
                    if (editNewTag.trim() && !editTags.includes(editNewTag.trim())) {
                      setEditTags([...editTags, editNewTag.trim()]);
                      setEditNewTag("");
                    }
                  }}
                  size="icon"
                  variant="ghost"
                  className="rounded-xl shrink-0 h-9 w-9 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Plus className="w-4 h-4 text-zinc-500" />
                </Button>
              </div>

              {editTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {editTags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold border-transparent bg-primary/10 text-primary uppercase tracking-wider">
                      #{tag}
                      <button
                        onClick={() => setEditTags(prev => prev.filter((_, idx) => idx !== i))}
                        className="ml-1 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
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

      {/* --- ACTIVITY MODAL --- */}
      <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
        <DialogContent className="bg-white dark:bg-zinc-950 border-none rounded-[2.5rem] p-10 w-[95vw] max-w-7xl shadow-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-[10px] font-bold uppercase tracking-[0.3em] text-green-500 mb-2 flex items-center">
              <Activity className="w-4 h-4 mr-2" /> Productivity Stream
            </DialogTitle>
            <DialogDescription className="text-zinc-400 font-light italic">
              A 365-day visualization of your work consistency.
            </DialogDescription>
          </DialogHeader>

          <div className="py-12 overflow-x-auto flex justify-center items-center bg-zinc-50/50 dark:bg-zinc-900/30 rounded-[2rem]">
            <div className="flex justify-start min-w-[800px]">
              {/* Always show calendar, even if just zeros, if stats exists */}
              {stats.length > 0 ? (
                <>
                  <ActivityCalendar
                    data={stats}
                    theme={{
                      light: ['#d4d4d8', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
                      dark: ['#3f3f46', '#0e4429', '#006d32', '#26a641', '#39d353'],
                    }}
                    labels={{
                      totalCount: `{{count}} tasks in ${new Date().getFullYear()}`,
                    }}
                    colorScheme={calendarTheme === 'dark' ? 'dark' : 'light'}
                    showWeekdayLabels
                    blockSize={12}
                    blockMargin={4}
                    fontSize={11}
                    renderBlock={(block, activity) =>
                      React.cloneElement(block, {
                        'data-tooltip-id': 'react-tooltip',
                        'data-tooltip-html': `${activity.count} tasks on ${activity.date}`,
                      })
                    }
                  />
                  <Tooltip id="react-tooltip" />
                </>
              ) : (
                <div className="flex items-center justify-center h-[200px] w-full text-zinc-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin mr-3" /> synchronizing...
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- MOBILE CALENDAR MODAL --- */}
      <Dialog open={isMobileCalendarOpen} onOpenChange={setIsMobileCalendarOpen}>
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
              onSelect={(d) => { if (d) { setDate(d); setIsMobileCalendarOpen(false); } }}
              className="rounded-md border border-zinc-100 dark:border-zinc-800 p-3 shadow-inner bg-zinc-50 dark:bg-zinc-900/50"
            />
          </div>
        </DialogContent>
      </Dialog>

      <AiSummaryModal
        open={isAiModalOpen}
        onOpenChange={setIsAiModalOpen}
        onSummaryGenerated={handleAiSummaryGenerated}
      />
    </div >
  );
}