import { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// Типы для данных из Prisma
type Whiteboard = {
  id: string;
  title: string;
  data: {
    canvasImage?: string;
    images?: Array<{
      src: string;
      x: number;
      y: number;
      originalWidth: number;
      originalHeight: number;
      scale: number;
      rotation: number;
    }>;
    textElements?: Array<{
      content: string;
      x: number;
      y: number;
      color: string;
      fontSize: number;
    }>;
    settings?: {
      brushColor: string;
      brushSize: number;
    };
  };
  assignmentId: string;
  createdAt: string;
  updatedAt: string;
};

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  whiteboards: Whiteboard[];
  createdAt: string;
  updatedAt: string;
};

type DownloadAssignmentsButtonProps = {
  collectionId: number;
};

const DownloadAssignmentsButton: React.FC<DownloadAssignmentsButtonProps> = ({
  collectionId,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const fetchAssignments = async (): Promise<Assignment[]> => {
    const response = await fetch(
      `/api/collections/${collectionId}/assignments`
    );
    if (!response.ok) throw new Error("Failed to fetch assignments");
    return await response.json();
  };

  const fetchWhiteboards = async (
    assignmentId: string
  ): Promise<Whiteboard[]> => {
    const response = await fetch(
      `/api/assignments/${assignmentId}/whiteboards`
    );
    if (!response.ok) throw new Error("Failed to fetch whiteboards");
    return await response.json();
  };

  const convertWhiteboardToImage = async (
    whiteboard: Whiteboard
  ): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1600;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve("");
        return;
      }

      // Заливаем фон
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Отрисовываем сетку
      ctx.strokeStyle = "#eee";
      ctx.lineWidth = 1;
      const gridSize = 30;
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      try {
        // 1. Рисунок
        if (whiteboard.data?.canvasImage) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/png"));
          };
          img.src = whiteboard.data.canvasImage;
        } else {
          // Если нет изображения, просто возвращаем пустой canvas
          resolve(canvas.toDataURL("image/png"));
        }

        // 2. Изображения
        if (whiteboard.data?.images) {
          whiteboard.data.images.forEach((image) => {
            const img = new Image();
            img.onload = () => {
              ctx.save();
              ctx.translate(
                image.x + (image.originalWidth * image.scale) / 2,
                image.y + (image.originalHeight * image.scale) / 2
              );
              ctx.rotate((image.rotation * Math.PI) / 180);
              ctx.drawImage(
                img,
                -(image.originalWidth * image.scale) / 2,
                -(image.originalHeight * image.scale) / 2,
                image.originalWidth * image.scale,
                image.originalHeight * image.scale
              );
              ctx.restore();
            };
            img.src = image.src;
          });
        }

        // 3. Текст
        if (whiteboard.data?.textElements) {
          whiteboard.data.textElements.forEach((text) => {
            ctx.fillStyle = text.color || "#000000";
            ctx.font = `${text.fontSize || 16}px Arial`;
            ctx.fillText(
              text.content,
              text.x || 50,
              (text.y || 50) + (text.fontSize || 16)
            );
          });
        }
      } catch (error) {
        console.error("Error rendering whiteboard:", error);
        resolve(canvas.toDataURL("image/png"));
      }
    });
  };

  const handleDownload = async (): Promise<void> => {
    setIsLoading(true);
    setProgress(0);

    try {
      const zip = new JSZip();
      const assignments = await fetchAssignments();
      const totalSteps = assignments.length;
      let completedSteps = 0;

      for (const assignment of assignments) {
        const whiteboards = await fetchWhiteboards(assignment.id);
        const whiteboardImages = await Promise.all(
          whiteboards.map((whiteboard) => convertWhiteboardToImage(whiteboard))
        );

        const assignmentFolder = zip.folder(
          assignment.title.replace(/[^a-z0-9]/gi, "_")
        );

        if (assignmentFolder) {
          whiteboardImages.forEach((imgData, index) => {
            const base64Data = imgData.replace(/^data:image\/png;base64,/, "");
            assignmentFolder.file(`page_${index + 1}.png`, base64Data, {
              base64: true,
            });
          });
        }

        completedSteps++;
        setProgress(Math.round((completedSteps / totalSteps) * 100));
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `assignments_${collectionId}.zip`);
    } catch (error) {
      console.error("Error creating archive:", error);
      alert(
        "Произошла ошибка при создании архива. Пожалуйста, попробуйте еще раз."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="download-assignments-container">
      <button
        onClick={handleDownload}
        disabled={isLoading}
        className="download-button"
      >
        {isLoading
          ? `Скачивание... (${progress}%)`
          : "Скачать архив с заданиями"}
      </button>

      {isLoading && (
        <div className="progress-container">
          <progress value={progress} max="100" />
        </div>
      )}
    </div>
  );
};

export default DownloadAssignmentsButton;
