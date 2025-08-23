"use client";

import { useState, useCallback } from "react";
import { UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

interface ImageUploaderProps {
  taskId: number;
  onUpload: (filePaths: string[]) => void; // Теперь принимает массив путей
  onRemove: (index: number) => void; // Принимает индекс удаляемого изображения
  existingImages?: string[]; // Массив существующих изображений
  maxFiles?: number; // Максимальное количество файлов
}

export function ImageUploader({
  taskId,
  onUpload,
  onRemove,
  existingImages = [],
  maxFiles = 5,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleSaveImage = async (file: File): Promise<string> => {
    // В development сохраняем как Base64, в production - в public/temp
    if (process.env.NODE_ENV === "development") {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    } else {
      const tempDir = "/temp/solutions/";
      const fileName = `task_${taskId}_${Date.now()}.${file.name
        .split(".")
        .pop()}`;
      const filePath = `${tempDir}${fileName}`;

      // В реальном приложении здесь будет запрос к API для сохранения файла
      // Для примера просто возвращаем путь
      return filePath;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter((file) => {
      if (!file.type.match("image.*")) {
        toast.error(`Файл ${file.name} не является изображением`);
        return false;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Файл ${file.name} превышает 5MB`);
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    const remainingSlots = maxFiles - existingImages.length;
    if (validFiles.length > remainingSlots) {
      toast.error(`Можно загрузить только ${remainingSlots} изображений`);
      return;
    }

    try {
      setIsUploading(true);
      const filePaths = await Promise.all(
        validFiles.map((file) => handleSaveImage(file))
      );
      onUpload([...existingImages, ...filePaths]);
      toast.success(`Загружено ${validFiles.length} изображений`);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Ошибка при загрузке изображений");
    } finally {
      setIsUploading(false);
    }
  };

  if (existingImages.length > 0) {
    return (
      <div className="space-y-4 max-w-lg">
        <div className="flex flex-wrap gap-4">
          {existingImages.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image}
                alt={`Решение задачи ${taskId} #${index + 1}`}
                className="h-40 rounded-lg border object-contain"
              />
              <button
                onClick={() => onRemove(index)}
                className="cursor-pointer absolute -top-2 -right-2 bg-black text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {existingImages.length < maxFiles && (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <UploadCloud
                className={`h-10 w-10 ${
                  isUploading ? "animate-pulse" : "text-gray-400"
                }`}
              />
              <p className="text-sm text-gray-600">
                {isUploading
                  ? "Загрузка..."
                  : "Перетащите изображения сюда или"}
              </p>
              <label className="cursor-pointer text-blue-500 hover:text-blue-700 disabled:opacity-50">
                <span>выберите файлы</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading || existingImages.length >= maxFiles}
                  multiple
                />
              </label>
              <p className="text-xs text-gray-500">
                Поддерживаются JPG, PNG (макс. 5MB). Максимум {maxFiles}{" "}
                изображений
              </p>
              <p className="text-xs text-gray-500">
                Можно загрузить еще {maxFiles - existingImages.length} файлов
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`max-w-lg border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
      }`}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center gap-2">
        <UploadCloud
          className={`h-10 w-10 ${
            isUploading ? "animate-pulse" : "text-gray-400"
          }`}
        />
        <p className="text-sm text-gray-600">
          {isUploading ? "Загрузка..." : "Перетащите изображения сюда или"}
        </p>
        <label className="cursor-pointer text-blue-500 hover:text-blue-700 disabled:opacity-50">
          <span>выберите файлы</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
            multiple
          />
        </label>
        <p className="text-xs text-gray-500">
          Поддерживаются JPG, PNG (макс. 5MB). Максимум {maxFiles} изображений
        </p>
      </div>
    </div>
  );
}
