import { useState, useEffect } from "react";
import { format, eachDayOfInterval } from "date-fns";
import api from "@/lib/api";

export interface StatItem {
    date: string;
    count: number;
    level: number;
}

export function useDashboardStats() {
    const [stats, setStats] = useState<StatItem[]>([]);
    const [loading, setLoading] = useState(true);

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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return { stats, loading };
}
