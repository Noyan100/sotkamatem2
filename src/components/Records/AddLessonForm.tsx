"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { Loader2, UploadCloud, X } from "lucide-react";

export function AddLessonForm({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    vkVideoUrl: "",
    pdfFile: null as File | null,
    pdfUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) {
      newErrors.title = "Название обязательно";
    }

    if (!form.vkVideoUrl.trim()) {
      newErrors.vkVideoUrl = "Ссылка на видео обязательна";
    } else if (!form.vkVideoUrl.includes("vk.com/video_ext.php")) {
      newErrors.vkVideoUrl =
        "Неверный формат ссылки VK. Пример: https://vk.com/video_ext.php?oid=-12345&id=67890&hd=2";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.type !== "application/pdf") {
        toast.error("Пожалуйста, выберите файл в формате PDF");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast.error("Файл слишком большой (максимум 10MB)");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setForm({
        ...form,
        pdfFile: file,
        pdfUrl: "", // Сбрасываем URL если загружаем файл
      });
    }
  };

  const removePdfFile = () => {
    setForm({ ...form, pdfFile: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadPdf = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    const toastId = toast.loading("Добавление лекции...");

    try {
      let finalPdfUrl = form.pdfUrl;

      // Загружаем PDF если он был добавлен
      if (form.pdfFile) {
        try {
          toast.loading("Загружаем PDF файл...", { id: toastId });
          finalPdfUrl = await uploadPdf(form.pdfFile);
          toast.success("PDF успешно загружен", { id: toastId });
        } catch (error) {
          throw new Error(
            `Ошибка загрузки PDF: ${
              error instanceof Error ? error.message : "Неизвестная ошибка"
            }`
          );
        }
      }

      // Отправляем данные лекции
      const response = await fetch("/api/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          vkVideoUrl: form.vkVideoUrl,
          pdfUrl: finalPdfUrl || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка при сохранении лекции");
      }

      // Сброс формы после успешного сохранения
      setForm({
        title: "",
        description: "",
        vkVideoUrl: "",
        pdfFile: null,
        pdfUrl: "",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";

      toast.success("Лекция успешно добавлена", { id: toastId });
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Неизвестная ошибка",
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div>
        <Label htmlFor="title" className="mb-2">
          Название лекции *
        </Label>
        <Input
          id="title"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Введите название лекции"
        />
        {errors.title && (
          <p className="text-sm text-red-500 mt-1">{errors.title}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description" className="mb-2">
          Описание
        </Label>
        <Textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Добавьте описание лекции"
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
          value={form.vkVideoUrl}
          onChange={handleChange}
          placeholder="https://vk.com/video_ext.php?oid=-12345&id=67890&hd=2"
        />
        {errors.vkVideoUrl && (
          <p className="text-sm text-red-500 mt-1">{errors.vkVideoUrl}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          Скопируйте ссылку из адресной строки при просмотре видео в VK
        </p>
      </div>

      <div>
        <Label>PDF конспект</Label>

        {/* Поле для загрузки файла */}
        <div className="mt-2">
          <Label htmlFor="pdf-upload" className="sr-only">
            Выберите PDF файл
          </Label>
          <div className="flex items-center gap-4">
            <label className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 transition hover:border-gray-400">
              <UploadCloud className="h-10 w-10 text-gray-400" />
              <span className="mt-2 text-sm text-gray-600">
                {form.pdfFile
                  ? form.pdfFile.name
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

            {form.pdfFile && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={removePdfFile}
                className="cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            Поддерживаются только PDF файлы (максимум 10MB)
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Добавить лекцию
        </Button>
      </div>
    </form>
  );
}
