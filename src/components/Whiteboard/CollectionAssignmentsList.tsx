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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";

type Whiteboard = {
  id: string;
  title: string;
  prevOrder: string | null;
  nextOrder: string | null;
  data: any;
  createdAt: string;
  updatedAt: string;
  assignmentId?: string;
};

type Assignment = {
  id: string;
  title: string;
  description?: string;
  whiteboards: Whiteboard[];
  createdAt: string;
  updatedAt: string;
  prevOrder: string | null;
  nextOrder: string | null;
};

type CollectionAssignment = {
  id: number;
  title: string;
  assignments: Assignment[];
  createdAt: string;
  updatedAt: string;
};

export default function CollectionAssignmentsList() {
  const [collections, setCollections] = useState<CollectionAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCollections, setExpandedCollections] = useState<
    Record<number, boolean>
  >({});
  const [expandedAssignments, setExpandedAssignments] = useState<
    Record<string, boolean>
  >({});
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(
    null
  );
  const [editingCollectionId, setEditingCollectionId] = useState<number | null>(
    null
  );
  const [tempTitle, setTempTitle] = useState("");
  const [newAssignmentTitle, setNewAssignmentTitle] = useState("");
  const [newAssignmentDescription, setNewAssignmentDescription] = useState("");
  const [newCollectionTitle, setNewCollectionTitle] = useState("");
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadType, setDownloadType] = useState<"zip" | "pdf" | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const res = await fetch("/api/collection-assignments");
        const data = await res.json();
        setCollections(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Ошибка загрузки коллекций");
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
  }, []);

  const toggleCollection = (collectionId: number) => {
    setExpandedCollections((prev) => ({
      ...prev,
      [collectionId]: !prev[collectionId],
    }));
  };

  const toggleAssignment = (assignmentId: string) => {
    setExpandedAssignments((prev) => ({
      ...prev,
      [assignmentId]: !prev[assignmentId],
    }));
  };

  const createNewCollection = async () => {
    try {
      const response = await fetch("/api/collection-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newCollectionTitle || "Новая подборка",
        }),
      });

      if (response.ok) {
        const newCollection = await response.json();
        setCollections((prev) => [...prev, newCollection]);
        setNewCollectionTitle("");
        toast.success("Подборка успешно создана");
      }
    } catch (error) {
      toast.error("Ошибка при создании подборки");
      console.error("Ошибка при создании подборки:", error);
    }
  };

  const deleteCollection = async (collectionId: number) => {
    try {
      const response = await fetch(
        `/api/collection-assignments/${collectionId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setCollections((prev) => prev.filter((c) => c.id !== collectionId));
        toast.success("Подборка успешно удалена");
      }
    } catch (error) {
      toast.error("Ошибка при удалении подборки");
      console.error("Ошибка при удалении подборки:", error);
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/assignment?id=${assignmentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCollections((prev) =>
          prev.map((collection) => ({
            ...collection,
            assignments: collection.assignments.filter(
              (a) => a.id !== assignmentId
            ),
          }))
        );
        toast.success("Задание успешно удалено");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Ошибка при удалении задания");
      }
    } catch (error) {
      toast.error("Ошибка при удалении задания");
      console.error("Ошибка при удалении задания:", error);
    }
  };

  const deleteWhiteboard = async (whiteboardId: string) => {
    try {
      const response = await fetch(`/api/whiteboard/${whiteboardId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCollections((prev) =>
          prev.map((collection) => ({
            ...collection,
            assignments: collection.assignments.map((assignment) => ({
              ...assignment,
              whiteboards: assignment.whiteboards.filter(
                (w) => w.id !== whiteboardId
              ),
            })),
          }))
        );
        toast.success("Страница успешно удалена");
      }
    } catch (error) {
      toast.error("Ошибка при удалении страницы");
      console.error("Ошибка при удалении страницы:", error);
    }
  };

  const createNewWhiteboard = async (assignmentId: string) => {
    try {
      const assignment = collections
        .flatMap((c) => c.assignments)
        .find((a) => a.id === assignmentId);

      const lastWhiteboard = assignment?.whiteboards.reduce((prev, current) =>
        !prev || current.createdAt > prev.createdAt ? current : prev
      );

      const response = await fetch("/api/whiteboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Страница ${(assignment?.whiteboards.length || 0) + 1}`,
          assignmentId,
          prevOrder: lastWhiteboard?.id ?? null,
        }),
      });

      if (response.ok) {
        const newWhiteboard = await response.json();

        if (lastWhiteboard) {
          await fetch(`/api/whiteboard/${lastWhiteboard.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nextOrder: newWhiteboard.id }),
          });
        }

        setCollections((prev) =>
          prev.map((collection) => ({
            ...collection,
            assignments: collection.assignments.map((a) =>
              a.id === assignmentId
                ? { ...a, whiteboards: [...a.whiteboards, newWhiteboard] }
                : a
            ),
          }))
        );
        toast.success("Новая страница создана");
      }
    } catch (error) {
      toast.error("Ошибка при создании страницы");
      console.error("Ошибка при создании страницы:", error);
    }
  };

  const createNewAssignment = async (collectionId: number) => {
    try {
      const response = await fetch("/api/assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newAssignmentTitle || "Новое задание",
          description: newAssignmentDescription,
          collectionAssignmentId: collectionId,
        }),
      });

      if (response.ok) {
        const newAssignment = await response.json();
        setCollections((prev) =>
          prev.map((c) =>
            c.id === collectionId
              ? { ...c, assignments: [...c.assignments, newAssignment] }
              : c
          )
        );
        setNewAssignmentTitle("");
        setNewAssignmentDescription("");
        toast.success("Новое задание создано");
      }
    } catch (error) {
      toast.error("Ошибка при создании задания");
      console.error("Ошибка при создании задания:", error);
    }
  };

  const startEditing = (
    type: "collection" | "assignment" | "board",
    id: number | string,
    currentTitle: string
  ) => {
    setTempTitle(currentTitle);
    if (type === "collection") setEditingCollectionId(id as number);
    else if (type === "assignment") setEditingAssignmentId(id as string);
    else setEditingBoardId(id as string);
  };

  const cancelEditing = () => {
    setEditingCollectionId(null);
    setEditingAssignmentId(null);
    setEditingBoardId(null);
    setTempTitle("");
  };

  const saveTitle = async (
    type: "collection" | "assignment" | "board",
    id: number | string
  ) => {
    try {
      const endpoint =
        type === "collection"
          ? `/api/collection-assignments/${id}`
          : type === "assignment"
          ? `/api/assignment/${id}`
          : `/api/whiteboard/${id}`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: tempTitle }),
      });

      if (response.ok) {
        setCollections((prev) =>
          prev.map((c) => ({
            ...c,
            title: type === "collection" && c.id === id ? tempTitle : c.title,
            assignments: c.assignments.map((a) => ({
              ...a,
              title: type === "assignment" && a.id === id ? tempTitle : a.title,
              whiteboards: a.whiteboards.map((w) =>
                type === "board" && w.id === id ? { ...w, title: tempTitle } : w
              ),
            })),
          }))
        );
        cancelEditing();
        toast.success("Название обновлено");
      }
    } catch (error) {
      toast.error("Ошибка при обновлении названия");
      console.error("Ошибка при обновлении названия:", error);
    }
  };

  const convertWhiteboardToImage = async (
    whiteboard: Whiteboard
  ): Promise<string> => {
    return new Promise(async (resolve) => {
      try {
        const mainCanvas = document.createElement("canvas");
        mainCanvas.width = 1920;
        mainCanvas.height = 3800;
        const mainCtx = mainCanvas.getContext("2d");

        if (!mainCtx) {
          resolve("");
          return;
        }

        mainCtx.fillStyle = "#ffffff";
        mainCtx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);

        mainCtx.strokeStyle = "#eee";
        mainCtx.lineWidth = 1;
        const gridSize = 37.5;
        const offsetY = 10;

        for (let x = 0; x <= mainCanvas.width; x += gridSize) {
          mainCtx.beginPath();
          mainCtx.moveTo(x, offsetY);
          mainCtx.lineTo(x, mainCanvas.height);
          mainCtx.stroke();
        }

        for (let y = offsetY; y <= mainCanvas.height; y += gridSize) {
          mainCtx.beginPath();
          mainCtx.moveTo(0, y);
          mainCtx.lineTo(mainCanvas.width, y);
          mainCtx.stroke();
        }

        let hasContentBelow2000 = false;

        if (whiteboard.data?.canvasImage) {
          hasContentBelow2000 = await checkImageContentBelowThreshold(
            whiteboard.data.canvasImage,
            2000
          );
        }

        if (!hasContentBelow2000) {
          let maxContentHeight = 0;

          if (whiteboard.data?.images) {
            whiteboard.data.images.forEach((image: any) => {
              const bottom = image.y + image.originalHeight * image.scale;
              if (bottom > maxContentHeight) maxContentHeight = bottom;
            });
          }

          if (whiteboard.data?.textElements) {
            whiteboard.data.textElements.forEach((text: any) => {
              const bottom = (text.y || 50) + (text.fontSize || 16);
              if (bottom > maxContentHeight) maxContentHeight = bottom;
            });
          }

          hasContentBelow2000 = maxContentHeight > 2000;
        }

        const imagePromises: Promise<void>[] = [];

        if (whiteboard.data?.canvasImage) {
          const imgPromise = new Promise<void>((resolveImg) => {
            const img = new Image();
            img.onload = () => {
              mainCtx.drawImage(img, 0, 0, mainCanvas.width, mainCanvas.height);
              resolveImg();
            };
            img.onerror = () => resolveImg();
            img.src = whiteboard.data.canvasImage;
          });
          imagePromises.push(imgPromise);
        }

        if (whiteboard.data?.images) {
          whiteboard.data.images.forEach((image: any) => {
            const imgPromise = new Promise<void>((resolveImg) => {
              const img = new Image();
              img.crossOrigin = "Anonymous";
              img.onload = () => {
                mainCtx.save();
                mainCtx.translate(
                  image.x + (image.originalWidth * image.scale) / 2,
                  image.y + (image.originalHeight * image.scale) / 2
                );
                mainCtx.rotate((image.rotation * Math.PI) / 180);
                mainCtx.drawImage(
                  img,
                  -(image.originalWidth * image.scale) / 2,
                  -(image.originalHeight * image.scale) / 2,
                  image.originalWidth * image.scale,
                  image.originalHeight * image.scale
                );
                mainCtx.restore();
                resolveImg();
              };
              img.onerror = () => resolveImg();
              img.src = image.src;
            });
            imagePromises.push(imgPromise);
          });
        }

        await Promise.all(imagePromises);

        if (whiteboard.data?.textElements) {
          whiteboard.data.textElements.forEach((text: any) => {
            mainCtx.fillStyle = text.color || "#000000";
            mainCtx.font = `${text.fontSize || 16}px Arial`;
            mainCtx.fillText(
              text.content,
              text.x || 50,
              (text.y || 50) + (text.fontSize || 16)
            );
          });
        }

        const outputCanvas = document.createElement("canvas");
        outputCanvas.width = 1920;
        outputCanvas.height = hasContentBelow2000 ? 4000 : 2000;
        const outputCtx = outputCanvas.getContext("2d");

        if (outputCtx) {
          outputCtx.drawImage(
            mainCanvas,
            0,
            0,
            1920,
            hasContentBelow2000 ? 4000 : 2000,
            0,
            0,
            1920,
            hasContentBelow2000 ? 4000 : 2000
          );
          resolve(outputCanvas.toDataURL("image/png"));
        } else {
          resolve(mainCanvas.toDataURL("image/png"));
        }
      } catch (error) {
        console.error("Error in convertWhiteboardToImage:", error);
        resolve("");
      }
    });
  };

  const convertWhiteboardToPDF = async (
    whiteboard: Whiteboard
  ): Promise<jsPDF> => {
    return new Promise(async (resolve) => {
      try {
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "px",
          format: [1920, 2000],
        });

        let hasContentBelow2000 = false;

        if (whiteboard.data?.canvasImage) {
          hasContentBelow2000 = await checkImageContentBelowThreshold(
            whiteboard.data.canvasImage,
            2000
          );
        }

        if (!hasContentBelow2000) {
          let maxContentHeight = 0;

          if (whiteboard.data?.images) {
            whiteboard.data.images.forEach((image: any) => {
              const bottom = image.y + image.originalHeight * image.scale;
              if (bottom > maxContentHeight) maxContentHeight = bottom;
            });
          }

          if (whiteboard.data?.textElements) {
            whiteboard.data.textElements.forEach((text: any) => {
              const bottom = (text.y || 50) + (text.fontSize || 16);
              if (bottom > maxContentHeight) maxContentHeight = bottom;
            });
          }

          hasContentBelow2000 = maxContentHeight > 2000;
        }

        if (hasContentBelow2000) {
          pdf.deletePage(1);
          pdf.addPage([1920, 4000], "portrait");
        }

        pdf.setFillColor(255, 255, 255);
        pdf.rect(
          0,
          0,
          pdf.internal.pageSize.getWidth(),
          pdf.internal.pageSize.getHeight(),
          "F"
        );

        pdf.setDrawColor(238, 238, 238);
        pdf.setLineWidth(1);
        const gridSize = 37.5;
        const offsetY = 10;

        for (let x = 0; x <= pdf.internal.pageSize.getWidth(); x += gridSize) {
          pdf.line(x, offsetY, x, pdf.internal.pageSize.getHeight());
        }

        for (
          let y = offsetY;
          y <= pdf.internal.pageSize.getHeight();
          y += gridSize
        ) {
          pdf.line(0, y, pdf.internal.pageSize.getWidth(), y);
        }

        const imagePromises: Promise<void>[] = [];

        if (whiteboard.data?.canvasImage) {
          const imgPromise = new Promise<void>((resolveImg) => {
            const img = new Image();
            img.onload = () => {
              pdf.addImage(
                img,
                "PNG",
                0,
                0,
                pdf.internal.pageSize.getWidth(),
                pdf.internal.pageSize.getHeight()
              );
              resolveImg();
            };
            img.onerror = () => resolveImg();
            img.src = whiteboard.data.canvasImage;
          });
          imagePromises.push(imgPromise);
        }

        if (whiteboard.data?.images) {
          whiteboard.data.images.forEach((image: any) => {
            const imgPromise = new Promise<void>((resolveImg) => {
              const img = new Image();
              img.crossOrigin = "Anonymous";
              img.onload = () => {
                pdf.addImage(
                  img,
                  "PNG",
                  image.x,
                  image.y,
                  image.originalWidth * image.scale,
                  image.originalHeight * image.scale
                );
                resolveImg();
              };
              img.onerror = () => resolveImg();
              img.src = image.src;
            });
            imagePromises.push(imgPromise);
          });
        }

        await Promise.all(imagePromises);

        if (whiteboard.data?.textElements) {
          whiteboard.data.textElements.forEach((text: any) => {
            pdf.setTextColor(text.color || "#000000");
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(text.fontSize || 16);
            pdf.text(
              text.content,
              text.x || 50,
              (text.y || 50) + (text.fontSize || 16)
            );
          });
        }

        resolve(pdf);
      } catch (error) {
        console.error("Error in convertWhiteboardToPDF:", error);
        resolve(new jsPDF());
      }
    });
  };

  async function checkImageContentBelowThreshold(
    imageSrc: string,
    thresholdY: number
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = function () {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext("2d", {
          willReadFrequently: true,
        });

        if (!tempCtx) {
          resolve(false);
          return;
        }

        tempCtx.drawImage(img, 0, 0);

        const imageData = tempCtx.getImageData(
          0,
          thresholdY,
          img.width,
          img.height - thresholdY
        );

        for (let i = 0; i < imageData.data.length; i += 4) {
          const alpha = imageData.data[i + 3];
          if (alpha < 10) continue;

          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];

          if (r < 250 || g < 250 || b < 250) {
            resolve(true);
            return;
          }
        }

        resolve(false);
      };
      img.onerror = () => resolve(false);
      img.src = imageSrc;
    });
  }

  const downloadCollectionAsZip = async (collectionId: number) => {
    setIsDownloading(true);
    setDownloadType("zip");
    setDownloadProgress(0);

    try {
      const zip = new JSZip();
      const collection = collections.find((c) => c.id === collectionId);

      if (!collection) {
        throw new Error("Collection not found");
      }

      const totalAssignments = collection.assignments.length;
      let completedAssignments = 0;

      for (const assignment of collection.assignments) {
        const assignmentFolder = zip.folder(
          assignment.title.replace(/[^a-z0-9]/gi, "_")
        );

        if (assignmentFolder) {
          const totalWhiteboards = assignment.whiteboards.length;
          let completedWhiteboards = 0;

          for (const whiteboard of assignment.whiteboards) {
            const imageData = await convertWhiteboardToImage(whiteboard);
            const base64Data = imageData.replace(
              /^data:image\/png;base64,/,
              ""
            );
            assignmentFolder.file(
              `${whiteboard.title.replace(/[^a-z0-9]/gi, "_")}.png`,
              base64Data,
              { base64: true }
            );

            completedWhiteboards++;
            setDownloadProgress(
              Math.round(
                (completedAssignments / totalAssignments) * 50 +
                  ((completedWhiteboards / totalWhiteboards) * 50) /
                    totalAssignments
              )
            );
          }
        }

        completedAssignments++;
        setDownloadProgress(
          Math.round((completedAssignments / totalAssignments) * 100)
        );
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${collection.title.replace(/[^a-z0-9]/gi, "_")}.zip`);
      toast.success("Архив успешно скачан");
    } catch (error) {
      console.error("Error creating archive:", error);
      toast.error("Произошла ошибка при создании архива");
    } finally {
      setIsDownloading(false);
      setDownloadType(null);
    }
  };

  const downloadCollectionAsPDF = async (collectionId: number) => {
    setIsDownloading(true);
    setDownloadType("pdf");
    setDownloadProgress(0);

    try {
      const collection = collections.find((c) => c.id === collectionId);
      if (!collection) {
        throw new Error("Collection not found");
      }

      // Создаем временный PDF для первой страницы (jsPDF требует хотя бы одну страницу)
      const mainPdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      mainPdf.deletePage(1); // Удаляем пустую страницу по умолчанию

      const totalAssignments = collection.assignments.length;
      let completedAssignments = 0;

      for (const assignment of collection.assignments) {
        const totalWhiteboards = assignment.whiteboards.length;
        let completedWhiteboards = 0;

        for (const whiteboard of assignment.whiteboards) {
          const imgData = await convertWhiteboardToImage(whiteboard);

          if (imgData) {
            const img = new Image();
            await new Promise((resolve) => {
              img.onload = resolve;
              img.src = imgData;
            });

            // Фиксированная ширина страницы (A4)
            const targetWidth = 210; // Ширина A4 в мм
            const scaleFactor = targetWidth / img.width;
            const targetHeight = img.height * scaleFactor;

            // Создаем страницу с высотой под изображение
            mainPdf.addPage([targetWidth, targetHeight], "portrait");

            // Добавляем изображение на всю страницу (без отступов)
            mainPdf.addImage(imgData, "PNG", 0, 0, targetWidth, targetHeight);
          }

          completedWhiteboards++;
          setDownloadProgress(
            Math.round(
              (completedAssignments / totalAssignments) * 50 +
                ((completedWhiteboards / totalWhiteboards) * 50) /
                  totalAssignments
            )
          );
        }

        completedAssignments++;
        setDownloadProgress(
          Math.round((completedAssignments / totalAssignments) * 100)
        );
      }

      const pdfBlob = mainPdf.output("blob");
      const cleanBlob = new Blob([pdfBlob], { type: "application/pdf" });
      saveAs(cleanBlob, `${collection.title.replace(/[^a-z0-9]/gi, "_")}.pdf`);
      toast.success(`PDF успешно скачан`);
    } catch (error) {
      console.error("Error creating PDF:", error);
      toast.error("Произошла ошибка при создании PDF");
    } finally {
      setIsDownloading(false);
      setDownloadType(null);
    }
  };

  if (loading) return <div className="p-4">Загрузка...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6 bg-white rounded select-none">
      <div className="">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus size={16} /> Создать новую подборку
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать новую подборку</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Название подборки"
                value={newCollectionTitle}
                onChange={(e) => setNewCollectionTitle(e.target.value)}
              />
              <Button onClick={createNewCollection}>Создать подборку</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6 mt-6">
        {collections.map((collection) => (
          <div
            key={collection.id}
            className="border rounded-lg overflow-hidden"
          >
            <div
              className="p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
              onClick={() => toggleCollection(collection.id)}
            >
              <div className="flex items-center space-x-2">
                {editingCollectionId === collection.id ? (
                  <Input
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    className="w-auto"
                  />
                ) : (
                  <h2 className="font-semibold text-lg">{collection.title}</h2>
                )}

                <button
                  onClick={() =>
                    editingCollectionId === collection.id
                      ? saveTitle("collection", collection.id)
                      : startEditing(
                          "collection",
                          collection.id,
                          collection.title
                        )
                  }
                  className="text-gray-500 hover:text-gray-700"
                >
                  {editingCollectionId === collection.id ? (
                    <Save size={16} />
                  ) : (
                    <Edit size={16} />
                  )}
                </button>

                {editingCollectionId === collection.id && (
                  <button
                    onClick={cancelEditing}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={16} />
                  </button>
                )}

                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadCollectionAsZip(collection.id)}
                    disabled={isDownloading}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    {isDownloading && downloadType === "zip" ? (
                      `${downloadProgress}%`
                    ) : (
                      <>
                        <Download size={16} /> ZIP
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadCollectionAsPDF(collection.id)}
                    disabled={isDownloading}
                    className="text-green-500 hover:text-green-700"
                  >
                    {isDownloading && downloadType === "pdf" ? (
                      `${downloadProgress}%`
                    ) : (
                      <>
                        <Download size={16} /> PDF
                      </>
                    )}
                  </Button>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Удалить подборку</DialogTitle>
                    </DialogHeader>
                    <p>
                      Вы уверены, что хотите удалить эту подборку? Все задания и
                      страницы внутри будут удалены.
                    </p>
                    <DialogFooter>
                      <Button variant="outline">Отмена</Button>
                      <Button
                        variant="destructive"
                        onClick={() => deleteCollection(collection.id)}
                      >
                        Удалить
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <button onClick={() => toggleCollection(collection.id)}>
                {expandedCollections[collection.id] ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </button>
            </div>

            {expandedCollections[collection.id] && (
              <div className="p-4 pt-0 space-y-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 mt-4">
                      <Plus size={16} /> Добавить задание
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Создать новое задание</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Название задания"
                        value={newAssignmentTitle}
                        onChange={(e) => setNewAssignmentTitle(e.target.value)}
                      />
                      <Input
                        placeholder="Описание (необязательно)"
                        value={newAssignmentDescription}
                        onChange={(e) =>
                          setNewAssignmentDescription(e.target.value)
                        }
                      />
                      <Button
                        onClick={() => createNewAssignment(collection.id)}
                      >
                        Создать задание
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {collection.assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div
                      className="p-4 bg-gray-100 hover:bg-gray-200 cursor-pointer flex justify-between items-center "
                      onClick={() => toggleAssignment(assignment.id)}
                    >
                      <div className="flex items-center space-x-2">
                        {editingAssignmentId === assignment.id ? (
                          <Input
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            className="w-auto"
                          />
                        ) : (
                          <h3 className="font-medium">{assignment.title}</h3>
                        )}

                        <button
                          onClick={() =>
                            editingAssignmentId === assignment.id
                              ? saveTitle("assignment", assignment.id)
                              : startEditing(
                                  "assignment",
                                  assignment.id,
                                  assignment.title
                                )
                          }
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {editingAssignmentId === assignment.id ? (
                            <Save size={16} className="cursor-pointer" />
                          ) : (
                            <Edit size={16} className="cursor-pointer" />
                          )}
                        </button>

                        {editingAssignmentId === assignment.id && (
                          <button
                            onClick={cancelEditing}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X size={16} className="cursor-pointer" />
                          </button>
                        )}

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Удалить задание</DialogTitle>
                            </DialogHeader>
                            <p>
                              Вы уверены, что хотите удалить это задание? Все
                              страницы внутри будут удалены.
                            </p>
                            <DialogFooter>
                              <Button variant="outline">Отмена</Button>
                              <Button
                                variant="destructive"
                                className="cursor-pointer"
                                onClick={() => deleteAssignment(assignment.id)}
                              >
                                Удалить
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>

                      <button onClick={() => toggleAssignment(assignment.id)}>
                        {expandedAssignments[assignment.id] ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    {expandedAssignments[assignment.id] && (
                      <div className="p-4 pt-0">
                        {assignment.description && (
                          <p className="text-gray-600 mt-1">
                            {assignment.description}
                          </p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {assignment.whiteboards.map((board) => (
                            <div
                              key={board.id}
                              className="border p-3 rounded-lg hover:shadow-md transition-shadow mt-3"
                            >
                              <div className="flex justify-between items-start">
                                {editingBoardId === board.id ? (
                                  <Input
                                    value={tempTitle}
                                    onChange={(e) =>
                                      setTempTitle(e.target.value)
                                    }
                                    className="w-full"
                                  />
                                ) : (
                                  <Link
                                    href={`/whiteboard/${board.id}`}
                                    className="flex-1"
                                  >
                                    <h4 className="font-medium">
                                      {board.title}
                                    </h4>
                                  </Link>
                                )}

                                <div className="flex space-x-1 ml-2">
                                  {editingBoardId === board.id ? (
                                    <>
                                      <button
                                        onClick={() =>
                                          saveTitle("board", board.id)
                                        }
                                        className="text-gray-500 hover:text-gray-700"
                                      >
                                        <Save size={16} />
                                      </button>
                                      <button
                                        onClick={cancelEditing}
                                        className="text-gray-500 hover:text-gray-700"
                                      >
                                        <X size={16} />
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        startEditing(
                                          "board",
                                          board.id,
                                          board.title
                                        )
                                      }
                                      className="text-gray-500 hover:text-gray-700"
                                    >
                                      <Edit size={16} />
                                    </button>
                                  )}

                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <button className="text-red-500 hover:text-red-700">
                                        <Trash2 size={16} />
                                      </button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>
                                          Удалить страницу
                                        </DialogTitle>
                                      </DialogHeader>
                                      <p>
                                        Вы уверены, что хотите удалить эту
                                        страницу?
                                      </p>
                                      <DialogFooter>
                                        <Button variant="outline">
                                          Отмена
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          onClick={() =>
                                            deleteWhiteboard(board.id)
                                          }
                                        >
                                          Удалить
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500">
                                Создано:{" "}
                                {new Date(board.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3"
                            >
                              + Добавить страницу
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Создать новую страницу</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p>Создать новую страницу?</p>
                              <Button
                                onClick={() =>
                                  createNewWhiteboard(assignment.id)
                                }
                              >
                                Создать
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
