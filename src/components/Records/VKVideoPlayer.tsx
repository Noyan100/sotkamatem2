"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface VKVideoPlayerProps {
  url: string;
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function VKVideoPlayer({
  url,
  width = 640,
  height = 360,
  className,
}: VKVideoPlayerProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const urlObj = new URL(url);
      const oid = urlObj.searchParams.get("oid");
      const id = urlObj.searchParams.get("id");
      const hash = urlObj.searchParams.get("hash");

      if (!oid || !id) {
        throw new Error("Missing required video parameters");
      }

      let newEmbedUrl = `https://vk.com/video_ext.php?oid=${oid}&id=${id}&hd=2`;

      // Добавляем hash, если он есть в исходной ссылке
      if (hash) {
        newEmbedUrl += `&hash=${hash}`;
      }

      setEmbedUrl(newEmbedUrl);
    } catch (err) {
      console.error("Error parsing VK video URL:", err);
      setError("Invalid VK video URL");
    }
  }, [url]);

  if (error) {
    return (
      <div
        className={cn(
          "bg-gray-100 flex items-center justify-center",
          className
        )}
      >
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-100",
          className
        )}
      >
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg overflow-hidden", className)}>
      <iframe
        src={embedUrl}
        width={width}
        height={height}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        className="border-0 w-full"
      />
    </div>
  );
}
