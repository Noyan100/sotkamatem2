"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
  Edit,
  Trash2,
  Check,
  X,
  ClipboardCopy,
  Plus,
  Minus,
  Image as ImageIcon,
  Video as VideoIcon,
  Copy,
  FileText,
  FlipHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  COMMON_TASK_TYPES,
  getTaskTypesForNumber,
  SOURCE_TYPES,
  WAVE_TYPES,
} from "./constants";
import * as htmlToImage from "html-to-image";
import { copyImageToClipboard } from "copy-image-clipboard";
import { CollectionManager } from "./collectionManager";
import { LatexText } from "../LatextText";

type Source = {
  sourceType: string;
  year: number | null;
  wave: string | null;
  region: string | null;
  name: string | null;
};

type SolutionBlock =
  | { type: "text"; content: string }
  | { type: "image"; file: File | null; previewUrl: string | null };

interface Props {
  className?: string;
  id: number;
  number: string;
  image?: string | null;
  text: string;
  sources: any;
  solution: string;
  answer: string;
  type?: string;
  videoSrc?: string | null;
  onDelete?: (id: number) => Promise<void>;
  onUpdate?: (updatedData: {
    id: number;
    number: string;
    text: string;
    solution: string;
    answer: string;
    type: string;
    sources: any;
    image?: string | null;
    videoSrc?: string | null;
  }) => Promise<void>;
}

export const TaskCard: React.FC<Props> = ({
  className,
  id,
  number,
  image,
  text,
  sources,
  solution,
  answer,
  type,
  videoSrc,
  onDelete,
  onUpdate,
}) => {
  const { data: session, status } = useSession();
  const [activeAnswer, setActiveAnswer] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedText, setEditedText] = useState(text);
  const [editedSolutionBlocks, setEditedSolutionBlocks] = useState<
    SolutionBlock[]
  >(solution ? JSON.parse(solution) : [{ type: "text", content: "" }]);
  const [editedAnswer, setEditedAnswer] = useState(answer);
  const [editedNumber, setEditedNumber] = useState(number);
  const [editedType, setEditedType] = useState(type || "");
  const [editedImage, setEditedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(image || null);
  const [editedVideoSrc, setEditedVideoSrc] = useState(videoSrc || "");
  const [editedSources, setEditedSources] = useState(
    typeof sources === "string"
      ? JSON.parse(sources)
      : Array.isArray(sources)
      ? sources
      : [sources]
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const solutionImageRefs = useRef<(HTMLInputElement | null)[]>([]);
  const taskCardRef = useRef<HTMLDivElement>(null);
  const solutionRef = useRef<HTMLDivElement>(null);
  const imageSectionRef = useRef<HTMLDivElement>(null);
  const [focusedBlockIndex, setFocusedBlockIndex] = useState<number | null>(
    null
  );

  const taskTypes = editedNumber
    ? getTaskTypesForNumber(editedNumber)
    : COMMON_TASK_TYPES;

  // Обработчик глобальной вставки изображений через Ctrl+V
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      // Проверяем, есть ли изображение в буфере
      const items = Array.from(e.clipboardData?.files || []);
      const imageItems = items.filter((item) => item.type.startsWith("image/"));

      if (imageItems.length > 0) {
        e.preventDefault();

        const file = imageItems[0];
        const previewUrl = URL.createObjectURL(file);

        // Проверяем, находимся ли мы в режиме редактирования
        if (isEditing) {
          // Проверяем, находится ли фокус в секции изображения задачи
          const activeElement = document.activeElement;
          const isInImageSection =
            imageSectionRef.current?.contains(activeElement);

          if (isInImageSection) {
            // Вставка в основное изображение задачи
            setEditedImage(file);
            setImagePreview(previewUrl);
            toast.success("Изображение задачи вставлено из буфера обмена");
          }
          // Если фокус в текстовом поле решения, преобразуем его в блок с изображением
          else if (
            activeElement?.tagName === "TEXTAREA" &&
            focusedBlockIndex !== null
          ) {
            setEditedSolutionBlocks((prev) =>
              prev.map((block, index) =>
                index === focusedBlockIndex && block.type === "text"
                  ? {
                      type: "image",
                      file,
                      previewUrl,
                    }
                  : block
              )
            );
            toast.success("Текстовый блок преобразован в изображение");
          }
          // Если фокус в поле загрузки изображения решения, обновляем его
          else if (
            activeElement?.tagName === "INPUT" &&
            activeElement.getAttribute("type") === "file" &&
            focusedBlockIndex !== null
          ) {
            setEditedSolutionBlocks((prev) =>
              prev.map((block, index) =>
                index === focusedBlockIndex && block.type === "image"
                  ? { ...block, file, previewUrl }
                  : block
              )
            );
            toast.success("Изображение решения вставлено из буфера обмена");
          }
          // Если фокус в другом месте диалога, добавляем новый блок с изображением
          else {
            setEditedSolutionBlocks((prev) => [
              ...prev,
              {
                type: "image",
                file,
                previewUrl,
              },
            ]);
            toast.success(
              "Добавлено новое изображение решения из буфера обмена"
            );
          }
        }
      }
    };

    document.addEventListener("paste", handleGlobalPaste);
    return () => document.removeEventListener("paste", handleGlobalPaste);
  }, [isEditing, focusedBlockIndex]);

  // Отслеживаем фокус на текстовых полях решения
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "TEXTAREA" &&
        target.closest("[data-block-index]")
      ) {
        const blockIndex = parseInt(
          target
            .closest("[data-block-index]")
            ?.getAttribute("data-block-index") || "-1"
        );
        if (!isNaN(blockIndex) && blockIndex >= 0) {
          setFocusedBlockIndex(blockIndex);
        }
      }
    };

    document.addEventListener("focusin", handleFocusIn);
    return () => document.removeEventListener("focusin", handleFocusIn);
  }, []);

  const toggleAnswer = () => setActiveAnswer(!activeAnswer);

  const solutionAnimationStyles = {
    transition: "max-height 0.3s ease-in-out, opacity 0.3s ease-in-out",
    overflow: "hidden",
    maxHeight: activeAnswer ? "1000px" : "0px",
    opacity: activeAnswer ? 1 : 0,
  };

  const copyAsImage = async (
    ref: React.RefObject<HTMLDivElement>,
    name: string
  ) => {
    if (!ref.current) return;

    try {
      toast.loading("Подготовка изображения...");
      const dataUrl = await htmlToImage.toPng(ref.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "white",
        cacheBust: true,
      });

      toast.dismiss();
      await copyImageToClipboard(dataUrl)
        .then(() => {
          toast.success(`${name} скопировано как изображение`);
        })
        .catch(() => {
          const link = document.createElement("a");
          link.download = `${name}-${number}-${id}.png`;
          link.href = dataUrl;
          link.click();
          toast.success(`Изображение сохранено (${name})`);
        });
    } catch (error) {
      toast.dismiss();
      toast.error("Не удалось скопировать изображение");
      console.error("Ошибка при копировании изображения:", error);
    }
  };

  const copyTaskImage = () => copyAsImage(taskCardRef, "Задание");
  const copySolutionImage = () => copyAsImage(solutionRef, "Решение");

  const addTextBlock = () => {
    setEditedSolutionBlocks([
      ...editedSolutionBlocks,
      { type: "text", content: "" },
    ]);
  };

  const addImageBlock = () => {
    setEditedSolutionBlocks([
      ...editedSolutionBlocks,
      { type: "image", file: null, previewUrl: null },
    ]);
  };

  const updateTextBlock = (index: number, content: string) => {
    const newBlocks = [...editedSolutionBlocks];
    if (newBlocks[index].type === "text") {
      newBlocks[index] = { ...newBlocks[index], content };
      setEditedSolutionBlocks(newBlocks);
    }
  };

  const handleSolutionImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);

      const newBlocks = [...editedSolutionBlocks];
      newBlocks[index] = {
        ...newBlocks[index],
        file,
        previewUrl,
      };
      setEditedSolutionBlocks(newBlocks);
    }
  };

  const removeSolutionBlock = (index: number) => {
    if (editedSolutionBlocks.length <= 1) return;
    const newBlocks = [...editedSolutionBlocks];
    newBlocks.splice(index, 1);
    setEditedSolutionBlocks(newBlocks);
  };

  const renderSolutionBlocksEdit = () => {
    return editedSolutionBlocks.map((block, index) => (
      <div key={index} className="mb-4 relative group" data-block-index={index}>
        {block.type === "text" ? (
          <>
            <Textarea
              value={block.content}
              onChange={(e) => updateTextBlock(index, e.target.value)}
              className="min-h-[100px]"
              placeholder="Введите текст решения или вставьте изображение через Ctrl+V"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Подсказка: используйте Ctrl+V для вставки изображения
            </div>
          </>
        ) : (
          <div className="border rounded p-2">
            {block.previewUrl && (
              <Image
                src={block.previewUrl}
                width={300}
                height={200}
                alt={`Решение изображение ${index + 1}`}
                className="max-w-full h-auto mb-2"
              />
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleSolutionImageChange(e, index)}
              ref={(el) => (solutionImageRefs.current[index] = el)}
              placeholder="Выберите файл или вставьте изображение через Ctrl+V"
            />
          </div>
        )}
        <button
          onClick={() => removeSolutionBlock(index)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500"
        >
          <Minus size={16} />
        </button>
      </div>
    ));
  };

  const renderSolutionBlocksView = () => {
    return (
      <div className="space-y-4 ">
        {editedSolutionBlocks.map((block, index) => (
          <div key={index} className="mb-4">
            {block.type === "text" ? (
              <LatexText content={block.content} />
            ) : (
              block.previewUrl && (
                <Image
                  src={block.previewUrl}
                  width={300}
                  height={200}
                  alt={`Решение изображение ${index + 1}`}
                  className="max-w-full h-auto"
                />
              )
            )}
          </div>
        ))}
        <div className="font-medium">
          Ответ:{" "}
          <span className="font-normal">
            <LatexText content={answer} />
          </span>
        </div>
      </div>
    );
  };

  const handleEditStart = () => {
    setIsEditing(true);
    setEditedSources(
      typeof sources === "string"
        ? JSON.parse(sources)
        : Array.isArray(sources)
        ? sources
        : [sources]
    );
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditedText(text);
    setEditedSolutionBlocks(
      solution ? JSON.parse(solution) : [{ type: "text", content: "" }]
    );
    setEditedAnswer(answer);
    setEditedNumber(number);
    setEditedType(type || "");
    setEditedImage(null);
    setImagePreview(image || null);
    setEditedVideoSrc(videoSrc || "");
    setFocusedBlockIndex(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditedImage(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setEditedImage(null);
    setImagePreview(null);
  };

  const handleEditSave = async () => {
    if (!onUpdate) return;

    try {
      const formData = new FormData();
      formData.append("id", id.toString());
      formData.append("number", editedNumber);
      formData.append("text", editedText);
      formData.append("solution", JSON.stringify(editedSolutionBlocks));
      formData.append("answer", editedAnswer);
      formData.append("type", editedType);
      formData.append("sources", JSON.stringify(editedSources));
      formData.append("videoSrc", editedVideoSrc);

      editedSolutionBlocks.forEach((block, index) => {
        if (block.type === "image" && block.file) {
          formData.append(`solutionImage_${index}`, block.file);
        }
      });

      if (editedImage) {
        formData.append("image", editedImage);
      } else if (imagePreview === null) {
        formData.append("removeImage", "true");
      }

      const response = await fetch(`/api/tasks?id=${id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка при обновлении задания");
      }

      const updatedTask = await response.json();
      setIsEditing(false);
      toast.success("Изменения сохранены");

      if (updatedTask.image) {
        setImagePreview(`${updatedTask.image.split("?")[0]}?v=${Date.now()}`);
      } else {
        setImagePreview(null);
      }

      if (updatedTask.videoSrc) {
        setEditedVideoSrc(updatedTask.videoSrc);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Не удалось сохранить изменения"
      );
    }
  };

  const handleSourceChange = (index: number, field: string, value: any) => {
    const newSources = [...editedSources];
    newSources[index] = { ...newSources[index], [field]: value };
    setEditedSources(newSources);
  };

  const addSource = () => {
    setEditedSources([
      ...editedSources,
      {
        sourceType: "ФИПИ",
        year: new Date().getFullYear(),
        wave: null,
        region: null,
        name: null,
      },
    ]);
  };

  const removeSource = (index: number) => {
    if (editedSources.length <= 1) {
      toast.warning("Должен остаться хотя бы один источник");
      return;
    }
    setEditedSources(editedSources.filter((_: any, i: number) => i !== index));
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(id);
      toast.success("Задание удалено");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Ошибка при удалении"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const formatSources = (sources: any): string => {
    if (!sources) return "Не указаны";

    if (typeof sources === "string") return sources;

    if (!Array.isArray(sources)) {
      return JSON.stringify(sources);
    }

    const fipiSources = sources.filter(
      (source) => source.sourceType === "ФИПИ"
    );
    const mathegeSources = sources.filter(
      (source) => source.sourceType === "mathege"
    );
    const waveSources = sources.filter(
      (source) => source.sourceType === "Волны ЕГЭ"
    );
    const otherSources = sources.filter(
      (source) =>
        source.sourceType !== "ФИПИ" &&
        source.sourceType !== "mathege" &&
        source.sourceType !== "Волны ЕГЭ"
    );

    const fipiStrings = fipiSources.map((source) => {
      return `${source.sourceType}${
        source.name ? `: ${source.name}` : ""
      }`.trim();
    });

    const mathegeStrings = mathegeSources.map((source) => {
      return `${source.sourceType}${
        source.name ? `: ${source.name}` : ""
      }`.trim();
    });

    const waveGroups: Record<string, number[]> = {};

    waveSources.forEach((source) => {
      const wave = source.wave || "Неизвестная волна";
      const year = parseInt(source.year);

      if (!isNaN(year)) {
        if (!waveGroups[wave]) {
          waveGroups[wave] = [];
        }
        waveGroups[wave].push(year);
      }
    });

    const waveStrings = Object.entries(waveGroups).map(([wave, years]) => {
      const sortedYears = [...years].sort((a, b) => a - b);
      const ranges: string[] = [];
      let start = sortedYears[0];
      let prev = start;

      for (let i = 1; i <= sortedYears.length; i++) {
        const current = sortedYears[i];
        if (current === prev + 1) {
          prev = current;
        } else {
          ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
          start = current;
          prev = current;
        }
      }

      return `${wave} ${ranges.join(", ")}`;
    });

    const otherStrings = otherSources.map((source) => {
      if (
        source.sourceType === "Сборники" ||
        source.sourceType === "Статград" ||
        source.sourceType === "Другое"
      ) {
        return `${source.sourceType}${
          source.name ? `: ${source.name}` : ""
        }`.trim();
      }
      return source.sourceType || "Неизвестный источник";
    });

    const allSources = [
      ...fipiStrings,
      ...mathegeStrings,
      ...waveStrings,
      ...otherStrings,
    ];

    return allSources.join(", ");
  };

  const copyVideoUrl = () => {
    if (!videoSrc) return;

    navigator.clipboard
      .writeText(videoSrc)
      .then(() => {
        toast.success("Ссылка на видео скопирована");
      })
      .catch((err) => {
        console.error("Не удалось скопировать ссылку:", err);
        toast.error("Не удалось скопировать ссылку");
      });
  };

  const copyText = () => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success("Текст задания скопирован");
      })
      .catch((err) => {
        console.error("Не удалось скопировать текст:", err);
        toast.error("Не удалось скопировать текст");
      });
  };

  if (isEditing && (session?.user as any)?.role === "ADMIN") {
    return (
      <div
        className={cn(
          "w-full bg-white rounded-xl p-6 border-2 border-blue-200 shadow-xs",
          className
        )}
      >
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Редактирование задания #{id}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleEditCancel}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                title="Отменить"
              >
                <X size={18} />
              </button>
              <button
                onClick={handleEditSave}
                className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-full"
                title="Сохранить"
              >
                <Check size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Номер задания
              </label>
              <Input
                value={editedNumber}
                onChange={(e) => setEditedNumber(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Тип задания
              </label>
              <select
                value={editedType}
                onChange={(e) => setEditedType(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {taskTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Текст задания
            </label>
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="min-h-[120px]"
              required
            />
          </div>

          <div className="space-y-2" ref={imageSectionRef} tabIndex={0}>
            <label className="block text-sm font-medium mb-1">
              Изображение задания
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <ImageIcon size={16} />
                {imagePreview ? "Заменить" : "Добавить"} изображение
              </button>
              {imagePreview && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Удалить
                </button>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            {imagePreview && (
              <div className="mt-2">
                <Image
                  src={imagePreview}
                  width={300}
                  height={200}
                  alt="Предпросмотр изображения"
                  className="max-w-full h-auto border rounded"
                />
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              Подсказка: установите фокус на эту секцию и используйте Ctrl+V для
              вставки изображения
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium mb-1">
              Видеоразбор (ссылка)
            </label>
            <div className="flex items-center gap-2">
              <VideoIcon className="text-gray-500" size={18} />
              <Input
                type="url"
                value={editedVideoSrc}
                onChange={(e) => setEditedVideoSrc(e.target.value)}
                placeholder="https://example.com/..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Решение</label>
            <div className="space-y-4">
              {renderSolutionBlocksEdit()}
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

          <div>
            <label className="block text-sm font-medium mb-1">Ответ</label>
            <Input
              type="text"
              value={editedAnswer}
              onChange={(e) => setEditedAnswer(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Источники</label>
              <button
                type="button"
                onClick={addSource}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <Plus size={16} /> Добавить
              </button>
            </div>

            <div className="space-y-3">
              {editedSources.map((source: any, index: number) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg bg-gray-50 relative"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Тип источника
                      </label>
                      <select
                        value={source.sourceType}
                        onChange={(e) =>
                          handleSourceChange(
                            index,
                            "sourceType",
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded text-sm"
                      >
                        {SOURCE_TYPES.map((st) => (
                          <option key={st.value} value={st.value}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {source.sourceType === "Волны ЕГЭ" && (
                      <>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            Год
                          </label>
                          <input
                            type="number"
                            value={source.year || ""}
                            onChange={(e) =>
                              handleSourceChange(
                                index,
                                "year",
                                e.target.value ? parseInt(e.target.value) : null
                              )
                            }
                            className="w-full p-2 border rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            Волна
                          </label>
                          <select
                            value={source.wave || ""}
                            onChange={(e) =>
                              handleSourceChange(index, "wave", e.target.value)
                            }
                            className="w-full p-2 border rounded text-sm"
                          >
                            {WAVE_TYPES.map((wt) => (
                              <option key={wt.value} value={wt.value}>
                                {wt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    {(source.sourceType === "Сборники" ||
                      source.sourceType === "Статград" ||
                      source.sourceType === "Другое") && (
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">
                          {source.sourceType === "Сборники"
                            ? "Название сборника"
                            : source.sourceType === "Статград"
                            ? "Название работы"
                            : "Название источника"}
                        </label>
                        <input
                          value={source.name || ""}
                          onChange={(e) =>
                            handleSourceChange(index, "name", e.target.value)
                          }
                          className="w-full p-2 border rounded text-sm"
                        />
                      </div>
                    )}
                  </div>

                  {editedSources.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSource(index)}
                      className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700"
                      title="Удалить источник"
                    >
                      <Minus size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("w-full bg-white rounded-xl shadow-sm border", className)}
      ref={solutionRef}
    >
      <div ref={taskCardRef}>
        <div className="p-6">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-medium">Задание #{number}</span>
            <span className="text-blue-700">№{id}</span>
          </div>

          <div className="mt-3">
            <LatexText content={text} />
          </div>

          {imagePreview && (
            <div className="mt-2">
              <Image
                src={imagePreview}
                width={300}
                height={200}
                alt="Картинка задания"
                className="max-w-full h-auto"
              />
            </div>
          )}

          <div className="mt-4 text-right text-sm text-gray-500 ">
            Источники: {formatSources(sources)}
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <hr className="mb-4" />
        <div className="flex justify-between items-center">
          <button
            onClick={toggleAnswer}
            className="font-medium text-left hover:text-blue-600 transition-colors cursor-pointer"
          >
            {activeAnswer ? "Скрыть решение" : "Показать решение и ответ"}
          </button>

          <div className="flex gap-2">
            {activeAnswer && (session?.user as any)?.role === "ADMIN" && (
              <button
                onClick={copySolutionImage}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer"
                title="Копировать решение"
              >
                <FileText size={18} />
              </button>
            )}
            {(session?.user as any)?.role === "ADMIN" && (
              <CollectionManager
                taskId={id}
                onCollectionCreated={(collectionId) => {
                  console.log("Created collection with ID:", collectionId);
                }}
              />
            )}
            {(session?.user as any)?.role === "ADMIN" && (
              <button
                onClick={copyTaskImage}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer"
                title="Копировать задание"
              >
                <Copy size={18} />
              </button>
            )}
            {videoSrc && (session?.user as any)?.role === "ADMIN" && (
              <button
                onClick={copyVideoUrl}
                className="p-2 text-gray-600 hover:bg-blue-50 rounded-full cursor-pointer"
                title="Копировать ссылку на видеоразбор"
              >
                <ClipboardCopy size={18} />
              </button>
            )}
            {onUpdate && (session?.user as any)?.role === "ADMIN" && (
              <button
                onClick={handleEditStart}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full cursor-pointer"
                title="Редактировать"
              >
                <Edit size={18} />
              </button>
            )}
            {onDelete && (session?.user as any)?.role === "ADMIN" && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-red-600 hover:bg-red-50 rounded-full cursor-pointer"
                title="Удалить"
              >
                <Trash2 size={18} />
              </button>
            )}
            {(session?.user as any)?.role === "ADMIN" && (
              <button
                onClick={copyText}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer"
                title="Скопировать текстом"
              >
                <FlipHorizontal size={18} />
              </button>
            )}
          </div>
        </div>

        <div style={solutionAnimationStyles}>
          <div className="mt-4 space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Решение:</h4>
              {renderSolutionBlocksView()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
