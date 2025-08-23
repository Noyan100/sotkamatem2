"use client";

import { useEffect, useState } from "react";
import { VKVideoPlayer } from "./VKVideoPlayer";
import { Skeleton } from "../../components/ui/skeleton";
import { ManageLessonAccess } from "./ManageLessonAccess";
import { PdfViewer } from "./PdfViewer";
import { Button } from "../../components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function AdminLessonsList() {
  const [lessons, setLessons] = useState<
    {
      id: number;
      title: string;
      description?: string;
      vkVideoUrl: string;
      pdfUrl?: string;
      createdAt: Date;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPdfs, setExpandedPdfs] = useState<Record<number, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 3;

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/user/lessons?page=${currentPage}&limit=${itemsPerPage}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch lessons");
        }

        const data = await res.json();
        setLessons(data.lessons);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (err) {
        console.error("Error fetching lessons:", err);
        setError("Не удалось загрузить список лекций");
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [currentPage]);

  const togglePdf = (lessonId: number) => {
    setExpandedPdfs((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId],
    }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedPdfs({});
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(itemsPerPage)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-[500px] w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="text-center py-8">
        <p>Нет доступных видео-лекций</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 mx-auto bg-white p-8 rounded">
      {lessons.map((lesson) => (
        <div key={lesson.id} className="space-y-4">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold">{lesson.title}</h2>
            <ManageLessonAccess
              lesson={{
                id: lesson.id,
                title: lesson.title,
                description: lesson.description ?? "",
                vkVideoUrl: lesson.vkVideoUrl,
                pdfUrl: lesson.pdfUrl ?? null,
              }}
              onUpdate={() => {}}
            />
          </div>

          {lesson.description && (
            <p className="text-gray-600">{lesson.description}</p>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Видео лекции</h3>
              <div className="max-w-5xl border rounded-lg overflow-hidden">
                <VKVideoPlayer
                  url={lesson.vkVideoUrl}
                  width="100%"
                  height={575}
                  className="w-full"
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Добавлено: {new Date(lesson.createdAt).toLocaleDateString()}
            </p>

            {lesson.pdfUrl && (
              <div>
                <Button
                  variant="white"
                  className="flex items-center gap-2 px-0 hover:bg-transparent"
                  onClick={() => togglePdf(lesson.id)}
                >
                  {expandedPdfs[lesson.id] ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      <span>Скрыть PDF</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      <span>Посмотреть PDF</span>
                    </>
                  )}
                </Button>

                {expandedPdfs[lesson.id] && (
                  <div className="mt-4 rounded-lg overflow-hidden">
                    <PdfViewer pdfUrl={lesson.pdfUrl} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) handlePageChange(currentPage - 1);
                  }}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(page);
                      }}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages)
                      handlePageChange(currentPage + 1);
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
