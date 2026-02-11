import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
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
    const [loading, setLoading] = useState(false);
    const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

    const fetchLogs = useCallback(async (isBackground = false) => {
        if (!date) return [];
        if (!isBackground) setLoading(true);
        try {
            const formattedDate = format(date, "yyyy-MM-dd");
            const { data } = await api.get(`/worklogs/date/${formattedDate}`);

            const fetchedTasks = data.tasks || [];
            setTasks(fetchedTasks);
            setCurrentLogId(data._id || "");
            return fetchedTasks;
        } catch {
            if (!isBackground) {
                setTasks([]);
                setCurrentLogId("");
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
        } catch {
            toast.error("Failed to save entry");
            return false; // Failure
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
        } catch {
            toast.error("Update failed");
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
        } catch {
            toast.error("Delete failed");
            return false;
        } finally {
            setDeletingTaskId(null);
        }
    };

    return {
        date,
        setDate,
        tasks,
        loading,
        currentLogId,
        fetchLogs,
        addTask,
        updateTask,
        deleteTask,
        deletingTaskId
    };
}
