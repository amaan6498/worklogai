import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface Task {
    _id: string;
    content: string;
    tags?: string[];
    createdAt: string;
}

export function useWorkLogs(initialDate?: Date) {
    const [date, setDate] = useState<Date | undefined>(initialDate || new Date());
    const [tasks, setTasks] = useState<Task[]>([]);
    const [currentLogId, setCurrentLogId] = useState<string>("");
    const [logType, setLogType] = useState<"work" | "sick_leave" | "earned_leave" | "casual_leave">("work");
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

    const fetchLogs = useCallback(async (isBackground = false) => {
        if (!date) return [];
        if (!isBackground) setLoading(true);
        try {
            const formattedDate = format(date, "yyyy-MM-dd");
            const { data } = await api.get(`/worklogs/date/${formattedDate}`);

            const fetchedTasks = data.tasks || [];
            const fetchedLogType = data.logType || "work";
            setTasks(fetchedTasks);
            setCurrentLogId(data._id || "");
            setLogType(fetchedLogType);
            return fetchedTasks;
        } catch {
            if (!isBackground) {
                setTasks([]);
                setCurrentLogId("");
                setLogType("work");
            }
            return [];
        } finally {
            if (!isBackground) setLoading(false);
        }
    }, [date]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const addTask = async (content: string) => {
        if (!content.trim()) return;
        setIsAdding(true);
        try {
            const formattedDate = date
                ? format(date, "yyyy-MM-dd")
                : format(new Date(), "yyyy-MM-dd");

            const { data } = await api.post("/worklogs", {
                date: formattedDate,
                content: content.trim(),
            });

            setTasks(data.tasks);
            setCurrentLogId(data._id);
            setLogType(data.logType || "work");
            toast.success("Record added");

            // Smart Polling Logic
            const newTasks = data.tasks || [];
            const newTask = newTasks[newTasks.length - 1];
            const newTaskId = newTask ? newTask._id : null;

            if (!newTaskId) return;

            let attempts = 0;
            const maxAttempts = 5;

            const pollTags = async () => {
                if (attempts >= maxAttempts) return;
                attempts++;

                const updatedTasks = await fetchLogs(true);
                const foundTask = updatedTasks.find((t: Task) => t._id === newTaskId);

                if (foundTask && foundTask.tags && foundTask.tags.length > 0) {
                    return;
                }

                setTimeout(pollTags, 3000);
            };

            setTimeout(pollTags, 3000);
            return true; // Success
        } catch (error) {
            const message = error instanceof AxiosError ? error.response?.data?.message : "Failed to save entry";
            toast.error(message || "Failed to save entry");
            return false;
        } finally {
            setIsAdding(false);
        }
    };

    const updateTask = async (taskId: string, content: string, tags: string[]) => {
        if (!content.trim() || !currentLogId || !taskId) return;
        try {
            const { data } = await api.put(
                `/worklogs/task/${currentLogId}/${taskId}`,
                {
                    content: content,
                    tags: tags,
                },
            );
            setTasks(data.tasks);
            toast.success("Record updated");
            return true;
        } catch (error) {
            const message = error instanceof AxiosError ? error.response?.data?.message : "Update failed";
            toast.error(message || "Update failed");
            return false;
        }
    };

    const deleteTask = async (taskId: string) => {
        if (!currentLogId || !taskId) return;
        setDeletingTaskId(taskId);
        try {
            const { data } = await api.delete(`/worklogs/task/${currentLogId}/${taskId}`);

            // Check if log was deleted (no tasks left)
            if (data.deletedLogId) {
                setTasks([]);
                setCurrentLogId("");
            } else {
                setTasks(data.tasks);
            }

            toast.success("Record deleted");
            return true;
        } catch (error) {
            const message = error instanceof AxiosError ? error.response?.data?.message : "Delete failed";
            toast.error(message || "Delete failed");
            return false;
        } finally {
            setDeletingTaskId(null);
        }
    };

    const updateLogType = async (newType: "work" | "sick_leave" | "earned_leave" | "casual_leave"): Promise<boolean> => {
        if (!date) return false;
        setLoading(true);
        try {
            const formattedDate = format(date, "yyyy-MM-dd");
            const { data } = await api.put("/worklogs/log-type", {
                date: formattedDate,
                logType: newType
            });
            setLogType(data.logType || "work");
            toast.success("Leave status updated");
            return true;
        } catch (error) {
            const message = error instanceof AxiosError ? error.response?.data?.message : "Failed to update leave status";
            toast.error(message || "Failed to update leave status");
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        date,
        setDate,
        tasks,
        logType,
        loading: loading || isAdding,
        currentLogId,
        fetchLogs,
        addTask,
        updateTask,
        deleteTask,
        updateLogType,
        deletingTaskId
    };
}
