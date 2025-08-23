import { useEffect, useState } from "react";
import Image from "next/image";

interface SolutionImage {
  id: number;
  image: string; // Формат: "userSolutions/1/1/filename.png"
  createdAt: string;
}

export default function SolutionImagesViewer({
  solutionId,
}: {
  solutionId: number;
}) {
  const [images, setImages] = useState<SolutionImage[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading"
  );

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setStatus("loading");
        const res = await fetch(`/api/solutions/user-solutions/${solutionId}`);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        setImages(data);
        setStatus("success");
      } catch (error) {
        console.error("Failed to load solution images:", error);
        setStatus("error");
      }
    };

    fetchImages();
  }, [solutionId]);

  if (status === "loading") {
    return <div className="p-4 text-center">Загрузка изображений...</div>;
  }

  if (status === "error") {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded text-center">
        Ошибка загрузки изображений
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        Нет прикреплённых изображений
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {images.map((img) => {
        // Нормализация пути к изображению
        const imageUrl = img.image.startsWith("/")
          ? img.image
          : `/${img.image}`;

        return (
          <div key={img.id} className="border rounded-lg overflow-hidden">
            <div className="relative aspect-video bg-gray-50">
              <Image
                src={imageUrl}
                alt={`Решение ${img.id}`}
                fill
                className="object-contain"
                quality={85}
                sizes="(max-width: 768px) 100vw, 50vw"
                onError={(e) => {
                  console.error("Error loading image:", imageUrl);
                  const target = e.target as HTMLImageElement;
                  target.src = "/image-error-placeholder.png";
                }}
              />
            </div>
            <div className="p-2 text-xs text-gray-500 text-center">
              {new Date(img.createdAt).toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
