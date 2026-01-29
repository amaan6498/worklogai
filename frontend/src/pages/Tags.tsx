import { useState, useEffect } from "react";
import { Tag as TagIcon, Trash2, Edit2, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/lib/api";

interface TagStat {
    _id: string; // The tag name
    count: number;
}

export default function Tags() {
    const [tags, setTags] = useState<TagStat[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [selectedTag, setSelectedTag] = useState<TagStat | null>(null);
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // Form State
    const [newTagName, setNewTagName] = useState("");

    const fetchTags = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/tags");
            setTags(data);
        } catch (error) {
            console.error("Failed to fetch tags", error);
            toast.error("Could not load tags");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    const handleRename = async () => {
        if (!selectedTag || !newTagName.trim()) return;
        try {
            await api.put("/tags/rename", {
                oldTag: selectedTag._id,
                newTag: newTagName.trim()
            });
            toast.success("Tag renamed successfully");
            setIsRenameOpen(false);
            fetchTags();
        } catch (error) {
            toast.error("Rename failed");
        }
    };

    const handleDelete = async () => {
        if (!selectedTag) return;
        try {
            // Encode tag because it might contain special chars (though unlikely for tags)
            await api.delete(`/tags/${encodeURIComponent(selectedTag._id)}`);
            toast.success("Tag removed from all logs");
            setIsDeleteOpen(false);
            fetchTags();
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    const openRename = (tag: TagStat) => {
        setSelectedTag(tag);
        setNewTagName(tag._id);
        setIsRenameOpen(true);
    };

    const openDelete = (tag: TagStat) => {
        setSelectedTag(tag);
        setIsDeleteOpen(true);
    };

    return (
        <main className="max-w-6xl mx-auto p-4 md:p-8">
            <header className="mb-12">
                <h2 className="text-xl font-bold tracking-tight mb-2">Tag Management</h2>
                <p className="text-sm text-zinc-400">Organize your taxonomy. Rename or remove tags globally.</p>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {tags.map((tag) => (
                        <div key={tag._id} className="group relative bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 transition-all hover:shadow-lg hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-primary/10 text-primary p-3 rounded-2xl">
                                    <TagIcon className="w-5 h-5" />
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => openRename(tag)} className="h-8 w-8 hover:text-blue-500 rounded-full">
                                        <Edit2 className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => openDelete(tag)} className="h-8 w-8 hover:text-red-500 rounded-full">
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-1 line-clamp-1" title={tag._id}>
                                #{tag._id}
                            </h3>
                            <p className="text-xs text-zinc-400 font-mono tracking-wider">
                                {tag.count} USAGES
                            </p>
                        </div>
                    ))}

                    {tags.length === 0 && (
                        <div className="col-span-full text-center py-20 text-zinc-400 bg-zinc-50 dark:bg-zinc-900/20 rounded-[3rem] border border-dashed border-zinc-200 dark:border-zinc-800">
                            <Sparkles className="w-8 h-8 mx-auto mb-4 text-zinc-300" />
                            <p>No tags found yet.</p>
                        </div>
                    )}
                </div>
            )}

            {/* --- RENAME DIALOG --- */}
            <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                <DialogContent className="bg-white dark:bg-zinc-950 border-none rounded-[2.5rem] p-8 max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">Rename Tag</DialogTitle>
                        <DialogDescription className="text-zinc-400 font-light">
                            This will update the tag on <strong>{selectedTag?.count}</strong> logs.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                        <Input
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            className="bg-zinc-50 dark:bg-zinc-900/50 border-none rounded-xl text-center font-bold text-lg h-12"
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleRename} className="w-full rounded-xl bg-primary text-white font-bold tracking-wider uppercase text-xs h-12 shadow-lg shadow-primary/20">
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- DELETE DIALOG --- */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="bg-white dark:bg-zinc-950 border-none rounded-[2.5rem] p-8 max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Delete Tag
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 text-center">
                        <p className="text-zinc-600 dark:text-zinc-300 mb-2">
                            Are you sure you want to remove <strong className="text-red-500">#{selectedTag?._id}</strong>?
                        </p>
                        <p className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-900 p-3 rounded-xl">
                            This tag will be removed from all {selectedTag?.count} logs. The logs themselves will remain.
                        </p>
                    </div>
                    <DialogFooter className="grid grid-cols-2 gap-3">
                        <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} className="rounded-xl h-12 uppercase text-xs font-bold">Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} className="rounded-xl h-12 uppercase text-xs font-bold shadow-lg shadow-red-500/20">
                            Confirm Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}
