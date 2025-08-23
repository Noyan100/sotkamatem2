"use client";

import React, {
  useImperativeHandle,
  useRef,
  useEffect,
  forwardRef,
  useCallback,
  useState,
} from "react";

const BrushTool = forwardRef(
  (
    {
      color = "#000000",
      size = 6,
      isEraserActive = false,
      onSizeChange,
      isInteractingRef,
      scrollOffset = 0,
      pointerEvents,
      opacity = 1.0,

      // Основные инструменты
      isLineActive = false,
      isRectActive = false,
      isCircleActive = false,
      isDashedLineActive = false,

      // Треугольники
      isTriangleActive = false,
      isIsoscelesTriangleActive = false,
      isEquilateralTriangleActive = false,
      isRightTriangleActive = false,

      // Четырехугольники
      isHexagonActive = false,
      isTrapezoidActive = false,
      isIsoscelesTrapezoidActive = false,
      isRightTrapezoidActive = false,
      isRhombusActive = false,
      isParallelogramActive = false,

      //3д Фигуры
      isCubeActive = false,
      isRectPrismActive = false, // Прямоугольный параллелепипед
      isTriangularPrismActive = false, // Треугольная призма
      isTriangularPyramidActive = false, // Треугольная пирамида
      isQuadPyramidActive = false, // Четырехугольная пирамида
      isCylinderActive = false, // Цилиндр
      isConeActive = false, // Конус
      isHexPyramidActive = false, // Шестиугольная пирамида
      isHexPrismActive = false, // Шестиугольная призма
    },
    ref
  ) => {
    const canvasRef = useRef(null);
    const brushCacheRef = useRef({});
    const isDrawing = useRef(false);
    const lastPos = useRef(null);
    const canvasRect = useRef({ left: 0, top: 0 });
    const pointsRef = useRef([]);
    const savedCanvasRef = useRef(null);
    const cursorRef = useRef(null);
    const [cursorPos, setCursorPos] = useState({
      x: -100,
      y: -100,
      visible: false,
    });

    const historyStack = useRef({
      undo: [],
      redo: [],
      currentIndex: -1,
      maxSteps: 50,
    });

    const startPointRef = useRef(null);

    const saveStateToHistory = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      requestAnimationFrame(() => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { current } = historyStack;

        // Если текущий индекс не последний (значит были undo),
        // обрезаем историю до текущего индекса
        if (current.currentIndex < current.undo.length - 1) {
          current.undo = current.undo.slice(0, current.currentIndex + 1);
          current.redo = []; // Очищаем redo
        }

        // Проверяем максимальное количество шагов
        if (current.undo.length >= current.maxSteps) {
          current.undo.shift();
          current.currentIndex = Math.max(0, current.currentIndex - 1);
        }

        current.undo.push(imageData);
        current.currentIndex = current.undo.length - 1;
      });
    }, []);

    const isInitialStateSaved = useRef(false); // Флаг для отслеживания сохранения

    // Эффект, который сработает один раз при монтировании компонента
    useEffect(() => {
      if (!isInitialStateSaved.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          requestAnimationFrame(() => {
            saveStateToHistory();
            isInitialStateSaved.current = true; // Помечаем, что состояние сохранено
          });
        }
      }
    }, [saveStateToHistory]); // Пустой массив зависимостей = только при монтировании

    const restoreStateFromHistory = useCallback((index) => {
      const canvas = canvasRef.current;
      if (!canvas || index < 0 || index >= historyStack.current.undo.length)
        return;

      const ctx = canvas.getContext("2d");
      ctx.putImageData(historyStack.current.undo[index], 0, 0);
      historyStack.current.currentIndex = index;
    }, []);

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
      clearCanvas: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (savedCanvasRef.current) {
          const savedCtx = savedCanvasRef.current.getContext("2d");
          savedCtx.clearRect(
            0,
            0,
            savedCanvasRef.current.width,
            savedCanvasRef.current.height
          );
        }
      },
      getImageData: () => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        return canvas.toDataURL("image/png");
      },
      undo: () => {
        if (historyStack.current.currentIndex <= 0) return false;

        const ctx = canvasRef.current.getContext("2d");
        const currentState = ctx.getImageData(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        historyStack.current.redo.push(currentState);

        const prevIndex = historyStack.current.currentIndex - 1;
        restoreStateFromHistory(prevIndex);

        return true;
      },
      redo: () => {
        if (historyStack.current.redo.length === 0) return false;

        const ctx = canvasRef.current.getContext("2d");
        const currentState = ctx.getImageData(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        historyStack.current.undo.push(currentState);
        historyStack.current.currentIndex++;

        const nextState = historyStack.current.redo.pop();
        ctx.putImageData(nextState, 0, 0);

        return true;
      },
      saveInChunks: async (options = {}) => {
        const {
          chunkSize = 512,
          quality = 0.8,
          mimeType = "image/jpeg",
        } = options;

        const canvas = canvasRef.current;
        if (!canvas) return null;

        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        const totalWidth = canvas.width;
        const totalHeight = canvas.height;
        const chunks = [];

        const getChunkData = (x, y, width, height) => {
          const chunkCanvas = document.createElement("canvas");
          chunkCanvas.width = width;
          chunkCanvas.height = height;
          const chunkCtx = chunkCanvas.getContext("2d");
          chunkCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);
          return chunkCanvas.toDataURL(mimeType, quality);
        };

        for (let y = 0; y < totalHeight; y += chunkSize) {
          for (let x = 0; x < totalWidth; x += chunkSize) {
            const width = Math.min(chunkSize, totalWidth - x);
            const height = Math.min(chunkSize, totalHeight - y);

            chunks.push({
              x,
              y,
              width,
              height,
              data: getChunkData(x, y, width, height),
            });
          }
        }

        return {
          chunks,
          totalWidth,
          totalHeight,
          chunkSize,
          mimeType,
          quality,
        };
      },
      restoreFromChunks: async (chunkData) => {
        const canvas = canvasRef.current;
        if (!canvas) return false;

        const ctx = canvas.getContext("2d");
        if (!ctx) return false;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const chunk of chunkData.chunks) {
          const img = new Image();
          await new Promise((resolve) => {
            img.onload = () => {
              ctx.drawImage(
                img,
                0,
                0,
                chunk.width,
                chunk.height,
                chunk.x,
                chunk.y,
                chunk.width,
                chunk.height
              );
              resolve();
            };
            img.src = chunk.data;
          });
        }

        return true;
      },
      saveProgressively: async (onProgress, options = {}) => {
        const {
          initialChunkSize = 2048,
          minChunkSize = 128,
          qualitySteps = [0.5, 0.7, 0.9],
          mimeType = "image/jpeg",
        } = options;

        const canvas = canvasRef.current;
        if (!canvas) return null;

        let result = {
          layers: [],
          totalWidth: canvas.width,
          totalHeight: canvas.height,
        };

        for (let i = 0; i < qualitySteps.length; i++) {
          const quality = qualitySteps[i];
          const chunkSize = Math.max(
            minChunkSize,
            initialChunkSize / Math.pow(2, i)
          );

          const layer = {
            quality,
            chunkSize,
            chunks: [],
          };

          const totalChunks =
            Math.ceil(canvas.width / chunkSize) *
            Math.ceil(canvas.height / chunkSize);
          let processedChunks = 0;

          for (let y = 0; y < canvas.height; y += chunkSize) {
            for (let x = 0; x < canvas.width; x += chunkSize) {
              const width = Math.min(chunkSize, canvas.width - x);
              const height = Math.min(chunkSize, canvas.height - y);

              const chunkCanvas = document.createElement("canvas");
              chunkCanvas.width = width;
              chunkCanvas.height = height;
              const chunkCtx = chunkCanvas.getContext("2d");
              chunkCtx.drawImage(
                canvas,
                x,
                y,
                width,
                height,
                0,
                0,
                width,
                height
              );

              layer.chunks.push({
                x,
                y,
                width,
                height,
                data: chunkCanvas.toDataURL(mimeType, quality),
              });

              processedChunks++;
              if (onProgress) {
                onProgress({
                  layer: i + 1,
                  totalLayers: qualitySteps.length,
                  processedChunks,
                  totalChunks,
                  progress: (processedChunks / totalChunks) * 100,
                });
              }
            }
          }

          result.layers.push(layer);
        }

        return result;
      },
    }));

    const initSavedCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      savedCanvasRef.current = document.createElement("canvas");
      savedCanvasRef.current.width = canvas.width;
      savedCanvasRef.current.height = canvas.height;

      const ctx = savedCanvasRef.current.getContext("2d");
      ctx.drawImage(canvas, 0, 0);
    }, []);

    const saveCanvasState = useCallback(() => {
      if (!canvasRef.current || !savedCanvasRef.current) return;

      const ctx = savedCanvasRef.current.getContext("2d");
      ctx.clearRect(
        0,
        0,
        savedCanvasRef.current.width,
        savedCanvasRef.current.height
      );
      ctx.drawImage(canvasRef.current, 0, 0);
    }, []);

    const restoreCanvasState = useCallback(() => {
      if (!canvasRef.current || !savedCanvasRef.current) return;

      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(savedCanvasRef.current, 0, 0);
    }, []);

    const createBrush = useCallback(
      (brushSize) => {
        if (brushCacheRef.current[brushSize]) {
          return brushCacheRef.current[brushSize];
        }

        const offscreenCanvas = document.createElement("canvas");
        const size = Math.ceil(brushSize) * 2;
        offscreenCanvas.width = size;
        offscreenCanvas.height = size;

        const ctx = offscreenCanvas.getContext("2d");
        ctx.fillStyle = "rgba(0,0,0,0)"; // Прозрачный фон
        ctx.fillRect(0, 0, size, size);

        if (isEraserActive) {
          // Мягкий ластик с градиентом
          const gradient = ctx.createRadialGradient(
            size,
            size,
            0,
            size,
            size,
            brushSize
          );
          gradient.addColorStop(0, "rgba(0,0,0,1)");
          gradient.addColorStop(0.8, "rgba(0,0,0,0.8)");
          gradient.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = gradient;
        } else {
          // Кисть с цветом
          const gradient = ctx.createRadialGradient(
            size / 2,
            size / 2,
            0,
            size / 2,
            size / 2,
            brushSize / 2
          );
          gradient.addColorStop(0, color);
          gradient.addColorStop(0.8, `${color}80`);
          gradient.addColorStop(1, `${color}00`);
          ctx.fillStyle = gradient;
        }

        ctx.fillRect(0, 0, size, size);
        brushCacheRef.current[brushSize] = offscreenCanvas;
        return offscreenCanvas;
      },
      [isEraserActive, color]
    );

    const updateCanvasRect = useCallback(() => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        canvasRect.current = {
          left: rect.left,
          top: rect.top - scrollOffset,
          width: rect.width,
          height: rect.height,
        };
      }
    }, [scrollOffset]);

    const getPenPosition = useCallback(
      (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const pos = {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top + scrollOffset) * scaleY,
        };

        if (isDrawing.current) {
          setCursorPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            visible: e.pointerType === "pen",
          });
        }

        return pos;
      },
      [scrollOffset]
    );

    const drawDot = useCallback(
      (ctx, x, y, size) => {
        ctx.save(); // Сохраняем текущее состояние контекста

        const effectiveSize = isEraserActive ? size * 1.2 : size;
        const brush = createBrush(effectiveSize);

        ctx.globalCompositeOperation = isEraserActive
          ? "destination-out"
          : "source-over";
        ctx.globalAlpha = opacity;

        ctx.drawImage(
          brush,
          x - effectiveSize,
          y - effectiveSize,
          effectiveSize * 2,
          effectiveSize * 2
        );

        ctx.restore(); // Восстанавливаем состояние
      },
      [createBrush, isEraserActive, opacity]
    );

    const drawLineBetweenPoints = useCallback(
      (ctx, point1, point2, size) => {
        const distance = Math.sqrt(
          Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
        );
        const steps = Math.max(2, Math.ceil(distance / (size / 2)));

        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const x = point1.x + t * (point2.x - point1.x);
          const y = point1.y + t * (point2.y - point1.y);
          drawDot(ctx, x, y, size);
        }
      },
      [drawDot]
    );

    const drawSmoothLine = useCallback(
      (ctx, points, size) => {
        if (points.length < 2) return;

        ctx.save();

        if (isEraserActive) {
          ctx.globalCompositeOperation = "destination-out";
          ctx.globalAlpha = opacity;

          // Для ластика рисуем соединенные линии
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.strokeStyle = "rgba(0,0,0,1)";
          ctx.lineWidth = size * 1.2;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke();
        } else {
          // Оригинальная логика для кисти
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = opacity;
          ctx.lineWidth = size;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.strokeStyle = color;

          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);

          for (let i = 1; i < points.length - 2; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
          }

          if (points.length > 2) {
            ctx.quadraticCurveTo(
              points[points.length - 2].x,
              points[points.length - 2].y,
              points[points.length - 1].x,
              points[points.length - 1].y
            );
          } else {
            ctx.lineTo(points[1].x, points[1].y);
          }

          ctx.stroke();
        }

        ctx.restore();
      },
      [color, opacity, isEraserActive]
    );

    const getActiveTool = useCallback(() => {
      if (isLineActive) return "line";
      if (isRectActive) return "rect";
      if (isCircleActive) return "circle";
      if (isDashedLineActive) return "dashedLine";

      // Треугольники
      if (isTriangleActive) return "triangle";
      if (isIsoscelesTriangleActive) return "isoscelesTriangle";
      if (isEquilateralTriangleActive) return "equilateralTriangle";
      if (isRightTriangleActive) return "rightTriangle";

      // Четырехугольники
      if (isHexagonActive) return "hexagon";
      if (isTrapezoidActive) return "trapezoid";
      if (isIsoscelesTrapezoidActive) return "isoscelesTrapezoid";
      if (isRightTrapezoidActive) return "rightTrapezoid";
      if (isRhombusActive) return "rhombus";
      if (isParallelogramActive) return "parallelogram";

      //3д фигуры
      if (isCubeActive) return "cube";
      if (isRectPrismActive) return "rectPrism";
      if (isTriangularPrismActive) return "triangularPrism";
      if (isTriangularPyramidActive) return "triangularPyramid";
      if (isQuadPyramidActive) return "quadPyramid";
      if (isCylinderActive) return "cylinder";
      if (isConeActive) return "cone";
      if (isHexPyramidActive) return "hexPyramid";
      if (isHexPrismActive) return "hexPrism";

      return isEraserActive ? "eraser" : "brush";
    }, [
      isLineActive,
      isRectActive,
      isCircleActive,
      isDashedLineActive,
      isTriangleActive,
      isIsoscelesTriangleActive,
      isEquilateralTriangleActive,
      isRightTriangleActive,
      isHexagonActive,
      isTrapezoidActive,
      isIsoscelesTrapezoidActive,
      isRightTrapezoidActive,
      isRhombusActive,
      isParallelogramActive,
      isCubeActive,
      isRectPrismActive,
      isTriangularPrismActive,
      isTriangularPyramidActive,
      isQuadPyramidActive,
      isCylinderActive,
      isConeActive,
      isHexPyramidActive,
      isHexPrismActive,
      isEraserActive,
    ]);

    const drawLine = useCallback(
      (ctx, start, end, event) => {
        // Добавляем event в параметры
        ctx.save();

        ctx.globalCompositeOperation = isEraserActive
          ? "destination-out"
          : "source-over";
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = isEraserActive ? "rgba(0,0,0,1)" : color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);

        // Проверяем нажатие Shift в момент события
        const isShiftPressed = event ? event.shiftKey : false;

        if (isShiftPressed) {
          const dx = Math.abs(end.x - start.x);
          const dy = Math.abs(end.y - start.y);

          if (dx > dy) {
            ctx.lineTo(end.x, start.y); // Горизонтальная
          } else {
            ctx.lineTo(start.x, end.y); // Вертикальная
          }
        } else {
          ctx.lineTo(end.x, end.y); // Обычная линия
        }

        ctx.stroke();
        ctx.restore();
      },
      [color, size, isEraserActive, opacity]
    );

    const drawRectangle = useCallback(
      (ctx, start, end, isSquare = false) => {
        ctx.save(); // Сохраняем состояние контекста

        ctx.globalCompositeOperation = isEraserActive
          ? "destination-out"
          : "source-over";
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = isEraserActive ? "rgba(0,0,0,1)" : color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";

        ctx.beginPath();
        if (isSquare) {
          const side = Math.max(
            Math.abs(end.x - start.x),
            Math.abs(end.y - start.y)
          );
          const xDirection = end.x > start.x ? 1 : -1;
          const yDirection = end.y > start.y ? 1 : -1;
          ctx.rect(start.x, start.y, side * xDirection, side * yDirection);
        } else {
          ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
        }
        ctx.stroke();

        ctx.restore(); // Восстанавливаем состояние
      },
      [color, size, isEraserActive, opacity]
    );

    const drawCircle = useCallback(
      (ctx, start, end, isPerfectCircle = false) => {
        ctx.save();

        ctx.globalCompositeOperation = isEraserActive
          ? "destination-out"
          : "source-over";
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = isEraserActive ? "rgba(0,0,0,1)" : color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";

        ctx.beginPath();

        if (isPerfectCircle) {
          // Идеальная окружность от центра (с Shift)
          const radius = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
          );
          ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        } else {
          // Оригинальное поведение для обычной окружности (между двумя точками)
          const radiusX = Math.abs(end.x - start.x) / 2;
          const radiusY = Math.abs(end.y - start.y) / 2;
          const centerX = start.x + (end.x - start.x) / 2;
          const centerY = start.y + (end.y - start.y) / 2;
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        }

        ctx.stroke();
        ctx.restore();
      },
      [color, size, isEraserActive, opacity]
    );

    const drawDashedLine = useCallback(
      (ctx, start, end, event) => {
        // Добавляем event в параметры
        ctx.save();

        ctx.globalCompositeOperation = isEraserActive
          ? "destination-out"
          : "source-over";
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = isEraserActive ? "rgba(0,0,0,1)" : color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";

        // Настройки для прерывистой линии
        const dashLength = size * 3;
        const gapLength = size * 2;
        ctx.setLineDash([dashLength, gapLength]);

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);

        // Проверяем, зажат ли Shift
        const isShiftPressed = event?.shiftKey || false;

        if (isShiftPressed) {
          const dx = Math.abs(end.x - start.x);
          const dy = Math.abs(end.y - start.y);

          if (dx > dy) {
            ctx.lineTo(end.x, start.y); // Горизонтальная линия
          } else {
            ctx.lineTo(start.x, end.y); // Вертикальная линия
          }
        } else {
          ctx.lineTo(end.x, end.y); // Обычная линия
        }

        ctx.stroke();
        ctx.restore();
      },
      [color, size, isEraserActive, opacity]
    );

    // Новая функция для рисования треугольника
    const drawTriangle = useCallback(
      (ctx, start, end, isEquilateral = false) => {
        ctx.save();

        ctx.globalCompositeOperation = isEraserActive
          ? "destination-out"
          : "source-over";
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = isEraserActive ? "rgba(0,0,0,1)" : color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();

        // Определяем направление рисования
        const isRightDirection = end.x > start.x;
        const isDownDirection = end.y > start.y;

        const width = Math.abs(end.x - start.x);
        const height = Math.abs(end.y - start.y);

        // Координаты с учетом направления
        const leftX = isRightDirection ? start.x : end.x;
        const rightX = isRightDirection ? end.x : start.x;
        const topY = isDownDirection ? start.y : end.y;
        const bottomY = isDownDirection ? end.y : start.y;

        if (isEquilateral) {
          // Равносторонний треугольник (опционально)
          const side = Math.max(width, height);
          const h = (side * Math.sqrt(3)) / 2;
          ctx.moveTo(leftX, bottomY);
          ctx.lineTo(rightX, bottomY);
          ctx.lineTo(leftX + side / 2, bottomY - h);
        } else {
          // Зеркальный треугольник (длинная левая сторона)
          const leftOffset = width * 0.75; // 70% влево
          const rightOffset = width * 0.25; // 30% вправо

          // Точки треугольника:
          ctx.moveTo(leftX, bottomY); // Нижний левый угол
          ctx.lineTo(rightX, bottomY); // Нижний правый угол
          ctx.lineTo(leftX + rightOffset, topY); // Верхняя точка смещена вправо
        }

        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      },
      [color, size, isEraserActive, opacity]
    );

    // Новая функция для рисования шестиугольника
    const drawHexagon = useCallback(
      (ctx, start, end, isRegular = false) => {
        ctx.save();

        ctx.globalCompositeOperation = isEraserActive
          ? "destination-out"
          : "source-over";
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = isEraserActive ? "rgba(0,0,0,1)" : color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();

        const centerX = start.x;
        const centerY = start.y;
        const radius = Math.sqrt(
          Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
        );

        // Рисуем перевернутый шестиугольник (поворот на 180 градусов)
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i + Math.PI / 3; // Изменено смещение на +30 градусов
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.closePath();
        ctx.stroke();

        ctx.restore();
      },
      [color, size, isEraserActive, opacity]
    );

    const drawTrapezoid = useCallback(
      (ctx, start, end, isIsosceles = false) => {
        ctx.save();

        ctx.globalCompositeOperation = isEraserActive
          ? "destination-out"
          : "source-over";
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = isEraserActive ? "rgba(0,0,0,1)" : color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();

        // Определяем направление рисования
        const isRightDirection = end.x > start.x;
        const isDownDirection = end.y > start.y;

        const width = Math.abs(end.x - start.x);
        const height = Math.abs(end.y - start.y);

        if (isIsosceles) {
          // Равнобедренная трапеция (с Shift)
          const topWidth = width * 0.5; // Уменьшил верхнее основание до 50%
          const topOffset = (width - topWidth) / 2;

          ctx.moveTo(start.x + topOffset, start.y);
          ctx.lineTo(end.x - topOffset, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.lineTo(start.x, end.y);
        } else {
          // Произвольная трапеция с узким верхним основанием
          const bottomWidth = width * 0.8; // Нижнее основание еще шире (80%)
          const topWidth = width * 0.4; // Верхнее основание уже (40%)

          // Смещения для неравных сторон
          const leftOffset = width * 0.1; // 10% смещение слева
          const rightOffset = width * 0.5; // 50% смещение справа

          // Координаты с учетом направления
          const topLeft = isRightDirection ? start.x : end.x;
          const topRight = isRightDirection ? end.x : start.x;
          const topY = isDownDirection ? start.y : end.y;
          const bottomY = isDownDirection ? end.y : start.y;

          // Рисуем трапецию:
          ctx.moveTo(topLeft + leftOffset, topY); // Верх-лево
          ctx.lineTo(topRight - rightOffset, topY); // Верх-право
          ctx.lineTo(topRight, bottomY); // Низ-право
          ctx.lineTo(topLeft, bottomY); // Низ-лево
        }

        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      },
      [color, size, isEraserActive, opacity]
    );

    // Исправленная функция для рисования ромба
    const drawRhombus = useCallback(
      (ctx, start, end, isSquare = false) => {
        ctx.save();

        ctx.globalCompositeOperation = isEraserActive
          ? "destination-out"
          : "source-over";
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = isEraserActive ? "rgba(0,0,0,1)" : color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();

        const width = Math.abs(end.x - start.x);
        const height = Math.abs(end.y - start.y);
        const centerX = (start.x + end.x) / 2;
        const centerY = (start.y + end.y) / 2;

        if (isSquare) {
          // Квадрат повернутый на 45 градусов
          const side = Math.min(width, height) * Math.sqrt(2);

          ctx.moveTo(centerX, centerY - side / 2);
          ctx.lineTo(centerX + side / 2, centerY);
          ctx.lineTo(centerX, centerY + side / 2);
          ctx.lineTo(centerX - side / 2, centerY);
        } else {
          // Правильный ромб
          const halfWidth = width / 2;
          const halfHeight = height / 2;

          ctx.moveTo(centerX, centerY - halfHeight); // Верхняя точка
          ctx.lineTo(centerX + halfWidth, centerY); // Правая точка
          ctx.lineTo(centerX, centerY + halfHeight); // Нижняя точка
          ctx.lineTo(centerX - halfWidth, centerY); // Левая точка
        }

        ctx.closePath();
        ctx.stroke();

        ctx.restore();
      },
      [color, size, isEraserActive, opacity]
    );
    const drawShape = (ctx, drawFunction) => {
      ctx.save();
      ctx.globalCompositeOperation = isEraserActive
        ? "destination-out"
        : "source-over";
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = isEraserActive ? "rgba(0,0,0,1)" : color;
      ctx.lineWidth = size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      drawFunction();

      ctx.restore();
    };

    const drawIsoscelesTriangle = useCallback(
      (ctx, start, end) => {
        drawShape(ctx, () => {
          ctx.beginPath();
          const height = end.y - start.y;
          const width = end.x - start.x;

          // Вертикально зеркальное отображение (переворачиваем по Y)
          ctx.moveTo(start.x, start.y); // Верхняя точка теперь в start.y
          ctx.lineTo(end.x, start.y); // Вторая точка верхнего основания
          ctx.lineTo(start.x + width / 2, end.y); // Нижняя вершина
          ctx.closePath();
          ctx.stroke();
        });
      },
      [color, size, isEraserActive, opacity]
    );

    const drawEquilateralTriangle = useCallback(
      (ctx, start, end) => {
        drawShape(ctx, () => {
          // Определяем ширину основания
          const width = end.x - start.x;
          // Высота треугольника (по формуле равностороннего)
          const height = (Math.abs(width) * Math.sqrt(3)) / 2;

          // Находим середину основания
          const centerX = start.x + width / 2;

          ctx.beginPath();
          // Начинаем с левой нижней точки
          ctx.moveTo(start.x, start.y);
          // Переходим к правой нижней точке
          ctx.lineTo(end.x, start.y);
          // Вершина сверху (по центру)
          ctx.lineTo(centerX, start.y - height);
          ctx.closePath();
          ctx.stroke();
        });
      },
      [color, size, isEraserActive, opacity]
    );

    const drawRightTriangle = useCallback(
      (ctx, start, end) => {
        drawShape(ctx, () => {
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, start.y);
          ctx.lineTo(start.x, end.y);
          ctx.closePath();
          ctx.stroke();
        });
      },
      [color, size, isEraserActive, opacity]
    );

    const drawIsoscelesTrapezoid = useCallback(
      (ctx, start, end) => {
        drawShape(ctx, () => {
          const width = end.x - start.x;
          const topWidth = width * 0.6;
          const offset = (width - topWidth) / 2;

          ctx.beginPath();
          // Начинаем с нижнего левого угла (отражение)
          ctx.moveTo(start.x, start.y);
          // Переходим к нижнему правому углу
          ctx.lineTo(end.x, start.y);
          // Верхний правый угол (смещённый внутрь)
          ctx.lineTo(end.x - offset, end.y);
          // Верхний левый угол (смещённый внутрь)
          ctx.lineTo(start.x + offset, end.y);
          ctx.closePath();
          ctx.stroke();
        });
      },
      [color, size, isEraserActive, opacity]
    );

    const drawRightTrapezoid = useCallback(
      (ctx, start, end) => {
        drawShape(ctx, () => {
          const topWidth = Math.abs(end.x - start.x) * 0.6; // Ширина верхнего основания (70% от ширины)

          ctx.beginPath();
          // Нижнее основание (теперь большее)
          ctx.moveTo(start.x, start.y); // Левый нижний угол
          ctx.lineTo(end.x, start.y); // Правый нижний угол
          // Верхнее основание (теперь меньшее, смещено вправо)
          ctx.lineTo(end.x - (end.x - start.x - topWidth), end.y); // Правый верхний угол
          ctx.lineTo(start.x, end.y); // Левый верхний угол
          ctx.closePath();
          ctx.stroke();
        });
      },
      [color, size, isEraserActive, opacity]
    );

    const drawParallelogram = useCallback(
      (ctx, start, end) => {
        drawShape(ctx, () => {
          const offset = Math.abs(end.x - start.x) * 0.3;

          ctx.beginPath();
          // Начинаем с правой нижней точки (зеркальное отражение)
          ctx.moveTo(end.x, start.y);
          // Переходим к левой нижней точке
          ctx.lineTo(start.x, start.y);
          // Левая верхняя точка (смещена вправо на offset)
          ctx.lineTo(start.x + offset, end.y);
          // Правая верхняя точка (смещена вправо на offset)
          ctx.lineTo(end.x + offset, end.y);
          ctx.closePath();
          ctx.stroke();
        });
      },
      [color, size, isEraserActive, opacity]
    );

    const drawCube = useCallback(
      (ctx, start, end) => {
        ctx.save();

        ctx.globalCompositeOperation = isEraserActive
          ? "destination-out"
          : "source-over";
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = isEraserActive ? "rgba(0,0,0,1)" : color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const dashLength = size * 3;
        const gapLength = size * 2;

        // Расчет точек для изометрической проекции
        const frontBottomLeft = {
          x: start.x,
          y: start.y,
        };

        const frontBottomRight = {
          x: start.x + 565,
          y: start.y,
        };

        const frontTopRight = {
          x: start.x + 565,
          y: start.y - 540,
        };

        const frontTopLeft = {
          x: start.x,
          y: start.y - 540,
        };

        //Задняя грань
        const backTopRight = {
          x: start.x + 795,
          y: start.y - 675,
        };
        const backTopLeft = {
          x: start.x + 235,
          y: start.y - 675,
        };
        const backBottomLeft = {
          x: start.x + 235,
          y: start.y - 135,
        };
        const backBottomRight = {
          x: start.x + 795,
          y: start.y - 135,
        };

        // Передняя грань
        ctx.beginPath();
        ctx.moveTo(frontBottomLeft.x, frontBottomLeft.y);
        ctx.lineTo(frontBottomRight.x, frontBottomRight.y);

        ctx.moveTo(frontBottomRight.x, frontBottomRight.y);
        ctx.lineTo(frontTopRight.x, frontTopRight.y);

        ctx.moveTo(frontTopRight.x, frontTopRight.y);
        ctx.lineTo(frontTopLeft.x, frontTopLeft.y);

        ctx.moveTo(frontTopLeft.x, frontTopLeft.y);
        ctx.lineTo(frontBottomLeft.x, frontBottomLeft.y);

        //Задняя грань и бока
        ctx.moveTo(frontBottomRight.x, frontBottomRight.y);
        ctx.lineTo(backBottomRight.x, backBottomRight.y);

        ctx.moveTo(backBottomRight.x, backBottomRight.y);
        ctx.lineTo(backTopRight.x, backTopRight.y);

        ctx.moveTo(backTopRight.x, backTopRight.y);
        ctx.lineTo(frontTopRight.x, frontTopRight.y);

        ctx.moveTo(backTopRight.x, backTopRight.y);
        ctx.lineTo(backTopLeft.x, backTopLeft.y);

        ctx.moveTo(backTopLeft.x, backTopLeft.y);
        ctx.lineTo(frontTopLeft.x, frontTopLeft.y);

        ctx.stroke();

        //Дэш линии
        ctx.moveTo(backBottomLeft.x, backBottomLeft.y);
        ctx.setLineDash([dashLength, gapLength]);
        ctx.lineTo(backTopLeft.x, backTopLeft.y);

        ctx.moveTo(backBottomLeft.x, backBottomLeft.y);
        ctx.lineTo(backBottomRight.x, backBottomRight.y);

        ctx.moveTo(backBottomLeft.x, backBottomLeft.y);
        ctx.lineTo(frontBottomLeft.x, frontBottomLeft.y);

        ctx.stroke();
        ctx.restore();
      },
      [color, size, isEraserActive, opacity]
    );

    const drawRectPrism = useCallback(
      (ctx, start, end) => {
        ctx.save();

        ctx.globalCompositeOperation = isEraserActive
          ? "destination-out"
          : "source-over";
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = isEraserActive ? "rgba(0,0,0,1)" : color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const dashLength = size * 3;
        const gapLength = size * 2;
        const sizeRect = 280;

        // Расчет точек для изометрической проекции
        const frontBottomLeft = {
          x: start.x,
          y: start.y,
        };

        const frontBottomRight = {
          x: start.x + 565 + sizeRect,
          y: start.y,
        };

        const frontTopRight = {
          x: start.x + 565 + sizeRect,
          y: start.y - 540,
        };

        const frontTopLeft = {
          x: start.x,
          y: start.y - 540,
        };

        //Задняя грань
        const backBottomRight = {
          x: start.x + 795 + sizeRect,
          y: start.y - 135,
        };
        const backTopRight = {
          x: start.x + 795 + sizeRect,
          y: start.y - 675,
        };
        const backTopLeft = {
          x: start.x + 235,
          y: start.y - 675,
        };
        const backBottomLeft = {
          x: start.x + 235,
          y: start.y - 135,
        };

        // Передняя грань
        ctx.beginPath();
        ctx.moveTo(frontBottomLeft.x, frontBottomLeft.y);
        ctx.lineTo(frontBottomRight.x, frontBottomRight.y);

        ctx.moveTo(frontBottomRight.x, frontBottomRight.y);
        ctx.lineTo(frontTopRight.x, frontTopRight.y);

        ctx.moveTo(frontTopRight.x, frontTopRight.y);
        ctx.lineTo(frontTopLeft.x, frontTopLeft.y);

        ctx.moveTo(frontTopLeft.x, frontTopLeft.y);
        ctx.lineTo(frontBottomLeft.x, frontBottomLeft.y);

        //Задняя грань и бока
        ctx.moveTo(frontBottomRight.x, frontBottomRight.y);
        ctx.lineTo(backBottomRight.x, backBottomRight.y);

        ctx.moveTo(backBottomRight.x, backBottomRight.y);
        ctx.lineTo(backTopRight.x, backTopRight.y);

        ctx.moveTo(backTopRight.x, backTopRight.y);
        ctx.lineTo(frontTopRight.x, frontTopRight.y);

        ctx.moveTo(backTopRight.x, backTopRight.y);
        ctx.lineTo(backTopLeft.x, backTopLeft.y);

        ctx.moveTo(backTopLeft.x, backTopLeft.y);
        ctx.lineTo(frontTopLeft.x, frontTopLeft.y);

        ctx.stroke();

        //Дэш линии
        ctx.moveTo(backBottomLeft.x, backBottomLeft.y);
        ctx.setLineDash([dashLength, gapLength]);
        ctx.lineTo(backTopLeft.x, backTopLeft.y);

        ctx.moveTo(backBottomLeft.x, backBottomLeft.y);
        ctx.lineTo(backBottomRight.x, backBottomRight.y);

        ctx.moveTo(backBottomLeft.x, backBottomLeft.y);
        ctx.lineTo(frontBottomLeft.x, frontBottomLeft.y);

        ctx.stroke();
        ctx.restore();
      },
      [color, size, isEraserActive, opacity]
    );

    const drawTriangularPrism = useCallback(
      (ctx, start, end) => {
        ctx.save();

        ctx.globalCompositeOperation = isEraserActive
          ? "destination-out"
          : "source-over";
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = isEraserActive ? "rgba(0,0,0,1)" : color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const topSize = 450;
        const dashLength = size * 3;
        const gapLength = size * 2;

        const oneBottom = {
          x: start.x,
          y: start.y,
        };
        const twoBottom = {
          x: start.x + 565,
          y: start.y,
        };
        const threeBottom = {
          x: start.x + 190,
          y: start.y + 180,
        };
        const oneTop = {
          x: start.x,
          y: start.y - topSize,
        };
        const twoTop = {
          x: start.x + 565,
          y: start.y - topSize,
        };
        const threeTop = {
          x: start.x + 190,
          y: start.y + 180 - topSize,
        };

        ctx.beginPath();

        ctx.moveTo(twoBottom.x, twoBottom.y);
        ctx.lineTo(threeBottom.x, threeBottom.y);

        ctx.moveTo(threeBottom.x, threeBottom.y);
        ctx.lineTo(oneBottom.x, oneBottom.y);

        ctx.moveTo(oneTop.x, oneTop.y);
        ctx.lineTo(twoTop.x, twoTop.y);

        ctx.moveTo(twoTop.x, twoTop.y);
        ctx.lineTo(threeTop.x, threeTop.y);

        ctx.moveTo(threeTop.x, threeTop.y);
        ctx.lineTo(oneTop.x, oneTop.y);

        ctx.moveTo(oneBottom.x, oneBottom.y);
        ctx.lineTo(oneTop.x, oneTop.y);

        ctx.moveTo(twoBottom.x, twoBottom.y);
        ctx.lineTo(twoTop.x, twoTop.y);

        ctx.moveTo(threeBottom.x, threeBottom.y);
        ctx.lineTo(threeTop.x, threeTop.y);

        ctx.stroke();

        ctx.setLineDash([dashLength, gapLength]);
        ctx.moveTo(oneBottom.x, oneBottom.y);
        ctx.lineTo(twoBottom.x, twoBottom.y);

        ctx.stroke();
        ctx.restore();
      },
      [color, size, isEraserActive, opacity]
    );

    const drawTriangularPyramid = useCallback(
      (ctx, start, end) => {
        ctx.save();

        ctx.globalCompositeOperation = isEraserActive
          ? "destination-out"
          : "source-over";
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = isEraserActive ? "rgba(0,0,0,1)" : color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const dashLength = size * 3;
        const gapLength = size * 2;

        const oneBottom = {
          x: start.x,
          y: start.y,
        };
        const twoBottom = {
          x: start.x + 565,
          y: start.y,
        };
        const threeBottom = {
          x: start.x + 190,
          y: start.y + 180,
        };
        const oneTop = {
          x: start.x + 265,
          y: start.y + 90 - 495,
        };

        ctx.beginPath();

        ctx.moveTo(twoBottom.x, twoBottom.y);
        ctx.lineTo(threeBottom.x, threeBottom.y);

        ctx.moveTo(threeBottom.x, threeBottom.y);
        ctx.lineTo(oneBottom.x, oneBottom.y);

        ctx.moveTo(oneTop.x, oneTop.y);
        ctx.lineTo(oneBottom.x, oneBottom.y);
        ctx.moveTo(oneTop.x, oneTop.y);
        ctx.lineTo(twoBottom.x, twoBottom.y);
        ctx.moveTo(oneTop.x, oneTop.y);
        ctx.lineTo(threeBottom.x, threeBottom.y);

        ctx.stroke();

        ctx.setLineDash([dashLength, gapLength]);
        ctx.moveTo(oneBottom.x, oneBottom.y);
        ctx.lineTo(twoBottom.x, twoBottom.y);
        ctx.stroke();
        ctx.restore();
      },
      [color, size, isEraserActive, opacity]
    );

    const drawQuadPyramid = useCallback(
      (ctx, start, end) => {
        ctx.save();

        ctx.globalCompositeOperation = isEraserActive
          ? "destination-out"
          : "source-over";
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = isEraserActive ? "rgba(0,0,0,1)" : color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const dashLength = size * 3;
        const gapLength = size * 2;

        const oneBottom = {
          x: start.x,
          y: start.y,
        };
        const twoBottom = {
          x: start.x + 565,
          y: start.y,
        };
        const threeBottom = {
          x: start.x + 795,
          y: start.y - 135,
        };
        const fourBottom = {
          x: start.x + 235,
          y: start.y - 135,
        };
        const oneTop = {
          x: start.x + 400,
          y: start.y - 630,
        };

        ctx.beginPath();

        ctx.moveTo(oneBottom.x, oneBottom.y);
        ctx.lineTo(twoBottom.x, twoBottom.y);

        ctx.moveTo(twoBottom.x, twoBottom.y);
        ctx.lineTo(threeBottom.x, threeBottom.y);

        ctx.moveTo(oneTop.x, oneTop.y);
        ctx.lineTo(oneBottom.x, oneBottom.y);
        ctx.moveTo(oneTop.x, oneTop.y);
        ctx.lineTo(twoBottom.x, twoBottom.y);
        ctx.moveTo(oneTop.x, oneTop.y);
        ctx.lineTo(threeBottom.x, threeBottom.y);

        ctx.stroke();

        ctx.setLineDash([dashLength, gapLength]);
        ctx.moveTo(oneTop.x, oneTop.y);
        ctx.lineTo(fourBottom.x, fourBottom.y);

        ctx.moveTo(threeBottom.x, threeBottom.y);
        ctx.lineTo(fourBottom.x, fourBottom.y);

        ctx.moveTo(fourBottom.x, fourBottom.y);
        ctx.lineTo(oneBottom.x, oneBottom.y);
        ctx.stroke();
        ctx.restore();
      },
      [color, size, isEraserActive, opacity]
    );

    const drawCylinder = useCallback(
      (ctx, start, end) => {
        ctx.save();

        ctx.globalCompositeOperation = isEraserActive
          ? "destination-out"
          : "source-over";
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = isEraserActive ? "rgba(0,0,0,1)" : color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const oneBottom = {
          x: start.x,
          y: start.y,
        };
        const oneTop = {
          x: start.x,
          y: start.y - 547,
        };

        ctx.beginPath();

        const radiusX = 565 / 2;
        const radiusY = 130;
        const centerX = start.x + 565 / 2;
        const centerY = start.y;
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);

        ctx.ellipse(
          centerX,
          centerY - 547,
          radiusX,
          radiusY,
          0,
          0,
          2 * Math.PI
        );

        ctx.moveTo(oneTop.x, oneTop.y);
        ctx.lineTo(oneBottom.x, oneBottom.y);

        ctx.stroke();
        ctx.restore();
      },
      [color, size, isEraserActive, opacity]
    );

    const drawCone = useCallback(
      (ctx, start, end) => {
        ctx.save();

        ctx.globalCompositeOperation = isEraserActive
          ? "destination-out"
          : "source-over";
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = isEraserActive ? "rgba(0,0,0,1)" : color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const oneBottom = {
          x: start.x,
          y: start.y,
        };
        const twoBottom = {
          x: start.x + 565,
          y: start.y,
        };
        const oneTop = {
          x: start.x + 565 / 2,
          y: start.y - 547,
        };

        ctx.beginPath();

        const radiusX = 565 / 2;
        const radiusY = 60;
        const centerX = start.x + 565 / 2;
        const centerY = start.y;
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);

        ctx.moveTo(oneTop.x, oneTop.y);
        ctx.lineTo(oneBottom.x, oneBottom.y);
        ctx.moveTo(oneTop.x, oneTop.y);
        ctx.lineTo(twoBottom.x, twoBottom.y);

        ctx.stroke();
        ctx.restore();
      },
      [color, size, isEraserActive, opacity]
    );

    const drawHexPyramid = useCallback(
      (ctx, start, end) => {
        ctx.save();

        ctx.globalCompositeOperation = isEraserActive
          ? "destination-out"
          : "source-over";
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = isEraserActive ? "rgba(0,0,0,1)" : color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const dashLength = size * 3;
        const gapLength = size * 2;

        const oneBottom = {
          x: start.x,
          y: start.y,
        };
        const twoBottom = {
          x: start.x + 565,
          y: start.y,
        };
        const threeBottom = {
          x: start.x + 795,
          y: start.y - 135,
        };
        const fourBottom = {
          x: start.x + 660,
          y: start.y - 270,
        };
        const fiveBottom = {
          x: start.x + 95,
          y: start.y - 270,
        };
        const sixBottom = {
          x: start.x - 135,
          y: start.y - 135,
        };
        const oneTop = {
          x: start.x + 330,
          y: start.y - 700,
        };
        ctx.beginPath();

        ctx.moveTo(oneBottom.x, oneBottom.y);
        ctx.lineTo(twoBottom.x, twoBottom.y);

        ctx.moveTo(twoBottom.x, twoBottom.y);
        ctx.lineTo(threeBottom.x, threeBottom.y);

        ctx.moveTo(sixBottom.x, sixBottom.y);
        ctx.lineTo(oneBottom.x, oneBottom.y);

        ctx.moveTo(oneTop.x, oneTop.y);
        ctx.lineTo(oneBottom.x, oneBottom.y);
        ctx.moveTo(oneTop.x, oneTop.y);
        ctx.lineTo(twoBottom.x, twoBottom.y);
        ctx.moveTo(oneTop.x, oneTop.y);
        ctx.lineTo(threeBottom.x, threeBottom.y);
        ctx.moveTo(oneTop.x, oneTop.y);
        ctx.lineTo(sixBottom.x, sixBottom.y);

        ctx.stroke();

        ctx.setLineDash([dashLength, gapLength]);
        ctx.moveTo(threeBottom.x, threeBottom.y);
        ctx.lineTo(fourBottom.x, fourBottom.y);

        ctx.moveTo(fourBottom.x, fourBottom.y);
        ctx.lineTo(fiveBottom.x, fiveBottom.y);

        ctx.moveTo(fiveBottom.x, fiveBottom.y);
        ctx.lineTo(sixBottom.x, sixBottom.y);

        ctx.moveTo(oneTop.x, oneTop.y);
        ctx.lineTo(fourBottom.x, fourBottom.y);
        ctx.moveTo(oneTop.x, oneTop.y);
        ctx.lineTo(fiveBottom.x, fiveBottom.y);
        ctx.stroke();
        ctx.restore();
      },
      [color, size, isEraserActive, opacity]
    );

    const drawHexPrism = useCallback(
      (ctx, start, end) => {
        ctx.save();

        ctx.globalCompositeOperation = isEraserActive
          ? "destination-out"
          : "source-over";
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = isEraserActive ? "rgba(0,0,0,1)" : color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const dashLength = size * 3;
        const gapLength = size * 2;
        const topSize = 495;

        const oneBottom = {
          x: start.x,
          y: start.y,
        };
        const twoBottom = {
          x: start.x + 565,
          y: start.y,
        };
        const threeBottom = {
          x: start.x + 795,
          y: start.y - 135,
        };
        const fourBottom = {
          x: start.x + 660,
          y: start.y - 270,
        };
        const fiveBottom = {
          x: start.x + 95,
          y: start.y - 270,
        };
        const sixBottom = {
          x: start.x - 135,
          y: start.y - 135,
        };
        const oneTop = {
          x: start.x,
          y: start.y - topSize,
        };
        const twoTop = {
          x: start.x + 565,
          y: start.y - topSize,
        };
        const threeTop = {
          x: start.x + 795,
          y: start.y - 135 - topSize,
        };
        const fourTop = {
          x: start.x + 660,
          y: start.y - 270 - topSize,
        };
        const fiveTop = {
          x: start.x + 95,
          y: start.y - 270 - topSize,
        };
        const sixTop = {
          x: start.x - 135,
          y: start.y - 135 - topSize,
        };
        ctx.beginPath();

        ctx.moveTo(oneBottom.x, oneBottom.y);
        ctx.lineTo(twoBottom.x, twoBottom.y);

        ctx.moveTo(twoBottom.x, twoBottom.y);
        ctx.lineTo(threeBottom.x, threeBottom.y);

        ctx.moveTo(sixBottom.x, sixBottom.y);
        ctx.lineTo(oneBottom.x, oneBottom.y);

        //верх
        ctx.moveTo(oneTop.x, oneTop.y);
        ctx.lineTo(twoTop.x, twoTop.y);

        ctx.moveTo(twoTop.x, twoTop.y);
        ctx.lineTo(threeTop.x, threeTop.y);

        ctx.moveTo(threeTop.x, threeTop.y);
        ctx.lineTo(fourTop.x, fourTop.y);

        ctx.moveTo(fourTop.x, fourTop.y);
        ctx.lineTo(fiveTop.x, fiveTop.y);

        ctx.moveTo(fiveTop.x, fiveTop.y);
        ctx.lineTo(sixTop.x, sixTop.y);

        ctx.moveTo(sixTop.x, sixTop.y);
        ctx.lineTo(oneTop.x, oneTop.y);

        ctx.moveTo(oneBottom.x, oneBottom.y);
        ctx.lineTo(oneTop.x, oneTop.y);

        ctx.moveTo(twoBottom.x, twoBottom.y);
        ctx.lineTo(twoTop.x, twoTop.y);

        ctx.moveTo(threeBottom.x, threeBottom.y);
        ctx.lineTo(threeTop.x, threeTop.y);

        ctx.moveTo(sixBottom.x, sixBottom.y);
        ctx.lineTo(sixTop.x, sixTop.y);

        ctx.stroke();

        ctx.setLineDash([dashLength, gapLength]);
        ctx.moveTo(threeBottom.x, threeBottom.y);
        ctx.lineTo(fourBottom.x, fourBottom.y);

        ctx.moveTo(fourBottom.x, fourBottom.y);
        ctx.lineTo(fiveBottom.x, fiveBottom.y);

        ctx.moveTo(fiveBottom.x, fiveBottom.y);
        ctx.lineTo(sixBottom.x, sixBottom.y);

        ctx.moveTo(fourBottom.x, fourBottom.y);
        ctx.lineTo(fourTop.x, fourTop.y);
        ctx.moveTo(fiveBottom.x, fiveBottom.y);
        ctx.lineTo(fiveTop.x, fiveTop.y);

        ctx.stroke();
        ctx.restore();
      },
      [color, size, isEraserActive, opacity]
    );

    const startDrawing = useCallback(
      (e) => {
        if (isInteractingRef?.current || e.target !== canvasRef.current) return;

        isDrawing.current = true;
        const pos = getPenPosition(e, canvasRef.current);
        lastPos.current = pos;
        pointsRef.current = [pos];

        if (getActiveTool() !== "brush" && getActiveTool() !== "eraser") {
          if (e.pointerType === "touch") {
            return;
          }
          startPointRef.current = pos;
        }

        // Сохраняем состояние перед любым рисованием
        saveCanvasState();

        // Для кисти/ластика рисуем первую точку
        if (getActiveTool() === "brush" || getActiveTool() === "eraser") {
          if (e.pointerType === "pen") {
            const ctx = canvasRef.current.getContext("2d");
            drawDot(ctx, pos.x, pos.y, size);
          }
        }

        document.addEventListener("pointermove", continueDrawing);
        document.addEventListener("pointerup", stopDrawing);
        document.addEventListener("pointerout", stopDrawing);
      },
      [
        getPenPosition,
        size,
        saveCanvasState,
        isInteractingRef,
        getActiveTool,
        drawDot,
      ]
    );

    const continueDrawing = useCallback(
      (e) => {
        if (!isDrawing.current) return;

        e.preventDefault();
        e.stopPropagation();

        const pos = getPenPosition(e, canvasRef.current);
        const ctx = canvasRef.current.getContext("2d");
        const tool = getActiveTool();

        restoreCanvasState();

        if (tool === "brush" || tool === "eraser") {
          if (e.pointerType === "pen") {
            pointsRef.current.push(pos);
            drawSmoothLine(ctx, pointsRef.current, size);
          }
        } else {
          // Обработка всех инструментов-фигур
          switch (tool) {
            case "line":
              drawLine(ctx, startPointRef.current, pos, e);
              break;
            case "rect":
              drawRectangle(ctx, startPointRef.current, pos, e.shiftKey);
              break;
            case "circle":
              drawCircle(ctx, startPointRef.current, pos, e.shiftKey);
              break;
            case "dashedLine":
              drawDashedLine(ctx, startPointRef.current, pos, e);
              break;

            // Треугольники
            case "triangle":
              drawTriangle(ctx, startPointRef.current, pos, e.shiftKey);
              break;
            case "isoscelesTriangle":
              drawIsoscelesTriangle(ctx, startPointRef.current, pos);
              break;
            case "equilateralTriangle":
              drawEquilateralTriangle(ctx, startPointRef.current, pos);
              break;
            case "rightTriangle":
              drawRightTriangle(ctx, startPointRef.current, pos);
              break;

            // Четырехугольники
            case "hexagon":
              drawHexagon(ctx, startPointRef.current, pos, e.shiftKey);
              break;
            case "trapezoid":
              drawTrapezoid(ctx, startPointRef.current, pos, e.shiftKey);
              break;
            case "isoscelesTrapezoid":
              drawIsoscelesTrapezoid(ctx, startPointRef.current, pos);
              break;
            case "rightTrapezoid":
              drawRightTrapezoid(ctx, startPointRef.current, pos);
              break;
            case "rhombus":
              drawRhombus(ctx, startPointRef.current, pos, e.shiftKey);
              break;
            case "parallelogram":
              drawParallelogram(ctx, startPointRef.current, pos);
              break;

            //3д фигуры
            case "cube":
              drawCube(ctx, startPointRef.current, pos, e.shiftKey);
              break;
            case "rectPrism":
              drawRectPrism(ctx, startPointRef.current, pos, e.shiftKey);
              break;
            case "triangularPrism":
              drawTriangularPrism(ctx, startPointRef.current, pos, e.shiftKey);
              break;
            case "triangularPyramid":
              drawTriangularPyramid(
                ctx,
                startPointRef.current,
                pos,
                e.shiftKey
              );
              break;
            case "quadPyramid":
              drawQuadPyramid(ctx, startPointRef.current, pos, e.shiftKey);
              break;
            case "cylinder":
              drawCylinder(ctx, startPointRef.current, pos, e.shiftKey);
              break;
            case "cone":
              drawCone(ctx, startPointRef.current, pos, e.shiftKey);
              break;
            case "hexPyramid":
              drawHexPyramid(ctx, startPointRef.current, pos, e.shiftKey);
              break;
            case "hexPrism":
              drawHexPrism(ctx, startPointRef.current, pos, e.shiftKey);
              break;
          }
        }

        lastPos.current = pos;
      },
      [
        getPenPosition,
        restoreCanvasState,
        drawSmoothLine,
        size,
        getActiveTool,
        drawLine,
        drawRectangle,
        drawCircle,
        drawDashedLine,
        drawTriangle,
        drawIsoscelesTriangle,
        drawEquilateralTriangle,
        drawRightTriangle,
        drawHexagon,
        drawTrapezoid,
        drawIsoscelesTrapezoid,
        drawRightTrapezoid,
        drawRhombus,
        drawParallelogram,
        drawCube,
        drawRectPrism,
        drawTriangularPrism,
        drawTriangularPyramid,
        drawQuadPyramid,
        drawCylinder,
        drawCone,
        drawHexPyramid,
        drawHexPrism,
      ]
    );

    const stopDrawing = useCallback(() => {
      if (!isDrawing.current) return;

      isDrawing.current = false;
      lastPos.current = null;
      pointsRef.current = [];
      startPointRef.current = null;
      saveStateToHistory();

      document.removeEventListener("pointermove", continueDrawing);
      document.removeEventListener("pointerup", stopDrawing);
      document.removeEventListener("pointerout", stopDrawing);
    }, [continueDrawing]);

    const updateCursorPosition = useCallback((e) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const pos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        visible: e.pointerType === "pen",
      };

      setCursorPos(pos);
    }, []);

    useEffect(() => {
      updateCanvasRect();
    }, [scrollOffset, updateCanvasRect]);

    useEffect(() => {
      brushCacheRef.current = {};
    }, [isEraserActive, color]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      // Очищаем холст прозрачным цветом
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      canvas.style.imageRendering = "optimizeQuality";

      initSavedCanvas();
      updateCanvasRect();

      const handleWheel = (e) => {
        if (e.ctrlKey) {
          e.preventDefault();
          const delta = Math.sign(e.deltaY) > 0 ? -1 : 1;
          const newSize = Math.max(1, Math.min(100, size + delta));
          if (onSizeChange) onSizeChange(newSize);
        }
      };

      window.addEventListener("resize", updateCanvasRect);
      canvas.addEventListener("pointerdown", startDrawing);
      canvas.addEventListener("pointermove", updateCursorPosition);
      canvas.addEventListener("wheel", handleWheel, { passive: false });

      for (let i = 1; i <= 100; i += 5) {
        createBrush(i);
      }

      return () => {
        window.removeEventListener("resize", updateCanvasRect);
        canvas.removeEventListener("pointerdown", startDrawing);
        canvas.removeEventListener("pointermove", updateCursorPosition);
        canvas.removeEventListener("wheel", handleWheel);

        document.removeEventListener("pointermove", continueDrawing);
        document.removeEventListener("pointerup", stopDrawing);
        document.removeEventListener("pointerout", stopDrawing);
      };
    }, [
      color,
      size,
      isEraserActive,
      isLineActive,
      isRectActive,
      isCircleActive,
      onSizeChange,
      initSavedCanvas,
      updateCanvasRect,
      startDrawing,
      continueDrawing,
      stopDrawing,
      updateCursorPosition,
      createBrush,
      isInteractingRef,
    ]);

    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          background: "transparent",
          zIndex: 30,
          pointerEvents: pointerEvents,
          transform: `translateY(${-scrollOffset}px)`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={2400}
          height={4500}
          style={{
            border: "1px solid #ddd",
            touchAction: "none",
            width: "100%",
            height: "100%",
            display: "block",
            zIndex: 1000,
            pointerEvents: pointerEvents,
          }}
        />
        {cursorPos.visible && (
          <div
            ref={cursorRef}
            style={{
              position: "absolute",
              left: `${cursorPos.x}px`,
              top: `${cursorPos.y + scrollOffset}px`,
              width: `${isEraserActive ? size * 1.2 : size}px`,
              height: `${isEraserActive ? size * 1.2 : size}px`,
              borderRadius: isEraserActive ? "2px" : "50%",
              border: `1px solid ${isEraserActive ? "black" : color}`,
              backgroundColor: isEraserActive
                ? "rgba(0,0,0,0.2)"
                : "transparent",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              boxSizing: "border-box",
              zIndex: 1,
              opacity: 0.7,
            }}
          />
        )}
      </div>
    );
  }
);

BrushTool.displayName = "BrushTool";

export default BrushTool;
