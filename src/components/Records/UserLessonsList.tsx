"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { VKVideoPlayer } from "./VKVideoPlayer";
import { Skeleton } from "../ui/skeleton";
import { PdfViewer } from "./PdfViewer";
import { Button } from "../ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function UserLessonsList() {
  const { data: session } = useSession();
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
    if (!session?.user?.id) return;

    const fetchLessons = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/user/lessons?userId=${session.user.id}&page=${currentPage}&limit=${itemsPerPage}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch lessons");
        }

        const data = await res.json();
        setLessons(data.lessons);
        // Ключевое исправление - правильный путь к totalPages
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (err) {
        console.error("Error fetching lessons:", err);
        setError("Не удалось загрузить список лекций");
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [session?.user?.id, currentPage]);

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

  // Добавим console.log для отладки
  console.log("Lessons:", lessons);
  console.log("Total pages:", totalPages);
  console.log("Current page:", currentPage);

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
        <p>У вас нет доступа ни к одной видео-лекции</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 mx-auto bg-white p-8 rounded">
      {lessons.map((lesson) => (
        <div key={lesson.id} className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-bold">{lesson.title}</h2>
            {lesson.description && (
              <p className="text-gray-600">{lesson.description}</p>
            )}
            <div className="max-w-5xl border rounded-lg overflow-hidden flex items-center justify-center">
              <VKVideoPlayer
                url={lesson.vkVideoUrl}
                width="100%"
                height={575}
                className="w-full"
              />
            </div>
          </div>

          {lesson.pdfUrl && (
            <div className="">
              <Button
                variant="white"
                className="flex items-center gap-2"
                onClick={() => togglePdf(lesson.id)}
              >
                {expandedPdfs[lesson.id] ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Скрыть PDF
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Посмотреть PDF
                  </>
                )}
              </Button>

              {expandedPdfs[lesson.id] && (
                <div className="mt-4">
                  <PdfViewer pdfUrl={lesson.pdfUrl} />
                </div>
              )}
            </div>
          )}
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
