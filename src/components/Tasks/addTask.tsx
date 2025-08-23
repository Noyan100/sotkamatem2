"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  COMMON_TASK_TYPES,
  SPECIALIZED_TASK_TYPES,
  SOURCE_TYPES,
  WAVE_TYPES,
} from "./constants";
import { Plus, Image as ImageIcon, Minus, Video, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Source = {
  sourceType: string;
  year: number | null;
  wave: string | null;
  region: string | null;
  name: string | null;
};

type SolutionBlock =
  | { type: "text"; content: string; id: string }
  | { type: "image"; file: File | null; previewUrl: string | null; id: string };

export const AddTask = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [videoSrc, setVideoSrc] = useState("");
  const [formData, setFormData] = useState({
    number: "",
    text: "",
    type: "",
    sources: [
      {
        sourceType: "ФИПИ",
        year: null,
        wave: null,
        region: null,
        name: null,
      },
    ] as Source[],
    answer: "",
    score: 1,
  });
  const [solutionBlocks, setSolutionBlocks] = useState<SolutionBlock[]>([
    { type: "text", content: "", id: generateId() },
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const imageSectionRef = useRef<HTMLDivElement>(null);

  function generateId() {
    return Math.random().toString(36).substring(2, 9);
  }

  // Обработчик глобальной вставки изображений через Ctrl+V
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      // Проверяем, открыт ли диалог и есть ли изображение в буфере
      if (!isOpen) return;

      const items = Array.from(e.clipboardData?.files || []);
      const imageItems = items.filter((item) => item.type.startsWith("image/"));

      if (imageItems.length > 0) {
        e.preventDefault();

        // Проверяем, находится ли фокус в каком-либо элементе диалога
        const activeElement = document.activeElement;
        const isInDialog = dialogRef.current?.contains(activeElement);

        if (isInDialog) {
          const file = imageItems[0];
          const previewUrl = URL.createObjectURL(file);

          // Проверяем, находится ли фокус в секции изображения задачи
          const isInImageSection =
            imageSectionRef.current?.contains(activeElement);

          if (isInImageSection) {
            // Вставка в основное изображение задачи
            setImageFile(file);
            setImagePreviewUrl(previewUrl);
            toast.success("Изображение задачи вставлено из буфера обмена");
          }
          // Если фокус в текстовом поле решения, преобразуем его в блок с изображением
          else if (activeElement?.tagName === "TEXTAREA") {
            const textarea = activeElement as HTMLTextAreaElement;
            const blockElement = textarea.closest("[data-block-id]");
            const blockId = blockElement?.getAttribute("data-block-id");

            if (blockId) {
              setSolutionBlocks((prev) =>
                prev.map((block) =>
                  block.id === blockId && block.type === "text"
                    ? {
                        type: "image",
                        file,
                        previewUrl,
                        id: blockId,
                      }
                    : block
                )
              );
              toast.success("Текстовый блок преобразован в изображение");
            }
          }
          // Если фокус в поле загрузки изображения решения, обновляем его
          else if (
            activeElement?.tagName === "INPUT" &&
            activeElement.getAttribute("type") === "file"
          ) {
            const input = activeElement as HTMLInputElement;
            const blockElement = input.closest("[data-block-id]");
            const blockId = blockElement?.getAttribute("data-block-id");

            if (blockId) {
              setSolutionBlocks((prev) =>
                prev.map((block) =>
                  block.id === blockId && block.type === "image"
                    ? { ...block, file, previewUrl }
                    : block
                )
              );
              toast.success("Изображение решения вставлено из буфера обмена");
            }
          }
          // Если фокус в другом месте диалога, добавляем новый блок с изображением
          else {
            const newBlockId = generateId();

            setSolutionBlocks((prev) => [
              ...prev,
              {
                type: "image",
                file,
                previewUrl,
                id: newBlockId,
              },
            ]);

            // Прокручиваем к новому блоку
            setTimeout(() => {
              const newBlockElement = document.querySelector(
                `[data-block-id="${newBlockId}"]`
              );
              newBlockElement?.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
              });
            }, 100);

            toast.success(
              "Добавлено новое изображение решения из буфера обмена"
            );
          }
        }
      }
    };

    document.addEventListener("paste", handleGlobalPaste);
    return () => document.removeEventListener("paste", handleGlobalPaste);
  }, [isOpen]);

  const availableTaskTypes = formData.number
    ? [...COMMON_TASK_TYPES, ...(SPECIALIZED_TASK_TYPES[formData.number] || [])]
    : COMMON_TASK_TYPES;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "number") {
      setFormData((prev) => ({ ...prev, type: "" }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoSrc(e.target.value);
  };

  const addTextBlock = () => {
    setSolutionBlocks((prev) => [
      ...prev,
      { type: "text", content: "", id: generateId() },
    ]);
  };

  const addImageBlock = () => {
    setSolutionBlocks((prev) => [
      ...prev,
      {
        type: "image",
        file: null,
        previewUrl: null,
        id: generateId(),
      },
    ]);
  };

  const updateTextBlock = (blockId: string, content: string) => {
    setSolutionBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId && block.type === "text"
          ? { ...block, content }
          : block
      )
    );
  };

  const handleSolutionImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    blockId: string
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);

      setSolutionBlocks((prev) =>
        prev.map((block) =>
          block.id === blockId ? { ...block, file, previewUrl } : block
        )
      );
    }
  };

  const removeSolutionBlock = (blockId: string) => {
    if (solutionBlocks.length <= 1) {
      toast.warning("Должен остаться хотя бы один блок");
      return;
    }
    setSolutionBlocks((prev) => prev.filter((block) => block.id !== blockId));
  };

  const renderSolutionBlocks = () => {
    return solutionBlocks.map((block) => (
      <div
        key={block.id}
        className="mb-4 relative group"
        data-block-id={block.id}
        tabIndex={0}
      >
        {block.type === "text" ? (
          <>
            <Textarea
              value={block.content}
              onChange={(e) => updateTextBlock(block.id, e.target.value)}
              className="min-h-[100px]"
              placeholder="Введите текст решения..."
            />
            <div className="text-xs text-muted-foreground mt-1">
              Подсказка: используйте Ctrl+V для вставки изображения
            </div>
          </>
        ) : (
          <div className="border rounded p-2">
            {block.previewUrl && (
              <div className="mb-2">
                <img
                  src={block.previewUrl}
                  alt="Превью изображения решения"
                  className="max-w-full h-auto max-h-60 object-contain"
                />
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleSolutionImageChange(e, block.id)}
              placeholder="Или вставьте изображение через Ctrl+V"
            />
          </div>
        )}
        <button
          type="button"
          onClick={() => removeSolutionBlock(block.id)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500"
        >
          <Minus size={16} />
        </button>
      </div>
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("number", formData.number);
      formDataToSend.append("text", formData.text);
      formDataToSend.append("type", formData.type);
      formDataToSend.append("answer", formData.answer);
      formDataToSend.append("sources", JSON.stringify(formData.sources));
      formDataToSend.append("videoSrc", videoSrc);

      const blocksToSave = solutionBlocks.map((block) => {
        if (block.type === "image") {
          return {
            type: "image",
            fileName: block.file ? `${block.id}_${block.file.name}` : null,
            previewUrl: null,
          };
        }
        return block;
      });
      formDataToSend.append("solution", JSON.stringify(blocksToSave));

      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }

      solutionBlocks.forEach((block) => {
        if (block.type === "image" && block.file) {
          formDataToSend.append("solutionImages", block.file);
        }
      });

      const response = await fetch("/api/tasks", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка при добавлении задания");
      }

      toast.success("Задание успешно добавлено");
      router.refresh();
      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error("Ошибка:", error);
      toast.error(
        error instanceof Error ? error.message : "Неизвестная ошибка"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      number: "",
      text: "",
      type: "",
      sources: [
        {
          sourceType: "ФИПИ",
          year: null,
          wave: null,
          region: null,
          name: null,
        },
      ],
      answer: "",
      score: 1,
    });
    setSolutionBlocks([{ type: "text", content: "", id: generateId() }]);
    setImageFile(null);
    setImagePreviewUrl(null);
    setVideoSrc("");
  };

  const addSource = () => {
    setFormData((prev) => ({
      ...prev,
      sources: [
        ...prev.sources,
        {
          sourceType: "ФИПИ",
          year: null,
          wave: null,
          region: null,
          name: null,
        },
      ],
    }));
  };

  const removeSource = (index: number) => {
    if (formData.sources.length <= 1) {
      toast.warning("Должен остаться хотя бы один источник");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      sources: prev.sources.filter((_, i) => i !== index),
    }));
  };

  const updateSource = (index: number, field: keyof Source, value: any) => {
    setFormData((prev) => {
      const newSources = [...prev.sources];
      newSources[index] = { ...newSources[index], [field]: value };
      return { ...prev, sources: newSources };
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="mt-6">
        <Plus size={16} className="mr-2" />
        Добавить задание
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="min-w-3xl max-h-[90vh] overflow-y-auto"
          ref={dialogRef}
        >
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Добавить новое задание</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Номер задания *</Label>
                <Input
                  name="number"
                  value={formData.number}
                  onChange={handleChange}
                  required
                  placeholder="Например: 1, 2, 3..."
                />
              </div>

              <div className="space-y-2">
                <Label>Тип задания *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                  disabled={!formData.number}
                  required
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        formData.number
                          ? "Выберите тип"
                          : "Сначала укажите номер"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTaskTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="block mb-2">Источники задания *</Label>
              <div className="space-y-4">
                {formData.sources.map((source, index) => (
                  <div key={index} className="p-4 border rounded-lg relative">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeSource(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      >
                        Удалить
                      </button>
                    )}

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Тип источника *</Label>
                        <Select
                          value={source.sourceType}
                          onValueChange={(value) =>
                            updateSource(index, "sourceType", value)
                          }
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите тип источника" />
                          </SelectTrigger>
                          <SelectContent>
                            {SOURCE_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {source.sourceType === "Волны ЕГЭ" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Год *</Label>
                            <Input
                              type="number"
                              value={source.year || ""}
                              onChange={(e) =>
                                updateSource(
                                  index,
                                  "year",
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : null
                                )
                              }
                              placeholder="2023"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Волна *</Label>
                            <Select
                              value={source.wave || ""}
                              onValueChange={(value) =>
                                updateSource(index, "wave", value)
                              }
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите волну" />
                              </SelectTrigger>
                              <SelectContent>
                                {WAVE_TYPES.map((wave) => (
                                  <SelectItem
                                    key={wave.value}
                                    value={wave.value}
                                  >
                                    {wave.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {(source.sourceType === "Сборники" ||
                        source.sourceType === "Статград" ||
                        source.sourceType === "Другое") && (
                        <div className="space-y-2">
                          <Label>
                            {source.sourceType === "Сборники" &&
                              "Название сборника *"}
                            {source.sourceType === "Статград" &&
                              "Название работы *"}
                            {source.sourceType === "Другое" &&
                              "Название источника *"}
                          </Label>
                          <Input
                            value={source.name || ""}
                            onChange={(e) =>
                              updateSource(index, "name", e.target.value)
                            }
                            required
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addSource}
                  className="w-full"
                >
                  Добавить источник
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Текст задания *</Label>
              <Textarea
                name="text"
                value={formData.text}
                onChange={handleChange}
                rows={5}
                required
                placeholder="Введите текст задания..."
              />
            </div>

            <div className="space-y-2" ref={imageSectionRef} tabIndex={0}>
              <Label>Изображение задания (опционально)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
                placeholder="Выберите файл или вставьте изображение через Ctrl+V"
              />
              {imagePreviewUrl && (
                <div className="mt-2">
                  <img
                    src={imagePreviewUrl}
                    alt="Превью изображения задачи"
                    className="max-w-full h-auto max-h-60 object-contain border rounded"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Предпросмотр изображения задачи
                  </p>
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                Подсказка: установите фокус на эту секцию и используйте Ctrl+V
                для вставки изображения
              </div>
            </div>

            <div className="space-y-2">
              <Label>Решение *</Label>
              <div className="space-y-4">
                {renderSolutionBlocks()}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTextBlock}
                    size="sm"
                  >
                    <Plus size={16} className="mr-1" /> Текстовый блок
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addImageBlock}
                    size="sm"
                  >
                    <ImageIcon size={16} className="mr-1" /> Блок с изображением
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Ответ *</Label>
                <Input
                  name="answer"
                  value={formData.answer}
                  onChange={handleChange}
                  required
                  placeholder="Введите ответ..."
                />
              </div>

              <div className="space-y-2">
                <Label>Ссылка на видеоразбор (опционально)</Label>
                <div className="flex items-center gap-2">
                  <Video className="text-gray-500" size={18} />
                  <Input
                    type="url"
                    value={videoSrc}
                    onChange={handleVideoChange}
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Добавление..." : "Добавить задание"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
