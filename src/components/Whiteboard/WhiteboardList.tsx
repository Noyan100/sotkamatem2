// components/WhiteboardList.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Whiteboard = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export default function WhiteboardList() {
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [boardTitle, setBoardTitle] = useState("");
  const router = useRouter();

  // Загрузка досок
  useEffect(() => {
    const fetchWhiteboards = async () => {
      try {
        const res = await fetch("/api/whiteboard");
        const data = await res.json();
        setWhiteboards(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Ошибка загрузки досок");
      } finally {
        setLoading(false);
      }
    };
    fetchWhiteboards();
  }, []);

  // Создание доски
  const createBoard = async () => {
    if (!boardTitle.trim()) return;

    try {
      const res = await fetch("/api/whiteboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: boardTitle }),
      });

      const newBoard = await res.json();
      if (newBoard.id) {
        router.push(`/whiteboard/${newBoard.id}`);
      }
    } catch (err) {
      setError("Ошибка создания доски");
    } finally {
      setDialogOpen(false);
      setBoardTitle("");
    }
  };

  if (loading) return <div className="p-4">Загрузка...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Мои доски</h1>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mb-4">Создать доску</Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Название доски</DialogTitle>
          </DialogHeader>

          <Input
            value={boardTitle}
            onChange={(e) => setBoardTitle(e.target.value)}
            placeholder="Введите название"
            className="mb-4"
          />

          <Button onClick={createBoard} disabled={!boardTitle.trim()}>
            Создать
          </Button>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {whiteboards.map((board) => (
          <Link
            key={board.id}
            href={`/whiteboard/${board.id}`}
            className="border p-4 rounded-lg hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold">{board.title}</h2>
            <p className="text-sm text-gray-500">
              Создано: {new Date(board.createdAt).toLocaleDateString()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
