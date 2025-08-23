"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Download, Loader2 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Установка пути к worker'у
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export function PdfViewer({ pdfUrl }: { pdfUrl: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const isMounted = useRef(false);

  // Загрузка PDF документа
  useEffect(() => {
    isMounted.current = true;

    const loadPdf = async () => {
      try {
        setIsLoading(true);
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;

        if (!isMounted.current) return;

        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        await renderPage(pdf, currentPage);
      } catch (error) {
        if (isMounted.current) {
          console.error("Error loading PDF:", error);
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted.current = false;
      if (pdfRef.current) {
        pdfRef.current.destroy();
      }
    };
  }, [pdfUrl]);

  // Рендеринг страницы
  const renderPage = async (
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNum: number
  ) => {
    if (!canvasRef.current || !isMounted.current) return;

    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) return;

      // Устанавливаем размеры canvas
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Очищаем canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Рендерим страницу
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
    } catch (error) {
      if (isMounted.current) {
        console.error("Error rendering page:", error);
      }
    }
  };

  // Обработчик изменения страницы
  useEffect(() => {
    if (pdfRef.current && currentPage && isMounted.current) {
      renderPage(pdfRef.current, currentPage);
    }
  }, [currentPage]);

  const goToPrevPage = () => currentPage > 1 && setCurrentPage((p) => p - 1);
  const goToNextPage = () =>
    numPages && currentPage < numPages && setCurrentPage((p) => p + 1);

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <canvas ref={canvasRef} className="w-full" />
        )}

        {numPages && numPages > 1 && (
          <div className="flex items-center justify-center gap-4 p-2 bg-white">
            <Button
              variant="outline"
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
            >
              Назад
            </Button>
            <span className="text-sm">
              Страница {currentPage} из {numPages}
            </span>
            <Button
              variant="outline"
              onClick={goToNextPage}
              disabled={currentPage >= numPages}
            >
              Вперед
            </Button>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <a
          href={pdfUrl}
          download
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <Download className="h-4 w-4" />
          Скачать PDF
        </a>
      </div>
    </div>
  );
}
