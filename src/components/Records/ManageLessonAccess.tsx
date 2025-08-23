"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Trash2, Edit, Lock, UploadCloud } from "lucide-react";

type User = {
  id: number;
  name: string;
  email: string;
};

type Lesson = {
  id: number;
  title: string;
  description?: string;
  vkVideoUrl: string;
  pdfUrl?: string | null;
};

export function ManageLessonAccess({
  lesson,
  onUpdate,
}: {
  lesson: Lesson;
  onUpdate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"access" | "edit" | "delete">("access");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isPdfChanged, setIsPdfChanged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Состояния для редактирования
  const [editForm, setEditForm] = useState({
    title: lesson.title,
    description: lesson.description || "",
    vkVideoUrl: lesson.vkVideoUrl,
    pdfUrl: lesson.pdfUrl || "",
  });

  // Сброс состояния формы
  const resetForm = () => {
    setEditForm({
      title: lesson.title,
      description: lesson.description || "",
      vkVideoUrl: lesson.vkVideoUrl,
      pdfUrl: lesson.pdfUrl || "",
    });
    setPdfFile(null);
    setIsPdfChanged(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Обработчик изменения состояния диалога
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (mode === "access") {
          // Загружаем всех пользователей
          const [usersRes, accessRes] = await Promise.all([
            fetch("/api/users"),
            fetch(`/api/lessons/${lesson.id}/access`),
          ]);

          if (!usersRes.ok)
            throw new Error("Не удалось загрузить пользователей");
          if (!accessRes.ok) throw new Error("Не удалось загрузить доступы");

          const usersData = await usersRes.json();
          const accessData = await accessRes.json();

          // Обработка данных пользователей
          const usersArray = Array.isArray(usersData)
            ? usersData
            : usersData.users;
          if (!usersArray)
            throw new Error("Неверный формат данных пользователей");
          setUsers(usersArray);

          // Обработка данных доступа
          const accesses = Array.isArray(accessData)
            ? accessData
            : accessData.accesses;
          setSelectedUsers(accesses?.map((a: any) => a.userId) || []);
        }
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
        setError(err instanceof Error ? err.message : "Неизвестная ошибка");
        toast.error("Ошибка загрузки данных");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, lesson.id, mode]);

  // Обработчик изменения файла
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        toast.error("Пожалуйста, выберите файл в формате PDF");
        return;
      }
      setPdfFile(file);
      setIsPdfChanged(true);
    }
  };

  // Удаление выбранного файла (обновляем состояние сразу)
  const removePdfFile = () => {
    setPdfFile(null);
    setEditForm((prev) => ({ ...prev, pdfUrl: "" }));
    setIsPdfChanged(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUserToggle = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveAccess = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/lessons/${lesson.id}/access`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIds: selectedUsers }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка сохранения доступа");
      }

      toast.success("Доступы успешно обновлены");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Неизвестная ошибка"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const updateLesson = async () => {
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("description", editForm.description || "");
      formData.append("vkVideoUrl", editForm.vkVideoUrl);

      if (isPdfChanged) {
        if (pdfFile) {
          formData.append("pdfFile", pdfFile);
        } else {
          formData.append("removePdf", "true");
        }
      } else if (editForm.pdfUrl) {
        formData.append("pdfUrl", editForm.pdfUrl);
      }

      const response = await fetch(`/api/lessons/${lesson.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка обновления урока");
      }

      toast.success("Лекция успешно обновлена");
      resetForm();
      setOpen(false);
      onUpdate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Неизвестная ошибка"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const deleteLesson = async () => {
    if (!confirm(`Вы уверены, что хотите удалить лекцию "${lesson.title}"?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/lessons/${lesson.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка удаления урока");
      }

      toast.success(data.message || "Лекция успешно удалена");
      resetForm();
      setOpen(false);
      onUpdate();
    } catch (error) {
      console.error("Ошибка удаления:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Неизвестная ошибка при удалении"
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMode("access");
              setOpen(true);
            }}
          >
            <Lock className="h-4 w-4 mr-2" />
            Доступ
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMode("edit");
              setOpen(true);
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Изменить
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMode("delete");
              setOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Удалить
          </Button>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "access" && `Управление доступом: ${lesson.title}`}
            {mode === "edit" && `Редактирование: ${lesson.title}`}
            {mode === "delete" && `Удаление лекции`}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <>
            {mode === "access" && (
              <div className="space-y-4">
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => handleUserToggle(user.id)}
                        />
                        <Label htmlFor={`user-${user.id}`} className="flex-1">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                        </Label>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      Пользователи не найдены
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Отмена</Button>
                  </DialogClose>
                  <Button onClick={saveAccess} disabled={actionLoading}>
                    {actionLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Сохранить
                  </Button>
                </DialogFooter>
              </div>
            )}

            {mode === "edit" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="mb-2">
                    Название *
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={editForm.title}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="mb-2">
                    Описание
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={editForm.description}
                    onChange={handleEditChange}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="vkVideoUrl" className="mb-2">
                    Ссылка на видео VK *
                  </Label>
                  <Input
                    id="vkVideoUrl"
                    name="vkVideoUrl"
                    value={editForm.vkVideoUrl}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div>
                  <Label>PDF конспект</Label>
                  <div className="mt-2">
                    <Label htmlFor="pdf-upload" className="sr-only">
                      Выберите PDF файл
                    </Label>
                    <div className="flex items-center gap-4">
                      <label className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 transition hover:border-gray-400">
                        <UploadCloud className="h-10 w-10 text-gray-400" />
                        <span className="mt-2 text-sm text-gray-600">
                          {pdfFile
                            ? pdfFile.name
                            : editForm.pdfUrl
                            ? "Текущий файл: " + editForm.pdfUrl
                            : "Перетащите файл или нажмите для выбора"}
                        </span>
                        <input
                          ref={fileInputRef}
                          id="pdf-upload"
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>

                      {(pdfFile || editForm.pdfUrl) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={removePdfFile}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Поддерживаются только PDF файлы (максимум 10MB)
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Отмена</Button>
                  </DialogClose>
                  <Button onClick={updateLesson} disabled={actionLoading}>
                    {actionLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Сохранить
                  </Button>
                </DialogFooter>
              </div>
            )}

            {mode === "delete" && (
              <div className="space-y-4">
                <p className="text-destructive">
                  Вы уверены, что хотите удалить лекцию "{lesson.title}"? Это
                  действие нельзя отменить.
                </p>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Отмена</Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    onClick={deleteLesson}
                    disabled={actionLoading}
                  >
                    {actionLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Удалить
                  </Button>
                </DialogFooter>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
