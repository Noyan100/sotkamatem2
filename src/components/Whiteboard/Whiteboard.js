"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useHotkeys } from "react-hotkeys-hook";
import BrushTool from "./Brush/BrushTool";
import ColorPicker from "./Color/ColorPicker";
import Toolbar from "./Toolbar/Toolbar";
import { ToolbarSvgSelector } from "./ToolbarSvgSelector";
import {
  ALargeSmall,
  Boxes,
  Download,
  Eraser,
  ImagePlus,
  MousePointer2,
  PencilLine,
  Save,
  Shapes,
  Trash,
} from "lucide-react";
import {
  TbConePlus,
  TbCubePlus,
  TbCylinderPlus,
  TbDiamonds,
  TbHexagonalPrismPlus,
  TbHexagonalPyramidPlus,
  TbLineDashed,
  TbOctahedronPlus,
  TbPrismPlus,
  TbPyramidPlus,
  TbRectangularPrismPlus,
} from "react-icons/tb";
import {
  LuRectangleHorizontal,
  LuRedo2,
  LuSave,
  LuUndo2,
} from "react-icons/lu";
import { PiParallelogramBold } from "react-icons/pi";
import { Slider } from "../ui/slider";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

const Whiteboard = forwardRef((whiteboardTitle, ref, whiteboardId) => {
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const canvasRef = useRef(null);
  const boardRef = useRef(null);
  const [brushColor, setBrushColor] = useState("#000000"); // Цвет кисти
  const [shape2DColor, setShape2DColor] = useState("#000000"); // Цвет 2D фигур
  const [shape3DColor, setShape3DColor] = useState("#000000"); // Цвет 3D фигур
  const [textColor, setTextColor] = useState("#000000"); // Цвет текста
  const [eraserColor, setEraserColor] = useState("#ffffff"); // Цвет ластика (обычно белый)
  const [brushSize, setBrushSize] = useState(6);
  const [brushSize2D, setBrushSize2D] = useState(6); // Размер для 2D фигур
  const [brushSize3D, setBrushSize3D] = useState(6); // Размер для 3D фигур
  const [textSize, setTextSize] = useState(16); //Размер текста
  const [isCursorActive, setIsCursorActive] = useState(false);
  const [isEraserActive, setIsEraserActive] = useState(false);
  const [isPenActive, setIsPenActive] = useState(false);
  const [eraserSize, setEraserSize] = useState(10);
  const [images, setImages] = useState([]);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const fileInputRef = useRef(null);
  const [boardRect, setBoardRect] = useState({ left: 0, top: 0 });
  const isInteractingWithImage = useRef(false);
  const [maxZIndex, setMaxZIndex] = useState(10);
  const [pastePosition, setPastePosition] = useState({ x: 100, y: 100 });
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isImageClickable, setIsImageClickable] = useState(true);
  const [inputType, setInputType] = useState("mouse"); // 'pen', 'touch', 'mouse'
  const [scrollPosition, setScrollPosition] = useState(0); // Добавляем состояние для скролла
  const [isTextActive, setIsTextActive] = useState(false);
  const [textElements, setTextElements] = useState([]);
  const [activeTextId, setActiveTextId] = useState(null);
  const [isTextEditing, setIsTextEditing] = useState(false); // Добавляем новое состояние

  const [penFrameActive, setPenFrameActive] = useState(false);
  const [toolsFrameActive, setToolsFrameActive] = useState(false);
  const [tools3FrameActive, setTools3FrameActive] = useState(false);
  const [eraserFrameActive, setEraserFrameActive] = useState(false);

  const [isLineActive, setIsLineActive] = useState(false);
  const [isRectActive, setIsRectActive] = useState(false);
  const [isCircleActive, setIsCircleActive] = useState(false);
  const [isDashedLineActive, setIsDashedLineActive] = useState(false);
  const [isTriangleActive, setIsTriangleActive] = useState(false);
  const [isHexagonActive, setIsHexagonActive] = useState(false);
  const [isTrapezoidActive, setIsTrapezoidActive] = useState(false);
  const [isRhombusActive, setIsRhombusActive] = useState(false);
  const [isIsoscelesTriangleActive, setIsIsoscelesTriangleActive] =
    useState(false);
  const [isEquilateralTriangleActive, setIsEquilateralTriangleActive] =
    useState(false);
  const [isRightTriangleActive, setIsRightTriangleActive] = useState(false);
  const [isIsoscelesTrapezoidActive, setIsIsoscelesTrapezoidActive] =
    useState(false);
  const [isRightTrapezoidActive, setIsRightTrapezoidActive] = useState(false);
  const [isParallelogramActive, setIsParallelogramActive] = useState(false);

  const [isCubeActive, setIsCubeActive] = useState(false);
  const [isRectPrismActive, setIsRectPrismActive] = useState(false); // Прямоугольный параллелепипед
  const [isTriangularPrismActive, setIsTriangularPrismActive] = useState(false); // Треугольная призма
  const [isTriangularPyramidActive, setIsTriangularPyramidActive] =
    useState(false); // Треугольная пирамида
  const [isQuadPyramidActive, setIsQuadPyramidActive] = useState(false); // Четырехугольная пирамида
  const [isCylinderActive, setIsCylinderActive] = useState(false); // Цилиндр
  const [isConeActive, setIsConeActive] = useState(false); // Конус
  const [isHexPyramidActive, setIsHexPyramidActive] = useState(false); // Шестиугольная пирамида
  const [isHexPrismActive, setIsHexPrismActive] = useState(false); // Шестиугольная призма

  const brushToolRef = useRef(null); // Добавьте эту строку в начале компонента Whiteboard

  const [deletedImagesHistory, setDeletedImagesHistory] = useState([]);
  const [currentWhiteboardId, setCurrentWhiteboardId] = useState();

  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useImperativeHandle(ref, () => ({
    save: async () => {
      try {
        const result = await saveWhiteboard(currentWhiteboardId);
        if (!currentWhiteboardId) {
          setCurrentWhiteboardId(result.id);
        }
        return true;
      } catch (error) {
        console.error("Ошибка сохранения:", error);
        toast.error("Не удалось сохранить текущую доску");
        return false;
      }
    },
  }));

  const saveWhiteboard = async (id) => {
    try {
      // 1. Получаем текущий canvas как изображение
      const canvas = brushToolRef.current?.getCanvas();
      let canvasImage = null;

      if (canvas) {
        canvasImage = canvas.toDataURL("image/png");
      }

      // 2. Подготавливаем данные для сохранения
      const whiteboardData = {
        title: whiteboardTitle,
        data: {
          canvasImage, // Сохраняем canvas как изображение
          images, // Все добавленные изображения
          textElements, // Все текстовые элементы
          settings: {
            // Текущие настройки
            brushColor,
            brushSize,
            shape2DColor,
            shape3DColor,
            textColor,
            eraserColor,
            eraserSize,
          },
        },
      };

      // 3. Отправляем на сервер
      const url = id ? `/api/whiteboard/${id}` : "/api/whiteboard";
      const method = id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(whiteboardData),
      });

      if (!response.ok) throw new Error("Ошибка сохранения");

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Ошибка сохранения:", error);
      throw error;
    }
  };

  const loadWhiteboard = async (id) => {
    try {
      const response = await fetch(`/api/whiteboard/${id}`);
      if (!response.ok) throw new Error("Ошибка загрузки");

      const { data } = await response.json();
      console.log(response);
      console.log(data);
      // 1. Восстанавливаем canvas
      if (data.canvasImage && brushToolRef.current) {
        const canvas = brushToolRef.current.getCanvas();
        const ctx = canvas.getContext("2d");

        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = data.canvasImage;
      }

      // 2. Восстанавливаем изображения и текст
      setImages(data.images || []);
      setTextElements(data.textElements || []);
    } catch (error) {
      console.error("Ошибка загрузки:", error);
      throw error;
    }
  };

  // Обработчик сохранения
  const handleSave = async () => {
    try {
      const result = await saveWhiteboard(currentWhiteboardId);
      if (!currentWhiteboardId) {
        setCurrentWhiteboardId(result.id); // Сохраняем ID при первом сохранении
      }
      toast.success("Доска сохранена");
    } catch {
      toast.error("Не удалось сохранить текущую доску");
    }
  };

  // Обработчик загрузки
  const handleLoad = async (id) => {
    try {
      await loadWhiteboard(id);
      setCurrentWhiteboardId(id);
    } catch {
      toast.error("Не удалось загрузить доску");
    }
  };

  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      // Проверяем, есть ли изменения, которые нужно сохранить
      if (currentWhiteboardId && !isSaving) {
        e.preventDefault();
        e.returnValue =
          "У вас есть несохраненные изменения. Сохранить перед выходом?";

        try {
          setIsSaving(true);
          await saveWhiteboard(currentWhiteboardId);
          console.log("Доска сохранена перед выходом");
        } catch (error) {
          console.error("Ошибка при сохранении перед выходом:", error);
        } finally {
          setIsSaving(false);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentWhiteboardId, isSaving, saveWhiteboard]);

  // Функция автосохранения
  const autoSave = useCallback(async () => {
    if (!currentWhiteboardId || isSaving) return;

    try {
      setIsSaving(true);
      await saveWhiteboard(currentWhiteboardId);
      setLastSaveTime(new Date());
    } catch (error) {
      console.error("Ошибка автосохранения:", error);
    } finally {
      setIsSaving(false);
    }
  }, [currentWhiteboardId, isSaving]);

  // Запускаем интервал автосохранения
  useEffect(() => {
    const interval = setInterval(autoSave, 60000); // 10 секунд

    // Очистка интервала при размонтировании
    return () => clearInterval(interval);
  }, [autoSave]);

  useEffect(() => {
    // Загружаем сохранённое изображение (если есть)
    const savedImage = localStorage.getItem("taskImage");
    if (savedImage) {
      addImageFromBlob(savedImage, -80, -80);
      localStorage.removeItem("taskImage");
    }

    // Авто-загрузка доски при монтировании
    if (whiteboardId) {
      handleLoad(whiteboardId).catch(console.error);
      setCurrentWhiteboardId(whiteboardId);
    }

    // Остальная логика инициализации...
  }, [whiteboardId]); // Зависимость от whiteboardId

  useEffect(() => {
    // Загружаем сохранённое изображение (если есть)
    const savedImage = localStorage.getItem("taskImage");
    if (savedImage) {
      addImageFromBlob(savedImage, -80, -80); // Добавляем в центр доски
      localStorage.removeItem("taskImage"); // Удаляем, чтобы не грузилось повторно
    }

    // Остальная логика инициализации...
  }, []); // Пустой массив зависимостей = выполняется один раз при загрузке
  const handleBackToTask = () => {
    window.history.back(); // Или window.location.href = "/tasks";
  };

  const handleUndo = useCallback(() => {
    // Если есть удаленные изображения в истории - восстанавливаем последнее
    if (deletedImagesHistory.length > 0) {
      const lastDeleted = deletedImagesHistory[deletedImagesHistory.length - 1];
      setImages((prev) => [...prev, lastDeleted]);
      setDeletedImagesHistory((prev) => prev.slice(0, -1));
      setSelectedImageId(lastDeleted.id);
      return;
    }

    // Иначе выполняем обычный undo для рисования
    if (brushToolRef.current) {
      brushToolRef.current.undo();
    }
  }, [deletedImagesHistory]);

  const handleRedo = useCallback(() => {
    if (brushToolRef.current) {
      brushToolRef.current.redo();
    }
  }, [brushToolRef]);

  useHotkeys("ctrl+z", () => handleUndo());
  useHotkeys("ctrl+y, ctrl+shift+z", () => handleRedo());
  useHotkeys("delete, backspace", () => {
    // Удаляем выбранное изображение
    if (selectedImageId) {
      const imageToDelete = images.find((img) => img.id === selectedImageId);
      if (imageToDelete) {
        setDeletedImagesHistory((prev) => [...prev, imageToDelete]);
        setImages((prev) => prev.filter((img) => img.id !== selectedImageId));
        setSelectedImageId(null);
      }
    }

    // Удаляем активный текст
    if (activeTextId) {
      setTextElements((prev) =>
        prev.filter((text) => text.id !== activeTextId)
      );
      setActiveTextId(null);
    }
  });

  useEffect(() => {
    // Скрываем скроллбар, но оставляем возможность скролла
    const stylesToAdd = `
      html::-webkit-scrollbar, body::-webkit-scrollbar {
        display: none;
      }
      html {
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* IE и Edge */
      }
    `;

    // Создаем элемент style и добавляем его в head
    const styleElement = document.createElement("style");
    styleElement.innerHTML = stylesToAdd;
    document.head.appendChild(styleElement);

    // Восстанавливаем стандартные стили при размонтировании
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  useEffect(() => {
    if (boardRef.current) {
      boardRef.current.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    const updateRect = () => {
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        setBoardRect({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, []);

  // Обработчик для вставки изображений через Ctrl+V
  useEffect(() => {
    const handlePaste = (e) => {
      if (e.clipboardData.files.length > 0) {
        const files = Array.from(e.clipboardData.files);
        handleAddFiles(files, pastePosition.x, pastePosition.y);
      } else if (e.clipboardData.items) {
        const items = Array.from(e.clipboardData.items);
        const imageItems = items.filter((item) => item.type.includes("image"));

        if (imageItems.length > 0) {
          imageItems.forEach((item, index) => {
            const blob = item.getAsFile();
            const reader = new FileReader();

            reader.onload = (event) => {
              addImageFromBlob(event.target.result, 100, 100);
            };

            reader.readAsDataURL(blob);
          });
        }
      }
    };

    const handleMouseMove = (e) => {
      setPastePosition({
        x: e.clientX - boardRect.left,
        y: e.clientY - boardRect.top,
      });
    };

    window.addEventListener("paste", handlePaste);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("paste", handlePaste);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [boardRect, pastePosition, scrollPosition]);

  // Обработчики для drag and drop
  useEffect(() => {
    const handleDragOver = (e) => {
      e.preventDefault();
      setIsDraggingOver(true);
    };

    const handleDragLeave = () => {
      setIsDraggingOver(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDraggingOver(false);

      if (e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files).filter((file) =>
          file.type.startsWith("image/")
        );
        if (files.length > 0) {
          const dropX = e.clientX - boardRect.left;
          const dropY = e.clientY - boardRect.top;
          handleAddFiles(files, dropX, dropY);
          setActiveCursor();
        }
      }
    };

    const board = boardRef.current;
    if (board) {
      board.addEventListener("dragover", handleDragOver);
      board.addEventListener("dragleave", handleDragLeave);
      board.addEventListener("drop", handleDrop);
    }

    return () => {
      if (board) {
        board.removeEventListener("dragover", handleDragOver);
        board.removeEventListener("dragleave", handleDragLeave);
        board.removeEventListener("drop", handleDrop);
      }
    };
  }, [boardRect]);

  const addImageFromBlob = (src, x, y) => {
    setActiveCursor();
    setActiveTextId(null);
    setIsTextEditing(false);
    const img = new Image();
    img.onload = () => {
      const board = boardRef.current;
      const maxWidth = board.clientWidth * 0.8; // 80% ширины доски
      const maxHeight = board.clientHeight * 0.8; // 80% высоты доски

      let width = img.width;
      let height = img.height;
      let scale = 1;

      // Если изображение слишком большое - масштабируем
      if (width > maxWidth || height > maxHeight) {
        const widthRatio = maxWidth / width;
        const heightRatio = maxHeight / height;
        scale = Math.min(widthRatio, heightRatio);

        width = width * scale;
        height = height * scale;
      }

      const newImage = {
        id: Date.now(),
        src: src,
        x: 100 + x, // Центрируем если координаты не указаны
        y: 100 + y,
        originalWidth: img.width,
        originalHeight: img.height,
        scale: scale, // Сохраняем коэффициент масштабирования
        rotation: 0,
        isDragging: false,
        isResizing: false,
        isRotating: false,
      };

      setImages((prev) => [...prev, newImage]);
      setSelectedImageId(newImage.id);
    };
    img.src = src;
  };

  useEffect(() => {
    const updateContainerSize = () => {
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        setBoardRect({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateContainerSize();
    window.addEventListener("resize", updateContainerSize);
    return () => window.removeEventListener("resize", updateContainerSize);
  }, []);

  const handleAddFiles = (files, x, y) => {
    setActiveTextId(null);
    setIsTextEditing(false);
    if (!files.length) return;

    const container = boardRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        // Корректируем позицию с учетом смещения
        const posX = x !== undefined ? x - containerRect.left : undefined;
        const posY = y !== undefined ? y - containerRect.top : undefined;
        addImageFromBlob(event.target.result, 0, 0);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImage = (e) => {
    const files = Array.from(e.target.files);
    handleAddFiles(files);
  };

  const handleImageClick = (e, id) => {
    setActiveTextId(null);
    setIsTextEditing(false);
    setActiveCursor();
    if (inputType === "pen") return;
    e.stopPropagation();

    if (e.target === e.currentTarget) {
      setSelectedImageId(id);
      setMaxZIndex((prev) => prev + 1); // Увеличиваем общий счетчик

      setImages((prevImages) =>
        prevImages.map((img) =>
          img.id === id
            ? { ...img, zIndex: maxZIndex + 1 } // Присваиваем новый zIndex
            : img
        )
      );
    }
  };

  const handleDragStart = (e, id) => {
    if (inputType === "pen") return;
    e.preventDefault();
    isInteractingWithImage.current = true;

    const image = images.find((img) => img.id === id);
    if (!image) return;

    const rect = boardRef.current.getBoundingClientRect();
    const scrollTop = boardRef.current.scrollTop;

    // Получаем координаты касания
    const clientX = e.clientX || e.touches?.[0].clientX;
    const clientY = e.clientY || e.touches?.[0].clientY;

    // Координаты центра изображения
    const centerX = image.x + (image.originalWidth * image.scale) / 2;
    const centerY = image.y + (image.originalHeight * image.scale) / 2;

    // Координаты точки касания относительно центра
    const clickX = clientX - rect.left - centerX;
    const clickY = clientY - rect.top + scrollTop - centerY;

    // Учитываем вращение при расчете начального смещения
    const angle = (-image.rotation * Math.PI) / 180;
    const rotatedX = clickX * Math.cos(angle) - clickY * Math.sin(angle);
    const rotatedY = clickX * Math.sin(angle) + clickY * Math.cos(angle);

    setImages(
      images.map((img) =>
        img.id === id
          ? {
              ...img,
              isDragging: true,
              isResizing: false,
              isRotating: false,
              dragStartX: rotatedX,
              dragStartY: rotatedY,
              startX: image.x,
              startY: image.y,
            }
          : img
      )
    );
  };

  const handleResizeStart = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    isInteractingWithImage.current = true;

    const image = images.find((img) => img.id === id);
    if (!image) return;

    const rect = boardRef.current.getBoundingClientRect();
    const startX = e.clientX || e.touches?.[0].clientX;
    const startY = e.clientY || e.touches?.[0].clientY;

    setImages(
      images.map((img) =>
        img.id === id
          ? {
              ...img,
              isResizing: true,
              isDragging: false,
              isRotating: false,
              resizeStartX: startX,
              resizeStartY: startY,
              startScale: img.scale,
            }
          : img
      )
    );
  };

  const handleRotateStart = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    isInteractingWithImage.current = true;

    const image = images.find((img) => img.id === id);
    if (!image) return;

    const rect = boardRef.current.getBoundingClientRect();
    const centerX = image.x + (image.originalWidth * image.scale) / 2;
    const centerY = image.y + (image.originalHeight * image.scale) / 2;
    const startAngle = Math.atan2(
      (e.clientY || e.touches?.[0].clientY) - rect.top - centerY,
      (e.clientX || e.touches?.[0].clientX) - rect.left - centerX
    );

    setImages(
      images.map((img) =>
        img.id === id
          ? {
              ...img,
              isRotating: true,
              isDragging: false,
              isResizing: false,
              rotateStartAngle: startAngle,
              startRotation: img.rotation,
            }
          : img
      )
    );
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!selectedImageId || (!e.buttons && !e.touches)) return;

      const rect = boardRef.current.getBoundingClientRect();
      const scrollTop = boardRef.current.scrollTop;

      // Получаем координаты касания/мыши
      const clientX = e.clientX || e.touches?.[0].clientX;
      const clientY = e.clientY || e.touches?.[0].clientY;

      setImages((prevImages) =>
        prevImages.map((image) => {
          if (image.id !== selectedImageId) return image;

          if (image.isDragging) {
            // Получаем текущее вращение
            const angle = (image.rotation * Math.PI) / 180;

            // Координаты касания относительно доски
            const mouseX = clientX - rect.left;
            const mouseY = clientY - rect.top + scrollTop;

            // Учитываем вращение при перемещении
            const newX =
              mouseX -
              image.dragStartX * Math.cos(angle) -
              image.dragStartY * Math.sin(angle);
            const newY =
              mouseY -
              image.dragStartY * Math.cos(angle) +
              image.dragStartX * Math.sin(angle);

            return {
              ...image,
              x: newX - (image.originalWidth * image.scale) / 2,
              y: newY - (image.originalHeight * image.scale) / 2,
            };
          } else if (image.isResizing) {
            // Новый код для плавного масштабирования
            const deltaX = clientX - image.resizeStartX;
            const deltaY = clientY - image.resizeStartY;

            // Масштабируем пропорционально движению мыши (0.005 - коэффициент чувствительности)
            const scaleFactor = 1 + (deltaX + deltaY) * 0.0009;
            const newScale = Math.max(
              0.1,
              Math.min(5, image.startScale * scaleFactor)
            );

            return {
              ...image,
              scale: newScale,
            };
          } else if (image.isRotating) {
            // Вычисляем текущий угол
            const centerX = image.x + (image.originalWidth * image.scale) / 2;
            const centerY = image.y + (image.originalHeight * image.scale) / 2;
            const currentAngle = Math.atan2(
              clientY - rect.top - centerY,
              clientX - rect.left - centerX
            );

            // Вычисляем разницу углов и преобразуем в градусы
            const angleDiff = currentAngle - image.rotateStartAngle;
            let newRotation = image.startRotation + (angleDiff * 180) / Math.PI;

            // Если нажат Shift, округляем до ближайших 15 градусов
            if (e.shiftKey) {
              newRotation = Math.round(newRotation / 15) * 15;
            }

            return {
              ...image,
              rotation: newRotation % 360,
              isShiftPressed: e.shiftKey, // Обновляем состояние Shift
            };
          }
          return image;
        })
      );
    },
    [selectedImageId]
  );

  useEffect(() => {
    const handleScroll = () => {
      if (boardRef.current) {
        setScrollPosition(boardRef.current.scrollTop);
      }
    };

    const board = boardRef.current;
    if (board) {
      board.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (board) {
        board.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const handleMouseUp = useCallback(() => {
    const wasInteracting = isInteractingWithImage.current;
    setImages((prevImages) =>
      prevImages.map((image) => ({
        ...image,
        isDragging: false,
        isResizing: false,
        isRotating: false,
      }))
    );

    setTimeout(() => {
      isInteractingWithImage.current = false;
    }, 100);

    if (wasInteracting) {
      return;
    }
  }, []);

  useEffect(() => {
    const handleMove = (e) => handleMouseMove(e);
    const handleEnd = () => handleMouseUp();

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("touchend", handleEnd);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleClearCanvas = () => {
    setClearConfirmOpen(false);
    brushToolRef.current?.clearCanvas();
    setImages([]);
    setSelectedImageId(null);
    setTextElements([]);
    setActiveTextId(null);
    toast.success("Доска очищена");
  };

  const handleBoardClick = (e) => {
    const isCanvasClick =
      e.target === boardRef.current ||
      e.target === canvasRef.current?.getCanvas();

    if (isCanvasClick && !isInteractingWithImage.current) {
      setSelectedImageId(null);
      setActiveTextId(null);
      setDeletedImagesHistory([]); // Очищаем историю удаленных изображений
    }
    // Если мы в режиме редактирования текста - завершаем его
    if (isTextEditing) {
      setIsTextEditing(false);
      setTextElements((prev) =>
        prev.map((text) =>
          text.isEditing ? { ...text, isEditing: false } : text
        )
      );
      setActiveCursor();

      // Сбрасываем активный текст и завершаем редактирование
      setActiveTextId(null);
    }
  };

  const handleSaveCanvas = async () => {
    try {
      // 1. Получаем текущий canvas из BrushTool
      const drawingCanvas = brushToolRef.current?.getCanvas();
      if (!drawingCanvas) {
        throw new Error("Drawing canvas not available");
      }

      // 2. Создаем временный canvas для объединения всего
      const canvas = document.createElement("canvas");
      const board = boardRef.current;

      // Устанавливаем размеры canvas равными размерам доски
      canvas.width = board.scrollWidth;
      canvas.height = board.scrollHeight;
      const ctx = canvas.getContext("2d");

      // 3. Заливаем фон белым цветом
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 4. Отрисовываем сетку
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

      // 5. Отрисовываем рисунок с BrushTool
      ctx.drawImage(drawingCanvas, 0, 0, canvas.width, canvas.height);

      // 6. Отрисовываем изображения
      await Promise.all(
        images.map((image) => {
          return new Promise((resolve) => {
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
              resolve();
            };
            img.src = image.src;
          });
        })
      );

      // 7. Отрисовываем текстовые элементы
      textElements.forEach((text) => {
        ctx.fillStyle = text.color;
        ctx.font = `${text.fontSize}px Arial`;
        ctx.fillText(text.content, text.x, text.y + text.fontSize);
      });

      // 8. Создаем ссылку для скачивания
      const link = document.createElement("a");
      link.download = `whiteboard-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Изображение сохранено");
    } catch (error) {
      console.error("Error saving canvas:", error);

      toast.error("Не удалось сохранить текущую доску");
    }
  };

  const handlePointerDown = useCallback(
    (e) => {
      if (e.pointerType === "pen") {
        setDeletedImagesHistory([]); // Очищаем историю удаленных изображений
        // Очищаем предыдущий таймер, если он был
        document.body.style.overflow = "hidden";

        if (isEraserActive === false) {
          setIsPenActive(true);
          setIsCursorActive(false);
        }

        setInputType("pen");
        setIsImageClickable(false);
        isInteractingWithImage.current = false;
        setSelectedImageId(null);
      } else if (e.pointerType === "touch" || e.pointerType === "mouse") {
        setInputType(e.pointerType);
        setIsPenActive(false);
        setIsEraserActive(false);
        setIsCursorActive(true);
        setIsImageClickable(true);
      }
    },
    [inputType, isEraserActive]
  );

  const handleTextChange = (id, newContent) => {
    setSelectedImageId(null);
    setTextElements((prev) =>
      prev.map((text) =>
        text.id === id ? { ...text, content: newContent } : text
      )
    );
  };

  const handleTextAdd = (e) => {
    setSelectedImageId(null);
    // Не создаем текст если:
    // 1. Режим текста не активен
    // 2. Идет редактирование
    // 3. Есть активный текст (чтобы не создавать новый при клике на доску)
    if (!isTextActive || isTextEditing || activeTextId) return;

    // Проверяем, был ли клик по другому текстовому элементу
    const clickedOnText = e.target.closest("[data-text-element]");
    if (clickedOnText) return;

    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newText = {
      id: Date.now(),
      x,
      y,
      content: "Нажмите чтобы редактировать",
      color: textColor,
      fontSize: textSize,
      isEditing: true,
      isDragging: false,
    };

    setIsTextEditing(true); // Устанавливаем флаг при начале редактирования
    setTextElements((prev) => [...prev, newText]);
    setActiveTextId(newText.id);
  };

  const handleTextBlur = (id) => {
    setTextElements((prev) =>
      prev.map((text) =>
        text.id === id ? { ...text, isEditing: false } : text
      )
    );
  };
  const handlePointerUp = useCallback(() => {
    document.body.style.overflow = "visible";
  }, []);

  useEffect(() => {
    const board = boardRef.current;
    if (board) {
      board.addEventListener("pointerdown", handlePointerDown);
      board.addEventListener("pointerup", handlePointerUp);

      return () => {
        board.removeEventListener("pointerdown", handlePointerDown);
        board.removeEventListener("pointerup", handlePointerUp);
      };
    }
  }, [handlePointerDown, handlePointerUp]);

  const setActiveCursor = () => {
    setIsCursorActive(true);
    setIsPenActive(false);
    setIsEraserActive(false);
    setInputType("mouse");
    setIsTextActive(false);

    //изображение
    setIsImageClickable(true);

    //фреймы
    setEraserFrameActive(false);
    setPenFrameActive(false);
    setEraserFrameActive(false);
    setToolsFrameActive(false);
    setTools3FrameActive(false);

    //фигуры
    deactivateTools();
    deactivateTools3();
  };

  const setActivePen = () => {
    setIsCursorActive(false);
    setIsPenActive(true);
    setIsEraserActive(false);
    setInputType("pen");
    setIsTextActive(false);

    //изображения
    setIsImageClickable(false);
    isInteractingWithImage.current = false;
    setSelectedImageId(null);

    //фреймы
    setEraserFrameActive(false);
    setEraserFrameActive(false);
    setToolsFrameActive(false);
    setTools3FrameActive(false);

    //фигуры
    deactivateTools();
    deactivateTools3();
  };
  const setActiveEraser = () => {
    setIsCursorActive(false);
    setIsPenActive(false);
    setIsEraserActive(true);
    setInputType("pen");
    setIsTextActive(false);

    //изображения
    setIsImageClickable(false);
    isInteractingWithImage.current = false;
    setSelectedImageId(null);

    //фреймы
    setEraserFrameActive(false);
    setPenFrameActive(false);
    setToolsFrameActive(false);
    setTools3FrameActive(false);

    //фигуры
    deactivateTools();
    deactivateTools3();
  };

  const setActiveTools = () => {
    setIsCursorActive(false);
    setIsPenActive(false);
    setIsEraserActive(false);
    setInputType("pen");
    setIsTextActive(false);

    //изображения
    setIsImageClickable(false);
    isInteractingWithImage.current = false;
    setSelectedImageId(null);

    //фреймы
    setEraserFrameActive(false);
    setPenFrameActive(false);
    setEraserFrameActive(false);
    setTools3FrameActive(false);

    //фигуры
    deactivateTools3();
  };

  const setActiveTools3 = () => {
    setIsCursorActive(false);
    setIsPenActive(false);
    setIsEraserActive(false);
    setInputType("pen");
    setIsTextActive(false);

    //изображения
    setIsImageClickable(false);
    isInteractingWithImage.current = false;
    setSelectedImageId(null);

    //фреймы
    setEraserFrameActive(false);
    setPenFrameActive(false);
    setEraserFrameActive(false);
    setToolsFrameActive(false);

    //фигуры
    deactivateTools();
  };

  const setActiveText = () => {
    setIsCursorActive(false);
    setIsPenActive(false);
    setIsEraserActive(false);
    setInputType("pen");

    //изображения
    setIsImageClickable(false);
    isInteractingWithImage.current = false;
    setSelectedImageId(null);

    //фреймы
    setEraserFrameActive(false);
    setPenFrameActive(false);
    setEraserFrameActive(false);
    setToolsFrameActive(false);
    setTools3FrameActive(false);

    //фигуры
    deactivateTools();
    deactivateTools3();
  };

  const deactivateTools = () => {
    // Основные инструменты
    setIsLineActive(false);
    setIsRectActive(false);
    setIsCircleActive(false);
    setIsDashedLineActive(false);

    // Треугольники
    setIsTriangleActive(false);
    setIsIsoscelesTriangleActive(false);
    setIsEquilateralTriangleActive(false);
    setIsRightTriangleActive(false);

    // Четырехугольники
    setIsHexagonActive(false);
    setIsTrapezoidActive(false);
    setIsIsoscelesTrapezoidActive(false);
    setIsRightTrapezoidActive(false);
    setIsRhombusActive(false);
    setIsParallelogramActive(false);
  };

  const deactivateTools3 = () => {
    setIsCubeActive(false);
    setIsRectPrismActive(false);
    setIsTriangularPrismActive(false);
    setIsTriangularPyramidActive(false);
    setIsQuadPyramidActive(false);
    setIsCylinderActive(false);
    setIsConeActive(false);
    setIsHexPyramidActive(false);
    setIsHexPrismActive(false);
  };

  const oneShapeActive = () => {
    return (
      // Основные 2D инструменты
      isLineActive ||
      isRectActive ||
      isCircleActive ||
      isDashedLineActive ||
      // Треугольники
      isTriangleActive ||
      isIsoscelesTriangleActive ||
      isEquilateralTriangleActive ||
      isRightTriangleActive ||
      // Четырехугольники
      isHexagonActive ||
      isTrapezoidActive ||
      isIsoscelesTrapezoidActive ||
      isRightTrapezoidActive ||
      isRhombusActive ||
      isParallelogramActive
    );
  };

  const twoShapeActive = () => {
    return (
      // 3D фигуры
      isCubeActive ||
      isRectPrismActive ||
      isTriangularPrismActive ||
      isTriangularPyramidActive ||
      isQuadPyramidActive ||
      isCylinderActive ||
      isConeActive ||
      isHexPyramidActive ||
      isHexPrismActive
    );
  };

  const getBrushSize = () => {
    if (isEraserActive) return eraserSize;
    // Если активен только инструмент Pen (без фигур)
    if (isPenActive && !oneShapeActive() && !twoShapeActive()) {
      return brushSize;
    }
    // Для 3D фигур
    if (twoShapeActive()) {
      return brushSize3D;
    }
    // Для 2D фигур и по умолчанию
    return brushSize2D;
  };

  const getCurrentColor = () => {
    if (isEraserActive) return eraserColor;
    if (isPenActive && !oneShapeActive() && !twoShapeActive()) {
      return brushColor;
    }
    if (twoShapeActive()) {
      return shape3DColor;
    }
    return shape2DColor;
  };

  const adjustTextareaSize = (textarea) => {
    // Сбросим высоту и ширину до auto для корректного расчета
    textarea.style.height = "auto";
    textarea.style.width = "auto";

    // Установим новую высоту и ширину на основе содержимого
    textarea.style.height = `${textarea.scrollHeight}px`;
    textarea.style.width = `${Math.min(
      textarea.scrollWidth,
      300 // Максимальная ширина (можно настроить)
    )}px`;
  };

  useEffect(() => {
    if (isTextEditing && activeTextId) {
      const textarea = document.querySelector(
        `[data-text-element="${activeTextId}"] textarea`
      );
      if (textarea) {
        adjustTextareaSize(textarea);
      }
    }
  }, [isTextEditing, activeTextId]);

  const iconSize = "28px";
  const iconColorActive = "blue";

  return (
    <>
      <div
        ref={boardRef}
        style={{
          touchAction: isInteractingWithImage.current ? "none" : "auto", // Динамическое управление
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: "3000px", // Установите желаемую высоту
          backgroundImage: `
          linear-gradient(#eee 1px, transparent 1px),
          linear-gradient(90deg, #eee 1px, transparent 1px)
        `,
          backgroundSize: "30px 30px",
          overflow: "hidden",
        }}
        onClick={handleBoardClick}
      >
        {/* 2. Затем BrushTool (рисование) - теперь он будет поверх */}
        <BrushTool
          ref={brushToolRef}
          canvasRef={canvasRef}
          isInteractingRef={isInteractingWithImage}
          color={getCurrentColor()}
          size={getBrushSize()}
          isEraserActive={isEraserActive}
          scrollPosition={scrollPosition}
          pointerEvents={
            oneShapeActive() ||
            twoShapeActive() ||
            isPenActive ||
            isEraserActive
              ? "auto"
              : "none"
          }
          // Основные инструменты
          isLineActive={isLineActive}
          isRectActive={isRectActive}
          isCircleActive={isCircleActive}
          isDashedLineActive={isDashedLineActive}
          // Треугольники
          isTriangleActive={isTriangleActive}
          isIsoscelesTriangleActive={isIsoscelesTriangleActive}
          isEquilateralTriangleActive={isEquilateralTriangleActive}
          isRightTriangleActive={isRightTriangleActive}
          // Четырехугольники
          isHexagonActive={isHexagonActive}
          isTrapezoidActive={isTrapezoidActive}
          isIsoscelesTrapezoidActive={isIsoscelesTrapezoidActive}
          isRightTrapezoidActive={isRightTrapezoidActive}
          isRhombusActive={isRhombusActive}
          isParallelogramActive={isParallelogramActive}
          //3д инструменты
          isCubeActive={isCubeActive}
          isRectPrismActive={isRectPrismActive}
          isTriangularPrismActive={isTriangularPrismActive}
          isTriangularPyramidActive={isTriangularPyramidActive}
          isQuadPyramidActive={isQuadPyramidActive}
          isCylinderActive={isCylinderActive}
          isConeActive={isConeActive}
          isHexPyramidActive={isHexPyramidActive}
          isHexPrismActive={isHexPrismActive}
        />
        {/* 3. Невидимые элементы для взаимодействия с изображениями */}
        {images.map((image) => {
          return (
            <div
              key={image.id}
              style={{
                position: "absolute",
                left: `${image.x}px`,
                top: `${image.y}px`,
                width: `${image.originalWidth * image.scale}px`,
                height: `${image.originalHeight * image.scale}px`,
                transform: `rotate(${image.rotation}deg)`,
                transformOrigin: "center center",
                zIndex:
                  image.zIndex ||
                  (selectedImageId === image.id ? maxZIndex : 10),
                pointerEvents: isImageClickable ? "auto" : "none",
                cursor: "move",
                border:
                  selectedImageId === image.id ? "2px dashed black" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={(e) => handleImageClick(e, image.id)}
              onMouseDown={(e) =>
                e.button === 0 && handleDragStart(e, image.id)
              }
              onTouchStart={(e) => handleDragStart(e, image.id)}
            >
              <img
                src={image.src}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  pointerEvents: "none",
                }}
                alt=""
                draggable="false"
              />
              {selectedImageId === image.id && (
                <>
                  <div
                    style={{
                      display: "block",
                      lineHeight: "20px",
                      textAlign: "center",
                      position: "absolute",
                      top: "-30px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "24px",
                      height: "24px",
                      background: "black",
                      color: "white",
                      borderRadius: "50%",
                      cursor: "grab",
                      pointerEvents: "auto",
                      zIndex: (image.zIndex || maxZIndex) + 1, // На 1 выше, чем у изображения
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleRotateStart(e, image.id);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleRotateStart(e, image.id);
                    }}
                  >
                    ↻
                  </div>
                  <div
                    style={{
                      display: "block",
                      lineHeight: "19px",
                      textAlign: "center",
                      fontSize: "20px",
                      position: "absolute",
                      right: "-12px",
                      bottom: "-12px",
                      width: "24px",
                      height: "24px",
                      background: "black",
                      color: "white",
                      borderRadius: "50%",
                      cursor: "nwse-resize",
                      pointerEvents: "auto",
                      zIndex: (image.zIndex || maxZIndex) + 1, // На 1 выше, чем у изображения
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleResizeStart(e, image.id);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleResizeStart(e, image.id);
                    }}
                  >
                    ⤢
                  </div>
                </>
              )}
            </div>
          );
        })}
        {textElements.map((text) => (
          <div
            key={text.id}
            data-text-element="true" // Добавляем атрибут для идентификации
            style={{
              position: "absolute",
              left: `${text.x}px`,
              top: `${text.y}px`,
              color: text.color,
              fontSize: `${text.fontSize}px`,
              cursor: text.isDragging ? "grabbing" : "move",
              userSelect: "none",
              zIndex: activeTextId === text.id ? 1000 : 10,
              outline: activeTextId === text.id ? "2px dashed black" : "none",
              padding: "5px",
              backgroundColor: text.isEditing
                ? "rgba(0,0,0,0.05)"
                : "transparent",
              width: "fit-content",
              maxWidth: "1600px", // Ограничиваем максимальную ширину
              wordWrap: "break-word", // Перенос длинных слов
            }}
            onClick={(e) => {
              e.stopPropagation();

              setSelectedImageId(null);
              if (activeTextId !== text.id) {
                setActiveTextId(text.id);
              }
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsTextEditing(true); // Устанавливаем флаг при начале редактирования
              setTextElements((prev) =>
                prev.map((t) =>
                  t.id === text.id ? { ...t, isEditing: true } : t
                )
              );
            }}
            onMouseDown={(e) => {
              if (e.button === 0 && !text.isEditing) {
                const startX = e.clientX;
                const startY = e.clientY;
                const startTextX = text.x;
                const startTextY = text.y;

                const handleMouseMove = (e) => {
                  const dx = e.clientX - startX;
                  const dy = e.clientY - startY;
                  setTextElements((prev) =>
                    prev.map((t) =>
                      t.id === text.id
                        ? {
                            ...t,
                            x: startTextX + dx,
                            y: startTextY + dy,
                            isDragging: true,
                          }
                        : t
                    )
                  );
                };

                const handleMouseUp = () => {
                  document.removeEventListener("mousemove", handleMouseMove);
                  document.removeEventListener("mouseup", handleMouseUp);
                  setTextElements((prev) =>
                    prev.map((t) =>
                      t.id === text.id ? { ...t, isDragging: false } : t
                    )
                  );
                };

                document.addEventListener("mousemove", handleMouseMove);
                document.addEventListener("mouseup", handleMouseUp);
              }
            }}
          >
            {text.isEditing ? (
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  // Передаем текущие стили текста для точного измерения
                  fontSize: `${text.fontSize}px`,
                  fontFamily: "inherit",
                  lineHeight: "1.2",
                  padding: "2px 5px",
                }}
              >
                <textarea
                  autoFocus
                  value={text.content}
                  ref={(el) => {
                    if (el) {
                      // При монтировании сразу устанавливаем правильный размер
                      el.style.height = "auto";
                      el.style.width = "auto";

                      // Используем скрытый div для точного измерения
                      const hiddenDiv = document.createElement("div");
                      hiddenDiv.style.position = "absolute";
                      hiddenDiv.style.visibility = "hidden";
                      hiddenDiv.style.whiteSpace = "pre";
                      hiddenDiv.style.fontSize = `${text.fontSize}px`;
                      hiddenDiv.style.fontFamily = "inherit";
                      hiddenDiv.style.padding = "2px 5px";
                      hiddenDiv.style.lineHeight = "1.2";
                      hiddenDiv.textContent = el.value;

                      document.body.appendChild(hiddenDiv);

                      const hasBreaks = el.value.includes("\n");
                      if (!hasBreaks) {
                        el.style.width = `${Math.min(
                          hiddenDiv.offsetWidth + 10,
                          500
                        )}px`;
                      } else {
                        el.style.width = "500px";
                      }
                      el.style.height = `${hiddenDiv.offsetHeight}px`;

                      document.body.removeChild(hiddenDiv);
                    }
                  }}
                  onChange={(e) => {
                    handleTextChange(text.id, e.target.value);

                    // Используем скрытый div для точного измерения
                    const hiddenDiv = document.createElement("div");
                    hiddenDiv.style.position = "absolute";
                    hiddenDiv.style.visibility = "hidden";
                    hiddenDiv.style.whiteSpace = "pre";
                    hiddenDiv.style.fontSize = `${text.fontSize}px`;
                    hiddenDiv.style.fontFamily = "inherit";
                    hiddenDiv.style.padding = "2px 5px";
                    hiddenDiv.style.lineHeight = "1.2";
                    hiddenDiv.textContent = e.target.value;

                    document.body.appendChild(hiddenDiv);

                    const hasBreaks = e.target.value.includes("\n");
                    if (!hasBreaks) {
                      e.target.style.width = `${Math.min(
                        hiddenDiv.offsetWidth + 10,
                        500
                      )}px`;
                    } else {
                      e.target.style.width = "500px";
                    }
                    e.target.style.height = `${hiddenDiv.offsetHeight}px`;

                    document.body.removeChild(hiddenDiv);
                  }}
                  onBlur={() => handleTextBlur(text.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      handleTextBlur(text.id);
                      setActiveTextId(null);
                      setIsTextEditing(false);
                    }
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleTextChange(text.id, text.content + "\n");
                    }
                  }}
                  style={{
                    fontSize: `${text.fontSize}px`,
                    color: text.color,
                    background: "none",
                    outline: "none",
                    minWidth: "50px",
                    minHeight: `${text.fontSize}px`,
                    resize: "none",
                    pointerEvents: "auto",
                    whiteSpace: "pre",
                    fontFamily: "inherit",
                    overflow: "hidden",
                    padding: "2px 5px",
                    lineHeight: "1.2",
                    transition: "width 0.2s ease, height 0.2s ease",
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  pointerEvents: "none",
                  whiteSpace: "pre-wrap",
                  fontSize: `${text.fontSize}px`,
                  color: text.color,
                  padding: "2px 5px",
                  lineHeight: "1.2",
                }}
              >
                {text.content}
              </div>
            )}
          </div>
        ))}
        {isTextActive && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: "auto",
            }}
            onClick={handleTextAdd}
          />
        )}
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "34%",
            transform: "translateX(-50%)",
            display: "flex",
            padding: "10px",
            background: "white",
            borderRadius: "8px",
            boxShadow: "0 0 10px rgba(0,0,0,0.2)",
            zIndex: 1001,
            pointerEvents: "auto",
            display: "flex",
            gap: "10px",
          }}
        >
          <button onClick={handleUndo} style={{ cursor: "pointer" }}>
            <LuUndo2 size={24} />
          </button>
          <button onClick={handleRedo} style={{ cursor: "pointer" }}>
            <LuRedo2 size={24} />
          </button>
        </div>
        <Toolbar>
          <button
            onClick={() => {
              setActiveCursor();
            }}
            style={{
              cursor: "pointer",
              color: isCursorActive ? iconColorActive : "black",
            }}
          >
            <MousePointer2 />
          </button>
          <button
            onClick={() => {
              setActivePen();
              setPenFrameActive(true);

              if (penFrameActive) {
                setPenFrameActive(false);
              }
            }}
            style={{
              cursor: "pointer",
              color: isPenActive ? iconColorActive : "black",
            }}
          >
            <PencilLine />
          </button>
          <button
            onClick={() => {
              setActiveEraser();
              setEraserFrameActive(true);

              if (eraserFrameActive) {
                setEraserFrameActive(false);
              }
            }}
            style={{
              cursor: "pointer",
              color: isEraserActive ? iconColorActive : "black",
            }}
          >
            <Eraser />
          </button>
          {penFrameActive && (
            <div style={{ position: "absolute", bottom: "50px" }}>
              <ColorPicker color={brushColor} setColor={setBrushColor} />
              <div style={{ display: "flex", gap: "10px" }}>
                <span>Размер: {brushSize}</span>
                <Slider
                  value={[brushSize]}
                  onValueChange={setBrushSize}
                  max={50}
                  step={1}
                  style={{ width: "150px" }}
                />
              </div>
            </div>
          )}
          {eraserFrameActive && (
            <div style={{ position: "absolute", bottom: "50px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <span>Размер: {eraserSize}</span>
                <Slider
                  value={[eraserSize]}
                  onValueChange={setEraserSize}
                  max={50}
                  step={1}
                  style={{ width: "150px" }}
                />
              </div>
            </div>
          )}
          <button
            onClick={() => {
              setActiveCursor();
              fileInputRef.current.click();
            }}
            style={{ cursor: "pointer" }}
          >
            <ImagePlus />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAddImage}
            accept="image/*"
            style={{ display: "none" }}
            multiple
          />
          <button
            onClick={() => setClearConfirmOpen(true)}
            style={{ cursor: "pointer" }}
          >
            <Trash />
          </button>
          <button onClick={handleSaveCanvas} style={{ cursor: "pointer" }}>
            <Download />
          </button>
          <button
            onClick={() => {
              setToolsFrameActive(true);
              setActiveTools();
              if (toolsFrameActive) {
                setToolsFrameActive(false);
              }
            }}
            style={{
              cursor: "pointer",
              color: toolsFrameActive ? iconColorActive : "black",
            }}
          >
            <Shapes />
          </button>
          {toolsFrameActive && (
            <div
              style={{
                position: "absolute",
                bottom: "50px",
              }}
            >
              <ColorPicker
                color={shape2DColor}
                setColor={setShape2DColor}
                title="Цвет 2D фигур"
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <span>Размер: {brushSize2D}</span>
                <Slider
                  value={[brushSize2D]}
                  onValueChange={setBrushSize2D}
                  max={50}
                  step={1}
                  style={{ width: "150px" }}
                />
              </div>
              {/* Основные инструменты */}
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                <button
                  onClick={() => {
                    deactivateTools();
                    setActiveTools();
                    setIsLineActive(true);
                  }}
                  style={{
                    color: isLineActive ? iconColorActive : "",
                    cursor: "pointer",
                  }}
                >
                  <ToolbarSvgSelector
                    id="line"
                    size={iconSize}
                    color={isLineActive ? iconColorActive : "black"}
                  />
                </button>

                <button
                  onClick={() => {
                    deactivateTools();
                    setActiveTools();
                    setIsDashedLineActive(true);
                  }}
                  style={{
                    color: isDashedLineActive ? iconColorActive : "",
                    cursor: "pointer",
                  }}
                >
                  <TbLineDashed size={iconSize} />
                </button>

                <button
                  onClick={() => {
                    deactivateTools();
                    setActiveTools();
                    setIsRectActive(true);
                  }}
                  style={{
                    color: isRectActive ? iconColorActive : "",
                    cursor: "pointer",
                  }}
                >
                  <LuRectangleHorizontal size={iconSize} />
                </button>

                {/* Треугольники */}
                <button
                  onClick={() => {
                    deactivateTools();
                    setActiveTools();
                    setIsTriangleActive(true);
                  }}
                  style={{
                    color: isTriangleActive ? iconColorActive : "",
                    cursor: "pointer",
                  }}
                >
                  <ToolbarSvgSelector
                    id="triangle"
                    size={iconSize}
                    color={isTriangleActive ? iconColorActive : "black"}
                  />
                </button>

                <button
                  onClick={() => {
                    deactivateTools();
                    setActiveTools();
                    setIsIsoscelesTriangleActive(true);
                  }}
                  style={{
                    color: isIsoscelesTriangleActive ? iconColorActive : "",
                    cursor: "pointer",
                  }}
                >
                  <ToolbarSvgSelector
                    id="istriangle"
                    size={iconSize}
                    color={
                      isIsoscelesTriangleActive ? iconColorActive : "black"
                    }
                  />
                </button>

                <button
                  onClick={() => {
                    deactivateTools();
                    setActiveTools();
                    setIsEquilateralTriangleActive(true);
                  }}
                  style={{
                    color: isEquilateralTriangleActive ? iconColorActive : "",
                    cursor: "pointer",
                  }}
                >
                  <ToolbarSvgSelector
                    id="eqtriangle"
                    size={iconSize}
                    color={
                      isEquilateralTriangleActive ? iconColorActive : "black"
                    }
                  />
                </button>

                <button
                  onClick={() => {
                    deactivateTools();
                    setActiveTools();
                    setIsRightTriangleActive(true);
                  }}
                  style={{
                    color: isRightTriangleActive ? iconColorActive : "",
                    cursor: "pointer",
                  }}
                >
                  <ToolbarSvgSelector
                    id="rgtriangle"
                    size={iconSize}
                    color={isRightTriangleActive ? iconColorActive : "black"}
                  />
                </button>

                {/* Четырехугольники */}

                <button
                  onClick={() => {
                    deactivateTools();
                    setActiveTools();
                    setIsParallelogramActive(true);
                  }}
                  style={{
                    color: isParallelogramActive ? iconColorActive : "",
                    cursor: "pointer",
                  }}
                >
                  <PiParallelogramBold size={iconSize} />
                </button>
                <button
                  onClick={() => {
                    deactivateTools();
                    setActiveTools();
                    setIsRhombusActive(true);
                  }}
                  style={{
                    color: isRhombusActive ? iconColorActive : "",
                    cursor: "pointer",
                  }}
                >
                  <TbDiamonds size={iconSize} />
                </button>
                <button
                  onClick={() => {
                    deactivateTools();
                    setActiveTools();
                    setIsTrapezoidActive(true);
                  }}
                  style={{
                    color: isTrapezoidActive ? iconColorActive : "",
                    cursor: "pointer",
                  }}
                >
                  <ToolbarSvgSelector
                    id="trapezoid"
                    size={iconSize}
                    color={isTrapezoidActive ? iconColorActive : "black"}
                  />
                </button>

                <button
                  onClick={() => {
                    deactivateTools();
                    setActiveTools();
                    setIsIsoscelesTrapezoidActive(true);
                  }}
                  style={{
                    color: isIsoscelesTrapezoidActive ? iconColorActive : "",
                    cursor: "pointer",
                  }}
                >
                  <ToolbarSvgSelector
                    id="istrapezoid"
                    size={iconSize}
                    color={
                      isIsoscelesTrapezoidActive ? iconColorActive : "black"
                    }
                  />
                </button>

                <button
                  onClick={() => {
                    deactivateTools();
                    setActiveTools();
                    setIsRightTrapezoidActive(true);
                  }}
                  style={{
                    color: isRightTrapezoidActive ? iconColorActive : "",
                    cursor: "pointer",
                  }}
                >
                  <ToolbarSvgSelector
                    id="rgtrapezoid"
                    size={iconSize}
                    color={isRightTrapezoidActive ? iconColorActive : "black"}
                  />
                </button>

                <button
                  onClick={() => {
                    deactivateTools();
                    setActiveTools();
                    setIsCircleActive(true);
                  }}
                  style={{
                    color: isCircleActive ? iconColorActive : "",
                    cursor: "pointer",
                  }}
                >
                  <ToolbarSvgSelector
                    id="circle"
                    size={iconSize}
                    color={isCircleActive ? iconColorActive : "black"}
                  />
                </button>

                <button
                  onClick={() => {
                    deactivateTools();
                    setActiveTools();
                    setIsHexagonActive(true);
                  }}
                  style={{
                    color: isHexagonActive ? iconColorActive : "",
                    cursor: "pointer",
                  }}
                >
                  <ToolbarSvgSelector
                    id="hexagon"
                    size={iconSize}
                    color={isHexagonActive ? iconColorActive : "black"}
                  />
                </button>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              setTools3FrameActive(true);
              setActiveTools3();
              if (tools3FrameActive) {
                setTools3FrameActive(false);
              }
            }}
            style={{
              cursor: "pointer",
              color: tools3FrameActive ? iconColorActive : "black",
            }}
          >
            <Boxes />
          </button>
          {tools3FrameActive && (
            <div style={{ position: "absolute", bottom: "50px" }}>
              <ColorPicker
                color={shape3DColor}
                setColor={setShape3DColor}
                title="Цвет 3D фигур"
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <span>Размер: {brushSize3D}</span>
                <Slider
                  value={[brushSize3D]}
                  onValueChange={setBrushSize3D}
                  max={50}
                  step={1}
                  style={{ width: "150px" }}
                />
              </div>
              <button
                onClick={() => {
                  deactivateTools3();
                  setIsCubeActive(true);
                }}
                style={{
                  color: isCubeActive ? iconColorActive : "",
                  cursor: "pointer",
                }}
              >
                <TbCubePlus size={iconSize} />
              </button>
              <button
                onClick={() => {
                  deactivateTools3();
                  setIsRectPrismActive(true);
                }}
                style={{
                  color: isRectPrismActive ? iconColorActive : "",
                  cursor: "pointer",
                }}
              >
                <TbRectangularPrismPlus size={iconSize} />
              </button>
              <button
                onClick={() => {
                  deactivateTools3();
                  setIsTriangularPrismActive(true);
                }}
                style={{
                  color: isTriangularPrismActive ? iconColorActive : "",
                  cursor: "pointer",
                }}
              >
                <TbPrismPlus size={iconSize} />
              </button>
              <button
                onClick={() => {
                  deactivateTools3();
                  setIsTriangularPyramidActive(true);
                }}
                style={{
                  color: isTriangularPyramidActive ? iconColorActive : "",
                  cursor: "pointer",
                }}
              >
                <TbOctahedronPlus size={iconSize} />
              </button>
              <button
                onClick={() => {
                  deactivateTools3();
                  setIsQuadPyramidActive(true);
                }}
                style={{
                  color: isQuadPyramidActive ? iconColorActive : "",
                  cursor: "pointer",
                }}
              >
                <TbPyramidPlus size={iconSize} />
              </button>
              <button
                onClick={() => {
                  deactivateTools3();
                  setIsCylinderActive(true);
                }}
                style={{
                  color: isCylinderActive ? iconColorActive : "",
                  cursor: "pointer",
                }}
              >
                <TbCylinderPlus size={iconSize} />
              </button>
              <button
                onClick={() => {
                  deactivateTools3();
                  setIsConeActive(true);
                }}
                style={{
                  color: isConeActive ? iconColorActive : "",
                  cursor: "pointer",
                }}
              >
                <TbConePlus size={iconSize} />
              </button>
              <button
                onClick={() => {
                  deactivateTools3();
                  setIsHexPyramidActive(true);
                }}
                style={{
                  color: isHexPyramidActive ? iconColorActive : "",
                  cursor: "pointer",
                }}
              >
                <TbHexagonalPyramidPlus size={iconSize} />
              </button>
              <button
                onClick={() => {
                  deactivateTools3();
                  setIsHexPrismActive(true);
                }}
                style={{
                  color: isHexPrismActive ? iconColorActive : "",
                  cursor: "pointer",
                }}
              >
                <TbHexagonalPrismPlus size={iconSize} />
              </button>
            </div>
          )}
          <button
            onClick={() => {
              setIsTextActive(true);
              setActiveText();
              if (isTextActive) {
                setIsTextActive(false);
              }
            }}
            style={{
              color: isTextActive ? iconColorActive : "",
              cursor: "pointer",
            }}
          >
            <ALargeSmall />
          </button>
          {isTextActive && (
            <div style={{ position: "absolute", bottom: "50px" }}>
              <ColorPicker
                color={textColor}
                setColor={setTextColor}
                title="Цвет текста"
              />

              <div style={{ display: "flex", gap: "10px" }}>
                <span>Размер: {textSize}</span>
                <Slider
                  value={[textSize]}
                  onValueChange={setTextSize}
                  max={50}
                  step={1}
                  style={{ width: "150px" }}
                />
              </div>
            </div>
          )}
          <button
            onClick={handleSave}
            style={{
              cursor: "pointer",
            }}
          >
            <Save size={24} />
          </button>
        </Toolbar>
        {isSaving && (
          <div
            style={{
              position: "fixed",
              bottom: 30,
              right: 10,
              fontSize: 12,
              color: "#666",
              zIndex: 10000,
            }}
          >
            Сохранение...
          </div>
        )}
        {lastSaveTime && (
          <div
            style={{
              position: "fixed",
              bottom: 10,
              right: 10,
              fontSize: 12,
              zIndex: 1003,
              color: "#666",
            }}
          >
            Последнее сохранение: {lastSaveTime.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Диалоговое окно подтверждения очистки */}
      <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Очистить доску?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите очистить доску? Это действие нельзя
              отменить. Все ваши рисунки, изображения и текст будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearCanvas}>
              Очистить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

export default Whiteboard;
