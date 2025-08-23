// components/AssignmentList.tsx
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
import { ChevronDown, ChevronRight } from "lucide-react";

type Whiteboard = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type Assignment = {
  id: string;
  title: string;
  description?: string;
  whiteboards: Whiteboard[];
  createdAt: string;
  updatedAt: string;
};

export default function AssignmentList() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [expandedAssignments, setExpandedAssignments] = useState<
    Record<string, boolean>
  >({});
  const router = useRouter();

  // Загрузка заданий
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await fetch("/api/assignment");
        const data = await res.json();
        setAssignments(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Ошибка загрузки заданий");
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  // Создание задания
  const createAssignment = async () => {
    if (!assignmentTitle.trim()) return;

    try {
      const res = await fetch("/api/assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: assignmentTitle }),
      });

      const newAssignment = await res.json();
      if (newAssignment.id) {
        setAssignments([...assignments, newAssignment]);
      }
    } catch (err) {
      setError("Ошибка создания задания");
    } finally {
      setDialogOpen(false);
      setAssignmentTitle("");
    }
  };

  // Переключение отображения досок задания
  const toggleAssignment = (assignmentId: string) => {
    setExpandedAssignments((prev) => ({
      ...prev,
      [assignmentId]: !prev[assignmentId],
    }));
  };

  if (loading) return <div className="p-4">Загрузка...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Мои задания</h1>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mb-4">Создать задание</Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Название задания</DialogTitle>
          </DialogHeader>

          <Input
            value={assignmentTitle}
            onChange={(e) => setAssignmentTitle(e.target.value)}
            placeholder="Введите название задания"
            className="mb-4"
          />

          <Button onClick={createAssignment} disabled={!assignmentTitle.trim()}>
            Создать
          </Button>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="border rounded-lg overflow-hidden"
          >
            <div
              className="p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
              onClick={() => toggleAssignment(assignment.id)}
            >
              <h2 className="font-semibold text-lg">{assignment.title}</h2>
              {expandedAssignments[assignment.id] ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </div>

            {expandedAssignments[assignment.id] && (
              <div className="p-4 pt-0">
                {assignment.description && (
                  <p className="text-gray-600 mb-3">{assignment.description}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {assignment.whiteboards.map((board) => (
                    <Link
                      key={board.id}
                      href={`/whiteboard/${board.id}`}
                      className="border p-3 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <h3 className="font-medium">{board.title}</h3>
                      <p className="text-xs text-gray-500">
                        Создано:{" "}
                        {new Date(board.createdAt).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() =>
                    router.push(`/whiteboard/new?assignmentId=${assignment.id}`)
                  }
                >
                  + Добавить доску
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
